import Link from "next/link";
import { BookOpen, Layers, Plus, Users, Video } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff, requireStaffAny } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatEGP } from "@/lib/utils";
import { fmtDate } from "@/lib/time";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCover } from "@/components/site/course-card";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/card";

const STATUS = {
  DRAFT: { tone: "neutral", label: "Draft" },
  PUBLISHED: { tone: "success", label: "Published" },
  ENDED: { tone: "warning", label: "Ended" },
  ARCHIVED: { tone: "neutral", label: "Archived" },
} as const;

export default async function AdminCourses() {
  const user = await requireStaffAny(["courses", "content", "assessments", "grades"]);
  const courses = await db.course.findMany({
    orderBy: [{ archivedAt: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { chapters: true, lessons: true, liveSessions: true, assessments: true } },
      enrollments: { select: { status: true } },
    },
  });
  return (
    <>
      <PageHeader
        eyebrow="Teaching"
        title="Courses & content"
        description="Create Basics and Advanced courses, then build chapters, lessons, homework, quizzes and upload the book."
        actions={
          can(user, "courses") && (
            <ButtonLink href="/admin/courses/new" variant="accent">
              <Plus className="size-4" /> New course
            </ButtonLink>
          )
        }
      />
      {courses.length === 0 ? (
        <EmptyState icon={<BookOpen />} title="No courses yet" description="Create your first course — for example “Biology Basics — Winter 2026” for 6,000 EGP." action={can(user, "courses") && <ButtonLink href="/admin/courses/new" variant="accent">Create a course</ButtonLink>} />
      ) : (
        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const approved = c.enrollments.filter((e) => e.status === "APPROVED").length;
            const pending = c.enrollments.filter((e) => e.status === "PENDING").length;
            return (
              <StaggerItem key={c.id}>
                <TiltCard className="h-full rounded-3xl" max={5}>
                  <Link href={`/admin/courses/${c.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:shadow-lift">
                    <div className="relative">
                      <CourseCover coverKey={c.coverKey} level={c.level} title={c.title} className="aspect-[16/8]" />
                      <div className="absolute left-3 top-3 flex gap-1.5">
                        <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                        <Badge tone="glass">{c.level === "BASICS" ? "Basics" : "Advanced"}</Badge>
                        {c.isSample && <Badge tone="ember">Example</Badge>}
                      </div>
                      {pending > 0 && <Badge tone="ember" className="absolute right-3 top-3">{pending} pending payment{pending > 1 ? "s" : ""}</Badge>}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-lg font-extrabold leading-snug">{c.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{c.batchLabel ?? c.track} · {formatEGP(c.price)}</p>
                      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                        {[
                          [Users, c.archivedAt ? (c.finalStudentCount ?? 0) : approved, "students"],
                          [Layers, c._count.chapters, "chapters"],
                          [BookOpen, c._count.lessons, "lessons"],
                          [Video, c._count.liveSessions, "sessions"],
                        ].map(([Icon, n, l], i) => {
                          const I = Icon as typeof Users;
                          return (
                            <div key={i} className="rounded-xl bg-muted/60 py-2">
                              <I className="mx-auto size-4 text-muted-foreground" />
                              <p className="mt-1 text-sm font-extrabold">{n as number}</p>
                              <p className="text-[0.62rem] text-muted-foreground">{l as string}</p>
                            </div>
                          );
                        })}
                      </div>
                      {c.startDate && <p className="mt-4 text-xs text-muted-foreground">Runs {fmtDate(c.startDate)}{c.endDate ? ` → ${fmtDate(c.endDate)}` : ""}</p>}
                    </div>
                  </Link>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </>
  );
}
