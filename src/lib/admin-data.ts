import "server-only";
import { db } from "./db";
import type { AdminSessionRow } from "@/components/admin/session-list";

export async function adminSessions(where: { courseId?: string } = {}): Promise<AdminSessionRow[]> {
  const [sessions, reports] = await Promise.all([
    db.liveSession.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { course: { select: { title: true } }, attendance: { select: { joinedAt: true, excuse: true, override: true } } },
    }),
    db.report.findMany({ where: { type: "ATTENDANCE" }, select: { refId: true } }),
  ]);
  const made = new Set(reports.map((r) => r.refId));
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    endedAt: s.endedAt,
    joinOpensMinutes: s.joinOpensMinutes,
    course: s.course,
    present: s.attendance.filter((a) => (a.override ? a.override === "PRESENT" : !!a.joinedAt)).length,
    excused: s.attendance.filter((a) => !(a.override ? a.override === "PRESENT" : !!a.joinedAt) && a.excuse).length,
    hasReport: made.has(s.id),
  }));
}

export async function activeCourseOptions() {
  return db.course.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT", "ENDED"] } }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, title: true } });
}
