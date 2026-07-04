'use client'

import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { SocialProof } from '@/components/landing/SocialProof'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { SmoothScroll } from '@/components/landing/SmoothScroll'
import { useGsapScroll } from '@/hooks/useGsapScroll'

export default function Home() {
  // GSAP: scroll progress bar + background parallax
  useGsapScroll()

  return (
    <>
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
