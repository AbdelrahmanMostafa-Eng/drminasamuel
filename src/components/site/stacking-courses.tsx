"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Tag } from "@/components/ui/misc";
import { CourseCover, type CourseCardData } from "./course-card";
import { formatEGP } from "@/lib/utils";
import { fmtDate } from "@/lib/time";

const STICKY_TOP = 96;
const STICKY_STEP = 16;
const SCALE_STEP = 0.04;
const OFFSET_STEP = 8;

/** Sticky stacking cards from the agentic template, used for the course line-up. */
export function StackingCourses({ courses }: { courses: CourseCardData[] }) {
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [depth, setDepth] = React.useState<number[]>(courses.map(() => 0));

  React.useEffect(() => {
    const onScroll = () => {
      setDepth(
        courses.map((_, i) => {
          let n = 0;
          for (let j = i + 1; j < courses.length; j++) {
            const el = refs.current[j];
            if (el && el.getBoundingClientRect().top <= STICKY_TOP + j * STICKY_STEP + 2) n++;
          }
          return n;
        }),
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [courses]);

  return (
    <div className="flex flex-col">
      {courses.map((c, i) => {
        const d = depth[i] ?? 0;
        return (
          <div key={c.id} ref={(el) => void (refs.current[i] = el)} className="sticky mb-4" style={{ top: STICKY_TOP + i * STICKY_STEP, zIndex: 10 + i }}>
            <div style={{ transform: `scale(${1 - d * SCALE_STEP}) translateY(${d * OFFSET_STEP}px)`, transformOrigin: "top center", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
              <Link href={`/courses/${c.slug}`} className="group relative block overflow-hidden rounded-2xl border border-border bg-[#faf9f7]">
                <div className="relative h-52 md:hidden">
                  <CourseCover label={false} coverKey={c.coverKey} level={c.level} title={c.title} className="absolute inset-0" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
                  <CourseCover label={false} coverKey={c.coverKey} level={c.level} title={c.title} className="absolute inset-0" />
                  <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#faf9f7] to-transparent" />
                </div>
                <div className="relative z-10 p-7 md:p-10">
                  <div className="md:max-w-[56%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag>{c.level === "BASICS" ? "Basics · Level 01" : "Advanced · Level 02"}</Tag>
                      {c.batchLabel && <Tag>{c.batchLabel}</Tag>}
                    </div>
                    <h3 className="mt-6 font-display text-2xl font-light tracking-tight md:text-3xl">{c.title}</h3>
                    {c.subtitle && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.subtitle}</p>}
                  </div>
                  <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-border pt-6 md:max-w-[56%]">
                    <div>
                      <div className="font-display text-2xl font-light">{formatEGP(c.price)}</div>
                      <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">course fee</div>
                    </div>
                    {c.chapters !== undefined && (
                      <div>
                        <div className="font-display text-2xl font-light">{c.chapters}</div>
                        <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">chapters</div>
                      </div>
                    )}
                    {c.startDate && (
                      <div>
                        <div className="font-display text-2xl font-light">{fmtDate(c.startDate)}</div>
                        <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">starts</div>
                      </div>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm text-foreground/70 transition-colors group-hover:text-foreground">
                      Course details <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
