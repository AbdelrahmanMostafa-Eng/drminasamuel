"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CalendarPlus, CheckCircle2, Clock, MessageSquareWarning, Radio, Video, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TextArea } from "@/components/ui/input";
import { submitExcuseAction } from "@/actions/student";
import { cn } from "@/lib/utils";

export type StudentSession = {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
  startsAt: string;
  endsAt: string;
  joinOpensMinutes: number;
  present: boolean;
  excuse: string | null;
  recordingUrl: string | null;
  enrolledAfter: boolean;
};

const tf = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const tt = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "numeric", minute: "2-digit" });

function useNow(interval = 1000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(iv);
  }, [interval]);
  return now;
}

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

function gcalLink(s: StudentSession) {
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${s.title} — Bioacademy`,
    dates: `${f(s.startsAt)}/${f(s.endsAt)}`,
    details: `${s.courseTitle}\nJoin from your Bioacademy dashboard (the Join button marks your attendance).`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function SessionCard({ s, compact }: { s: StudentSession; compact?: boolean }) {
  const router = useRouter();
  const now = useNow();
  const start = new Date(s.startsAt).getTime();
  const end = new Date(s.endsAt).getTime();
  const opens = start - s.joinOpensMinutes * 60_000;
  const phase = now >= end ? "ended" : now >= start ? "live" : now >= opens ? "open" : "upcoming";
  const [open, setOpen] = React.useState(false);
  const [pending, startT] = React.useTransition();
  const [joined, setJoined] = React.useState(s.present);
  React.useEffect(() => setJoined(s.present), [s.present]);

  const status =
    phase === "ended" ? (
      s.enrolledAfter ? (
        <Badge tone="neutral">Before you enrolled</Badge>
      ) : joined ? (
        <Badge tone="success">
          <CheckCircle2 className="size-3" /> Present
        </Badge>
      ) : s.excuse ? (
        <Badge tone="warning">Absent · Excuse Given</Badge>
      ) : (
        <Badge tone="danger">
          <XCircle className="size-3" /> Absent · Excuse NOT Given
        </Badge>
      )
    ) : phase === "live" ? (
      <Badge tone="danger" className="animate-pulse">
        <Radio className="size-3" /> Live now
      </Badge>
    ) : phase === "open" ? (
      <Badge tone="success" dot>
        Join is open
      </Badge>
    ) : (
      <Badge tone="brand">
        <Clock className="size-3" /> Starts in <span suppressHydrationWarning>{countdown(start - now)}</span>
      </Badge>
    );

  return (
    <motion.div layout className={cn("@container relative overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift", phase === "live" ? "border-red-300 dark:border-red-800" : "border-border")}>
      {phase === "live" && <div className="absolute inset-x-0 top-0 h-1 animate-[gradient-pan_3s_ease_infinite] bg-gradient-to-r from-red-400 via-ember-400 to-red-400 bg-[length:200%_100%]" />}
      <div className="flex flex-col gap-4 p-5 @2xl:flex-row @2xl:items-center">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-white", phase === "ended" ? "bg-gradient-to-b from-slate-400 to-slate-600 shadow-[0_3px_0_0_#334155]" : "bg-gradient-to-b from-brand-500 to-brand-700 shadow-[0_3px_0_0_#123b4d]")}>
            <Video className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold">{s.title}</p>
              {status}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {s.courseTitle} · {tf.format(new Date(s.startsAt))} – {tt.format(new Date(s.endsAt))}
            </p>
            {s.description && !compact && <p className="mt-1.5 line-clamp-2 text-sm text-foreground/75">{s.description}</p>}
            {s.excuse && !joined && phase !== "ended" && <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-300">✓ Excuse submitted — you can still join if you make it.</p>}
            {joined && phase !== "ended" && <p className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ You&apos;re marked present. You can re-open Zoom anytime.</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {phase !== "ended" && (
            <>
              {phase === "upcoming" ? (
                <Button variant="secondary" disabled size="sm">
                  <Clock className="size-4" /> Opens {tt.format(new Date(opens))}
                </Button>
              ) : (
                <a
                  href={`/api/sessions/${s.id}/join`}
                  target="_blank"
                  rel="noopener"
                  onClick={() => {
                    setJoined(true);
                    toast.success("You're marked present — opening Zoom…");
                    setTimeout(() => router.refresh(), 1500);
                  }}
                  className="btn-3d btn-depth-success inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white"
                >
                  <Video className="size-4" /> {joined ? "Re-join session" : "Join session"}
                </a>
              )}
              {!joined && (
                <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                  <MessageSquareWarning className="size-4" /> {s.excuse ? "Edit excuse" : "Can't attend?"}
                </Button>
              )}
              {phase === "upcoming" && (
                <a href={gcalLink(s)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-muted-foreground hover:text-foreground" title="Add to Google Calendar">
                  <CalendarPlus className="size-4" />
                </a>
              )}
            </>
          )}
          {phase === "ended" && s.recordingUrl && (
            <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn-3d btn-depth-brand inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-3.5 text-sm font-semibold text-white">
              Watch recording
            </a>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Submit an absence excuse" description={`For “${s.title}”. Excuses close when the session ends at ${tt.format(new Date(s.endsAt))}.`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = String(new FormData(e.currentTarget).get("excuse") ?? "");
              startT(async () => {
                const r = await submitExcuseAction(s.id, text);
                if (!r.ok) return void toast.error(r.error);
                toast.success("Excuse submitted");
                setOpen(false);
                router.refresh();
              });
            }}
            className="space-y-4"
          >
            <TextArea name="excuse" label="Why can't you attend?" defaultValue={s.excuse ?? ""} rows={5} required minLength={5} maxLength={1000} />
            <p className="text-xs text-muted-foreground">Your teacher will see this excuse in the attendance report as “Excuse Given”.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Submit excuse
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
