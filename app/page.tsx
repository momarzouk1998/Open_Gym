import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { SocialProof } from '@/components/landing/SocialProof'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { SmoothScroll } from '@/components/landing/SmoothScroll'
import { GsapScrollInit } from '@/components/landing/GsapScrollInit'

export default function Home() {
  return (
    <>
      <GsapScrollInit />
      <SmoothScroll />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <SocialProof />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
