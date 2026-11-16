import { redirect } from "next/navigation";
import { AppShell, type NavItem } from "@/components/app/shell";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { shellNotifications } from "@/lib/shell-data";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  if (user.mustChangePassword) redirect("/account/password?forced=1");
  const [{ notifications, unread }, pending] = await Promise.all([
    shellNotifications(user.id),
    can(user, "payments") ? db.enrollment.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
  ]);
  const master = user.role === "MASTER";
  const all: (NavItem & { show: boolean })[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true, section: "Overview", show: true },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics", section: "Overview", show: can(user, "analytics") },
    { href: "/admin/courses", label: "Courses & content", icon: "courses", section: "Teaching", show: can(user, "courses") || can(user, "content") || can(user, "assessments") || can(user, "grades") },
    { href: "/admin/schedule", label: "Sessions & schedule", icon: "sessions", section: "Teaching", show: can(user, "sessions") || can(user, "attendance") },
    { href: "/admin/announcements", label: "Announcements", icon: "announcements", section: "Teaching", show: can(user, "announcements") },
    { href: "/admin/payments", label: "Payments", icon: "payments", section: "Students", badge: pending, show: can(user, "payments") },
    { href: "/admin/students", label: "Students", icon: "students", section: "Students", show: can(user, "students") || can(user, "payments") },
    { href: "/admin/reports", label: "PDF reports", icon: "reports", section: "Students", show: can(user, "reports") },
    { href: "/admin/team", label: "Team & permissions", icon: "team", section: "Administration", show: master },
    { href: "/admin/settings", label: "Website settings", icon: "settings", section: "Administration", show: master },
    { href: "/admin/activity", label: "Activity log", icon: "activity", section: "Administration", show: master },
    { href: "/admin/profile", label: "My profile", icon: "profile", section: master ? "Administration" : "Account", show: true },
  ];
  const nav = all.filter((n) => n.show).map(({ show: _s, ...n }) => n);
  return (
    <AppShell
      nav={nav}
      user={{ name: user.fullName, email: user.username ? `@${user.username}` : user.email, avatar: fileUrl(user.avatarKey) }}
      notifications={notifications}
      unread={unread}
      roleLabel={master ? "Master admin" : "Assistant"}
      profileHref="/admin/profile"
    >
      {children}
    </AppShell>
  );
}
