import { requireStaff, requireStaffAny } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sessionEnd } from "@/lib/access";
import { adminSessions, activeCourseOptions } from "@/lib/admin-data";
import { db } from "@/lib/db";
import { PageHeader, SectionTitle } from "@/components/ui/misc";
import { NewSessionButton } from "@/components/admin/session-dialog";
import { AdminSessionList } from "@/components/admin/session-list";
import { ScheduleCalendar } from "@/components/app/calendar";

export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const user = await requireStaffAny(["sessions", "attendance"]);
  const [sessions, courses, assessments] = await Promise.all([
    adminSessions(),
    activeCourseOptions(),
    db.assessment.findMany({ where: { course: { status: { not: "ARCHIVED" } } }, include: { course: { select: { title: true } } } }),
  ]);
  const now = new Date();
  const upcoming = sessions.filter((s) => sessionEnd(s) > now);
  const past = sessions.filter((s) => sessionEnd(s) <= now).reverse().slice(0, 30);
  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Sessions & schedule"
        description="Post Zoom links, watch live attendance, and download attendance PDFs once a session ends."
        actions={can(user, "sessions") && <NewSessionButton courses={courses} autoOpen={sp.new === "1"} />}
      />
      <div className="space-y-10">
        <div>
          <SectionTitle>Upcoming & live</SectionTitle>
          <AdminSessionList sessions={upcoming} empty="No upcoming sessions — schedule one!" />
        </div>
        <div>
          <SectionTitle>Calendar</SectionTitle>
          <ScheduleCalendar
            events={[
              ...sessions.map((s) => ({ id: s.id, title: s.title, start: s.startsAt.toISOString(), end: sessionEnd(s).toISOString(), kind: "session" as const, courseTitle: s.course.title, href: `/admin/sessions/${s.id}` })),
              ...assessments.map((a) => ({ id: a.id, title: a.title, start: a.dueAt.toISOString(), kind: a.type === "QUIZ" ? ("quiz" as const) : ("homework" as const), courseTitle: a.course.title, href: `/admin/assessments/${a.id}` })),
            ]}
          />
        </div>
        <div>
          <SectionTitle>Past sessions</SectionTitle>
          <AdminSessionList sessions={past} empty="No past sessions yet." />
        </div>
      </div>
    </>
  );
}
