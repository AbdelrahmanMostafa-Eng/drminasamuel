import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", {
  variants: {
    tone: {
      brand: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
      ember: "border-ember-200 bg-ember-50 text-ember-700 dark:border-ember-800/60 dark:bg-ember-900/30 dark:text-ember-300",
      success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300",
      warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300",
      danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-300",
      neutral: "border-border bg-muted text-muted-foreground",
      solid: "border-transparent bg-brand-600 text-white",
      glass: "border-white/20 bg-white/10 text-white backdrop-blur",
    },
  },
  defaultVariants: { tone: "brand" },
});

export function Badge({ className, tone, dot, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {props.children}
    </span>
  );
}
