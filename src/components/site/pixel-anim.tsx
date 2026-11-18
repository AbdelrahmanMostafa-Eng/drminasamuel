"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Small dot-matrix animations that sit above each homepage section (agentic template style):
 * ink squares on paper, soft fades between frames. Every scene is drawn procedurally, so it
 * stays crisp at any pixel density. Animations only run while visible, and stay still for
 * visitors who prefer reduced motion.
 */

export type PixelScene = "dna" | "tree" | "mitosis" | "heartbeat" | "iguana" | "hourglass" | "bees" | "bird" | "amoeba" | "butterfly";

class Grid {
  v: Float32Array;
  constructor(
    public w: number,
    public h: number,
  ) {
    this.v = new Float32Array(w * h);
  }
  clear() {
    this.v.fill(0);
  }
  /** Brightest value wins. */
  set(x: number, y: number, a: number) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h || a <= 0) return;
    const i = yi * this.w + xi;
    if (a > this.v[i]) this.v[i] = Math.min(1, a);
  }
  /** Overwrites (used for lighter details on top of a shape). */
  put(x: number, y: number, a: number) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
    this.v[yi * this.w + xi] = Math.max(0, Math.min(1, a));
  }
  line(x0: number, y0: number, x1: number, y1: number, a: number, frac = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2;
    const m = Math.round(n * frac);
    for (let i = 0; i <= m; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, a);
  }
  disc(cx: number, cy: number, r: number, a: number) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, a);
  }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** Smooth minimum of two distances: lets two round shapes melt into one (cells, amoebas). */
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
/** Draws an outlined, softly filled blob from a signed distance function. */
function membrane(g: Grid, sdf: (x: number, y: number) => number, edge = 0.72, inside = 0.08, alpha = 1) {
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const d = sdf(x, y);
      if (Math.abs(d) < edge) g.set(x, y, (1 - Math.abs(d) / edge) * 0.9 * alpha);
      else if (d < 0) g.set(x, y, (inside + rnd(x * 31 + y * 17) * 0.05) * alpha);
    }
}

type Scene = { w: number; h: number; rate?: number; still: number; draw: (t: number, g: Grid) => void };

/* ── Tree: seed to full canopy, leaves fall, again ── */
const TREE_LEAVES = (() => {
  const out: { x: number; y: number; o: number; s: number; f: number }[] = [];
  let i = 0;
  for (let y = 0; y <= 10; y++)
    for (let x = 0; x < 15; x++) {
      const e = ((x - 7) / 6.4) ** 2 + ((y - 4.6) / 4.2) ** 2;
      i++;
      if (e < 1 - rnd(i * 1.7) * 0.28) out.push({ x, y, o: rnd(i * 3.1), s: 0.28 + 0.6 * rnd(i * 7.7), f: rnd(i * 5.3) });
    }
  return out;
})();

