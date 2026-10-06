import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './EngineersWhoShipSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function EngineersWhoShipSection() {
  const sectionRef = useRef(null)
  const imageRef = useRef(null)
  const contentRef = useRef(null)
  const tagRef = useRef(null)
  const headingRef = useRef(null)
  const quoteRef = useRef(null)
  const metricsRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return

    const section = sectionRef.current
    const image = imageRef.current
    const content = contentRef.current
    const tag = tagRef.current
    const heading = headingRef.current
    const quote = quoteRef.current
    const metrics = metricsRef.current

    const ctx = gsap.context(() => {
      // Image Parallax & Crop Shift
      if (image) {
        gsap.fromTo(
          image,
          { y: '-6%', scale: 1.05 },
          {
            y: '6%',
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          }
        )
      }

      // Editorial Content Staggered Reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: content,
          start: 'top 80%',
          once: true,
        },
        defaults: { ease: 'power3.out' },
      })

      tl.fromTo(tag, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo(heading, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.35')
        .fromTo(quote, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.35')
        .fromTo(
          metrics?.children ? Array.from(metrics.children) : [],
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          '-=0.3'
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="engineers-section" id="engineers-who-ship">
      <div className="engineers-container">
        {/* Top Editorial Index Row */}
        <div className="engineers-topbar">
          <div className="topbar-left">
            <span className="mono-idx">01</span>
            <span className="mono-sep">/</span>
            <span className="mono-label">ENGINEERING CULTURE</span>
          </div>
          <div className="topbar-right">
            <span className="mono-coords">CORE PILLAR · HIGH-VELOCITY AUDITING</span>
          </div>
        </div>

        {/* 65% / 35% Asymmetric Showcase Layout */}
        <div className="engineers-grid">
          {/* LEFT: Authentic Engineering Team Photograph */}
          <div className="engineers-media-column">
            <div className="engineers-image-frame">
              <img
                ref={imageRef}
                src="/images/engineering/engineering-02.jpg"
                alt="Engineering team analyzing code review diffs and architecture together"
                className="engineers-photo"
                loading="lazy"
                decoding="async"
              />
              <div className="image-vignette-overlay" />
              <div className="image-caption-pill">
                <span className="caption-dot" />
                <span>TEAM PEER REVIEW // SPRINT DELTA VERIFICATION</span>
              </div>
            </div>
          </div>

          {/* RIGHT: High-Impact Editorial Copy & Metrics */}
          <div ref={contentRef} className="engineers-content-column">
            <div ref={tagRef} className="content-meta-tag">
              <span className="meta-tag-highlight">CODE INTEGRITY</span>
              <span className="meta-tag-bullet">&bull;</span>
              <span>ZERO HUMAN BOTTLENECKS</span>
            </div>

            <h2 ref={headingRef} className="engineers-main-title">
              ENGINEERS
              <br />
              WHO SHIP.
            </h2>

            <blockquote ref={quoteRef} className="engineers-subtext-quote">
              Great software is reviewed before it becomes someone else's problem.
            </blockquote>

            <p className="engineers-narrative">
              High-performing engineering teams don't compromise velocity for security. Code Review
              Agent performs comprehensive lexical and AST traversals across every pull request in
              sub-second timeframes, isolating dangerous flaws, regression risks, and architectural
              drift before code touches production.
            </p>

            {/* Technical Verification Metrics */}
            <div ref={metricsRef} className="engineers-metrics-strip">
              <div className="metric-item">
                <span className="metric-number">42ms</span>
                <span className="metric-label">AST Parse Speed</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-number">99.4%</span>
                <span className="metric-label">Defect Interception</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-number">0 B</span>
                <span className="metric-label">Disk Storage (In-Memory)</span>
              </div>
            </div>

            <div className="engineers-action-row">
              <Link to="/dashboard" className="engineers-link-cta">
                <span>CONNECT GITHUB REPOSITORY</span>
                <span className="cta-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
