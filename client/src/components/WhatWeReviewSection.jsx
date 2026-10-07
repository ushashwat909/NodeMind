import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import WhatWeReviewModal from './WhatWeReviewModal'
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
    fullDescription:
      'Our AST analysis kernel inspects all syntax trees and execution branches to intercept critical CVEs and OWASP Top 10 vulnerabilities before pull requests touch production. It flags cryptographic entropy decay, insecure deserialization, SQL injection in parameterized ORMs, and accidental credential leakage without ever cloning or persisting your source code on disk.',
    keyRules: [
      'CWE-798: Hardcoded secret keys & fallback JWT secrets',
      'CWE-89: Unsanitized SQL & NoSQL injection parameters',
      'CWE-918: Server-Side Request Forgery (SSRF) route vectors',
      'CWE-384: Permissive session fixation & CORS origin drift',
    ],
    codeFile: 'src/services/auth.ts:48',
    codeSnippet: `// CWE-798: Hardcoded secret key fallback
- const key = process.env.SECRET || 'dev_secret_key';
+ const key = getRequiredSecret('SECRET');`,
    photo: '/images/engineering/engineering-01.jpg',
    stats: 'CWE-798 · CWE-89 · CWE-918 · OWASP Benchmarks',
    badgeText: 'SECURITY CRITICAL',
    auditFrequency: 'Per Commit & Webhook',
  },
  {
    num: '02',
    id: 'bugs',
    title: 'BUGS & DEFECTS',
    tag: 'LOGIC & RUNTIME SAFETY',
    summary:
      'Detects null pointer dereferences, race conditions, unhandled promise rejections, type coercion traps, and edge-case exceptions.',
    fullDescription:
      'Catches runtime anomalies, asynchronous race conditions, and swallowed promise rejections that routinely bypass unit test suites. Static type-flow verification ensures null pointers, optional chaining traps, and JavaScript loose equality coercion hazards are flagged with exact lines of failure.',
    keyRules: [
      'Null pointer dereference & unchecked optional chaining',
      'Unhandled promise rejections & empty catch blocks',
      'Loose equality (==) type coercion in financial states',
      'Event loop race conditions in parallel worker threads',
    ],
    codeFile: 'src/api/handler.ts:32',
    codeSnippet: `// Type Coercion Trap in Payment Status
- if (order.status == 0) markRefunded();
+ if (order.status === OrderStatus.PENDING) ...`,
    photo: '/images/engineering/engineering-06.jpg',
    stats: 'Null Dereference · Race Conditions · State Leaks',
    badgeText: 'RUNTIME SAFETY',
    auditFrequency: 'AST Semantic Flow',
  },
  {
    num: '03',
    id: 'performance',
    title: 'PERFORMANCE',
    tag: 'LATENCY & EVENT LOOP',
    summary:
      'Identifies sequential N+1 database queries, blocking CPU loops, unindexed scans, unbounded memory buffers, and connection leaks.',
    fullDescription:
      'Isolates hidden database latency, unindexed scans, and sequential N+1 query waterfalls. Monitors memory allocations, unreleased client pools, and synchronous CPU operations blocking Node.js and Go event loops to guarantee sub-50ms API response budgets.',
    keyRules: [
      'Sequential N+1 queries mapped inside async loops',
      'Unbounded array buffers provoking heap memory bloat',
      'CPU-heavy regex calculations stalling event loop execution',
      'Unclosed database transactions & client pool starvation',
    ],
    codeFile: 'src/db/queries.ts:114',
    codeSnippet: `// PERF-DB-004: Sequential N+1 query loop
- await Promise.all(users.map(u => fetchProfile(u.id)));
+ const profiles = await bulkFetchProfiles(userIds);`,
    photo: '/images/engineering/engineering-04.jpg',
    stats: 'N+1 Elimination · Memory Profiling · Zero Blocking',
    badgeText: 'HIGH THROUGHPUT',
    auditFrequency: 'Micro-benchmark AST',
  },
  {
    num: '04',
    id: 'maintainability',
    title: 'MAINTAINABILITY',
    tag: 'COMPLEXITY & CODE HEALTH',
    summary:
      'Calculates cyclomatic complexity, dead code branches, structural anti-patterns, deep inheritance, and excessive component coupling.',
    fullDescription:
      'Calculates structural cyclomatic complexity, cognitive load index, and modular cohesion across multi-file repositories. Highlights dead code branches, god-objects, and unwieldy parameter signatures to prevent tech debt accumulation and facilitate rapid engineer onboarding.',
    keyRules: [
      'Cyclomatic complexity index exceeding threshold (> 15)',
      'Dead code branches, unreachable statements, unused imports',
      'Deep nesting & callback pyramid anti-patterns',
      'Excessive component coupling violating Single Responsibility',
    ],
    codeFile: 'src/utils/parser.ts:28',
    codeSnippet: `// MAINT-012: Function exceeds complexity threshold (24 > 15)
- function parsePayload(data) { ...24 branches... }
+ const parsed = parserStrategyPipeline.execute(data);`,
    photo: '/images/engineering/engineering-07.jpg',
    stats: 'Cyclomatic Index · Dead-Branch Pruning · Modularization',
    badgeText: 'HEALTH & REFACTOR',
    auditFrequency: 'Cognitive Complexity Metric',
  },
  {
    num: '05',
    id: 'architecture',
    title: 'ARCHITECTURE',
    tag: 'CONTRACT DRIFT & BOUNDARIES',
    summary:
      'Evaluates modular boundary violations, circular imports, breaking schema changes, and unintended service coupling across repositories.',
    fullDescription:
      'Guarantees system boundary separation and cross-service decoupling. Flags breaking GraphQL and REST schema changes, circular module dependencies, and direct database queries from client-facing controllers that violate enterprise hexagonal architecture rules.',
    keyRules: [
      'Domain boundary violations bypassing interface contracts',
      'Circular dependency cycles causing runtime module failure',
      'Breaking schema modifications on public endpoints',
      'Controller-to-DAO layer leaks breaking Clean Architecture',
    ],
    codeFile: 'src/core/router.ts:89',
    codeSnippet: `// ARCH-007: Domain boundary violation detected
- import { internalBillingDao } from '@billing/dao';
+ import { BillingClient } from '@billing/client';`,
    photo: '/images/engineering/engineering-05.jpg',
    stats: 'Boundary Isolation · Circular Dependency Guard',
    badgeText: 'ENTERPRISE DOMAIN',
    auditFrequency: 'Dependency Graph Engine',
  },
]

