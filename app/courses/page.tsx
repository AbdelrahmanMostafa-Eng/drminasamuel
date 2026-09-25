import type { Metadata } from "next"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { CoursesCatalog } from "@/components/site/courses-catalog"

export const metadata: Metadata = {
  title: "Courses",
  description: "Biology Basics and Advanced Biology courses with Dr. Mina Samuel. Live sessions, quizzes and structured chapters.",
}

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24">
        <CoursesCatalog />
      </main>
      <Footer />
    </>
  )
}
