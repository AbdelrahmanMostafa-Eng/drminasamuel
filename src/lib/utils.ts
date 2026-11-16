import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_NAME = "Bioacademy";
export const TEACHER_NAME = "Dr. Mina Samuel";

export function formatEGP(amount: number | null | undefined) {
  return `${new Intl.NumberFormat("en-US").format(amount ?? 0)} EGP`;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Normalises Egyptian / international numbers to +<digits>. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  let d = digits.startsWith("+") ? digits.slice(1) : digits;
  if (d.startsWith("00")) d = d.slice(2);
  // Egyptian local mobile: 01XXXXXXXXX (11 digits)
  if (/^01[0125]\d{8}$/.test(d)) d = "2" + d;
  if (!/^\d{8,15}$/.test(d)) return null;
  return "+" + d;
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return "—";
  const m = phone.match(/^\+20(1\d)(\d{4})(\d{4})$/);
  if (m) return `+20 ${m[1]} ${m[2]} ${m[3]}`;
  return phone;
}

export function waLink(phone: string, text?: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ensureUrl(url: string) {
  const u = url.trim();
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function fileUrl(key: string | null | undefined) {
  if (!key) return null;
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function plural(n: number, word: string, pluralWord?: string) {
  return `${n} ${n === 1 ? word : pluralWord ?? word + "s"}`;
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Seeded PRNG (mulberry32) — deterministic per-student shuffles. */
export function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Turns YouTube / Vimeo / Google Drive / Bunny links into an embeddable URL. */
export function toEmbedUrl(raw: string): { embed: string; provider: string } | null {
  try {
    const url = new URL(ensureUrl(raw));
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop();
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
        const vid = url.pathname.split("/")[2];
        return { embed: `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`, provider: "YouTube" };
      }
      return id ? { embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`, provider: "YouTube" } : null;
    }
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return { embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`, provider: "YouTube" };
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return { embed: `https://player.vimeo.com/video/${id}`, provider: "Vimeo" };
    }
    if (host === "player.vimeo.com") return { embed: url.toString(), provider: "Vimeo" };
    if (host === "drive.google.com") {
      const m = url.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] ?? url.searchParams.get("id");
      return id ? { embed: `https://drive.google.com/file/d/${id}/preview`, provider: "Google Drive" } : null;
    }
    if (host.endsWith("mediadelivery.net") || host.endsWith("b-cdn.net")) {
      return { embed: url.toString(), provider: "Bunny Stream" };
    }
    if (host.endsWith("zoom.us") && url.pathname.includes("/rec/")) {
      return null; // zoom recordings can't be embedded — open in new tab
    }
    return null;
  } catch {
    return null;
  }
}
