import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, FileQuestion, ListChecks, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff, requireStaffAny } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { assessmentPhase } from "@/lib/access";
import { bestAttempts, finalizeExpiredAttempts, type QOption } from "@/lib/grading";
import { fmt, toLocalInput, relative } from "@/lib/time";
import { formatPhone, waLink } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/misc";
import { LinkTabs } from "@/components/ui/tabs";
import { QuestionBuilder } from "@/components/admin/question-builder";
import { ReportButton } from "@/components/admin/report-button";
import { AssessmentActions, ResetAttemptButton } from "@/components/admin/assessment-header";
import { SimpleBars } from "@/components/charts/charts";
import { WhatsAppIcon } from "@/components/brand/social-icons";

export default async function AdminAssessmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "questions" } = await searchParams;
  const user = await requireStaffAny(["assessments", "grades", "reports"]);
  await finalizeExpiredAttempts(id);
  const a = await db.assessment.findUnique({
    where: { id },
    include: {
      course: true,
      chapter: true,
      lesson: true,
      questions: { orderBy: { sortOrder: "asc" } },
      submissions: { where: { submittedAt: { not: null } }, include: { user: true } },
    },
  });
  if (!a) notFound();
  const phase = assessmentPhase(a);
  const enrollments = await db.enrollment.findMany({ where: { courseId: a.courseId, status: "APPROVED" }, include: { user: true }, orderBy: { user: { fullName: "asc" } } });
  const best = bestAttempts(a.submissions);
  const totalPoints = a.questions.reduce((s, q) => s + q.points, 0);
  const done = enrollments.filter((e) => best.has(e.userId));
  const pcts = [...best.values()].map((s) => Math.round(((s.score ?? 0) / (s.total || 1)) * 100));
  const avg = pcts.length ? Math.round(pcts.reduce((x, y) => x + y, 0) / pcts.length) : 0;
  const place = a.type === "QUIZ" ? `Chapter: ${a.chapter?.title}` : `Lesson: ${a.lesson?.title}`;
  const back = a.lesson ? `/admin/courses/${a.courseId}/lessons/${a.lesson.id}` : `/admin/courses/${a.courseId}`;
  const canGrades = can(user, "grades");

  // question analysis
  const analysis = a.questions.map((q, i) => {
    const answered = [...best.values()].map((s) => (s.answers as Record<string, string>)[q.id]);
    const correct = answered.filter((x) => x === q.correctOptionId).length;
    const counts = (q.options as QOption[]).map((o) => ({ ...o, n: answered.filter((x) => x === o.id).length }));
    return { q, i, pct: answered.length ? Math.round((correct / answered.length) * 100) : 0, counts, n: answered.length };
  });
  const dist = [0, 1, 2, 3, 4].map((b) => ({ label: `${b * 20}–${b * 20 + 20}%`, value: pcts.filter((p) => Math.min(4, Math.floor(p / 20)) === b).length }));

  return (
    <>
      <Link href={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {a.course.title}
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={a.type === "QUIZ" ? "ember" : "success"}>{a.type === "QUIZ" ? "Chapter quiz" : "Homework"}</Badge>
            <Badge tone="neutral">{place}</Badge>
            {!a.isPublished && <Badge tone="warning">Draft — hidden from students</Badge>}
            <Badge tone={phase === "closed" ? "danger" : phase === "open" ? "success" : "brand"}>{phase === "closed" ? "Closed" : phase === "open" ? "Open" : "Scheduled"}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-display font-light tracking-tight sm:text-3xl">{a.title}</h1>
          <p className="text-sm text-muted-foreground">
            Deadline {fmt(a.dueAt)} ({relative(a.dueAt)}) · {a.durationMinutes ? `${a.durationMinutes} min timer` : "no timer"} · {a.maxAttempts} attempt{a.maxAttempts > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AssessmentActions
            id={a.id}
            courseId={a.courseId}
            placeLabel={place}
            canEdit={can(user, "assessments")}
            initial={{
              type: a.type,
              chapterId: a.chapterId,
              lessonId: a.lessonId,
              title: a.title,
              instructions: a.instructions,
              opensAt: toLocalInput(a.opensAt),
              dueAt: toLocalInput(a.dueAt),
              durationMinutes: a.durationMinutes,
              maxAttempts: a.maxAttempts,
              answerVisibility: a.answerVisibility,
              shuffleQuestions: a.shuffleQuestions,
              isPublished: a.isPublished,
            }}
          />
          {can(user, "reports") && <ReportButton type="GRADES" refId={a.id} availableAt={a.dueAt.toISOString()} />}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Questions" value={a.questions.length} hint={`${totalPoints} points`} icon={<FileQuestion />} />
        <StatCard label="Submitted" value={`${done.length}/${enrollments.length}`} icon={<CheckCircle2 />} tone="success" />
        <StatCard label="Not done" value={enrollments.length - done.length} icon={<Users />} tone="danger" />
        <StatCard label="Class average" value={`${avg}%`} icon={<BarChart3 />} tone="ember" />
      </div>

      <LinkTabs
        id="assess-tabs"
        className="mb-6"
        tabs={[
          { href: `/admin/assessments/${a.id}?tab=questions`, label: "Questions", icon: <ListChecks />, active: tab === "questions" },
          ...(canGrades
            ? [
                { href: `/admin/assessments/${a.id}?tab=results`, label: "Results", icon: <ClipboardList />, active: tab === "results" },
                { href: `/admin/assessments/${a.id}?tab=insights`, label: "Question insights", icon: <BarChart3 />, active: tab === "insights" },
              ]
            : []),
        ]}
      />

      {tab === "questions" &&
        (can(user, "assessments") ? (
          <QuestionBuilder
            assessmentId={a.id}
            courseId={a.courseId}
            hasSubmissions={a.submissions.length > 0}
            initial={a.questions.map((q) => ({
              key: q.id,
              id: q.id,
              text: q.text,
              imageKey: q.imageKey,
              options: q.options as QOption[],
              correctOptionId: q.correctOptionId,
              explanation: q.explanation ?? "",
              points: q.points,
            }))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to edit questions.</p>
        ))}

      {tab === "results" && canGrades && (
        <Card>
          <CardHeader title="Student results" description="Best attempt counts. Students who didn't submit by the deadline get 0." icon={<ClipboardList />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e, i) => {
                  const b = best.get(e.userId);
                  const pct = b ? Math.round(((b.score ?? 0) / (b.total || 1)) * 100) : 0;
                  return (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/students/${e.userId}`} className="font-semibold hover:text-primary">{e.user.fullName}</Link>
                        <p className="text-xs text-muted-foreground">{formatPhone(e.user.whatsapp)}</p>
                      </td>
                      <td className="px-5 py-3">{b ? <Badge tone="success">Done</Badge> : phase === "closed" ? <Badge tone="danger">Not done</Badge> : <Badge tone="warning">Pending</Badge>}</td>
                      <td className="px-5 py-3 font-bold">{b ? <span className={pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-danger"}>{b.score}/{b.total} ({pct}%)</span> : phase === "closed" ? <span className="text-danger">0 / {totalPoints}</span> : "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{b?.submittedAt ? fmt(b.submittedAt, "d MMM, h:mm a") : "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          {!b && e.user.whatsapp && (
                            <a href={waLink(e.user.whatsapp, `Hi ${e.user.fullName.split(" ")[0]}, a reminder to submit “${a.title}” before ${fmt(a.dueAt, "EEE d MMM, h:mm a")}.`)} target="_blank" rel="noopener noreferrer" className="grid size-8 place-items-center rounded-lg text-[#128c7e] hover:bg-muted" title="Remind on WhatsApp">
                              <WhatsAppIcon className="size-4" />
                            </a>
                          )}
                          {b && can(user, "assessments") && <ResetAttemptButton submissionId={b.id} name={e.user.fullName} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {enrollments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No approved students in this course yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "insights" && canGrades && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader title="Score distribution" icon={<BarChart3 />} />
            <CardBody>
              <SimpleBars data={dist} name="Students" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Hardest questions" description="Lowest % correct first — re-teach these" icon={<FileQuestion />} />
            <CardBody className="space-y-3">
              {[...analysis].sort((x, y) => x.pct - y.pct).map(({ q, i, pct, counts, n }) => (
                <div key={q.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">Q{i + 1}. {q.text}</p>
                    <Badge tone={pct >= 75 ? "success" : pct >= 50 ? "warning" : "danger"}>{pct}% correct</Badge>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {counts.map((o) => (
                      <div key={o.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-40 truncate ${o.id === q.correctOptionId ? "font-bold text-emerald-600" : "text-muted-foreground"}`}>{o.text}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${o.id === q.correctOptionId ? "bg-emerald-500" : "bg-red-400"}`} style={{ width: `${n ? (o.n / n) * 100 : 0}%` }} />
                        </div>
                        <span className="w-6 text-right font-semibold">{o.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {analysis.length === 0 && <p className="text-sm text-muted-foreground">Add questions first.</p>}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}

