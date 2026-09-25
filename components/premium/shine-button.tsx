"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "brand" | "outline"
  size?: "md" | "lg"
  loading?: boolean
  children: React.ReactNode
}

const variants = {
  primary: "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:shadow-[0_12px_32px_-8px_color-mix(in_oklch,var(--primary)_70%,transparent)]",
  brand: "bg-brand text-brand-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklch,var(--brand)_60%,transparent)] hover:shadow-[0_12px_32px_-8px_color-mix(in_oklch,var(--brand)_70%,transparent)]",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
}

const sizes = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
}

export const ShineButton = React.forwardRef<HTMLButtonElement, ShineButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        disabled={disabled || loading}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-shadow duration-300 outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60",
          "[&_svg]:size-4 [&_svg]:shrink-0",
          variants[variant],
          sizes[size],
          className,
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        {loading && <Spinner />}
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </motion.button>
    )
  },
)
ShineButton.displayName = "ShineButton"
