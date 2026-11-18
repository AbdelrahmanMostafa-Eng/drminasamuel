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
      <PageHero eyebrow="Courses" title="Choose your course." description="ACT2 & EST Biology. Basics builds the foundation, Advanced takes you to exam level. Every course is enrolled and paid for separately." />
      <section className="px-6 pb-32 pt-12 md:px-12" data-gradient-bar>
        <div className="mx-auto max-w-6xl">
          {open.length === 0 ? (
            <EmptyState icon={<BookOpen />} title="No open courses right now" description="New batches are announced on social media and WhatsApp. Check back soon." />
          ) : (
            <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {open.map((c) => (
                <StaggerItem key={c.id}>
                  <CourseCard course={c} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
          {past.length > 0 && (
            <div className="mt-20 border-t border-border pt-10">
              <h2 className="eyebrow">Past courses</h2>
              <div className="mt-6 grid grid-cols-1 gap-3 opacity-75 md:grid-cols-2 lg:grid-cols-3">
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
