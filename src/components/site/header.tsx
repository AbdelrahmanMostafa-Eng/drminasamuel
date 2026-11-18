"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewer } from "./viewer";

const NAV = [
  { href: "/courses", label: "Courses", n: "01" },
  { href: "/#pricing", label: "Pricing", n: "02" },
  { href: "/schedule", label: "Schedule", n: "03" },
  { href: "/#about", label: "About", n: "04" },
  { href: "/contact", label: "Contact", n: "05" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/brand/logo-mark.png" alt="" width={30} height={28} className="h-7 w-auto dark:invert" priority />
      <span className="text-[1.05rem] font-semibold tracking-tight text-foreground">Bioacademy</span>
    </span>
  );
}

/** Header from the portfolio template: transparent at the top, frosted bar with a hairline once scrolled. */
export function Header() {
  const pathname = usePathname();
  const { viewer: user, ready } = useViewer();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const cta = user
    ? { href: user.role === "STUDENT" ? "/dashboard" : "/admin", label: user.role === "STUDENT" ? "My dashboard" : "Admin" }
    : { href: "/register", label: "Create account" };

  return (
    <>
      <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "bg-transparent")}>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <nav className="flex h-16 items-center justify-between md:h-20">
            <Link href="/" aria-label="Bioacademy home">
              <Wordmark />
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              {NAV.map((item) => {
                const active = !item.href.includes("#") && pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn("text-sm transition-colors hover:text-foreground", active ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                    <span className="ml-1 text-xs opacity-50">({item.n})</span>
                  </Link>
                );
              })}
            </div>
            <div className={cn("hidden items-center gap-5 transition-opacity duration-300 md:flex", ready ? "opacity-100" : "opacity-0")}>
              {!user && (
                <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Sign in
                </Link>
              )}
              <Link href={cta.href} className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85">
                {cta.label}
              </Link>
            </div>
            <button onClick={() => setOpen(true)} className="-mr-2 p-2 md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] bg-background md:hidden">
          <div className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <Link href="/" aria-label="Bioacademy home">
                <Wordmark />
              </Link>
              <button onClick={() => setOpen(false)} className="-mr-2 p-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-6">
              {[{ href: "/", label: "Home", n: "00" }, ...NAV].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-baseline gap-3 text-3xl font-semibold tracking-tight transition-colors hover:text-muted-foreground">
                  <span className="font-mono text-xs font-normal text-muted-foreground">{item.n}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className={cn("mt-auto flex flex-col gap-3 transition-opacity", ready ? "opacity-100" : "opacity-0")}>
              {!user && (
                <Link href="/login" className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-3 text-base font-medium">
                  Sign in
                </Link>
              )}
              <Link href={cta.href} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-base font-medium text-background">
                {cta.label} <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
