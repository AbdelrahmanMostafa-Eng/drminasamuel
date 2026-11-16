"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  User,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/misc";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ThemeToggle } from "./theme-toggle";
import { SessionGuard } from "./session-guard";
import { logoutAction } from "@/actions/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  courses: BookOpen,
  schedule: CalendarDays,
  grades: ClipboardCheck,
  analytics: BarChart3,
  payments: CreditCard,
  wallet: Wallet,
  profile: User,
  students: Users,
  team: ShieldCheck,
  sessions: Video,
  reports: FileText,
  announcements: Megaphone,
  settings: Settings,
  activity: Activity,
  home: Home,
  graduation: GraduationCap,
};
export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName; badge?: number; exact?: boolean; section?: string };
export type ShellNotification = { id: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function NavLinks({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  let lastSection: string | undefined;
  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
        const header = item.section && item.section !== lastSection ? item.section : null;
        lastSection = item.section;
        return (
          <React.Fragment key={item.href}>
            {header && <p className="px-3 pb-1 pt-5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">{header}</p>}
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "text-white" : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 shadow-[0_3px_0_0_#123b4d,0_10px_20px_-10px_rgb(31_96_124/0.7)]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className={cn("relative size-[1.15rem] transition-transform duration-300 group-hover:scale-110", active ? "text-white" : "text-muted-foreground group-hover:text-brand-500")} />
              <span className="relative flex-1">{item.label}</span>
              {!!item.badge && (
                <span className={cn("relative min-w-5 rounded-full px-1.5 text-center text-[0.7rem] font-bold leading-5", active ? "bg-white/25 text-white" : "bg-ember-500 text-white shadow-[0_2px_0_0_#b94a07]")}>
                  {item.badge}
                </span>
              )}
            </Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function Bellmenu({ notifications, unread }: { notifications: ShellNotification[]; unread: number }) {
  const router = useRouter();
  const [count, setCount] = React.useState(unread);
  React.useEffect(() => setCount(unread), [unread]);
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground/80 transition hover:-translate-y-0.5 hover:text-foreground" aria-label="Notifications">
          <Bell className={cn("size-[1.1rem]", count > 0 && "origin-top animate-[wiggle_1.2s_ease-in-out_2]")} />
          {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-ember-500 px-1 text-[0.65rem] font-bold leading-5 text-white shadow-[0_2px_0_0_#b94a07]">{count > 9 ? "9+" : count}</span>}
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-bold">Notifications</p>
          {count > 0 && (
            <button
              className="text-xs font-semibold text-primary hover:underline"
              onClick={async () => {
                setCount(0);
                await markAllNotificationsRead();
                router.refresh();
              }}
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin p-1.5">
          {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up ✨</p>}
          {notifications.map((n) => (
            <DropdownItem
              key={n.id}
              className="items-start gap-3 py-2.5"
              onSelect={() => {
                if (!n.readAt) markNotificationRead(n.id);
                if (n.link) router.push(n.link);
              }}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-ember-500")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-foreground">{n.title}</span>
                {n.body && <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-muted-foreground">{n.body}</span>}
                <span className="mt-1 block text-[0.68rem] font-medium text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </span>
            </DropdownItem>
          ))}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

export function AppShell({
  nav,
  user,
  notifications,
  unread,
  children,
  roleLabel,
  profileHref,
}: {
  nav: NavItem[];
  user: { name: string; email: string | null; avatar: string | null };
  notifications: ShellNotification[];
  unread: number;
  children: React.ReactNode;
  roleLabel: string;
  profileHref: string;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Logo href="/" />
      </div>
      <div className="mx-3 mb-2 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-3.5 text-white shadow-[0_4px_0_0_#0b222e]">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatar} size={38} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ember-300">{roleLabel}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
        <NavLinks nav={nav} onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-border p-3">
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/70 transition hover:bg-red-50 hover:text-danger dark:hover:bg-red-950/30">
            <LogOut className="size-[1.15rem]" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <SessionGuard />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-border bg-card lg:block">{sidebar}</aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-brand-950/50 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[19rem] max-w-[85vw] border-r border-border bg-card shadow-2xl lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <button onClick={() => setOpen(false)} className="absolute right-3 top-3.5 grid size-9 place-items-center rounded-xl hover:bg-muted" aria-label="Close menu">
                <X className="size-5" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="min-w-0 lg:pl-68">
        <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-border bg-card lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo compact href="/" />
          </div>
          <div className="flex-1" />
          <ThemeToggle />
          <Bellmenu notifications={notifications} unread={unread} />
          <Dropdown>
            <DropdownTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-border bg-card py-1 pl-1 pr-2.5 transition hover:-translate-y-0.5">
                <Avatar name={user.name} src={user.avatar} size={32} />
                <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{user.name.split(" ")[0]}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownLabel>{roleLabel}</DropdownLabel>
              <div className="px-3 pb-2">
                <p className="truncate text-sm font-bold">{user.name}</p>
                {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
              </div>
              <DropdownSeparator />
              <Link href={profileHref}>
                <DropdownItem>
                  <User /> Profile & security
                </DropdownItem>
              </Link>
              <Link href="/">
                <DropdownItem>
                  <Home /> Website home
                </DropdownItem>
              </Link>
              <DropdownSeparator />
              <DropdownItem danger onSelect={() => logoutAction()}>
                <LogOut /> Sign out
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </header>
        <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }} className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}
