import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './NumberedSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const FLOW_STEPS = [
  {
    num: '01',
    title: 'CONNECT',
    subtitle: 'Repository Integration',
    desc: 'Connect any public or private GitHub repository. Select branch, PR, or commit target with zero persistent code cloning.',
    technicalTag: 'VCS REST / GRAPHQL',
  },
  {
    num: '02',
    title: 'ANALYZE',
    subtitle: 'Engine Execution',
    desc: 'The review engine processes file trees, evaluates security rulesets, checks OWASP benchmarks, and detects structural defects.',
    technicalTag: 'PARSER + SECURITY RULES',
  },
  {
    num: '03',
    title: 'UNDERSTAND',
    subtitle: 'Contextual Pinpointing',
    desc: 'Every finding is tied directly to the exact file path and line numbers, complete with severity scoring and blast-radius explanation.',
    technicalTag: 'CANONICAL CLASSIFICATION',
  },
  {
    num: '04',
    title: 'FIX',
    subtitle: 'Instant Mitigation',
    desc: 'Inspect the remediation logic, why the change matters, and copy verified unified diffs ready to apply before merge.',
    technicalTag: 'VERIFIED DIFF PATCHES',
  },
]

export default function NumberedSection() {
  const sectionRef = useRef(null)
  const itemsRef = useRef([])

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return

    const ctx = gsap.context(() => {
      itemsRef.current.forEach((item, idx) => {
        if (!item) return
        gsap.fromTo(
          item,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            delay: idx * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              once: true,
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="numbered-editorial-section" id="numbered-flow">
      <div className="numbered-container">
        {/* Editorial Section Header */}
        <div className="numbered-header-block">
          <div className="header-meta-row">
            <span className="meta-index-tag">SYSTEM WORKFLOW</span>
            <span className="meta-sep">/</span>
            <span className="meta-label">FOUR-STAGE AUDITING PIPELINE</span>
          </div>
          <h2 className="numbered-main-title">
            HOW NODEMIND
            <br />
            EXAMINES YOUR SOURCE.
          </h2>
        </div>

        {/* 4 Large Editorial Typographic Items */}
        <div className="numbered-grid-list">
          {FLOW_STEPS.map((step, idx) => (
            <div
              key={step.num}
              ref={(el) => (itemsRef.current[idx] = el)}
              className="numbered-item-block"
            >
              <div className="item-top-row">
                <span className="giant-step-number">{step.num}</span>
                <span className="item-tech-tag">{step.technicalTag}</span>
              </div>

              <div className="item-content-body">
                <h3 className="item-step-title">{step.title}</h3>
                <span className="item-step-subtitle">{step.subtitle}</span>
                <p className="item-step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
