import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, ClipboardList } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getCourseAccess, assessmentPhase } from "@/lib/access";
import { fileUrl, formatPhone, toEmbedUrl } from "@/lib/utils";
import { fmt, relative } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/reveal";
import { VideoPlayer, ResourceRow, type MediaItem } from "@/components/student/lesson-media";
import { PdfTabs } from "@/components/student/pdf-tabs";
import { CompleteButton } from "@/components/student/complete-button";
import { Comments } from "@/components/student/comments";

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  const user = await requireStudent();
  const access = await getCourseAccess(user, courseId);
  if (!access.course) notFound();
  if (!access.allowed) redirect(`/dashboard/enroll/${courseId}`);

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, courseId, isPublished: true, chapter: { isPublished: true } },
    include: {
      chapter: true,
      resources: { orderBy: { sortOrder: "asc" } },
      assessments: { where: { isPublished: true }, include: { submissions: { where: { userId: user.id }, orderBy: { attempt: "desc" } }, _count: { select: { questions: true } } } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: { user: true, replies: { orderBy: { createdAt: "asc" }, include: { user: true } } },
      },
    },
  });
  if (!lesson) notFound();

  const prog = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId },
    update: { lastViewedAt: new Date() },
  });

  const siblings = await db.lesson.findMany({
    where: { courseId, isPublished: true, chapter: { isPublished: true } },
    orderBy: [{ chapter: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true, title: true },
  });
  const idx = siblings.findIndex((s) => s.id === lessonId);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];

  const media: MediaItem[] = lesson.resources.map((r) => {
    const embed = r.kind === "VIDEO" && r.url ? (toEmbedUrl(r.url)?.embed ?? null) : null;
    return {
      id: r.id,
      kind: r.kind,
      title: r.title,
      description: r.description,
      src: fileUrl(r.storageKey),
      embed,
      externalUrl: r.url,
      size: r.size,
      allowDownload: r.allowDownload,
    };
  });
  const videos = media.filter((m) => m.kind === "VIDEO");
  const pdfs = media.filter((m) => m.kind === "PDF" && m.src);
  const others = media.filter((m) => m.kind === "LINK" || m.kind === "FILE" || (m.kind === "PDF" && !m.src));
  const watermark = `${user.fullName} · ${formatPhone(user.whatsapp)}`;

  return (
    <FadeIn>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/dashboard/courses/${courseId}`} className="font-semibold hover:text-foreground">
          {access.course.title}
        </Link>
        <ChevronRight className="size-4" />
        <span>{lesson.chapter.title}</span>
      </nav>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{lesson.title}</h1>
          {lesson.description && <p className="mt-2 max-w-3xl whitespace-pre-line text-muted-foreground">{lesson.description}</p>}
        </div>
        <CompleteButton lessonId={lesson.id} done={!!prog.completedAt} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {videos.map((v) => (
            <div key={v.id}>
              <VideoPlayer item={v} watermark={watermark} />
              <p className="mt-2 px-1 text-sm font-semibold">{v.title}</p>
            </div>
          ))}
          {pdfs.length > 0 && <PdfTabs items={pdfs} watermark={watermark} />}
          {videos.length === 0 && pdfs.length === 0 && others.length === 0 && (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Materials for this lesson will be uploaded soon.</p>
          )}
          <Comments
            lessonId={lesson.id}
            meId={user.id}
            staff={false}
            comments={lesson.comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAt: c.createdAt.toISOString(),
              author: { id: c.user.id, name: c.user.fullName, role: c.user.role, avatar: fileUrl(c.user.avatarKey) },
              replies: c.replies.map((r) => ({ id: r.id, body: r.body, createdAt: r.createdAt.toISOString(), author: { id: r.user.id, name: r.user.fullName, role: r.user.role, avatar: fileUrl(r.user.avatarKey) } })),
            }))}
          />
        </div>
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          {lesson.assessments.map((a) => {
            const best = a.submissions.filter((s) => s.submittedAt).sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
            const phase = assessmentPhase(a);
            return (
              <div key={a.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white">
                  <ClipboardList className="size-6" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-emerald-100">Lesson homework</p>
                  <p className="text-lg font-extrabold">{a.title}</p>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <p className="flex justify-between"><span className="text-muted-foreground">Questions</span><span className="font-semibold">{a._count.questions}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-semibold">{fmt(a.dueAt, "EEE d MMM, h:mm a")}</span></p>
                  {best ? (
                    <p className="flex justify-between"><span className="text-muted-foreground">Your score</span><Badge tone="success">{best.score}/{best.total}</Badge></p>
                  ) : (
                    <p className="flex justify-between"><span className="text-muted-foreground">Status</span>{phase === "closed" ? <Badge tone="danger">Missed (0)</Badge> : <Badge tone="warning">Not done · due {relative(a.dueAt)}</Badge>}</p>
                  )}
                  <ButtonLink href={`/dashboard/assessments/${a.id}`} variant={best || phase === "closed" ? "secondary" : "success"} className="w-full">
                    {best ? "View result" : phase === "closed" ? "View" : "Start homework"}
                  </ButtonLink>
                </div>
              </div>
            );
          })}
          {others.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Links & files</p>
              {others.map((o) => (
                <ResourceRow key={o.id} item={o} />
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {prev ? (
              <Link href={`/dashboard/courses/${courseId}/lessons/${prev.id}`} className="rounded-2xl border border-border bg-card p-3 text-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><ArrowLeft className="size-3.5" /> Previous</span>
                <span className="mt-1 line-clamp-2 block font-semibold">{prev.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/dashboard/courses/${courseId}/lessons/${next.id}`} className="rounded-2xl border border-border bg-card p-3 text-right text-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                <span className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground">Next <ArrowRight className="size-3.5" /></span>
                <span className="mt-1 line-clamp-2 block font-semibold">{next.title}</span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </FadeIn>
  );
}
