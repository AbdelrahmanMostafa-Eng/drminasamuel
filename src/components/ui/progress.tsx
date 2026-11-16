"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "ember" | "success" }) {
  const v = Math.max(0, Math.min(100, value));
  const bar = {
    brand: "from-brand-400 via-brand-500 to-brand-600",
    ember: "from-ember-300 via-ember-400 to-ember-500",
    success: "from-emerald-300 via-emerald-400 to-emerald-500",
  }[tone];
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)]", className)}>
      <motion.div
        className={cn("relative h-full rounded-full bg-gradient-to-r", bar)}
        initial={{ width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-y-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </span>
      </motion.div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 112,
  stroke = 10,
  label,
  sublabel,
  tone = "brand",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: "brand" | "ember" | "success" | "danger";
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring-${tone}`;
  const colors = {
    brand: ["#79b9d2", "#1f607c"],
    ember: ["#ffb269", "#ff8a1a"],
    success: ["#5fe0b0", "#0f9d6b"],
    danger: ["#ff9a8f", "#d63c31"],
  }[tone];
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (v / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-xl font-extrabold tracking-tight">{label ?? `${Math.round(v)}%`}</div>
          {sublabel && <div className="text-[0.68rem] font-medium text-muted-foreground">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}
