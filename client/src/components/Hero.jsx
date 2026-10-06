import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, prefersReducedMotion } from '@/animations/gsap'
import { useToast } from '@/context/ToastContext'
import CodePreview from './CodePreview'
import './Hero.css'

export default function Hero() {
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const { toast } = useToast()
  const heroRef = useRef(null)
  const badgeRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const metaRef = useRef(null)
  const ctaRef = useRef(null)
  const previewRef = useRef(null)
  const mainCtaBtnRef = useRef(null)

  const copyCliSnippet = () => {
    navigator.clipboard.writeText('npx code-review-agent@latest scan')
    setCopiedSnippet(true)
    toast.info('CLI command copied: npx code-review-agent@latest scan', 'Command Copied')
    setTimeout(() => setCopiedSnippet(false), 2200)
  }

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // 1. Entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      tl.from(badgeRef.current, {
        opacity: 0,
        y: -12,
        duration: 0.45,
        delay: 0.1,
      })
      .from(titleRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.65,
      }, '-=0.25')
      .from(descRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.55,
      }, '-=0.35')
      .from(metaRef.current, {
        opacity: 0,
        y: 12,
        duration: 0.45,
      }, '-=0.35')
      .from(ctaRef.current, {
        opacity: 0,
        y: 14,
        duration: 0.45,
      }, '-=0.25')
      .from(previewRef.current, {
        opacity: 0,
        y: 32,
        rotationX: 4,
        scale: 0.96,
        duration: 0.75,
        transformPerspective: 1200,
      }, '-=0.3')

      // 2. Subtle scroll parallax on background ambient glow
      gsap.to('.hero-ambient-glow', {
        y: 70,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      // 3. Subtle parallax on code preview as user scrolls
      gsap.to(previewRef.current, {
        y: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: previewRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  // 4. CTA hover interaction
  const handleCtaMouseEnter = () => {
    if (mainCtaBtnRef.current) {
      gsap.to(mainCtaBtnRef.current, {
        scale: 1.03,
        boxShadow: '0 8px 30px rgba(99, 88, 238, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        duration: 0.25,
        ease: 'power2.out',
      })
    }
  }

  const handleCtaMouseLeave = () => {
    if (mainCtaBtnRef.current) {
      gsap.to(mainCtaBtnRef.current, {
        scale: 1,
        boxShadow: '0 4px 18px rgba(99, 88, 238, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        duration: 0.35,
        ease: 'power2.out',
      })
    }
  }

  return (
    <section className="hero-section" ref={heroRef} aria-label="Hero">
      {/* Background ambient glow effects */}
      <div className="hero-ambient-glow" aria-hidden="true" />
      <div className="hero-ambient-cyan" aria-hidden="true" />

      <div className="container hero-container">
        {/* Top Eyebrow Badge */}
        <div className="hero-badge-wrap" ref={badgeRef}>
          <div className="hero-badge">
            <span className="badge-pulse-dot" />
            <span className="badge-text">Autonomous Static &amp; Semantic Analysis Engine</span>
          </div>
        </div>

        {/* Main Editorial Headline */}
        <h1 className="hero-headline" ref={titleRef}>
          Review your code <br className="hero-br" />
          <span className="hero-headline-highlight">before your team does.</span>
        </h1>

        {/* Supporting Developer-Focused Subtitle */}
        <p className="hero-subtext" ref={descRef}>
          Code Review Agent performs deep AST-level inspection across pull requests,
          tracing async race conditions, state mutations, and security vulnerabilities
          to deliver actionable inline fixes with zero review fatigue.
        </p>

        {/* Compact Technical Metadata Bar */}
        <div className="hero-tech-meta" ref={metaRef}>
          <div className="tech-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>AST Semantic Engine v2.4</span>
          </div>
          <span className="meta-sep">&bull;</span>
          <div className="tech-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>&lt; 450ms Cold-Start</span>
          </div>
          <span className="meta-sep">&bull;</span>
          <div className="tech-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>GitHub, GitLab &amp; CLI</span>
          </div>
          <span className="meta-sep">&bull;</span>
          <div className="tech-meta-item">
            <span className="lang-tag">TS</span>
            <span className="lang-tag">PY</span>
            <span className="lang-tag">GO</span>
            <span className="lang-tag">RS</span>
          </div>
        </div>

        {/* Primary & Secondary Call to Actions */}
        <div className="hero-cta-group" ref={ctaRef}>
          <Link
            to="/signup"
            className="btn btn-primary hero-btn-main"
            ref={mainCtaBtnRef}
            onMouseEnter={handleCtaMouseEnter}
            onMouseLeave={handleCtaMouseLeave}
          >
            <span>Start Free Code Review</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>

          <a href="#code-inspector" className="btn btn-secondary hero-btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Inspect Live Demo</span>
          </a>

          {/* Quick CLI snippet copy */}
          <div
            className="hero-cli-pill"
            onClick={copyCliSnippet}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && copyCliSnippet()}
            title="Click to copy CLI scan command"
          >
            <span className="cli-prompt">$</span>
            <code className="cli-code">npx code-review-agent@latest scan</code>
            <span className="cli-copy-action">
              {copiedSnippet ? (
                <span className="cli-copied-text">Copied!</span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </span>
          </div>
        </div>

        {/* Visual Code Review Inspection Preview */}
        <div className="hero-preview-wrapper" ref={previewRef}>
          <div className="preview-glow-backdrop" aria-hidden="true" />
          <CodePreview />
        </div>
      </div>
    </section>
  )
}
