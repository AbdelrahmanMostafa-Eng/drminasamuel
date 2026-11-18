import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardCheck, MonitorSmartphone, Phone, School, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { studentStats, courseProgress } from "@/lib/student";
import { sessionEnd } from "@/lib/access";
import { bestAttempts } from "@/lib/grading";
import { fileUrl, formatEGP, formatPhone, waLink } from "@/lib/utils";
import { fmt, relative } from "@/lib/time";
import { Avatar, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { StudentActions } from "@/components/admin/student-tools";
import { RemoveEnrollmentButton } from "@/components/admin/remove-enrollment";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { ScoreTrend } from "@/components/charts/charts";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireStaff();
  if (!can(me, "students") && !can(me, "payments") && !can(me, "grades")) redirect("/admin?denied=students");
  const s = await db.user.findUnique({
    where: { id },
    include: { enrollments: { include: { course: true }, orderBy: { submittedAt: "desc" } }, sessions: { where: { revokedAt: null }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!s || s.role !== "STUDENT") notFound();
  const approved = s.enrollments.filter((e) => e.status === "APPROVED").map((e) => e.courseId);
  const [stats, progress, courses] = await Promise.all([
    studentStats(s.id, approved),
    Promise.all(approved.map((c) => courseProgress(s.id, c))),
    db.course.findMany({ where: { status: { in: ["PUBLISHED", "ENDED"] }, id: { notIn: approved } }, select: { id: true, title: true } }),
  ]);
  const now = new Date();
  const device = s.sessions[0];
  const ended = stats.sessions.filter((x) => sessionEnd(x) <= now).reverse();

  return (
    <>
      <Link href="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Students
      </Link>
      <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={s.fullName} src={fileUrl(s.avatarKey)} size={72} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-display font-light">{s.fullName}</h1>
              {!s.isActive && <Badge tone="danger">Suspended</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {s.whatsapp && (
                <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#128c7e] dark:text-[#25d366]">
                  <WhatsAppIcon className="size-4" /> {formatPhone(s.whatsapp)}
                </a>
              )}
              {s.email && <span>{s.email}</span>}
              {s.parentPhone && <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> Parent: {formatPhone(s.parentPhone)}</span>}
              {s.school && <span className="inline-flex items-center gap-1"><School className="size-3.5" /> {s.school}</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Joined {fmt(s.createdAt, "d MMM yyyy")} · last sign-in {s.lastLoginAt ? relative(s.lastLoginAt) : "never"}</p>
          </div>
        </div>
        <StudentActions
          student={{ id: s.id, fullName: s.fullName, whatsapp: s.whatsapp, email: s.email, parentPhone: s.parentPhone, isActive: s.isActive }}
          courses={courses}
          canStudents={can(me, "students")}
          canPayments={can(me, "payments")}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Homework average" value={stats.homeworkAvg !== null ? `${stats.homeworkAvg}%` : "—"} tone="success" />
        <StatCard label="Quiz average" value={stats.quizAvg !== null ? `${stats.quizAvg}%` : "—"} tone="ember" />
        <StatCard label="Attendance" value={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "—"} hint={`${stats.sessionsAttended}/${stats.sessionsHeld} sessions`} />
        <StatCard label="Missed deadlines" value={stats.missed} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Enrollments & payments" icon={<BookOpen />} />
          <CardBody className="space-y-3">
            {s.enrollments.length === 0 && <p className="text-sm text-muted-foreground">Not enrolled in any course.</p>}
            {s.enrollments.map((e) => {
              const pi = approved.indexOf(e.courseId);
              return (
                <div key={e.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/admin/courses/${e.courseId}`} className="font-bold hover:text-primary">{e.course.title}</Link>
                    <div className="flex items-center gap-2">
                      <Badge tone={e.status === "APPROVED" ? "success" : e.status === "PENDING" ? "warning" : "danger"}>{e.status.toLowerCase()}</Badge>
                      {can(me, "students") && <RemoveEnrollmentButton id={e.id} course={e.course.title} />}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatEGP(e.amount)} · {e.proofKey === "manual" ? "added manually" : e.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash"} · {fmt(e.submittedAt, "d MMM yyyy")}
                    {e.proofKey !== "manual" && (
                      <> · <a href={fileUrl(e.proofKey)!} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">screenshot</a></>
                    )}
                  </p>
                  {pi >= 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={progress[pi]!.percent} />
                      <span className="text-xs font-bold">{progress[pi]!.percent}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Score trend" icon={<ClipboardCheck />} />
          <CardBody>
            <ScoreTrend data={stats.timeline.map((t) => ({ label: t.title, score: t.percent }))} height={240} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Homework & quizzes" icon={<ClipboardCheck />} />
          <CardBody className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin">
            {stats.assessments.filter((a) => a.dueAt <= now || a.submissions.some((x) => x.submittedAt)).reverse().map((a) => {
              const b = bestAttempts(a.submissions).get(s.id);
              return (
                <Link key={a.id} href={`/admin/assessments/${a.id}?tab=results`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm hover:bg-muted/40">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{a.title}</span>
                    <span className="text-xs text-muted-foreground">{a.type === "QUIZ" ? "Quiz" : "Homework"} · {fmt(a.dueAt, "d MMM")}</span>
                  </span>
                  {b ? <Badge tone="success">{b.score}/{b.total}</Badge> : <Badge tone="danger">Not done · 0</Badge>}
                </Link>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Attendance history" icon={<Video />} />
          <CardBody className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin">
            {ended.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
            {ended.map((x) => {
              const a = x.attendance[0];
              const present = a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
              return (
                <Link key={x.id} href={`/admin/sessions/${x.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm hover:bg-muted/40">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{x.title}</span>
                    <span className="text-xs text-muted-foreground">{fmt(x.startsAt, "EEE d MMM")}</span>
                  </span>
                  {present ? <Badge tone="success">Present</Badge> : a?.excuse ? <Badge tone="warning" title={a.excuse}>Absent · Excuse Given</Badge> : <Badge tone="danger">Absent · Excuse NOT Given</Badge>}
                </Link>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Signed-in device" icon={<MonitorSmartphone />} description="One device at a time" />
          <CardBody className="text-sm">
            {device ? (
              <>
                <p className="font-semibold">{device.device}</p>
                <p className="text-muted-foreground">Since {fmt(device.createdAt)} · last active {relative(device.lastSeenAt)}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Not signed in on any device.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
