import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { FadeIn } from "@/components/ui/reveal";
import { getSettings } from "@/lib/settings";
import { formatPhone, waLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Forgot password" };
export const dynamic = "force-dynamic";

export default async function ForgotPage() {
  const s = await getSettings();
  return (
    <FadeIn>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-muted-foreground">
        Message any assistant on WhatsApp from your registered number. They&apos;ll verify you and send a temporary password — you&apos;ll set a new one when you sign in.
      </p>
      <div className="mt-8 grid gap-2.5">
        {s.team.map((t) => (
          <a
            key={t.phone}
            href={waLink(t.phone, "Hi! I forgot my Bioacademy password. Could you please reset it? My registered WhatsApp number is: ")}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft transition hover:-translate-y-0.5 hover:border-[#25d366]/60"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#25d366] to-[#128c7e] text-white shadow-[0_3px_0_0_#0b5e55]">
              <WhatsAppIcon className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">{t.name}</span>
              <span className="text-sm text-muted-foreground">{formatPhone(t.phone)}</span>
            </span>
            <span className="text-sm font-semibold text-[#128c7e] opacity-0 transition group-hover:opacity-100 dark:text-[#25d366]">Chat →</span>
          </a>
        ))}
      </div>
    </FadeIn>
  );
}
