import Link from "next/link";
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, TrendingUp, Trophy, Users, Video, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sessionEnd } from "@/lib/access";
import { bestAttempts, type QOption } from "@/lib/grading";
import { fmt } from "@/lib/time";
import { cn, formatEGP } from "@/lib/utils";
import { PageHeader, StatCard, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleBars, StackedAttendance, TrendArea, Donut, C } from "@/components/charts/charts";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const sp = await searchParams;
  const user = await requireStaff("analytics");
  const courses = await db.course.findMany({ where: { status: { in: ["PUBLISHED", "ENDED"] } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, price: true } });
  const courseId = sp.course && courses.some((c) => c.id === sp.course) ? sp.course : courses[0]?.id;
  if (!courseId) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Analytics" />
        <p className="text-muted-foreground">Publish a course to see analytics.</p>
      </>
    );
  }
  const now = new Date();
  const [enrollments, sessions, assessments, lessons, progress] = await Promise.all([
    db.enrollment.findMany({ where: { courseId }, include: { user: { select: { id: true, fullName: true } } } }),
    db.liveSession.findMany({ where: { courseId }, orderBy: { startsAt: "asc" }, include: { attendance: true } }),
    db.assessment.findMany({ where: { courseId, isPublished: true }, orderBy: { dueAt: "asc" }, include: { submissions: { where: { submittedAt: { not: null } } }, questions: true } }),
    db.lesson.findMany({ where: { courseId, isPublished: true }, orderBy: [{ chapter: { sortOrder: "asc" } }, { sortOrder: "asc" }], select: { id: true, title: true } }),
    db.lessonProgress.findMany({ where: { lesson: { courseId }, completedAt: { not: null } }, select: { userId: true, lessonId: true } }),
  ]);
  const approved = enrollments.filter((e) => e.status === "APPROVED");
  const approvedIds = new Set(approved.map((e) => e.userId));
  const ended = sessions.filter((s) => sessionEnd(s) <= now);
  const closed = assessments.filter((a) => a.dueAt <= now);

  const attendanceData = ended.slice(-12).map((s) => {
    let present = 0, excused = 0, unexcused = 0;
    for (const e of approved) {
      if (e.submittedAt > sessionEnd(s)) continue;
      const a = s.attendance.find((x) => x.userId === e.userId);
      const p = a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
      if (p) present++;
      else if (a?.excuse) excused++;
      else unexcused++;
    }
    return { label: s.title, present, excused, unexcused };
  });
  const totalSlots = attendanceData.reduce((s, d) => s + d.present + d.excused + d.unexcused, 0);
  const attRate = totalSlots ? Math.round((attendanceData.reduce((s, d) => s + d.present, 0) / totalSlots) * 100) : 0;

  const scoreData = closed.slice(-12).map((a) => {
    const best = [...bestAttempts(a.submissions).values()].filter((b) => approvedIds.has(b.userId));
    const avg = best.length ? Math.round((best.reduce((s, b) => s + (b.score ?? 0) / (b.total || 1), 0) / best.length) * 100) : 0;
    return { label: a.title, value: avg };
  });
  const completion = closed.length
    ? Math.round((closed.reduce((s, a) => s + [...bestAttempts(a.submissions).keys()].filter((u) => approvedIds.has(u)).length, 0) / (closed.length * Math.max(1, approved.length))) * 100)
    : 0;

  // per-student aggregates
  const perStudent = approved.map((e) => {
    const scores = closed
      .filter((a) => e.submittedAt <= a.dueAt || a.submissions.some((s) => s.userId === e.userId))
      .map((a) => {
        const b = bestAttempts(a.submissions.filter((s) => s.userId === e.userId)).get(e.userId);
        return b && b.total ? (b.score ?? 0) / b.total : 0;
      });
    const avg = scores.length ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 100) : null;
    const mine = ended.filter((s) => e.submittedAt <= sessionEnd(s));
    const att = mine.filter((s) => {
      const a = s.attendance.find((x) => x.userId === e.userId);
      return a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
    }).length;
    const attPct = mine.length ? Math.round((att / mine.length) * 100) : null;
    const done = progress.filter((p) => p.userId === e.userId).length;
    return { id: e.userId, name: e.user.fullName, avg, att: attPct, lessons: done };
  });
  const top = perStudent.filter((s) => s.avg !== null).sort((a, b) => b.avg! - a.avg!).slice(0, 6);
  const risk = perStudent.filter((s) => (s.avg !== null && s.avg < 50) || (s.att !== null && s.att < 60)).slice(0, 8);

  // hardest questions across closed assessments
  const hardest = closed
    .flatMap((a) => {
      const best = [...bestAttempts(a.submissions).values()];
      return a.questions.map((q) => {
        const ans = best.map((b) => (b.answers as Record<string, string>)[q.id]);
        const correct = ans.filter((x) => x === q.correctOptionId).length;
        return { id: q.id, text: q.text, assessment: a.title, assessmentId: a.id, pct: ans.length ? Math.round((correct / ans.length) * 100) : 100, n: ans.length, top: (q.options as QOption[]).find((o) => o.id === q.correctOptionId)?.text };
      });
    })
    .filter((q) => q.n > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  // lesson completion funnel
  const lessonData = lessons.slice(0, 16).map((l) => ({ label: l.title, value: approved.length ? Math.round((progress.filter((p) => p.lessonId === l.id && approvedIds.has(p.userId)).length / approved.length) * 100) : 0 }));

  // enrollments over time (approved by week)
  const weeks: { label: string; value: number }[] = [];
  for (let i = 9; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 86400_000);
    const end = new Date(now.getTime() - i * 7 * 86400_000);
    weeks.push({ label: fmt(end, "d MMM"), value: enrollments.filter((e) => e.submittedAt > start && e.submittedAt <= end).length });
  }
  const revenue = approved.reduce((s, e) => s + e.amount, 0);
  const statusCounts = { APPROVED: approved.length, PENDING: enrollments.filter((e) => e.status === "PENDING").length, REJECTED: enrollments.filter((e) => e.status === "REJECTED").length };

  return (
    <>
      <PageHeader eyebrow="Overview" title="Study-progress analytics" description="Attendance, scores, completion and who needs help — per course." />
      <div className="mb-6 flex flex-wrap gap-2">
        {courses.map((c) => (
          <Link key={c.id} href={`/admin/analytics?course=${c.id}`} className={cn("rounded-full border px-3.5 py-2 text-sm font-medium transition", c.id === courseId ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {c.title}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Enrolled students" value={approved.length} icon={<Users />} hint={`${statusCounts.PENDING} pending`} />
        <StatCard label="Attendance rate" value={`${attRate}%`} icon={<Video />} tone="violet" hint={`${ended.length} sessions held`} />
        <StatCard label="Submission rate" value={`${completion}%`} icon={<CheckCircle2 />} tone="success" hint={`${closed.length} closed assessments`} />
        {can(user, "revenue") ? (
          <StatCard label="Course revenue" value={formatEGP(revenue)} icon={<Wallet />} tone="ember" />
        ) : (
          <StatCard label="Average score" value={`${scoreData.length ? Math.round(scoreData.reduce((s, d) => s + d.value, 0) / scoreData.length) : 0}%`} icon={<Trophy />} tone="ember" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Attendance per session" icon={<Video />} />
          <CardBody>
            <StackedAttendance data={attendanceData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Class average per assessment" icon={<BarChart3 />} />
          <CardBody>
            <SimpleBars data={scoreData} suffix="%" name="Average" domain={[0, 100]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Lesson completion" description="% of students who marked each lesson complete" icon={<BookOpen />} />
          <CardBody>
            <SimpleBars data={lessonData} suffix="%" name="Completed" domain={[0, 100]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Enrollment requests" description="Payments submitted per week" icon={<TrendingUp />} />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
            <TrendArea data={weeks} name="Requests" color={C.ember} height={220} />
            <Donut
              height={180}
              data={[
                { name: "Approved", value: statusCounts.APPROVED, color: C.emerald },
                { name: "Pending", value: statusCounts.PENDING, color: C.amber },
                { name: "Rejected", value: statusCounts.REJECTED, color: C.red },
              ]}
              center={<p className="text-lg font-semibold">{enrollments.length}</p>}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Top performers" icon={<Trophy />} />
          <CardBody className="space-y-2">
            {top.length === 0 && <p className="text-sm text-muted-foreground">No graded work yet.</p>}
            {top.map((s, i) => (
              <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-muted/50">
                <span className={cn("grid size-8 place-items-center rounded-lg text-sm font-semibold", i < 3 ? "border border-foreground/30 text-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                <Avatar name={s.name} size={32} />
                <span className="flex-1 truncate font-semibold">{s.name}</span>
                <Badge tone="success">{s.avg}%</Badge>
              </Link>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Students who need attention" description="Average below 50% or attendance below 60%" icon={<AlertTriangle />} />
          <CardBody className="space-y-2">
            {risk.length === 0 && <p className="text-sm text-muted-foreground">Everyone is on track.</p>}
            {risk.map((s) => (
              <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/40 p-2.5 hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
                <Avatar name={s.name} size={32} />
                <span className="flex-1 truncate font-semibold">{s.name}</span>
                {s.avg !== null && <Badge tone={s.avg < 50 ? "danger" : "neutral"}>Avg {s.avg}%</Badge>}
                {s.att !== null && <Badge tone={s.att < 60 ? "danger" : "neutral"}>Att {s.att}%</Badge>}
              </Link>
            ))}
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Weak topics — hardest questions" description="Questions most of the class got wrong. Worth re-teaching." icon={<AlertTriangle />} />
          <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {hardest.length === 0 && <p className="text-sm text-muted-foreground">Not enough data yet.</p>}
            {hardest.map((q) => (
              <Link key={q.id} href={`/admin/assessments/${q.assessmentId}?tab=insights`} className="rounded-2xl border border-border p-4 transition hover:border-foreground/20">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-semibold">{q.text}</p>
                  <Badge tone={q.pct < 50 ? "danger" : "warning"}>{q.pct}%</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{q.assessment} · correct: {q.top}</p>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
