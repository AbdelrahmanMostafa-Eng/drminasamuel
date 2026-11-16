"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  name?: string;
  value?: string;
};

/** 3D flip checkbox with a drawn checkmark. */
export function Checkbox({ checked, onChange, label, description, disabled, className, name, value }: CheckboxProps) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 select-none", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-0.5 [perspective:200px]">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <motion.span
          data-checked={checked}
          animate={{ rotateY: checked ? 180 : 0, scale: checked ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.38, ease: [0.3, 0.7, 0.4, 1] }}
          className={cn(
            "grid size-[22px] place-items-center rounded-[7px] border-2 transition-colors [transform-style:preserve-3d] peer-focus-visible:ring-4 peer-focus-visible:ring-ring/25",
            checked
              ? "border-brand-600 bg-gradient-to-br from-brand-400 to-brand-600 shadow-[0_3px_0_0_#123b4d,0_6px_14px_-4px_rgb(31_96_124/0.6)]"
              : "border-input bg-card shadow-[0_2px_0_0_var(--input)] group-hover:border-brand-400",
          )}
        >
          <svg viewBox="0 0 16 16" className="size-3.5 [transform:rotateY(180deg)]" fill="none">
            <path className="check-path" d="M3.5 8.5l3 3 6-7" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-semibold text-foreground">{label}</span>}
          {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  name,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4 select-none", disabled && "cursor-not-allowed opacity-60")}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-semibold">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
      <span className="relative shrink-0">
        <input type="checkbox" className="peer sr-only" name={name} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span
          className={cn(
            "block h-7 w-12 rounded-full border transition-colors duration-300 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/25",
            checked ? "border-brand-600 bg-gradient-to-r from-brand-500 to-brand-400" : "border-input bg-muted",
          )}
        />
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          className={cn(
            "absolute top-1 size-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.25),inset_0_-2px_0_rgb(0_0_0/0.08)]",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </label>
  );
}

/** Big selectable card (radio-like). */
export function ChoiceCard({
  selected,
  onSelect,
  children,
  className,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-2xl border-2 bg-card p-4 text-left transition-all duration-200 [transform:translateZ(0)]",
        selected
          ? "border-brand-500 shadow-[0_4px_0_0_var(--color-brand-600),0_16px_30px_-16px_rgb(31_96_124/0.6)] -translate-y-0.5"
          : "border-border shadow-[0_3px_0_0_var(--input)] hover:-translate-y-0.5 hover:border-brand-300",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
