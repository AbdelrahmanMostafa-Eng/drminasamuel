import { redirect } from "next/navigation";
import { AppShell, type NavItem } from "@/components/app/shell";
import { requireStudent } from "@/lib/auth";
import { shellNotifications } from "@/lib/shell-data";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  if (user.mustChangePassword) redirect("/account/password?forced=1");
  const [{ notifications, unread }, rejected] = await Promise.all([
    shellNotifications(user.id),
    db.enrollment.count({ where: { userId: user.id, status: "REJECTED" } }),
  ]);
  const nav: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "dashboard", exact: true },
    { href: "/dashboard/courses", label: "My courses", icon: "courses" },
    { href: "/dashboard/schedule", label: "Schedule", icon: "schedule" },
    { href: "/dashboard/grades", label: "Grades", icon: "grades" },
    { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
    { href: "/dashboard/payments", label: "Payments", icon: "wallet", badge: rejected },
    { href: "/dashboard/profile", label: "Profile", icon: "profile" },
  ];
  return (
    <AppShell
      nav={nav}
      user={{ name: user.fullName, email: user.email, avatar: fileUrl(user.avatarKey) }}
      notifications={notifications}
      unread={unread}
      roleLabel="Student"
      profileHref="/dashboard/profile"
    >
      {children}
    </AppShell>
  );
}
