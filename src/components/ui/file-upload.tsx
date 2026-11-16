"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, CloudUpload, FileText, Film, ImageIcon, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

export type UploadPurpose = "cover" | "course-file" | "payment-proof" | "avatar" | "question-image";
export type UploadedFile = { key: string; name: string; size: number; type: string };

/** Uploads a file directly to storage (S3/R2 presigned PUT or local endpoint) with progress. */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  opts: { courseId?: string; onProgress?: (pct: number) => void } = {},
): Promise<UploadedFile> {
  const contentType = file.type || "application/octet-stream";
  const res = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose, filename: file.name, contentType, size: file.size, courseId: opts.courseId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.url);
    Object.entries((data.headers ?? {}) as Record<string, string>).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(parseErr(xhr.responseText) ?? "Upload failed")));
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.send(file);
  });
  return { key: data.key, name: file.name, size: file.size, type: contentType };
}

function parseErr(t: string) {
  try {
    return JSON.parse(t).error as string;
  } catch {
    return null;
  }
}

export function FileDrop({
  purpose,
  courseId,
  accept,
  onUploaded,
  label = "Drop a file here or click to browse",
  hint,
  className,
  compact,
  preview,
}: {
  purpose: UploadPurpose;
  courseId?: string;
  accept?: string;
  onUploaded: (f: UploadedFile) => void;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
  preview?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [drag, setDrag] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<UploadedFile | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    setDone(null);
    setProgress(0);
    if (preview && file.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(file));
    try {
      const f = await uploadFile(file, purpose, { courseId, onProgress: setProgress });
      setDone(f);
      onUploaded(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPreviewUrl(null);
    } finally {
      setProgress(null);
    }
  }

  const Icon = accept?.includes("video") ? Film : accept?.includes("image") ? ImageIcon : accept?.includes("pdf") ? FileText : CloudUpload;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-all duration-300",
          compact ? "px-4 py-5" : "px-6 py-9",
          drag ? "scale-[1.01] border-brand-400 bg-brand-50/70 dark:bg-brand-900/30" : "border-input bg-muted/40 hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-900/20",
        )}
      >
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25 blur-[1px]" />
        )}
        <div className="relative">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-card text-brand-600 shadow-[0_4px_0_0_var(--input),0_10px_24px_-12px_rgb(31_96_124/0.5)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3 dark:text-brand-300">
            {done ? <CheckCircle2 className="size-6 text-success" /> : <Icon className="size-6" />}
          </div>
          <p className="text-sm font-semibold">{done ? done.name : label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{done ? `${formatBytes(done.size)} · uploaded — click to replace` : hint}</p>
        </div>
        <AnimatePresence>
          {progress !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-6 bottom-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-ember-400" animate={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[0.7rem] font-semibold text-muted-foreground">Uploading… {progress}%</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
          <X className="size-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
