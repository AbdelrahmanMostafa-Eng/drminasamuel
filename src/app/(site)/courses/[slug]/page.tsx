import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookMarked, CalendarDays, CheckCircle2, ClipboardList, FileQuestion, Layers, Lock, PlayCircle, Video } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { formatEGP, toEmbedUrl } from "@/lib/utils";
import { fmtDate } from "@/lib/time";
import { CourseCover } from "@/components/site/course-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return db.course.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "ENDED"] } },
    include: {
      prerequisite: { select: { id: true, title: true, slug: true } },
      chapters: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { where: { isPublished: true }, orderBy: { sortOrder: "asc" }, select: { id: true, title: true } },
          _count: { select: { assessments: { where: { type: "QUIZ", isPublished: true } } } },
        },
      },
      _count: { select: { liveSessions: true, assessments: { where: { isPublished: true } }, resources: { where: { lessonId: null } } } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.course.findUnique({ where: { slug }, select: { title: true, subtitle: true } });
  return c ? { title: c.title, description: c.subtitle ?? undefined } : {};
}

export default async function CoursePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await load(slug);
  if (!course) notFound();
  const user = await getCurrentUser();
  const enrollment = user && user.role === "STUDENT" ? await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null;
  let prereqOk = true;
  if (course.prerequisiteId && user?.role === "STUDENT") {
    const p = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.prerequisiteId } } });
    prereqOk = p?.status === "APPROVED";
  }
  const lessons = course.chapters.reduce((s, c) => s + c.lessons.length, 0);
  const quizzes = course.chapters.reduce((s, c) => s + c._count.assessments, 0);
  const embed = course.introVideoUrl ? toEmbedUrl(course.introVideoUrl) : null;
  const open = course.status === "PUBLISHED" && course.enrollmentOpen;

  let cta: React.ReactNode;
  if (!user) {
    cta = (
      <>
        <ButtonLink href={`/register?next=/dashboard/enroll/${course.id}`} variant="accent" size="lg" className="w-full">
          Create account & enroll
        </ButtonLink>
        <ButtonLink href={`/login?next=/dashboard/enroll/${course.id}`} variant="secondary" className="mt-2 w-full">
          I already have an account
        </ButtonLink>
      </>
    );
  } else if (isStaff(user)) {
    cta = (
      <ButtonLink href={`/admin/courses/${course.id}`} variant="primary" size="lg" className="w-full">
        Manage this course
      </ButtonLink>
    );
  } else if (enrollment?.status === "APPROVED") {
    cta = (
      <ButtonLink href={`/dashboard/courses/${course.id}`} variant="success" size="lg" className="w-full">
        <CheckCircle2 className="size-5" /> Open course
      </ButtonLink>
    );
  } else if (enrollment?.status === "PENDING") {
    cta = (
      <ButtonLink href={`/dashboard/enroll/${course.id}`} variant="secondary" size="lg" className="w-full">
        Payment under review…
      </ButtonLink>
    );
  } else if (!open) {
    cta = <p className="rounded-xl bg-muted p-3 text-center text-sm font-semibold text-muted-foreground">Enrollment is closed for this course.</p>;
  } else if (!prereqOk) {
    cta = (
      <p className="rounded-xl bg-ember-50 p-3 text-center text-sm font-semibold text-ember-700 dark:bg-ember-900/30 dark:text-ember-300">
        <Lock className="mr-1 inline size-4" /> You need to be enrolled in “{course.prerequisite?.title}” first.
      </p>
    );
  } else {
    cta = (
      <ButtonLink href={`/dashboard/enroll/${course.id}`} variant="accent" size="lg" className="w-full">
        {enrollment?.status === "REJECTED" ? "Resubmit payment" : "Enroll now"}
      </ButtonLink>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 pb-14 pt-32 text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -left-20 top-0 size-96 rounded-full bg-brand-500/25 blur-[100px]" />
        <div className="container-x relative grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <Reveal>
            <div className="flex flex-wrap gap-2">
              <Badge tone="glass">{course.level === "BASICS" ? "Basics" : "Advanced"}</Badge>
              <Badge tone="glass">{course.track}</Badge>
              {course.batchLabel && <Badge tone="glass">{course.batchLabel}</Badge>}
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{course.title}</h1>
            {course.subtitle && <p className="mt-4 max-w-2xl text-lg text-brand-100/80">{course.subtitle}</p>}
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-brand-100/80">
              <span className="inline-flex items-center gap-2"><Layers className="size-4 text-ember-400" />{course.chapters.length} chapters</span>
              <span className="inline-flex items-center gap-2"><PlayCircle className="size-4 text-ember-400" />{lessons} lessons</span>
              <span className="inline-flex items-center gap-2"><FileQuestion className="size-4 text-ember-400" />{quizzes} chapter quizzes</span>
              {course.startDate && <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-ember-400" />{fmtDate(course.startDate)}{course.endDate ? ` → ${fmtDate(course.endDate)}` : ""}</span>}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            {embed && (
              <Reveal>
                <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-lift">
                  <iframe src={embed.embed} title="Course introduction" className="aspect-video w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                </div>
              </Reveal>
            )}
            <Reveal>
              <h2 className="text-xl font-extrabold">About this course</h2>
              <div className="prose-bio mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{course.description || "Details coming soon."}</div>
            </Reveal>
            {course.highlights.length > 0 && (
              <Reveal>
                <h2 className="text-xl font-extrabold">What you&apos;ll get</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {course.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                      <span className="text-sm font-semibold">{h}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
            <Reveal>
              <h2 className="text-xl font-extrabold">Curriculum</h2>
              <p className="mt-1 text-sm text-muted-foreground">Lessons, recordings, PDFs and the book unlock after your enrollment is approved.</p>
              <div className="mt-5 space-y-3">
                {course.chapters.map((ch, i) => (
                  <details key={ch.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 text-sm font-extrabold text-white shadow-[0_3px_0_0_#123b4d]">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{ch.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {ch.lessons.length} lessons{ch._count.assessments ? ` · ${ch._count.assessments} quiz` : ""}
                        </span>
                      </span>
                      <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <ul className="border-t border-border px-4 py-2">
                      {ch.lessons.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 py-2 text-sm">
                          <Lock className="size-3.5 text-muted-foreground" />
                          <span>{l.title}</span>
                        </li>
                      ))}
                      {ch.lessons.length === 0 && <li className="py-2 text-sm text-muted-foreground">Lessons coming soon</li>}
                    </ul>
                  </details>
                ))}
                {course.chapters.length === 0 && <p className="text-sm text-muted-foreground">The curriculum will be published soon.</p>}
              </div>
            </Reveal>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
              <CourseCover coverKey={course.coverKey} level={course.level} title={course.title} className="aspect-[16/9]" />
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course fee</p>
                <p className="mt-1 text-3xl font-extrabold">{formatEGP(course.price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">One payment via InstaPay or Vodafone Cash</p>
                <div className="mt-5">{cta}</div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[
                    [Video, `${course._count.liveSessions} live Zoom sessions with attendance`],
                    [PlayCircle, "Recorded sessions & lesson videos"],
                    [ClipboardList, "Homework after every lesson"],
                    [FileQuestion, "A quiz after every chapter"],
                    [BookMarked, course._count.resources ? "Full course book (PDF)" : "Lesson PDFs & notes"],
                  ].map(([Icon, t], i) => {
                    const I = Icon as typeof Video;
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <I className="size-4 text-brand-500" /> {t as string}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
