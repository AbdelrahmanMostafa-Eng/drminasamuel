"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronRight, ClipboardList, EyeOff, FileQuestion, FolderPlus, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, TextArea, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { FileDrop } from "@/components/ui/file-upload";
import { EmptyState } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm";
import { deleteChapterAction, deleteLessonAction, moveChapterAction, moveLessonAction, saveChapterAction, saveLessonAction } from "@/actions/admin-courses";
import { AssessmentDialog, type AssessmentValues } from "./assessment-dialog";
import { useAction } from "./use-action";

export type BuilderChapter = {
  id: string;
  title: string;
  description: string;
  coverKey: string | null;
  isPublished: boolean;
  lessons: { id: string; title: string; isPublished: boolean; resources: number; homework: number }[];
  quizzes: { id: string; title: string; dueAt: string; questions: number; submissions: number; isPublished: boolean }[];
};

const df = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function defaultDue() {
  const d = new Date(Date.now() + 7 * 86400_000);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return `${parts}T23:59`;
}

export function ContentBuilder({ courseId, chapters, canContent, canAssess }: { courseId: string; chapters: BuilderChapter[]; canContent: boolean; canAssess: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  const [chDialog, setChDialog] = React.useState<{ id: string | null; title: string; description: string; coverKey: string | null; isPublished: boolean } | null>(null);
  const [lsDialog, setLsDialog] = React.useState<{ chapterId: string; title: string; description: string; isPublished: boolean } | null>(null);
  const [quiz, setQuiz] = React.useState<{ chapterId: string; chapterTitle: string } | null>(null);

  return (
    <div className="space-y-4">
      {canContent && (
        <div className="flex justify-end">
          <Button variant="accent" onClick={() => setChDialog({ id: null, title: "", description: "", coverKey: null, isPublished: true })}>
            <FolderPlus className="size-4" /> Add chapter
          </Button>
        </div>
      )}
      {chapters.length === 0 && (
        <EmptyState icon={<Layers />} title="No chapters yet" description="Start with a chapter like “Human Systems” or “Ecology”, then add lessons inside it." />
      )}
      <AnimatePresence initial={false}>
        {chapters.map((ch, i) => (
          <motion.div key={ch.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {ch.coverKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${ch.coverKey}`} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">{ch.title}</p>
                    {!ch.isPublished && (
                      <Badge tone="neutral">
                        <EyeOff className="size-3" /> Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ch.lessons.length} lessons · {ch.quizzes.length} quiz{ch.quizzes.length === 1 ? "" : "zes"}
                  </p>
                </div>
              </div>
              {canContent && (
                <div className="flex shrink-0 gap-1.5">
                  <Button size="icon-sm" variant="ghost" disabled={i === 0 || pending} onClick={() => exec(() => moveChapterAction(ch.id, -1))} aria-label="Move up">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" disabled={i === chapters.length - 1 || pending} onClick={() => exec(() => moveChapterAction(ch.id, 1))} aria-label="Move down">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setChDialog({ id: ch.id, title: ch.title, description: ch.description, coverKey: ch.coverKey, isPublished: ch.isPublished })} aria-label="Edit">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="hover:text-danger"
                    onClick={async () => {
                      if (await confirm({ title: `Delete “${ch.title}”?`, description: "All lessons, files, homework and the chapter quiz inside it will be permanently deleted.", danger: true, confirmLabel: "Delete chapter", typeToConfirm: "DELETE" }))
                        exec(() => deleteChapterAction(ch.id));
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1.5 p-3 sm:p-4">
              {ch.lessons.map((l, li) => (
                <div key={l.id} className="group flex items-center gap-2 rounded-2xl p-2 transition hover:bg-muted/60">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{li + 1}</span>
                  <Link prefetch={false} href={`/admin/courses/${courseId}/lessons/${l.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-primary">{l.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.resources} materials · {l.homework ? `${l.homework} homework` : "no homework yet"}
                      {!l.isPublished && " · hidden"}
                    </p>
                  </Link>
                  {canContent && (
                    <div className="flex opacity-60 transition group-hover:opacity-100">
                      <Button size="icon-sm" variant="ghost" disabled={li === 0 || pending} onClick={() => exec(() => moveLessonAction(l.id, -1))} aria-label="Move up">
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" disabled={li === ch.lessons.length - 1 || pending} onClick={() => exec(() => moveLessonAction(l.id, 1))} aria-label="Move down">
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="hover:text-danger"
                        onClick={async () => {
                          if (await confirm({ title: `Delete lesson “${l.title}”?`, description: "Its files, homework and Q&A will be deleted.", danger: true, confirmLabel: "Delete" })) exec(() => deleteLessonAction(l.id));
                        }}
                        aria-label="Delete lesson"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                  <Link prefetch={false} href={`/admin/courses/${courseId}/lessons/${l.id}`} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-card">
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              ))}
              {ch.quizzes.map((q) => (
                <Link prefetch={false} key={q.id} href={`/admin/assessments/${q.id}`} className="flex items-center gap-3 rounded-2xl border border-ember-200 bg-ember-50/60 p-3 transition hover:border-foreground/20 dark:border-ember-800/40 dark:bg-ember-900/15">
                  <span className="grid size-9 place-items-center rounded-lg border border-border text-ember-600 dark:text-ember-400">
                    <FileQuestion className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">Chapter quiz: {q.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {q.questions} questions · due {df.format(new Date(q.dueAt))} · {q.submissions} submitted
                    </span>
                  </span>
                  {!q.isPublished && <Badge tone="neutral">Draft</Badge>}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                {canContent && (
                  <Button size="sm" variant="secondary" onClick={() => setLsDialog({ chapterId: ch.id, title: "", description: "", isPublished: true })}>
                    <Plus className="size-4" /> Add lesson
                  </Button>
                )}
                {canAssess && (
                  <Button size="sm" variant="secondary" onClick={() => setQuiz({ chapterId: ch.id, chapterTitle: ch.title })}>
                    <ClipboardList className="size-4" /> Add chapter quiz
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Dialog open={!!chDialog} onOpenChange={(o) => !o && setChDialog(null)}>
        {chDialog && (
          <DialogContent title={chDialog.id ? "Edit chapter" : "New chapter"} description="Chapters group lessons — e.g. Human Systems, Ecology, Genetics.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                exec(() => saveChapterAction(courseId, chDialog.id, chDialog), { onSuccess: () => setChDialog(null) });
              }}
              className="space-y-4"
            >
              <Field label="Chapter title" value={chDialog.title} onChange={(e) => setChDialog({ ...chDialog, title: e.target.value })} required autoFocus />
              <TextArea label="Description (optional)" rows={3} value={chDialog.description} onChange={(e) => setChDialog({ ...chDialog, description: e.target.value })} />
              <div>
                <Label>Chapter image (optional)</Label>
                {chDialog.coverKey && (
                  <div className="mb-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${chDialog.coverKey}`} alt="" className="size-16 rounded-xl object-cover" />
                    <button type="button" className="text-xs font-semibold text-danger" onClick={() => setChDialog({ ...chDialog, coverKey: null })}>
                      Remove
                    </button>
                  </div>
                )}
                <FileDrop purpose="cover" accept="image/*" compact label="Upload image" onUploaded={(f) => setChDialog((d) => (d ? { ...d, coverKey: f.key } : d))} />
              </div>
              <Switch checked={chDialog.isPublished} onChange={(b) => setChDialog({ ...chDialog, isPublished: b })} label="Visible to students" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setChDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Save chapter
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!lsDialog} onOpenChange={(o) => !o && setLsDialog(null)}>
        {lsDialog && (
          <DialogContent title="New lesson" description="You'll upload PDFs, recordings and create the homework on the next screen.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                exec(() => saveLessonAction(lsDialog.chapterId, null, lsDialog), {
                  onSuccess: (id) => {
                    setLsDialog(null);
                    if (id) router.push(`/admin/courses/${courseId}/lessons/${id}`);
                  },
                });
              }}
              className="space-y-4"
            >
              <Field label="Lesson title" value={lsDialog.title} onChange={(e) => setLsDialog({ ...lsDialog, title: e.target.value })} required autoFocus />
              <TextArea label="Description (optional)" rows={3} value={lsDialog.description} onChange={(e) => setLsDialog({ ...lsDialog, description: e.target.value })} />
              <Switch checked={lsDialog.isPublished} onChange={(b) => setLsDialog({ ...lsDialog, isPublished: b })} label="Visible to students" description="Students get a notification when a lesson is published" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setLsDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create lesson
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {quiz && (
        <AssessmentDialog
          open={!!quiz}
          onOpenChange={(o) => !o && setQuiz(null)}
          courseId={courseId}
          placeLabel={`Chapter: ${quiz.chapterTitle}`}
          initial={
            {
              type: "QUIZ",
              chapterId: quiz.chapterId,
              lessonId: null,
              title: `${quiz.chapterTitle} — Chapter Quiz`,
              instructions: "",
              opensAt: "",
              dueAt: defaultDue(),
              durationMinutes: 30,
              maxAttempts: 1,
              answerVisibility: "AFTER_DEADLINE",
              shuffleQuestions: true,
              isPublished: false,
            } satisfies AssessmentValues
          }
        />
      )}
    </div>
  );
}
