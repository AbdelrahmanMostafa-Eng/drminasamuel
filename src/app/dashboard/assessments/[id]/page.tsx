import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, FileQuestion, Hash, RotateCcw, Timer, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getCourseAccess, assessmentPhase } from "@/lib/access";
import { fileUrl, seededShuffle } from "@/lib/utils";
import { fmt, relative } from "@/lib/time";
import { finalizeExpiredAttempts, type QOption } from "@/lib/grading";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress";
import { FadeIn } from "@/components/ui/reveal";
import { AssessmentPlayer } from "@/components/student/assessment-player";
import { StartButton, Celebrate } from "@/components/student/start-button";
import { cn } from "@/lib/utils";

export default async function AssessmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ take?: string; done?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireStudent();
  await finalizeExpiredAttempts(id);
  const a = await db.assessment.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
      submissions: { where: { userId: user.id }, orderBy: { attempt: "asc" } },
      lesson: { select: { id: true, title: true } },
      chapter: { select: { title: true } },
    },
  });
  if (!a || !a.isPublished) notFound();
  const access = await getCourseAccess(user, a.courseId);
  if (!access.allowed) redirect(`/dashboard/enroll/${a.courseId}`);

  const now = new Date();
  const phase = assessmentPhase(a, now);
  const submitted = a.submissions.filter((s) => s.submittedAt);
  const openAttempt = a.submissions.find((s) => !s.submittedAt);
  const best = [...submitted].sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
  const totalPoints = a.questions.reduce((s, q) => s + q.points, 0);
  const attemptsLeft = a.maxAttempts - a.submissions.length + (openAttempt ? 1 : 0);
  const backHref = `/dashboard/assessments/${a.id}`;
  const parentLink = a.lesson ? `/dashboard/courses/${a.courseId}/lessons/${a.lesson.id}` : `/dashboard/courses/${a.courseId}`;

  // Taking mode
  if (openAttempt && phase === "open") {
    const deadline = Math.min(a.dueAt.getTime(), a.durationMinutes ? openAttempt.startedAt.getTime() + a.durationMinutes * 60_000 : Infinity);
    if (deadline > now.getTime()) {
      const order = (openAttempt.order as string[] | null) ?? a.questions.map((q) => q.id);
      const byId = new Map(a.questions.map((q) => [q.id, q]));
      const questions = order
        .map((qid) => byId.get(qid))
        .filter(Boolean)
        .map((q) => ({
          id: q!.id,
          text: q!.text,
          image: fileUrl(q!.imageKey),
          points: q!.points,
          options: a.shuffleQuestions ? seededShuffle(q!.options as QOption[], `${user.id}:${q!.id}`) : (q!.options as QOption[]),
        }));
      return (
        <FadeIn>
          <div className="mb-6 flex items-center gap-3">
            <Badge tone={a.type === "QUIZ" ? "ember" : "success"}>{a.type === "QUIZ" ? "Chapter quiz" : "Homework"}</Badge>
            <h1 className="text-xl font-extrabold sm:text-2xl">{a.title}</h1>
          </div>
          <AssessmentPlayer submissionId={openAttempt.id} title={a.title} questions={questions} initialAnswers={(openAttempt.answers ?? {}) as Record<string, string>} deadline={new Date(deadline).toISOString()} backHref={backHref} />
        </FadeIn>
      );
    }
  }

  const reviewAllowed = submitted.length > 0 && (a.answerVisibility === "IMMEDIATELY" || (a.answerVisibility === "AFTER_DEADLINE" && phase === "closed"));
  const pct = best && best.total ? Math.round(((best.score ?? 0) / best.total) * 100) : 0;
  const answers = (best?.answers ?? {}) as Record<string, string>;

  return (
    <FadeIn>
      {sp.done && best && pct >= 80 && <Celebrate />}
      <Link href={parentLink} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to {a.lesson ? "lesson" : "course"}
      </Link>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
          <div className={cn("relative p-7 text-white", a.type === "QUIZ" ? "bg-gradient-to-br from-ember-400 via-ember-600 to-brand-900" : "bg-gradient-to-br from-emerald-500 via-emerald-700 to-brand-900")}>
            <div className="bg-grid absolute inset-0 opacity-25" />
            <div className="relative">
              <Badge tone="glass">{a.type === "QUIZ" ? `Chapter quiz · ${a.chapter?.title ?? ""}` : `Homework · ${a.lesson?.title ?? ""}`}</Badge>
              <h1 className="mt-3 font-display text-3xl font-semibold">{a.title}</h1>
              {a.instructions && <p className="mt-2 max-w-xl whitespace-pre-line text-white/85">{a.instructions}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {[
              [Hash, "Questions", a.questions.length],
              [CheckCircle2, "Points", totalPoints],
              [Timer, "Time limit", a.durationMinutes ? `${a.durationMinutes} min` : "None"],
              [RotateCcw, "Attempts", `${submitted.length}/${a.maxAttempts}`],
            ].map(([Icon, label, val], i) => {
              const I = Icon as typeof Hash;
              return (
                <div key={i} className="bg-card p-4">
                  <I className="size-4 text-muted-foreground" />
                  <p className="mt-2 text-lg font-extrabold">{val as string}</p>
                  <p className="text-xs text-muted-foreground">{label as string}</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              {phase === "upcoming" ? (
                <span>Opens <b>{fmt(a.opensAt!)}</b></span>
              ) : phase === "open" ? (
                <span>Deadline <b>{fmt(a.dueAt)}</b> ({relative(a.dueAt)})</span>
              ) : (
                <span>Closed on <b>{fmt(a.dueAt)}</b></span>
              )}
            </div>
            {phase === "open" && attemptsLeft > 0 && a.questions.length > 0 && (
              <StartButton assessmentId={a.id} resume={!!openAttempt} label={openAttempt ? "Resume" : submitted.length ? "Try again" : a.type === "QUIZ" ? "Start quiz" : "Start homework"} timed={a.durationMinutes} />
            )}
            {phase === "open" && attemptsLeft <= 0 && <p className="text-sm text-muted-foreground">You&apos;ve used all your attempts.</p>}
            {phase === "closed" && submitted.length === 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-danger dark:bg-red-950/30">
                <XCircle className="size-5" /> You didn&apos;t submit before the deadline — this counts as 0 (missing).
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your best result</p>
            <div className="mt-4 flex justify-center">
              <ProgressRing value={pct} size={150} stroke={12} label={best ? `${best.score}/${best.total}` : "—"} sublabel={best ? `${pct}%` : "not submitted"} tone={!best ? "brand" : pct >= 75 ? "success" : pct >= 50 ? "ember" : "danger"} />
            </div>
            {best && <p className="mt-4 text-sm text-muted-foreground">Submitted {fmt(best.submittedAt!)}</p>}
            {submitted.length > 0 && !reviewAllowed && (
              <p className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                {a.answerVisibility === "AFTER_DEADLINE" ? "Correct answers are revealed after the deadline." : "Answer review is turned off for this assessment."}
              </p>
            )}
          </div>
        </div>
      </div>

      {reviewAllowed && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-extrabold">Answer review</h2>
          {a.questions.map((q, i) => {
            const opts = q.options as QOption[];
            const mine = answers[q.id];
            const correct = mine === q.correctOptionId;
            return (
              <div key={q.id} className={cn("rounded-3xl border bg-card p-5 shadow-soft", correct ? "border-emerald-200 dark:border-emerald-900" : "border-red-200 dark:border-red-900")}>
                <div className="flex items-start gap-3">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold text-white", correct ? "bg-emerald-500" : "bg-red-500")}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line font-semibold">{q.text}</p>
                    {q.imageKey && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(q.imageKey)!} alt="" className="mt-3 max-h-60 rounded-xl border border-border" />
                    )}
                    <div className="mt-3 grid gap-2">
                      {opts.map((o) => (
                        <div
                          key={o.id}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                            o.id === q.correctOptionId ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : o.id === mine ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200" : "border-border",
                          )}
                        >
                          {o.id === q.correctOptionId ? <CheckCircle2 className="size-4" /> : o.id === mine ? <XCircle className="size-4" /> : <span className="size-4" />}
                          {o.text}
                          {o.id === mine && <span className="ml-auto text-xs font-bold">Your answer</span>}
                        </div>
                      ))}
                    </div>
                    {!mine && <p className="mt-2 text-xs font-semibold text-danger">Not answered</p>}
                    {q.explanation && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">💡 {q.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {a.questions.length === 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <FileQuestion className="size-4" /> Questions are being prepared.
        </p>
      )}
    </FadeIn>
  );
}