const SCENES: Record<PixelScene, Scene> = {
  dna: {
    w: 11,
    h: 16,
    still: 0.6,
    draw(t, g) {
      const cx = 5;
      const R = 3.7;
      for (let y = 0; y < g.h; y++) {
        const ph = t * 2.1 + y * 0.5;
        const s = Math.sin(ph);
        const c = Math.cos(ph);
        const xa = cx + R * s;
        const xb = cx - R * s;
        if (y % 2 === 0 && Math.abs(s) > 0.4) {
          const a = Math.min(xa, xb);
          const b = Math.max(xa, xb);
          for (let x = Math.ceil(a + 0.6); x <= Math.floor(b - 0.6); x++) g.set(x, y, 0.2);
        }
        g.set(xa, y, 0.3 + 0.65 * ((c + 1) / 2));
        g.set(xb, y, 0.3 + 0.65 * ((1 - c) / 2));
      }
    },
  },

  tree: {
    w: 15,
    h: 16,
    still: 4.2,
    draw(t, g) {
      const P = 6.6;
      const p = t % P;
      const A = 1 - clamp01((p - 6.1) / 0.5);
      for (let x = 1; x < 14; x += 2) g.set(x, 15, 0.16 * A);
      const trunk = ease(clamp01(p / 1.3)) * 8;
      for (let i = 0; i <= Math.round(trunk); i++) g.set(7, 14 - i, 0.92 * A);
      if (trunk > 1.5) {
        g.set(6, 14, 0.5 * A);
        g.set(8, 14, 0.5 * A);
      }
      const b = ease(clamp01((p - 1.1) / 1.1));
      const branches = [
        [7, 10, 3, 6],
        [7, 9, 11, 5],
        [7, 8, 4, 3],
        [7, 8, 10, 2],
        [7, 7, 7, 2],
      ];
      for (const [x0, y0, x1, y1] of branches) if (b > 0) g.line(x0, y0, x1, y1, 0.72 * A, b);
      for (let i = 0; i < TREE_LEAVES.length; i++) {
        const l = TREE_LEAVES[i];
        const appear = 2.0 + l.o * 1.8;
        if (p < appear) continue;
        let a = l.s * clamp01((p - appear) / 0.3);
        let x = l.x;
        let y = l.y;
        const fall = 4.7 + l.f * 1.1;
        if (p > fall) {
          const d = p - fall;
          y += d * d * 7;
          x += Math.sin(d * 5 + i) * 0.9;
          a *= 1 - clamp01(d / 1.1);
        }
        g.set(x, y, a * A);
      }
    },
  },

  mitosis: {
    w: 21,
    h: 13,
    still: 2.0,
    draw(t, g) {
      const P = 5.8;
      const p = t % P;
      const A = clamp01(p / 0.4) * (1 - clamp01((p - 5.2) / 0.6));
      const sep = ease(clamp01((p - 1.4) / 2.0)) * 5.3;
      const cx = 10;
      const cy = 6;
      const R = 4.2 - (sep / 5.3) * 1.2;
      const c1 = cx - sep;
      const c2 = cx + sep;
      membrane(g, (x, y) => smin(Math.hypot(x - c1, (y - cy) * 1.05) - R, Math.hypot(x - c2, (y - cy) * 1.05) - R, 2.4), 0.72, 0.07, A);
      if (p < 1.0) g.disc(cx, cy, 1.4, 0.55 * A);
      else if (p < 1.6) for (let y = cy - 2; y <= cy + 2; y++) g.set(cx, y, 0.85 * A);
      else if (p < 3.2) {
        const k = ease(clamp01((p - 1.6) / 1.6));
        for (let y = cy - 2; y <= cy + 2; y++) {
          g.set(cx - k * (sep * 0.95 + 0.5), y, 0.85 * A);
          g.set(cx + k * (sep * 0.95 + 0.5), y, 0.85 * A);
        }
      } else {
        g.disc(c1, cy, 1.0, 0.55 * A);
        g.disc(c2, cy, 1.0, 0.55 * A);
      }
    },
  },

  heartbeat: {
    w: 23,
    h: 11,
    rate: 40,
    still: 1.4,
    draw(t, g) {
      const base = 6;
      const beatW = 11.5;
      const ecg = (u: number) => {
        if (u < 0.1) return -Math.sin((u / 0.1) * Math.PI) * 1.0;
        if (u < 0.18) return 0;
        if (u < 0.21) return (1.2 * (u - 0.18)) / 0.03;
        if (u < 0.25) return 1.2 - ((u - 0.21) / 0.04) * 6.0;
        if (u < 0.29) return -4.8 + ((u - 0.25) / 0.04) * 7.0;
        if (u < 0.33) return 2.2 - ((u - 0.29) / 0.04) * 2.2;
        if (u < 0.45) return 0;
        if (u < 0.62) return -Math.sin(((u - 0.45) / 0.17) * Math.PI) * 1.6;
        return 0;
      };
      // Like a bedside monitor: the whole trace stays faintly visible, a bright sweep redraws it.
      const span = g.w + 3;
      const head = (t * 9) % span;
      let px = -1;
      let py = base;
      for (let s = 0; s <= g.w * 12; s++) {
        const x = s / 12;
        const y = base + ecg((x / beatW) % 1);
        const ahead = x - head;
        let age = head - x;
        if (age < 0) age += span;
        const erased = ahead > 0 && ahead < 2.5;
        if (!erased) {
          const a = age < 0.7 ? 1 : Math.max(0.16, 0.95 - (age / 13) * 0.8);
          if (px >= 0 && Math.abs(x - px) < 0.2) g.line(px, py, x, y, a);
          else g.set(x, y, a);
        }
        px = x;
        py = y;
      }
    },
  },

  iguana: {
    w: 26,
    h: 12,
    still: 0.9,
    draw(t, g) {
      const scroll = Math.floor(t * 2.6);
      for (let x = 0; x < g.w; x++) {
        if ((x + scroll) % 4 === 0) g.set(x, 10, 0.22);
        if ((x * 7 + scroll * 3) % 11 === 0) g.set(x, 11, 0.12);
      }
      // tail, ringed and swaying
      for (let x = 0; x <= 8; x++) {
        const k = (8 - x) / 8;
        const y = 6.3 + k * 1.3 + Math.sin(t * 3 - x * 0.7) * k * 1.1;
        let a = 0.88 - k * 0.42;
        if (x % 2 === 0) a *= 0.72;
        g.set(x, y, a);
        if (x >= 7) g.set(x, y + 1, 0.5);
      }
      // body
      for (let x = 10; x <= 16; x++) g.set(x, 5, 0.85);
      for (let x = 9; x <= 17; x++) g.set(x, 6, 0.9);
      for (let x = 10; x <= 16; x++) g.set(x, 7, 0.6);
      // dorsal crest
      for (let x = 10; x <= 17; x += 2) g.set(x, 4, 0.45 + 0.25 * (0.5 + 0.5 * Math.sin(t * 2.5 + x)));
      // legs (near side dark, far side light), alternating steps
      const ph = t * 5.2;
      const stepF = Math.round(Math.sin(ph));
      const stepB = Math.round(Math.sin(ph + Math.PI));
      g.set(16, 8, 0.85);
      g.set(16 + stepF, 9, 0.85);
      g.set(10, 8, 0.85);
      g.set(10 + stepB, 9, 0.85);
      g.set(15, 8, 0.32);
      g.set(15 + stepB, 9, 0.32);
      g.set(11, 8, 0.32);
      g.set(11 + stepF, 9, 0.32);
      // head with the iguana head-bob display every few seconds
      const c = t % 3.8;
      const dy = c < 0.7 ? -Math.round(Math.abs(Math.sin((c / 0.7) * 2 * Math.PI))) : 0;
      for (let x = 19; x <= 21; x++) g.set(x, 4 + dy, 0.72);
      for (let x = 18; x <= 22; x++) g.set(x, 5 + dy, 0.9);
      for (let x = 18; x <= 23; x++) g.set(x, 6 + dy, 0.88);
      for (let x = 18; x <= 20; x++) g.set(x, 7 + dy, 0.6);
      g.set(18, 8 + dy, 0.42);
      g.set(19, 8 + dy, 0.5);
      if (dy !== 0) g.set(19, 9 + dy, 0.4);
      const blink = t % 4.6 > 4.45;
      g.put(21, 5 + dy, blink ? 0.85 : 0.12);
    },
  },

  hourglass: {
    w: 11,
    h: 15,
    still: 2.3,
    draw(t, g) {
      const P = 6;
      const p = t % P;
      const q = clamp01(p / 4.6);
      const hw = [0, 4, 4, 3, 3, 2, 1, 0, 1, 2, 3, 3, 4, 4, 0];
      for (let x = 1; x <= 9; x++) {
        g.set(x, 0, 0.88);
        g.set(x, 14, 0.88);
      }
      for (let y = 1; y <= 13; y++) {
        g.set(5 - hw[y] - 1, y, 0.16);
        g.set(5 + hw[y] + 1, y, 0.16);
      }
      const sand = (x: number, y: number) => 0.62 + 0.22 * ((x + y) % 2);
      const level = 2 + Math.round(q * 5);
      for (let y = level; y <= 6; y++) for (let x = 5 - hw[y]; x <= 5 + hw[y]; x++) g.set(x, y, sand(x, y));
      const H = Math.round(q * 5);
      for (let k = 0; k < H; k++) {
        const y = 13 - k;
        const w = Math.min(hw[y], H - k);
        for (let x = 5 - w; x <= 5 + w; x++) g.set(x, y, sand(x, y));
      }
      if (q > 0 && q < 1) for (let y = 7; y <= 13 - H; y++) g.set(5, y, 0.3 + 0.4 * ((y + Math.floor(t * 12)) % 2));
    },
  },

  bees: {
    w: 17,
    h: 17,
    rate: 7,
    still: 1.2,
    draw(t, g) {
      const hive: [number, number, number][] = [
        [6, 7, 9],
        [7, 6, 10],
        [8, 6, 10],
        [9, 6, 10],
        [10, 7, 9],
      ];
      for (const [y, a, b] of hive) for (let x = a; x <= b; x++) if (!(y === 10 && x === 8)) g.set(x, y, 0.52 + 0.3 * (y % 2));
      g.set(8, 5, 0.5);
      const bees = [
        [4.4, 1.6, 0],
        [5.6, -1.2, 1.4],
        [6.8, 0.9, 2.9],
        [5.0, 1.9, 4.2],
        [7.3, -0.8, 5.1],
      ];
      for (let i = 0; i < bees.length; i++) {
        const [r, w, ph] = bees[i];
        const th = t * w + ph;
        const x = 8 + r * Math.cos(th);
        const y = 8 + r * 0.72 * Math.sin(th) + Math.sin(t * 7 + i) * 0.4;
        g.set(x, y, 0.95);
        g.set(x, y - 1, 0.3);
      }
    },
  },

  bird: {
    w: 17,
    h: 12,
    rate: 26,
    still: 0.2,
    draw(t, g) {
      const clouds = [
        [3, 2, 4],
        [12, 9, 3],
      ];
      for (const [x0, y, len] of clouds) {
        const x = ((((x0 - t * 1.6) % (g.w + 6)) + g.w + 6) % (g.w + 6)) - 3;
        for (let i = 0; i < len; i++) g.set(x + i, y, 0.13);
      }
      const a = Math.sin(t * 2 * Math.PI * 0.85);
      const by = 6 + a * 0.6;
      g.set(8, by, 0.95);
      g.set(8, by + 1, 0.75);
      for (const dir of [-1, 1]) {
        const ex = 8 + dir * 3;
        const ey = by - a * 1.6 - 0.6;
        const tx = 8 + dir * 7;
        const ty = by - a * 3.2 + 0.7;
        g.line(8, by, ex, ey, 0.92);
        g.line(ex, ey, tx, ty, 0.7);
      }
    },
  },

  amoeba: {
    w: 16,
    h: 16,
    still: 1.0,
    draw(t, g) {
      const pts = [0, 1, 2, 3].map((i) => {
        const th = t * (0.5 + i * 0.12) + i * 1.7;
        const r = 3.3 + Math.sin(t * 0.9 + i * 2.1) * 1.0;
        return { x: 8 + Math.cos(th) * r, y: 8 + Math.sin(th) * r, R: 1.8 + 0.6 * Math.sin(t * 1.3 + i * 2) };
      });
      membrane(g, (x, y) => {
        let d = Math.hypot(x - 8, y - 8) - 3.4;
        for (const p of pts) d = smin(d, Math.hypot(x - p.x, y - p.y) - p.R, 2.6);
        return d;
      });
      g.disc(8 + Math.sin(t * 0.7) * 0.8, 8 + Math.cos(t * 0.6) * 0.6, 1.2, 0.6);
      g.set(8 + Math.cos(t * 0.9) * 2.4, 8 + Math.sin(t * 0.9) * 2.0, 0.32);
      g.set(8 - Math.cos(t * 0.6) * 2.0, 8 + Math.sin(t * 0.8 + 2) * 2.2, 0.28);
    },
  },

  butterfly: {
    w: 15,
    h: 12,
    still: 0.3,
    draw(t, g) {
      const s = 0.22 + 0.78 * Math.abs(Math.cos(t * 4.2));
      const bob = Math.round(Math.sin(t * 1.6) * 0.6);
      for (let y = 0; y < g.h; y++)
        for (let x = 0; x < g.w; x++) {
          const dx = Math.abs(x - 7);
          if (dx < 1) continue;
          const yy = y - bob;
          const up = ((dx - (1 + 3.0 * s)) / (3.0 * s + 0.5)) ** 2 + ((yy - 4) / 2.7) ** 2;
          const lo = ((dx - (1 + 2.1 * s)) / (2.1 * s + 0.45)) ** 2 + ((yy - 8.2) / 2.0) ** 2;
          if (up <= 1) g.set(x, y, up < 0.22 ? 0.35 : 0.85);
          else if (lo <= 1) g.set(x, y, 0.6);
        }
      for (let y = 3; y <= 9; y++) g.set(7, y + bob, 0.95);
      g.set(7, 2 + bob, 0.9);
      g.set(6, 1 + bob, 0.55);
      g.set(5, 0 + bob, 0.55);
      g.set(8, 1 + bob, 0.55);
      g.set(9, 0 + bob, 0.55);
    },
  },
};

