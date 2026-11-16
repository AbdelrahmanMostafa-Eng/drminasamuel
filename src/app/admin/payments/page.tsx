import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { fileUrl, formatEGP } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { PaymentsBoard } from "@/components/admin/payments-board";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { getSettings } from "@/lib/settings";
import { Clock, Wallet } from "lucide-react";
import Link from "next/link";

export default async function PaymentsPage() {
  const user = await requireStaff("payments");
  const [list, settings] = await Promise.all([
    db.enrollment.findMany({
      where: { course: { status: { not: "ARCHIVED" } } },
      orderBy: [{ submittedAt: "desc" }],
      include: { user: true, course: true, reviewedBy: { select: { fullName: true } } },
    }),
    getSettings(),
  ]);
  const approvedSum = list.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);
  const missing = !settings.payment.vodafoneCashNumber && !settings.payment.instapayHandle && !settings.payment.instapayPhone;
  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader eyebrow="Students" title="Payments" description="Check each screenshot, then approve to unlock the course instantly — or reject with a reason so the student can resubmit." />
      {missing && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
          ⚠️ Your InstaPay / Vodafone Cash numbers aren&apos;t set yet — students can&apos;t see where to pay.{" "}
          {user.role === "MASTER" ? <Link href="/admin/settings" className="font-bold underline">Add them in Website settings</Link> : "Ask Dr. Mina to add them in Website settings."}
        </div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Waiting for review" value={list.filter((e) => e.status === "PENDING").length} icon={<Clock />} tone="ember" />
        <StatCard label="Approved enrollments" value={list.filter((e) => e.status === "APPROVED").length} icon={<Wallet />} tone="success" />
        {can(user, "revenue") && <StatCard label="Approved revenue (active courses)" value={formatEGP(approvedSum)} icon={<Wallet />} />}
      </div>
      <PaymentsBoard
        items={list.map((e) => ({
          id: e.id,
          status: e.status,
          student: { id: e.userId, name: e.user.fullName, whatsapp: e.user.whatsapp, email: e.user.email },
          course: { id: e.courseId, title: e.course.title, price: e.course.price, whatsappGroupUrl: e.course.whatsappGroupUrl },
          amount: e.amount,
          method: e.method,
          senderNumber: e.senderNumber,
          reference: e.reference,
          note: e.note,
          proofUrl: e.proofKey === "manual" ? null : fileUrl(e.proofKey),
          isPdf: e.proofKey.toLowerCase().endsWith(".pdf"),
          submittedAt: e.submittedAt.toISOString(),
          reviewedBy: e.reviewedBy?.fullName ?? null,
          reviewedAt: e.reviewedAt?.toISOString() ?? null,
          rejectionReason: e.rejectionReason,
        }))}
      />
    </>
  );
}
