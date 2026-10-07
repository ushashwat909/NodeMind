import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import EditorialNavigation from '@/components/EditorialNavigation'
import EditorialHero from '@/components/EditorialHero'
import EngineersWhoShipSection from '@/components/EngineersWhoShipSection'
import EditorialStatementSection from '@/components/EditorialStatementSection'
import FromCodeToReviewSection from '@/components/FromCodeToReviewSection'
import WhatWeReviewSection from '@/components/WhatWeReviewSection'
import PhotoWallSection from '@/components/PhotoWallSection'
import SecondEditorialStatement from '@/components/SecondEditorialStatement'
import SecuritySection from '@/components/SecuritySection'
import AnimatedCTA from '@/components/AnimatedCTA'
import Footer from '@/components/Footer'
import 'lenis/dist/lenis.css'
import './Home.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function Home() {
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.8,
    })

    // Synchronize Lenis scroll updates with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    const tickerCallback = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 500)

    return () => {
      clearTimeout(refreshTimer)
      gsap.ticker.remove(tickerCallback)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="landing-page-root">
      {/* 1. MINIMAL EDITORIAL NAVIGATION */}
      <EditorialNavigation />

      <main id="main-content">
        {/* 2. SIGNATURE EDITORIAL HERO + CONTINUOUS PARALLAX DEPTH */}
        <EditorialHero />

        {/* 3. LARGE PHOTOGRAPHIC SECTION: ENGINEERS WHO SHIP */}
        <EngineersWhoShipSection />

        {/* 4. MONUMENTAL EDITORIAL STATEMENT: CODE CHANGES. SO DO THE RISKS. */}
        <EditorialStatementSection />

        {/* 5. UNIFIED 4-STAGE PIPELINE: FROM CODE TO REVIEW (CONNECT → ANALYZE → UNDERSTAND → FIX) */}
        <FromCodeToReviewSection />

        {/* 6. HORIZONTAL VISUAL TRACK: WHAT WE REVIEW (SECURITY, BUGS, PERF, MAINT, ARCH) */}
        <WhatWeReviewSection />

        {/* 7. ASYMMETRIC EDITORIAL PHOTO WALL (ENGINEERING DISCIPLINE & CULTURE) */}
        <PhotoWallSection />

        {/* 8. MONUMENTAL CLOSING STATEMENT: SHIP WITH CONTEXT */}
        <SecondEditorialStatement />

        {/* 9. ZERO-RETENTION SECURITY GUARANTEE */}
        <SecuritySection />

        {/* 10. HIGH-CONVICTION SIGNATURE CTA */}
        <AnimatedCTA />
      </main>

      {/* 11. REFINED LIVE OPERATIONAL FOOTER */}
      <Footer />
    </div>
  )
}
