import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/auth/password-form";
import { Wordmark } from "@/components/site/header";

export default async function ForcedPasswordPage() {
  const user = await requireUser();
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <Wordmark />
        <h1 className="mt-8 font-display text-3xl font-light tracking-tight">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Hi {user.fullName.split(" ")[0]} — you signed in with a temporary password. Please choose your own password to continue.
        </p>
        <div className="mt-6">
          <PasswordForm forced />
        </div>
      </div>
    </div>
  );
}
