import type { CSSProperties, ReactNode } from "react";

/**
 * Footer wordmark: "BIOACADEMY" as pale stone letters standing in a tropical forest. One SVG scene
 * (so every animal stays exactly on its letter at any width): palms, monstera and banana leaves
 * sway, lianas hang from the canopy, a scarlet macaw and a toucan perch on the letters, a red-eyed
 * tree frog blinks on the D, a sloth hangs from a vine, a hummingbird visits a heliconia, blue
 * morphos drift and a chameleon grips the I. Muted natural-history palette; CSS transform
 * animations only, still for visitors who prefer reduced motion.
 */

const PAPER = "#f5f4f0";
const C = {
  stoneTop: "#dedad1",
  leafBack: "#87a38b",
  leafFront: "#2c4835",
  leafFront2: "#38573f",
  vein: "#5f7f63",
  vine: "#4b5f40",
  vineLeaf: "#577553",
};

/** Letter origins (scene units) measured from IBM Plex Sans Light at font-size 200, tracking −0.045em. */
const LETTERS: [string, number][] = [
  ["B", 11.2],
  ["I", 129.8],
  ["O", 198.6],
  ["A", 329],
  ["C", 445],
  ["A", 559.4],
  ["D", 675.4],
  ["E", 799.6],
  ["M", 905.4],
  ["Y", 1057.6],
];
const BASE = 340; // baseline
const CAP = 199.4; // top of the capitals (baseline − 0.703em)

const anim = (cls: string, origin = "50% 50%", extra?: CSSProperties) => ({
  className: cls,
  style: { transformBox: "fill-box", transformOrigin: origin, ...extra } as CSSProperties,
});
const f = (n: number) => Math.round(n * 10) / 10;

/* ── Botanical generators ─────────────────────────────────────────────── */

/** Palm frond along a quadratic rachis from (0,0) to (len,0) bending up by `bend`; leaflets on both sides. */
function palmFrond(len: number, bend: number, count: number, leafLen: number, droop = 0.55) {
  const P = (t: number) => ({ x: len * t, y: -2 * bend * t * (1 - t) });
  const T = (t: number) => {
    const dx = len;
    const dy = -2 * bend * (1 - 2 * t);
    const m = Math.hypot(dx, dy);
    return { x: dx / m, y: dy / m };
  };
  let leaves = "";
  for (let i = 0; i < count; i++) {
    const t = 0.06 + (0.92 * i) / (count - 1);
    const p = P(t);
    const tg = T(t);
    const L = leafLen * Math.pow(Math.sin(Math.PI * Math.min(0.98, t * 0.9 + 0.08)), 0.7);
    for (const side of [-1, 1]) {
      const a = side * (0.95 - t * 0.35);
      const dir = { x: tg.x * Math.cos(a) - tg.y * Math.sin(a), y: tg.x * Math.sin(a) + tg.y * Math.cos(a) + droop * 0.35 };
      const m = Math.hypot(dir.x, dir.y);
      const d = { x: dir.x / m, y: dir.y / m };
      const w = 2.2 + L * 0.06;
      const n = { x: -d.y, y: d.x };
      const tip = { x: p.x + d.x * L, y: p.y + d.y * L + L * droop * 0.25 };
      const mid = { x: p.x + d.x * L * 0.5, y: p.y + d.y * L * 0.5 };
      leaves += `M${f(p.x)} ${f(p.y)}Q${f(mid.x + n.x * w)} ${f(mid.y + n.y * w)} ${f(tip.x)} ${f(tip.y)}Q${f(mid.x - n.x * w * 0.4)} ${f(mid.y - n.y * w * 0.4)} ${f(p.x)} ${f(p.y)}Z`;
    }
  }
  const rachis = `M0 0Q${f(len / 2)} ${f(-bend)} ${f(len)} 0`;
  return { leaves, rachis };
}

