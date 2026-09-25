"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedCheckboxProps {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: React.ReactNode
  description?: React.ReactNode
  className?: string
  disabled?: boolean
}

export function AnimatedCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  className,
  disabled,
}: AnimatedCheckboxProps) {
  const autoId = React.useId()
  const inputId = id ?? autoId

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex cursor-pointer items-start gap-3 select-none",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <motion.span
          aria-hidden
          animate={{
            backgroundColor: checked ? "var(--primary)" : "transparent",
            borderColor: checked ? "var(--primary)" : "var(--border)",
            scale: checked ? [1, 1.15, 1] : 1,
          }}
          transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute inset-0 rounded-md border-2 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 group-hover:border-primary/60"
        />
        <svg viewBox="0 0 24 24" className="absolute inset-0 size-5 p-[3px]" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7"
            fill="none"
            stroke="var(--primary-foreground)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </svg>
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5 leading-snug">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
    </label>
  )
}
