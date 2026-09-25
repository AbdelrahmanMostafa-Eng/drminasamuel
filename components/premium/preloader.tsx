"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"

const STRAND_POINTS = 14

export function Preloader() {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    const already = window.sessionStorage.getItem("bioacademy.preloaded")
    if (already) {
      setVisible(false)
      return
    }
    const t = window.setTimeout(() => {
      setVisible(false)
      window.sessionStorage.setItem("bioacademy.preloaded", "1")
    }, 1700)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          role="status"
          aria-live="polite"
          aria-label="Loading Bioacademy"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background"
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex size-28 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full border border-primary/30"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-brand/40"
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 14 }}
              className="relative size-20 overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border"
            >
              <Image src="/brand/logo.png" alt="" fill className="object-contain p-1.5" priority />
            </motion.div>
          </div>

          <div className="flex h-10 items-center gap-1.5" aria-hidden>
            {Array.from({ length: STRAND_POINTS }).map((_, i) => (
              <motion.span
                key={i}
                className="block w-1 rounded-full bg-primary"
                animate={{ height: [8, 32, 8], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
              />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-heading text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase"
          >
            Bioacademy
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
