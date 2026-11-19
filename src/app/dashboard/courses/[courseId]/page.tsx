import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookMarked, CheckCircle2, ChevronRight, ClipboardList, FileQuestion, FileText, Lock, Megaphone, PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getCourseAccess, assessmentPhase } from "@/lib/access";
import { courseProgress } from "@/lib/student";
import { fileUrl, formatBytes } from "@/lib/utils";
import { fmt, relative } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { CourseCover } from "@/components/site/course-card";
import { WhatsAppIcon } from "@/components/brand/social-icons";

export default async function StudentCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const user = await requireStudent();
  const access = await getCourseAccess(user, courseId);
  if (!access.course) notFound();
  if (!access.allowed) redirect(`/dashboard/enroll/${courseId}`);
  const course = access.course;

  const [chapters, books, progress, completed, announcements] = await Promise.all([
    db.chapter.findMany({
      where: { courseId, isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { resources: true } }, assessments: { where: { isPublished: true }, select: { id: true } } },
        },
        assessments: {
          where: { type: "QUIZ", isPublished: true },
          include: { submissions: { where: { userId: user.id, submittedAt: { not: null } }, select: { score: true, total: true } } },
        },
      },
    }),
    db.resource.findMany({ where: { courseId, lessonId: null }, orderBy: [{ isMainBook: "desc" }, { sortOrder: "asc" }] }),
    courseProgress(user.id, courseId),
    db.lessonProgress.findMany({ where: { userId: user.id, completedAt: { not: null }, lesson: { courseId } }, select: { lessonId: true } }),
    db.announcement.findMany({ where: { courseId }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 3 }),
  ]);
  const done = new Set(completed.map((c) => c.lessonId));
  const hwIds = chapters.flatMap((c) => c.lessons.flatMap((l) => l.assessments.map((a) => a.id)));
  const hwDone = new Set(
    (await db.submission.findMany({ where: { userId: user.id, assessmentId: { in: hwIds }, submittedAt: { not: null } }, select: { assessmentId: true } })).map((s) => s.assessmentId),
  );

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
            <CourseCover label={false} coverKey={course.coverKey} level={course.level} title={course.title} className="absolute inset-0" />
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-card to-transparent" />
          </div>
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{course.level === "BASICS" ? "Basics" : "Advanced"}</Badge>
                {course.batchLabel && <Badge tone="neutral">{course.batchLabel}</Badge>}
                {course.status === "ENDED" && <Badge tone="warning">Course ended</Badge>}
              </div>
              <h1 className="mt-4 font-display text-3xl font-light tracking-tight sm:text-4xl">{course.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {progress.lessonsDone}/{progress.lessons} lessons · {progress.assessmentsDone}/{progress.assessments} assignments submitted
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {course.whatsappGroupUrl && (
                  <a href={course.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-85">
                    <WhatsAppIcon className="size-5" /> Join the WhatsApp group
                  </a>
                )}
                <Link href="/dashboard/schedule" className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:border-foreground/25">
                  Live sessions
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <ProgressRing value={progress.percent} sublabel="complete" tone="ember" size={120} />
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {chapters.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Chapters will appear here soon.</p>}
          {chapters.map((ch, ci) => {
            const lessonsDone = ch.lessons.filter((l) => done.has(l.id)).length;
            return (
              <Reveal key={ch.id} delay={ci * 0.04}>
                <details className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft" open={ci === 0 || lessonsDone < ch.lessons.length}>
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                    {ch.coverKey ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(ch.coverKey)!} alt="" className="size-14 shrink-0 rounded-xl border border-border object-cover" />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border font-mono text-sm text-muted-foreground">{String(ci + 1).padStart(2, "0")}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold uppercase tracking-wider text-ember-600 dark:text-ember-400">Chapter {ci + 1}</span>
                      <span className="block text-lg font-semibold">{ch.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {lessonsDone}/{ch.lessons.length} lessons done
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  {ch.description && <p className="-mt-2 px-5 pb-3 text-sm text-muted-foreground">{ch.description}</p>}
                  <div className="space-y-2 border-t border-border p-3 sm:p-4">
                    {ch.lessons.map((l, li) => (
                      <Link prefetch={false} key={l.id} href={`/dashboard/courses/${courseId}/lessons/${l.id}`} className="group/l flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted/70">
                        {done.has(l.id) ? <CheckCircle2 className="size-6 shrink-0 text-emerald-500" /> : <PlayCircle className="size-6 shrink-0 text-brand-400" />}
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {li + 1}. {l.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {l._count.resources} materials
                            {l.assessments.length > 0 && (l.assessments.every((a) => hwDone.has(a.id)) ? " · homework ✓" : " · homework pending")}
                          </span>
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground transition group-hover/l:translate-x-1" />
                      </Link>
                    ))}
                    {ch.assessments.map((q) => {
                      const sub = q.submissions[0];
                      const phase = assessmentPhase(q);
                      return (
                        <Link prefetch={false}
                          key={q.id}
                          href={`/dashboard/assessments/${q.id}`}
                          className="mt-1 flex items-center gap-3 rounded-2xl border border-ember-200 bg-ember-50/60 p-3 transition hover:border-foreground/20 dark:border-ember-800/40 dark:bg-ember-900/15"
                        >
                          <span className="grid size-10 place-items-center rounded-lg border border-border text-ember-600 dark:text-ember-400">
                            <FileQuestion className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold">Chapter quiz: {q.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {sub ? `Done · ${sub.score}/${sub.total}` : phase === "closed" ? "Closed — not submitted" : phase === "upcoming" ? `Opens ${fmt(q.opensAt!, "EEE d MMM, h:mm a")}` : `Due ${relative(q.dueAt)}`}
                            </span>
                          </span>
                          {sub ? <Badge tone="success">Done</Badge> : phase === "closed" ? <Badge tone="danger">Missed</Badge> : phase === "upcoming" ? <Lock className="size-4 text-muted-foreground" /> : <Badge tone="ember">Open</Badge>}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </Reveal>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Course book & references" icon={<BookMarked />} />
            <CardBody className="space-y-2.5">
              {books.length === 0 && <p className="text-sm text-muted-foreground">The book will be uploaded soon.</p>}
              {books.map((b) => (
                <a
                  key={b.id}
                  href={b.storageKey ? `${fileUrl(b.storageKey)}${b.allowDownload ? "?download=1" : ""}` : (b.url ?? "#")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:border-brand-300 hover:border-foreground/20"
                >
                  <span className={`grid size-11 place-items-center rounded-lg border border-border ${b.isMainBook ? "text-ember-600 dark:text-ember-400" : "text-brand-600 dark:text-brand-300"}`}>
                    {b.isMainBook ? <BookMarked className="size-5" /> : <FileText className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{b.title}</span>
                    <span className="text-xs text-muted-foreground">{b.isMainBook ? "Full course book" : "Reference"} {b.size ? `· ${formatBytes(b.size)}` : ""}</span>
                  </span>
                </a>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Course announcements" icon={<Megaphone />} />
            <CardBody className="space-y-3">
              {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
              {announcements.map((a) => (
                <div key={a.id} className="rounded-xl bg-muted/50 p-3">
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">{relative(a.createdAt)}</p>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Homework" icon={<ClipboardList />} description="Every lesson has its own homework" />
            <CardBody className="text-sm text-muted-foreground">
              Open a lesson to find its homework. Submit before the deadline — late or missing homework counts as 0 in the grade report.
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
