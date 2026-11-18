import Link from "next/link";
import { ArrowRight, BookOpen, CalendarPlus, CreditCard, FileText, MessageCircle, Plus, ShieldAlert, Users, Video, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can, PERMISSIONS, type Permission } from "@/lib/permissions";
import { sessionEnd, sessionPhase } from "@/lib/access";
import { fmt, relative } from "@/lib/time";
import { formatEGP, fileUrl } from "@/lib/utils";
import { PageHeader, StatCard, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { ReportButton } from "@/components/admin/report-button";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  const user = await requireStaff();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400_000);
  const [students, pending, revenueAgg, sessions, pendingList, reportsMade, endedSessions, closedAssessments, questions, activity] = await Promise.all([
    db.enrollment.count({ where: { status: "APPROVED", course: { status: { in: ["PUBLISHED", "ENDED"] } } } }),
    db.enrollment.count({ where: { status: "PENDING" } }),
    db.enrollment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    db.liveSession.findMany({ where: { endsAt: { gte: now, lte: weekAhead } }, orderBy: { startsAt: "asc" }, take: 5, include: { course: { select: { title: true } }, _count: { select: { attendance: { where: { joinedAt: { not: null } } } } } } }),
    can(user, "payments") ? db.enrollment.findMany({ where: { status: "PENDING" }, orderBy: { submittedAt: "asc" }, take: 5, include: { user: true, course: true } }) : Promise.resolve([]),
    db.report.findMany({ select: { refId: true } }),
    db.liveSession.findMany({ where: { endsAt: { lte: now, gte: new Date(now.getTime() - 21 * 86400_000) } }, orderBy: { endsAt: "desc" }, include: { course: { select: { title: true } } } }),
    db.assessment.findMany({ where: { dueAt: { lte: now, gte: new Date(now.getTime() - 21 * 86400_000) }, isPublished: true }, orderBy: { dueAt: "desc" }, include: { course: { select: { title: true } } } }),
    db.lessonComment.findMany({ where: { parentId: null, user: { role: "STUDENT" }, replies: { none: {} } }, orderBy: { createdAt: "desc" }, take: 5, include: { user: true, lesson: true } }),
    user.role === "MASTER" ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }) : Promise.resolve([]),
  ]);
  const archived = await db.course.aggregate({ _sum: { finalRevenue: true } });
  const done = new Set(reportsMade.map((r) => r.refId));
  const readyReports = [
    ...endedSessions.filter((s) => !done.has(s.id)).map((s) => ({ id: s.id, type: "ATTENDANCE" as const, title: s.title, course: s.course.title, when: sessionEnd(s) })),
    ...closedAssessments.filter((a) => !done.has(a.id)).map((a) => ({ id: a.id, type: "GRADES" as const, title: a.title, course: a.course.title, when: a.dueAt })),
  ].slice(0, 6);
  const firstName = user.fullName.replace(/^Dr\.?\s*/, "").split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={user.role === "MASTER" ? "Master dashboard" : "Assistant dashboard"}
        title={`Welcome, ${user.role === "MASTER" ? "Dr. " : ""}${firstName}`}
        description={`${fmt(now, "EEEE, d MMMM yyyy")} · Here's what needs your attention today.`}
        actions={
          <>
            {can(user, "courses") && (
              <ButtonLink href="/admin/courses/new" variant="accent">
                <Plus className="size-4" /> New course
              </ButtonLink>
            )}
            {can(user, "sessions") && (
              <ButtonLink href="/admin/schedule?new=1" variant="secondary">
                <CalendarPlus className="size-4" /> Schedule session
              </ButtonLink>
            )}
          </>
        }
      />
      {sp.denied && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldAlert className="size-5" />
          You don&apos;t have the “{PERMISSIONS[sp.denied as Permission]?.label ?? "master admin"}” permission. Ask Dr. Mina to enable it.
        </div>
      )}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem><StatCard label="Active students" value={students} icon={<Users />} hint="Approved enrollments" /></StaggerItem>
        <StaggerItem><StatCard label="Payments to review" value={pending} icon={<CreditCard />} tone={pending ? "ember" : "success"} hint={pending ? "Waiting for approval" : "All caught up"} /></StaggerItem>
        <StaggerItem><StatCard label="Sessions this week" value={sessions.length} icon={<Video />} tone="violet" /></StaggerItem>
        <StaggerItem>
          {can(user, "revenue") ? (
            <StatCard label="Total revenue" value={formatEGP((revenueAgg._sum.amount ?? 0) + (archived._sum.finalRevenue ?? 0))} icon={<Wallet />} tone="success" hint="All courses incl. archived" />
          ) : (
            <StatCard label="Reports ready" value={readyReports.length} icon={<FileText />} tone="success" />
          )}
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming live sessions" icon={<Video />} action={<Link href="/admin/schedule" className="text-sm font-semibold text-primary hover:underline">All sessions</Link>} />
            <CardBody className="space-y-2.5">
              {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions in the next 7 days.</p>}
              {sessions.map((s) => {
                const phase = sessionPhase(s);
                return (
                  <Link key={s.id} href={`/admin/sessions/${s.id}`} className="flex items-center gap-4 rounded-2xl border border-border p-3.5 transition hover:border-foreground/20">
                    <div className="grid w-14 shrink-0 place-items-center rounded-lg border border-border py-1.5">
                      <span className="text-[0.6rem] font-bold uppercase">{fmt(s.startsAt, "EEE")}</span>
                      <span className="text-lg font-semibold leading-none">{fmt(s.startsAt, "d")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{s.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.course.title} · {fmt(s.startsAt, "h:mm a")} – {fmt(s.endsAt, "h:mm a")}</p>
                    </div>
                    {phase === "live" ? <Badge tone="danger" className="animate-pulse">Live · {s._count.attendance} in</Badge> : <Badge tone="neutral">{relative(s.startsAt)}</Badge>}
                  </Link>
                );
              })}
            </CardBody>
          </Card>

          {can(user, "reports") && (
            <Card>
              <CardHeader title="Reports ready to generate" description="Sessions that ended and assessments past their deadline" icon={<FileText />} action={<Link href="/admin/reports" className="text-sm font-semibold text-primary hover:underline">Archive</Link>} />
              <CardBody className="space-y-2.5">
                {readyReports.length === 0 && <p className="text-sm text-muted-foreground">Nothing pending — every recent report has been generated.</p>}
                {readyReports.map((r) => (
                  <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border p-3.5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={r.type === "ATTENDANCE" ? "brand" : "ember"}>{r.type === "ATTENDANCE" ? "Attendance" : "Grades"}</Badge>
                        <p className="truncate font-semibold">{r.title}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.course} · ended {relative(r.when)}</p>
                    </div>
                    <ReportButton type={r.type} refId={r.id} size="sm" label="Generate PDF" />
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {can(user, "payments") && (
            <Card>
              <CardHeader title="Payments waiting" icon={<CreditCard />} action={<Link href="/admin/payments" className="text-sm font-semibold text-primary hover:underline">Review</Link>} />
              <CardBody className="space-y-2.5">
                {pendingList.length === 0 && <p className="text-sm text-muted-foreground">No payments waiting.</p>}
                {pendingList.map((e) => (
                  <Link key={e.id} href="/admin/payments" className="flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:border-foreground/20">
                    {e.proofKey !== "manual" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(e.proofKey)!} alt="" className="size-11 rounded-xl border border-border object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{e.user.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.course.title} · {formatEGP(e.amount)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{relative(e.submittedAt)}</span>
                  </Link>
                ))}
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Unanswered student questions" icon={<MessageCircle />} />
            <CardBody className="space-y-2.5">
              {questions.length === 0 && <p className="text-sm text-muted-foreground">No open questions.</p>}
              {questions.map((q) => (
                <Link key={q.id} href={`/admin/courses/${q.lesson.courseId}/lessons/${q.lessonId}#qa`} className="flex gap-3 rounded-2xl border border-border p-3 transition hover:border-foreground/20">
                  <Avatar name={q.user.fullName} size={34} />
                  <div className="min-w-0">
                    <p className="text-sm"><b>{q.user.fullName}</b> <span className="text-muted-foreground">on {q.lesson.title}</span></p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{q.body}</p>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>
          {user.role === "MASTER" && (
            <Card>
              <CardHeader title="Recent activity" icon={<BookOpen />} action={<Link href="/admin/activity" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">All <ArrowRight className="size-3.5" /></Link>} />
              <CardBody className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-400" />
                    <p className="min-w-0">
                      <b>{a.actorName}</b> <span className="text-muted-foreground">{a.action.replace(/[._]/g, " ")}</span> {a.details && <span className="text-foreground/80">— {a.details}</span>}
                      <span className="block text-xs text-muted-foreground">{relative(a.createdAt)}</span>
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
