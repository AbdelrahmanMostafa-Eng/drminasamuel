"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewer } from "./viewer";
import { RollText } from "./roll-text";

const NAV_ALL = [
  { href: "/courses", label: "Courses" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/schedule", label: "Schedule" },
  { href: "/#about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/brand/logo-mark.png" alt="" width={30} height={28} className="h-7 w-auto dark:invert" priority />
      <span className="text-[1.05rem] font-semibold tracking-tight text-foreground">Bioacademy</span>
    </span>
  );
}

/** Two lines that turn into a cross. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <span className={cn("absolute left-0 h-[1.5px] w-5 bg-foreground transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0")} />
      <span className={cn("absolute left-0 h-[1.5px] bg-foreground transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]", open ? "top-1/2 w-5 -translate-y-1/2 -rotate-45" : "bottom-0 w-3.5")} />
    </span>
  );
}

/** Header from the portfolio template: transparent at the top, frosted bar with a hairline once scrolled. */
export function Header({ showPricing = true }: { showPricing?: boolean }) {
  const pathname = usePathname();
  const { viewer: user, ready } = useViewer();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const nav = NAV_ALL.filter((n) => showPricing || n.href !== "/#pricing").map((n, i) => ({ ...n, n: String(i + 1).padStart(2, "0") }));

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cta = user
    ? { href: user.role === "STUDENT" ? "/dashboard" : "/admin", label: user.role === "STUDENT" ? "My dashboard" : "Admin" }
    : { href: "/register", label: "Create account" };
  const close = () => setOpen(false);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300",
          open ? "border-b border-transparent bg-background" : scrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <nav className="flex h-16 items-center justify-between md:h-20">
            <Link href="/" aria-label="Bioacademy home" onClick={close}>
              <Wordmark />
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              {nav.map((item) => {
                const active = !item.href.includes("#") && pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn("text-sm transition-colors hover:text-foreground", active ? "text-foreground" : "text-muted-foreground")}>
                    <RollText>{item.label}</RollText>
                    <span className="ml-1 text-xs opacity-50">({item.n})</span>
                  </Link>
                );
              })}
            </div>
            <div className={cn("hidden items-center gap-5 transition-opacity duration-300 md:flex", ready ? "opacity-100" : "opacity-0")}>
              {!user && (
                <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <RollText>Sign in</RollText>
                </Link>
              )}
              <Link href={cta.href} className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-[opacity,transform] duration-300 hover:opacity-90 active:scale-[0.98]">
                <RollText>{cta.label}</RollText>
              </Link>
            </div>
            <button onClick={() => setOpen((o) => !o)} className="-mr-2 grid size-10 place-items-center md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
              <MenuIcon open={open} />
            </button>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            className="fixed inset-0 z-40 bg-background md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)", transition: { duration: 0.6, ease: EASE } }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.45, ease: EASE, delay: 0.1 } }}
          >
            <div className="flex h-full flex-col px-6 pb-8 pt-24">
              <nav className="flex flex-col gap-5">
                {[{ href: "/", label: "Home", n: "00" }, ...nav].map((item, i) => (
                  <div key={item.href} className="overflow-hidden">
                    <motion.div
                      initial={{ y: "110%" }}
                      animate={{ y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.12 + i * 0.06 } }}
                      exit={{ y: "110%", transition: { duration: 0.3, ease: EASE } }}
                    >
                      <Link href={item.href} onClick={close} className="flex items-baseline gap-3 text-3xl font-light tracking-tight transition-colors hover:text-muted-foreground">
                        <span className="font-mono text-xs text-muted-foreground">{item.n}</span>
                        {item.label}
                      </Link>
                    </motion.div>
                  </div>
                ))}
              </nav>
              <motion.div
                className={cn("mt-auto flex flex-col gap-3", !ready && "invisible")}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.45 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                {!user && (
                  <Link href="/login" onClick={close} className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-3 text-base font-medium">
                    Sign in
                  </Link>
                )}
                <Link href={cta.href} onClick={close} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background">
                  {cta.label} <ArrowUpRight className="size-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
