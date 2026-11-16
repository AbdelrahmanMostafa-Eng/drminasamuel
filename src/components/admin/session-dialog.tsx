"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, KeyRound, Link2, PlaySquare, Plus, Type, Video } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select, TextArea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveSessionAction } from "@/actions/admin-assess";
import { useAction } from "./use-action";

export type SessionValues = {
  courseId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  zoomUrl: string;
  meetingId: string;
  passcode: string;
  joinOpensMinutes: number;
  recordingUrl: string;
};

function nextSlot() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });
  const d = fmt.format(new Date(Date.now() + 86400_000));
  return { startsAt: `${d}T18:00`, endsAt: `${d}T20:00` };
}

export function SessionDialog({
  open,
  onOpenChange,
  id,
  initial,
  courses,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  id?: string;
  initial?: Partial<SessionValues>;
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const make = React.useCallback(
    (): SessionValues => ({
      courseId: courses[0]?.id ?? "",
      title: "",
      description: "",
      ...nextSlot(),
      zoomUrl: "",
      meetingId: "",
      passcode: "",
      joinOpensMinutes: 15,
      recordingUrl: "",
      ...initial,
    }),
    [courses, initial],
  );
  const [v, setV] = React.useState<SessionValues>(make);
  React.useEffect(() => {
    if (open) setV(make());
  }, [open, make]);
  const { pending, exec } = useAction();
  const set = <K extends keyof SessionValues>(k: K, val: SessionValues[K]) => setV((s) => ({ ...s, [k]: val }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" title={id ? "Edit live session" : "Schedule a live session"} description="Students see it on their schedule. The Zoom link is only revealed through the Join button, which marks them present.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const { courseId, ...rest } = v;
            exec(() => saveSessionAction(courseId, id ?? null, rest), {
              onSuccess: (sid) => {
                onOpenChange(false);
                if (!id && sid) router.push(`/admin/sessions/${sid}`);
              },
            });
          }}
          className="space-y-4"
        >
          {!id && (
            <Select label="Course" value={v.courseId} onChange={(e) => set("courseId", e.target.value)} required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          )}
          <Field label="Session title" icon={<Type />} value={v.title} onChange={(e) => set("title", e.target.value)} required placeholder=" " hint="e.g. Session 5 — The Circulatory System" />
          <TextArea label="What will be covered (optional)" rows={2} value={v.description} onChange={(e) => set("description", e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Starts at (Cairo time)" type="datetime-local" icon={<CalendarClock />} value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} required />
            <Field label="Ends at (Cairo time)" type="datetime-local" icon={<CalendarClock />} value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} required hint="Excuses & attendance lock at this time" />
          </div>
          <Field label="Zoom meeting link" icon={<Video />} value={v.zoomUrl} onChange={(e) => set("zoomUrl", e.target.value)} required placeholder=" " />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Meeting ID (optional)" icon={<Link2 />} value={v.meetingId} onChange={(e) => set("meetingId", e.target.value)} />
            <Field label="Passcode (optional)" icon={<KeyRound />} value={v.passcode} onChange={(e) => set("passcode", e.target.value)} />
            <Field label="Join opens (min before)" type="number" icon={<Clock />} min={0} value={String(v.joinOpensMinutes)} onChange={(e) => set("joinOpensMinutes", Number(e.target.value))} />
          </div>
          {id && <Field label="Recording link (after the session)" icon={<PlaySquare />} value={v.recordingUrl} onChange={(e) => set("recordingUrl", e.target.value)} hint="Students are notified when you add it" />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {id ? "Save session" : "Schedule session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewSessionButton({ courses, autoOpen, courseId, label = "Schedule session" }: { courses: { id: string; title: string }[]; autoOpen?: boolean; courseId?: string; label?: string }) {
  const [open, setOpen] = React.useState(!!autoOpen);
  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)} disabled={!courses.length}>
        <Plus className="size-4" /> {label}
      </Button>
      <SessionDialog open={open} onOpenChange={setOpen} courses={courses} initial={courseId ? { courseId } : undefined} />
    </>
  );
}

export function EditSessionButton({ id, initial, courses }: { id: string; initial: SessionValues; courses: { id: string; title: string }[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <SessionDialog open={open} onOpenChange={setOpen} id={id} initial={initial} courses={courses} />
    </>
  );
}
