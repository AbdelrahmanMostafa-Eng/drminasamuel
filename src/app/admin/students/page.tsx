import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { studentRows } from "@/lib/student-rows";
import { PageHeader } from "@/components/ui/misc";
import { StudentsTable } from "@/components/admin/students-table";
import { AddStudentButton } from "@/components/admin/student-tools";

export default async function StudentsPage() {
  const user = await requireStaff();
  if (!can(user, "students") && !can(user, "payments")) redirect("/admin?denied=students");
  const [rows, courses] = await Promise.all([studentRows(), db.course.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT", "ENDED"] } }, select: { id: true, title: true, price: true } })]);
  return (
    <>
      <PageHeader
        eyebrow="Students"
        title="All students"
        description="Search, message on WhatsApp, reset passwords or devices, and export lists for the WhatsApp group."
        actions={can(user, "students") && <AddStudentButton courses={courses} />}
      />
      <StudentsTable rows={rows} courses={courses} />
    </>
  );
}
