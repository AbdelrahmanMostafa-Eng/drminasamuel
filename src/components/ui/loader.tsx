"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Three quiet dots — replaces the old helix spinner. */
export function Helix({ className }: { className?: string; count?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-pulse-dot rounded-full bg-foreground/50" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative h-px w-40 overflow-hidden bg-foreground/10">
        <span className="absolute inset-y-0 w-1/3 animate-[loader-slide_1.1s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-foreground/70" />
      </div>
      <p className="eyebrow">{label}</p>
      <style>{`@keyframes loader-slide { from { left: -35%; } to { left: 100%; } }`}</style>
    </div>
  );
}

const LETTERS = "BIOACADEMY".split("");
const IN_STAGGER = 80;
const IN_DUR = 650;
const HOLD = 250;
const IN_TOTAL = IN_STAGGER * (LETTERS.length - 1) + IN_DUR + HOLD;
const OUT_STAGGER = 45;
const OUT_DUR = 420;
const CURTAIN_DELAY = IN_TOTAL + 80;
const CURTAIN_DUR = 1200;
const REVEAL_AT = CURTAIN_DELAY + CURTAIN_DUR - 250;
const TOTAL = CURTAIN_DELAY + OUT_STAGGER * (LETTERS.length - 1) + OUT_DUR + 1300;

type Phase = "idle" | "in" | "out" | "done";

/**
 * Intro from the agentic template: the wordmark blurs in letter by letter,
 * then a curtain lifts to reveal the page. Shown once per browser session.
 */
export function PageLoader() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [curtainUp, setCurtainUp] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("ba-noloader")) {
      setPhase("done");
      return;
    }
    try {
      sessionStorage.setItem("ba_loaded", "1");
    } catch {
      /* private mode */
    }
    const release = () => {
      delete root.dataset.intro;
      window.dispatchEvent(new Event("ba:intro-done"));
    };
    const t = [
      setTimeout(() => setPhase("in"), 60),
      setTimeout(() => setPhase("out"), IN_TOTAL),
      setTimeout(() => setCurtainUp(true), CURTAIN_DELAY),
      setTimeout(release, REVEAL_AT),
      setTimeout(() => setPhase("done"), TOTAL),
    ];
    return () => {
      t.forEach(clearTimeout);
      release();
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div id="ba-loader" className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-0 bg-background"
        style={{ bottom: curtainUp ? "100%" : "0%", transition: curtainUp ? `bottom ${CURTAIN_DUR}ms cubic-bezier(0.76, 0, 0.24, 1)` : "none" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex" style={{ gap: "0.04em" }}>
          {LETTERS.map((letter, i) => {
            const opacity = phase === "in" ? 1 : 0;
            const blur = phase === "idle" ? 32 : phase === "in" ? 0 : 20;
            const y = phase === "idle" ? 40 : phase === "in" ? 0 : -18;
            const transition =
              phase === "out"
                ? `opacity ${OUT_DUR}ms cubic-bezier(0.4,0,1,1) ${i * OUT_STAGGER}ms, filter ${OUT_DUR}ms cubic-bezier(0.4,0,1,1) ${i * OUT_STAGGER}ms, transform ${OUT_DUR}ms cubic-bezier(0.4,0,1,1) ${i * OUT_STAGGER}ms`
                : phase === "in"
                  ? `opacity ${IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${i * IN_STAGGER}ms, filter ${IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${i * IN_STAGGER}ms, transform ${IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${i * IN_STAGGER}ms`
                  : "none";
            return (
              <span
                key={i}
                className="select-none font-display font-light leading-none text-foreground"
                style={{
                  fontSize: `calc((100vw - 48px) / ${LETTERS.length + 1})`,
                  letterSpacing: "-0.02em",
                  opacity,
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${y}px)`,
                  transition,
                  willChange: "opacity, filter, transform",
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
