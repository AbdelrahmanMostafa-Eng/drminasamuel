"use client";

import * as React from "react";
import { Download, ExternalLink, FileText, Film, Link2, Maximize2 } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { PdfCanvas } from "./pdf-canvas";

export type MediaItem = {
  id: string;
  kind: "PDF" | "VIDEO" | "LINK" | "FILE";
  title: string;
  description: string | null;
  src: string | null; // protected file url
  embed: string | null; // external embed url
  externalUrl: string | null;
  size: number | null;
  allowDownload: boolean;
};

export function Watermark({ text }: { text: string }) {
  return (
    <>
      <span className="watermark text-sm">{text}</span>
      <span className="watermark text-xs" style={{ animationDelay: "-14s", animationDuration: "34s" }}>
        {text}
      </span>
    </>
  );
}

export function VideoPlayer({ item, watermark }: { item: MediaItem; watermark: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-lift" onContextMenu={(e) => e.preventDefault()}>
      {item.embed ? (
        <iframe src={item.embed} title={item.title} className="aspect-video w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      ) : item.src ? (
        <video src={item.src} controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline preload="metadata" className="aspect-video w-full bg-black" />
      ) : (
        <div className="grid aspect-video place-items-center text-white/70">
          <a href={item.externalUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 font-semibold">
            Open video <ExternalLink className="size-4" />
          </a>
        </div>
      )}
      <Watermark text={watermark} />
    </div>
  );
}

export function PdfViewer({ item, watermark }: { item: MediaItem; watermark: string }) {
  const [full, setFull] = React.useState(false);
  if (!item.src) return null;
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-soft", full && "fixed inset-2 z-50 flex flex-col shadow-2xl sm:inset-6")}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40">
            <FileText className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{item.title}</p>
            <p className="text-xs text-muted-foreground">PDF {item.size ? `· ${formatBytes(item.size)}` : ""}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {item.allowDownload && (
            <a href={`${item.src}?download=1`} className="grid size-9 place-items-center rounded-xl border border-border hover:bg-muted" title="Download">
              <Download className="size-4" />
            </a>
          )}
          <button onClick={() => setFull((f) => !f)} className="grid size-9 place-items-center rounded-xl border border-border hover:bg-muted" title="Full screen">
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>
      <div className={cn("relative", full ? "min-h-0 flex-1" : "h-[72vh]")}>
        <PdfCanvas src={item.src} watermark={watermark} />
      </div>
      {full && <div className="fixed inset-0 -z-10 bg-black/60" onClick={() => setFull(false)} />}
    </div>
  );
}

export function ResourceRow({ item }: { item: MediaItem }) {
  const Icon = item.kind === "VIDEO" ? Film : item.kind === "PDF" ? FileText : Link2;
  const href = item.kind === "LINK" ? item.externalUrl : item.src ? `${item.src}${item.allowDownload ? "?download=1" : ""}` : item.externalUrl;
  return (
    <a href={href ?? "#"} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft transition hover:border-brand-300">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{item.title}</span>
        {item.description && <span className="block truncate text-xs text-muted-foreground">{item.description}</span>}
      </span>
      <ExternalLink className="size-4 text-muted-foreground transition group-hover:text-foreground" />
    </a>
  );
}
