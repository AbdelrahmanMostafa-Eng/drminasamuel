"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Route-based tabs with an animated sliding pill. */
export function LinkTabs({ tabs, className, id = "tabs" }: { tabs: { href: string; label: string; icon?: React.ReactNode; exact?: boolean; count?: number; active?: boolean }[]; className?: string; id?: string }) {
  const pathname = usePathname();
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1", className)}>
      {tabs.map((t) => {
        const active = t.active ?? (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + "/"));
        return (
          <Link key={t.href} href={t.href} className={cn("relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", active ? "text-background" : "text-muted-foreground hover:text-foreground")}>
            {active && (
              <motion.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-lg bg-foreground" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
            )}
            <span className="relative flex items-center gap-2 [&>svg]:size-4">
              {t.icon}
              {t.label}
              {t.count !== undefined && t.count > 0 && <span className={cn("rounded-full px-1.5 font-mono text-[0.68rem]", active ? "bg-background/20" : "bg-foreground/[0.07] text-foreground")}>{t.count}</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Client-state tabs with the same look. */
export function StateTabs<T extends string>({ value, onChange, tabs, className, id = "stabs" }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[]; className?: string; id?: string }) {
  return (
    <div className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button key={t.value} type="button" onClick={() => onChange(t.value)} className={cn("relative shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", active ? "text-background" : "text-muted-foreground hover:text-foreground")}>
            {active && <motion.span layoutId={`${id}-pill`} className="absolute inset-0 rounded-lg bg-foreground" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className="relative flex items-center gap-2">
              {t.label}
              {t.count !== undefined && <span className={cn("rounded-full px-1.5 font-mono text-[0.68rem]", active ? "bg-background/20" : "bg-foreground/[0.06]")}>{t.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
