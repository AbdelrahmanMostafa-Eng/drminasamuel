import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatEGP, toEmbedUrl } from "@/lib/utils";
import { fmtDate } from "@/lib/time";
import { CourseCover } from "@/components/site/course-card";
import { Reveal } from "@/components/ui/reveal";
import { Tag } from "@/components/ui/misc";
import { SectionTitle } from "@/components/site/text-anim";
import { FaqList } from "@/components/site/faq";
import { CourseCta } from "@/components/site/course-cta";

/** Course pages are served from cache; only the enroll button is personal (see CourseCta). */
export const revalidate = 60;

export async function generateStaticParams() {
  const courses = await db.course.findMany({ where: { status: { in: ["PUBLISHED", "ENDED"] } }, select: { slug: true } }).catch(() => []);
  return courses.map((c) => ({ slug: c.slug }));
}

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
  const c = await db.course.findUnique({ where: { slug }, select: { title: true, subtitle: true } }).catch(() => null);
  return c ? { title: c.title, description: c.subtitle ?? undefined } : {};
}

export default async function CoursePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await load(slug);
  if (!course) notFound();
  const lessons = course.chapters.reduce((s, c) => s + c.lessons.length, 0);
  const quizzes = course.chapters.reduce((s, c) => s + c._count.assessments, 0);
  const embed = course.introVideoUrl ? toEmbedUrl(course.introVideoUrl) : null;
  const open = course.status === "PUBLISHED" && course.enrollmentOpen;

  const includes = [
    `${course._count.liveSessions} live Zoom sessions with attendance`,
    "Recorded sessions & lesson videos",
    "Homework after every lesson",
    "A quiz after every chapter",
    course._count.resources ? "The full course book (PDF)" : "Lesson PDFs & notes",
  ];

  return (
    <>
      <section className="px-6 pb-10 pt-36 md:px-12 md:pt-44">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-2">
            <Tag>{course.level === "BASICS" ? "Basics · Level 01" : "Advanced · Level 02"}</Tag>
            <Tag>{course.track}</Tag>
            {course.batchLabel && <Tag>{course.batchLabel}</Tag>}
          </div>
          <SectionTitle as="h1" className="mt-6 max-w-4xl font-display text-5xl font-light leading-[1.02] tracking-tight md:text-7xl">
            {course.title}
          </SectionTitle>
          {course.subtitle && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{course.subtitle}</p>}
          <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-8">
            {[
              [course.chapters.length, "chapters"],
              [lessons, "lessons"],
              [quizzes, "chapter quizzes"],
              ...(course.startDate ? [[fmtDate(course.startDate), course.endDate ? `to ${fmtDate(course.endDate)}` : "start date"]] : []),
            ].map(([v, l]) => (
              <div key={String(l)}>
                <div className="font-display text-3xl font-light tracking-tight">{v}</div>
                <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-32 md:px-12" data-gradient-bar>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-16">
            {embed && (
              <Reveal>
                <div className="overflow-hidden rounded-2xl border border-border bg-black">
                  <iframe src={embed.embed} title="Course introduction" className="aspect-video w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                </div>
              </Reveal>
            )}
            <div>
              <h2 className="eyebrow">About this course</h2>
              <div className="prose-bio mt-5 whitespace-pre-line text-[1.02rem] leading-relaxed text-foreground/80">{course.description || "Details coming soon."}</div>
            </div>
            {course.highlights.length > 0 && (
              <div>
                <h2 className="eyebrow">What you get</h2>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {course.highlights.map((h, i) => (
                    <div key={h} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                      <span className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="eyebrow">Curriculum</h2>
              <p className="mt-3 text-sm text-muted-foreground">Lessons, recordings, PDFs and the book unlock once your enrollment is approved.</p>
              <div className="mt-6">
                {course.chapters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">The curriculum will be published soon.</p>
                ) : (
                  <FaqList
                    faqs={course.chapters.map((ch) => ({
                      q: `${ch.title} — ${ch.lessons.length} lessons${ch._count.assessments ? " + chapter quiz" : ""}`,
                      a: ch.lessons.length ? ch.lessons.map((l, i) => `${i + 1}. ${l.title}`).join("   ·   ") : "Lessons coming soon.",
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <CourseCover coverKey={course.coverKey} level={course.level} title={course.title} className="aspect-[16/9]" />
              <div className="p-6">
                <p className="text-xs text-muted-foreground">Course fee</p>
                <p className="mt-1 font-display text-4xl font-light tracking-tight">{formatEGP(course.price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">One payment via InstaPay or Vodafone Cash</p>
                <div className="mt-6">
                  <CourseCta courseId={course.id} open={open} prereqTitle={course.prerequisite?.title ?? null} />
                </div>
                <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
                  {includes.map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40" />
                      <span className="text-foreground/80">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <a href="/contact" className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Questions before enrolling? <ArrowUpRight className="size-4" />
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
