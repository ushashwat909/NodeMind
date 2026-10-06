import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/animations/motion'
import './HowItWorks.css'

const steps = [
  {
    step: '01',
    title: 'Connect Repository',
    subtitle: 'Zero-config GitHub & GitLab integration',
    description:
      'Authorize the Code Review Agent GitHub App or plug our 8-line workflow into your CI pipeline. Scans pull requests immediately upon creation.',
    tags: ['GitHub App', 'GitLab CI', 'CLI Webhooks'],
    codeSnippet: 'git: pull_request.opened -> trigger AST scan',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Analyze Code',
    subtitle: 'Deep AST & semantic taint tracing',
    description:
      'Our engine constructs an in-memory Abstract Syntax Tree, traces control-flow graphs, audits API contracts, and identifies logic traps and vulnerabilities.',
    tags: ['AST Traversal', 'Control Flow Graph', 'Cross-File Scope'],
    codeSnippet: 'ast.traverse({ MutationScope, AsyncLocks })',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Review Findings',
    subtitle: 'Actionable inline diffs & PR gates',
    description:
      'Get precise inline comments with verified, syntax-valid remediation diffs. Merge patches with one click and enforce quality gates before merging.',
    tags: ['Verified Diffs', 'PR Status Check', '1-Click Merge'],
    codeSnippet: 'pr.comment({ line: 49, patch: verifiedDiff })',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
  },
]

export default function HowItWorks() {
  const sectionRef = useRef(null)
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
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      // Restrained subtle stagger reveal
      gsap.from(cardsRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="how-it-works-section" id="how-it-works" ref={sectionRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            How It Works
          </span>
          <h2 className="section-heading">Three steps from commit to verified code.</h2>
          <p className="section-description">
            No bloated configuration files. No noisy false alarms. Code Review Agent hooks straight into your existing review cycle.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="steps-grid">
          {steps.map((item, idx) => (
            <div
              key={item.step}
              className="step-card glass-panel"
              ref={(el) => (cardsRef.current[idx] = el)}
            >
              {/* Step indicator header */}
              <div className="step-card-header">
                <div className="step-badge">{item.step}</div>
                <div className="step-icon-wrap">{item.icon}</div>
              </div>

              {/* Step Title & Subtitle */}
              <h3 className="step-title">{item.title}</h3>
              <p className="step-subtitle">{item.subtitle}</p>

              {/* Description */}
              <p className="step-desc">{item.description}</p>

              {/* Terminal / Code hint */}
              <div className="step-terminal-pill">
                <span className="terminal-dot" />
                <code>{item.codeSnippet}</code>
              </div>

              {/* Tags */}
              <div className="step-tags-wrap">
                {item.tags.map((tag) => (
                  <span key={tag} className="step-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
