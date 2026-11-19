import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, ClipboardList, FileQuestion, Megaphone, Target, Trophy, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { approvedCourseIds, sessionEnd } from "@/lib/access";
import { courseProgress, studentStats } from "@/lib/student";
import { fmt, relative } from "@/lib/time";
import { formatEGP } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, StatCard } from "@/components/ui/misc";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SessionCard } from "@/components/student/session-card";
import { CourseCover } from "@/components/site/course-card";

export default async function StudentOverview() {
  const user = await requireStudent();
  const courseIds = await approvedCourseIds(user.id);
  const now = new Date();
  const [courses, stats, pending, announcements, openCourses] = await Promise.all([
    db.course.findMany({ where: { id: { in: courseIds } }, orderBy: { createdAt: "asc" } }),
    studentStats(user.id, courseIds),
    db.enrollment.findMany({ where: { userId: user.id, status: { in: ["PENDING", "REJECTED"] } }, include: { course: true } }),
    db.announcement.findMany({
      where: { OR: [{ courseId: { in: courseIds } }, { courseId: null }] },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: { author: { select: { fullName: true } }, course: { select: { title: true } } },
    }),
    db.course.findMany({ where: { status: "PUBLISHED", enrollmentOpen: true, id: { notIn: courseIds } }, orderBy: { sortOrder: "asc" }, take: 2 }),
  ]);
  const progress = await Promise.all(courses.map((c) => courseProgress(user.id, c.id)));
  const enrollments = await db.enrollment.findMany({ where: { userId: user.id, courseId: { in: courseIds } }, select: { courseId: true, submittedAt: true } });
  const joined = new Map(enrollments.map((e) => [e.courseId, e.submittedAt]));
  const courseTitle = new Map(courses.map((c) => [c.id, c.title]));

  const upcoming = stats.sessions.filter((s) => sessionEnd(s) > now).slice(0, 2);
  const due = stats.assessments.filter((a) => a.dueAt > now && !a.submissions.some((s) => s.submittedAt) && (!a.opensAt || a.opensAt <= now)).slice(0, 5);
  const firstName = user.fullName.split(" ")[0];
  const hour = Number(fmt(now, "H"));
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">{greet}</p>
              <h1 className="mt-3 font-display text-3xl font-light tracking-tight sm:text-4xl">Welcome back, {firstName}.</h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                {due.length ? `You have ${due.length} assignment${due.length > 1 ? "s" : ""} due soon. Keep the streak going!` : courses.length ? "You're all caught up. Great work — review a lesson or check your analytics." : "Enroll in a course to unlock lessons, live sessions and quizzes."}
              </p>
            </div>
            {courses.length > 0 && (
              <div className="flex gap-4">
                <div className="border-l border-border pl-5">
                  <p className="font-display text-3xl font-light">{stats.attendanceRate ?? "—"}{stats.attendanceRate !== null && "%"}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Attendance</p>
                </div>
                <div className="border-l border-border pl-5">
                  <p className="font-display text-3xl font-light">{stats.quizAvg ?? "—"}{stats.quizAvg !== null && "%"}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Quiz average</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((e) => (
            <div key={e.id} className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${e.status === "PENDING" ? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20" : "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/20"}`}>
              <div>
                <p className="font-bold">{e.status === "PENDING" ? "Payment under review" : "Payment needs attention"} — {e.course.title}</p>
                <p className="text-sm text-muted-foreground">
                  {e.status === "PENDING" ? `Submitted ${relative(e.submittedAt)}. You'll be notified as soon as it's approved.` : `Reason: ${e.rejectionReason ?? "Please contact the team."}`}
                </p>
              </div>
              <ButtonLink href={`/dashboard/enroll/${e.courseId}`} size="sm" variant={e.status === "PENDING" ? "secondary" : "accent"}>
                {e.status === "PENDING" ? "View status" : "Resubmit payment"}
              </ButtonLink>
            </div>
          ))}
        </div>
      )}

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="You're not enrolled in a course yet"
          description="Pick a course, pay with InstaPay or Vodafone Cash and upload your screenshot. Your dashboard lights up once you're approved."
          action={<ButtonLink href="/dashboard/courses" variant="accent">Browse courses</ButtonLink>}
        />
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StaggerItem><StatCard label="Homework average" value={stats.homeworkAvg !== null ? `${stats.homeworkAvg}%` : "—"} icon={<ClipboardList />} tone="success" /></StaggerItem>
            <StaggerItem><StatCard label="Quiz average" value={stats.quizAvg !== null ? `${stats.quizAvg}%` : "—"} icon={<Trophy />} tone="ember" /></StaggerItem>
            <StaggerItem><StatCard label="Sessions attended" value={`${stats.sessionsAttended}/${stats.sessionsHeld}`} icon={<Video />} /></StaggerItem>
            <StaggerItem><StatCard label="Missed deadlines" value={stats.missed} icon={<Target />} tone={stats.missed ? "danger" : "violet"} /></StaggerItem>
          </Stagger>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader title="Next live sessions" icon={<CalendarClock />} action={<Link href="/dashboard/schedule" className="text-sm font-semibold text-primary hover:underline">Schedule</Link>} />
                <CardBody className="space-y-3">
                  {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming sessions yet — they&apos;ll appear here as soon as they&apos;re scheduled.</p>}
                  {upcoming.map((s) => (
                    <SessionCard
                      key={s.id}
                      s={{
                        id: s.id,
                        title: s.title,
                        description: s.description,
                        courseTitle: courseTitle.get(s.courseId) ?? "",
                        startsAt: s.startsAt.toISOString(),
                        endsAt: sessionEnd(s).toISOString(),
                        joinOpensMinutes: s.joinOpensMinutes,
                        present: s.attendance[0]?.override ? s.attendance[0].override === "PRESENT" : !!s.attendance[0]?.joinedAt,
                        excuse: s.attendance[0]?.excuse ?? null,
                        recordingUrl: s.recordingUrl,
                        enrolledAfter: (joined.get(s.courseId) ?? now) > sessionEnd(s),
                      }}
                    />
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="My courses" icon={<BookOpen />} />
                <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {courses.map((c, i) => (
                    <Link key={c.id} href={`/dashboard/courses/${c.id}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/20">
                      <CourseCover coverKey={c.coverKey} level={c.level} title={c.title} className="h-24" />
                      <div className="p-4">
                        <p className="line-clamp-1 font-bold">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {progress[i]!.lessonsDone}/{progress[i]!.lessons} lessons · {progress[i]!.assessmentsDone}/{progress[i]!.assessments} assignments
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <ProgressBar value={progress[i]!.percent} />
                          <span className="text-xs font-bold">{progress[i]!.percent}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardBody>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Due soon" icon={<FileQuestion />} />
                <CardBody className="space-y-2.5">
                  {due.length === 0 && <p className="text-sm text-muted-foreground">Nothing due right now.</p>}
                  {due.map((a) => (
                    <Link prefetch={false} key={a.id} href={`/dashboard/assessments/${a.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-brand-300 hover:border-foreground/20">
                      <span className={`grid size-9 place-items-center rounded-lg border border-border ${a.type === "QUIZ" ? "text-ember-600 dark:text-ember-400" : "text-success"}`}>
                        {a.type === "QUIZ" ? <FileQuestion className="size-4" /> : <ClipboardList className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{a.title}</span>
                        <span className="text-xs text-muted-foreground">Due {relative(a.dueAt)} · {fmt(a.dueAt, "EEE h:mm a")}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Overall progress" icon={<Target />} />
                <CardBody className="flex items-center gap-6">
                  <ProgressRing value={progress.length ? Math.round(progress.reduce((s, p) => s + p.percent, 0) / progress.length) : 0} sublabel="complete" tone="ember" />
                  <div className="space-y-1.5 text-sm">
                    <p><span className="font-bold">{progress.reduce((s, p) => s + p.lessonsDone, 0)}</span> lessons completed</p>
                    <p><span className="font-bold">{progress.reduce((s, p) => s + p.assessmentsDone, 0)}</span> assignments submitted</p>
                    <Link href="/dashboard/analytics" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                      Full analytics <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Announcements" icon={<Megaphone />} />
                <CardBody className="space-y-3">
                  {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
                  {announcements.map((a) => (
                    <div key={a.id} className="rounded-xl border border-border p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.isPinned && <Badge tone="ember">Pinned</Badge>}
                        <p className="text-sm font-bold">{a.title}</p>
                      </div>
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                      <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
                        {a.author?.fullName ?? "Bioacademy"} · {relative(a.createdAt)}
                        {a.course ? ` · ${a.course.title}` : ""}
                      </p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}

      {openCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {openCourses.map((c) => (
            <div key={c.id} className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
              <Badge tone="ember">{c.level === "ADVANCED" ? "Next step" : "Now enrolling"}</Badge>
              <p className="mt-3 text-lg font-semibold">{c.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xl font-display font-light">{formatEGP(c.price)}</p>
                <ButtonLink href={`/dashboard/enroll/${c.id}`} variant="accent" size="sm">
                  Enroll <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
