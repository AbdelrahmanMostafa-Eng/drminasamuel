import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MonitorSmartphone, ShieldAlert } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { FadeIn } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "Sign in" };

const REASONS: Record<string, string> = {
  NEW_DEVICE: "You were signed out because your account was signed in on another device. Each account can be used on one device at a time.",
  ADMIN: "Your session was ended by an administrator.",
  SUSPENDED: "This account has been suspended. Please contact the team on WhatsApp.",
  PASSWORD_CHANGED: "Your password was changed. Please sign in with the new one.",
  EXPIRED: "Your session expired. Please sign in again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "STUDENT" ? "/dashboard" : "/admin");
  const reason = sp.reason ? REASONS[sp.reason] : null;
  return (
    <FadeIn>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Sign in to continue your Biology journey.</p>
      {reason && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-ember-200 bg-ember-50 p-4 text-sm text-ember-800 dark:border-ember-800/50 dark:bg-ember-900/20 dark:text-ember-200">
          {sp.reason === "NEW_DEVICE" ? <MonitorSmartphone className="size-5 shrink-0" /> : <ShieldAlert className="size-5 shrink-0" />}
          <p>{reason}</p>
        </div>
      )}
      <div className="mt-8">
        <LoginForm next={sp.next} />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Bioacademy?{" "}
        <Link href={`/register${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`} className="font-semibold text-primary hover:underline">
          Create a student account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted-foreground">Assistants sign in with the username created by Dr. Mina.</p>
    </FadeIn>
  );
}
