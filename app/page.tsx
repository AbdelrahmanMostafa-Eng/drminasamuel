import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/site/hero"
import { Features, FeaturedCourses, FinalCta, HowItWorks, Stats, TeacherSpotlight } from "@/components/site/home-sections"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <FeaturedCourses />
        <TeacherSpotlight />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
