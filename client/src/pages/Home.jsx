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
import './Home.css'

export default function Home() {
  return (
    <div className="landing-page-root">
      {/* 1. MINIMAL EDITORIAL NAVIGATION */}
      <EditorialNavigation />

      <main id="main-content">
        {/* 2. SIGNATURE EDITORIAL HERO + AUTHENTIC PHOTOGRAPHY + CODE REVIEW TRANSITION */}
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
