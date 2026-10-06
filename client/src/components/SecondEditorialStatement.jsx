import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './SecondEditorialStatement.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function SecondEditorialStatement() {
  const sectionRef = useRef(null)
  const line1Ref = useRef(null)
  const line2Ref = useRef(null)
  const subtextRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return

    const section = sectionRef.current
    const line1 = line1Ref.current
    const line2 = line2Ref.current
    const subtext = subtextRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true,
        },
        defaults: { ease: 'power3.out' },
      })

      tl.fromTo(
        [line1, line2],
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }
      ).fromTo(subtext, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="second-statement-section" aria-label="Commitment Statement">
      <div className="second-statement-container">
        <div className="second-statement-meta">
          <span className="meta-tag">06 / VERIFIABILITY</span>
          <span className="meta-sep">/</span>
          <span className="meta-label">ACTIONABLE SECURITY REMEDIATION</span>
        </div>

        <h2 className="second-statement-headline">
          <span ref={line1Ref} className="headline-line">
            SHIP WITH
          </span>
          <span ref={line2Ref} className="headline-line highlight-accent">
            CONTEXT.
          </span>
        </h2>

        <div ref={subtextRef} className="second-statement-sub-wrap">
          <p className="second-statement-sub">
            Every finding is bound to exact line numbers with blast-radius explanations, CWE
            references, and copy-ready unified patches. No speculative noise. Just verified
            engineering clarity.
          </p>
        </div>
      </div>
    </section>
  )
}
