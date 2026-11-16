import "server-only";
import { db } from "./db";
import { bestAttempts, finalizeExpiredAttempts } from "./grading";
import { sessionEnd } from "./access";
import type { SessionUser } from "./auth";
import { Prisma } from "@prisma/client";

export type AttendanceRow = {
  name: string;
  whatsapp: string | null;
  status: "PRESENT" | "ABSENT" | "NOT_ENROLLED";
  excuse: "GIVEN" | "NOT_GIVEN" | null;
  excuseText: string | null;
  joinedAt: string | null;
  manual: boolean;
};

export type AttendanceReportData = {
  kind: "ATTENDANCE";
  session: { title: string; startsAt: string; endsAt: string };
  rows: AttendanceRow[];
  summary: { total: number; present: number; excused: number; unexcused: number };
};

export type GradeRow = {
  name: string;
  whatsapp: string | null;
  done: boolean;
  na: boolean;
  score: number;
  total: number;
  percent: number;
  submittedAt: string | null;
  attempts: number;
};

export type GradesReportData = {
  kind: "GRADES";
  assessment: { title: string; type: "HOMEWORK" | "QUIZ"; dueAt: string; questions: number; totalPoints: number; parent: string };
  rows: GradeRow[];
  summary: { total: number; done: number; notDone: number; average: number; highest: number; lowest: number };
};

export type SummaryRow = {
  name: string;
  whatsapp: string | null;
  attendance: number;
  attended: number;
  sessions: number;
  homeworkAvg: number;
  quizAvg: number;
  done: number;
  assigned: number;
  lessonsCompleted: number;
};

export type CourseSummaryData = {
  kind: "COURSE_SUMMARY";
  course: { title: string; batchLabel: string | null };
  totals: { students: number; sessions: number; assessments: number; lessons: number };
  rows: SummaryRow[];
};

export async function buildAttendanceData(sessionId: string): Promise<{ data: AttendanceReportData; courseId: string; courseTitle: string; title: string }> {
  const s = await db.liveSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { course: true, attendance: true },
  });
  const enrollments = await db.enrollment.findMany({
    where: { courseId: s.courseId, status: "APPROVED" },
    include: { user: { select: { id: true, fullName: true, whatsapp: true } } },
    orderBy: { user: { fullName: "asc" } },
  });
  const end = sessionEnd(s);
  const byUser = new Map(s.attendance.map((a) => [a.userId, a]));
  const rows: AttendanceRow[] = enrollments.map((e) => {
    const a = byUser.get(e.userId);
    const enrolledLater = e.submittedAt > end && !a;
    if (enrolledLater) {
      return { name: e.user.fullName, whatsapp: e.user.whatsapp, status: "NOT_ENROLLED", excuse: null, excuseText: null, joinedAt: null, manual: false };
    }
    const present = a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
    const hasExcuse = !!a?.excuse?.trim();
    return {
      name: e.user.fullName,
      whatsapp: e.user.whatsapp,
      status: present ? "PRESENT" : "ABSENT",
      excuse: present ? null : hasExcuse ? "GIVEN" : "NOT_GIVEN",
      excuseText: present ? null : (a?.excuse ?? null),
      joinedAt: a?.joinedAt?.toISOString() ?? null,
      manual: !!a?.override,
    };
  });
  const counted = rows.filter((r) => r.status !== "NOT_ENROLLED");
  const summary = {
    total: counted.length,
    present: counted.filter((r) => r.status === "PRESENT").length,
    excused: counted.filter((r) => r.excuse === "GIVEN").length,
    unexcused: counted.filter((r) => r.excuse === "NOT_GIVEN").length,
  };
  return {
    data: { kind: "ATTENDANCE", session: { title: s.title, startsAt: s.startsAt.toISOString(), endsAt: end.toISOString() }, rows, summary },
    courseId: s.courseId,
    courseTitle: s.course.title,
    title: `Attendance — ${s.title}`,
  };
}

