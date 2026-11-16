import Link from "next/link";
import { Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { fileUrl, formatEGP } from "@/lib/utils";
import { fmt } from "@/lib/time";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default async function MyPaymentsPage() {
  const user = await requireStudent();
  const list = await db.enrollment.findMany({ where: { userId: user.id }, include: { course: true }, orderBy: { submittedAt: "desc" } });
  return (
    <>
      <PageHeader eyebrow="Billing" title="My payments" description="Every course is paid separately. Here's the status of each payment you submitted." />
      {list.length === 0 ? (
        <EmptyState icon={<Wallet />} title="No payments yet" action={<ButtonLink href="/dashboard/courses">Browse courses</ButtonLink>} />
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <div key={e.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center">
              <a href={fileUrl(e.proofKey)!} target="_blank" rel="noopener noreferrer" className="size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(e.proofKey)!} alt="Payment proof" className="size-full object-cover" />
              </a>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{e.course.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatEGP(e.amount)} · {e.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash"} · {fmt(e.submittedAt)}
                </p>
                {e.status === "REJECTED" && <p className="mt-1 text-sm text-danger">Reason: {e.rejectionReason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={e.status === "APPROVED" ? "success" : e.status === "PENDING" ? "warning" : "danger"} dot>
                  {e.status === "APPROVED" ? "Approved" : e.status === "PENDING" ? "Under review" : "Rejected"}
                </Badge>
                {e.status === "REJECTED" ? (
                  <ButtonLink href={`/dashboard/enroll/${e.courseId}`} size="sm" variant="accent">
                    Resubmit
                  </ButtonLink>
                ) : e.status === "APPROVED" ? (
                  <Link href={`/dashboard/courses/${e.courseId}`} className="text-sm font-semibold text-primary hover:underline">
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
