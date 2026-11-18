import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap", {
  variants: {
    tone: {
      brand: "border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
      ember: "border-ember-100 bg-ember-50 text-ember-700 dark:border-ember-800/60 dark:bg-ember-900/30 dark:text-ember-300",
      success: "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
      warning: "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
      danger: "border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
      neutral: "border-transparent bg-foreground/[0.05] text-muted-foreground",
      solid: "border-transparent bg-foreground text-background",
      glass: "border-transparent bg-white/90 text-[#111]",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, dot, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {props.children}
    </span>
  );
}
