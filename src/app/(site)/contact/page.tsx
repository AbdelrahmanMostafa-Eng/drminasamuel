import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { CentersSection, PageHero, TeamSection } from "@/components/site/sections";
import { SocialLinks } from "@/components/site/footer";
import { SpotlightCard } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact & centers" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's talk." description="Reach the Bioacademy team on WhatsApp, follow Dr. Mina on social media, or visit one of the centers." />
      <section className="px-6 pb-8 pt-12 md:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2">
          <Reveal>
            <SpotlightCard className="h-full rounded-2xl border border-border bg-card p-8">
              <p className="eyebrow">Follow Dr. Mina</p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Tips, announcements and new batch dates are posted first on social media.</p>
              <SocialLinks social={s.social} className="mt-8" />
            </SpotlightCard>
          </Reveal>
          <Reveal delay={0.06}>
            <SpotlightCard className="h-full rounded-2xl border border-border bg-card p-8">
              <p className="eyebrow">Official test websites</p>
              <div className="mt-4 divide-y divide-border">
                {[
                  ["ACT", s.testSites.act],
                  ["EST", s.testSites.est],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between py-4">
                    <span>
                      <span className="block">{label} website</span>
                      <span className="font-mono text-xs text-muted-foreground">{href!.replace(/^https?:\/\//, "")}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </a>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>
      <TeamSection team={s.team} />
      <CentersSection centers={s.centers} />
    </>
  );
}
