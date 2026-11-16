import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Announcements } from "@/components/admin/announcements";

export default async function AnnouncementsPage() {
  await requireStaff("announcements");
  const [items, courses] = await Promise.all([
    db.announcement.findMany({ orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], include: { course: { select: { title: true } }, author: { select: { fullName: true } } } }),
    db.course.findMany({ where: { status: { in: ["PUBLISHED", "ENDED"] } }, select: { id: true, title: true } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Teaching" title="Announcements" description="Broadcast updates to a course or to all students — they appear on dashboards with a notification." />
      <Announcements
        courses={courses}
        items={items.map((a) => ({ id: a.id, title: a.title, body: a.body, isPinned: a.isPinned, courseId: a.courseId, course: a.course?.title ?? null, author: a.author?.fullName ?? null, createdAt: a.createdAt.toISOString() }))}
      />
    </>
  );
}
