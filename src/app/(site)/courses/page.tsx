import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections";
import { CourseCard } from "@/components/site/course-card";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/misc";
import { getPublicCourses } from "@/lib/queries";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getPublicCourses();
  const open = courses.filter((c) => c.status === "PUBLISHED");
  const past = courses.filter((c) => c.status === "ENDED");
  return (
    <>
      <PageHero eyebrow="Courses" title={<>Choose your <em className="text-ember-400">course</em></>} description="ACT2 & EST Biology — Basics builds the foundation, Advanced takes you to exam level. Every course is enrolled and paid for separately." />
      <section className="py-16">
        <div className="container-x">
          {open.length === 0 ? (
            <EmptyState icon={<BookOpen />} title="No open courses right now" description="New batches are announced on our social pages and WhatsApp. Check back soon!" />
          ) : (
            <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {open.map((c) => (
                <StaggerItem key={c.id}>
                  <CourseCard course={c} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
          {past.length > 0 && (
            <div className="mt-16">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">Past courses</h2>
              <div className="mt-5 grid grid-cols-1 gap-6 opacity-80 md:grid-cols-2 lg:grid-cols-3">
                {past.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
