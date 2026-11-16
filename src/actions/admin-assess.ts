"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ActionError, actionStaff, run } from "@/lib/auth";
import { audit, notifyCourseStudents } from "@/lib/audit";
import { parseLocalInput } from "@/lib/time";
import { regradeAssessment } from "@/lib/grading";
import { sessionEnd } from "@/lib/access";
import { buildAttendanceData, buildCourseSummaryData, buildGradesData, saveReport } from "@/lib/reports";
import { ensureUrl } from "@/lib/utils";

const assessmentSchema = z
  .object({
    type: z.enum(["HOMEWORK", "QUIZ"]),
    chapterId: z.string().optional().nullable(),
    lessonId: z.string().optional().nullable(),
    title: z.string().trim().min(2, "Title is required.").max(140),
    instructions: z.string().trim().max(3000).optional(),
    opensAt: z.string().optional().nullable(),
    dueAt: z.string().min(1, "Set a deadline."),
    durationMinutes: z.coerce.number().int().min(0).max(600).optional().nullable(),
    maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
    answerVisibility: z.enum(["IMMEDIATELY", "AFTER_DEADLINE", "NEVER"]).default("AFTER_DEADLINE"),
    shuffleQuestions: z.boolean().default(false),
    isPublished: z.boolean().default(true),
  })
  .refine((d) => (d.type === "QUIZ" ? !!d.chapterId : !!d.lessonId), { message: "Choose where this belongs (chapter for quizzes, lesson for homework)." });

export async function saveAssessmentAction(courseId: string, id: string | null, input: z.input<typeof assessmentSchema>) {
  return run(async () => {
    const me = await actionStaff("assessments");
    const d = assessmentSchema.parse(input);
    const dueAt = parseLocalInput(d.dueAt);
    if (!dueAt) throw new ActionError("Invalid deadline.");
    const opensAt = parseLocalInput(d.opensAt);
    if (opensAt && opensAt >= dueAt) throw new ActionError("The opening time must be before the deadline.");
    const data = {
      type: d.type,
      chapterId: d.type === "QUIZ" ? d.chapterId! : null,
      lessonId: d.type === "HOMEWORK" ? d.lessonId! : null,
      title: d.title,
      instructions: d.instructions ?? "",
      opensAt,
      dueAt,
      durationMinutes: d.durationMinutes || null,
      maxAttempts: d.maxAttempts,
      answerVisibility: d.answerVisibility,
      shuffleQuestions: d.shuffleQuestions,
      isPublished: d.isPublished,
    };
    let aid = id;
    if (id) {
      const before = await db.assessment.findUniqueOrThrow({ where: { id } });
      await db.assessment.update({ where: { id }, data });
      if (!before.isPublished && d.isPublished) await notifyCourseStudents(courseId, { title: `New ${d.type === "QUIZ" ? "quiz" : "homework"}: ${d.title}`, link: `/dashboard/assessments/${id}` });
    } else {
      const a = await db.assessment.create({ data: { ...data, courseId } });
      aid = a.id;
      await audit(me, `${d.type.toLowerCase()}.created`, d.title);
    }
    revalidatePath(`/admin/courses/${courseId}`, "layout");
    revalidatePath(`/admin/assessments/${aid}`);
    return aid!;
  }, "Saved");
}

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Every question needs text."),
  imageKey: z.string().nullable().optional(),
  options: z.array(z.object({ id: z.string(), text: z.string().trim().min(1, "Options can't be empty.") })).min(2, "Each question needs at least 2 options.").max(8),
  correctOptionId: z.string().min(1, "Mark the correct answer for every question."),
  explanation: z.string().trim().max(2000).nullable().optional(),
  points: z.coerce.number().int().min(1).max(100).default(1),
});

