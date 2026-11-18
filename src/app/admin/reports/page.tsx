import Link from "next/link";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { fmt } from "@/lib/time";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ReportRowActions } from "@/components/admin/report-row-actions";
import { ReportButton } from "@/components/admin/report-button";
import { cn } from "@/lib/utils";

const TYPES = { ATTENDANCE: { label: "Attendance", tone: "brand" }, GRADES: { label: "Grades", tone: "ember" }, COURSE_SUMMARY: { label: "Course summary", tone: "success" } } as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; course?: string }> }) {
  const sp = await searchParams;
  const user = await requireStaff("reports");
  const [reports, courses] = await Promise.all([
    db.report.findMany({
      where: { ...(sp.type ? { type: sp.type as "ATTENDANCE" } : {}), ...(sp.course ? { courseTitle: sp.course } : {}) },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, type: true, title: true, courseTitle: true, createdAt: true, generatedByName: true },
    }),
    db.course.findMany({ where: { status: { in: ["PUBLISHED", "ENDED"] } }, select: { id: true, title: true } }),
  ]);
  const titles = [...new Set((await db.report.findMany({ select: { courseTitle: true }, distinct: ["courseTitle"] })).map((r) => r.courseTitle))];
  const q = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ type: sp.type, course: sp.course, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/reports${p.size ? `?${p}` : ""}`;
  };
  return (
    <>
      <PageHeader eyebrow="Students" title="PDF reports" description="Every attendance and grade report you generate is archived here — even after a course ends and student accounts are removed." />
      {courses.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Course summary reports" description="Attendance %, homework & quiz averages for every student in one table" icon={<FileText />} />
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                <p className="min-w-0 truncate text-sm font-semibold">{c.title}</p>
                <ReportButton type="COURSE_SUMMARY" refId={c.id} label="Generate" size="sm" variant="primary" />
              </div>
            ))}
          </CardBody>
        </Card>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {[undefined, "ATTENDANCE", "GRADES", "COURSE_SUMMARY"].map((t) => (
          <Link key={t ?? "all"} href={q({ type: t })} className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition", sp.type === t ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {t ? TYPES[t as keyof typeof TYPES].label : "All types"}
          </Link>
        ))}
        <span className="mx-1 w-px bg-border" />
        {titles.map((t) => (
          <Link key={t} href={q({ course: sp.course === t ? undefined : t })} className={cn("rounded-xl border px-3 py-1.5 text-sm font-semibold transition", sp.course === t ? "border-ember-500 bg-ember-500 text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {t}
          </Link>
        ))}
      </div>
      {reports.length === 0 ? (
        <EmptyState icon={<FileText />} title="No reports yet" description="Open a session after it ends, or an assessment after its deadline, and press Generate PDF report." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Report</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Generated</th>
                  <th className="px-5 py-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.courseTitle}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={TYPES[r.type].tone}>{TYPES[r.type].label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {fmt(r.createdAt, "d MMM yyyy, h:mm a")}
                      <span className="block text-xs">by {r.generatedByName}</span>
                    </td>
                    <td className="px-5 py-3">
                      <ReportRowActions id={r.id} canDelete={user.role === "MASTER"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
