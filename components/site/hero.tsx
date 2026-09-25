"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRightIcon, PlayCircleIcon, ShieldCheckIcon, VideoIcon, MessageCircleIcon } from "lucide-react"
import { ShineButton } from "@/components/premium/shine-button"
import { AuroraBackground } from "@/components/premium/motion"
import { Badge } from "@/components/ui/badge"

const DnaHelix = dynamic(() => import("@/components/premium/dna-helix").then((m) => m.DnaHelix), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse rounded-full bg-primary/5" />,
})

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <AuroraBackground />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-start gap-7">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <Badge variant="outline" className="gap-2 rounded-full border-brand/40 bg-brand/10 px-3 py-1 text-brand-foreground">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-[pulse-ring_1.8s_ease-out_infinite] rounded-full bg-brand" />
                <span className="relative size-2 rounded-full bg-brand" />
              </span>
              Batch 2026 · Enrolment open
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-balance font-heading text-5xl leading-[1.02] font-bold tracking-tight md:text-6xl lg:text-7xl"
          >
            Biology, taught the way it <span className="text-gradient">finally clicks.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Live Zoom sessions with Dr. Mina Samuel, structured chapters, timed MCQ quizzes, and one-to-one follow-up. Everything
            a serious biology student needs, in one calm place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="flex flex-wrap items-center gap-3"
          >
            <ShineButton size="lg" variant="brand" onClick={() => (window.location.href = "/courses")}>
              Explore courses
              <ArrowRightIcon />
            </ShineButton>
            <Link
              href="/about"
              className="inline-flex h-13 items-center gap-2 rounded-xl px-5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <PlayCircleIcon className="size-5 text-primary" />
              Meet Dr. Mina
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <li className="inline-flex items-center gap-2">
              <VideoIcon className="size-4 text-primary" /> Live Zoom + recordings
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-primary" /> Secure InstaPay / Vodafone Cash
            </li>
            <li className="inline-flex items-center gap-2">
              <MessageCircleIcon className="size-4 text-primary" /> Private WhatsApp groups
            </li>
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="relative mx-auto aspect-square w-full max-w-[520px]"
        >
          <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_70%)] blur-2xl" />
          <DnaHelix className="relative size-full" />
          <FloatingStat className="top-[8%] left-[2%]" label="Live sessions" value="2× weekly" />
          <FloatingStat className="right-[0%] top-[36%]" label="Avg. quiz score" value="86%" tone="brand" delay={0.6} />
          <FloatingStat className="bottom-[8%] left-[10%]" label="Students" value="1,200+" delay={1.1} />
        </motion.div>
      </div>
    </section>
  )
}

function FloatingStat({
  className,
  label,
  value,
  tone = "primary",
  delay = 0,
}: {
  className: string
  label: string
  value: string
  tone?: "primary" | "brand"
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{ opacity: { delay: delay + 0.8, duration: 0.5 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay } }}
      className={`glass depth-shadow absolute flex flex-col gap-0.5 rounded-2xl px-4 py-3 ${className}`}
    >
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={`font-heading text-xl font-bold ${tone === "brand" ? "text-brand" : "text-primary"}`}>{value}</span>
    </motion.div>
  )
}
