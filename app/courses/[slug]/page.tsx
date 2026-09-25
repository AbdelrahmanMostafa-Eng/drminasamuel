import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { CourseDetail } from "@/components/site/course-detail"

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24">
        <CourseDetail slug={slug} />
      </main>
      <Footer />
    </>
  )
}
