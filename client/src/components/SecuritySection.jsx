import { useEffect, useRef } from 'react'
import { gsap } from '@/animations/gsap'
import './SecuritySection.css'

const securityPillars = [
  {
    title: 'Zero Source Code Retention',
    badge: 'Ephemeral Memory',
    description:
      'Diffs are analyzed inside isolated, ephemeral in-memory worker threads. Once the AST review completes, all file representations are permanently flushed from memory.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
  },
  {
    title: 'Never Trained on Your Code',
    badge: 'Zero IP Leakage',
    description:
      'We maintain strict contractual and architectural guarantees: your proprietary codebase, comments, and schemas are never utilized to fine-tune or train any AI models.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
  },
  {
    title: 'Least-Privilege GitHub Access',
    badge: 'HMAC-SHA256 Signed',
    description:
      'Our GitHub integration requests only minimal read access to pull request diffs. Every webhook payload is cryptographically verified before processing.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>
    ),
  },
]

export default function SecuritySection() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.security-card', {
        opacity: 0,
        y: 30,
        duration: 0.75,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })

      gsap.from('.security-checklist', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.security-checklist',
          start: 'top 90%',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="security-section" id="security" ref={sectionRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Security &amp; Privacy First
          </span>
          <h2 className="section-heading">Engineered for security-critical codebases.</h2>
          <p className="section-description">
            Your source code is your company&apos;s most valuable asset. We treat confidentiality and privacy as foundational engineering invariants.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="security-grid">
          {securityPillars.map((p) => (
            <div key={p.title} className="security-card glass-panel">
              <div className="sec-header">
                <div className="sec-icon">{p.icon}</div>
                <span className="sec-badge">{p.badge}</span>
              </div>
              <h3 className="sec-title">{p.title}</h3>
              <p className="sec-desc">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Security Specs Checklist */}
        <div className="security-checklist glass-panel">
          <div className="spec-item">
            <span className="spec-check">&check;</span>
            <span>TLS 1.3 in transit &bull; AES-256 at rest</span>
          </div>
          <div className="spec-item">
            <span className="spec-check">&check;</span>
            <span>SOC2 Type II compliance roadmap</span>
          </div>
          <div className="spec-item">
            <span className="spec-check">&check;</span>
            <span>Self-hosted air-gapped container option</span>
          </div>
          <div className="spec-item">
            <span className="spec-check">&check;</span>
            <span>Supabase-managed Row-Level Security</span>
          </div>
        </div>
      </div>
    </section>
  )
}