/** Banana / heliconia leaf: long lens from (0,0) to (0,-len) with midrib and parallel side veins. */
function longLeaf(len: number, width: number, tear = true) {
  const w = width / 2;
  let outline = `M0 0C${f(-w)} ${f(-len * 0.2)} ${f(-w * 1.05)} ${f(-len * 0.7)} 0 ${f(-len)}C${f(w * 1.05)} ${f(-len * 0.7)} ${f(w)} ${f(-len * 0.2)} 0 0Z`;
  if (tear) {
    // a few natural tears along the edges (cut out with evenodd)
    for (const [t, side] of [[0.32, -1], [0.5, 1], [0.66, -1]] as const) {
      const y = -len * t;
      const x = side * w * 0.98;
      outline += `M${f(x)} ${f(y)}L${f(side * w * 0.25)} ${f(y - 4)}L${f(x)} ${f(y - 7)}Z`;
    }
  }
  let veins = `M0 -2L0 ${f(-len * 0.97)}`;
  for (let i = 1; i < 14; i++) {
    const y = -len * (i / 14);
    const span = w * Math.sin(Math.PI * (i / 14)) * 0.95;
    veins += `M0 ${f(y)}Q${f(-span * 0.5)} ${f(y - 6)} ${f(-span)} ${f(y - 14)}M0 ${f(y)}Q${f(span * 0.5)} ${f(y - 6)} ${f(span)} ${f(y - 14)}`;
  }
  return { outline, veins };
}

/** Monstera leaf (base at 0,0), with its characteristic splits and holes. */
const MONSTERA =
  "M0 0C-8-18-58-34-62-86C-65-128-32-156 0-150C32-156 65-128 62-86C58-34 8-18 0 0Z" +
  "M-61-96L-24-90L-60-84ZM-57-62L-20-66L-50-50ZM-48-128L-14-108L-40-136ZM61-96L24-90L60-84ZM57-62L20-66L50-50ZM48-128L14-108L40-136Z" +
  "M-34-104a4 6 30 1 0 .1 0ZM34-104a4 6-30 1 0 .1 0ZM-30-74a3.5 5 20 1 0 .1 0ZM30-74a3.5 5-20 1 0 .1 0Z";
const MONSTERA_VEINS = "M0-4C1-60 1-110 0-146M0-30L-44-62M0-50L-50-96M0-80L-38-128M0-30L44-62M0-50L50-96M0-80L38-128";

/** Hanging liana with heart-shaped philodendron leaves; anchor at (0,0), hangs down `len`. */
function liana(len: number, seed: number) {
  let d = "M0 0";
  const pts: { x: number; y: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    const y = (len * i) / 12;
    const x = Math.sin(i * 0.9 + seed) * 4.5 + Math.sin(i * 0.37 + seed * 2) * 3;
    pts.push({ x, y });
  }
  pts.forEach((p, i) => {
    const prev = i === 0 ? { x: 0, y: 0 } : pts[i - 1]!;
    d += `Q${f(prev.x + (p.x - prev.x) * 0.5 + 3)} ${f(prev.y + (p.y - prev.y) * 0.5)} ${f(p.x)} ${f(p.y)}`;
  });
  const leaves = pts
    .filter((_, i) => i % 2 === 1 || i === pts.length - 1)
    .map((p, i) => ({ x: p.x, y: p.y, r: (i % 2 ? 1 : -1) * (38 + ((seed * 13 + i * 17) % 20)), s: 0.75 + ((i * 7 + seed) % 5) * 0.08 }));
  return { d, leaves, end: pts[pts.length - 1]! };
}
const HEART = "M0 0C-1 3-7 6-8 12C-9 18-4 21 0 17C4 21 9 18 8 12C7 6 1 3 0 0Z";

/* ── Animals ──────────────────────────────────────────────────────────── */

