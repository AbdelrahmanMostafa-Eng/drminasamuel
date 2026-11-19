import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "./header";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "@/components/brand/social-icons";
import type { SiteSettings } from "@/lib/settings";
import { formatPhone, waLink } from "@/lib/utils";

export function SocialLinks({ social, className = "" }: { social: SiteSettings["social"]; className?: string }) {
  const items = [
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: social.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((i) => i.href);
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="grid size-9 place-items-center rounded-full bg-foreground/[0.05] text-brand-600 transition-colors hover:bg-brand-600/10"
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/schedule", label: "Schedule" },
  { href: "/#about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Student sign in" },
];

/** Footer layout from the portfolio template, filled with Bioacademy's own links. */
export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const phone = settings.teacherPhone || settings.team[0]?.phone;
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-12 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Link href="/" aria-label="Bioacademy home">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              ACT2 &amp; EST Biology with Dr. Mina Samuel — comprehensive understanding and effective preparation strategies for American Diploma students.
            </p>
            <SocialLinks social={settings.social} className="mt-6" />
            {phone && (
              <a href={waLink(phone)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <WhatsAppIcon className="size-4" /> {formatPhone(phone)}
              </a>
            )}
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-4 text-sm font-semibold">Pages</h4>
            <ul className="space-y-3">
              {PAGES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-4 text-sm font-semibold">Center locations</h4>
            <ul className="space-y-4">
              {settings.centers.map((c) => (
                <li key={c.name}>
                  <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="group block text-sm">
                    <span className="block text-foreground">{c.name}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
                      {c.area} <ArrowUpRight className="size-3" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-4 text-sm font-semibold">Official test websites</h4>
            <ul className="space-y-3">
              {[
                ["ACT", settings.testSites.act],
                ["EST", settings.testSites.est],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label} — {href!.replace(/^https?:\/\//, "")} <ArrowUpRight className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">© {year} Bioacademy · Dr. Mina Samuel. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">ACT® and EST are trademarks of their respective owners.</p>
        </div>
      </div>
    </footer>
  );
}
