import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FolderOpen, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff, requireStaffAny } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { fileUrl } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ResourceManager } from "@/components/admin/resource-manager";
import { HomeworkPanel, LessonDetailsForm } from "@/components/admin/lesson-editor";
import { Comments } from "@/components/student/comments";

export default async function AdminLessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params;
  const user = await requireStaffAny(["content", "assessments"]);
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, courseId: id },
    include: {
      chapter: true,
      resources: { orderBy: { sortOrder: "asc" } },
      assessments: { include: { _count: { select: { questions: true, submissions: { where: { submittedAt: { not: null } } } } } } },
      comments: { where: { parentId: null }, orderBy: { createdAt: "desc" }, include: { user: true, replies: { orderBy: { createdAt: "asc" }, include: { user: true } } } },
    },
  });
  if (!lesson) notFound();
  return (
    <>
      <Link href={`/admin/courses/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {lesson.chapter.title}
      </Link>
      <h2 className="mb-5 text-xl font-extrabold">{lesson.title}</h2>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Lesson materials" description="PDFs, recorded sessions, video links and files" icon={<FolderOpen />} />
            <CardBody>
              {can(user, "content") ? (
                <ResourceManager
                  courseId={id}
                  lessonId={lesson.id}
                  items={lesson.resources.map((r) => ({ id: r.id, kind: r.kind, title: r.title, url: r.url, storageKey: r.storageKey, size: r.size, allowDownload: r.allowDownload, isMainBook: false }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">You don&apos;t have the Content permission.</p>
              )}
            </CardBody>
          </Card>
          <Comments
            lessonId={lesson.id}
            meId={user.id}
            staff
            comments={lesson.comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAt: c.createdAt.toISOString(),
              author: { id: c.user.id, name: c.user.fullName, role: c.user.role, avatar: fileUrl(c.user.avatarKey) },
              replies: c.replies.map((r) => ({ id: r.id, body: r.body, createdAt: r.createdAt.toISOString(), author: { id: r.user.id, name: r.user.fullName, role: r.user.role, avatar: fileUrl(r.user.avatarKey) } })),
            }))}
          />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Homework" description="Multiple-choice homework for this lesson" icon={<ClipboardList />} />
            <CardBody>
              <HomeworkPanel
                courseId={id}
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                canAssess={can(user, "assessments")}
                items={lesson.assessments.map((a) => ({ id: a.id, title: a.title, dueAt: a.dueAt.toISOString(), questions: a._count.questions, submissions: a._count.submissions, isPublished: a.isPublished }))}
              />
            </CardBody>
          </Card>
          {can(user, "content") && (
            <Card>
              <CardHeader title="Lesson details" icon={<Pencil />} />
              <CardBody>
                <LessonDetailsForm chapterId={lesson.chapterId} lesson={{ id: lesson.id, title: lesson.title, description: lesson.description, isPublished: lesson.isPublished }} />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
