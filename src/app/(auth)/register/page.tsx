import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth";
import { FadeIn } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "STUDENT" ? "/dashboard" : "/admin");
  return (
    <FadeIn>
      <h1 className="font-display text-4xl font-light tracking-tight">Create your account</h1>
      <p className="mt-2 text-muted-foreground">Create your account, then enroll in the course you want.</p>
      <div className="mt-8">
        <RegisterForm next={sp.next} />
      </div>
    </FadeIn>
  );
}
