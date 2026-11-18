import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { bestAttempts } from "@/lib/grading";
import { sessionEnd } from "@/lib/access";
import { fmt } from "@/lib/time";
import { EmptyState } from "@/components/ui/misc";
import { ReportButton } from "@/components/admin/report-button";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function GradebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  if (!can(user, "grades")) redirect(`/admin/courses/${id}`);
  const now = new Date();
  const [enrollments, assessments, sessions] = await Promise.all([
    db.enrollment.findMany({ where: { courseId: id, status: "APPROVED" }, include: { user: true }, orderBy: { user: { fullName: "asc" } } }),
    db.assessment.findMany({ where: { courseId: id }, orderBy: { dueAt: "asc" }, include: { submissions: { where: { submittedAt: { not: null } } } } }),
    db.liveSession.findMany({ where: { courseId: id }, include: { attendance: true } }),
  ]);
  const ended = sessions.filter((s) => sessionEnd(s) <= now);
  const best = new Map(assessments.map((a) => [a.id, bestAttempts(a.submissions)]));
  if (!enrollments.length) return <EmptyState icon={<ClipboardList />} title="No approved students yet" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Best attempt per student. Red “0” = missed deadline. Click a column to open the assessment.</p>
        {can(user, "reports") && <ReportButton type="COURSE_SUMMARY" refId={id} label="Course summary PDF" variant="primary" />}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-max min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="sticky left-0 z-10 bg-muted px-4 py-3 font-bold uppercase tracking-wider">Student</th>
                {assessments.map((a) => (
                  <th key={a.id} className="min-w-28 px-3 py-3 font-semibold">
                    <Link href={`/admin/assessments/${a.id}?tab=results`} className="block hover:text-primary">
                      <span className={cn("mr-1 inline-block rounded px-1 text-[0.6rem] font-bold text-white", a.type === "QUIZ" ? "bg-ember-500" : "bg-emerald-500")}>{a.type === "QUIZ" ? "Q" : "HW"}</span>
                      <span className="line-clamp-2">{a.title}</span>
                      <span className="block text-[0.65rem] font-normal">{fmt(a.dueAt, "d MMM")}</span>
                    </Link>
                  </th>
                ))}
                <th className="px-3 py-3 font-bold uppercase tracking-wider">HW avg</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Quiz avg</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const cells = assessments.map((a) => {
                  const b = best.get(a.id)!.get(e.userId);
                  const closed = a.dueAt <= now;
                  const na = !b && e.submittedAt > a.dueAt;
                  const pct = b ? Math.round(((b.score ?? 0) / (b.total || 1)) * 100) : closed && !na ? 0 : null;
                  return { a, b, pct, na, closed };
                });
                const avg = (t: string) => {
                  const xs = cells.filter((c) => c.a.type === t && c.pct !== null).map((c) => c.pct!);
                  return xs.length ? Math.round(xs.reduce((x, y) => x + y, 0) / xs.length) : null;
                };
                const mine = ended.filter((s) => e.submittedAt <= sessionEnd(s));
                const att = mine.filter((s) => {
                  const a = s.attendance.find((x) => x.userId === e.userId);
                  return a?.override ? a.override === "PRESENT" : !!a?.joinedAt;
                }).length;
                const color = (p: number | null) => (p === null ? "text-muted-foreground" : p >= 75 ? "text-emerald-600 dark:text-emerald-400" : p >= 50 ? "text-amber-600 dark:text-amber-400" : "text-danger");
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-semibold">
                      <Link href={`/admin/students/${e.userId}`} className="hover:text-primary">{e.user.fullName}</Link>
                    </td>
                    {cells.map((c) => (
                      <td key={c.a.id} className={cn("px-3 py-2.5 text-center font-bold", color(c.pct))}>
                        {c.na ? "N/A" : c.pct === null ? "—" : `${c.pct}%`}
                      </td>
                    ))}
                    <td className={cn("px-3 py-2.5 text-center font-semibold", color(avg("HOMEWORK")))}>{avg("HOMEWORK") ?? "—"}{avg("HOMEWORK") !== null && "%"}</td>
                    <td className={cn("px-3 py-2.5 text-center font-semibold", color(avg("QUIZ")))}>{avg("QUIZ") ?? "—"}{avg("QUIZ") !== null && "%"}</td>
                    <td className="px-3 py-2.5 text-center font-semibold">{mine.length ? `${att}/${mine.length}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
