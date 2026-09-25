import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon, AwardIcon, BookMarkedIcon, HeartHandshakeIcon, MicroscopeIcon } from "lucide-react"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { Reveal, Stagger, StaggerItem, AuroraBackground } from "@/components/premium/motion"
import { TiltCard } from "@/components/premium/tilt-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "About Dr. Mina Samuel",
  description: "Meet Dr. Mina Samuel, founder of Bioacademy and biology educator with nearly a decade of experience.",
}

const timeline = [
  { year: "2017", title: "First classroom", body: "Began teaching secondary biology in Cairo, quickly known for turning diagrams into stories." },
  { year: "2019", title: "Online sessions", body: "Moved to live online teaching, serving students across Egypt with recorded lessons." },
  { year: "2022", title: "PhD, Molecular Biology", body: "Completed doctoral research on gene expression, bringing lab-level depth to school biology." },
  { year: "2024", title: "Bioacademy is born", body: "Launched a dedicated platform with structured chapters, MCQ quizzes and automated follow-up." },
]

const values = [
  { icon: MicroscopeIcon, title: "Concept before memory", body: "Understand the mechanism first; the facts then stick on their own." },
  { icon: BookMarkedIcon, title: "Practice, graded fast", body: "Every chapter ends with a timed quiz and immediate model answers." },
  { icon: HeartHandshakeIcon, title: "Real follow-up", body: "Questions under lessons, WhatsApp groups, and reports parents can read." },
  { icon: AwardIcon, title: "Standards, not shortcuts", body: "Content built for national exams and university readiness alike." },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <section className="relative overflow-hidden pt-36 pb-20">
          <AuroraBackground />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[1fr_0.8fr]">
            <div className="flex flex-col gap-6">
              <Reveal>
                <Badge variant="outline" className="rounded-full border-brand/40 bg-brand/10">About the founder</Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="text-balance font-heading text-4xl font-bold md:text-6xl">
                  Dr. Mina Samuel
                  <span className="mt-2 block text-2xl font-medium text-muted-foreground md:text-3xl">Biology educator, researcher, mentor.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Dr. Mina has spent nearly a decade helping Egyptian students fall in love with biology. His sessions are known
                  for clear mechanisms, memorable analogies, and relentless follow-up until every student gets it.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/courses">
                      See the courses
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/signup">Create account</Link>
                  </Button>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.2}>
              <TiltCard className="group mx-auto w-full max-w-sm rounded-3xl" intensity={6}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-border depth-shadow">
                  <Image src="/brand/teacher.png" alt="Portrait of Dr. Mina Samuel" fill priority className="object-cover" sizes="(max-width: 768px) 90vw, 400px" />
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mb-12 flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit rounded-full">Teaching philosophy</Badge>
            <h2 className="text-balance font-heading text-3xl font-bold md:text-4xl">Four principles behind every lesson.</h2>
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="mb-2 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <v.icon className="size-5" />
                    </span>
                    <CardTitle className="font-heading">{v.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{v.body}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="border-y bg-card/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal className="mb-12 flex flex-col gap-3">
              <Badge variant="secondary" className="w-fit rounded-full">Journey</Badge>
              <h2 className="text-balance font-heading text-3xl font-bold md:text-4xl">From a Cairo classroom to a national platform.</h2>
            </Reveal>
            <ol className="relative flex flex-col gap-10 border-l border-border pl-8 md:pl-12">
              {timeline.map((t, i) => (
                <Reveal key={t.year} delay={i * 0.08}>
                  <li className="relative">
                    <span className="absolute top-1.5 -left-[41px] inline-flex size-5 items-center justify-center rounded-full bg-brand ring-4 ring-background md:-left-[57px]" />
                    <div className="flex flex-col gap-1.5">
                      <span className="font-heading text-sm font-bold text-primary">{t.year}</span>
                      <h3 className="font-heading text-xl font-semibold">{t.title}</h3>
                      <p className="max-w-2xl leading-relaxed text-muted-foreground">{t.body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
                <h2 className="text-balance font-heading text-3xl font-bold">Have a question before enrolling?</h2>
                <p className="max-w-lg text-muted-foreground">
                  Message the academy on WhatsApp. A team member replies within a few hours on working days.
                </p>
                <Button asChild size="lg" variant="outline">
                  <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer">
                    Chat on WhatsApp
                    <ArrowRightIcon data-icon="inline-end" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  )
}
