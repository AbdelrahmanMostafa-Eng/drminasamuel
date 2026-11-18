import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SpotlightCard } from "@/components/ui/card";
import { Tag } from "@/components/ui/misc";
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

/** Uploaded cover, or a quiet "specimen plate" cover with the black-and-white feather study. */
export function CourseCover({ coverKey, level, title, className, label = true }: { coverKey: string | null; level: "BASICS" | "ADVANCED"; title: string; className?: string; label?: boolean }) {
  const src = fileUrl(coverKey);
  return (
    <div className={cn("relative overflow-hidden bg-[#e9e7e1]", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <div className="bg-grid absolute inset-0" />
          {/* Sized by height so the whole feather disc always fits inside the cover. */}
          <div className={cn("absolute right-[6%] top-1/2 aspect-square h-[82%] -translate-y-1/2", level === "ADVANCED" && "rotate-[-38deg]")}>
            <Image src="/images/feather-disc.webp" alt="" fill sizes="320px" className="object-contain" />
          </div>
          {label && <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#111]/45">{level === "BASICS" ? "Level 01 · Basics" : "Level 02 · Advanced"}</span>}
        </>
      )}
    </div>
  );
}

export function CourseCard({ course, href }: { course: CourseCardData; href?: string }) {
  const state = course.status === "ENDED" ? "Ended" : course.enrollmentOpen ? "Enrolling now" : "Enrollment closed";
  return (
    <SpotlightCard className="h-full overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-foreground/15">
      <Link href={href ?? `/courses/${course.slug}`} className="flex h-full flex-col">
        <CourseCover coverKey={course.coverKey} level={course.level} title={course.title} className="aspect-[16/9]" />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{course.level === "BASICS" ? "Basics" : "Advanced"}</Tag>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", course.enrollmentOpen && course.status !== "ENDED" ? "bg-success" : "bg-foreground/25")} />
              {state}
            </span>
          </div>
          <h3 className="mt-4 font-display text-xl font-light leading-snug tracking-tight">{course.title}</h3>
          {course.subtitle && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.subtitle}</p>}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {course.chapters !== undefined && <span>{course.chapters} chapters</span>}
            {course.lessons !== undefined && <span>{course.lessons} lessons</span>}
            {course.batchLabel && <span>{course.batchLabel}</span>}
            {course.startDate && <span>From {fmtDate(course.startDate)}</span>}
          </div>
          {course.prerequisiteTitle && <p className="mt-3 text-xs text-muted-foreground">Requires: {course.prerequisiteTitle}</p>}
          <div className="mt-auto flex items-end justify-between border-t border-border pt-5">
            <div>
              <p className="text-[11px] text-muted-foreground">Course fee</p>
              <p className="font-display text-2xl font-light tracking-tight">{formatEGP(course.price)}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-foreground/70 transition-colors group-hover/spot:text-foreground">
              View <ArrowUpRight className="size-4 transition-transform group-hover/spot:-translate-y-0.5 group-hover/spot:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}
