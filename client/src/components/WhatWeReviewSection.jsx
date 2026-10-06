import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './WhatWeReviewSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const REVIEW_PILLARS = [
  {
    num: '01',
    id: 'security',
    title: 'SECURITY',
    tag: 'OWASP TOP 10 & CWE',
    summary:
      'Pinpoints hardcoded secrets, injection vectors, SSRF vulnerabilities, permissive CORS, and broken session tokens before code merges.',
    codeFile: 'src/services/auth.ts:48',
    codeSnippet: `// CWE-798: Hardcoded secret key fallback
- const key = process.env.SECRET || 'dev_secret_key';
+ const key = getRequiredSecret('SECRET');`,
    photo: '/images/engineering/engineering-01.jpg',
    stats: 'CWE-798 · CWE-89 · CWE-918 · OWASP Benchmarks',
  },
  {
    num: '02',
    id: 'bugs',
    title: 'BUGS & DEFECTS',
    tag: 'LOGIC & RUNTIME SAFETY',
    summary:
      'Detects null pointer dereferences, race conditions, unhandled promise rejections, type coercion traps, and edge-case exceptions.',
    codeFile: 'src/api/handler.ts:32',
    codeSnippet: `// Type Coercion Trap in Payment Status
- if (order.status == 0) markRefunded();
+ if (order.status === OrderStatus.PENDING) ...`,
    photo: '/images/engineering/engineering-06.jpg',
    stats: 'Null Dereference · Race Conditions · State Leaks',
  },
  {
    num: '03',
    id: 'performance',
    title: 'PERFORMANCE',
    tag: 'LATENCY & EVENT LOOP',
    summary:
      'Identifies sequential N+1 database queries, blocking CPU loops, unindexed scans, unbounded memory buffers, and connection leaks.',
    codeFile: 'src/db/queries.ts:114',
    codeSnippet: `// PERF-DB-004: Sequential N+1 query loop
- await Promise.all(users.map(u => fetchProfile(u.id)));
+ const profiles = await bulkFetchProfiles(userIds);`,
    photo: '/images/engineering/engineering-04.jpg',
    stats: 'N+1 Elimination · Memory Profiling · Zero Blocking',
  },
  {
    num: '04',
    id: 'maintainability',
    title: 'MAINTAINABILITY',
    tag: 'COMPLEXITY & CODE HEALTH',
    summary:
      'Calculates cyclomatic complexity, dead code branches, structural anti-patterns, deep inheritance, and excessive component coupling.',
    codeFile: 'src/utils/parser.ts:28',
    codeSnippet: `// MAINT-012: Function exceeds complexity threshold (24 > 15)
- function parsePayload(data) { ...24 branches... }
+ const parsed = parserStrategyPipeline.execute(data);`,
    photo: '/images/engineering/engineering-07.jpg',
    stats: 'Cyclomatic Index · Dead-Branch Pruning · Modularization',
  },
  {
    num: '05',
    id: 'architecture',
    title: 'ARCHITECTURE',
    tag: 'CONTRACT DRIFT & BOUNDARIES',
    summary:
      'Evaluates modular boundary violations, circular imports, breaking schema changes, and unintended service coupling across repositories.',
    codeFile: 'src/core/router.ts:89',
    codeSnippet: `// ARCH-007: Domain boundary violation detected
- import { internalBillingDao } from '@billing/dao';
+ import { BillingClient } from '@billing/client';`,
    photo: '/images/engineering/engineering-05.jpg',
    stats: 'Boundary Isolation · Circular Dependency Guard',
  },
]

export default function WhatWeReviewSection() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current || !trackRef.current) return

    const section = sectionRef.current
    const track = trackRef.current

    // Only apply horizontal scroll on desktop
    const isDesktop = window.innerWidth > 1024

    if (!isDesktop) return

    const ctx = gsap.context(() => {
      const scrollWidth = track.scrollWidth - window.innerWidth + 120

      gsap.to(track, {
        x: () => -scrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${scrollWidth + 400}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="what-we-review-section" id="capabilities">
      {/* Section Header */}
      <div className="what-we-review-header">
        <div className="header-meta-row">
          <span className="meta-index-tag">04 / AUDIT DOMAINS</span>
          <span className="meta-sep">/</span>
          <span className="meta-label">FULL-SPECTRUM ANALYSIS</span>
        </div>
        <div className="header-flex-row">
          <h2 className="what-we-review-title">WHAT WE REVIEW.</h2>
          <span className="header-scroll-hint">DRAG / SCROLL HORIZONTALLY →</span>
        </div>
      </div>

      {/* Horizontal Track (pinned on Desktop, stacked on Mobile) */}
      <div className="horizontal-track-wrapper">
        <div ref={trackRef} className="horizontal-track-container">
          {REVIEW_PILLARS.map((pillar) => (
            <div key={pillar.id} className="pillar-horizontal-panel">
              {/* Top Tag & Big Number */}
              <div className="pillar-top-row">
                <span className="pillar-giant-num">{pillar.num}</span>
                <span className="pillar-tag-pill">{pillar.tag}</span>
              </div>

              {/* Title & Summary */}
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-summary">{pillar.summary}</p>

              {/* Code Visualizer Preview Window */}
              <div className="pillar-code-window">
                <div className="code-window-topbar">
                  <div className="window-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <span className="code-window-file">{pillar.codeFile}</span>
                </div>
                <pre className="pillar-code-pre">
                  <code>{pillar.codeSnippet}</code>
                </pre>
              </div>

              {/* Engineering Photograph Background Card */}
              <div className="pillar-photo-container">
                <img
                  src={pillar.photo}
                  alt={`${pillar.title} inspection context`}
                  className="pillar-card-photo"
                  loading="lazy"
                  decoding="async"
                />
                <div className="photo-dark-overlay" />
                <div className="pillar-stats-badge">
                  <span className="stats-dot" />
                  <span>{pillar.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
