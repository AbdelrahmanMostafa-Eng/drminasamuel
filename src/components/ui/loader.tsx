"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Helix({ className, count = 12 }: { className?: string; count?: number }) {
  return (
    <div className={cn("helix", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ ["--i" as string]: i } as React.CSSProperties}>
          <i />
        </span>
      ))}
    </div>
  );
}

export function InlineLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Helix count={10} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/** Full-screen brand loader shown on first paint, fades out once the page is ready. */
export function PageLoader() {
  const [show, setShow] = React.useState(true);
  const [progress, setProgress] = React.useState(8);
  React.useEffect(() => {
    let p = 8;
    const iv = setInterval(() => {
      p = Math.min(92, p + Math.random() * 18);
      setProgress(p);
    }, 160);
    const finish = () => {
      setProgress(100);
      setTimeout(() => setShow(false), 380);
    };
    try {
      sessionStorage.setItem("ba_loaded", "1");
    } catch {
      /* private mode */
    }
    const minTime = new Promise((r) => setTimeout(r, 700));
    const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true }));
    Promise.all([minTime, loaded]).then(finish);
    const failSafe = setTimeout(finish, 4000);
    return () => {
      clearInterval(iv);
      clearTimeout(failSafe);
    };
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="ba-loader"
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-brand-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute left-[60%] top-[40%] size-72 rounded-full bg-ember-500/20 blur-3xl" />
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.2, 0.9, 0.3, 1.2] }}
              className="relative mb-6 [perspective:600px]"
            >
              <div className="absolute inset-0 animate-pulse-ring rounded-3xl bg-ember-400/30" />
              <div className="relative grid size-24 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600 to-brand-800 shadow-[0_10px_0_0_#07161e,0_30px_60px_-20px_rgb(0_0_0/0.8)]">
                <Image src="/brand/logo-mark-white.png" alt="Bioacademy" width={60} height={56} priority className="h-14 w-auto" />
              </div>
            </motion.div>
            <Helix count={14} />
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-5 font-display text-2xl font-semibold tracking-tight text-white">
              Bio<span className="text-ember-400">academy</span>
            </motion.p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-brand-200/70">Dr. Mina Samuel</p>
            <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-ember-400 to-brand-300" animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
