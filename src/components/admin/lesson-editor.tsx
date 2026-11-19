"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, Plus, Save } from "lucide-react";
import { Field, TextArea } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveLessonAction } from "@/actions/admin-courses";
import { AssessmentDialog } from "./assessment-dialog";
import { useAction } from "./use-action";

export function LessonDetailsForm({ chapterId, lesson }: { chapterId: string; lesson: { id: string; title: string; description: string; isPublished: boolean } }) {
  const [v, setV] = React.useState(lesson);
  const { pending, exec } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        exec(() => saveLessonAction(chapterId, lesson.id, v));
      }}
      className="space-y-4"
    >
      <Field label="Lesson title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} required />
      <TextArea label="Description / summary" rows={4} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      <Switch checked={v.isPublished} onChange={(b) => setV({ ...v, isPublished: b })} label="Visible to students" />
      <Button type="submit" loading={pending}>
        <Save className="size-4" /> Save lesson
      </Button>
    </form>
  );
}

const df = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function HomeworkPanel({
  courseId,
  lessonId,
  lessonTitle,
  items,
  canAssess,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  items: { id: string; title: string; dueAt: string; questions: number; submissions: number; isPublished: boolean }[];
  canAssess: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const due = React.useMemo(() => {
    const d = new Date(Date.now() + 3 * 86400_000);
    return `${new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)}T23:59`;
  }, []);
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted-foreground">No homework for this lesson yet.</p>}
      {items.map((a) => (
        <Link prefetch={false} key={a.id} href={`/admin/assessments/${a.id}`} className="flex items-center gap-3 rounded-2xl border border-border p-3 transition hover:border-foreground/20">
          <span className="grid size-10 place-items-center rounded-lg border border-border text-success">
            <ClipboardList className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{a.title}</span>
            <span className="text-xs text-muted-foreground">
              {a.questions} questions · due {df.format(new Date(a.dueAt))} · {a.submissions} submitted
            </span>
          </span>
          {!a.isPublished && <Badge tone="neutral">Draft</Badge>}
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      ))}
      {canAssess && (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add homework
        </Button>
      )}
      <AssessmentDialog
        open={open}
        onOpenChange={setOpen}
        courseId={courseId}
        placeLabel={`Lesson: ${lessonTitle}`}
        initial={{
          type: "HOMEWORK",
          chapterId: null,
          lessonId,
          title: `${lessonTitle} — Homework`,
          instructions: "",
          opensAt: "",
          dueAt: due,
          durationMinutes: null,
          maxAttempts: 1,
          answerVisibility: "AFTER_DEADLINE",
          shuffleQuestions: false,
          isPublished: false,
        }}
      />
    </div>
  );
}
