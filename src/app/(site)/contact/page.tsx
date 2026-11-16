import type { Metadata } from "next";
import { ExternalLink, Globe } from "lucide-react";
import { CentersSection, PageHero, TeamSection } from "@/components/site/sections";
import { SocialLinks } from "@/components/site/footer";
import { Reveal } from "@/components/ui/reveal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact & centers" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Let&apos;s <em className="text-ember-400">talk</em></>} description="Reach the Bioacademy team on WhatsApp, follow Dr. Mina on social media, or visit one of our centers." />
      <section className="py-14">
        <div className="container-x grid grid-cols-1 gap-5 md:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-7 text-white shadow-[0_8px_0_0_#07161e]">
              <div className="bg-grid absolute inset-0 opacity-30" />
              <div className="relative">
                <h2 className="text-xl font-extrabold">Follow Dr. Mina</h2>
                <p className="mt-1 text-sm text-brand-100/80">Tips, announcements and new batch dates are posted first on social media.</p>
                <SocialLinks social={s.social} className="mt-6" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft">
              <h2 className="text-xl font-extrabold">Official test websites</h2>
              <p className="mt-1 text-sm text-muted-foreground">Register for your exam and check dates on the official sites.</p>
              <div className="mt-5 grid gap-3">
                {[
                  ["ACT", s.testSites.act],
                  ["EST", s.testSites.est],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft">
                    <span className="flex items-center gap-3">
                      <Globe className="size-5 text-brand-500" />
                      <span>
                        <span className="block font-bold">🌐 {label} Website</span>
                        <span className="text-sm text-muted-foreground">{href!.replace(/^https?:\/\//, "")}</span>
                      </span>
                    </span>
                    <ExternalLink className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <TeamSection team={s.team} />
      <CentersSection centers={s.centers} />
    </>
  );
}
