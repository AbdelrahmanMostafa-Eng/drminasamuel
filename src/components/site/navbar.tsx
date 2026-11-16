"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/schedule", label: "Schedule" },
  { href: "/#about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ user }: { user: { name: string; role: string } | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const overlay = pathname === "/" && !scrolled;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => setOpen(false), [pathname]);

  const dashHref = user ? (user.role === "STUDENT" ? "/dashboard" : "/admin") : "/login";

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
        className={cn(
          "container-x flex h-16 items-center justify-between rounded-2xl border transition-all duration-500",
          overlay ? "border-transparent bg-transparent" : "glass border-border/70 shadow-soft",
        )}
      >
        <Logo light={overlay} />
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href) && !l.href.includes("#");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                  overlay ? "text-white/80 hover:text-white" : "text-foreground/70 hover:text-foreground",
                  active && (overlay ? "text-white" : "text-foreground"),
                )}
              >
                {active && <motion.span layoutId="nav-pill" className={cn("absolute inset-0 rounded-xl", overlay ? "bg-white/10" : "bg-muted")} />}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className={cn("hidden sm:grid", overlay && "border-white/15 bg-white/5 text-white")} />
          {user ? (
            <ButtonLink href={dashHref} size="sm" variant="accent" className="hidden sm:inline-flex">
              <LayoutDashboard className="size-4" /> {user.role === "STUDENT" ? "My dashboard" : "Admin"}
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className={cn("hidden rounded-xl px-3 py-2 text-sm font-semibold sm:block", overlay ? "text-white/85 hover:text-white" : "text-foreground/75 hover:text-foreground")}>
                Sign in
              </Link>
              <ButtonLink href="/register" size="sm" variant="accent" className="hidden sm:inline-flex">
                Create account
              </ButtonLink>
            </>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn("grid size-10 place-items-center rounded-xl border lg:hidden", overlay ? "border-white/20 text-white" : "border-border bg-card")}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="container-x glass mt-2 rounded-2xl border border-border p-3 shadow-lift lg:hidden"
          >
            {links.map((l, i) => (
              <motion.div key={l.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={l.href} className="block rounded-xl px-4 py-3 text-[0.95rem] font-semibold hover:bg-muted">
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
              <ThemeToggle />
              {user ? (
                <ButtonLink href={dashHref} className="flex-1" variant="accent">
                  <LayoutDashboard className="size-4" /> Open dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/login" variant="secondary" className="flex-1">
                    Sign in
                  </ButtonLink>
                  <ButtonLink href="/register" variant="accent" className="flex-1">
                    Create account
                  </ButtonLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
