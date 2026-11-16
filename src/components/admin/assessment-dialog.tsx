"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Hash, Timer, Type } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select, TextArea } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { saveAssessmentAction } from "@/actions/admin-assess";
import { useAction } from "./use-action";

export type AssessmentValues = {
  type: "HOMEWORK" | "QUIZ";
  chapterId: string | null;
  lessonId: string | null;
  title: string;
  instructions: string;
  opensAt: string;
  dueAt: string;
  durationMinutes: number | null;
  maxAttempts: number;
  answerVisibility: "IMMEDIATELY" | "AFTER_DEADLINE" | "NEVER";
  shuffleQuestions: boolean;
  isPublished: boolean;
};

export function AssessmentDialog({
  open,
  onOpenChange,
  courseId,
  id,
  initial,
  placeLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  courseId: string;
  id?: string;
  initial: AssessmentValues;
  placeLabel?: string;
}) {
  const router = useRouter();
  const [v, setV] = React.useState(initial);
  const { pending, exec } = useAction();
  React.useEffect(() => {
    if (open) setV(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = <K extends keyof AssessmentValues>(k: K, val: AssessmentValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const isQuiz = v.type === "QUIZ";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" title={id ? `Edit ${isQuiz ? "quiz" : "homework"}` : `New ${isQuiz ? "chapter quiz" : "lesson homework"}`} description={placeLabel}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            exec(() => saveAssessmentAction(courseId, id ?? null, v), {
              onSuccess: (newId) => {
                onOpenChange(false);
                if (!id && newId) router.push(`/admin/assessments/${newId}`);
              },
            });
          }}
          className="space-y-4"
        >
          <Field label="Title" icon={<Type />} value={v.title} onChange={(e) => set("title", e.target.value)} required />
          <TextArea label="Instructions for students (optional)" rows={3} value={v.instructions} onChange={(e) => set("instructions", e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Opens at (optional)" type="datetime-local" icon={<CalendarClock />} value={v.opensAt} onChange={(e) => set("opensAt", e.target.value)} hint="Leave empty to open immediately" />
            <Field label="Deadline" type="datetime-local" icon={<CalendarClock />} value={v.dueAt} onChange={(e) => set("dueAt", e.target.value)} required hint="Cairo time. PDF report unlocks after this." />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Time limit (minutes)" type="number" icon={<Timer />} min={0} value={v.durationMinutes ? String(v.durationMinutes) : ""} onChange={(e) => set("durationMinutes", e.target.value ? Number(e.target.value) : null)} hint="Empty = no timer" />
            <Field label="Attempts allowed" type="number" icon={<Hash />} min={1} max={10} value={String(v.maxAttempts)} onChange={(e) => set("maxAttempts", Number(e.target.value) || 1)} hint="Best attempt counts" />
            <Select label="Show correct answers" value={v.answerVisibility} onChange={(e) => set("answerVisibility", e.target.value as AssessmentValues["answerVisibility"])}>
              <option value="AFTER_DEADLINE">After the deadline</option>
              <option value="IMMEDIATELY">Right after submitting</option>
              <option value="NEVER">Never (score only)</option>
            </Select>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
            <Switch checked={v.shuffleQuestions} onChange={(b) => set("shuffleQuestions", b)} label="Shuffle questions & options" description="Each student gets a different order — harder to share answers" />
            <Switch checked={v.isPublished} onChange={(b) => set("isPublished", b)} label="Visible to students" description="Turn off to keep it as a draft while you add questions" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {id ? "Save" : "Create & add questions"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
