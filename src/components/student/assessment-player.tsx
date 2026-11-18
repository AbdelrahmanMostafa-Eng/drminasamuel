"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { saveAnswersAction, submitAttemptAction } from "@/actions/student";
import { cn } from "@/lib/utils";

export type PlayerQuestion = { id: string; text: string; image: string | null; options: { id: string; text: string }[]; points: number };

const LETTERS = "ABCDEFGH";

export function AssessmentPlayer({
  submissionId,
  title,
  questions,
  initialAnswers,
  deadline,
  backHref,
}: {
  submissionId: string;
  title: string;
  questions: PlayerQuestion[];
  initialAnswers: Record<string, string>;
  deadline: string;
  backHref: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [answers, setAnswers] = React.useState<Record<string, string>>(initialAnswers);
  const [idx, setIdx] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [flags, setFlags] = React.useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const dirty = React.useRef(false);
  const submittedRef = React.useRef(false);
  const end = new Date(deadline).getTime();
  const remaining = end - now;
  const q = questions[idx]!;
  const answered = Object.keys(answers).filter((k) => questions.some((qq) => qq.id === k)).length;

  const doSubmit = React.useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      const r = await submitAttemptAction(submissionId, answers);
      if (!r.ok) {
        submittedRef.current = false;
        setSubmitting(false);
        return void toast.error(r.error);
      }
      toast.success(auto ? "Time's up — your answers were submitted." : "Submitted! Calculating your score…");
      router.replace(`${backHref}?done=1`);
      router.refresh();
    },
    [answers, submissionId, router, backHref],
  );

  React.useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  React.useEffect(() => {
    if (remaining <= 0 && !submittedRef.current) doSubmit(true);
  }, [remaining, doSubmit]);
  // autosave every 8s when changed
  React.useEffect(() => {
    const iv = setInterval(() => {
      if (dirty.current) {
        dirty.current = false;
        saveAnswersAction(submissionId, answers);
      }
    }, 8000);
    return () => clearInterval(iv);
  }, [answers, submissionId]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) pick(q.options[n - 1]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function pick(optionId: string) {
    dirty.current = true;
    setAnswers((a) => ({ ...a, [q.id]: optionId }));
  }
  function go(d: number) {
    const n = idx + d;
    if (n < 0 || n >= questions.length) return;
    setDir(d);
    setIdx(n);
  }
  const mins = Math.floor(Math.max(0, remaining) / 60000);
  const secs = Math.floor((Math.max(0, remaining) % 60000) / 1000);
  const urgent = remaining < 5 * 60_000;
  const progress = Math.round((answered / questions.length) * 100);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            Question {idx + 1} <span className="font-medium">of {questions.length}</span>
          </p>
          <button
            onClick={() =>
              setFlags((f) => {
                const n = new Set(f);
                if (n.has(q.id)) n.delete(q.id);
                else n.add(q.id);
                return n;
              })
            }
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition", flags.has(q.id) ? "bg-ember-100 text-ember-700 dark:bg-ember-900/40 dark:text-ember-200" : "text-muted-foreground hover:bg-muted")}
          >
            <Flag className="size-3.5" /> {flags.has(q.id) ? "Flagged" : "Flag for review"}
          </button>
        </div>
        <div className="relative [perspective:1400px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={q.id}
              custom={dir}
              initial={{ opacity: 0, rotateY: dir * 25, x: dir * 60 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              exit={{ opacity: 0, rotateY: dir * -25, x: dir * -60 }}
              transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
              className="rounded-2xl border border-border bg-card p-6 shadow-lift sm:p-8"
            >
              <p className="whitespace-pre-line text-lg font-semibold leading-relaxed sm:text-xl">{q.text}</p>
              {q.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.image} alt="" className="mt-5 max-h-80 rounded-2xl border border-border object-contain" />
              )}
              <div className="mt-7 grid gap-3">
                {q.options.map((o, i) => {
                  const sel = answers[q.id] === o.id;
                  return (
                    <motion.button
                      key={o.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pick(o.id)}
                      className={cn(
                        "group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                        sel
                          ? "border-foreground bg-foreground/[0.03] ring-1 ring-foreground"
                          : "border-border bg-card hover:border-foreground/30",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold transition-all",
                          sel ? "bg-foreground text-background" : "border border-border text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {sel ? <CheckCircle2 className="size-5" /> : LETTERS[i]}
                      </span>
                      <span className="flex-1 font-medium">{o.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => go(-1)} disabled={idx === 0}>
            <ArrowLeft className="size-4" /> Previous
          </Button>
          {idx < questions.length - 1 ? (
            <Button onClick={() => go(1)}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              variant="accent"
              loading={submitting}
              onClick={async () => {
                const missing = questions.length - answered;
                const ok = await confirm({
                  title: "Submit your answers?",
                  description: missing ? `You still have ${missing} unanswered question${missing > 1 ? "s" : ""}. Unanswered questions score 0.` : "You answered every question. You can't change answers after submitting.",
                  confirmLabel: "Submit now",
                });
                if (ok) doSubmit();
              }}
            >
              <Send className="size-4" /> Submit
            </Button>
          )}
        </div>
        <p className="mt-4 hidden text-center text-xs text-muted-foreground sm:block">Tip: use ← → to move and keys 1–{q.options.length} to choose.</p>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className={cn("rounded-2xl border p-5 shadow-soft transition-colors", urgent ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30" : "border-border bg-card")}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className="mt-3 flex items-center gap-3">
            <Clock className={cn("size-6", urgent ? "text-danger" : "text-brand-500")} />
            <p className={cn("font-mono text-3xl font-display font-light tabular-nums", urgent && "text-danger")} suppressHydrationWarning>
              {mins > 99 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Answers auto-submit when time runs out.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-foreground" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
            {answered}/{questions.length} answered
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigator</p>
          <div className="grid grid-cols-6 gap-2">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => {
                  setDir(i > idx ? 1 : -1);
                  setIdx(i);
                }}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-xl text-xs font-bold transition-all",
                  i === idx ? "bg-foreground text-background" : answers[qq.id] ? "border border-foreground/30 text-foreground" : "border border-border text-muted-foreground hover:border-foreground/30",
                )}
              >
                {i + 1}
                {flags.has(qq.id) && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ember-500 ring-2 ring-card" />}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
