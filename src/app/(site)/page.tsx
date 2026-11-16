import { Hero } from "@/components/site/hero";
import { AboutSection, CentersSection, CtaBand, FaqSection, Features, HowItWorks, SchedulePreview, SectionHeading, TeamSection, TopicMarquee } from "@/components/site/sections";
import { CourseCard } from "@/components/site/course-card";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPublicCourses, getUpcomingPublicSessions } from "@/lib/queries";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, settings, courses] = await Promise.all([getCurrentUser(), getSettings(), getPublicCourses()]);
  const sessions = settings.showPublicSchedule ? await getUpcomingPublicSessions(5) : [];
  const featured = courses.filter((c) => c.status === "PUBLISHED").slice(0, 3);
  return (
    <>
      <Hero hero={settings.hero} loggedIn={!!user} />
      <TopicMarquee />
      <AboutSection about={settings.about} stats={settings.stats} />
      <section className="py-24">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading eyebrow="Courses" title="Basics first. Then Advanced." description="Each course is enrolled and paid for separately. Basics builds the foundation; Advanced opens near the end of Basics to take you to exam level." />
            <ButtonLink href="/courses" variant="secondary">
              All courses <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <Stagger className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <StaggerItem key={c.id}>
                <CourseCard course={c} />
              </StaggerItem>
            ))}
            {featured.length === 0 && <p className="text-muted-foreground">New courses are coming soon.</p>}
          </Stagger>
        </div>
      </section>
      <HowItWorks />
      <Features />
      {settings.showPublicSchedule && <SchedulePreview sessions={sessions} />}
      <TeamSection team={settings.team} />
      <CentersSection centers={settings.centers} />
      <FaqSection faqs={settings.faqs} />
      <CtaBand loggedIn={!!user} />
    </>
  );
}
