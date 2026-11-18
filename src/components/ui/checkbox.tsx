"use client";

import * as React from "react";
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

export function Checkbox({ checked, onChange, label, description, disabled, className, name, value }: CheckboxProps) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 select-none", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-0.5">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} name={name} value={value} onChange={(e) => onChange(e.target.checked)} />
        <span
          data-checked={checked}
          className={cn(
            "grid size-[18px] place-items-center rounded-[5px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40",
            checked ? "border-foreground bg-foreground" : "border-input bg-card group-hover:border-foreground/40",
          )}
        >
          <svg viewBox="0 0 16 16" className="size-3" fill="none">
            <path className="check-path" d="M3.5 8.5l3 3 6-7" stroke="var(--background)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-foreground">{label}</span>}
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
          {label && <span className="block text-sm font-medium">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
      <span className="relative shrink-0">
        <input type="checkbox" className="peer sr-only" name={name} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className={cn("block h-6 w-10 rounded-full border transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40", checked ? "border-foreground bg-foreground" : "border-input bg-muted")} />
        <span className={cn("absolute top-1 size-4 rounded-full bg-card transition-[left] duration-200", checked ? "left-5 bg-background" : "left-1")} />
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
        "relative w-full rounded-2xl border bg-card p-4 text-left transition-colors duration-200",
        selected ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/30",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
