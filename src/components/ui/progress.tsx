"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const FILL = { brand: "bg-brand-600", ember: "bg-ember-500", success: "bg-success", danger: "bg-danger" } as const;
const STROKE = { brand: "#1f607c", ember: "#d9771c", success: "#2f7d4f", danger: "#b4372d" } as const;

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: keyof typeof FILL }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]", className)}>
      <motion.div
        className={cn("h-full rounded-full", FILL[tone])}
        initial={{ width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 112,
  stroke = 6,
  label,
  sublabel,
  tone = "brand",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: keyof typeof STROKE;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-foreground/[0.07]" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={STROKE[tone]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (v / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-xl font-light tracking-tight">{label ?? `${Math.round(v)}%`}</div>
          {sublabel && <div className="text-[0.68rem] text-muted-foreground">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}
