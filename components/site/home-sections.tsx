"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainCircuitIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  LockKeyholeIcon,
  MessageSquareTextIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react"
import { Reveal, Stagger, StaggerItem, CountUp } from "@/components/premium/motion"
import { TiltCard } from "@/components/premium/tilt-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CourseCard } from "@/components/site/course-card"
import { useStore } from "@/lib/store"

const features = [
  {
    icon: VideoIcon,
    title: "Live Zoom, auto-attendance",
    body: "One-click join from your dashboard. Attendance is logged the moment you enter, no roll call.",
  },
  {
    icon: BookOpenIcon,
    title: "Structured chapters",
    body: "Recorded lessons, PDF notes and homework organised chapter by chapter with clear progress.",
  },
  {
    icon: BrainCircuitIcon,
    title: "Instant MCQ grading",
    body: "Timed quizzes graded the second you submit, with model answers and attempt tracking.",
  },
  {
    icon: MessageSquareTextIcon,
    title: "Ask under any lesson",
    body: "Post a question directly under the video; Dr. Mina answers and it is shared with the class.",
  },
  {
    icon: LockKeyholeIcon,
    title: "One account, one device",
    body: "Protected content stays yours. Sessions are bound to a single device to stop account sharing.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Reports for parents",
    body: "Attendance and grade reports generated per session and per quiz, downloadable as spreadsheets.",
  },
]

const steps = [
  { n: "01", title: "Create your account", body: "Full name, email and WhatsApp number. That is all we need.", icon: GraduationCapIcon },
  { n: "02", title: "Pay securely", body: "InstaPay or Vodafone Cash through Paymob or Kashier. Instant confirmation.", icon: SparklesIcon },
  { n: "03", title: "Start learning", body: "Your dashboard unlocks with lessons, live schedule and the private WhatsApp group.", icon: CalendarCheckIcon },
]

export function Features() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
        <Badge variant="secondary" className="rounded-full">Why Bioacademy</Badge>
        <h2 className="text-balance font-heading text-3xl font-bold md:text-5xl">
          Everything around the lesson, handled.
        </h2>
        <p className="text-muted-foreground">
          The platform removes friction so the only thing you think about is biology.
        </p>
      </Reveal>
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <StaggerItem key={f.title}>
            <TiltCard className="group h-full rounded-2xl" intensity={6}>
              <Card className="h-full border-border/70 transition-shadow duration-300 group-hover:depth-shadow">
                <CardHeader>
                  <span className="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <CardTitle className="font-heading text-lg">{f.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{f.body}</CardDescription>
                </CardHeader>
              </Card>
            </TiltCard>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

export function Stats() {
  return (
    <section className="relative overflow-hidden border-y bg-primary text-primary-foreground">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { v: 1200, suffix: "+", label: "Students taught" },
          { v: 86, suffix: "%", label: "Average quiz score" },
          { v: 94, suffix: "%", label: "Session attendance" },
          { v: 9, suffix: " yrs", label: "Teaching experience" },
        ].map((s) => (
          <Reveal key={s.label} className="flex flex-col items-center gap-1 text-center">
            <span className="font-heading text-4xl font-bold md:text-5xl">
              <CountUp value={s.v} suffix={s.suffix} />
            </span>
            <span className="text-sm text-primary-foreground/75">{s.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function FeaturedCourses() {
  const { state } = useStore()
  const courses = state.courses.filter((c) => c.status !== "archived")
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit rounded-full">Courses</Badge>
          <h2 className="text-balance font-heading text-3xl font-bold md:text-5xl">Two courses. One clear path.</h2>
          <p className="max-w-xl text-muted-foreground">
            Start with Basics to build the foundation, then unlock Advanced once you have completed it.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/courses">
            View all courses
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </Reveal>
      <Stagger className="grid gap-6 md:grid-cols-2">
        {courses.map((c) => (
          <StaggerItem key={c.id}>
            <CourseCard course={c} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
        <Badge variant="secondary" className="rounded-full">How it works</Badge>
        <h2 className="text-balance font-heading text-3xl font-bold md:text-5xl">From sign-up to first lesson in minutes.</h2>
      </Reveal>
      <div className="relative grid gap-6 md:grid-cols-3">
        <div aria-hidden className="absolute top-12 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.12}>
            <div className="relative flex flex-col items-center gap-4 text-center">
              <span className="relative inline-flex size-24 items-center justify-center rounded-3xl bg-card ring-1 ring-border depth-shadow">
                <s.icon className="size-9 text-primary" />
                <span className="absolute -top-2 -right-2 inline-flex size-8 items-center justify-center rounded-full bg-brand font-heading text-xs font-bold text-brand-foreground">
                  {s.n}
                </span>
              </span>
              <h3 className="font-heading text-xl font-semibold">{s.title}</h3>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function TeacherSpotlight() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border bg-card depth-shadow">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_55%)]" />
          <div className="relative grid gap-10 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-14">
            <TiltCard className="group mx-auto w-full max-w-sm rounded-3xl" intensity={5}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-border">
                <Image src="/brand/teacher.png" alt="Dr. Mina Samuel" fill className="object-cover" sizes="(max-width: 768px) 90vw, 400px" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                  <p className="font-heading text-xl font-bold">Dr. Mina Samuel</p>
                  <p className="text-sm text-white/80">Biology Educator · Founder, Bioacademy</p>
                </div>
              </div>
            </TiltCard>
            <div className="flex flex-col justify-center gap-6">
              <Badge variant="outline" className="w-fit rounded-full border-brand/40 bg-brand/10">Meet your teacher</Badge>
              <h2 className="text-balance font-heading text-3xl font-bold md:text-4xl">
                “I teach biology as a story, not a list of facts.”
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                With nearly a decade of experience preparing students for national exams, Dr. Mina built Bioacademy to combine
                the energy of a live classroom with the discipline of structured practice. Every chapter ends with a quiz, every
                quiz ends with feedback, and every student has a direct line to ask.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {["PhD in Molecular Biology", "1,200+ students taught", "Live weekly sessions", "Personal WhatsApp follow-up"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 rounded-full bg-brand" /> {t}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-fit">
                <Link href="/about">
                  Read the full story
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-center text-background md:px-16">
          <div className="absolute -top-24 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="text-balance font-heading text-3xl font-bold md:text-5xl">Ready to master biology this year?</h2>
            <p className="max-w-xl text-background/75">
              Join Batch 2026. Seats in live sessions are limited so every student gets attention.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href="/signup">
                  Create free account
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