export default function WhatWeReviewSection() {
  const [selectedPillar, setSelectedPillar] = useState(null)
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
      // 1. Calculate the exact horizontal travel so all 5 cards progress through view
      // and Card 05 (Point 05 - Architecture) settles in prime center stage.
      const getHorizontalTravel = () => {
        return Math.max(0, track.scrollWidth - window.innerWidth)
      }

      // 2. Total vertical pinning distance:
      // Includes the full travel across all 5 cards PLUS an intentional resting dwell
      // so Point 05 is completely still, legible, and finished BEFORE the next section scrolls up ("eatup effect").
      const getPinDistance = () => Math.round(getHorizontalTravel() * 1.25 + 600)

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getPinDistance()}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })

      // Phase 1: Smooth horizontal scrub through points 01 -> 02 -> 03 -> 04 -> 05
      tl.to(track, {
        x: () => -getHorizontalTravel(),
        ease: 'none',
        duration: 1,
      })

      // Phase 2: Completion dwell on Point 05 (Architecture).
      // All cards are 100% complete. Point 05 remains fully visible and resting in view.
      // Only after this dwell completes does the unpin happen and the next section slides up ("eatup effect").
      tl.to({}, { duration: 0.45 })

      const timer = setTimeout(() => {
        ScrollTrigger.refresh()
      }, 300)

      return () => clearTimeout(timer)
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
            <div
              key={pillar.id}
              className="pillar-horizontal-panel is-clickable"
              onClick={() => setSelectedPillar(pillar)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedPillar(pillar)
                }
              }}
              aria-label={`Inspect ${pillar.title} specifications`}
            >
              {/* Top Tag & Big Number */}
              <div className="pillar-top-row">
                <span className="pillar-giant-num">{pillar.num}</span>
                <div className="pillar-top-badges">
                  <span className="pillar-tag-pill">{pillar.tag}</span>
                  <span className="pillar-expand-hint">INSPECT SPECS ↗</span>
                </div>
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

      {/* Jesper Landberg-Style Detailed Specification Flight Sheet */}
      {selectedPillar && (
        <WhatWeReviewModal
          pillar={selectedPillar}
          allPillars={REVIEW_PILLARS}
          onClose={() => setSelectedPillar(null)}
          onSelectPillar={(p) => setSelectedPillar(p)}
        />
      )}
    </section>
  )
}

