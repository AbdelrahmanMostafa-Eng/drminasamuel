"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, CalendarCheck2, ClipboardCheck, PlayCircle, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/settings";

const DnaScene = dynamic(() => import("./dna-scene"), { ssr: false });

function FloatCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.9 + delay, duration: 0.7, ease: [0.2, 0.9, 0.3, 1.2] }}
      className={`absolute z-20 ${className}`}
    >
      <div className="animate-float rounded-2xl border border-white/15 bg-brand-900/55 px-4 py-3 text-white shadow-[0_20px_40px_-18px_rgb(0_0_0/0.7)] backdrop-blur-xl" style={{ animationDelay: `${delay * 2}s` }}>
        {children}
      </div>
    </motion.div>
  );
}

export function Hero({ hero, loggedIn }: { hero: SiteSettings["hero"]; loggedIn: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 20 });

  return (
    <section
      className="relative overflow-hidden bg-brand-950 pb-20 pt-32 text-white sm:pt-36 lg:pb-28"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -left-40 top-10 size-[36rem] rounded-full bg-brand-500/25 blur-[120px]" />
      <div className="absolute -right-20 bottom-0 size-[30rem] rounded-full bg-ember-500/20 blur-[120px]" />

      <div className="container-x relative grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-brand-100 backdrop-blur">
              <Sparkles className="size-3.5 text-ember-400" />
              {hero.eyebrow}
            </span>
          </motion.div>
          <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.4rem]">
            {hero.title.split(" ").map((w, i) => (
              <motion.span
                key={i}
                className="mr-[0.25em] inline-block"
                initial={{ opacity: 0, y: 40, rotateX: -70 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.45 + i * 0.08, duration: 0.8, ease: [0.2, 0.9, 0.3, 1] }}
              >
                {w}
              </motion.span>
            ))}
            <br />
            <motion.em
              className="text-gradient inline-block italic"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.8 }}
            >
              {hero.highlight}
            </motion.em>
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-6 max-w-xl text-base leading-relaxed text-brand-100/80 sm:text-lg">
            {hero.subtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/courses" variant="accent" size="lg">
              Explore courses <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href={loggedIn ? "/dashboard" : "/register"} variant="glass" size="lg">
              {loggedIn ? "Go to my dashboard" : "Create free account"}
            </ButtonLink>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25 }} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-100/70">
            {["Live Zoom sessions", "Recorded lessons", "Homework + quizzes", "Progress analytics"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-ember-400 shadow-[0_0_10px_#ff8a1a]" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }} className="relative mx-auto aspect-[1/1.02] w-full max-w-[560px] [transform-style:preserve-3d]">
          <DnaScene className="absolute -inset-[10%] z-0 opacity-90 [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_72%)]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.2, 0.9, 0.3, 1] }}
            className="absolute inset-x-[4%] bottom-0 z-10 [transform:translateZ(40px)]"
          >
            <Image src="/brand/dr-mina.webp" alt="Dr. Mina Samuel" width={816} height={698} priority className="h-auto w-full drop-shadow-[0_30px_50px_rgb(0_0_0/0.55)] [mask-image:linear-gradient(to_bottom,black_82%,transparent)]" />
          </motion.div>
          <FloatCard className="-left-2 top-[18%] sm:-left-6" delay={0}>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_3px_0_0_#08623f]">
                <CalendarCheck2 className="size-4.5" />
              </div>
              <div>
                <p className="text-[0.7rem] text-brand-100/70">Next live session</p>
                <p className="text-sm font-bold">Join with one tap</p>
              </div>
            </div>
          </FloatCard>
          <FloatCard className="-right-1 top-[44%] sm:-right-4" delay={0.25}>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-ember-300 to-ember-500 shadow-[0_3px_0_0_#b94a07]">
                <ClipboardCheck className="size-4.5" />
              </div>
              <div>
                <p className="text-[0.7rem] text-brand-100/70">Chapter quiz</p>
                <p className="text-sm font-bold">
                  Score <span className="text-ember-300">96%</span>
                </p>
              </div>
            </div>
          </FloatCard>
          <FloatCard className="bottom-[12%] left-[2%]" delay={0.5}>
            <div className="flex items-center gap-2.5">
              <PlayCircle className="size-5 text-brand-200" />
              <p className="text-sm font-semibold">Recorded sessions, anytime</p>
            </div>
          </FloatCard>
        </motion.div>
      </div>
    </section>
  );
}
