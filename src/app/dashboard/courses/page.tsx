import { BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getPublicCourses } from "@/lib/queries";
import { courseProgress } from "@/lib/student";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { CourseCard } from "@/components/site/course-card";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";

export default async function MyCoursesPage() {
  const user = await requireStudent();
  const [enrollments, all] = await Promise.all([db.enrollment.findMany({ where: { userId: user.id } }), getPublicCourses()]);
  const status = new Map(enrollments.map((e) => [e.courseId, e.status]));
  const mine = all.filter((c) => status.get(c.id) === "APPROVED");
  const others = all.filter((c) => status.get(c.id) !== "APPROVED" && c.status === "PUBLISHED");
  const progress = new Map(await Promise.all(mine.map(async (c) => [c.id, (await courseProgress(user.id, c.id)).percent] as const)));
  return (
    <>
      <PageHeader eyebrow="Learning" title="My courses" description="Your enrolled courses and the ones open for enrollment." />
      {mine.length === 0 ? (
        <EmptyState icon={<BookOpen />} title="No enrolled courses yet" description="Choose a course below to enroll." className="mb-10" />
      ) : (
        <Stagger className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((c) => (
            <StaggerItem key={c.id} className="space-y-2">
              <CourseCard course={c} href={`/dashboard/courses/${c.id}`} />
              <div className="flex items-center gap-3 px-2">
                <ProgressBar value={progress.get(c.id) ?? 0} tone="ember" />
                <span className="text-xs font-bold">{progress.get(c.id) ?? 0}%</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
      {others.length > 0 && (
        <>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">Open for enrollment</h2>
          <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {others.map((c) => (
              <StaggerItem key={c.id} className="relative">
                {status.get(c.id) === "PENDING" && <Badge tone="warning" className="absolute -top-2 left-4 z-10">Payment under review</Badge>}
                {status.get(c.id) === "REJECTED" && <Badge tone="danger" className="absolute -top-2 left-4 z-10">Payment rejected — resubmit</Badge>}
                <CourseCard course={c} href={`/dashboard/enroll/${c.id}`} />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </>
  );
}
