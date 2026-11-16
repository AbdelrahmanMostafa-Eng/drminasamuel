"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ActionError, actionUser, run } from "@/lib/auth";
import { audit, notifyStaff } from "@/lib/audit";
import { assessmentPhase, sessionPhase } from "@/lib/access";
import { gradeAnswers, type Answers } from "@/lib/grading";
import { isStaff } from "@/lib/permissions";
import { normalizePhone, seededShuffle } from "@/lib/utils";

async function student() {
  const u = await actionUser();
  if (u.role !== "STUDENT") throw new ActionError("This action is for student accounts.");
  return u;
}

async function approved(userId: string, courseId: string) {
  const e = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, include: { course: true } });
  if (e?.status !== "APPROVED" || !["PUBLISHED", "ENDED"].includes(e.course.status)) throw new ActionError("You need an approved enrollment in this course.");
  return e;
}

const enrollSchema = z.object({
  courseId: z.string(),
  method: z.enum(["INSTAPAY", "VODAFONE_CASH"]),
  proofKey: z.string().min(5, "Please upload your payment screenshot."),
  senderNumber: z.string().trim().max(40).optional(),
  reference: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function submitEnrollmentAction(input: z.input<typeof enrollSchema>) {
  return run(async () => {
    const me = await student();
    const d = enrollSchema.parse(input);
    if (!d.proofKey.startsWith(`payments/${me.id}/`)) throw new ActionError("Please upload your payment screenshot again.");
    const course = await db.course.findUnique({ where: { id: d.courseId } });
    if (!course || course.status !== "PUBLISHED") throw new ActionError("This course isn't open for enrollment.");
    if (!course.enrollmentOpen) throw new ActionError("Enrollment for this course is closed.");
    if (course.prerequisiteId) {
      const pre = await db.enrollment.findUnique({ where: { userId_courseId: { userId: me.id, courseId: course.prerequisiteId } } });
      if (pre?.status !== "APPROVED") throw new ActionError("You need to be enrolled in the prerequisite course first.");
    }
    const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId: me.id, courseId: course.id } } });
    if (existing?.status === "APPROVED") throw new ActionError("You're already enrolled in this course.");
    if (existing?.status === "PENDING") throw new ActionError("Your payment is already under review.");
    const sender = d.senderNumber ? (normalizePhone(d.senderNumber) ?? d.senderNumber) : null;
    const data = {
      status: "PENDING" as const,
      method: d.method,
      amount: course.price,
      senderNumber: sender,
      reference: d.reference || null,
      proofKey: d.proofKey,
      note: d.note || null,
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
      submittedAt: new Date(),
    };
    if (existing) await db.enrollment.update({ where: { id: existing.id }, data });
    else await db.enrollment.create({ data: { ...data, userId: me.id, courseId: course.id } });
    await notifyStaff("payments", {
      title: "New payment to review",
      body: `${me.fullName} paid for ${course.title} via ${d.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash"}.`,
      link: "/admin/payments",
    });
    await audit(me, "enrollment.submitted", course.title);
    revalidatePath("/dashboard", "layout");
  }, "Payment submitted! We'll review it shortly.");
}

export async function toggleLessonCompleteAction(lessonId: string, complete: boolean) {
  return run(async () => {
    const me = await student();
    const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId } });
    await approved(me.id, lesson.courseId);
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: me.id, lessonId } },
      create: { userId: me.id, lessonId, completedAt: complete ? new Date() : null },
      update: { completedAt: complete ? new Date() : null, lastViewedAt: new Date() },
    });
    revalidatePath(`/dashboard/courses/${lesson.courseId}`);
  });
}

export async function submitExcuseAction(sessionId: string, excuse: string) {
  return run(async () => {
    const me = await student();
    const text = excuse.trim();
    if (text.length < 5) throw new ActionError("Please write a short explanation (at least a few words).");
    if (text.length > 1000) throw new ActionError("Please keep it under 1000 characters.");
    const s = await db.liveSession.findUniqueOrThrow({ where: { id: sessionId } });
    await approved(me.id, s.courseId);
    if (sessionPhase(s) === "ended") throw new ActionError("This session has ended — excuses can only be submitted before it ends.");
    await db.attendance.upsert({
      where: { sessionId_userId: { sessionId, userId: me.id } },
      create: { sessionId, userId: me.id, excuse: text, excuseAt: new Date() },
      update: { excuse: text, excuseAt: new Date() },
    });
    revalidatePath("/dashboard/schedule");
    revalidatePath("/dashboard");
  }, "Excuse submitted");
}

