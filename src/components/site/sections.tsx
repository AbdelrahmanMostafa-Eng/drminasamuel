import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  GraduationCap,
  MapPin,
  MonitorPlay,
  ShieldCheck,
  Upload,
  UserPlus,
  Video,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import type { SiteSettings } from "@/lib/settings";
import { formatPhone, waLink } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { FaqList } from "./faq";

export function SectionHeading({ eyebrow, title, description, center }: { eyebrow: string; title: React.ReactNode; description?: React.ReactNode; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-600 dark:text-ember-400">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem]">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>}
    </Reveal>
  );
}

const TOPICS = ["Cell Biology", "Molecular Genetics", "Human Systems", "Ecology", "Evolution", "Plant Biology", "Biochemistry", "Classification", "Heredity", "Homeostasis", "Photosynthesis", "Cellular Respiration"];

export function TopicMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-border bg-card py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-card to-transparent" />
      <div className="flex w-max animate-marquee gap-10">
        {[...TOPICS, ...TOPICS].map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-xl font-medium text-foreground/70">
            {t}
            <span className="size-2 rotate-45 rounded-[3px] bg-ember-400" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function AboutSection({ about, stats }: { about: SiteSettings["about"]; stats: SiteSettings["stats"] }) {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden py-24">
      <div className="container-x grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <TiltCard className="mx-auto max-w-md rounded-[2rem]" max={6}>
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-brand-50 via-card to-ember-50 p-6 shadow-lift dark:from-brand-900/40 dark:via-card dark:to-ember-900/20">
              <div className="bg-grid absolute inset-0 opacity-60" />
              <Image src="/brand/dr-mina.webp" alt="Dr. Mina Samuel" width={816} height={698} className="relative h-auto w-full [transform:translateZ(50px)]" />
              <div className="relative mt-2 flex items-center justify-between rounded-2xl border border-border bg-card/90 p-4 backdrop-blur [transform:translateZ(70px)]">
                <div>
                  <p className="font-display text-lg font-semibold">Dr. Mina Samuel</p>
                  <p className="text-xs font-medium text-muted-foreground">Pharmacist · ACT2 & EST Biology instructor</p>
                </div>
                <Image src="/brand/logo-mark.png" alt="" width={44} height={40} className="h-10 w-auto dark:hidden" />
                <Image src="/brand/logo-mark-white.png" alt="" width={44} height={40} className="hidden h-10 w-auto dark:block" />
              </div>
            </div>
          </TiltCard>
        </Reveal>
        <div>
          <SectionHeading eyebrow="About" title={about.title} />
          <Reveal delay={0.1}>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">{about.body}</p>
          </Reveal>
          <Stagger className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {about.points.map((p) => (
              <StaggerItem key={p}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <span className="text-sm font-semibold">{p}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <StaggerItem key={s.label}>
                <div className="rounded-2xl bg-gradient-to-b from-brand-600 to-brand-800 p-4 text-white shadow-[0_5px_0_0_#0b222e]">
                  <p className="text-xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="mt-1 text-[0.7rem] font-medium text-brand-100/80">{s.label}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: UserPlus, title: "Create your account", text: "Sign up with your full name, WhatsApp number and email. It takes 30 seconds." },
  { icon: CreditCard, title: "Pay with InstaPay or Vodafone Cash", text: "Each course is paid separately. Transfer the course fee to the numbers shown at checkout." },
  { icon: Upload, title: "Upload your screenshot", text: "Upload a clear screenshot of the transfer. Our team reviews it and approves your seat." },
  { icon: GraduationCap, title: "Start learning", text: "Unlock lessons, recordings, PDFs, the full book, homework, quizzes, live sessions and the WhatsApp group." },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-muted/50 py-24">
      <div className="container-x">
        <SectionHeading center eyebrow="How enrollment works" title={<>Four steps to your <em className="text-ember-500">seat</em></>} description="Simple, manual and secure — no cards needed. Your payment screenshot is reviewed by the team before the course unlocks." />
        <Stagger className="relative mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-10 hidden h-0.5 bg-gradient-to-r from-transparent via-brand-300 to-transparent lg:block" />
          {STEPS.map((s, i) => (
            <StaggerItem key={s.title}>
              <TiltCard className="h-full rounded-3xl" max={8}>
                <div className="relative h-full rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_5px_0_0_#123b4d] [transform:translateZ(40px)]">
                      <s.icon className="size-6" />
                    </div>
                    <span className="font-display text-5xl font-semibold text-muted-foreground/25">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Video, title: "Live sessions on Zoom", text: "Join from the website with one tap — your attendance is recorded automatically.", span: "lg:col-span-2", tone: "from-brand-500 to-brand-700" },
  { icon: MonitorPlay, title: "Recorded sessions", text: "Missed something? Re-watch every recording, protected and streamed.", span: "", tone: "from-ember-400 to-ember-600" },
  { icon: ClipboardList, title: "Homework after every lesson", text: "Multiple-choice homework with instant, automatic grading.", span: "", tone: "from-emerald-400 to-emerald-600" },
  { icon: FileCheck2, title: "Chapter quizzes", text: "A quiz closes every chapter — results go to you and to the team instantly.", span: "", tone: "from-violet-400 to-violet-600" },
  { icon: BookMarked, title: "Lesson PDFs & the full book", text: "All notes, slides and the full course book in one place, for enrolled students only.", span: "", tone: "from-sky-400 to-sky-600" },
  { icon: BarChart3, title: "Progress analytics", text: "See your scores, attendance and progress over time — and exactly what to revise next.", span: "lg:col-span-2", tone: "from-pink-400 to-rose-600" },
  { icon: ShieldCheck, title: "Private & secure", text: "Your account works on one device at a time and content is visible only to paid students.", span: "", tone: "from-slate-500 to-slate-700" },
];

export function Features() {
  return (
    <section className="py-24">
      <div className="container-x">
        <SectionHeading eyebrow="Everything in one place" title={<>A complete study system,<br className="hidden sm:block" /> not just videos.</>} />
        <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title} className={f.span}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                <div className={`absolute -right-10 -top-10 size-36 rounded-full bg-gradient-to-br ${f.tone} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-30`} />
                <div className={`relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${f.tone} text-white shadow-[0_4px_0_0_rgb(0_0_0/0.25)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
                  <f.icon className="size-5.5" />
                </div>
                <h3 className="relative mt-5 text-lg font-bold">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function SchedulePreview({ sessions }: { sessions: { id: string; title: string; startsAt: Date; endsAt: Date; courseTitle: string }[] }) {
  return (
    <section className="py-24">
      <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="Session schedule" title="Upcoming live sessions" description="All times are Cairo time. Zoom links unlock inside your dashboard for enrolled students." />
          <Reveal delay={0.15}>
            <ButtonLink href="/schedule" variant="secondary" className="mt-7">
              Full schedule <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>
        <Stagger className="space-y-3">
          {sessions.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">New sessions will be announced soon.</div>
          )}
          {sessions.map((s) => (
            <StaggerItem key={s.id}>
              <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift">
                <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 py-2 text-white shadow-[0_4px_0_0_#123b4d]">
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-brand-100">{fmt(s.startsAt, "MMM")}</span>
                  <span className="text-2xl font-extrabold leading-none">{fmt(s.startsAt, "d")}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{s.title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{s.courseTitle}</p>
                  <p className="mt-0.5 text-xs font-semibold text-ember-600 sm:hidden">{fmt(s.startsAt, "EEE h:mm a")} – {fmt(s.endsAt, "h:mm a")}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <CalendarClock className="size-4 text-ember-500" />
                    {fmt(s.startsAt, "EEE h:mm a")}
                  </p>
                  <p className="text-xs text-muted-foreground">until {fmt(s.endsAt, "h:mm a")}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function TeamSection({ team }: { team: SiteSettings["team"] }) {
  return (
    <section className="relative overflow-hidden bg-muted/50 py-24">
      <div className="container-x">
        <SectionHeading center eyebrow="Team contacts" title="Questions? Our assistants are one message away." description="Chat with the Bioacademy team on WhatsApp about enrollment, payments or anything course-related." />
        <Stagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((t) => (
            <StaggerItem key={t.phone}>
              <a
                href={waLink(t.phone, "Hi! I have a question about Bioacademy courses.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-[#25d366]/50 hover:shadow-lift"
              >
                <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#25d366] to-[#128c7e] text-white shadow-[0_4px_0_0_#0b5e55] transition-transform duration-300 group-hover:-rotate-6">
                  <WhatsAppIcon className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPhone(t.phone)}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#128c7e] dark:text-[#25d366]">Chat on WhatsApp →</p>
                </div>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function CentersSection({ centers }: { centers: SiteSettings["centers"] }) {
  return (
    <section className="py-24">
      <div className="container-x">
        <SectionHeading eyebrow="Center locations" title="Prefer to visit? Find us at three centers." />
        <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {centers.map((c, i) => (
            <StaggerItem key={c.name}>
              <TiltCard className="h-full rounded-3xl" max={7}>
                <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="group relative block h-full overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                  <div className={`relative h-36 overflow-hidden ${["bg-gradient-to-br from-brand-400 to-brand-700", "bg-gradient-to-br from-ember-300 to-ember-600", "bg-gradient-to-br from-emerald-400 to-teal-700"][i % 3]}`}>
                    <svg className="absolute inset-0 size-full opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none">
                      <path d="M0 70 Q 40 40 80 60 T 160 50 T 200 40" stroke="white" strokeWidth="1.5" fill="none" />
                      <path d="M0 30 Q 50 60 100 35 T 200 60" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M30 0 L 60 100 M 120 0 L 140 100 M 170 0 L 150 100" stroke="white" strokeWidth="0.8" />
                    </svg>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [transform:translateZ(40px)]">
                      <div className="absolute inset-0 animate-pulse-ring rounded-full bg-white/50" />
                      <div className="relative grid size-14 place-items-center rounded-full bg-white text-ember-500 shadow-xl transition-transform duration-500 group-hover:-translate-y-2">
                        <MapPin className="size-7" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-lg font-bold">📍 {c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.area}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
                      Open in Google Maps <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </a>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs: SiteSettings["faqs"] }) {
  return (
    <section className="bg-muted/50 py-24">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Good questions, clear answers." description="Can't find what you need? Message any of our assistants on WhatsApp." />
        <Reveal delay={0.1}>
          <FaqList faqs={faqs} />
        </Reveal>
      </div>
    </section>
  );
}

export function CtaBand({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="py-20">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950 px-6 py-14 text-center text-white shadow-[0_10px_0_0_#07161e,0_40px_80px_-30px_rgb(31_96_124/0.8)] sm:px-14">
            <div className="bg-grid absolute inset-0 opacity-30" />
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-ember-500/30 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold sm:text-5xl">
                Ready to ace <em className="text-ember-300">Biology</em>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-brand-100/80">Create your account today, enroll in the current course and join the next live session.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href={loggedIn ? "/dashboard/courses" : "/register"} variant="accent" size="lg">
                  {loggedIn ? "Browse & enroll" : "Create my account"} <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/courses" variant="glass" size="lg">
                  View courses
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-brand-950 pb-16 pt-36 text-white">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -left-20 top-0 size-96 rounded-full bg-brand-500/25 blur-[100px]" />
      <div className="absolute right-0 top-20 size-80 rounded-full bg-ember-500/15 blur-[100px]" />
      <div className="container-x relative">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-400">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-brand-100/80">{description}</p>}
        </Reveal>
      </div>
    </section>
  );
}

export { Link };
