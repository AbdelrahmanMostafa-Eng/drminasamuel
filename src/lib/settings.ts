import "server-only";
import { cache } from "react";
import { db } from "./db";

export type TeamContact = { name: string; phone: string; role?: string };
export type Center = { name: string; area: string; mapUrl: string };
export type Faq = { q: string; a: string };
export type PricingPlan = {
  label: string;
  price: string;
  unit: string;
  note: string;
  features: string[];
  buttonLabel: string;
  buttonLink: string;
  featured: boolean;
};

export type SiteSettings = {
  payment: {
    instapayHandle: string;
    instapayPhone: string;
    instapayLink: string;
    vodafoneCashNumber: string;
    accountName: string;
    instructions: string;
  };
  hero: { eyebrow: string; title: string; highlight: string; subtitle: string };
  about: { title: string; body: string; points: string[] };
  stats: { label: string; value: string }[];
  social: { facebook: string; instagram: string; tiktok: string; youtube: string };
  /** Dr. Mina's own number, shown under the social links in the footer. */
  teacherPhone: string;
  testSites: { act: string; est: string };
  team: TeamContact[];
  centers: Center[];
  faqs: Faq[];
  pricing: { show: boolean; title: string; plans: PricingPlan[] };
  showPublicSchedule: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  payment: {
    instapayHandle: "",
    instapayPhone: "",
    instapayLink: "",
    vodafoneCashNumber: "",
    accountName: "Mina Samuel",
    instructions:
      "Transfer the exact course price, take a clear screenshot of the successful transfer, then upload it below. Your seat is confirmed once an assistant reviews it (usually within a few hours).",
  },
  hero: {
    eyebrow: "ACT2 · EST Biology",
    title: "Biology, mastered",
    highlight: "the smart way.",
    subtitle:
      "Specialized online courses by Dr. Mina Samuel for American Diploma students preparing for the EST2 and ACT2 Biology tests — live sessions, recorded lessons, homework after every lesson and a quiz after every chapter.",
  },
  about: {
    title: "Meet Dr. Mina Samuel",
    body:
      "A dedicated pharmacist who offers specialized courses tailored for American Diploma students preparing for their EST2 and ACT2 Biology tests. With a focus on comprehensive understanding and effective preparation strategies, every lesson is built to turn hard concepts into easy marks.",
    points: [
      "Comprehensive understanding — not memorization",
      "Effective, exam-focused preparation strategies",
      "Homework after every lesson, a quiz after every chapter",
      "A dedicated assistant team on WhatsApp",
    ],
  },
  stats: [
    { label: "Students taught", value: "2,000+" },
    { label: "Practice questions", value: "1,500+" },
    { label: "Tests covered", value: "ACT2 · EST" },
    { label: "Assistant team", value: "7" },
  ],
  social: {
    facebook: "https://www.facebook.com/drminasamuel1/",
    instagram: "https://www.instagram.com/_minasamuel_/",
    tiktok: "https://www.tiktok.com/@_minasamuel_",
    youtube: "https://www.youtube.com/channel/UCfzdNqwCfu470lgshJAHOhg",
  },
  teacherPhone: "+201091711125",
  testSites: { act: "https://aist.act.org", est: "https://estests.com" },
  team: [
    { name: "Rosa", phone: "+201221877044" },
    { name: "Youssef Girges", phone: "+201080884825" },
    { name: "Besada", phone: "+201221877099" },
    { name: "Retaj", phone: "+201080884875" },
    { name: "Selia", phone: "+201157270078" },
    { name: "Mina Morcos", phone: "+201106234228" },
    { name: "Jaiana", phone: "+201010309627" },
  ],
  centers: [
    { name: "OG Hub Center", area: "5th Settlement", mapUrl: "https://maps.app.goo.gl/387vWZGpXceUJyKc8" },
    { name: "Z Hub Center", area: "Maadi", mapUrl: "https://maps.app.goo.gl/p76BNKtvVHUmnw7x8" },
    { name: "Golf 800 Center", area: "Nasr City", mapUrl: "https://maps.app.goo.gl/YgT9uUwyUzpK8pnJ9" },
  ],
  faqs: [
    {
      q: "How do I enroll in a course?",
      a: "Create an account, open the course you want and press Enroll. Pay the course price with InstaPay or Vodafone Cash, upload a screenshot of the transfer, and our team will approve your seat — usually within a few hours.",
    },
    {
      q: "Do I pay once for both Basics and Advanced?",
      a: "No — every course is paid separately. Basics comes first; Advanced opens near the end of Basics and is enrolled and paid for on its own.",
    },
    {
      q: "Can I use my account on more than one device?",
      a: "Each account works on one device at a time. Signing in on a new device automatically signs you out of the old one.",
    },
    {
      q: "How is attendance taken in live sessions?",
      a: "Press the Join session button on the website to enter Zoom — that click marks you present. If you can't attend, submit an excuse from the session card before the session ends.",
    },
    {
      q: "What happens to my account when the course ends?",
      a: "Accounts are tied to the course you paid for. Once the course ends and final grades are archived, the account is removed — unless you're enrolled in the next course.",
    },
  ],
  pricing: {
    show: true,
    title: "Pay per course, as you progress.",
    plans: [
      {
        label: "Basics · Level 01",
        price: "6,000",
        unit: "EGP / course",
        note: "Build the foundation",
        features: ["Cell biology to genetics, chapter by chapter", "Live Zoom sessions + recordings", "Homework after every lesson", "A quiz after every chapter", "Lesson PDFs & the full book"],
        buttonLabel: "Enroll",
        buttonLink: "/courses",
        featured: false,
      },
      {
        label: "Advanced · Level 02",
        price: "6,000",
        unit: "EGP / course",
        note: "Take it to exam level",
        features: ["Exam-level practice", "Live Zoom sessions + recordings", "Homework after every lesson", "A quiz after every chapter", "Requires Biology Basics"],
        buttonLabel: "Enroll",
        buttonLink: "/courses",
        featured: true,
      },
      {
        label: "Full path",
        price: "12,000",
        unit: "EGP in total",
        note: "Basics, then Advanced",
        features: ["Everything in Basics and Advanced", "Each course is paid separately", "InstaPay or Vodafone Cash", "Cash at the center is also possible", "Questions? Talk to the team"],
        buttonLabel: "Contact the team",
        buttonLink: "/contact",
        featured: false,
      },
    ],
  },
  showPublicSchedule: true,
};

function deepMerge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return (patch as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" && !Array.isArray(v) ? deepMerge(b, v) : v;
  }
  return out as T;
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await db.setting.findUnique({ where: { key: "site" } });
    return deepMerge(DEFAULT_SETTINGS, row?.value ?? {});
  } catch {
    return DEFAULT_SETTINGS;
  }
});

/** Stores only the sections that were edited, so untouched sections keep following the defaults above. */
export async function saveSettings(patch: Partial<SiteSettings>) {
  const row = await db.setting.findUnique({ where: { key: "site" } });
  const stored = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? (row.value as Record<string, unknown>) : {};
  const next = { ...stored, ...patch };
  await db.setting.upsert({
    where: { key: "site" },
    create: { key: "site", value: next as object },
    update: { value: next as object },
  });
  return next;
}
