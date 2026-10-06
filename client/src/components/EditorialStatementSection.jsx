import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './EditorialStatementSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function EditorialStatementSection() {
  const sectionRef = useRef(null)
  const line1Ref = useRef(null)
  const line2Ref = useRef(null)
  const line3Ref = useRef(null)
  const subtextRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return

    const section = sectionRef.current
    const line1 = line1Ref.current
    const line2 = line2Ref.current
    const line3 = line3Ref.current
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
        [line1, line2, line3],
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }
      ).fromTo(subtext, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="editorial-statement-section" aria-label="Philosophy Statement">
      <div className="statement-container">
        <div className="statement-meta-row">
          <span className="statement-tag">02 / CORE THESIS</span>
          <span className="statement-sep">/</span>
          <span className="statement-meta">CROSS-FILE SEMANTIC GRAPH</span>
        </div>

        <h2 className="statement-large-headline">
          <span ref={line1Ref} className="statement-line">
            CODE CHANGES.
          </span>
          <span ref={line2Ref} className="statement-line accent-line">
            SO DO
          </span>
          <span ref={line3Ref} className="statement-line">
            THE RISKS.
          </span>
        </h2>

        <div ref={subtextRef} className="statement-subtext-block">
          <p className="statement-subtext">
            Line-by-line diffs miss the architectural blast radius. We construct the full AST
            symbol dependency graph to catch the defects that surface three files away.
          </p>
        </div>
      </div>
    </section>
  )
}
