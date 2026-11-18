"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublic } from "@/lib/revalidate";
import { z } from "zod";
import { db } from "@/lib/db";
import { ActionError, actionMaster, actionStaff, run } from "@/lib/auth";
import { audit, notifyCourseStudents } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { parseLocalInput } from "@/lib/time";
import { deleteObject } from "@/lib/storage";
import { buildAttendanceData, buildCourseSummaryData, buildGradesData, saveReport } from "@/lib/reports";
import { sessionEnd } from "@/lib/access";

const courseSchema = z.object({
  title: z.string().trim().min(3, "Course title is required.").max(120),
  subtitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(8000).optional(),
  level: z.enum(["BASICS", "ADVANCED"]),
  track: z.string().trim().min(1).max(40),
  batchLabel: z.string().trim().max(60).optional(),
  price: z.coerce.number().int().min(0, "Price can't be negative.").max(1_000_000),
  coverKey: z.string().nullable().optional(),
  introVideoUrl: z.string().trim().max(500).optional(),
  highlights: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ENDED"]).default("DRAFT"),
  enrollmentOpen: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prerequisiteId: z.string().nullable().optional(),
  whatsappGroupUrl: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "course";
  let slug = base;
  let i = 2;
  while (await db.course.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) slug = `${base}-${i++}`;
  return slug;
}

function courseData(d: z.infer<typeof courseSchema>) {
  if (d.coverKey && !d.coverKey.startsWith("public/covers/")) throw new ActionError("Invalid cover image.");
  return {
    title: d.title,
    subtitle: d.subtitle || null,
    description: d.description ?? "",
    level: d.level,
    track: d.track,
    batchLabel: d.batchLabel || null,
    price: d.price,
    coverKey: d.coverKey ?? null,
    introVideoUrl: d.introVideoUrl || null,
    highlights: d.highlights,
    status: d.status,
    enrollmentOpen: d.enrollmentOpen,
    startDate: parseLocalInput(d.startDate ? `${d.startDate}T00:00` : null),
    endDate: parseLocalInput(d.endDate ? `${d.endDate}T23:59` : null),
    prerequisiteId: d.prerequisiteId || null,
    whatsappGroupUrl: d.whatsappGroupUrl || null,
    sortOrder: d.sortOrder,
  };
}

export async function createCourseAction(input: z.input<typeof courseSchema>) {
  return run(async () => {
    const me = await actionStaff("courses");
    const d = courseSchema.parse(input);
    const course = await db.course.create({ data: { ...courseData(d), slug: await uniqueSlug(d.title) } });
    await audit(me, "course.created", course.title);
    revalidatePublic();
    revalidatePath("/admin/courses");
    return course.id;
  }, "Course created");
}

export async function updateCourseAction(id: string, input: z.input<typeof courseSchema>) {
  return run(async () => {
    const me = await actionStaff("courses");
    const d = courseSchema.parse(input);
    if (d.prerequisiteId === id) throw new ActionError("A course can't be its own prerequisite.");
    const before = await db.course.findUniqueOrThrow({ where: { id } });
    if (before.status === "ARCHIVED") throw new ActionError("This course is archived.");
    const data = courseData(d);
    const course = await db.course.update({ where: { id }, data: { ...data, slug: before.title !== d.title ? await uniqueSlug(d.title, id) : before.slug } });
    if (before.coverKey && before.coverKey !== data.coverKey) await deleteObject(before.coverKey);
    await audit(me, "course.updated", course.title);
    revalidatePublic();
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}`, "layout");
    revalidatePath("/courses");
  }, "Course saved");
}

export async function deleteCourseAction(id: string) {
  return run(async () => {
    const me = await actionMaster();
    const c = await db.course.findUniqueOrThrow({ where: { id }, include: { resources: true } });
    for (const r of c.resources) await deleteObject(r.storageKey);
    await deleteObject(c.coverKey);
    await db.course.delete({ where: { id } });
    await audit(me, "course.deleted", c.title);
    revalidatePublic();
    revalidatePath("/admin/courses");
  }, "Course deleted");
}

/**
 * End-of-course cleanup: freezes final reports, then deletes the accounts of students
 * who have no other active enrollment. Students still enrolled elsewhere keep their account.
 */
export async function archiveCourseAction(id: string) {
  return run(async () => {
    const me = await actionMaster();
    const course = await db.course.findUniqueOrThrow({ where: { id }, include: { liveSessions: true, assessments: { where: { isPublished: true } } } });
    if (course.status === "ARCHIVED") throw new ActionError("Already archived.");
    if (course.status !== "ENDED") throw new ActionError("Mark the course as Ended first.");
    const now = new Date();

    // 1) Freeze final reports (each session & assessment without a report + course summary)
    const existing = new Set((await db.report.findMany({ where: { courseId: id }, select: { refId: true } })).map((r) => r.refId));
    for (const s of course.liveSessions) if (sessionEnd(s) <= now && !existing.has(s.id)) await saveReport("ATTENDANCE", s.id, await buildAttendanceData(s.id), me);
    for (const a of course.assessments) if (a.dueAt <= now && !existing.has(a.id)) await saveReport("GRADES", a.id, await buildGradesData(a.id), me);
    await saveReport("COURSE_SUMMARY", id, await buildCourseSummaryData(id), me);

    // 2) Accounting snapshot
    const approved = await db.enrollment.findMany({ where: { courseId: id, status: "APPROVED" }, select: { userId: true, amount: true } });
    const revenue = approved.reduce((s, e) => s + e.amount, 0);

    // 3) Delete students who aren't enrolled in another live course
    const studentIds = (await db.enrollment.findMany({ where: { courseId: id }, select: { userId: true } })).map((e) => e.userId);
    const keep = new Set(
      (
        await db.enrollment.findMany({
          where: { userId: { in: studentIds }, courseId: { not: id }, status: { in: ["APPROVED", "PENDING"] }, course: { status: { in: ["PUBLISHED", "DRAFT", "ENDED"] } } },
          select: { userId: true },
        })
      ).map((e) => e.userId),
    );
    const toDelete = studentIds.filter((u) => !keep.has(u));
    const proofs = await db.enrollment.findMany({ where: { courseId: id }, select: { proofKey: true } });
    for (const p of proofs) if (p.proofKey !== "manual") await deleteObject(p.proofKey);
    await db.enrollment.deleteMany({ where: { courseId: id } });
    await db.user.deleteMany({ where: { id: { in: toDelete }, role: "STUDENT" } });

    await db.course.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: now, enrollmentOpen: false, finalStudentCount: approved.length, finalRevenue: revenue } });
    await audit(me, "course.archived", `${course.title} — ${toDelete.length} accounts deleted, ${keep.size} kept (enrolled elsewhere)`);
    revalidatePublic();
    revalidatePath("/admin", "layout");
    return { deleted: toDelete.length, kept: keep.size };
  });
}

// ─── Chapters ──────────────────────────────────────────────────────

const chapterSchema = z.object({
  title: z.string().trim().min(2, "Chapter title is required.").max(120),
  description: z.string().trim().max(2000).optional(),
  coverKey: z.string().nullable().optional(),
  isPublished: z.boolean().default(true),
});

export async function saveChapterAction(courseId: string, chapterId: string | null, input: z.input<typeof chapterSchema>) {
  return run(async () => {
    const me = await actionStaff("content");
    const d = chapterSchema.parse(input);
    if (d.coverKey && !d.coverKey.startsWith("public/covers/")) throw new ActionError("Invalid image.");
    const data = { title: d.title, description: d.description ?? "", coverKey: d.coverKey ?? null, isPublished: d.isPublished };
    if (chapterId) {
      await db.chapter.update({ where: { id: chapterId }, data });
    } else {
      const max = await db.chapter.aggregate({ where: { courseId }, _max: { sortOrder: true } });
      await db.chapter.create({ data: { ...data, courseId, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
      await audit(me, "chapter.created", d.title);
    }
    revalidatePublic();
    revalidatePath(`/admin/courses/${courseId}`);
  }, chapterId ? "Chapter saved" : "Chapter added");
}

export async function deleteChapterAction(id: string) {
  return run(async () => {
    const me = await actionStaff("content");
    const ch = await db.chapter.findUniqueOrThrow({ where: { id }, include: { lessons: { include: { resources: true } } } });
    for (const l of ch.lessons) for (const r of l.resources) await deleteObject(r.storageKey);
    await db.chapter.delete({ where: { id } });
    await audit(me, "chapter.deleted", ch.title);
    revalidatePublic();
    revalidatePath(`/admin/courses/${ch.courseId}`);
  }, "Chapter deleted");
}

export async function moveChapterAction(id: string, dir: -1 | 1) {
  return run(async () => {
    await actionStaff("content");
    const ch = await db.chapter.findUniqueOrThrow({ where: { id } });
    const list = await db.chapter.findMany({ where: { courseId: ch.courseId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    await db.$transaction(list.map((c, k) => db.chapter.update({ where: { id: c.id }, data: { sortOrder: k + 1 } })));
    revalidatePublic();
    revalidatePath(`/admin/courses/${ch.courseId}`);
  });
}

// ─── Lessons ───────────────────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().trim().min(2, "Lesson title is required.").max(140),
  description: z.string().trim().max(5000).optional(),
  isPublished: z.boolean().default(true),
});

export async function saveLessonAction(chapterId: string, lessonId: string | null, input: z.input<typeof lessonSchema>) {
  return run(async () => {
    const me = await actionStaff("content");
    const d = lessonSchema.parse(input);
    const ch = await db.chapter.findUniqueOrThrow({ where: { id: chapterId } });
    const data = { title: d.title, description: d.description ?? "", isPublished: d.isPublished };
    let id = lessonId;
    if (lessonId) {
      const before = await db.lesson.findUniqueOrThrow({ where: { id: lessonId } });
      await db.lesson.update({ where: { id: lessonId }, data });
      if (!before.isPublished && d.isPublished) {
        await notifyCourseStudents(ch.courseId, { title: "New lesson available", body: d.title, link: `/dashboard/courses/${ch.courseId}/lessons/${lessonId}` });
      }
    } else {
      const max = await db.lesson.aggregate({ where: { chapterId }, _max: { sortOrder: true } });
      const l = await db.lesson.create({ data: { ...data, chapterId, courseId: ch.courseId, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
      id = l.id;
      await audit(me, "lesson.created", d.title);
      if (d.isPublished) await notifyCourseStudents(ch.courseId, { title: "New lesson available", body: d.title, link: `/dashboard/courses/${ch.courseId}/lessons/${l.id}` });
    }
    revalidatePublic();
    revalidatePath(`/admin/courses/${ch.courseId}`, "layout");
    return id!;
  }, lessonId ? "Lesson saved" : "Lesson added");
}

export async function deleteLessonAction(id: string) {
  return run(async () => {
    const me = await actionStaff("content");
    const l = await db.lesson.findUniqueOrThrow({ where: { id }, include: { resources: true } });
    for (const r of l.resources) await deleteObject(r.storageKey);
    await db.lesson.delete({ where: { id } });
    await audit(me, "lesson.deleted", l.title);
    revalidatePublic();
    revalidatePath(`/admin/courses/${l.courseId}`);
  }, "Lesson deleted");
}

export async function moveLessonAction(id: string, dir: -1 | 1) {
  return run(async () => {
    await actionStaff("content");
    const l = await db.lesson.findUniqueOrThrow({ where: { id } });
    const list = await db.lesson.findMany({ where: { chapterId: l.chapterId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    await db.$transaction(list.map((c, k) => db.lesson.update({ where: { id: c.id }, data: { sortOrder: k + 1 } })));
    revalidatePublic();
    revalidatePath(`/admin/courses/${l.courseId}`);
  });
}

// ─── Resources (lesson files, videos, links, books) ────────────────

const resourceSchema = z
  .object({
    kind: z.enum(["PDF", "VIDEO", "LINK", "FILE"]),
    title: z.string().trim().min(1, "Give it a title.").max(160),
    description: z.string().trim().max(500).optional(),
    storageKey: z.string().optional().nullable(),
    url: z.string().trim().max(1000).optional().nullable(),
    mimeType: z.string().optional().nullable(),
    size: z.number().int().optional().nullable(),
    allowDownload: z.boolean().default(false),
    isMainBook: z.boolean().default(false),
  })
  .refine((d) => d.storageKey || d.url, { message: "Upload a file or paste a link." });

export async function addResourceAction(courseId: string, lessonId: string | null, input: z.input<typeof resourceSchema>) {
  return run(async () => {
    const me = await actionStaff("content");
    const d = resourceSchema.parse(input);
    if (d.storageKey && !d.storageKey.startsWith(`courses/${courseId}/`)) throw new ActionError("Invalid file.");
    const max = await db.resource.aggregate({ where: { courseId, lessonId }, _max: { sortOrder: true } });
    if (d.isMainBook) await db.resource.updateMany({ where: { courseId, lessonId: null }, data: { isMainBook: false } });
    await db.resource.create({
      data: {
        courseId,
        lessonId,
        kind: d.kind,
        title: d.title,
        description: d.description || null,
        storageKey: d.storageKey || null,
        url: d.url || null,
        mimeType: d.mimeType || null,
        size: d.size ?? null,
        allowDownload: d.allowDownload,
        isMainBook: !lessonId && d.isMainBook,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    await audit(me, lessonId ? "resource.added" : "book.added", d.title);
    if (!lessonId && d.isMainBook) await notifyCourseStudents(courseId, { title: "The course book is available", body: d.title, link: `/dashboard/courses/${courseId}` });
    revalidatePublic();
    revalidatePath(`/admin/courses/${courseId}`, "layout");
  }, "Added");
}

export async function updateResourceAction(id: string, input: { title: string; allowDownload: boolean; isMainBook?: boolean }) {
  return run(async () => {
    await actionStaff("content");
    const r = await db.resource.findUniqueOrThrow({ where: { id } });
    if (input.isMainBook && !r.lessonId) await db.resource.updateMany({ where: { courseId: r.courseId, lessonId: null }, data: { isMainBook: false } });
    await db.resource.update({ where: { id }, data: { title: input.title.trim() || r.title, allowDownload: input.allowDownload, isMainBook: !r.lessonId && !!input.isMainBook } });
    revalidatePublic();
    revalidatePath(`/admin/courses/${r.courseId}`, "layout");
  }, "Saved");
}

export async function deleteResourceAction(id: string) {
  return run(async () => {
    const me = await actionStaff("content");
    const r = await db.resource.findUniqueOrThrow({ where: { id } });
    await deleteObject(r.storageKey);
    await db.resource.delete({ where: { id } });
    await audit(me, "resource.deleted", r.title);
    revalidatePublic();
    revalidatePath(`/admin/courses/${r.courseId}`, "layout");
  }, "Removed");
}

export async function setCourseStatusAction(id: string, status: "DRAFT" | "PUBLISHED" | "ENDED") {
  return run(async () => {
    const me = await actionStaff("courses");
    const c = await db.course.findUniqueOrThrow({ where: { id } });
    if (c.status === "ARCHIVED") throw new ActionError("This course is archived.");
    await db.course.update({ where: { id }, data: { status, ...(status === "ENDED" ? { enrollmentOpen: false } : {}) } });
    await audit(me, "course.status", `${c.title} → ${status}`);
    revalidatePublic();
    revalidatePath("/admin", "layout");
  }, status === "ENDED" ? "Course marked as ended" : "Status updated");
}
