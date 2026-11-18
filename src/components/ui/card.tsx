"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-card text-card-foreground", className)} {...props} />;
}

export function CardHeader({ title, description, action, className, icon }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-foreground/70 [&>svg]:size-[1.05rem]">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-[0.95rem] font-medium tracking-tight">{title}</h3>
          {description && <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

/**
 * Hairline card with a soft spotlight that follows the cursor
 * (the "BentoCard" from the agentic template). Kept under the old name too.
 */
export function SpotlightCard({
  children,
  className,
  ...rest
}: { children: React.ReactNode; className?: string; max?: number; glare?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { max: _m, glare: _g, ...props } = rest as typeof rest & { max?: number; glare?: boolean };
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
      }}
      className={cn("group/spot relative", className)}
      {...props}
    >
      {children}
      <div className="spotlight pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100" />
    </div>
  );
}

export const TiltCard = SpotlightCard;
export const BentoCard = SpotlightCard;
