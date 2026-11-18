"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { CourseViewerState } from "@/app/api/courses/[id]/viewer/route";

/** The personal call-to-action of a (cached) public course page, loaded for this visitor only. */
export function CourseCta({ courseId, open, prereqTitle }: { courseId: string; open: boolean; prereqTitle: string | null }) {
  const [s, setS] = React.useState<CourseViewerState | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetch(`/api/courses/${courseId}/viewer`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { state: "guest", prereqOk: true }))
      .then((d: CourseViewerState) => alive && setS(d))
      .catch(() => alive && setS({ state: "guest", prereqOk: true }));
    return () => {
      alive = false;
    };
  }, [courseId]);

  const full = "w-full rounded-full";
  if (!s) return <div className="h-[104px] animate-pulse rounded-2xl bg-foreground/[0.04]" aria-hidden />;

  if (s.state === "guest") {
    return (
      <>
        <ButtonLink href={`/register?next=/dashboard/enroll/${courseId}`} size="lg" className={full}>
          Create account &amp; enroll
        </ButtonLink>
        <ButtonLink href={`/login?next=/dashboard/enroll/${courseId}`} variant="secondary" size="lg" className={`mt-2 ${full}`}>
          I already have an account
        </ButtonLink>
      </>
    );
  }
  if (s.state === "staff") {
    return (
      <ButtonLink href={`/admin/courses/${courseId}`} size="lg" className={full}>
        Manage this course
      </ButtonLink>
    );
  }
  if (s.state === "approved") {
    return (
      <ButtonLink href={`/dashboard/courses/${courseId}`} size="lg" className={full}>
        Open course
      </ButtonLink>
    );
  }
  if (s.state === "pending") {
    return (
      <ButtonLink href={`/dashboard/enroll/${courseId}`} variant="secondary" size="lg" className={full}>
        Payment under review
      </ButtonLink>
    );
  }
  if (!open) return <p className="rounded-xl bg-foreground/[0.04] p-3 text-center text-sm text-muted-foreground">Enrollment is closed for this course.</p>;
  if (!s.prereqOk) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-foreground/[0.04] p-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" /> You need to be enrolled in &ldquo;{prereqTitle}&rdquo; first.
      </p>
    );
  }
  return (
    <ButtonLink href={`/dashboard/enroll/${courseId}`} size="lg" className={full}>
      {s.state === "rejected" ? "Resubmit payment" : "Enroll now"}
    </ButtonLink>
  );
}
