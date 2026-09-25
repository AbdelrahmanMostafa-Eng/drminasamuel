"use client"

import * as React from "react"
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: number
  glare?: boolean
  children: React.ReactNode
}

export function TiltCard({ className, intensity = 10, glare = true, children, ...rest }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 220, damping: 22 })
  const sry = useSpring(ry, { stiffness: 220, damping: 22 })
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, color-mix(in oklch, var(--brand) 22%, transparent), transparent 60%)`

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * intensity * 2)
    rx.set((0.5 - py) * intensity * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    gx.set(50)
    gy.set(50)
  }

  return (
    <div className="perspective-1200" {...rest}>
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: srx, rotateY: sry }}
        className={cn("relative preserve-3d will-change-transform", className)}
      >
        {children}
        {glare && (
          <motion.span
            aria-hidden
            style={{ background: glareBg }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </motion.div>
    </div>
  )
}
