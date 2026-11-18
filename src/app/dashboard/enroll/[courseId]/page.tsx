import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Lock, ShieldCheck, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fileUrl, formatEGP, waLink } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/reveal";
import { CourseCover } from "@/components/site/course-card";
import { EnrollForm } from "@/components/student/enroll-form";
import { WhatsAppIcon } from "@/components/brand/social-icons";

export default async function EnrollPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const user = await requireStudent();
  const course = await db.course.findUnique({ where: { id: courseId }, include: { prerequisite: true } });
  if (!course || course.status === "DRAFT" || course.status === "ARCHIVED") notFound();
  const [enrollment, settings] = await Promise.all([db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } }), getSettings()]);
  let prereqOk = true;
  if (course.prerequisiteId) {
    const p = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.prerequisiteId } } });
    prereqOk = p?.status === "APPROVED";
  }
  const helper = settings.team[0];

  const steps = [
    { label: "Submitted", done: !!enrollment, icon: CheckCircle2 },
    { label: "Under review", done: enrollment?.status === "APPROVED" || enrollment?.status === "REJECTED", active: enrollment?.status === "PENDING", icon: Clock },
    { label: enrollment?.status === "REJECTED" ? "Rejected" : "Approved", done: enrollment?.status === "APPROVED", bad: enrollment?.status === "REJECTED", icon: enrollment?.status === "REJECTED" ? XCircle : ShieldCheck },
  ];

  return (
    <FadeIn>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember-600 dark:text-ember-400">Enrollment</p>
            <h1 className="mt-1 text-2xl font-display font-light sm:text-3xl">{course.title}</h1>
            <p className="mt-1 text-muted-foreground">Pay {formatEGP(course.price)} via InstaPay or Vodafone Cash, then upload your screenshot.</p>
          </div>

          {enrollment && (
            <Card>
              <CardBody>
                <div className="flex items-center justify-between gap-2">
                  {steps.map((s, i) => (
                    <div key={s.label} className="flex flex-1 items-center gap-2">
                      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.bad ? "bg-red-500 text-white" : s.done ? "bg-emerald-500 text-white" : s.active ? "animate-pulse bg-amber-400 text-white" : "bg-muted text-muted-foreground"}`}>
                        <s.icon className="size-5" />
                      </div>
                      <span className="hidden text-sm font-semibold sm:block">{s.label}</span>
                      {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded ${s.done ? "bg-emerald-400" : "bg-border"}`} />}
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm">
                  {enrollment.status === "PENDING" && (
                    <p>
                      Your payment of <b>{formatEGP(enrollment.amount)}</b> via <b>{enrollment.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash"}</b> was submitted on {fmt(enrollment.submittedAt)}. The team will review it shortly — you&apos;ll get a notification as soon as you&apos;re approved.
                    </p>
                  )}
                  {enrollment.status === "APPROVED" && <p>You&apos;re enrolled. Your course is unlocked.</p>}
                  {enrollment.status === "REJECTED" && (
                    <p className="text-danger">
                      Your payment couldn&apos;t be verified. <b>Reason:</b> {enrollment.rejectionReason ?? "—"}. Please resubmit below or contact an assistant.
                    </p>
                  )}
                </div>
                {enrollment.status === "APPROVED" && (
                  <ButtonLink href={`/dashboard/courses/${course.id}`} variant="success" className="mt-4">
                    Open course
                  </ButtonLink>
                )}
                {enrollment.status !== "APPROVED" && (
                  <a href={fileUrl(enrollment.proofKey)!} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                    View my uploaded screenshot
                  </a>
                )}
              </CardBody>
            </Card>
          )}

          {(!enrollment || enrollment.status === "REJECTED") && (
            <Card>
              <CardBody>
                {course.status !== "PUBLISHED" || !course.enrollmentOpen ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="size-4" /> Enrollment for this course is currently closed.
                  </p>
                ) : !prereqOk ? (
                  <p className="flex items-center gap-2 text-ember-700 dark:text-ember-300">
                    <Lock className="size-4" /> This course requires an approved enrollment in “{course.prerequisite?.title}”.
                  </p>
                ) : (
                  <EnrollForm courseId={course.id} price={course.price} payment={settings.payment} />
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <CourseCover coverKey={course.coverKey} level={course.level} title={course.title} className="aspect-[16/9]" />
            <div className="p-5">
              <div className="flex gap-2">
                <Badge>{course.level === "BASICS" ? "Basics" : "Advanced"}</Badge>
                {course.batchLabel && <Badge tone="neutral">{course.batchLabel}</Badge>}
              </div>
              <p className="mt-3 font-bold">{course.title}</p>
              <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-display font-light">{formatEGP(course.price)}</span>
              </div>
              <Link href={`/courses/${course.slug}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                View course details
              </Link>
            </div>
          </div>
          {helper && (
            <a href={waLink(helper.phone, `Hi! I have a question about paying for ${course.title}.`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition">
              <span className="grid size-10 place-items-center rounded-xl bg-[#25d366] text-white">
                <WhatsAppIcon className="size-5" />
              </span>
              <span className="text-sm">
                <span className="block font-bold">Need help paying?</span>
                <span className="text-muted-foreground">Chat with {helper.name} on WhatsApp</span>
              </span>
            </a>
          )}
        </aside>
      </div>
    </FadeIn>
  );
}
