import { CalendarDays } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { approvedCourseIds, sessionEnd } from "@/lib/access";
import { PageHeader, EmptyState, SectionTitle } from "@/components/ui/misc";
import { ScheduleCalendar } from "@/components/app/calendar";
import { SessionCard } from "@/components/student/session-card";
import { StateNotice } from "@/components/student/state-notice";

export default async function StudentSchedulePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const sp = await searchParams;
  const user = await requireStudent();
  const courseIds = await approvedCourseIds(user.id);
  const now = new Date();
  const [sessions, assessments, enrollments] = await Promise.all([
    db.liveSession.findMany({ where: { courseId: { in: courseIds } }, include: { course: { select: { title: true } }, attendance: { where: { userId: user.id } } }, orderBy: { startsAt: "asc" } }),
    db.assessment.findMany({ where: { courseId: { in: courseIds }, isPublished: true }, include: { course: { select: { title: true } } } }),
    db.enrollment.findMany({ where: { userId: user.id, courseId: { in: courseIds } }, select: { courseId: true, submittedAt: true } }),
  ]);
  const joined = new Map(enrollments.map((e) => [e.courseId, e.submittedAt]));
  const toCard = (s: (typeof sessions)[number]) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    courseTitle: s.course.title,
    startsAt: s.startsAt.toISOString(),
    endsAt: sessionEnd(s).toISOString(),
    joinOpensMinutes: s.joinOpensMinutes,
    present: s.attendance[0]?.override ? s.attendance[0].override === "PRESENT" : !!s.attendance[0]?.joinedAt,
    excuse: s.attendance[0]?.excuse ?? null,
    recordingUrl: s.recordingUrl,
    enrolledAfter: (joined.get(s.courseId) ?? now) > sessionEnd(s),
  });
  const upcoming = sessions.filter((s) => sessionEnd(s) > now);
  const past = sessions.filter((s) => sessionEnd(s) <= now).reverse();

  return (
    <>
      <PageHeader eyebrow="Live sessions" title="Schedule" description="Press Join session to enter Zoom — that click marks you present. Can't make it? Submit an excuse before the session ends." />
      {sp.notice && <StateNotice text={sp.notice} />}
      {courseIds.length === 0 ? (
        <EmptyState icon={<CalendarDays />} title="No schedule yet" description="Your sessions appear here once you're enrolled in a course." />
      ) : (
        <div className="space-y-10">
          <div className="space-y-3">
            <SectionTitle>Upcoming</SectionTitle>
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming sessions.</p>}
            {upcoming.map((s) => (
              <SessionCard key={s.id} s={toCard(s)} />
            ))}
          </div>
          <div>
            <SectionTitle>Calendar</SectionTitle>
            <ScheduleCalendar
              events={[
                ...sessions.map((s) => ({ id: s.id, title: s.title, start: s.startsAt.toISOString(), end: sessionEnd(s).toISOString(), kind: "session" as const, courseTitle: s.course.title })),
                ...assessments.map((a) => ({ id: a.id, title: a.title, start: a.dueAt.toISOString(), kind: a.type === "QUIZ" ? ("quiz" as const) : ("homework" as const), courseTitle: a.course.title, href: `/dashboard/assessments/${a.id}` })),
              ]}
            />
          </div>
          {past.length > 0 && (
            <div className="space-y-3">
              <SectionTitle>Past sessions & attendance</SectionTitle>
              {past.map((s) => (
                <SessionCard key={s.id} s={toCard(s)} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
