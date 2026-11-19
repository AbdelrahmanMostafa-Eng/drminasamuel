"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, Clock, CreditCard, Search, Smartphone, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StateTabs } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { reviewEnrollmentAction } from "@/actions/admin-people";
import { useAction } from "./use-action";
import { cn, formatEGP, formatPhone, waLink } from "@/lib/utils";

export type PaymentCard = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  student: { id: string; name: string; whatsapp: string | null; email: string | null };
  course: { id: string; title: string; price: number; whatsappGroupUrl: string | null };
  amount: number;
  method: "INSTAPAY" | "VODAFONE_CASH";
  senderNumber: string | null;
  reference: string | null;
  note: string | null;
  proofUrl: string | null;
  isPdf: boolean;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

const REASONS = ["The screenshot isn't clear — please upload a clearer one.", "The amount doesn't match the course price.", "We couldn't find this transfer — please check the number you sent to.", "This screenshot was already used for another enrollment."];
const df = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function PaymentsBoard({ items }: { items: PaymentCard[] }) {
  const [tab, setTab] = React.useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [q, setQ] = React.useState("");
  const [preview, setPreview] = React.useState<PaymentCard | null>(null);
  const [rejecting, setRejecting] = React.useState<PaymentCard | null>(null);
  const [reason, setReason] = React.useState("");
  const confirm = useConfirm();
  const { pending, exec } = useAction();
  const list = items.filter((i) => i.status === tab && (!q || `${i.student.name} ${i.student.whatsapp} ${i.course.title} ${i.senderNumber ?? ""} ${i.reference ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const count = (s: string) => items.filter((i) => i.status === s).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StateTabs
          id="pay-tabs"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "PENDING", label: "To review", count: count("PENDING") },
            { value: "APPROVED", label: "Approved", count: count("APPROVED") },
            { value: "REJECTED", label: "Rejected", count: count("REJECTED") },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, reference…" className="field-input h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none" />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<CreditCard />} title={tab === "PENDING" ? "No payments waiting" : "Nothing here"} description={tab === "PENDING" ? "New payment screenshots will appear here instantly." : undefined} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((p) => {
              const mismatch = p.amount < p.course.price;
              return (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, x: 40 }} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:flex-row">
                  <button onClick={() => setPreview(p)} className="group relative h-48 shrink-0 overflow-hidden bg-muted sm:h-auto sm:w-44">
                    {p.proofUrl ? (
                      p.isPdf ? (
                        <div className="grid size-full place-items-center text-sm font-bold text-muted-foreground">PDF proof</div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.proofUrl} alt="Payment screenshot" className="size-full object-cover transition duration-500 group-hover:scale-110" />
                      )
                    ) : (
                      <div className="grid size-full place-items-center p-4 text-center text-xs font-semibold text-muted-foreground">Added manually (no screenshot)</div>
                    )}
                    {p.proofUrl && (
                      <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                        <ZoomIn className="size-7" />
                      </span>
                    )}
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link prefetch={false} href={`/admin/students/${p.student.id}`} className="block truncate font-semibold hover:text-primary">{p.student.name}</Link>
                        <p className="truncate text-xs text-muted-foreground">{formatPhone(p.student.whatsapp)}</p>
                      </div>
                      <Badge tone={p.method === "INSTAPAY" ? "brand" : "danger"}>
                        <Smartphone className="size-3" /> {p.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash"}
                      </Badge>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{p.course.title}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Amount</span>
                      <span className={cn("font-bold", mismatch && "text-danger")}>{formatEGP(p.amount)}</span>
                      {p.senderNumber && (<><span className="text-muted-foreground">Sent from</span><span className="font-mono font-semibold">{p.senderNumber}</span></>)}
                      {p.reference && (<><span className="text-muted-foreground">Reference</span><span className="truncate font-mono font-semibold">{p.reference}</span></>)}
                      <span className="text-muted-foreground">Submitted</span>
                      <span className="font-semibold">{df.format(new Date(p.submittedAt))}</span>
                    </div>
                    {p.note && <p className="mt-2 rounded-xl bg-muted/60 p-2 text-xs italic">“{p.note}”</p>}
                    {mismatch && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-danger"><AlertTriangle className="size-3.5" /> Course price is {formatEGP(p.course.price)}</p>}
                    {p.status === "REJECTED" && <p className="mt-2 text-xs text-danger">Rejected: {p.rejectionReason}</p>}
                    {p.status !== "PENDING" && p.reviewedBy && <p className="mt-2 text-xs text-muted-foreground">Reviewed by {p.reviewedBy} · {p.reviewedAt ? df.format(new Date(p.reviewedAt)) : ""}</p>}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      {p.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            loading={pending}
                            onClick={async () => {
                              if (await confirm({ title: `Approve ${p.student.name}?`, description: `They'll get instant access to “${p.course.title}”.`, confirmLabel: "Approve" })) exec(() => reviewEnrollmentAction(p.id, "APPROVE"));
                            }}
                          >
                            <Check className="size-4" /> Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => { setRejecting(p); setReason(REASONS[0]!); }}>
                            <X className="size-4" /> Reject
                          </Button>
                        </>
                      )}
                      {p.student.whatsapp && (
                        <a
                          href={waLink(
                            p.student.whatsapp,
                            p.status === "APPROVED"
                              ? `Hi ${p.student.name.split(" ")[0]}! 🎉 Your enrollment in ${p.course.title} is approved. Open your Bioacademy dashboard to start.${p.course.whatsappGroupUrl ? ` Join the group: ${p.course.whatsappGroupUrl}` : ""}`
                              : `Hi ${p.student.name.split(" ")[0]}, about your Bioacademy payment for ${p.course.title}…`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#128c7e] hover:bg-muted dark:text-[#25d366]"
                        >
                          <WhatsAppIcon className="size-4" /> Message
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        {preview && (
          <DialogContent size="xl" title={`Payment proof — ${preview.student.name}`} description={`${preview.course.title} · ${formatEGP(preview.amount)} · ${preview.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash"}`}>
            {preview.proofUrl &&
              (preview.isPdf ? (
                <iframe src={preview.proofUrl} className="h-[70vh] w-full rounded-2xl border border-border" title="proof" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.proofUrl} alt="Payment proof" className="mx-auto max-h-[70vh] rounded-2xl" />
              ))}
            {preview.status === "PENDING" && (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setRejecting(preview); setReason(REASONS[0]!); setPreview(null); }}>
                  Reject
                </Button>
                <Button variant="success" loading={pending} onClick={() => exec(() => reviewEnrollmentAction(preview.id, "APPROVE"), { onSuccess: () => setPreview(null) })}>
                  <Check className="size-4" /> Approve
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        {rejecting && (
          <DialogContent title="Reject payment" description={`${rejecting.student.name} will see this reason and can resubmit.`}>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)} className={cn("w-full rounded-xl border-2 p-3 text-left text-sm transition", reason === r ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30" : "border-border hover:border-brand-300")}>
                  {r}
                </button>
              ))}
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="field-input mt-2 w-full rounded-xl border border-input bg-card p-3 text-sm outline-none" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejecting(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={pending} onClick={() => exec(() => reviewEnrollmentAction(rejecting.id, "REJECT", reason), { onSuccess: () => setRejecting(null) })}>
                <Clock className="hidden" /> Reject payment
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
