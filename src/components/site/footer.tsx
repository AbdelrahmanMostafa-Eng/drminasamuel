import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "@/components/brand/social-icons";
import type { SiteSettings } from "@/lib/settings";
import { formatPhone, waLink } from "@/lib/utils";

export function SocialLinks({ social, className = "" }: { social: SiteSettings["social"]; className?: string }) {
  const items = [
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon, hover: "hover:bg-[#1877f2]" },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon, hover: "hover:bg-gradient-to-tr hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af]" },
    { href: social.tiktok, label: "TikTok", Icon: TikTokIcon, hover: "hover:bg-black" },
    { href: social.youtube, label: "YouTube", Icon: YouTubeIcon, hover: "hover:bg-[#ff0000]" },
  ].filter((i) => i.href);
  return (
    <div className={`flex gap-2.5 ${className}`}>
      {items.map(({ href, label, Icon, hover }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 shadow-[0_3px_0_0_rgb(0_0_0/0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:text-white ${hover}`}
        >
          <Icon className="size-5" />
        </a>
      ))}
    </div>
  );
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-brand-950 text-white">
      <div className="bg-grid absolute inset-0 opacity-30" />
      <div className="absolute -top-40 left-1/4 size-[30rem] rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute -bottom-40 right-0 size-[26rem] rounded-full bg-ember-500/10 blur-3xl" />
      <div className="container-x relative py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-100/70">
              Specialized ACT2 & EST Biology courses for American Diploma students — built on comprehensive understanding and effective exam strategies.
            </p>
            <SocialLinks social={settings.social} className="mt-6" />
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-400">Explore</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-brand-100/75">
                {[
                  ["Courses", "/courses"],
                  ["Session schedule", "/schedule"],
                  ["About Dr. Mina", "/#about"],
                  ["Contact & centers", "/contact"],
                  ["Create account", "/register"],
                  ["Student sign in", "/login"],
                ].map(([l, h]) => (
                  <li key={h}>
                    <Link href={h!} className="transition hover:text-white">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
              <h4 className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-ember-400">Official test websites</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-brand-100/75">
                <li>
                  <a href={settings.testSites.act} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-white">
                    🌐 ACT — {settings.testSites.act.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
                  </a>
                </li>
                <li>
                  <a href={settings.testSites.est} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-white">
                    🌐 EST — {settings.testSites.est.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-400">Center locations</h4>
              <ul className="mt-4 space-y-3">
                {settings.centers.map((c) => (
                  <li key={c.name}>
                    <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="group flex gap-2.5 text-sm">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-ember-400 transition group-hover:-translate-y-0.5" />
                      <span>
                        <span className="block font-semibold text-white">{c.name}</span>
                        <span className="text-brand-100/65 group-hover:text-white">{c.area} · Open in Maps</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-400">Team contacts</h4>
              <ul className="mt-4 space-y-2">
                {settings.team.map((t) => (
                  <li key={t.phone}>
                    <a href={waLink(t.phone)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5 text-sm">
                      <WhatsAppIcon className="size-4 shrink-0 text-[#25d366] transition group-hover:scale-110" />
                      <span className="font-semibold text-white">{t.name}</span>
                      <span className="truncate text-xs text-brand-100/55 group-hover:text-brand-100">{formatPhone(t.phone)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-brand-100/55 sm:flex-row">
          <p>© {year} Bioacademy · Dr. Mina Samuel. All rights reserved.</p>
          <p>ACT® and EST are trademarks of their respective owners. Bioacademy is an independent preparation program.</p>
        </div>
      </div>
    </footer>
  );
}
