import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '@/animations/motion'
import './Features.css'

const featureList = [
  {
    id: 'repo-analysis',
    title: 'Full-Spectrum Repository Analysis',
    category: 'Architecture',
    description:
      'Parses full module graphs and symbol hierarchies. Cross-references types, imports, and interface implementations across large monorepos.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    ),
    meta: 'Cross-file symbol graph • Monorepos',
    badge: 'AST Core',
  },
  {
    id: 'issue-detection',
    title: 'Precision Issue Detection',
    category: 'Logic & Security',
    description:
      'Detects insidious race conditions, unhandled Promise rejections, SQL injections, and state desyncs that static linters routinely miss.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    meta: 'CWE Catalog • OWASP Top 10',
    badge: 'Deep Taint',
  },
  {
    id: 'severity-classification',
    title: 'Calibrated Severity Classification',
    category: 'Triage & Gates',
    description:
      'Every issue is categorized from Critical down to Info. Set strict blocking policies so critical flaws break the build while non-blocking suggestions stay optional.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
    meta: 'Critical • High • Medium • Low',
    badge: 'CI Blocker',
  },
  {
    id: 'file-level-findings',
    title: 'Deep File-Level Context',
    category: 'Developer UX',
    description:
      'Pins issues directly to line gutters with surrounding call-stack windows, breadcrumbs, and AST traces so developers understand the root cause immediately.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
    meta: 'Gutter anchors • Call stacks',
    badge: 'Inline UX',
  },
  {
    id: 'review-history',
    title: 'Persistent Review History',
    category: 'Analytics & Audit',
    description:
      'Track code quality trends, historical pull request audits, regression metrics, and time-to-remediate with persistent Supabase backend storage.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    meta: 'Supabase-backed • Regression logs',
    badge: 'Audit Trail',
  },
  {
    id: 'actionable-suggestions',
    title: 'Actionable Verified Fix Diffs',
    category: 'Remediation',
    description:
      'The agent provides ready-to-merge, compiler-verified diffs formatted as native Git patches. Accept fixes with a single click directly from the PR.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
    ),
    meta: 'Native Git patch • 1-click apply',
    badge: 'Auto-Remediate',
  },
]

export default function Features() {
  const containerRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Header reveal
      gsap.from('.section-header-center', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      // Staggered bento cards
      gsap.from(cardsRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
          once: true,
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="features-section" id="features" ref={containerRef}>
      <div className="container">
        {/* Header */}
        <div className="section-header-center">
          <span className="section-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Engine Capabilities
          </span>
          <h2 className="section-heading">Built specifically for high-velocity engineering teams.</h2>
          <p className="section-description">
            Everything you need to catch critical regressions, eliminate security flaws, and speed up review cycles without adding developer friction.
          </p>
        </div>

        {/* Feature Bento Grid */}
        <div className="features-grid">
          {featureList.map((feat, index) => (
            <div
              key={feat.id}
              className="feature-card glass-panel"
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <div className="feature-top">
                <div className="feature-icon-box">{feat.icon}</div>
                <span className="feature-badge">{feat.badge}</span>
              </div>
              <span className="feature-category">{feat.category}</span>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-description">{feat.description}</p>
              <div className="feature-meta-footer">
                <span className="meta-tag">{feat.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
