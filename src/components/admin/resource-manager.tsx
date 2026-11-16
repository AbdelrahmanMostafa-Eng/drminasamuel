"use client";

import * as React from "react";
import { BookMarked, Download, FileText, Film, Link2, Paperclip, Star, Trash2, MonitorPlay } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/checkbox";
import { FileDrop, type UploadedFile } from "@/components/ui/file-upload";
import { StateTabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm";
import { addResourceAction, deleteResourceAction, updateResourceAction } from "@/actions/admin-courses";
import { useAction } from "./use-action";
import { formatBytes, toEmbedUrl } from "@/lib/utils";

export type ResourceRowData = {
  id: string;
  kind: "PDF" | "VIDEO" | "LINK" | "FILE";
  title: string;
  url: string | null;
  storageKey: string | null;
  size: number | null;
  allowDownload: boolean;
  isMainBook: boolean;
};

const ICON = { PDF: FileText, VIDEO: Film, LINK: Link2, FILE: Paperclip };

export function ResourceManager({ courseId, lessonId, items, books }: { courseId: string; lessonId: string | null; items: ResourceRowData[]; books?: boolean }) {
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  const [mode, setMode] = React.useState<"pdf" | "video" | "vlink" | "link">(books ? "pdf" : "pdf");
  const [file, setFile] = React.useState<UploadedFile | null>(null);
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [allowDownload, setAllowDownload] = React.useState(false);
  const [mainBook, setMainBook] = React.useState(books && !items.some((i) => i.isMainBook));
  const [resetKey, setResetKey] = React.useState(0);

  function reset() {
    setFile(null);
    setTitle("");
    setUrl("");
    setResetKey((k) => k + 1);
  }

  function save() {
    let kind: ResourceRowData["kind"];
    if (mode === "pdf") kind = file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf") ? "PDF" : "FILE";
    else if (mode === "video" || mode === "vlink") kind = "VIDEO";
    else kind = "LINK";
    if ((mode === "pdf" || mode === "video") && !file) return void toast.error("Upload a file first.");
    if ((mode === "vlink" || mode === "link") && !url.trim()) return void toast.error("Paste a link first.");
    if (mode === "vlink" && !toEmbedUrl(url)) toast.message("This link can't be embedded — students will open it in a new tab.");
    exec(
      () =>
        addResourceAction(courseId, lessonId, {
          kind,
          title: title.trim() || file?.name.replace(/\.[^.]+$/, "") || "Untitled",
          storageKey: file?.key ?? null,
          url: mode === "vlink" || mode === "link" ? url.trim() : null,
          mimeType: file?.type ?? null,
          size: file?.size ?? null,
          allowDownload,
          isMainBook: !!books && !!mainBook,
        }),
      { onSuccess: reset },
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {items.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{books ? "No book uploaded yet." : "No materials yet — add PDFs, recordings or links below."}</p>}
        {items.map((r) => {
          const Icon = r.isMainBook ? BookMarked : ICON[r.kind];
          return (
            <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${r.isMainBook ? "bg-ember-100 text-ember-600 dark:bg-ember-900/40" : "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200"}`}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 break-words text-sm font-bold">{r.title}</p>
                  {r.isMainBook && <Badge tone="ember">Main book</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {r.kind} {r.size ? `· ${formatBytes(r.size)}` : ""} {r.url ? `· ${r.url}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {r.storageKey && (
                    <a href={`/api/files/${r.storageKey}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-primary hover:bg-muted">
                      Preview
                    </a>
                  )}
                  {r.storageKey && (
                    <button
                      onClick={() => exec(() => updateResourceAction(r.id, { title: r.title, allowDownload: !r.allowDownload, isMainBook: r.isMainBook }))}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${r.allowDownload ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <Download className="size-3.5" /> {r.allowDownload ? "Download on" : "Download off"}
                    </button>
                  )}
                  {books && !r.isMainBook && (
                    <button onClick={() => exec(() => updateResourceAction(r.id, { title: r.title, allowDownload: r.allowDownload, isMainBook: true }))} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-ember-600">
                      <Star className="size-3.5" /> Make main book
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (await confirm({ title: "Remove this material?", description: `“${r.title}” will be deleted for all students.`, danger: true, confirmLabel: "Remove" })) exec(() => deleteResourceAction(r.id));
                }}
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:border-red-300 hover:text-danger"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-muted/30 p-4 sm:p-5">
        <Label>{books ? "Upload a book or reference" : "Add material"}</Label>
        {!books && (
          <StateTabs
            id={`res-${lessonId}`}
            value={mode}
            onChange={(m) => {
              setMode(m);
              reset();
            }}
            tabs={[
              { value: "pdf", label: "PDF / file" },
              { value: "video", label: "Upload video" },
              { value: "vlink", label: "Video link" },
              { value: "link", label: "Web link" },
            ]}
          />
        )}
        <div className="mt-4 space-y-4" key={resetKey}>
          {(mode === "pdf" || mode === "video") && (
            <FileDrop
              purpose="course-file"
              courseId={courseId}
              accept={mode === "video" ? "video/*" : books ? "application/pdf" : ".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.zip,image/*,application/pdf"}
              label={mode === "video" ? "Drop the recorded session (MP4) here" : books ? "Drop the full book PDF here" : "Drop a PDF (notes, slides, worksheet)"}
              hint={mode === "video" ? "MP4/WebM/MOV — large files upload directly to storage" : "Up to 2 GB"}
              onUploaded={(f) => {
                setFile(f);
                if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
          )}
          {(mode === "vlink" || mode === "link") && (
            <Field
              label={mode === "vlink" ? "YouTube (unlisted) / Vimeo / Google Drive / Bunny link" : "Link URL"}
              icon={mode === "vlink" ? <MonitorPlay /> : <Link2 />}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              hint={mode === "vlink" ? (url ? (toEmbedUrl(url) ? `✓ Will be embedded (${toEmbedUrl(url)!.provider})` : "Will open in a new tab") : "Tip: unlisted YouTube or Bunny Stream works best") : undefined}
            />
          )}
          <Field label="Title shown to students" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex flex-wrap gap-6">
            {(mode === "pdf" || mode === "video") && <Switch checked={allowDownload} onChange={setAllowDownload} label="Allow download" />}
            {books && <Switch checked={!!mainBook} onChange={setMainBook} label="This is the main course book" />}
          </div>
          <Button onClick={save} loading={pending}>
            Add {books ? "book" : "material"}
          </Button>
        </div>
      </div>
    </div>
  );
}
