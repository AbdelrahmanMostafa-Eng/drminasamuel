import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { CourseForm } from "@/components/admin/course-form";
import { EMPTY_COURSE } from "@/lib/course-defaults";

export default async function NewCoursePage() {
  await requireStaff("courses");
  const courses = await db.course.findMany({ where: { status: { not: "ARCHIVED" } }, select: { id: true, title: true } });
  const basics = await db.course.findFirst({ where: { level: "BASICS", status: { in: ["PUBLISHED", "ENDED"] } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader eyebrow="New course" title="Create a course" description="Each course is paid separately. Tip: create Basics first, then Advanced near the end of Basics." />
      <Card>
        <CardBody>
          <CourseForm initial={{ ...EMPTY_COURSE, batchLabel: basics?.batchLabel ?? "" }} courses={courses} />
        </CardBody>
      </Card>
    </>
  );
}
