import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from '@/animations/gsap'
import './FinalCta.css'

export default function FinalCta() {
  const [copied, setCopied] = useState(false)
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  const ctaBtnRef = useRef(null)

  const handleCopy = () => {
    navigator.clipboard.writeText('npx code-review-agent@latest scan --repo .')
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 45,
        scale: 0.98,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleBtnHover = () => {
    if (ctaBtnRef.current) {
      gsap.to(ctaBtnRef.current, {
        scale: 1.03,
        boxShadow: '0 8px 30px rgba(99, 88, 238, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        duration: 0.25,
        ease: 'power2.out',
      })
    }
  }

  const handleBtnLeave = () => {
    if (ctaBtnRef.current) {
      gsap.to(ctaBtnRef.current, {
        scale: 1,
        boxShadow: '0 4px 18px rgba(99, 88, 238, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        duration: 0.35,
        ease: 'power2.out',
      })
    }
  }

  return (
    <section className="final-cta-section" id="get-started" ref={sectionRef}>
      <div className="container">
        <div className="cta-card glass-panel" ref={cardRef}>
          {/* Card Ambient Glow */}
          <div className="cta-glow-effect" aria-hidden="true" />

          <div className="cta-content">
            <span className="section-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Get Started Today
            </span>

            <h2 className="cta-headline">
              Review your first pull request in under two minutes.
            </h2>

            <p className="cta-subtext">
              Eliminate critical bugs, prevent regressions, and ship code faster with automated, AST-grade review comments. Free for developers and open-source projects.
            </p>

            {/* Interactive Terminal Snippet */}
            <div
              className="cta-terminal-box"
              onClick={handleCopy}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCopy()}
              title="Click to copy CLI scan command"
            >
              <div className="terminal-header-mini">
                <span className="mini-dot" />
                <span className="mini-dot" />
                <span className="mini-dot" />
                <span className="mini-title">terminal</span>
              </div>
              <div className="terminal-body-mini">
                <span className="term-prompt">$</span>
                <code className="term-cmd">npx code-review-agent@latest scan --repo .</code>
                <button type="button" className="term-copy-btn" title="Copy CLI scan command">
                  {copied ? (
                    <span className="term-copied">Copied!</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Button Actions */}
            <div className="cta-actions">
              <Link
                to="/signup"
                className="btn btn-primary cta-btn-main"
                ref={ctaBtnRef}
                onMouseEnter={handleBtnHover}
                onMouseLeave={handleBtnLeave}
              >
                <span>Start Free Code Review</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-secondary cta-btn-sub">
                <span>Sign In</span>
              </Link>
            </div>

            {/* Guarantees */}
            <div className="cta-guarantees">
              <span>&check; No credit card required</span>
              <span className="guarantee-sep">&bull;</span>
              <span>&check; Instant GitHub App install</span>
              <span className="guarantee-sep">&bull;</span>
              <span>&check; 0-day code retention</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
