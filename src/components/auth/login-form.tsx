"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AtSign, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [shake, setShake] = React.useState(0);
  return (
    <motion.form
      animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
      key={shake}
      transition={{ duration: 0.4 }}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await loginAction({ identifier: String(f.get("identifier")), password: String(f.get("password")), next });
          if (res && !res.ok) {
            setError(res.error);
            setShake((s) => s + 1);
            toast.error(res.error);
          }
        });
      }}
      className="space-y-4"
    >
      <Field name="identifier" label="Email, WhatsApp number or username" icon={<AtSign />} autoComplete="username" required autoFocus />
      <Field name="password" type="password" label="Password" icon={<KeyRound />} autoComplete="current-password" required />
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger dark:border-red-900 dark:bg-red-950/40">{error}</p>}
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full rounded-full" loading={pending}>
        Sign in
      </Button>
    </motion.form>
  );
}
