"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ClipboardList, FileQuestion, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  kind: "session" | "homework" | "quiz";
  courseTitle?: string;
  href?: string;
  meta?: string;
};

const TZ = "Africa/Cairo";
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const pad = (n: number) => String(n).padStart(2, "0");
const WEEK = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const KIND = {
  session: { icon: Video, dot: "bg-brand-500", pill: "bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200", label: "Live session" },
  homework: { icon: ClipboardList, dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200", label: "Homework due" },
  quiz: { icon: FileQuestion, dot: "bg-ember-500", pill: "bg-ember-50 text-ember-700 dark:bg-ember-900/40 dark:text-ember-200", label: "Quiz due" },
};

export function ScheduleCalendar({ events, emptyText = "Nothing scheduled on this day." }: { events: CalEvent[]; emptyText?: string }) {
  const todayKey = keyFmt.format(new Date());
  const [y0, m0] = todayKey.split("-").map(Number) as [number, number];
  const [ym, setYm] = React.useState({ y: y0, m: m0 - 1 });
  const [selected, setSelected] = React.useState(todayKey);
  const [dir, setDir] = React.useState(0);

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const k = keyFmt.format(new Date(e.start));
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [events]);

  const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(ym.y, ym.m, 1)).getUTCDay() + 1) % 7; // Saturday-first
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
    const d = i - offset + 1;
    return d >= 1 && d <= days ? d : null;
  });
  const move = (delta: number) => {
    setDir(delta);
    setYm(({ y, m }) => {
      const nm = m + delta;
      return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };
  const selectedEvents = byDay.get(selected) ?? [];
  const [sy, sm, sd] = selected.split("-").map(Number) as [number, number, number];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl font-semibold">
            {MONTHS[ym.m]} <span className="text-muted-foreground">{ym.y}</span>
          </h3>
          <div className="flex gap-1.5">
            <button onClick={() => move(-1)} className="grid size-9 place-items-center rounded-xl border border-border transition hover:-translate-x-0.5 hover:bg-muted" aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => {
                setYm({ y: y0, m: m0 - 1 });
                setSelected(todayKey);
              }}
              className="rounded-xl border border-border px-3 text-xs font-semibold hover:bg-muted"
            >
              Today
            </button>
            <button onClick={() => move(1)} className="grid size-9 place-items-center rounded-xl border border-border transition hover:translate-x-0.5 hover:bg-muted" aria-label="Next month">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
          {WEEK.map((w) => (
            <div key={w} className="pb-2">
              {w}
            </div>
          ))}
        </div>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={`${ym.y}-${ym.m}`}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const k = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
              const ev = byDay.get(k) ?? [];
              const isToday = k === todayKey;
              const isSel = k === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(k)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-start rounded-xl pt-1.5 text-sm font-semibold transition-all duration-200 sm:pt-2",
                    isSel
                      ? "-translate-y-0.5 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_3px_0_0_#123b4d]"
                      : isToday
                        ? "bg-ember-50 text-ember-700 ring-1 ring-ember-300 dark:bg-ember-900/30 dark:text-ember-200"
                        : "hover:bg-muted",
                  )}
                >
                  {d}
                  {ev.length > 0 && (
                    <span className="mt-auto mb-1.5 flex gap-0.5 sm:mb-2">
                      {ev.slice(0, 3).map((e) => (
                        <span key={e.id} className={cn("size-1.5 rounded-full", isSel ? "bg-white" : KIND[e.kind].dot)} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {Object.entries(KIND).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", v.dot)} /> {v.label}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-bold text-muted-foreground">{dayLabel.format(new Date(Date.UTC(sy, sm - 1, sd)))}</p>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {selectedEvents.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {emptyText}
              </motion.div>
            )}
            {selectedEvents.map((e, i) => {
              const K = KIND[e.kind];
              const body = (
                <div className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                  <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", K.pill)}>
                    <K.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-snug">{e.title}</p>
                    {e.courseTitle && <p className="truncate text-xs text-muted-foreground">{e.courseTitle}</p>}
                    <p className="mt-1 text-xs font-semibold text-foreground/80">
                      {e.kind === "session" ? `${timeFmt.format(new Date(e.start))}${e.end ? ` – ${timeFmt.format(new Date(e.end))}` : ""}` : `Due ${timeFmt.format(new Date(e.start))}`}
                      {e.meta ? ` · ${e.meta}` : ""}
                    </p>
                  </div>
                </div>
              );
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
                  {e.href ? <Link href={e.href}>{body}</Link> : body}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
