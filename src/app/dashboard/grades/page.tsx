import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { approvedCourseIds } from "@/lib/access";
import { studentStats } from "@/lib/student";
import { bestAttempts } from "@/lib/grading";
import { fmt } from "@/lib/time";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

export default async function GradesPage() {
  const user = await requireStudent();
  const courseIds = await approvedCourseIds(user.id);
  const stats = await studentStats(user.id, courseIds);
  const enrollments = await db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true, submittedAt: true } });
  const joined = new Map(enrollments.map((e) => [e.courseId, e.submittedAt]));
  const now = new Date();
  const rows = stats.assessments
    .filter((a) => !a.opensAt || a.opensAt <= now || a.submissions.length)
    .map((a) => {
      const best = bestAttempts(a.submissions).get(user.id);
      const closed = a.dueAt <= now;
      const na = !best && closed && (joined.get(a.courseId) ?? now) > a.dueAt;
      return { a, best, closed, na };
    })
    .sort((x, y) => y.a.dueAt.getTime() - x.a.dueAt.getTime());

  return (
    <>
      <PageHeader eyebrow="Results" title="My grades" description="Every homework and quiz, with your best score. Missing work after the deadline counts as 0." />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Homework average" value={stats.homeworkAvg !== null ? `${stats.homeworkAvg}%` : "—"} tone="success" />
        <StatCard label="Quiz average" value={stats.quizAvg !== null ? `${stats.quizAvg}%` : "—"} tone="ember" />
        <StatCard label="Submitted" value={rows.filter((r) => r.best).length} />
        <StatCard label="Missed" value={stats.missed} tone="danger" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<ClipboardCheck />} title="No graded work yet" description="Your homework and quiz results will show up here." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Assessment</th>
                  <th className="px-5 py-3 font-bold">Type</th>
                  <th className="px-5 py-3 font-bold">Deadline</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ a, best, closed, na }) => {
                  const pct = best?.total ? Math.round(((best.score ?? 0) / best.total) * 100) : 0;
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3.5">
                        <Link href={`/dashboard/assessments/${a.id}`} className="font-semibold hover:text-primary">
                          {a.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{a.type === "QUIZ" ? a.chapter?.title : a.lesson?.title} · {a.course.title}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={a.type === "QUIZ" ? "ember" : "success"}>{a.type === "QUIZ" ? "Quiz" : "Homework"}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{fmt(a.dueAt, "d MMM, h:mm a")}</td>
                      <td className="px-5 py-3.5">
                        {best ? <Badge tone="success">Done</Badge> : na ? <Badge tone="neutral">Before enrollment</Badge> : closed ? <Badge tone="danger">Not done</Badge> : <Badge tone="warning">Open</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {best ? (
                          <span className={`font-extrabold ${pct >= 75 ? "text-emerald-600 dark:text-emerald-400" : pct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-danger"}`}>
                            {best.score}/{best.total} <span className="text-xs font-semibold text-muted-foreground">({pct}%)</span>
                          </span>
                        ) : closed && !na ? (
                          <span className="font-bold text-danger">0</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
