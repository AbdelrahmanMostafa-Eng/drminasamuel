"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon, CalendarIcon, LockIcon, UsersIcon } from "lucide-react"
import { TiltCard } from "@/components/premium/tilt-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { courseStudents, isEnrolled, hasPrerequisite } from "@/lib/selectors"
import { egp, fmtDate } from "@/lib/format"
import type { Course } from "@/lib/types"

export function CourseCard({ course }: { course: Course }) {
  const { state, currentUser } = useStore()
  const enrolled = isEnrolled(state, currentUser?.id, course.id)
  const unlocked = hasPrerequisite(state, currentUser?.id, course)
  const students = courseStudents(state, course.id).length

  return (
    <TiltCard className="group h-full rounded-3xl" intensity={5}>
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-shadow duration-300 group-hover:depth-shadow">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={course.coverImage}
            alt={`${course.title} cover`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={course.type === "advanced" ? "bg-brand text-brand-foreground" : ""}>
              {course.type === "basics" ? "Foundation" : "Advanced"}
            </Badge>
            {course.status === "closed" && <Badge variant="secondary">Closed</Badge>}
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-xs font-medium tracking-wide uppercase opacity-80">{course.batchLabel}</p>
            <h3 className="font-heading text-2xl font-bold">{course.title}</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-5 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{course.tagline}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" /> Starts {fmtDate(course.startDate)}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <UsersIcon className="size-3.5" /> {students} enrolled
            </li>
          </ul>
          <div className="mt-auto flex items-center justify-between gap-4 border-t pt-5">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Full course</span>
              <span className="font-heading text-2xl font-bold">{egp(course.priceEGP)}</span>
            </div>
            <Button asChild variant={enrolled ? "outline" : "default"}>
              <Link href={`/courses/${course.slug}`}>
                {enrolled ? "Continue" : !unlocked ? <LockIcon data-icon="inline-start" /> : null}
                {enrolled ? null : !unlocked ? "Locked" : "View course"}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </TiltCard>
  )
}
