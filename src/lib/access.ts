import "server-only";
import { db } from "./db";
import type { SessionUser } from "./auth";
import { isStaff } from "./permissions";

/** Student can open course content only after an approved payment, and while the course isn't archived. */
export async function getCourseAccess(user: SessionUser, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return { course: null, allowed: false as const, staff: false };
  if (isStaff(user)) return { course, allowed: true as const, staff: true };
  if (course.status === "ARCHIVED" || course.status === "DRAFT") return { course, allowed: false as const, staff: false };
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  return { course, allowed: enrollment?.status === "APPROVED", staff: false, enrollment };
}

export async function approvedCourseIds(userId: string) {
  const rows = await db.enrollment.findMany({
    where: { userId, status: "APPROVED", course: { status: { in: ["PUBLISHED", "ENDED"] } } },
    select: { courseId: true },
  });
  return rows.map((r) => r.courseId);
}

export function sessionEnd(s: { endsAt: Date; endedAt: Date | null }) {
  return s.endedAt && s.endedAt < s.endsAt ? s.endedAt : s.endsAt;
}

export function sessionPhase(s: { startsAt: Date; endsAt: Date; endedAt: Date | null; joinOpensMinutes: number }, now = new Date()) {
  const end = sessionEnd(s);
  if (now >= end) return "ended" as const;
  if (now >= s.startsAt) return "live" as const;
  if (now.getTime() >= s.startsAt.getTime() - s.joinOpensMinutes * 60_000) return "open" as const;
  return "upcoming" as const;
}

export function assessmentPhase(a: { opensAt: Date | null; dueAt: Date }, now = new Date()) {
  if (now >= a.dueAt) return "closed" as const;
  if (a.opensAt && now < a.opensAt) return "upcoming" as const;
  return "open" as const;
}
