import "server-only";
import { db } from "./db";

export type QOption = { id: string; text: string };
export type Answers = Record<string, string>;

export function gradeAnswers(
  questions: { id: string; correctOptionId: string; points: number }[],
  answers: Answers,
) {
  let score = 0;
  let total = 0;
  for (const q of questions) {
    total += q.points;
    if (answers[q.id] && answers[q.id] === q.correctOptionId) score += q.points;
  }
  return { score, total };
}

/** Re-scores every submitted attempt (used after a teacher edits correct answers). */
export async function regradeAssessment(assessmentId: string) {
  const questions = await db.question.findMany({ where: { assessmentId }, select: { id: true, correctOptionId: true, points: true } });
  const subs = await db.submission.findMany({ where: { assessmentId, submittedAt: { not: null } } });
  for (const s of subs) {
    const { score, total } = gradeAnswers(questions, (s.answers ?? {}) as Answers);
    if (score !== s.score || total !== s.total) {
      await db.submission.update({ where: { id: s.id }, data: { score, total } });
    }
  }
}

/** Best submitted attempt per student. */
export function bestAttempts<T extends { userId: string; score: number | null; submittedAt: Date | null }>(subs: T[]) {
  const best = new Map<string, T>();
  for (const s of subs) {
    if (!s.submittedAt) continue;
    const cur = best.get(s.userId);
    if (!cur || (s.score ?? 0) > (cur.score ?? 0)) best.set(s.userId, s);
  }
  return best;
}

/**
 * Attempts that were started but never submitted (tab closed, timer ran out)
 * are finalized with whatever answers were autosaved before the deadline.
 */
export async function finalizeExpiredAttempts(assessmentId: string) {
  const a = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { select: { id: true, correctOptionId: true, points: true } } },
  });
  if (!a) return;
  const open = await db.submission.findMany({ where: { assessmentId, submittedAt: null } });
  const now = Date.now();
  for (const s of open) {
    const limit = Math.min(a.dueAt.getTime(), a.durationMinutes ? s.startedAt.getTime() + a.durationMinutes * 60_000 : Infinity);
    if (now <= limit + 90_000) continue;
    const answers = (s.answers ?? {}) as Answers;
    const { score, total } = gradeAnswers(a.questions, answers);
    await db.submission.update({ where: { id: s.id }, data: { score, total, submittedAt: new Date(limit) } });
  }
}
