"use client";

import * as React from "react";

const INTERACTIVE = 'a[href], button, [role="button"], summary, label[for], input[type="submit"]';
const TEXT = "input, textarea, select, [contenteditable='true']";

/** Dot + ring magnetic cursor (portfolio template). Desktop pointers only. */
export function MagneticCursor() {
  const dot = React.useRef<HTMLDivElement>(null);
  const ring = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    const update = () => setEnabled(mq.matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    let tx = -100, ty = -100, cx = -100, cy = -100, rx = -100, ry = -100;
    let hover = false, hidden = false, raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = e.target as HTMLElement | null;
      hidden = !!t?.closest(TEXT);
      const el = t?.closest(INTERACTIVE) as HTMLElement | null;
      hover = !!el;
      if (el) {
        const r = el.getBoundingClientRect();
        const dx = tx - (r.left + r.width / 2);
        const dy = ty - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 80) {
          tx -= dx * 0.3;
          ty -= dy * 0.3;
        }
      }
    };
    const onLeave = () => {
      hidden = true;
    };
    const onEnter = () => {
      hidden = false;
    };
    const loop = () => {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        dot.current.style.opacity = hidden ? "0" : "1";
        dot.current.dataset.hover = String(hover);
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        ring.current.style.opacity = hidden ? "0" : "1";
        ring.current.dataset.hover = String(hover);
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.documentElement.classList.add("has-magnetic-cursor");
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("has-magnetic-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference" aria-hidden>
        <div className="cursor-dot -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[9998] mix-blend-difference" aria-hidden>
        <div className="cursor-ring -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
      </div>
      <style>{`
        html.has-magnetic-cursor, html.has-magnetic-cursor * { cursor: none !important; }
        html.has-magnetic-cursor input, html.has-magnetic-cursor textarea, html.has-magnetic-cursor select, html.has-magnetic-cursor [contenteditable='true'] { cursor: auto !important; }
        .cursor-dot { width: 8px; height: 8px; transition: width .2s, height .2s; }
        [data-hover="true"] > .cursor-dot { width: 40px; height: 40px; }
        .cursor-ring { width: 32px; height: 32px; transition: width .3s, height .3s; }
        [data-hover="true"] > .cursor-ring { width: 60px; height: 60px; }
      `}</style>
    </>
  );
}
