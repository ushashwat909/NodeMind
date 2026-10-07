import { useState, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import EditorialNavigation from '@/components/EditorialNavigation'
import EditorialHero from '@/components/EditorialHero'
import GlimpseExperience from '@/components/glimpse/GlimpseExperience'
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
  const [isGlimpseOpen, setIsGlimpseOpen] = useState(false)
  const lenisRef = useRef(null)

  // Check URL query or hash for direct link
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') === 'glimpse' || window.location.hash === '#glimpse') {
      setIsGlimpseOpen(true)
    }
  }, [])

  // Pause Lenis background scroll while Glimpse overlay is open
  useEffect(() => {
    if (!lenisRef.current) return
    if (isGlimpseOpen) {
      lenisRef.current.stop()
    } else {
      lenisRef.current.start()
    }
  }, [isGlimpseOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.8,
    })
    lenisRef.current = lenis

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
      lenisRef.current = null
    }
  }, [])

  const handleOpenGlimpse = () => {
    setIsGlimpseOpen(true)
  }

  const handleCloseGlimpse = () => {
    setIsGlimpseOpen(false)
    if (window.location.hash === '#glimpse') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  return (
    <div className="landing-page-root">
      {/* 0. IMMERSIVE GLIMPSE ARCHITECTURE EXPERIENCE OVERLAY */}
      <GlimpseExperience isOpen={isGlimpseOpen} onClose={handleCloseGlimpse} />

      {/* 1. MINIMAL EDITORIAL NAVIGATION */}
      <EditorialNavigation onOpenGlimpse={handleOpenGlimpse} />

      <main id="main-content">
        {/* 2. SIGNATURE EDITORIAL HERO + CONTINUOUS PARALLAX DEPTH */}
        <EditorialHero onOpenGlimpse={handleOpenGlimpse} />

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
