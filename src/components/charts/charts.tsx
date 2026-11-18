"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const C = {
  brand: "#1f607c",
  brandLight: "#9dbccb",
  ember: "#c8641a",
  emerald: "#2f7d4f",
  amber: "#a8650f",
  red: "#b4372d",
  violet: "#5e5a8c",
  slate: "#b5b3ac",
};

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

function Tip({ active, payload, label, suffix = "" }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lift">
      {label && <p className="mb-1 max-w-56 truncate font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {p.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

function Empty({ h }: { h: number }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground" style={{ height: h }}>
      Not enough data yet
    </div>
  );
}

export function ScoreTrend({ data, height = 260 }: { data: { label: string; score: number; type?: string }[]; height?: number }) {
  if (!data.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.ember} stopOpacity={0.16} />
            <stop offset="100%" stopColor={C.ember} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" {...axis} tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + "…" : v)} />
        <YAxis domain={[0, 100]} {...axis} />
        <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.4} />
        <Tooltip content={<Tip suffix="%" />} />
        <Area type="monotone" dataKey="score" name="Score" stroke={C.ember} strokeWidth={3} fill="url(#gScore)" dot={{ r: 4, fill: C.ember, strokeWidth: 2, stroke: "var(--card)" }} activeDot={{ r: 6 }} animationDuration={1200} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CompareBars({ data, height = 260, aLabel = "You", bLabel = "Class average" }: { data: { label: string; a: number; b: number }[]; height?: number; aLabel?: string; bLabel?: string }) {
  if (!data.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" {...axis} tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 12) + "…" : v)} />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip content={<Tip suffix="%" />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="a" name={aLabel} fill={C.brand} radius={[8, 8, 0, 0]} animationDuration={1000} />
        <Bar dataKey="b" name={bLabel} fill={C.brandLight} radius={[8, 8, 0, 0]} animationDuration={1200} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SkillRadar({ data, height = 280 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length < 3) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip content={<Tip suffix="%" />} />
        <Radar dataKey="value" name="Mastery" stroke={C.ember} fill={C.ember} fillOpacity={0.35} strokeWidth={2} animationDuration={1200} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220, center }: { data: { name: string; value: number; color: string }[]; height?: number; center?: React.ReactNode }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Empty h={height} />;
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<Tip />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={3} cornerRadius={6} stroke="none" animationDuration={1100}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

export function StackedAttendance({ data, height = 280 }: { data: { label: string; present: number; excused: number; unexcused: number }[]; height?: number }) {
  if (!data.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" {...axis} tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + "…" : v)} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip content={<Tip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="present" name="Present" stackId="a" fill={C.emerald} animationDuration={900} />
        <Bar dataKey="excused" name="Absent · Excuse Given" stackId="a" fill={C.amber} animationDuration={1000} />
        <Bar dataKey="unexcused" name="Absent · NOT Given" stackId="a" fill={C.red} radius={[6, 6, 0, 0]} animationDuration={1100} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({ data, height = 260, color = C.brand, suffix = "", name = "Value", domain }: { data: { label: string; value: number }[]; height?: number; color?: string; suffix?: string; name?: string; domain?: [number, number] }) {
  if (!data.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" {...axis} tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + "…" : v)} />
        <YAxis {...axis} domain={domain} allowDecimals={false} />
        <Tooltip content={<Tip suffix={suffix} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Bar dataKey="value" name={name} radius={[8, 8, 0, 0]} animationDuration={1000}>
          {data.map((d, i) => (
            <Cell key={i} fill={suffix === "%" ? (d.value >= 75 ? C.emerald : d.value >= 50 ? C.amber : C.red) : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({ data, height = 240, name = "Value", color = C.brand }: { data: { label: string; value: number }[]; height?: number; name?: string; color?: string }) {
  if (!data.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip content={<Tip />} />
        <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={3} fill={`url(#g-${name})`} animationDuration={1200} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({ data, keys, height = 260 }: { data: Record<string, string | number>[]; keys: { key: string; name: string; color: string }[]; height?: number }) {
  if (!data.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip content={<Tip suffix="%" />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k) => (
          <Line key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color} strokeWidth={3} dot={{ r: 3 }} connectNulls animationDuration={1200} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
