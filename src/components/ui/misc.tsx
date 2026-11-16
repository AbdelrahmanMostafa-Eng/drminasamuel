"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn, initials } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center", className)}>
      {icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-pulse-ring rounded-2xl bg-brand-400/20" />
          <div className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-[0_4px_0_0_var(--color-brand-200)] dark:from-brand-900 dark:to-brand-800 dark:text-brand-200 dark:shadow-[0_4px_0_0_var(--color-brand-950)] [&>svg]:size-6">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover ring-2 ring-card", className)} style={{ width: size, height: size }} />;
  }
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-card", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 55% 55%), hsl(${(hue + 40) % 360} 60% 38%))`,
      }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ember-600 dark:text-ember-400">{eyebrow}</div>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-[0.95rem]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "brand",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "brand" | "ember" | "success" | "danger" | "violet";
  className?: string;
}) {
  const tones = {
    brand: "from-brand-400 to-brand-600 shadow-[0_4px_0_0_#123b4d]",
    ember: "from-ember-300 to-ember-500 shadow-[0_4px_0_0_#b94a07]",
    success: "from-emerald-400 to-emerald-600 shadow-[0_4px_0_0_#08623f]",
    danger: "from-red-400 to-red-600 shadow-[0_4px_0_0_#8f2119]",
    violet: "from-violet-400 to-violet-600 shadow-[0_4px_0_0_#4c1d95]",
  }[tone];
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift", className)}>
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-brand-100/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-brand-800/30" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.8rem] font-semibold text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-extrabold tracking-tight sm:text-[1.7rem]">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 [&>svg]:size-5", tones)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success(label ? `${label} copied` : "Copied");
          setTimeout(() => setDone(false), 1600);
        } catch {
          toast.error("Couldn't copy — please copy manually");
        }
      }}
      className={cn("inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-brand-300 hover:text-foreground active:scale-95", className)}
    >
      {done ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">{children}</kbd>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}