export async function saveQuestionsAction(assessmentId: string, input: z.input<typeof questionSchema>[]) {
  return run(async () => {
    const me = await actionStaff("assessments");
    const qs = z.array(questionSchema).parse(input);
    const a = await db.assessment.findUniqueOrThrow({ where: { id: assessmentId }, include: { questions: { select: { id: true } } } });
    qs.forEach((q, i) => {
      if (!q.options.some((o) => o.id === q.correctOptionId)) throw new ActionError(`Question ${i + 1}: choose the correct answer.`);
      if (q.imageKey && !q.imageKey.startsWith(`courses/${a.courseId}/`)) throw new ActionError("Invalid image.");
    });
    const keep = new Set(qs.filter((q) => q.id).map((q) => q.id!));
    const existing = new Set(a.questions.map((q) => q.id));
    await db.$transaction([
      db.question.deleteMany({ where: { assessmentId, id: { notIn: [...keep] } } }),
      ...qs.map((q, i) => {
        const data = { text: q.text, imageKey: q.imageKey ?? null, options: q.options, correctOptionId: q.correctOptionId, explanation: q.explanation || null, points: q.points, sortOrder: i + 1 };
        return q.id && existing.has(q.id) ? db.question.update({ where: { id: q.id }, data }) : db.question.create({ data: { ...data, assessmentId } });
      }),
    ]);
    await regradeAssessment(assessmentId);
    await audit(me, "questions.saved", `${a.title} (${qs.length} questions)`);
    revalidatePath(`/admin/assessments/${assessmentId}`);
  }, "Questions saved — submissions regraded");
}

export async function deleteAssessmentAction(id: string) {
  return run(async () => {
    const me = await actionStaff("assessments");
    const a = await db.assessment.findUniqueOrThrow({ where: { id } });
    await db.assessment.delete({ where: { id } });
    await audit(me, "assessment.deleted", a.title);
    revalidatePath(`/admin/courses/${a.courseId}`, "layout");
    return a.courseId;
  }, "Deleted");
}

export async function resetSubmissionAction(submissionId: string) {
  return run(async () => {
    const me = await actionStaff("grades");
    const s = await db.submission.findUniqueOrThrow({ where: { id: submissionId }, include: { user: true, assessment: true } });
    await db.submission.delete({ where: { id: submissionId } });
    await audit(me, "submission.reset", `${s.user.fullName} — ${s.assessment.title}`);
    revalidatePath(`/admin/assessments/${s.assessmentId}`);
  }, "Attempt reset — the student can retake it");
}

// ─── Live sessions ─────────────────────────────────────────────────

const sessionSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(140),
  description: z.string().trim().max(2000).optional(),
  startsAt: z.string().min(1, "Set a start time."),
  endsAt: z.string().min(1, "Set an end time."),
  zoomUrl: z.string().trim().min(8, "Paste the Zoom link."),
  meetingId: z.string().trim().max(40).optional(),
  passcode: z.string().trim().max(40).optional(),
  joinOpensMinutes: z.coerce.number().int().min(0).max(240).default(15),
  recordingUrl: z.string().trim().max(1000).optional(),
});

export async function saveSessionAction(courseId: string, id: string | null, input: z.input<typeof sessionSchema>) {
  return run(async () => {
    const me = await actionStaff("sessions");
    const d = sessionSchema.parse(input);
    const startsAt = parseLocalInput(d.startsAt);
    const endsAt = parseLocalInput(d.endsAt);
    if (!startsAt || !endsAt) throw new ActionError("Invalid date.");
    if (endsAt <= startsAt) throw new ActionError("The end time must be after the start time.");
    let zoom: URL;
    try {
      zoom = new URL(ensureUrl(d.zoomUrl));
    } catch {
      throw new ActionError("That Zoom link doesn't look right.");
    }
    const data = {
      title: d.title,
      description: d.description ?? "",
      startsAt,
      endsAt,
      zoomUrl: zoom.toString(),
      meetingId: d.meetingId || null,
      passcode: d.passcode || null,
      joinOpensMinutes: d.joinOpensMinutes,
      recordingUrl: d.recordingUrl ? ensureUrl(d.recordingUrl) : null,
    };
    let sid = id;
    if (id) {
      const before = await db.liveSession.findUniqueOrThrow({ where: { id } });
      await db.liveSession.update({ where: { id }, data: { ...data, endedAt: before.endedAt && endsAt > before.endedAt && endsAt > new Date() ? null : before.endedAt } });
      if (!before.recordingUrl && data.recordingUrl) await notifyCourseStudents(courseId, { title: "Session recording available", body: d.title, link: "/dashboard/schedule" });
    } else {
      const s = await db.liveSession.create({ data: { ...data, courseId } });
      sid = s.id;
      await audit(me, "session.created", d.title);
      await notifyCourseStudents(courseId, { title: "New live session scheduled", body: d.title, link: "/dashboard/schedule" });
    }
    revalidatePath("/admin/schedule");
    revalidatePath(`/admin/courses/${courseId}`, "layout");
    return sid!;
  }, "Session saved");
}

