import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="relative border-t bg-card/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo size={40} />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A focused biology academy built around live teaching, structured practice, and real follow-up. Designed for
              Egyptian students who want mastery, not memorisation.
            </p>
          </div>
          <FooterColumn
            title="Learn"
            links={[
              { href: "/courses", label: "All courses" },
              { href: "/courses/biology-basics", label: "Biology Basics" },
              { href: "/courses/advanced-biology", label: "Advanced Biology" },
            ]}
          />
          <FooterColumn
            title="Academy"
            links={[
              { href: "/about", label: "About Dr. Mina" },
              { href: "/login", label: "Student login" },
              { href: "/signup", label: "Create account" },
            ]}
          />
          <FooterColumn
            title="Support"
            links={[
              { href: "https://wa.me/201000000000", label: "WhatsApp support", external: true },
              { href: "/reset-password", label: "Forgot password" },
            ]}
          />
        </div>
        <Separator />
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Bioacademy · Dr. Mina Samuel. All rights reserved.</p>
          <p>Payments secured via Paymob and Kashier · InstaPay · Vodafone Cash</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string; external?: boolean }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer" : undefined}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
