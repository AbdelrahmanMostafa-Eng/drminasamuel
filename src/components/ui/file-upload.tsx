"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, CloudUpload, FileText, Film, ImageIcon, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

export type UploadPurpose = "cover" | "course-file" | "payment-proof" | "avatar" | "question-image";
export type UploadedFile = { key: string; name: string; size: number; type: string };

/** Uploads a file to storage (S3/R2 presigned PUT, or this site's own endpoint for disk/database storage) with progress. */
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
  const put = (url: string, body: Blob, onProgress: (loaded: number) => void) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      Object.entries((data.headers ?? {}) as Record<string, string>).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(parseErr(xhr.responseText) ?? "Upload failed")));
      xhr.onerror = () => reject(new Error("Network error while uploading"));
      xhr.send(body);
    });
  const total = Math.max(file.size, 1);
  const chunk = typeof data.chunkSize === "number" && data.chunkSize > 0 ? (data.chunkSize as number) : 0;
  if (!chunk) {
    await put(data.url, file, (loaded) => opts.onProgress?.(Math.round((loaded / total) * 100)));
  } else {
    // Database storage (no S3 yet): send the file in pieces small enough for the server's request limit.
    const parts = Math.max(1, Math.ceil(file.size / chunk));
    const sep = String(data.url).includes("?") ? "&" : "?";
    for (let i = 0; i < parts; i++) {
      const from = i * chunk;
      for (let attempt = 0; ; attempt++) {
        try {
          await put(`${data.url}${sep}part=${i}&parts=${parts}`, file.slice(from, from + chunk), (loaded) => opts.onProgress?.(Math.min(99, Math.round(((from + loaded) / total) * 100))));
          break;
        } catch (e) {
          // A dropped connection on one piece is retried once; validation errors are not.
          if (attempt >= 1 || !(e instanceof Error) || !/Network error/.test(e.message)) throw e;
        }
      }
    }
    opts.onProgress?.(100);
  }
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
          drag ? "border-foreground bg-foreground/[0.03]" : "border-input bg-card hover:border-foreground/30",
        )}
      >
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25 blur-[1px]" />
        )}
        <div className="relative">
          <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground/60">
            {done ? <CheckCircle2 className="size-6 text-success" /> : <Icon className="size-6" />}
          </div>
          <p className="text-sm font-medium">{done ? done.name : label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{done ? `${formatBytes(done.size)} · uploaded — click to replace` : hint}</p>
        </div>
        <AnimatePresence>
          {progress !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-6 bottom-3">
              <div className="h-1 overflow-hidden rounded-full bg-border">
                <motion.div className="h-full rounded-full bg-foreground" animate={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">Uploading {progress}%</p>
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
