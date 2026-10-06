import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'
import './RecentReviewsSection.css'

const CASE_STUDIES = [
  {
    num: '01',
    repo: 'schoolconnect360',
    module: 'Authentication & Tenant Isolation Module',
    findingsCount: 27,
    verdict: 'FAILED',
    score: 68,
    year: '2026',
    tags: ['Multi-Tenant', 'JWT Security', 'RBAC'],
    peekSnippet: 'auth/tenantResolver.ts#L19 -> Unscoped cross-tenant query bypass risk',
  },
  {
    num: '02',
    repo: 'payment-service',
    module: 'API Security & Idempotency Engine',
    findingsCount: 11,
    verdict: 'PASSED',
    score: 84,
    year: '2026',
    tags: ['PCI-DSS', 'Webhook HMAC', 'Idempotency'],
    peekSnippet: 'payments/webhook.ts#L84 -> Missing HMAC signature verification',
  },
  {
    num: '03',
    repo: 'frontend-platform',
    module: 'AST Dependency Graph & Maintainability',
    findingsCount: 34,
    verdict: 'PASSED',
    score: 72,
    year: '2026',
    tags: ['Circular Deps', 'Dead Branches', 'Complexity'],
    peekSnippet: 'packages/ui/table.tsx#L142 -> Function exceeds cyclomatic limit (24 > 15)',
  },
  {
    num: '04',
    repo: 'cloud-infra-operator',
    module: 'Kubernetes CRD & Secret Injection Guard',
    findingsCount: 6,
    verdict: 'PASSED',
    score: 96,
    year: '2026',
    tags: ['SSRF Guard', 'K8s RBAC', 'Zero Leakage'],
    peekSnippet: 'operator/reconciler.go#L61 -> Verified rootless container sandbox profile',
  },
]

export default function RecentReviewsSection() {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const rowsRef = useRef([])

  useEffect(() => {
    if (prefersReducedMotion()) return

    rowsRef.current.forEach((row, idx) => {
      if (!row) return
      const isHovered = hoveredIdx === idx
      const title = row.querySelector('.case-repo-title')
      const arrow = row.querySelector('.case-arrow-icon')
      const peek = row.querySelector('.case-code-peek')

      if (isHovered) {
        gsap.to(title, { x: 12, color: '#ffffff', duration: 0.22, ease: 'power2.out' })
        gsap.to(arrow, { transform: 'rotate(45deg)', color: '#818cf8', duration: 0.22, ease: 'power2.out' })
        if (peek) gsap.to(peek, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' })
      } else {
        gsap.to(title, { x: 0, color: '#f2f2f8', duration: 0.2, ease: 'power2.in' })
        gsap.to(arrow, { transform: 'rotate(0deg)', color: '#8b949e', duration: 0.2, ease: 'power2.in' })
        if (peek) gsap.to(peek, { opacity: 0, y: 4, duration: 0.18, ease: 'power2.in' })
      }
    })
  }, [hoveredIdx])

  return (
    <section className="recent-reviews-section" id="recent-reviews">
      <div className="reviews-section-container">
        {/* Section Header */}
        <div className="reviews-header-block">
          <div className="header-meta-row">
            <span className="meta-index-tag">AUDIT BENCHMARKS</span>
            <span className="meta-sep">/</span>
            <span className="meta-label">CASE STUDY ARCHIVE</span>
          </div>
          <div className="title-desc-row">
            <h2 className="reviews-main-title">RECENT REVIEWS</h2>
            <p className="reviews-header-desc">
              Curated audit samples illustrating autonomous repository inspection,
              blast-radius classification, and AST issue localization.
            </p>
          </div>
        </div>

        {/* Editorial Case Study Rows */}
        <div className="case-studies-list" role="list">
          {CASE_STUDIES.map((study, idx) => (
            <Link
              key={study.num}
              to="/dashboard"
              ref={(el) => (rowsRef.current[idx] = el)}
              className="case-study-row"
              role="listitem"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
              aria-label={`View audit report for ${study.repo}`}
            >
              {/* Left Column: Number & Repo Title */}
              <div className="case-left-col">
                <span className="case-num">{study.num}</span>
                <div className="case-title-block">
                  <span className="case-repo-title">{study.repo}</span>
                  <span className="case-module-sub">{study.module}</span>
                  {/* Hover Code Peek */}
                  <div className="case-code-peek">
                    <span className="peek-prefix">FINDING:</span>
                    <code className="peek-code">{study.peekSnippet}</code>
                  </div>
                </div>
              </div>

              {/* Middle Column: Findings count & quality badge */}
              <div className="case-metrics-col">
                <span className="case-findings-badge">
                  {study.findingsCount} FINDINGS
                </span>
                <span className={`case-verdict-pill ${study.verdict.toLowerCase()}`}>
                  SCORE: {study.score}%
                </span>
                <div className="case-tags-group">
                  {study.tags.map((tag) => (
                    <span key={tag} className="case-tag-item">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Year & Arrow mark */}
              <div className="case-right-col">
                <span className="case-year-text">{study.year}</span>
                <span className="case-arrow-icon">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