export async function endSessionNowAction(id: string) {
  return run(async () => {
    const me = await actionStaff("sessions");
    const s = await db.liveSession.findUniqueOrThrow({ where: { id } });
    if (sessionEnd(s) <= new Date()) throw new ActionError("This session has already ended.");
    await db.liveSession.update({ where: { id }, data: { endedAt: new Date() } });
    await audit(me, "session.ended", s.title);
    revalidatePath(`/admin/sessions/${id}`);
  }, "Session ended — attendance is locked");
}

export async function deleteSessionAction(id: string) {
  return run(async () => {
    const me = await actionStaff("sessions");
    const s = await db.liveSession.findUniqueOrThrow({ where: { id } });
    await db.liveSession.delete({ where: { id } });
    await audit(me, "session.deleted", s.title);
    revalidatePath("/admin/schedule");
    return s.courseId;
  }, "Session deleted");
}

export async function setAttendanceAction(sessionId: string, userId: string, override: "PRESENT" | "ABSENT" | null) {
  return run(async () => {
    const me = await actionStaff("attendance");
    await db.attendance.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId, override, overrideBy: me.fullName },
      update: { override, overrideBy: override ? me.fullName : null },
    });
    await audit(me, "attendance.adjusted", `${override ?? "reset"} (${userId})`);
    revalidatePath(`/admin/sessions/${sessionId}`);
  }, "Attendance updated");
}

// ─── Reports ───────────────────────────────────────────────────────

export async function generateReportAction(type: "ATTENDANCE" | "GRADES" | "COURSE_SUMMARY", refId: string) {
  return run(async () => {
    const me = await actionStaff("reports");
    const now = new Date();
    if (type === "ATTENDANCE") {
      const s = await db.liveSession.findUniqueOrThrow({ where: { id: refId } });
      if (sessionEnd(s) > now) throw new ActionError("The attendance report is available right after the session ends.");
      const r = await saveReport(type, refId, await buildAttendanceData(refId), me);
      await audit(me, "report.generated", r.title);
      revalidatePath("/admin/reports");
      return r.id;
    }
    if (type === "GRADES") {
      const a = await db.assessment.findUniqueOrThrow({ where: { id: refId } });
      if (a.dueAt > now) throw new ActionError("The grades report is available right after the deadline.");
      const r = await saveReport(type, refId, await buildGradesData(refId), me);
      await audit(me, "report.generated", r.title);
      revalidatePath("/admin/reports");
      return r.id;
    }
    const r = await saveReport(type, refId, await buildCourseSummaryData(refId), me);
    await audit(me, "report.generated", r.title);
    revalidatePath("/admin/reports");
    return r.id;
  });
}

export async function deleteReportAction(id: string) {
  return run(async () => {
    const me = await actionStaff("reports");
    if (me.role !== "MASTER") throw new ActionError("Only the master admin can delete archived reports.");
    await db.report.delete({ where: { id } });
    revalidatePath("/admin/reports");
  }, "Report deleted");
}

