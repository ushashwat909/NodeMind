import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import CodeReviewShowcase from './CodeReviewShowcase'
import './EditorialHero.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function EditorialHero() {
  const containerRef = useRef(null)
  const bgImageRef = useRef(null)
  const heroPosterRef = useRef(null)
  const line1Ref = useRef(null)
  const line2Ref = useRef(null)
  const line3Ref = useRef(null)
  const line4Ref = useRef(null)
  const metaTopRef = useRef(null)
  const metaBottomRef = useRef(null)
  const ctaGroupRef = useRef(null)
  const codeRevealRef = useRef(null)
  const [copiedCli, setCopiedCli] = useState(false)

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx @codereview/agent review .')
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2200)
  }

  useEffect(() => {
    if (prefersReducedMotion()) return

    const container = containerRef.current
    const bgImage = bgImageRef.current
    const heroPoster = heroPosterRef.current
    const line1 = line1Ref.current
    const line2 = line2Ref.current
    const line3 = line3Ref.current
    const line4 = line4Ref.current
    const metaTop = metaTopRef.current
    const metaBottom = metaBottomRef.current
    const ctaGroup = ctaGroupRef.current
    const codeReveal = codeRevealRef.current

    if (!container || !heroPoster || !line1 || !codeReveal) return

    const ctx = gsap.context(() => {
      // 1. Initial Page Load Entrance (Enhancement only; base CSS is already 100% readable)
      const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (bgImage) {
        introTl.fromTo(
          bgImage,
          { scale: 1.08, opacity: 0.6 },
          { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
          0
        )
      }

      introTl
        .fromTo(metaTop, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
        .fromTo(
          [line1, line2, line3, line4],
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 },
          0.2
        )
        .fromTo(ctaGroup, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, 0.45)
        .fromTo(metaBottom, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.5)

      // 2. Responsive ScrollTrigger Transition
      const isMobile = window.innerWidth <= 768

      if (isMobile) {
        // Mobile: Clean, natural vertical reveal without pinning
        gsap.fromTo(
          codeReveal,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: codeReveal,
              start: 'top 85%',
              once: true,
            },
          }
        )
      } else {
        // Desktop: Signature Cinematic Scroll Transition
        // Big text gently elevates and docks, photo pans, and code review finding surfaces prominently
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: '+=90%',
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        scrollTl
          // Background photo pans and zooms subtly into the workstation
          .to(
            bgImage,
            {
              scale: 1.06,
              x: '-2%',
              y: '-2%',
              filter: 'brightness(0.35) blur(2px)',
              ease: 'power1.inOut',
            },
            0
          )
          // Headline elevates into a docked eyebrow banner (keeps high contrast and readability)
          .to(
            heroPoster,
            {
              y: -85,
              scale: 0.88,
              opacity: 0.85,
              ease: 'power1.inOut',
            },
            0
          )
          // Dim secondary CTA buttons & scroll prompt as code review inspector rises
          .to([ctaGroup, metaBottom], { opacity: 0, y: -15, ease: 'power1.in' }, 0)
          // Code Review interface rises into center stage with crisp focus
          .fromTo(
            codeReveal,
            {
              opacity: 0,
              y: 100,
              scale: 0.94,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              ease: 'power2.out',
            },
            0.18
          )
      }
    }, containerRef)

    // Ensure ScrollTrigger recalculates after fonts / images load
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 400)

    return () => {
      clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={containerRef} className="editorial-hero-section" id="hero">
      {/* 1. Authentic Engineering Background Photograph */}
      <div className="hero-photograph-layer">
        <img
          ref={bgImageRef}
          src="/images/engineering/hero-engineering.jpg"
          alt="Engineering team reviewing and collaborating on software codebase"
          className="hero-background-img"
          loading="eager"
          decoding="async"
        />
        <div className="hero-photograph-gradient-overlay" />
        <div className="hero-photograph-mesh-grid" />
      </div>

      {/* 2. Top Contextual Micro-Header */}
      <div ref={metaTopRef} className="hero-context-top">
        <div className="context-left">
          <span className="context-tag">CODE REVIEW AGENT</span>
          <span className="context-sep">/</span>
          <span className="context-desc">AUTOMATED REPOSITORY ANALYSIS</span>
        </div>
        <div className="context-right">
          <span className="mono-status-indicator">
            <span className="pulse-dot-green" />
            V2.4 ENGINE · ZERO-PERSISTENCE AUDITING
          </span>
        </div>
      </div>

      {/* 3. High-Contrast Editorial Display Headline */}
      <div ref={heroPosterRef} className="hero-poster-wrapper">
        <h1 className="hero-display-headline" aria-label="Your code. Reviewed before it ships.">
          <div ref={line1Ref} className="display-line line-1">
            <span className="headline-text">YOUR CODE.</span>
          </div>
          <div ref={line2Ref} className="display-line line-2">
            <span className="headline-text highlight-word">REVIEWED</span>
          </div>
          <div ref={line3Ref} className="display-line line-3">
            <span className="headline-text">BEFORE</span>
          </div>
          <div ref={line4Ref} className="display-line line-4">
            <span className="headline-text">IT SHIPS.</span>
          </div>
        </h1>

        {/* Minimal High-Conviction CTA Group */}
        <div ref={ctaGroupRef} className="hero-cta-group">
          <div className="cta-buttons-row">
            <Link to="/dashboard" className="hero-btn-primary">
              <span>START CODE REVIEW</span>
              <span className="hero-btn-arrow">→</span>
            </Link>

            <button
              type="button"
              className="hero-cli-pill"
              onClick={handleCopyCli}
              title="Copy CLI command"
              aria-label="Copy CLI install command"
            >
              <span className="cli-prompt">$</span>
              <span className="cli-cmd">npx @codereview/agent review .</span>
              <span className="cli-copy-badge">{copiedCli ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <p className="hero-subtext">
            Autonomous security, performance, and defect analysis for GitHub repositories.
            No code stored. Findings mapped to exact line numbers before merge.
          </p>
        </div>
      </div>

      {/* 4. Editorial Scroll Prompt */}
      <div ref={metaBottomRef} className="hero-scroll-prompt">
        <span className="prompt-label">SCROLL TO EXPLORE</span>
        <span className="prompt-arrow">↓</span>
        <span className="prompt-meta">AUTONOMOUS AST AUDITING</span>
      </div>

      {/* 5. Signature Code Review Reveal Interface (ENGINEER → CODE → REVIEW → FINDING) */}
      <div ref={codeRevealRef} className="hero-code-reveal-wrapper" id="code-showcase">
        <div className="reveal-badge-header">
          <div className="reveal-badge-left">
            <span className="reveal-tag">ENGINEER → CODE → REVIEW → FINDING</span>
            <span className="reveal-sep">/</span>
            <span className="reveal-desc">LIVE WORKSPACE REVEAL</span>
          </div>
          <span className="reveal-meta">HIGH-CONFIDENCE AST INSPECTOR</span>
        </div>
        <CodeReviewShowcase />
      </div>
    </section>
  )
}