export async function buildGradesData(assessmentId: string): Promise<{ data: GradesReportData; courseId: string; courseTitle: string; title: string }> {
  await finalizeExpiredAttempts(assessmentId);
  const a = await db.assessment.findUniqueOrThrow({
    where: { id: assessmentId },
    include: { course: true, questions: { select: { points: true } }, submissions: true, lesson: true, chapter: true },
  });
  const enrollments = await db.enrollment.findMany({
    where: { courseId: a.courseId, status: "APPROVED" },
    include: { user: { select: { id: true, fullName: true, whatsapp: true } } },
    orderBy: { user: { fullName: "asc" } },
  });
  const totalPoints = a.questions.reduce((s, q) => s + q.points, 0);
  const best = bestAttempts(a.submissions);
  const attemptsBy = new Map<string, number>();
  for (const s of a.submissions) if (s.submittedAt) attemptsBy.set(s.userId, (attemptsBy.get(s.userId) ?? 0) + 1);

  const rows: GradeRow[] = enrollments.map((e) => {
    const b = best.get(e.userId);
    const na = !b && e.submittedAt > a.dueAt;
    const score = b?.score ?? 0;
    const total = b?.total ?? totalPoints;
    return {
      name: e.user.fullName,
      whatsapp: e.user.whatsapp,
      done: !!b,
      na,
      score,
      total,
      percent: total ? Math.round((score / total) * 100) : 0,
      submittedAt: b?.submittedAt?.toISOString() ?? null,
      attempts: attemptsBy.get(e.userId) ?? 0,
    };
  });
  const counted = rows.filter((r) => !r.na);
  const done = counted.filter((r) => r.done);
  const percents = counted.map((r) => r.percent);
  const summary = {
    total: counted.length,
    done: done.length,
    notDone: counted.length - done.length,
    average: percents.length ? Math.round(percents.reduce((x, y) => x + y, 0) / percents.length) : 0,
    highest: percents.length ? Math.max(...percents) : 0,
    lowest: percents.length ? Math.min(...percents) : 0,
  };
  const parent = a.type === "HOMEWORK" ? (a.lesson ? `Lesson: ${a.lesson.title}` : "Homework") : a.chapter ? `Chapter: ${a.chapter.title}` : "Quiz";
  return {
    data: {
      kind: "GRADES",
      assessment: { title: a.title, type: a.type, dueAt: a.dueAt.toISOString(), questions: a.questions.length, totalPoints, parent },
      rows,
      summary,
    },
    courseId: a.courseId,
    courseTitle: a.course.title,
    title: `${a.type === "QUIZ" ? "Quiz" : "Homework"} grades — ${a.title}`,
  };
}

export async function buildCourseSummaryData(courseId: string) {
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId } });
  const now = new Date();
  const [enrollments, sessions, assessments, lessons] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId, status: "APPROVED" },
      include: { user: { select: { id: true, fullName: true, whatsapp: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
    db.liveSession.findMany({ where: { courseId }, include: { attendance: true } }),
    db.assessment.findMany({ where: { courseId, isPublished: true }, include: { submissions: true } }),
    db.lesson.findMany({ where: { courseId, isPublished: true }, select: { id: true } }),
  ]);
  const endedSessions = sessions.filter((s) => sessionEnd(s) <= now);
  const closed = assessments.filter((a) => a.dueAt <= now);
  const progress = await db.lessonProgress.findMany({
    where: { lessonId: { in: lessons.map((l) => l.id) }, completedAt: { not: null } },
    select: { userId: true },
  });
  const completedBy = new Map<string, number>();
  for (const p of progress) completedBy.set(p.userId, (completedBy.get(p.userId) ?? 0) + 1);

  const rows: SummaryRow[] = enrollments.map((e) => {
    const mySessions = endedSessions.filter((s) => e.submittedAt <= sessionEnd(s) || s.attendance.some((a) => a.userId === e.userId));
    const attended = mySessions.filter((s) => {
      const a = s.attendance.find((x) => x.userId === e.userId);
      return a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
    }).length;
    const avg = (type: "HOMEWORK" | "QUIZ") => {
      const list = closed.filter((a) => a.type === type && (e.submittedAt <= a.dueAt || a.submissions.some((s) => s.userId === e.userId)));
      if (!list.length) return 0;
      const ps = list.map((a) => {
        const best = bestAttempts(a.submissions.filter((s) => s.userId === e.userId)).get(e.userId);
        return best && best.total ? (best.score ?? 0) / best.total : 0;
      });
      return Math.round((ps.reduce((x, y) => x + y, 0) / ps.length) * 100);
    };
    const assigned = closed.filter((a) => e.submittedAt <= a.dueAt || a.submissions.some((s) => s.userId === e.userId));
    const done = assigned.filter((a) => a.submissions.some((s) => s.userId === e.userId && s.submittedAt)).length;
    return {
      name: e.user.fullName,
      whatsapp: e.user.whatsapp,
      attended,
      sessions: mySessions.length,
      attendance: mySessions.length ? Math.round((attended / mySessions.length) * 100) : 0,
      homeworkAvg: avg("HOMEWORK"),
      quizAvg: avg("QUIZ"),
      done,
      assigned: assigned.length,
      lessonsCompleted: completedBy.get(e.userId) ?? 0,
    };
  });
  const data: CourseSummaryData = {
    kind: "COURSE_SUMMARY",
    course: { title: course.title, batchLabel: course.batchLabel },
    totals: { students: rows.length, sessions: endedSessions.length, assessments: closed.length, lessons: lessons.length },
    rows,
  };
  return { data, courseId, courseTitle: course.title, title: `Course summary — ${course.title}` };
}

export async function saveReport(
  type: "ATTENDANCE" | "GRADES" | "COURSE_SUMMARY",
  refId: string,
  built: { data: unknown; courseId: string; courseTitle: string; title: string },
  user: Pick<SessionUser, "id" | "fullName"> | null,
) {
  return db.report.create({
    data: {
      type,
      refId,
      courseId: built.courseId,
      courseTitle: built.courseTitle,
      title: built.title,
      data: built.data as Prisma.InputJsonValue,
      generatedById: user?.id,
      generatedByName: user?.fullName ?? "System",
    },
  });
}