const PITCH = 4;
const CELL = 3;

export function PixelAnim({ scene, className, label }: { scene: PixelScene; className?: string; label?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const sc = SCENES[scene];

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = sc.w * PITCH;
    const H = sc.h * PITCH;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = new Grid(sc.w, sc.h);
    const shown = new Float32Array(sc.w * sc.h);
    const paint = () => {
      ctx.clearRect(0, 0, W, H);
      for (let y = 0; y < sc.h; y++)
        for (let x = 0; x < sc.w; x++) {
          const a = shown[y * sc.w + x];
          if (a < 0.02) continue;
          ctx.fillStyle = `rgba(17,17,17,${a.toFixed(3)})`;
          ctx.fillRect(x * PITCH, y * PITCH, CELL, CELL);
        }
    };
    const frame = (time: number, dt: number) => {
      target.clear();
      sc.draw(time, target);
      const k = dt <= 0 ? 1 : 1 - Math.exp(-dt * (sc.rate ?? 14));
      for (let i = 0; i < shown.length; i++) shown[i] += (target.v[i] - shown[i]) * k;
      paint();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      frame(sc.still, 0);
      return;
    }

    let raf = 0;
    let last = 0;
    let time = sc.still;
    let visible = false;
    const loop = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      time += dt;
      frame(time, dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    frame(time, 0);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sc]);

  return (
    <canvas
      ref={ref}
      data-scene={scene}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block select-none", className)}
      style={{ width: sc.w * PITCH, height: sc.h * PITCH }}
    />
  );
}
