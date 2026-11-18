import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, BookMarked, ClipboardList, FileCheck2, GraduationCap, Lock, MonitorPlay, Smartphone, Upload, UserPlus, Video } from "lucide-react";
import { HeroTitle, SectionTitle } from "./text-anim";
import { FeatherOrb } from "./orb";
import { ViewerLink } from "./viewer";
import { PixelAnim, type PixelScene } from "./pixel-anim";
import { FaqList } from "./faq";
import { Reveal } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/card";
import { Tag } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import type { SiteSettings } from "@/lib/settings";
import { formatPhone, waLink } from "@/lib/utils";
import { fmt } from "@/lib/time";

/* ─── Shared section heading (agentic layout + portfolio text reveal) ───────── */

export function SectionHead({ tag, title, description, center, aside, anim }: { tag: string; title: React.ReactNode; description?: React.ReactNode; center?: boolean; aside?: React.ReactNode; anim?: PixelScene }) {
  return (
    <div className={center ? "mx-auto mb-16 flex max-w-2xl flex-col items-center text-center" : "mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"}>
      <div className={center ? "flex flex-col items-center" : "max-w-2xl"}>
        {anim && <PixelAnim scene={anim} className="mb-6" />}
        <Tag>{tag}</Tag>
        <SectionTitle className="mt-5 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">{title}</SectionTitle>
        {description && center && <p className="mt-5 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {!center && (aside ?? (description && <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>))}
    </div>
  );
}

export function Section({ id, children, className = "", border = true, gradientBar }: { id?: string; children: React.ReactNode; className?: string; border?: boolean; gradientBar?: boolean }) {
  return (
    <section id={id} data-gradient-bar={gradientBar ? "" : undefined} className={`scroll-mt-24 px-6 py-28 md:px-12 md:py-32 ${border ? "border-t border-border" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */

export function Hero({ hero, stats }: { hero: SiteSettings["hero"]; stats: SiteSettings["stats"] }) {
  return (
    <section className="relative overflow-hidden pt-24 md:pt-28">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-end gap-6 px-6 md:px-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        <div className="pb-6 pt-10 lg:pb-24 lg:pt-20">
          <p className="mb-6 text-lg text-muted-foreground">{hero.eyebrow} — with Dr. Mina Samuel</p>
          <HeroTitle text={`${hero.title}\n${hero.highlight}`} className="font-display text-[2.9rem] font-light leading-[1.02] tracking-tight sm:text-6xl lg:text-[5.4rem]" />
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">{hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/courses" className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-4 text-base font-medium text-background transition-opacity hover:opacity-85">
              Explore courses
            </Link>
            <ViewerLink
              guest={{ href: "/register", label: "Create an account" }}
              member={{ href: "@dashboard", label: "Go to my dashboard" }}
              className="inline-flex items-center gap-2 px-6 py-4 text-base font-medium text-brand-600 transition-colors hover:text-brand-800"
            >
              <ArrowRight className="size-4" />
            </ViewerLink>
          </div>
          <div className="mt-14 flex flex-wrap gap-x-10 gap-y-6">
            {stats.slice(0, 3).map((s, i) => (
              <div key={s.label} className="opacity-0" style={{ animation: `fade-up 0.8s cubic-bezier(0.16,1,0.3,1) ${0.9 + i * 0.1}s forwards` }}>
                <div className="font-display text-3xl font-light tracking-tight sm:text-4xl">{s.value}</div>
                <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
          <FeatherOrb className="absolute -right-[18%] top-[2%] w-[92%] opacity-95 lg:-right-[22%] lg:top-[4%]" />
          <div className="relative z-10 mx-auto w-[78%] lg:w-[74%]">
            <Image
              src="/images/dr-mina-clean.webp"
              alt="Dr. Mina Samuel"
              width={393}
              height={696}
              priority
              sizes="(min-width: 1024px) 420px, 70vw"
              className="h-auto w-full [mask-image:linear-gradient(to_bottom,black_78%,transparent)]"
            />
          </div>

        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

/* ─── Marquee (agentic: two bordered rows) ───────────────────────────────── */

const ROW_A = ["Cell Biology", "Molecular Genetics", "Human Systems", "Ecology", "Evolution", "Plant Biology", "Biochemistry", "Classification", "Heredity", "Homeostasis"];
const ROW_B = ["Photosynthesis", "Cellular Respiration", "Mitosis & Meiosis", "Protein Synthesis", "Nervous System", "Circulation", "Biogeochemical Cycles", "Natural Selection", "Enzymes", "Punnett Squares"];

export function TopicMarquee() {
  return (
    <section className="select-none overflow-hidden border-t border-border" aria-label="Topics covered">
      <div className="marquee-left flex w-max border-b border-border">
        {[0, 1, 2].map((rep) => (
          <div key={rep} className="flex shrink-0">
            {ROW_A.map((t) => (
              <div key={t} className="flex shrink-0 items-center gap-6 border-r border-border px-10 py-5">
                <span className="size-1.5 shrink-0 rounded-full bg-foreground/20" />
                <span className="whitespace-nowrap text-sm tracking-wide text-foreground/60">{t}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="marquee-right flex w-max border-b border-border">
        {[0, 1, 2].map((rep) => (
          <div key={rep} className="flex shrink-0">
            {ROW_B.map((t) => (
              <div key={t} className="flex shrink-0 items-center gap-6 border-r border-border px-10 py-5">
                <span className="size-1.5 shrink-0 rounded-full bg-foreground/10" />
                <span className="whitespace-nowrap text-sm tracking-wide text-foreground/40">{t}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── About ──────────────────────────────────────────────────────────────── */

export function AboutSection({ about }: { about: SiteSettings["about"]; stats?: SiteSettings["stats"] }) {
  return (
    <Section id="about" border={false}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <PixelAnim scene="dna" className="mb-6" />
          <Tag>About</Tag>
          <SectionTitle className="mt-5 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">{about.title}</SectionTitle>
          <Reveal>
            <p className="mt-6 leading-relaxed text-muted-foreground">{about.body}</p>
          </Reveal>
          <div className="mt-10 space-y-4">
            {about.points.map((p) => (
              <div key={p} className="flex gap-4">
                <div className="w-px shrink-0 bg-foreground/15" />
                <p className="text-sm text-foreground/80">{p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="eyebrow">How every chapter runs</p>
            <ol className="mt-5 space-y-5">
              {[
                ["Live session", "Explained on Zoom, attendance taken automatically"],
                ["Recording", "Uploaded to the lesson so you can re-watch it"],
                ["Homework", "A short multiple-choice set after every lesson"],
                ["Chapter quiz", "Timed, graded instantly, reviewed together"],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-sm">{t}</span>
                    <span className="block text-xs text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-card p-6">
            <p className="eyebrow">At a glance</p>
            <dl className="mt-4 divide-y divide-border text-sm">
              {[
                ["Profession", "Pharmacist"],
                ["Teaches", "ACT2 & EST Biology"],
                ["Students", "American Diploma"],
                ["Format", "Online + centers in Cairo"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── How enrollment works (agentic 4-step cards) ────────────────────────── */

const STEPS = [
  { n: "01", icon: UserPlus, title: "Create an account", text: "Sign up with your full name, WhatsApp number and email. It takes under a minute." },
  { n: "02", icon: Smartphone, title: "Pay for the course", text: "Each course is paid separately with InstaPay or Vodafone Cash — the numbers are shown at checkout." },
  { n: "03", icon: Upload, title: "Upload the screenshot", text: "Upload a clear screenshot of the transfer. The team reviews it and approves your seat." },
  { n: "04", icon: GraduationCap, title: "Start learning", text: "Lessons, recordings, PDFs, the full book, homework, quizzes, live sessions and the WhatsApp group unlock." },
];

export function HowItWorks() {
  return (
    <Section id="enroll">
      <SectionHead anim="heartbeat" tag="Enrollment" title={<>From sign-up to your first<br className="hidden md:block" /> lesson in four steps.</>} description="Payments are manual and personal: your screenshot is checked by the team before the course unlocks." />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <SpotlightCard className="flex h-full min-h-[300px] flex-col rounded-2xl border border-border bg-card p-7">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground">{s.n}</span>
                <s.icon className="size-5 text-foreground/40" strokeWidth={1.5} />
              </div>
              <div className="mt-auto pt-16">
                <h3 className="font-display text-2xl font-light tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Platform bento ─────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: MonitorPlay, title: "Recorded sessions", text: "Re-watch every class whenever you need, streamed privately." },
  { icon: ClipboardList, title: "Homework after every lesson", text: "Multiple-choice homework graded instantly, with deadlines." },
  { icon: FileCheck2, title: "A quiz after every chapter", text: "Timed chapter quizzes — results go to you and the team." },
  { icon: BookMarked, title: "Lesson PDFs & the full book", text: "All notes, slides and the course book in one place." },
  { icon: BarChart3, title: "Progress analytics", text: "Scores, attendance and what to revise next." },
  { icon: Lock, title: "Private & personal", text: "Content is visible only to enrolled students, one device per account." },
];

export function Features() {
  return (
    <Section id="platform">
      <SectionHead anim="iguana" tag="The platform" title={<>Everything you need<br className="hidden md:block" /> to prepare properly.</>} />
      <div className="grid grid-cols-12 gap-3">
        <Reveal className="col-span-12">
          <SpotlightCard className="grid overflow-hidden rounded-2xl border border-border bg-[#0b0b0a] text-white md:grid-cols-12">
            {/* The photo keeps its own 3:2 shape, so the whole iguana is always in frame. */}
            <div className="relative aspect-[3/2] md:order-2 md:col-span-7">
              <Image src="/images/iguana.webp" alt="Close-up of an iguana resting on a branch" fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
              {/* Slow fade into the black text panel: left edge on desktop, bottom edge when stacked on phones. */}
              <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,#0b0b0a_0%,rgb(11_11_10/0.88)_10%,rgb(11_11_10/0.62)_24%,rgb(11_11_10/0.32)_40%,rgb(11_11_10/0.1)_54%,transparent_66%)] md:block" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0b0b0a_0%,rgb(11_11_10/0.7)_14%,rgb(11_11_10/0.25)_32%,transparent_48%)] md:hidden" />
            </div>
            <div className="relative z-10 flex flex-col justify-end p-8 md:order-1 md:col-span-5 md:p-10">
              <div className="mb-6 grid size-10 place-items-center rounded-xl border border-white/20">
                <Video className="size-[18px]" />
              </div>
              <h3 className="font-display text-2xl font-light">Live sessions on Zoom — attendance taken for you</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">Students join from the website with one tap. That click marks them present; absent students can send an excuse before the session ends.</p>
            </div>
          </SpotlightCard>
        </Reveal>
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} className="col-span-12 md:col-span-4" delay={(i % 3) * 0.06}>
            <SpotlightCard className="h-full min-h-[200px] rounded-2xl border border-border bg-card p-8">
              <div className="mb-5 grid size-10 place-items-center rounded-xl border border-border">
                <f.icon className="size-[18px] text-foreground/70" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-light">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Schedule (agentic log list) ────────────────────────────────────────── */

export function SchedulePreview({ sessions }: { sessions: { id: string; title: string; startsAt: Date; endsAt: Date; courseTitle: string }[] }) {
  return (
    <Section id="schedule">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <PixelAnim scene="hourglass" className="mb-6" />
          <Tag>Schedule</Tag>
          <SectionTitle className="mt-5 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">Upcoming live sessions</SectionTitle>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">All times are Cairo time. Zoom links are only available inside the dashboard, to enrolled students.</p>
          <Link href="/schedule" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800">
            Full schedule <ArrowRight className="size-4" />
          </Link>
        </div>
        <SpotlightCard className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">Next sessions</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-success" /> Cairo time
            </span>
          </div>
          <div className="space-y-2">
            {sessions.length === 0 && <p className="rounded-lg bg-foreground/[0.02] px-3 py-6 text-center text-sm text-muted-foreground">New sessions will be announced soon.</p>}
            {sessions.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 rounded-lg border border-border/70 bg-foreground/[0.015] px-3 py-3" style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both` }}>
                <span className="min-w-[88px] font-mono text-[11px] text-muted-foreground">{fmt(s.startsAt, "EEE d MMM")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{s.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.courseTitle}</span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{fmt(s.startsAt, "h:mm a")}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </Section>
  );
}

/* ─── Team ───────────────────────────────────────────────────────────────── */

export function TeamSection({ team }: { team: SiteSettings["team"] }) {
  return (
    <Section id="team">
      <SectionHead anim="bees" tag="Team contacts" title={<>Questions? Talk to<br className="hidden md:block" /> the assistant team.</>} description="Message any assistant on WhatsApp about enrollment, payments or anything course-related." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((t, i) => (
          <Reveal key={t.phone} delay={(i % 3) * 0.05}>
            <a
              href={waLink(t.phone, "Hi! I have a question about Bioacademy courses.")}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5 transition-colors hover:border-foreground/20"
            >
              <span>
                <span className="block text-[0.95rem]">{t.name}</span>
                <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{formatPhone(t.phone)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-[#128c7e]">
                <WhatsAppIcon className="size-4" /> Chat
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── Centers ────────────────────────────────────────────────────────────── */

export function CentersSection({ centers }: { centers: SiteSettings["centers"] }) {
  return (
    <Section id="centers">
      <SectionHead anim="bird" tag="Center locations" title="Prefer to visit in person?" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {centers.map((c, i) => (
          <Reveal key={c.name} delay={i * 0.06}>
            <SpotlightCard className="h-full rounded-2xl border border-border bg-card">
              <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="flex h-full min-h-[220px] flex-col p-8">
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <div className="mt-auto pt-12">
                  <h3 className="font-display text-2xl font-light tracking-tight">{c.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.area}, Cairo</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm text-brand-600">
                    Open in Google Maps <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </a>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */

export function FaqSection({ faqs }: { faqs: SiteSettings["faqs"] }) {
  return (
    <Section id="faq">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <PixelAnim scene="amoeba" className="mb-6" />
          <Tag>FAQ</Tag>
          <SectionTitle className="mt-5 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">Good questions, clear answers.</SectionTitle>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">Can&apos;t find what you need? Message any of the assistants on WhatsApp.</p>
        </div>
        <FaqList faqs={faqs} />
      </div>
    </Section>
  );
}

/* ─── Final call to action ───────────────────────────────────────────────── */

export function CtaBand() {
  return (
    <section className="relative overflow-hidden border-t border-border px-6 py-32 md:px-12">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_bottom,black,transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <PixelAnim scene="butterfly" className="mx-auto mb-8" />
        <SectionTitle className="font-display text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">Start your Biology preparation today.</SectionTitle>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">Create your account, enroll in the current course and join the next live session.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ViewerLink
            guest={{ href: "/register", label: "Create my account" }}
            member={{ href: "@dashboard", label: "Go to my dashboard" }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-8 py-4 text-base font-medium text-background transition-opacity hover:opacity-85"
          >
            <ArrowUpRight className="size-4" />
          </ViewerLink>
          <Link href="/courses" className="inline-flex items-center justify-center rounded-full border border-border px-8 py-4 text-base font-medium transition-colors hover:border-foreground/25">
            View courses
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Inner-page header ──────────────────────────────────────────────────── */

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <section className="px-6 pb-4 pt-36 md:px-12 md:pt-44">
      <div className="mx-auto max-w-6xl">
        <Tag>{eyebrow}</Tag>
        <SectionTitle as="h1" className="mt-6 max-w-3xl font-display text-5xl font-light leading-[1.02] tracking-tight md:text-7xl">
          {title}
        </SectionTitle>
        {description && <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </section>
  );
}

export { Link };

/* ─── Pricing (agentic: three plain cards, middle one inked) ─────────────── */

type PricingCourse = { id: string; slug: string; title: string; level: "BASICS" | "ADVANCED"; price: number; chapters: number; lessons: number; enrollmentOpen: boolean; prerequisiteTitle: string | null };

const egp = (n: number) => new Intl.NumberFormat("en-US").format(n);
const shortTitle = (t: string) => t.split(" — ")[0];

export function PricingSection({ courses }: { courses: PricingCourse[] }) {
  if (!courses.length) return null;
  const plans = courses.slice(0, 2).map((c) => ({
    key: c.id,
    label: c.level === "BASICS" ? "Basics · Level 01" : "Advanced · Level 02",
    price: egp(c.price),
    unit: "EGP / course",
    note: c.level === "BASICS" ? "Build the foundation" : "Take it to exam level",
    items: [
      `${c.chapters} chapters · ${c.lessons} lessons`,
      "Live Zoom sessions + recordings",
      "Homework after every lesson",
      "A quiz after every chapter",
      "Lesson PDFs & the full book",
      c.prerequisiteTitle ? `Requires ${shortTitle(c.prerequisiteTitle)}` : "No prerequisite",
    ],
    cta: { href: `/courses/${c.slug}`, label: c.enrollmentOpen ? "Enroll" : "View course" },
  }));
  if (courses.length >= 2) {
    plans.push({
      key: "path",
      label: "Full path",
      price: egp(courses.slice(0, 2).reduce((s, c) => s + c.price, 0)),
      unit: "EGP in total",
      note: "Basics, then Advanced",
      items: ["Everything in Basics and Advanced", "Each course is paid separately", "InstaPay or Vodafone Cash", "Cash at the center is also possible", "Questions? Talk to the team"],
      cta: { href: "/contact", label: "Contact the team" },
    });
  }
  const featured = plans.length === 3 ? 1 : 0;
  return (
    <Section id="pricing">
      <div className="mb-14 text-center md:mb-16">
        <PixelAnim scene="mitosis" className="mx-auto mb-6" />
        <Tag>Pricing</Tag>
        <SectionTitle className="mt-6 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">Pay per course, as you progress.</SectionTitle>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${plans.length === 3 ? "md:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-md"}`}>
        {plans.map((p, i) => (
          <Reveal key={p.key} delay={i * 0.06} className="h-full">
            <SpotlightCard className="flex h-full flex-col rounded-2xl border border-border bg-card p-8">
              <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground">{p.label}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-light tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.unit}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{p.note}</p>
              <ul className="mb-10 mt-8 flex-1 space-y-3.5 text-sm text-foreground/70">
                {p.items.map((it) => (
                  <li key={it} className="flex items-center gap-3">
                    <span className="size-1 shrink-0 rounded-full bg-foreground/30" />
                    {it}
                  </li>
                ))}
              </ul>
              <Link
                href={p.cta.href}
                className={
                  i === featured
                    ? "inline-flex h-12 items-center justify-center rounded-xl bg-foreground text-[13px] font-medium uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-85"
                    : "inline-flex h-12 items-center justify-center rounded-xl border border-border text-[13px] uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground"
                }
              >
                {p.cta.label}
              </Link>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
