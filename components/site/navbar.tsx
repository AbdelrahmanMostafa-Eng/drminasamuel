"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { MenuIcon, MoonIcon, SunIcon, ArrowRightIcon, LayoutDashboardIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About Dr. Mina" },
]

export function Navbar() {
  const pathname = usePathname()
  const { currentUser, hydrated } = useStore()
  const { resolvedTheme, setTheme } = useTheme()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24))

  const portalHref = currentUser ? (currentUser.role === "student" ? "/student" : "/admin") : "/login"

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        aria-label="Main"
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
          scrolled ? "glass depth-shadow" : "bg-transparent",
        )}
      >
        <Logo size={36} />

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="dark:hidden" />
            <MoonIcon className="hidden dark:block" />
          </Button>
          <Button asChild className="hidden md:inline-flex">
            <Link href={portalHref}>
              {hydrated && currentUser ? (
                <>
                  <LayoutDashboardIcon data-icon="inline-start" />
                  My portal
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon data-icon="inline-end" />
                </>
              )}
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>
                  <Logo size={32} href={null} />
                </SheetTitle>
              </SheetHeader>
              <ul className="flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-muted"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto px-4 pb-4">
                <Button asChild className="w-full">
                  <Link href={portalHref} onClick={() => setOpen(false)}>
                    {currentUser ? "Open my portal" : "Sign in"}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  )
}
