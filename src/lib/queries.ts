import "server-only";
import { db } from "./db";

export async function getPublicCourses() {
  const courses = await db.course.findMany({
    where: { status: { in: ["PUBLISHED", "ENDED"] } },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      prerequisite: { select: { title: true } },
      _count: { select: { chapters: { where: { isPublished: true } }, lessons: { where: { isPublished: true } } } },
    },
  });
  return courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    level: c.level,
    track: c.track,
    batchLabel: c.batchLabel,
    price: c.price,
    coverKey: c.coverKey,
    startDate: c.startDate,
    enrollmentOpen: c.enrollmentOpen && c.status === "PUBLISHED",
    status: c.status,
    chapters: c._count.chapters,
    lessons: c._count.lessons,
    prerequisiteTitle: c.prerequisite?.title ?? null,
  }));
}

export async function getUpcomingPublicSessions(limit = 6) {
  const now = new Date();
  const sessions = await db.liveSession.findMany({
    where: { endsAt: { gte: now }, course: { status: "PUBLISHED" } },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: { course: { select: { title: true } } },
  });
  return sessions.map((s) => ({ id: s.id, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt, courseTitle: s.course.title }));
}
