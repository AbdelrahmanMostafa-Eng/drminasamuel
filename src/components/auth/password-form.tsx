"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/actions/auth";

export function PasswordForm({ forced }: { forced?: boolean }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
        start(async () => {
          const res = await changePasswordAction({ current: f.current, password: f.password ?? "", confirm: f.confirm ?? "" });
          if (!res.ok) return void toast.error(res.error);
          toast.success("Password updated");
          form.reset();
          if (forced && res.data) router.push(res.data);
        });
      }}
      className="space-y-4"
    >
      {!forced && <Field name="current" type="password" label="Current password" icon={<KeyRound />} required autoComplete="current-password" />}
      <Field name="password" type="password" label="New password" icon={<KeyRound />} required minLength={8} autoComplete="new-password" />
      <Field name="confirm" type="password" label="Confirm new password" icon={<KeyRound />} required autoComplete="new-password" />
      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Update password
      </Button>
    </form>
  );
}
