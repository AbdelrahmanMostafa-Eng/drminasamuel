"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string
  error?: string
  hint?: string
  leading?: React.ReactNode
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, hint, leading, className, id, type = "text", ...props }, ref) => {
    const autoId = React.useId()
    const inputId = id ?? autoId
    const [reveal, setReveal] = React.useState(false)
    const isPassword = type === "password"
    const resolvedType = isPassword && reveal ? "text" : type

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <div
          className={cn(
            "group relative rounded-xl border bg-card transition-all duration-200",
            "focus-within:border-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_16%,transparent)]",
            error && "border-destructive focus-within:border-destructive",
          )}
          data-invalid={error ? true : undefined}
        >
          {leading && (
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
              {leading}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "peer h-14 w-full rounded-xl bg-transparent px-4 pt-5 pb-1.5 text-sm text-foreground outline-none",
              leading && "pl-10",
              isPassword && "pr-11",
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute top-1/2 left-4 origin-left -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200",
              "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-primary",
              "peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium",
              leading && "left-10",
              error && "peer-focus:text-destructive",
            )}
          >
            {label}
          </label>
          {isPassword && (
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="px-1 text-xs font-medium text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="px-1 text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
FloatingInput.displayName = "FloatingInput"