/** Starts (or resumes) an attempt. Returns the submission id. */
export async function startAttemptAction(assessmentId: string) {
  return run(async () => {
    const me = await student();
    const a = await db.assessment.findUniqueOrThrow({ where: { id: assessmentId }, include: { questions: { select: { id: true } } } });
    if (!a.isPublished) throw new ActionError("This assessment isn't available.");
    await approved(me.id, a.courseId);
    const phase = assessmentPhase(a);
    if (phase === "upcoming") throw new ActionError("This assessment hasn't opened yet.");
    if (phase === "closed") throw new ActionError("The deadline has passed.");
    const subs = await db.submission.findMany({ where: { assessmentId, userId: me.id }, orderBy: { attempt: "desc" } });
    const open = subs.find((s) => !s.submittedAt);
    if (open) return open.id;
    if (subs.length >= a.maxAttempts) throw new ActionError("You've used all your attempts.");
    const attempt = (subs[0]?.attempt ?? 0) + 1;
    const ids = a.questions.map((q) => q.id);
    const order = a.shuffleQuestions ? seededShuffle(ids, `${me.id}:${a.id}:${attempt}`) : null;
    const s = await db.submission.create({ data: { assessmentId, userId: me.id, attempt, order: order ?? undefined } });
    return s.id;
  });
}

function deadlineFor(a: { dueAt: Date; durationMinutes: number | null }, startedAt: Date) {
  const grace = 90_000;
  const byTimer = a.durationMinutes ? startedAt.getTime() + a.durationMinutes * 60_000 + grace : Infinity;
  return Math.min(a.dueAt.getTime() + grace, byTimer);
}

export async function saveAnswersAction(submissionId: string, answers: Answers) {
  return run(async () => {
    const me = await student();
    const s = await db.submission.findUniqueOrThrow({ where: { id: submissionId }, include: { assessment: true } });
    if (s.userId !== me.id || s.submittedAt) return;
    if (Date.now() > deadlineFor(s.assessment, s.startedAt)) return;
    await db.submission.update({ where: { id: submissionId }, data: { answers } });
  });
}

export async function submitAttemptAction(submissionId: string, answers: Answers) {
  return run(async () => {
    const me = await student();
    const s = await db.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { assessment: { include: { questions: { select: { id: true, correctOptionId: true, points: true } } } } },
    });
    if (s.userId !== me.id) throw new ActionError("Not your submission.");
    if (s.submittedAt) return { score: s.score, total: s.total };
    const late = Date.now() > deadlineFor(s.assessment, s.startedAt);
    // if late, grade whatever was autosaved before the deadline
    const final = late ? ((s.answers ?? {}) as Answers) : answers;
    const { score, total } = gradeAnswers(s.assessment.questions, final);
    await db.submission.update({ where: { id: submissionId }, data: { answers: final, score, total, submittedAt: new Date() } });
    revalidatePath("/dashboard", "layout");
    return { score, total };
  });
}

export async function postCommentAction(lessonId: string, body: string, parentId?: string) {
  return run(async () => {
    const me = await actionUser();
    const text = body.trim();
    if (text.length < 2) throw new ActionError("Write a question first.");
    if (text.length > 2000) throw new ActionError("Please keep it under 2000 characters.");
    const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { chapter: true } });
    if (!isStaff(me)) await approved(me.id, lesson.courseId);
    await db.lessonComment.create({ data: { lessonId, userId: me.id, body: text, parentId: parentId ?? null } });
    if (!isStaff(me)) {
      await notifyStaff("content", { title: "New student question", body: `${me.fullName} asked on “${lesson.title}”`, link: `/admin/courses/${lesson.courseId}/lessons/${lesson.id}` });
    } else if (parentId) {
      const parent = await db.lessonComment.findUnique({ where: { id: parentId } });
      if (parent && parent.userId !== me.id) {
        await db.notification.create({
          data: { userId: parent.userId, title: "Your question was answered", body: `${me.fullName} replied on “${lesson.title}”`, link: `/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}#qa` },
        });
      }
    }
    revalidatePath(`/dashboard/courses/${lesson.courseId}/lessons/${lessonId}`);
    revalidatePath(`/admin/courses/${lesson.courseId}/lessons/${lessonId}`);
  });
}

export async function deleteCommentAction(id: string) {
  return run(async () => {
    const me = await actionUser();
    const c = await db.lessonComment.findUniqueOrThrow({ where: { id }, include: { lesson: true } });
    if (c.userId !== me.id && !isStaff(me)) throw new ActionError("You can't delete this.");
    await db.lessonComment.delete({ where: { id } });
    revalidatePath(`/dashboard/courses/${c.lesson.courseId}/lessons/${c.lessonId}`);
    revalidatePath(`/admin/courses/${c.lesson.courseId}/lessons/${c.lessonId}`);
  });
}
