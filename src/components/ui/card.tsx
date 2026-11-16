"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-soft", className)} {...props} />;
}

export function CardHeader({ title, description, action, className, icon }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 [&>svg]:size-5">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

/** Card that tilts in 3D toward the pointer, with a moving glare. */
export function TiltCard({
  children,
  className,
  max = 9,
  glare = true,
  ...rest
}: { children: React.ReactNode; className?: string; max?: number; glare?: boolean } & Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 220, damping: 18 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 220, damping: 18 });
  const [hover, setHover] = React.useState(false);

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    x.set(px);
    y.set(py);
    ref.current!.style.setProperty("--gx", `${px * 100}%`);
    ref.current!.style.setProperty("--gy", `${py * 100}%`);
  }
  return (
    <div className="[perspective:1100px]">
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          x.set(0.5);
          y.set(0.5);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={cn("relative will-change-transform", className)}
        {...rest}
      >
        {children}
        {glare && <div className={cn("tilt-glare pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300", hover ? "opacity-100" : "opacity-0")} />}
      </motion.div>
    </div>
  );
}
