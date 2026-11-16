import "server-only";
import { db } from "./db";
import { bestAttempts } from "./grading";
import { sessionEnd } from "./access";

/** Everything the student dashboard needs about one approved course. */
export async function courseProgress(userId: string, courseId: string) {
  const [lessons, done, assessments] = await Promise.all([
    db.lesson.count({ where: { courseId, isPublished: true, chapter: { isPublished: true } } }),
    db.lessonProgress.count({ where: { userId, completedAt: { not: null }, lesson: { courseId, isPublished: true } } }),
    db.assessment.findMany({
      where: { courseId, isPublished: true },
      select: { id: true, submissions: { where: { userId, submittedAt: { not: null } }, select: { id: true } } },
    }),
  ]);
  const assessDone = assessments.filter((a) => a.submissions.length > 0).length;
  const units = lessons + assessments.length;
  return {
    lessons,
    lessonsDone: done,
    assessments: assessments.length,
    assessmentsDone: assessDone,
    percent: units ? Math.round(((done + assessDone) / units) * 100) : 0,
  };
}

export async function studentStats(userId: string, courseIds: string[]) {
  const now = new Date();
  const [assessments, sessions] = await Promise.all([
    db.assessment.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      include: { submissions: { where: { userId } }, course: { select: { title: true } }, chapter: { select: { title: true } }, lesson: { select: { title: true } } },
      orderBy: { dueAt: "asc" },
    }),
    db.liveSession.findMany({
      where: { courseId: { in: courseIds } },
      include: { attendance: { where: { userId } } },
      orderBy: { startsAt: "asc" },
    }),
  ]);
  const enrollments = await db.enrollment.findMany({ where: { userId, courseId: { in: courseIds } }, select: { courseId: true, submittedAt: true } });
  const joinedAt = new Map(enrollments.map((e) => [e.courseId, e.submittedAt]));

  const graded = assessments
    .map((a) => {
      const best = bestAttempts(a.submissions).get(userId);
      return { a, best };
    })
    .filter((x) => x.best && x.best.total);
  const pctOf = (x: { best?: { score: number | null; total: number | null } }) => Math.round(((x.best!.score ?? 0) / (x.best!.total || 1)) * 100);
  const avg = (type: "HOMEWORK" | "QUIZ") => {
    const list = graded.filter((g) => g.a.type === type);
    return list.length ? Math.round(list.reduce((s, g) => s + pctOf(g), 0) / list.length) : null;
  };
  const ended = sessions.filter((s) => sessionEnd(s) <= now && (joinedAt.get(s.courseId) ?? now) <= sessionEnd(s));
  const present = ended.filter((s) => {
    const a = s.attendance[0];
    return a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
  }).length;
  const missed = assessments.filter((a) => a.dueAt <= now && !a.submissions.some((s) => s.submittedAt) && (joinedAt.get(a.courseId) ?? now) <= a.dueAt).length;

  return {
    assessments,
    sessions,
    homeworkAvg: avg("HOMEWORK"),
    quizAvg: avg("QUIZ"),
    attendanceRate: ended.length ? Math.round((present / ended.length) * 100) : null,
    sessionsHeld: ended.length,
    sessionsAttended: present,
    missed,
    timeline: graded
      .filter((g) => g.best!.submittedAt)
      .sort((x, y) => x.best!.submittedAt!.getTime() - y.best!.submittedAt!.getTime())
      .map((g) => ({ id: g.a.id, title: g.a.title, type: g.a.type, percent: pctOf(g), date: g.best!.submittedAt!.toISOString(), chapter: g.a.chapter?.title ?? null })),
  };
}
