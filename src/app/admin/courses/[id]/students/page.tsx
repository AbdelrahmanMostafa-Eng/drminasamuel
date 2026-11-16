import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { studentRows } from "@/lib/student-rows";
import { StudentsTable } from "@/components/admin/students-table";
import { CopyButton } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/brand/social-icons";

export default async function CourseStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  if (!can(user, "students") && !can(user, "payments")) redirect(`/admin/courses/${id}`);
  const [rows, course, pending] = await Promise.all([
    studentRows(id),
    db.course.findUniqueOrThrow({ where: { id }, select: { id: true, title: true, whatsappGroupUrl: true } }),
    db.enrollment.count({ where: { courseId: id, status: "PENDING" } }),
  ]);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#25d366] to-[#128c7e] text-white shadow-[0_3px_0_0_#0b5e55]">
            <WhatsAppIcon className="size-5" />
          </span>
          <div>
            <p className="font-bold">Course WhatsApp group</p>
            <p className="text-sm text-muted-foreground">{course.whatsappGroupUrl ? "Approved students see a Join button in their course page." : "No group link yet — add it in Settings."}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {course.whatsappGroupUrl && <CopyButton value={course.whatsappGroupUrl} label="Group link" />}
          {pending > 0 && (
            <Link href="/admin/payments" className="rounded-lg bg-ember-500 px-3 py-1 text-xs font-bold text-white shadow-[0_2px_0_0_#b94a07]">
              {pending} payment{pending > 1 ? "s" : ""} to review
            </Link>
          )}
        </div>
      </div>
      <StudentsTable rows={rows} courses={[course]} fixedCourseId={id} />
    </div>
  );
}
