"use client"

import { CheckIcon, XIcon } from "lucide-react"
import { Reveal, Stagger, StaggerItem, AuroraBackground } from "@/components/premium/motion"
import { Badge } from "@/components/ui/badge"
import { CourseCard } from "@/components/site/course-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/lib/store"

const comparison = [
  { label: "Live Zoom sessions (2x weekly)", basics: true, advanced: true },
  { label: "Recorded lessons + PDF notes", basics: true, advanced: true },
  { label: "Chapter homework and timed quizzes", basics: true, advanced: true },
  { label: "Private WhatsApp group", basics: true, advanced: true },
  { label: "Printed course book (digital copy)", basics: true, advanced: true },
  { label: "Exam-style case questions", basics: false, advanced: true },
  { label: "Certificate of completion", basics: true, advanced: true },
]

export function CoursesCatalog() {
  const { state } = useStore()
  const courses = state.courses.filter((c) => c.status !== "archived").sort((a, b) => (a.type === "basics" ? -1 : 1))

  return (
    <div className="relative">
      <AuroraBackground className="h-[60vh]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="rounded-full">Courses</Badge>
          <h1 className="text-balance font-heading text-4xl font-bold md:text-6xl">Choose your starting point.</h1>
          <p className="text-lg text-muted-foreground">
            Basics is open to everyone. Advanced unlocks automatically after you complete Basics.
          </p>
        </Reveal>

        <Stagger className="grid gap-6 md:grid-cols-2">
          {courses.map((c) => (
            <StaggerItem key={c.id}>
              <CourseCard course={c} />
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">What is included</TableHead>
                  <TableHead className="text-center">Basics</TableHead>
                  <TableHead className="text-center">Advanced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-center">
                      <Mark on={row.basics} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Mark on={row.advanced} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
      <CheckIcon className="size-3.5" />
      <span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <XIcon className="size-3.5" />
      <span className="sr-only">Not included</span>
    </span>
  )
}
