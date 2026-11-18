"use client";

import * as React from "react";
import Link from "next/link";
import { AtSign, KeyRound, Phone, School, User } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { registerAction } from "@/actions/auth";

export function RegisterForm({ next }: { next?: string }) {
  const [pending, start] = React.useTransition();
  const [agree, setAgree] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!agree) {
          toast.error("Please confirm the account rules first.");
          return;
        }
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        setError(null);
        start(async () => {
          const res = await registerAction({ ...f, fullName: f.fullName ?? "", whatsapp: f.whatsapp ?? "", email: f.email ?? "", password: f.password ?? "", confirm: f.confirm ?? "", next });
          if (res && !res.ok) {
            setError(res.error);
            toast.error(res.error);
          }
        });
      }}
      className="space-y-4"
    >
      <Field name="fullName" label="Full name (in English)" icon={<User />} autoComplete="name" required hint="As you'd like it to appear on grade & attendance reports." />
      <Field name="whatsapp" type="tel" label="WhatsApp number" icon={<WhatsAppIcon />} autoComplete="tel" required hint="Used to add you to the course WhatsApp group." />
      <Field name="email" type="email" label="Email" icon={<AtSign />} autoComplete="email" required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="parentPhone" type="tel" label="Parent's number (optional)" icon={<Phone />} />
        <Field name="school" label="School (optional)" icon={<School />} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="password" type="password" label="Password" icon={<KeyRound />} autoComplete="new-password" required minLength={8} />
        <Field name="confirm" type="password" label="Confirm password" icon={<KeyRound />} autoComplete="new-password" required />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Checkbox
          checked={agree}
          onChange={setAgree}
          label="I understand the account rules"
          description="My account works on one device at a time, it's personal and can't be shared, and it's removed when my course ends."
        />
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger dark:border-red-900 dark:bg-red-950/40">{error}</p>}
      <Button type="submit" size="lg" className="w-full rounded-full" loading={pending}>
        Create my account
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">
          Sign in
        </Link>
      </p>
    </form>
  );
}
