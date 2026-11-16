import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/auth/password-form";
import { Logo } from "@/components/brand/logo";

export default async function ForcedPasswordPage() {
  const user = await requireUser();
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-5">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lift">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">Set a new password</h1>
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
