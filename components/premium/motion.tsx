"use client"

import * as React from "react"
import { motion, useInView, useMotionValue, useSpring, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

const ease = [0.22, 1, 0.36, 1] as const

export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
  once = true,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  y?: number
  once?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 20 })
  const [display, setDisplay] = React.useState("0")

  React.useEffect(() => {
    if (inView) mv.set(value)
  }, [inView, value, mv])

  React.useEffect(() => {
    return spring.on("change", (v) => setDisplay(v.toFixed(decimals)))
  }, [spring, decimals])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  className,
  children,
  tone = "primary",
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
  tone?: "primary" | "brand" | "success"
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const color = tone === "brand" ? "var(--brand)" : tone === "success" ? "var(--success)" : "var(--primary)"
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * clamped) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  )
}

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -top-1/3 left-1/2 h-[80vh] w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_60%)] blur-3xl" />
      <div className="absolute top-1/3 -right-1/4 h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--brand)_18%,transparent),transparent_60%)] blur-3xl animate-[aurora_14s_ease-in-out_infinite]" />
      <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  )
}
