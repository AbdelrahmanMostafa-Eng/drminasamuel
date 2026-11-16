"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ExternalLink, Hash, Phone, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { ChoiceCard } from "@/components/ui/checkbox";
import { Field, TextArea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/misc";
import { FileDrop } from "@/components/ui/file-upload";
import { submitEnrollmentAction } from "@/actions/student";
import { cn, formatEGP } from "@/lib/utils";

type Pay = { instapayHandle: string; instapayPhone: string; instapayLink: string; vodafoneCashNumber: string; accountName: string; instructions: string };

export function EnrollForm({ courseId, price, payment }: { courseId: string; price: number; payment: Pay }) {
  const router = useRouter();
  const [method, setMethod] = React.useState<"INSTAPAY" | "VODAFONE_CASH">(payment.instapayHandle || payment.instapayPhone ? "INSTAPAY" : "VODAFONE_CASH");
  const [proofKey, setProofKey] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const vf = payment.vodafoneCashNumber.replace(/[^\d]/g, "").replace(/^20/, "0");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!proofKey) return void toast.error("Please upload your payment screenshot first.");
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        start(async () => {
          const r = await submitEnrollmentAction({ courseId, method, proofKey, senderNumber: f.senderNumber, reference: f.reference, note: f.note });
          if (!r.ok) return void toast.error(r.error);
          toast.success("Payment submitted! We'll review it shortly.");
          router.refresh();
        });
      }}
      className="space-y-8"
    >
      <section>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-xs text-white">1</span> Choose how you paid
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChoiceCard selected={method === "INSTAPAY"} onSelect={() => setMethod("INSTAPAY")}>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#6a2c91] to-[#3b1257] text-sm font-black text-white shadow-[0_3px_0_0_#24093a]">IP</span>
              <div>
                <p className="font-bold">InstaPay</p>
                <p className="text-xs text-muted-foreground">Instant bank transfer</p>
              </div>
            </div>
          </ChoiceCard>
          <ChoiceCard selected={method === "VODAFONE_CASH"} onSelect={() => setMethod("VODAFONE_CASH")}>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#e60000] to-[#9e0000] text-white shadow-[0_3px_0_0_#6b0000]">
                <Smartphone className="size-5" />
              </span>
              <div>
                <p className="font-bold">Vodafone Cash</p>
                <p className="text-xs text-muted-foreground">Mobile wallet transfer</p>
              </div>
            </div>
          </ChoiceCard>
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-xs text-white">2</span> Transfer exactly {formatEGP(price)}
        </h3>
        <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-border bg-muted/40 p-5">
          {method === "INSTAPAY" ? (
            <div className="space-y-3">
              {payment.instapayHandle && (
                <Row label="InstaPay address" value={payment.instapayHandle} />
              )}
              {payment.instapayPhone && <Row label="InstaPay mobile number" value={payment.instapayPhone} />}
              {!payment.instapayHandle && !payment.instapayPhone && <p className="text-sm text-muted-foreground">InstaPay details will be added soon — please contact an assistant on WhatsApp.</p>}
              {payment.instapayLink && (
                <a href={payment.instapayLink} target="_blank" rel="noopener noreferrer" className="btn-3d inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-[#7b35a6] to-[#4a1870] px-4 text-sm font-semibold text-white shadow-[0_3px_0_0_#24093a]">
                  Open InstaPay payment link <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {payment.vodafoneCashNumber ? (
                <>
                  <Row label="Vodafone Cash number" value={payment.vodafoneCashNumber} />
                  <a
                    href={`tel:*9*7*${vf}*${price}%23`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-3.5" /> Quick dial: *9*7*{vf}*{price}#
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Vodafone Cash details will be added soon — please contact an assistant on WhatsApp.</p>
              )}
            </div>
          )}
          {payment.accountName && <p className="mt-4 text-xs text-muted-foreground">Account name: <span className="font-semibold text-foreground">{payment.accountName}</span></p>}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{payment.instructions}</p>
        </motion.div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-xs text-white">3</span> Upload the payment screenshot
        </h3>
        <FileDrop
          className="mt-4"
          purpose="payment-proof"
          accept="image/*,application/pdf"
          preview
          label="Drop your screenshot here or tap to choose"
          hint="PNG, JPG or PDF · up to 10 MB · make sure the amount and date are visible"
          onUploaded={(f) => setProofKey(f.key)}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="senderNumber" label={method === "INSTAPAY" ? "Your InstaPay number / address" : "Wallet number you paid from"} icon={<Phone />} hint="Helps us match your transfer faster" />
          <Field name="reference" label="Transaction reference (optional)" icon={<Hash />} />
        </div>
        <TextArea name="note" label="Note to the team (optional)" rows={3} containerClassName="mt-4" />
      </section>

      <Button type="submit" size="lg" variant="accent" loading={pending} disabled={!proofKey} className={cn("w-full sm:w-auto")}>
        <Send className="size-4" /> Submit for review
      </Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-bold tracking-wide">{value}</p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}
