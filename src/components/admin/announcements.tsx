"use client";

import * as React from "react";
import { Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select, TextArea } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm";
import { deleteAnnouncementAction, saveAnnouncementAction } from "@/actions/admin-misc";
import { useAction } from "./use-action";

type A = { id: string; title: string; body: string; isPinned: boolean; courseId: string | null; course: string | null; author: string | null; createdAt: string };
const df = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function Announcements({ items, courses }: { items: A[]; courses: { id: string; title: string }[] }) {
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  const [edit, setEdit] = React.useState<{ id: string | null; title: string; body: string; isPinned: boolean; courseId: string } | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="accent" onClick={() => setEdit({ id: null, title: "", body: "", isPinned: false, courseId: courses[0]?.id ?? "" })}>
          <Plus className="size-4" /> New announcement
        </Button>
      </div>
      {items.length === 0 && <EmptyState icon={<Megaphone />} title="No announcements yet" description="Post updates — students get an in-app notification instantly." />}
      {items.map((a) => (
        <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {a.isPinned && <Badge tone="ember"><Pin className="size-3" /> Pinned</Badge>}
                <Badge tone="neutral">{a.course ?? "All students"}</Badge>
              </div>
              <p className="mt-2 text-lg font-bold">{a.title}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.author ?? "—"} · {df.format(new Date(a.createdAt))}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => setEdit({ id: a.id, title: a.title, body: a.body, isPinned: a.isPinned, courseId: a.courseId ?? "" })} aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="hover:text-danger"
                onClick={async () => {
                  if (await confirm({ title: "Delete announcement?", danger: true, confirmLabel: "Delete" })) exec(() => deleteAnnouncementAction(a.id));
                }}
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        {edit && (
          <DialogContent title={edit.id ? "Edit announcement" : "New announcement"} description={edit.id ? undefined : "Students are notified immediately."}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                exec(() => saveAnnouncementAction(edit.id, { ...edit, courseId: edit.courseId || null }), { onSuccess: () => setEdit(null) });
              }}
              className="space-y-4"
            >
              <Select label="Audience" value={edit.courseId} onChange={(e) => setEdit({ ...edit, courseId: e.target.value })}>
                <option value="">All enrolled students</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
              <Field label="Title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required />
              <TextArea label="Message" rows={6} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} required />
              <Switch checked={edit.isPinned} onChange={(b) => setEdit({ ...edit, isPinned: b })} label="Pin to top" />
              <div className="flex justify-end">
                <Button type="submit" loading={pending}>
                  {edit.id ? "Save" : "Post & notify"}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
