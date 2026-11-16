import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sessionEnd } from "@/lib/access";
import { adminSessions } from "@/lib/admin-data";
import { db } from "@/lib/db";
import { SectionTitle } from "@/components/ui/misc";
import { NewSessionButton } from "@/components/admin/session-dialog";
import { AdminSessionList } from "@/components/admin/session-list";

export default async function CourseSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const [sessions, course] = await Promise.all([adminSessions({ courseId: id }), db.course.findUniqueOrThrow({ where: { id }, select: { id: true, title: true } })]);
  const now = new Date();
  return (
    <div className="space-y-8">
      {can(user, "sessions") && (
        <div className="flex justify-end">
          <NewSessionButton courses={[course]} courseId={id} />
        </div>
      )}
      <div>
        <SectionTitle>Upcoming & live</SectionTitle>
        <AdminSessionList sessions={sessions.filter((s) => sessionEnd(s) > now)} empty="No upcoming sessions for this course." />
      </div>
      <div>
        <SectionTitle>Past</SectionTitle>
        <AdminSessionList sessions={sessions.filter((s) => sessionEnd(s) <= now).reverse()} empty="No past sessions." />
      </div>
    </div>
  );
}