function Macaw() {
  // perched, facing right in local space (flipped where placed); feet at (0,0)
  return (
    <g>
      <g {...anim("tw-tail", "60% 0%")}>
        <path d="M-4-8C-11 20-17 52-24 92-20 95-15 93-13 89-7 56-2 24 3-6Z" fill="url(#tw-red)" />
        <path d="M-1-6C-5 22-9 54-13 90-10 92-7 91-6 88-2 56 1 24 4-4Z" fill="#b8473a" />
        <path d="M-21 70-24 92C-20 95-15 93-13 89L-11 72Z" fill="#2f5d86" />
      </g>
      <path d="M-8-4C-16-18-18-44-12-64-8-78 2-90 14-94 24-97 32-92 34-84 36-74 30-62 24-52 16-36 10-18 4-4 0 0-4 0-8-4Z" fill="url(#tw-red)" />
      <path d="M-12-56C-6-50 2-46 8-44M-13-46C-7-40 0-36 6-34M24-60C20-54 16-50 12-48" fill="none" stroke="#7d2519" strokeWidth=".7" opacity=".5" />
      <path d="M-4-60C8-67 19-58 21-44 23-28 15-10 3 4-3 10-9 6-9-6-9-24-11-46-4-60Z" fill="url(#tw-blue)" />
      <path d="M-4-60C8-67 19-58 21-44 15-41 5-43-7-39-8-47-8-54-4-60Z" fill="#d6a443" />
      <path d="M-3-57C6-61 14-56 17-48" fill="none" stroke="#b23f2e" strokeWidth="3" opacity=".9" />
      <path d="M-6-30C2-28 10-24 15-18M-7-20C0-18 7-14 11-9M-7-10C-1-8 4-5 7-1" fill="none" stroke="#1f3f5e" strokeWidth=".9" opacity=".55" />
      <g {...anim("tw-head", "35% 85%")}>
        <path d="M6-80C6-92 16-100 26-98 34-96 38-88 36-80 34-74 26-70 18-70 10-70 6-74 6-80Z" fill="url(#tw-red)" />
        <path d="M24-92C30-93 35-89 35-84 35-80 31-78 27-79 23-80 21-84 22-88Z" fill="#ece5d8" />
        <path d="M25-89l7 1M24.5-86l8 .5M25-83l7 0" stroke="#7a3b30" strokeWidth=".45" opacity=".6" />
        <circle cx="28.4" cy="-88" r="1.9" fill="#e9d9a0" />
        <circle cx="28.6" cy="-88" r=".95" fill="#1a1716" />
        <path d="M34-92C43-94 48-86 45-76 44-73 41-73 41-76 42-82 39-86 34-86Z" fill="#e8e0d0" />
        <path d="M34-84C39-82 41-79 39-75 36-76 34-79 33-82Z" fill="#2a2724" />
      </g>
      <path d="M-6 0-10 4M-3 0-6 5M1 0 5 4M3 0 8 2" stroke="#4a4642" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function Toucan() {
  // perched facing right; feet at (0,0)
  return (
    <g>
      <path d="M-8-6C-12 10-14 26-17 46L-9 46C-6 26-4 10-2-4Z" fill="url(#tw-ink)" />
      <path d="M-6 0C-14-14-16-36-10-52-6-62 2-68 10-68 18-68 22-60 22-50 22-36 16-18 8-4 4 2-2 2-6 0Z" fill="url(#tw-ink)" />
      <path d="M-2-2C2-6 6-4 6 0Z" fill="#a8392b" />
      <path d="M-4-44C0-30 2-18 1-6M-8-36C-5-24-4-14-4-4" fill="none" stroke={PAPER} strokeWidth=".6" opacity=".14" />
      <g {...anim("tw-tilt", "30% 90%")}>
        <path d="M10-66C18-66 22-58 21-48 16-44 10-46 6-50 6-58 7-63 10-66Z" fill="#efe2b8" />
        <path d="M18-64C30-71 50-67 62-58 64-56 62-54 58-54 46-56 32-56 20-54Z" fill="url(#tw-beak)" />
        <path d="M20-54C32-54 46-54 58-54 54-50 42-48 22-49Z" fill="#c9681f" />
        <path d="M56-57C60-56 63-56 62-54 60-53 57-53 55-54Z" fill="#1d1c1a" />
        <path d="M24-60C34-62 46-60 56-57" fill="none" stroke="#a54d17" strokeWidth=".6" opacity=".5" />
        <circle cx="15.5" cy="-60" r="3.4" fill="#5e9a8e" />
        <circle cx="15.7" cy="-60" r="1.4" fill="#141312" />
      </g>
      <path d="M-5 0-8 4M-1 0-3 5M2 0 6 3" stroke="#3d4a5c" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function TreeFrog() {
  // red-eyed tree frog sitting, facing right; base at (0,0)
  return (
    <g>
      <path d="M-18 0C-21-7-15-17-3-20 8-22 18-18 21-10 23-4 19 0 11 0Z" fill="url(#tw-frog)" />
      <path d="M-13-4C-5-8 6-8 14-4" fill="none" stroke="#3b6aa0" strokeWidth="3" strokeLinecap="round" />
      <path d="M-9-6.4v3M-3-7.4v3M3-7.4v3M9-6.4v3" stroke="#e6c04e" strokeWidth="1.1" />
      <path d="M-17-1C-24-5-26 1-19 2Z" fill="#5e9a49" />
      <circle cx="-22" cy="1.6" r="1.6" fill="#e28a32" />
      <circle cx="-18.6" cy="2.2" r="1.4" fill="#e28a32" />
      <path d="M12-1 15 2M14-1l4 2" stroke="#e28a32" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse {...anim("tw-throat", "50% 0%")} cx="17" cy="-5" rx="3.4" ry="2.4" fill="#f1ead2" />
      <circle cx="12" cy="-17" r="5.2" fill="#c73a2c" />
      <ellipse cx="12.2" cy="-17" rx="1.3" ry="3.4" fill="#141312" />
      <circle cx="10.4" cy="-19" r=".9" fill={PAPER} opacity=".7" />
      <path {...anim("tw-blink", "50% 0%")} d="M6.6-22.4H17.4V-11.6H6.6Z" fill="#5e9a49" />
    </g>
  );
}

function Sloth() {
  // hangs from a vine by its arms; grip point at (0,0)
  return (
    <g>
      <path d="M-7 0C-10 8-12 16-12 24M7 0C10 8 12 16 12 24" fill="none" stroke="#7a6650" strokeWidth="6" strokeLinecap="round" />
      <path d="M-9-2C-8-6-4-6-4-2M9-2C8-6 4-6 4-2" fill="none" stroke="#2f2a25" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="0" cy="48" rx="16" ry="26" fill="url(#tw-fur)" />
      <path d="M-10 32C-12 44-11 58-7 70M-3 30C-4 44-3 58 0 72M6 32C8 46 8 58 5 70M12 38C14 48 13 58 10 66" fill="none" stroke="#a08a6c" strokeWidth=".8" opacity=".55" />
      <path d="M-11 70C-14 78-14 84-10 88M9 70C12 78 12 84 8 88" fill="none" stroke="#6c5a46" strokeWidth="5" strokeLinecap="round" />
      <g {...anim("tw-look", "50% 50%")}>
        <circle cx="0" cy="26" r="10.5" fill="#8a755d" />
        <ellipse cx="0" cy="28" rx="7.6" ry="6.4" fill="#d9ccb3" />
        <path d="M-6.8 25.4C-5 23.6-2.6 24.4-2 27-3.4 28.6-6 28.4-6.8 25.4ZM6.8 25.4C5 23.6 2.6 24.4 2 27 3.4 28.6 6 28.4 6.8 25.4Z" fill="#3a2f26" />
        <circle cx="-3.8" cy="26.2" r=".85" fill="#0f0e0d" />
        <circle cx="3.8" cy="26.2" r=".85" fill="#0f0e0d" />
        <ellipse cx="0" cy="30" rx="1.6" ry="1.1" fill="#2b2420" />
        <path d="M-2.4 32.4C-1 33.6 1 33.6 2.4 32.4" fill="none" stroke="#5a4a3b" strokeWidth=".7" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Hummingbird() {
  // hovering, facing right; centre at (0,0)
  return (
    <g>
      <g {...anim("tw-hum", "40% 100%")}>
        <ellipse cx="-2" cy="-12" rx="5" ry="15" transform="rotate(-28 -2 -12)" fill="#b9c4c0" opacity=".55" />
      </g>
      <path d="M-12 2-24 9-20.5 3.4-25.5 1.6-12 0Z" fill="#1f5a44" />
      <path d="M-12 2C-6-4 6-6 12-4 16-2 16 2 12 4 6 6-4 6-12 2Z" fill="#2b7a5a" />
      <circle cx="12" cy="-3.4" r="4.4" fill="#2b7a5a" />
      <path d="M9.6 0C11.6 2.6 14 2.6 15.4 .6" fill="#a83246" />
      <path d="M16-3.6 33-1.6" stroke="#1d1c1a" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="13.4" cy="-4.4" r="1" fill="#0f0e0d" />
      <circle cx="13.8" cy="-4.8" r=".35" fill={PAPER} />
      <g {...anim("tw-hum", "40% 100%", { animationDelay: "-0.025s" })}>
        <ellipse cx="0" cy="-13" rx="5.6" ry="16" transform="rotate(-22 0 -13)" fill="#d2dad6" opacity=".6" />
      </g>
    </g>
  );
}

function Morpho() {
  // blue morpho seen from above; centre at (0,0)
  const fore = "M-1-4C-6-12-14-20-26-22-33-23-38-18-36-12-33-5-20-1-2 0Z";
  const hind = "M-1 0C-8 1-18 5-22 12-25 18-21 23-15 22-8 20-3 12-1 4Z";
  const wing = (
    <>
      <path d={fore} fill="url(#tw-morpho)" />
      <path d={hind} fill="url(#tw-morpho)" />
      <path d={fore} fill="none" stroke="#14233a" strokeWidth="2" opacity=".85" />
      <path d={hind} fill="none" stroke="#14233a" strokeWidth="1.8" opacity=".85" />
      <circle cx="-30" cy="-16" r=".9" fill={PAPER} opacity=".8" />
      <circle cx="-33" cy="-12" r=".8" fill={PAPER} opacity=".8" />
      <circle cx="-17" cy="17" r=".8" fill={PAPER} opacity=".7" />
    </>
  );
  return (
    <g>
      <g {...anim("tw-flutter", "100% 50%")}>{wing}</g>
      <g transform="scale(-1 1)">
        <g {...anim("tw-flutter", "100% 50%")}>{wing}</g>
      </g>
      <ellipse cx="0" cy="0" rx="1.4" ry="9" fill="#1b1a19" />
      <path d="M-.6-8C-2-14-4-17-6-19M.6-8C2-14 4-17 6-19" fill="none" stroke="#1b1a19" strokeWidth=".6" />
    </g>
  );
}

function Chameleon() {
  const limb = { fill: "none", stroke: "#3f6a35", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g {...anim("tw-cham", "50% 100%")}>
      <path d="M40 42c-10 0-18 2-22 8-4 6-2 13 4 15 6 2 11-2 10-7-.5-3.5-4-5-6.5-3.5 2 .5 3.5 2 3.1 4.1-.6 2.4-3.6 3.4-6.1 2.4-3-1.4-3.5-6 .5-9.5 3.5-4.5 9.5-5.5 17-5Z" fill="#5b8a4b" />
      <path d="M38 44c2-12 14-22 30-25 16-3 32-1 42 6 6 4 9 10 8 16-4 5-14 8-26 9-16 1-36 0-48-2-4-.7-5.5-2-6-4Z" fill="url(#tw-cham)" />
      <path d="M50 26.6l2.2-3 1.4 3.2 2.4-3.6 1.4 3.4 2.6-3.8 1.4 3.6 2.8-3.8 1.4 3.6 2.8-3.6 1.4 3.4 2.8-3.4 1.4 3.2 2.6-3 1.4 3 2.4-2.6 1.2 2.8 2.2-2.2 1.2 2.6 2-1.8 1 2.4" fill="#4f7e42" />
      <path d="M62 24c-2 8-2 18 0 26M76 21c-2 9-2 20 0 29M90 22c-1 9-1 18 1 27" fill="none" stroke="#d9c06a" strokeWidth="2.4" opacity=".55" />
      <path d="M108 24c4-8 14-11 24-7 8 3 14 10 16 16 1 3-1 5-5 5.5-7 1-17 1.5-25 1.5-3-3-6-9-10-16Z" fill="#5f9150" />
      <path d="M120 38c8-.5 16-1 24-1.5" fill="none" stroke="#2f4f27" strokeWidth=".9" opacity=".6" />
      <path d="M50 47 45.6 56l4.6 7.4M104 46l4.8 9.6-4.4 7.8" {...limb} strokeWidth="3.6" />
      <path d="m46.6 65 3.6-2.2 3.6 2.2M100.8 65.2l3.6-2.2 3.6 2.2" {...limb} strokeWidth="2" />
      <circle cx="130" cy="26.6" r="5.6" fill="#6aa45a" />
      <circle cx="130" cy="26.6" r="4" fill="none" stroke="#3f6a35" strokeWidth=".6" opacity=".7" />
      <g {...anim("tw-eye", "50% 50%")}>
        <circle cx="130.6" cy="26.3" r="1.5" fill="#e3d58a" />
        <circle cx="130.6" cy="26.3" r=".75" fill="#141312" />
      </g>
    </g>
  );
}

function Heliconia() {
  // hanging lobster-claw bracts; top at (0,0)
  const bracts = [0, 1, 2, 3, 4];
  return (
    <g>
      <path d="M0 0C2 12-2 24 1 36 3 46 0 56 2 64" fill="none" stroke={C.vine} strokeWidth="1.6" />
      {bracts.map((i) => {
        const y = 10 + i * 12;
        const side = i % 2 ? 1 : -1;
        return (
          <g key={i} transform={`translate(${side} ${y}) scale(${side} 1)`}>
            <path d="M0 0C6-2 14 0 18 8 14 9 8 8 2 6Z" fill={i % 2 ? "#c2452f" : "#b63c2a"} />
            <path d="M14 6C16 7 17.6 7.6 18 8 15.6 8.8 13 8.6 11.8 8Z" fill="#e2b84a" />
          </g>
        );
      })}
    </g>
  );
}

/* ── Scene ───────────────────────────────────────────────────────────── */

function Frond({ x, y, rotate, scale = 1, len, bend, n, leaf, fill, opacity, cls, delay }: { x: number; y: number; rotate: number; scale?: number; len: number; bend: number; n: number; leaf: number; fill: string; opacity: number; cls: string; delay?: string }) {
  const p = palmFrond(len, bend, n, leaf);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <g {...anim(cls, "0% 50%", { animationDelay: delay })} opacity={opacity}>
        <path d={p.leaves} fill={fill} />
        <path d={p.rachis} fill="none" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Leaf({ x, y, rotate, scale = 1, children, cls, delay }: { x: number; y: number; rotate: number; scale?: number; children: ReactNode; cls: string; delay?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <g {...anim(cls, "50% 100%", { animationDelay: delay })}>{children}</g>
    </g>
  );
}

function Vine({ x, len, seed, delay, children }: { x: number; len: number; seed: number; delay?: string; children?: ReactNode }) {
  const v = liana(len, seed);
  return (
    <g transform={`translate(${x} -6)`}>
      <g {...anim("tw-vine", "50% 0%", { animationDelay: delay })}>
        <path d={v.d} fill="none" stroke={C.vine} strokeWidth="1.8" strokeLinecap="round" />
        {v.leaves.map((l, i) => (
          <path key={i} d={HEART} transform={`translate(${f(l.x)} ${f(l.y)}) rotate(${l.r}) scale(${f(l.s)})`} fill={C.vineLeaf} />
        ))}
        {children && <g transform={`translate(${f(v.end.x)} ${f(v.end.y)})`}>{children}</g>}
      </g>
    </g>
  );
}

export function FooterWordmark() {
  const banana = longLeaf(150, 46);
  const bananaSmall = longLeaf(110, 32, false);
  return (
    <div className="pointer-events-none relative select-none overflow-hidden" aria-hidden>
      <div className="mx-auto max-w-[1280px] px-2 sm:px-6 md:px-12">
        <svg viewBox="0 0 1200 360" className="tw-scene block h-auto w-full" role="presentation">
          <defs>
            <linearGradient id="tw-stone" x1="0" y1={CAP} x2="0" y2={BASE + 6} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#c9c4b9" />
              <stop offset=".5" stopColor="#dcd8cf" />
              <stop offset="1" stopColor={PAPER} />
            </linearGradient>
            <linearGradient id="tw-beak" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#e9b448" />
              <stop offset=".6" stopColor="#e08a2c" />
              <stop offset="1" stopColor="#d06a24" />
            </linearGradient>
            <linearGradient id="tw-morpho" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5fa8de" />
              <stop offset=".5" stopColor="#2f78bd" />
              <stop offset="1" stopColor="#1d4f86" />
            </linearGradient>
            <linearGradient id="tw-red" x1="0" y1="0" x2=".6" y2="1">
              <stop offset="0" stopColor="#cf5a42" />
              <stop offset="1" stopColor="#8c2c21" />
            </linearGradient>
            <linearGradient id="tw-blue" x1="0" y1="0" x2=".4" y2="1">
              <stop offset="0" stopColor="#3f75a3" />
              <stop offset="1" stopColor="#22466a" />
            </linearGradient>
            <linearGradient id="tw-ink" x1="0" y1="0" x2=".7" y2="1">
              <stop offset="0" stopColor="#3a3632" />
              <stop offset="1" stopColor="#100f0e" />
            </linearGradient>
            <linearGradient id="tw-frog" x1="0" y1="0" x2=".3" y2="1">
              <stop offset="0" stopColor="#7cb862" />
              <stop offset="1" stopColor="#447d34" />
            </linearGradient>
            <linearGradient id="tw-fur" x1="0" y1="0" x2=".3" y2="1">
              <stop offset="0" stopColor="#937d63" />
              <stop offset="1" stopColor="#62513f" />
            </linearGradient>
            <linearGradient id="tw-cham" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7db063" />
              <stop offset="1" stopColor="#4d813f" />
            </linearGradient>
            <linearGradient id="tw-leaf" x1="0" y1="0" x2=".5" y2="1">
              <stop offset="0" stopColor="#3d6447" />
              <stop offset="1" stopColor="#1f3527" />
            </linearGradient>
            <filter id="tw-soft" x="-50%" y="-200%" width="200%" height="500%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
            <linearGradient id="tw-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".12" stopColor="#fff" stopOpacity="1" />
              <stop offset=".86" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="tw-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="360">
              <rect width="1200" height="360" fill="url(#tw-fade)" />
            </mask>
          </defs>

          <g mask="url(#tw-mask)">
            {/* canopy: fronds reaching in from above */}
            <Frond x={-10} y={-8} rotate={18} len={230} bend={30} n={18} leaf={46} fill={C.leafBack} opacity={0.32} cls="tw-sway-a" />
            <Frond x={1214} y={-6} rotate={160} len={250} bend={-34} n={19} leaf={48} fill={C.leafBack} opacity={0.3} cls="tw-sway-b" delay="-3s" />

            {/* back layer: soft foliage rising behind the letters */}
            <Frond x={96} y={372} rotate={-74} len={250} bend={40} n={20} leaf={50} fill={C.leafBack} opacity={0.26} cls="tw-sway-b" />
            <Leaf x={470} y={372} rotate={-8} scale={1.25} cls="tw-sway-a" delay="-2s">
              <path d={banana.outline} fillRule="evenodd" fill={C.leafBack} opacity=".24" />
            </Leaf>
            <Leaf x={712} y={376} rotate={10} scale={1.1} cls="tw-sway-b" delay="-5s">
              <path d={MONSTERA} fillRule="evenodd" fill={C.leafBack} opacity=".22" />
            </Leaf>
            <Frond x={1010} y={374} rotate={-112} len={240} bend={-36} n={20} leaf={48} fill={C.leafBack} opacity={0.24} cls="tw-sway-a" delay="-4s" />

            {/* lianas */}
            <Vine x={345} len={150} seed={1} />
            <Vine x={600} len={96} seed={2.4} delay="-2.5s">
              <g {...anim("tw-sloth", "50% 0%")}>
                <Sloth />
              </g>
            </Vine>
            <Vine x={1124} len={110} seed={3.7} delay="-4s">
              <Heliconia />
            </Vine>

            {/* the stone letters */}
            {LETTERS.map(([ch, x], i) => (
              <text key={i} x={x} y={BASE} fontSize="200" fontWeight={300} fill="url(#tw-stone)" style={{ fontFamily: "var(--font-display)" }}>
                {ch}
              </text>
            ))}

            {/* animals on the letters, with soft contact shadows */}
            <g filter="url(#tw-soft)" fill="#2b2620" opacity=".22">
              <ellipse cx="60" cy={CAP + 1.5} rx="15" ry="2.6" />
              <ellipse cx="170" cy={CAP + 1.5} rx="26" ry="2.4" />
              <ellipse cx="737" cy={CAP + 1.5} rx="19" ry="2.6" />
              <ellipse cx="932" cy={CAP + 1.5} rx="11" ry="2.4" />
            </g>
            <g transform={`translate(62 ${CAP})`}>
              <g className="tw-up">
                <Toucan />
              </g>
            </g>
            <g transform={`translate(124 ${CAP - 40.4}) scale(.62)`}>
              <Chameleon />
            </g>
            <g transform={`translate(735 ${CAP})`}>
              <g className="tw-up">
                <TreeFrog />
              </g>
            </g>
            <g transform={`translate(931 ${CAP}) scale(-1 1)`}>
              <g className="tw-up">
                <Macaw />
              </g>
            </g>

            {/* flyers */}
            <g transform="translate(1062 132)">
              <g {...anim("tw-dart", "50% 50%")}>
                <g {...anim("tw-hover", "50% 50%")}>
                  <Hummingbird />
                </g>
              </g>
            </g>
            <g transform="translate(392 104) rotate(-14)">
              <g {...anim("tw-drift-a", "50% 50%")}>
                <Morpho />
              </g>
            </g>
            <g transform="translate(812 86) rotate(10) scale(.8)">
              <g {...anim("tw-drift-b", "50% 50%")}>
                <Morpho />
              </g>
            </g>

            {/* foreground: framing leaves at the corners */}
            <Leaf x={36} y={378} rotate={-28} scale={1.05} cls="tw-sway-a" delay="-1s">
              <path d={MONSTERA} fillRule="evenodd" fill="url(#tw-leaf)" />
              <path d={MONSTERA_VEINS} fill="none" stroke={C.vein} strokeWidth="1.4" opacity=".7" />
            </Leaf>
            <Leaf x={150} y={382} rotate={14} scale={0.9} cls="tw-sway-b" delay="-3.5s">
              <path d={bananaSmall.outline} fill={C.leafFront2} />
              <path d={bananaSmall.veins} fill="none" stroke={C.vein} strokeWidth=".8" opacity=".6" />
            </Leaf>
            <Frond x={1214} y={372} rotate={-150} len={210} bend={-30} n={18} leaf={42} fill={C.leafFront} opacity={0.95} cls="tw-sway-a" delay="-2s" />
            <Leaf x={1112} y={382} rotate={-10} scale={0.95} cls="tw-sway-b">
              <path d={banana.outline} fillRule="evenodd" fill="url(#tw-leaf)" />
              <path d={banana.veins} fill="none" stroke={C.vein} strokeWidth=".8" opacity=".6" />
            </Leaf>
          </g>
        </svg>
      </div>
    </div>
  );
}
