import { Brain, Flame, Lightbulb, Target, TrendingUp, Trophy, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { approvedCourseIds, sessionEnd } from "@/lib/access";
import { studentStats, courseProgress } from "@/lib/student";
import { bestAttempts } from "@/lib/grading";
import { fmt } from "@/lib/time";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import { CompareBars, Donut, ScoreTrend, SkillRadar, TrendArea, C } from "@/components/charts/charts";

export default async function StudentAnalyticsPage() {
  const user = await requireStudent();
  const courseIds = await approvedCourseIds(user.id);
  if (!courseIds.length) {
    return (
      <>
        <PageHeader eyebrow="Insights" title="Study analytics" />
        <EmptyState icon={<TrendingUp />} title="Analytics unlock after enrollment" description="Once you start submitting homework and quizzes, your progress charts appear here." />
      </>
    );
  }
  const now = new Date();
  const stats = await studentStats(user.id, courseIds);
  const progress = await Promise.all(courseIds.map((id) => courseProgress(user.id, id)));
  const overall = Math.round(progress.reduce((s, p) => s + p.percent, 0) / progress.length);

  // class averages per assessment (closed or submitted)
  const relevant = stats.assessments.filter((a) => a.submissions.some((s) => s.submittedAt));
  const classSubs = await db.submission.findMany({ where: { assessmentId: { in: relevant.map((a) => a.id) }, submittedAt: { not: null } }, select: { assessmentId: true, userId: true, score: true, total: true, submittedAt: true } });
  const compare = relevant.slice(-10).map((a) => {
    const subs = classSubs.filter((s) => s.assessmentId === a.id);
    const best = [...bestAttempts(subs).values()];
    const avg = best.length ? Math.round(best.reduce((s, b) => s + (b.score ?? 0) / (b.total || 1), 0) / best.length * 100) : 0;
    const mine = bestAttempts(a.submissions).get(user.id);
    return { label: a.title, a: mine?.total ? Math.round(((mine.score ?? 0) / mine.total) * 100) : 0, b: avg };
  });

  // chapter mastery
  const chapters = await db.chapter.findMany({ where: { courseId: { in: courseIds }, isPublished: true }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true, lessons: { select: { id: true } } } });
  const radar = chapters
    .map((ch) => {
      const lessonIds = new Set(ch.lessons.map((l) => l.id));
      const list = stats.assessments.filter((a) => a.chapterId === ch.id || (a.lessonId && lessonIds.has(a.lessonId)));
      const scored = list.map((a) => bestAttempts(a.submissions).get(user.id)).filter((b) => b && b.total);
      if (!scored.length) return null;
      return { label: ch.title, value: Math.round((scored.reduce((s, b) => s + (b!.score ?? 0) / b!.total!, 0) / scored.length) * 100) };
    })
    .filter(Boolean) as { label: string; value: number }[];

  // attendance donut
  const ended = stats.sessions.filter((s) => sessionEnd(s) <= now);
  let present = 0, excused = 0, unexcused = 0;
  for (const s of ended) {
    const a = s.attendance[0];
    const p = a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
    if (p) present++;
    else if (a?.excuse) excused++;
    else unexcused++;
  }

  // weekly study activity
  const done = await db.lessonProgress.findMany({ where: { userId: user.id, completedAt: { not: null } }, select: { completedAt: true } });
  const weeks: { label: string; value: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 86400_000);
    const end = new Date(now.getTime() - i * 7 * 86400_000);
    weeks.push({ label: fmt(end, "d MMM"), value: done.filter((d) => d.completedAt! > start && d.completedAt! <= end).length });
  }

  const sorted = [...radar].sort((a, b) => a.value - b.value);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const insights: { icon: typeof Brain; text: string; tone: string }[] = [];
  if (weakest && weakest.value < 70) insights.push({ icon: Target, text: `Revise “${weakest.label}” — it's your lowest chapter at ${weakest.value}%.`, tone: "text-ember-600" });
  if (strongest && strongest.value >= 80) insights.push({ icon: Trophy, text: `You're strongest in “${strongest.label}” (${strongest.value}%). Keep it up!`, tone: "text-emerald-600" });
  if (stats.missed > 0) insights.push({ icon: Flame, text: `You missed ${stats.missed} deadline${stats.missed > 1 ? "s" : ""}. Turn on reminders by checking the schedule daily.`, tone: "text-danger" });
  if (stats.attendanceRate !== null && stats.attendanceRate < 75) insights.push({ icon: Video, text: `Your attendance is ${stats.attendanceRate}%. Live sessions are where the exam tricks are explained!`, tone: "text-amber-600" });
  const last = stats.timeline.slice(-3);
  if (last.length === 3 && last[2]!.percent > last[0]!.percent) insights.push({ icon: TrendingUp, text: `Your scores are trending up (+${last[2]!.percent - last[0]!.percent}% over your last 3). Great momentum!`, tone: "text-brand-600" });
  if (!insights.length) insights.push({ icon: Lightbulb, text: "Submit homework and quizzes to unlock personalised insights.", tone: "text-brand-600" });

  return (
    <>
      <PageHeader eyebrow="Insights" title="Study analytics" description="Track your progress, see where you shine and what to revise next." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Course progress" value={`${overall}%`} icon={<Target />} />
        <StatCard label="Homework average" value={stats.homeworkAvg !== null ? `${stats.homeworkAvg}%` : "—"} icon={<Brain />} tone="success" />
        <StatCard label="Quiz average" value={stats.quizAvg !== null ? `${stats.quizAvg}%` : "—"} icon={<Trophy />} tone="ember" />
        <StatCard label="Attendance" value={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "—"} icon={<Video />} tone="violet" hint={`${stats.sessionsAttended}/${stats.sessionsHeld} sessions`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Score trend" description="Your result on every submitted homework and quiz" icon={<TrendingUp />} />
          <CardBody>
            <ScoreTrend data={stats.timeline.map((t) => ({ label: t.title, score: t.percent, type: t.type }))} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Smart insights" icon={<Lightbulb />} />
          <CardBody className="space-y-3">
            {insights.map((i, k) => (
              <div key={k} className="flex gap-3 rounded-2xl bg-muted/50 p-3.5 text-sm">
                <i.icon className={`size-5 shrink-0 ${i.tone}`} />
                <p>{i.text}</p>
              </div>
            ))}
            <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
              <ProgressRing value={overall} size={84} stroke={8} tone="ember" />
              <p className="text-sm text-muted-foreground">of all lessons & assignments completed across your courses.</p>
            </div>
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="You vs. class average" description="Last 10 submitted assessments" icon={<Trophy />} />
          <CardBody>
            <CompareBars data={compare} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Attendance" icon={<Video />} />
          <CardBody>
            <Donut
              data={[
                { name: "Present", value: present, color: C.emerald },
                { name: "Absent · Excuse Given", value: excused, color: C.amber },
                { name: "Absent · NOT Given", value: unexcused, color: C.red },
              ]}
              center={
                <div>
                  <p className="text-2xl font-extrabold">{stats.attendanceRate ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">present</p>
                </div>
              }
            />
            <div className="mt-3 flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Present {present}</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Excused {excused}</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" />Unexcused {unexcused}</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Chapter mastery" icon={<Brain />} />
          <CardBody>
            <SkillRadar data={radar} />
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Weekly study activity" description="Lessons marked complete per week" icon={<Flame />} />
          <CardBody>
            <TrendArea data={weeks} name="Lessons" color={C.brand} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
