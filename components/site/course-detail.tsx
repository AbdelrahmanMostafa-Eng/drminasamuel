"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  LockIcon,
  MessageCircleIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import { Reveal } from "@/components/premium/motion"
import { ShineButton } from "@/components/premium/shine-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/store"
import { chapterLessons, courseStudents, hasPrerequisite, isEnrolled, publishedChapters } from "@/lib/selectors"
import { egp, fmtDate } from "@/lib/format"

export function CourseDetail({ slug }: { slug: string }) {
  const { state, currentUser, hydrated } = useStore()
  const router = useRouter()
  const course = state.courses.find((c) => c.slug === slug)

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>Course not found</EmptyTitle>
            <EmptyDescription>This course may have been archived or the link is wrong.</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link href="/courses">Back to courses</Link>
          </Button>
        </Empty>
      </div>
    )
  }

  const enrolled = isEnrolled(state, currentUser?.id, course.id)
  const unlocked = hasPrerequisite(state, currentUser?.id, course)
  const prereq = course.prerequisiteCourseId ? state.courses.find((c) => c.id === course.prerequisiteCourseId) : null
  const chapters = publishedChapters(state, course.id)
  const totalLessons = state.lessons.filter((l) => l.courseId === course.id && l.published).length
  const totalMinutes = state.lessons.filter((l) => l.courseId === course.id && l.published).reduce((s, l) => s + l.durationMin, 0)
  const quizzes = state.assignments.filter((a) => a.courseId === course.id && a.published && a.kind === "quiz").length
  const students = courseStudents(state, course.id).length
  const isAdmin = currentUser && currentUser.role !== "student"

  const onEnroll = () => {
    if (!currentUser) {
      router.push(`/signup?next=/checkout/${course.slug}`)
      return
    }
    router.push(`/checkout/${course.slug}`)
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-10">
        <Reveal className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={course.type === "advanced" ? "bg-brand text-brand-foreground" : ""}>
              {course.type === "basics" ? "Foundation" : "Advanced"}
            </Badge>
            <Badge variant="secondary">{course.batchLabel}</Badge>
            {course.status === "closed" && <Badge variant="destructive">Enrolment closed</Badge>}
          </div>
          <h1 className="text-balance font-heading text-4xl font-bold md:text-5xl">{course.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{course.description}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><CalendarIcon className="size-4" /> {fmtDate(course.startDate)} – {fmtDate(course.endDate)}</li>
            <li className="inline-flex items-center gap-2"><PlayCircleIcon className="size-4" /> {totalLessons} lessons · {Math.round(totalMinutes / 60)}h</li>
            <li className="inline-flex items-center gap-2"><FileTextIcon className="size-4" /> {quizzes} quizzes</li>
            <li className="inline-flex items-center gap-2"><UsersIcon className="size-4" /> {students} students</li>
          </ul>
        </Reveal>

        <Reveal>
          <div className="relative aspect-[16/8] overflow-hidden rounded-3xl ring-1 ring-border depth-shadow">
            <Image src={course.coverImage} alt={`${course.title} cover`} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 700px" />
          </div>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-bold">What you will master</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {course.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
                {h}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold">Curriculum</h2>
            <span className="text-sm text-muted-foreground">{chapters.length} chapters</span>
          </div>
          {!enrolled && !isAdmin && (
            <Alert>
              <LockIcon />
              <AlertTitle>Preview mode</AlertTitle>
              <AlertDescription>
                You can browse the outline. Videos, PDFs, quizzes and the WhatsApp group unlock after enrolment.
              </AlertDescription>
            </Alert>
          )}
          <Accordion type="multiple" defaultValue={chapters.slice(0, 1).map((c) => c.id)} className="rounded-2xl border bg-card px-2">
            {chapters.map((ch, i) => {
              const lessons = chapterLessons(state, ch.id)
              const chapterQuizzes = state.assignments.filter((a) => a.chapterId === ch.id && a.published)
              return (
                <AccordionItem key={ch.id} value={ch.id}>
                  <AccordionTrigger className="px-3 hover:no-underline">
                    <span className="flex items-center gap-3 text-left">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-semibold">{ch.title}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {lessons.length} lessons · {chapterQuizzes.length} assessments
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <p className="mb-3 text-sm text-muted-foreground">{ch.description}</p>
                    <ul className="flex flex-col divide-y">
                      {lessons.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <span className="inline-flex items-center gap-2">
                            {enrolled || isAdmin ? <PlayCircleIcon className="size-4 text-primary" /> : <LockIcon className="size-4 text-muted-foreground" />}
                            {l.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ClockIcon className="size-3.5" /> {l.durationMin} min
                          </span>
                        </li>
                      ))}
                      {chapterQuizzes.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <span className="inline-flex items-center gap-2">
                            <FileTextIcon className="size-4 text-brand" />
                            {a.title}
                          </span>
                          <Badge variant="outline" className="capitalize">{a.kind}</Badge>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </Reveal>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Reveal delay={0.1}>
          <Card className="overflow-hidden depth-shadow">
            <CardHeader>
              <CardDescription>Full course access</CardDescription>
              <CardTitle className="font-heading text-4xl">{egp(course.priceEGP)}</CardTitle>
              <CardDescription>One-time payment · lifetime access to recordings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!hydrated ? null : enrolled ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/student/courses/${course.id}`}>
                    Go to course
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              ) : isAdmin ? (
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href={`/admin/courses/${course.id}`}>Manage in admin</Link>
                </Button>
              ) : !unlocked && prereq ? (
                <Alert>
                  <LockIcon />
                  <AlertTitle>Requires {prereq.title}</AlertTitle>
                  <AlertDescription>
                    Complete the Basics course first. Advanced unlocks automatically afterwards.
                  </AlertDescription>
                </Alert>
              ) : course.status !== "open" ? (
                <Alert>
                  <AlertTitle>Enrolment closed</AlertTitle>
                  <AlertDescription>Join the waitlist on WhatsApp to hear about the next batch.</AlertDescription>
                </Alert>
              ) : (
                <ShineButton size="lg" variant="brand" className="w-full" onClick={onEnroll}>
                  Enrol now
                  <ArrowRightIcon />
                </ShineButton>
              )}
              <Separator />
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex items-center gap-3"><PlayCircleIcon className="size-4 text-primary" /> {totalLessons} recorded lessons</li>
                <li className="flex items-center gap-3"><CalendarIcon className="size-4 text-primary" /> Live Zoom sessions, auto-attendance</li>
                <li className="flex items-center gap-3"><FileTextIcon className="size-4 text-primary" /> {quizzes} timed MCQ quizzes</li>
                <li className="flex items-center gap-3"><BookOpenIcon className="size-4 text-primary" /> {course.bookTitle ?? "Digital course book"}</li>
                <li className="flex items-center gap-3"><MessageCircleIcon className="size-4 text-primary" /> Private WhatsApp group</li>
                <li className="flex items-center gap-3"><ShieldCheckIcon className="size-4 text-primary" /> InstaPay or Vodafone Cash</li>
              </ul>
            </CardContent>
          </Card>
        </Reveal>
      </aside>
    </div>
  )
}
