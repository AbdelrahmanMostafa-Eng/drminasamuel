import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections";
import { ScheduleCalendar } from "@/components/app/calendar";
import { EmptyState } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CalendarOff } from "lucide-react";

export const metadata: Metadata = { title: "Session schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const settings = await getSettings();
  const sessions = settings.showPublicSchedule
    ? await db.liveSession.findMany({
        where: { course: { status: { in: ["PUBLISHED"] } }, startsAt: { gte: new Date(Date.now() - 60 * 86400_000) } },
        orderBy: { startsAt: "asc" },
        include: { course: { select: { title: true } } },
      })
    : [];
  return (
    <>
      <PageHero eyebrow="Schedule" title="Live session schedule." description="All times are Cairo time. Enrolled students join from their dashboard — the Join button marks attendance automatically." />
      <section className="px-6 pb-32 pt-12 md:px-12" data-gradient-bar>
        <div className="mx-auto max-w-6xl">
          {settings.showPublicSchedule ? (
            <ScheduleCalendar
              events={sessions.map((s) => ({ id: s.id, title: s.title, start: s.startsAt.toISOString(), end: s.endsAt.toISOString(), kind: "session" as const, courseTitle: s.course.title }))}
              emptyText="No live session on this day."
            />
          ) : (
            <EmptyState icon={<CalendarOff />} title="Schedule available to students" description="Sign in to your dashboard to see your session schedule." />
          )}
        </div>
      </section>
    </>
  );
}
