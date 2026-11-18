import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff, requireStaffAny } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { CourseTabs } from "@/components/admin/course-tabs";
import { formatEGP } from "@/lib/utils";

export default async function CourseAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaffAny(["courses", "content", "assessments", "grades", "sessions", "students", "payments"]);
  const c = await db.course.findUnique({ where: { id }, include: { _count: { select: { enrollments: { where: { status: "PENDING" } } } } } });
  if (!c) notFound();
  return (
    <>
      <Link href="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All courses
      </Link>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={c.status === "PUBLISHED" ? "success" : c.status === "ENDED" ? "warning" : "neutral"}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Badge>
            <Badge>{c.level === "BASICS" ? "Basics" : "Advanced"}</Badge>
            {c.batchLabel && <Badge tone="neutral">{c.batchLabel}</Badge>}
            {c.isSample && <Badge tone="ember">Example data</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-display font-light tracking-tight sm:text-3xl">{c.title}</h1>
          <p className="text-sm text-muted-foreground">{formatEGP(c.price)} · {c.track}</p>
        </div>
        {c.status !== "DRAFT" && c.status !== "ARCHIVED" && (
          <Link href={`/courses/${c.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            View public page <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
      <CourseTabs id={id} pending={c._count.enrollments} />
      <div className="mt-6">{children}</div>
    </>
  );
}
