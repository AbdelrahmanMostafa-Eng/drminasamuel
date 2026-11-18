import { AboutSection, CentersSection, CtaBand, FaqSection, Features, Hero, HowItWorks, PricingSection, SchedulePreview, Section, SectionHead, TeamSection, TopicMarquee } from "@/components/site/sections";
import { StackingCourses } from "@/components/site/stacking-courses";
import { getSettings } from "@/lib/settings";
import { getPublicCourses, getUpcomingPublicSessions } from "@/lib/queries";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Served from cache and refreshed at most every minute (and right away when staff edit content). */
export const revalidate = 60;

export default async function HomePage() {
  const [settings, courses] = await Promise.all([getSettings(), getPublicCourses()]);
  const sessions = settings.showPublicSchedule ? await getUpcomingPublicSessions(5) : [];
  const open = courses.filter((c) => c.status === "PUBLISHED").sort((a, b) => (a.level === b.level ? 0 : a.level === "BASICS" ? -1 : 1));
  return (
    <>
      <Hero hero={settings.hero} stats={settings.stats} />
      <TopicMarquee />
      <AboutSection about={settings.about} stats={settings.stats} />
      <Section id="courses" gradientBar>
        <SectionHead
          tag="Courses"
          title={<>Basics first.<br />Then Advanced.</>}
          description="Each course is enrolled and paid for separately. Basics builds the foundation; Advanced opens near the end of Basics and takes you to exam level."
        />
        {open.length ? <StackingCourses courses={open} /> : <p className="text-muted-foreground">New courses will be announced soon.</p>}
        <Link href="/courses" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800">
          All courses <ArrowRight className="size-4" />
        </Link>
      </Section>
      <PricingSection courses={open} />
      <HowItWorks />
      <Features />
      {settings.showPublicSchedule && <SchedulePreview sessions={sessions} />}
      <TeamSection team={settings.team} />
      <CentersSection centers={settings.centers} />
      <FaqSection faqs={settings.faqs} />
      <CtaBand />
    </>
  );
}
