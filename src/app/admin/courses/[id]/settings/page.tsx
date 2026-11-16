import { notFound } from "next/navigation";
import { ShieldAlert, SlidersHorizontal } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { fileUrl } from "@/lib/utils";
import { toLocalDateInput } from "@/lib/time";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CourseForm } from "@/components/admin/course-form";
import { DangerZone } from "@/components/admin/danger-zone";

export default async function CourseSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const c = await db.course.findUnique({ where: { id } });
  if (!c) notFound();
  const courses = await db.course.findMany({ where: { status: { not: "ARCHIVED" } }, select: { id: true, title: true } });
  const students = await db.enrollment.findMany({ where: { courseId: id }, select: { userId: true } });
  const keep = await db.enrollment.findMany({
    where: { userId: { in: students.map((s) => s.userId) }, courseId: { not: id }, status: { in: ["APPROVED", "PENDING"] }, course: { status: { in: ["PUBLISHED", "DRAFT", "ENDED"] } } },
    select: { userId: true },
    distinct: ["userId"],
  });
  return (
    <div className="space-y-6">
      {can(user, "courses") && c.status !== "ARCHIVED" && (
        <Card>
          <CardHeader title="Course details" icon={<SlidersHorizontal />} />
          <CardBody>
            <CourseForm
              id={c.id}
              courses={courses}
              initial={{
                title: c.title,
                subtitle: c.subtitle ?? "",
                description: c.description,
                level: c.level,
                track: c.track,
                batchLabel: c.batchLabel ?? "",
                price: c.price,
                coverKey: c.coverKey,
                coverUrl: fileUrl(c.coverKey),
                introVideoUrl: c.introVideoUrl ?? "",
                highlights: c.highlights,
                status: c.status as "DRAFT" | "PUBLISHED" | "ENDED",
                enrollmentOpen: c.enrollmentOpen,
                startDate: toLocalDateInput(c.startDate),
                endDate: toLocalDateInput(c.endDate),
                prerequisiteId: c.prerequisiteId,
                whatsappGroupUrl: c.whatsappGroupUrl ?? "",
                sortOrder: c.sortOrder,
              }}
            />
          </CardBody>
        </Card>
      )}
      {c.status === "ARCHIVED" ? (
        <Card>
          <CardBody>
            <p className="font-bold">This course is archived.</p>
            <p className="text-sm text-muted-foreground">Final reports are saved in PDF reports. {c.finalStudentCount ?? 0} students completed it.</p>
          </CardBody>
        </Card>
      ) : (
        can(user, "courses") && (
          <Card>
            <CardHeader title="End of course" description="When the course finishes: end it, then archive to save final reports and remove student accounts." icon={<ShieldAlert />} />
            <CardBody>
              <DangerZone course={{ id: c.id, title: c.title, status: c.status }} isMaster={user.role === "MASTER"} preview={{ students: students.length, toKeep: keep.length, toDelete: new Set(students.map((s) => s.userId)).size - keep.length }} />
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
}
