import Link from "next/link";
import { ArrowUpRight, BookOpen, Dna, Layers, Lock, Users } from "lucide-react";
import { TiltCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, fileUrl, formatEGP } from "@/lib/utils";
import { fmtDate } from "@/lib/time";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  level: "BASICS" | "ADVANCED";
  track: string;
  batchLabel: string | null;
  price: number;
  coverKey: string | null;
  startDate: Date | null;
  enrollmentOpen: boolean;
  status: string;
  chapters?: number;
  lessons?: number;
  prerequisiteTitle?: string | null;
};

export function CourseCover({ coverKey, level, title, className }: { coverKey: string | null; level: "BASICS" | "ADVANCED"; title: string; className?: string }) {
  const src = fileUrl(coverKey);
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div
          className={cn(
            "absolute inset-0",
            level === "BASICS" ? "bg-gradient-to-br from-brand-500 via-brand-700 to-brand-950" : "bg-gradient-to-br from-ember-400 via-ember-600 to-brand-900",
          )}
        >
          <div className="bg-grid absolute inset-0 opacity-40" />
          <svg className="absolute -right-6 -top-4 h-[130%] w-auto opacity-25 transition-transform duration-700 group-hover:rotate-6" viewBox="0 0 100 200" fill="none">
            {Array.from({ length: 14 }).map((_, i) => {
              const y = i * 14 + 6;
              const x = 50 + Math.sin(i * 0.7) * 30;
              const x2 = 50 - Math.sin(i * 0.7) * 30;
              return (
                <g key={i}>
                  <line x1={x} y1={y} x2={x2} y2={y} stroke="white" strokeWidth="1.5" />
                  <circle cx={x} cy={y} r="4" fill="#ffd2a3" />
                  <circle cx={x2} cy={y} r="4" fill="#aed6e6" />
                </g>
              );
            })}
          </svg>
          <Dna className="absolute bottom-5 left-5 size-10 text-white/80" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
    </div>
  );
}

export function CourseCard({ course, href }: { course: CourseCardData; href?: string }) {
  return (
    <TiltCard className="group h-full rounded-3xl" max={7}>
      <Link
        href={href ?? `/courses/${course.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow duration-300 group-hover:shadow-lift"
      >
        <div className="relative">
          <CourseCover coverKey={course.coverKey} level={course.level} title={course.title} className="aspect-[16/9]" />
          <div className="absolute left-4 top-4 flex gap-2 [transform:translateZ(30px)]">
            <Badge tone="glass">{course.level === "BASICS" ? "Basics" : "Advanced"}</Badge>
            <Badge tone="glass">{course.track}</Badge>
          </div>
          {course.status === "ENDED" ? (
            <Badge tone="neutral" className="absolute right-4 top-4">
              Ended
            </Badge>
          ) : !course.enrollmentOpen ? (
            <Badge tone="warning" className="absolute right-4 top-4">
              <Lock className="size-3" /> Enrollment closed
            </Badge>
          ) : (
            <Badge tone="success" className="absolute right-4 top-4" dot>
              Enrolling now
            </Badge>
          )}
          {course.batchLabel && <p className="absolute bottom-3 left-4 text-xs font-semibold text-white/90">{course.batchLabel}</p>}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg font-extrabold leading-snug tracking-tight">{course.title}</h3>
          {course.subtitle && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
            {course.chapters !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-3.5" /> {course.chapters} chapters
              </span>
            )}
            {course.lessons !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5" /> {course.lessons} lessons
              </span>
            )}
            {course.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> Starts {fmtDate(course.startDate)}
              </span>
            )}
          </div>
          {course.prerequisiteTitle && <p className="mt-3 text-xs text-ember-700 dark:text-ember-300">Requires: {course.prerequisiteTitle}</p>}
          <div className="mt-auto flex items-end justify-between pt-5">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Course fee</p>
              <p className="text-xl font-extrabold text-foreground">{formatEGP(course.price)}</p>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-b from-ember-400 to-ember-500 text-white shadow-[0_3px_0_0_#b94a07] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-45">
              <ArrowUpRight className="size-5" />
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}
