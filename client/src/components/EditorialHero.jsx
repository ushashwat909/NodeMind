import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './EditorialHero.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function EditorialHero({ onOpenGlimpse }) {
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
  const [copiedCli, setCopiedCli] = useState(false)
  const navigate = useNavigate()

  const handleGlimpseClick = () => {
    if (onOpenGlimpse) {
      onOpenGlimpse()
    } else {
      navigate('/glimpse')
    }
  }

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

    if (!container || !heroPoster || !line1) return

    const ctx = gsap.context(() => {
      // 1. Initial Page Load Entrance Animation
      const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (bgImage) {
        introTl.fromTo(
          bgImage,
          { scale: 1.08, opacity: 0.5 },
          { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
          0
        )
      }

      introTl
        .fromTo(metaTop, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
        .fromTo(
          [line1, line2, line3, line4],
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 },
          0.2
        )
        .fromTo(ctaGroup, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, 0.45)
        .fromTo(metaBottom, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.55)

      // 2. Continuous Parallax Scroll scrub (smooth progression into section 01 without freezing or collisions)
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })

      scrollTl
        .to(
          bgImage,
          {
            scale: 1.15,
            y: '10%',
            filter: 'brightness(0.3) blur(3px)',
            ease: 'none',
          },
          0
        )
        .to(
          heroPoster,
          {
            y: -60,
            opacity: 0.25,
            scale: 0.96,
            ease: 'none',
          },
          0
        )
        .to(
          [ctaGroup, metaBottom],
          {
            opacity: 0,
            y: -30,
            ease: 'none',
          },
          0
        )
    }, containerRef)

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
          <span className="context-tag">NODEMIND</span>
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
              className="hero-btn-glimpse"
              onClick={handleGlimpseClick}
              aria-label="Experience NodeMind 3D Glimpse"
            >
              <span className="glimpse-sparkle-dot">✦</span>
              <span className="hero-glimpse-text">GLIMPSE</span>
              <span className="hero-glimpse-badge">3D PREVIEW</span>
            </button>

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

      {/* 4. Editorial Context Bottom Bar */}
      <div ref={metaBottomRef} className="hero-scroll-prompt">
        <div className="prompt-left">
          <span className="pulse-dot-orange" />
          <span className="prompt-meta">IN-MEMORY AST EVALUATION · ZERO DISK PERSISTENCE · ALL BRANCHES</span>
        </div>
        <div className="prompt-right">
          <span className="prompt-label">SCROLL TO EXPLORE</span>
          <span className="prompt-arrow">↓</span>
        </div>
      </div>
    </section>
  )
}
