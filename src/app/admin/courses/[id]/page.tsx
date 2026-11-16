import { notFound } from "next/navigation";
import { BookMarked } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff, requireStaffAny } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ContentBuilder } from "@/components/admin/content-builder";
import { ResourceManager } from "@/components/admin/resource-manager";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default async function CourseContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaffAny(["courses", "content", "assessments", "grades"]);
  const course = await db.course.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          lessons: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { _count: { select: { resources: true, assessments: true } } } },
          assessments: { where: { type: "QUIZ" }, include: { _count: { select: { questions: true, submissions: { where: { submittedAt: { not: null } } } } } } },
        },
      },
      resources: { where: { lessonId: null }, orderBy: [{ isMainBook: "desc" }, { sortOrder: "asc" }] },
    },
  });
  if (!course) notFound();
  const chapters = course.chapters.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    coverKey: c.coverKey,
    isPublished: c.isPublished,
    lessons: c.lessons.map((l) => ({ id: l.id, title: l.title, isPublished: l.isPublished, resources: l._count.resources, homework: l._count.assessments })),
    quizzes: c.assessments.map((q) => ({ id: q.id, title: q.title, dueAt: q.dueAt.toISOString(), questions: q._count.questions, submissions: q._count.submissions, isPublished: q.isPublished })),
  }));
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
      <ContentBuilder courseId={id} chapters={chapters} canContent={can(user, "content")} canAssess={can(user, "assessments")} />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Course book" description="The full book for this course — visible only to approved students" icon={<BookMarked />} />
          <CardBody>
            {can(user, "content") ? (
              <ResourceManager
                courseId={id}
                lessonId={null}
                books
                items={course.resources.map((r) => ({ id: r.id, kind: r.kind, title: r.title, url: r.url, storageKey: r.storageKey, size: r.size, allowDownload: r.allowDownload, isMainBook: r.isMainBook }))}
              />
            ) : (
              <p className="text-sm text-muted-foreground">You don&apos;t have the Content permission.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
