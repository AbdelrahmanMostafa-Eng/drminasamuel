"use client";

import * as React from "react";
import { Loader2, Minus, Plus } from "lucide-react";

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m) => {
      m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

/**
 * Renders a protected PDF to canvases with PDF.js — works on Android/iOS where
 * <iframe> PDFs don't, and never exposes a download button.
 */
export function PdfCanvas({ src, watermark }: { src: string; watermark: string }) {
  const wrap = React.useRef<HTMLDivElement>(null);
  const [pages, setPages] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const docRef = React.useRef<Awaited<ReturnType<PdfJs["getDocument"]>["promise"]> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadPdfJs()
      .then((pdfjs) => pdfjs.getDocument({ url: src, withCredentials: true }).promise)
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setPages(doc.numPages);
      })
      .catch(() => !cancelled && setError("Couldn't load this PDF. Please refresh the page."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      void docRef.current?.cleanup?.();
      docRef.current = null;
    };
  }, [src]);

  React.useEffect(() => {
    const doc = docRef.current;
    const host = wrap.current;
    if (!doc || !host || !pages) return;
    let cancelled = false;
    (async () => {
      const width = host.clientWidth - 24;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= pages; n++) {
        if (cancelled) return;
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const scale = (width / base.width) * zoom;
        const vp = page.getViewport({ scale: scale * ratio });
        const canvas = host.querySelector<HTMLCanvasElement>(`canvas[data-page="${n}"]`);
        if (!canvas) continue;
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = `${vp.width / ratio}px`;
        canvas.style.height = `${vp.height / ratio}px`;
        await page.render({ canvas, viewport: vp } as Parameters<typeof page.render>[0]).promise.catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pages, zoom]);

  return (
    <div className="relative size-full">
      <div ref={wrap} className="size-full overflow-auto bg-muted/60 p-3 scrollbar-thin" onContextMenu={(e) => e.preventDefault()}>
        {loading && (
          <div className="grid h-full place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {error && <p className="p-6 text-center text-sm text-danger">{error}</p>}
        <div className="mx-auto flex w-max flex-col items-center gap-3">
          {Array.from({ length: pages }, (_, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg bg-white shadow-soft">
              <canvas data-page={i + 1} className="block select-none" />
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] whitespace-nowrap text-2xl font-extrabold text-brand-900/[0.07] sm:text-4xl">{watermark}</span>
            </div>
          ))}
        </div>
      </div>
      {pages > 0 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-lift backdrop-blur">
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Zoom out">
            <Minus className="size-4" />
          </button>
          <span className="w-12 text-center text-xs font-bold">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Zoom in">
            <Plus className="size-4" />
          </button>
          <span className="px-2 text-xs text-muted-foreground">{pages} p.</span>
        </div>
      )}
    </div>
  );
}
