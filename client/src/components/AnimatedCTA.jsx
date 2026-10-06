import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './AnimatedCTA.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function AnimatedCTA() {
  const [copiedCli, setCopiedCli] = useState(false)
  const containerRef = useRef(null)
  const headlineRef = useRef(null)

  const handleCopy = () => {
    navigator.clipboard.writeText('npx @codereview/agent review .')
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2200)
  }

  useEffect(() => {
    if (prefersReducedMotion() || !headlineRef.current) return

    gsap.fromTo(
      headlineRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    )
  }, [])

  return (
    <section ref={containerRef} className="editorial-cta-section" id="cta">
      <div className="editorial-cta-container">
        <div className="cta-meta-top">
          <span className="cta-dot-green" />
          <span className="cta-meta-label">CODE REVIEW AGENT // RUNTIME ENGINE</span>
        </div>

        <h2 ref={headlineRef} className="cta-poster-headline">
          AUDIT YOUR CODE
          <br />
          BEFORE IT MERGES.
        </h2>

        <p className="cta-supporting-text">
          Connect any public or private GitHub repository.
          Zero code stored permanently. Instant deterministic AST analysis with
          actionable line-by-line mitigation diffs.
        </p>

        <div className="cta-actions-wrap">
          <Link to="/dashboard" className="cta-main-btn">
            <span>LAUNCH CODE REVIEW AGENT</span>
            <span className="cta-btn-arrow">→</span>
          </Link>

          <button
            type="button"
            className="cta-cli-button"
            onClick={handleCopy}
            title="Copy CLI command"
            aria-label="Copy CLI install command"
          >
            <span className="cli-dollar">$</span>
            <span className="cli-line">npx @codereview/agent review .</span>
            <span className="cli-status-tag">{copiedCli ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        <div className="cta-assurances-row">
          <span className="assurance-item">ZERO CODE RETENTION</span>
          <span className="assurance-sep">/</span>
          <span className="assurance-item">OWASP & CWE COMPLIANT</span>
          <span className="assurance-sep">/</span>
          <span className="assurance-item">SUB-SECOND AST TRAVERSAL</span>
        </div>
      </div>
    </section>
  )
}
