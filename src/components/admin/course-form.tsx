"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Banknote, CalendarDays, Hash, Link2, Plus, Tag, Type, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Field, Select, TextArea, Label } from "@/components/ui/input";
import { ChoiceCard, Switch } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileDrop } from "@/components/ui/file-upload";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { createCourseAction, updateCourseAction } from "@/actions/admin-courses";
import { cn } from "@/lib/utils";
export type { CourseFormValues } from "@/lib/course-defaults";
import type { CourseFormValues } from "@/lib/course-defaults";





export function CourseForm({ id, initial, courses }: { id?: string; initial: CourseFormValues; courses: { id: string; title: string }[] }) {
  const router = useRouter();
  const [v, setV] = React.useState(initial);
  const [pending, start] = React.useTransition();
  const [hl, setHl] = React.useState("");
  const set = <K extends keyof CourseFormValues>(k: K, val: CourseFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const payload = { ...v, coverKey: v.coverKey, prerequisiteId: v.prerequisiteId || null };
          const r = id ? await updateCourseAction(id, payload) : await createCourseAction(payload);
          if (!r.ok) return void toast.error(r.error);
          toast.success(id ? "Course saved" : "Course created — now add chapters!");
          if (!id && r.data) router.push(`/admin/courses/${r.data}`);
          else router.refresh();
        });
      }}
      className="space-y-8"
    >
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Field label="Course title" icon={<Type />} value={v.title} onChange={(e) => set("title", e.target.value)} required placeholder=" " />
          <Field label="Short subtitle (shown on cards)" value={v.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          <div>
            <Label>Level</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["BASICS", "ADVANCED"] as const).map((l) => (
                <ChoiceCard key={l} selected={v.level === l} onSelect={() => set("level", l)}>
                  <p className="font-bold">{l === "BASICS" ? "Basics" : "Advanced"}</p>
                  <p className="text-xs text-muted-foreground">{l === "BASICS" ? "Foundation course — taught first" : "Exam-level course — after Basics"}</p>
                </ChoiceCard>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select label="Test track" value={v.track} onChange={(e) => set("track", e.target.value)}>
              <option>ACT2 & EST</option>
              <option>ACT2</option>
              <option>EST</option>
              <option>EST2</option>
            </Select>
            <Field label="Batch label" icon={<Tag />} value={v.batchLabel} onChange={(e) => set("batchLabel", e.target.value)} hint="e.g. Winter 2026" />
            <Field label="Price (EGP)" type="number" icon={<Banknote />} value={String(v.price)} onChange={(e) => set("price", Number(e.target.value))} required min={0} />
          </div>
          <TextArea label="Course description" rows={6} value={v.description} onChange={(e) => set("description", e.target.value)} hint="Shown on the public course page (introduction for visitors)." />
        </div>
        <div className="space-y-4">
          <div>
            <Label>Cover image</Label>
            {v.coverUrl && (
              <div className="relative mb-3 overflow-hidden rounded-2xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                <button type="button" onClick={() => setV((s) => ({ ...s, coverKey: null, coverUrl: null }))} className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-black/60 text-white" aria-label="Remove cover">
                  <X className="size-4" />
                </button>
              </div>
            )}
            <FileDrop purpose="cover" accept="image/*" compact preview label="Upload cover" hint="16:9 image, up to 8 MB" onUploaded={(f) => setV((s) => ({ ...s, coverKey: f.key, coverUrl: `/api/files/${f.key}` }))} />
          </div>
          <Field label="Intro video link (YouTube/Vimeo)" icon={<Video />} value={v.introVideoUrl} onChange={(e) => set("introVideoUrl", e.target.value)} hint="Public preview on the course page" />
          <Field label="WhatsApp group invite link" icon={<WhatsAppIcon />} value={v.whatsappGroupUrl} onChange={(e) => set("whatsappGroupUrl", e.target.value)} hint="Shown only to approved students" />
        </div>
      </section>

      <section>
        <Label>What students get (highlights)</Label>
        <div className="flex flex-wrap gap-2">
          {v.highlights.map((h, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 py-1.5 pl-3 pr-1.5 text-sm font-medium">
              {h}
              <button type="button" onClick={() => set("highlights", v.highlights.filter((_, k) => k !== i))} className="grid size-6 place-items-center rounded-lg hover:bg-border" aria-label="Remove">
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={hl}
            onChange={(e) => setHl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (hl.trim()) set("highlights", [...v.highlights, hl.trim()]);
                setHl("");
              }
            }}
            placeholder="Add a highlight and press Enter"
            className="field-input h-11 flex-1 rounded-xl border border-input bg-card px-4 text-sm outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (hl.trim()) set("highlights", [...v.highlights, hl.trim()]);
              setHl("");
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 rounded-2xl border border-border bg-muted/30 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Label>Visibility</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["DRAFT", "Draft", "Hidden"],
                ["PUBLISHED", "Published", "Visible & running"],
                ["ENDED", "Ended", "Finished"],
              ] as const
            ).map(([val, label, sub]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("status", val)}
                className={cn(
                  "rounded-2xl border-2 p-3 text-left transition",
                  v.status === val ? "border-foreground bg-card ring-1 ring-foreground" : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <p className="text-sm font-bold">{label}</p>
                <p className="text-[0.7rem] text-muted-foreground">{sub}</p>
              </button>
            ))}
          </div>
          <Switch checked={v.enrollmentOpen} onChange={(b) => set("enrollmentOpen", b)} label="Enrollment open" description="Students can submit payments for this course" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start date" type="date" icon={<CalendarDays />} value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
            <Field label="End date" type="date" icon={<CalendarDays />} value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          <Select label="Prerequisite course (optional)" value={v.prerequisiteId ?? ""} onChange={(e) => set("prerequisiteId", e.target.value || null)} hint="If set, only students approved in that course can enroll.">
            <option value="">None — anyone can enroll</option>
            {courses.filter((c) => c.id !== id).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Field label="Display order" type="number" icon={<Hash />} value={String(v.sortOrder)} onChange={(e) => set("sortOrder", Number(e.target.value))} hint="Lower numbers appear first" />
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" loading={pending} className="shadow-2xl">
          <Link2 className="hidden" />
          {id ? "Save course" : "Create course"}
        </Button>
      </div>
    </form>
  );
}
