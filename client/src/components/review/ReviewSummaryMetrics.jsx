import { useEffect, useRef } from 'react'
import { gsap, numberCount, staggerReveal, prefersReducedMotion } from '@/animations/gsap'

export default function ReviewSummaryMetrics({
  totalFindings = 0,
  criticalCount = 0,
  highCount = 0,
  mediumCount = 0,
  lowCount = 0,
  infoCount = 0,
  filesCount = 1,
  linesCount = 0,
  activeSeverityFilter = 'all',
  onSelectSeverity,
}) {
  const totalRef = useRef(null)
  const criticalRef = useRef(null)
  const highRef = useRef(null)
  const mediumRef = useRef(null)
  const lowRef = useRef(null)
  const filesRef = useRef(null)
  const containerRef = useRef(null)

  // Animated Restrained Counters via GSAP with React cleanup
  useEffect(() => {
    if (prefersReducedMotion()) {
      if (totalRef.current) totalRef.current.textContent = totalFindings
      if (criticalRef.current) criticalRef.current.textContent = criticalCount
      if (highRef.current) highRef.current.textContent = highCount
      if (mediumRef.current) mediumRef.current.textContent = mediumCount
      if (lowRef.current) lowRef.current.textContent = lowCount + infoCount
      if (filesRef.current) filesRef.current.textContent = filesCount
      return
    }

    const ctx = gsap.context(() => {
      const targets = [
        { ref: totalRef, value: totalFindings },
        { ref: criticalRef, value: criticalCount },
        { ref: highRef, value: highCount },
        { ref: mediumRef, value: mediumCount },
        { ref: lowRef, value: lowCount + infoCount },
        { ref: filesRef, value: filesCount },
      ]

      targets.forEach(({ ref, value }) => {
        if (ref.current) {
          numberCount(ref.current, value, { duration: 0.5, startValue: 0 })
        }
      })

      // Container entrance stagger
      if (containerRef.current) {
        staggerReveal(containerRef.current.children, { y: 8, duration: 0.28, stagger: 0.03 })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [totalFindings, criticalCount, highCount, mediumCount, lowCount, infoCount, filesCount])

  return (
    <div className="review-summary-bar" ref={containerRef}>
      {/* 1. Total Findings */}
      <button
        type="button"
        className={`summary-metric-card ${activeSeverityFilter === 'all' ? 'active' : ''}`}
        onClick={() => onSelectSeverity && onSelectSeverity('all')}
        title="View all findings"
      >
        <div className="metric-top">
          <span className="metric-title">Total Findings</span>
          <span className="metric-bullet total" />
        </div>
        <div className="metric-count-row">
          <span className="metric-counter" ref={totalRef}>
            {totalFindings}
          </span>
          <span className="metric-unit">issues</span>
        </div>
      </button>

      {/* 2. Critical Findings */}
      <button
        type="button"
        className={`summary-metric-card critical ${activeSeverityFilter === 'critical' ? 'active' : ''}`}
        onClick={() => onSelectSeverity && onSelectSeverity('critical')}
        title="Filter Critical severity findings"
      >
        <div className="metric-top">
          <span className="metric-title">Critical</span>
          <span className="metric-bullet critical" />
        </div>
        <div className="metric-count-row">
          <span className="metric-counter critical-text" ref={criticalRef}>
            {criticalCount}
          </span>
          <span className="metric-caption-pill danger">Blocker</span>
        </div>
      </button>

      {/* 3. High Findings */}
      <button
        type="button"
        className={`summary-metric-card high ${activeSeverityFilter === 'high' ? 'active' : ''}`}
        onClick={() => onSelectSeverity && onSelectSeverity('high')}
        title="Filter High severity findings"
      >
        <div className="metric-top">
          <span className="metric-title">High</span>
          <span className="metric-bullet high" />
        </div>
        <div className="metric-count-row">
          <span className="metric-counter high-text" ref={highRef}>
            {highCount}
          </span>
          <span className="metric-caption-pill warning">High risk</span>
        </div>
      </button>

      {/* 4. Medium Findings */}
      <button
        type="button"
        className={`summary-metric-card medium ${activeSeverityFilter === 'medium' ? 'active' : ''}`}
        onClick={() => onSelectSeverity && onSelectSeverity('medium')}
        title="Filter Medium severity findings"
      >
        <div className="metric-top">
          <span className="metric-title">Medium</span>
          <span className="metric-bullet medium" />
        </div>
        <div className="metric-count-row">
          <span className="metric-counter medium-text" ref={mediumRef}>
            {mediumCount}
          </span>
          <span className="metric-caption-pill caution">Caution</span>
        </div>
      </button>

      {/* 5. Low / Info Findings */}
      <button
        type="button"
        className={`summary-metric-card low ${activeSeverityFilter === 'low' ? 'active' : ''}`}
        onClick={() => onSelectSeverity && onSelectSeverity('low')}
        title="Filter Low and Informational findings"
      >
        <div className="metric-top">
          <span className="metric-title">Low & Info</span>
          <span className="metric-bullet low" />
        </div>
        <div className="metric-count-row">
          <span className="metric-counter low-text" ref={lowRef}>
            {lowCount + infoCount}
          </span>
          <span className="metric-caption-pill info">Hygiene</span>
        </div>
      </button>

      {/* 6. Files Reviewed */}
      <div className="summary-metric-card neutral files-card" title="Total codebase files analyzed">
        <div className="metric-top">
          <span className="metric-title">Files Analyzed</span>
          <span className="metric-bullet neutral" />
        </div>
        <div className="metric-count-row">
          <span className="metric-counter" ref={filesRef}>
            {filesCount}
          </span>
          <span className="metric-unit">{linesCount ? `${linesCount} LOC` : 'files'}</span>
        </div>
      </div>
    </div>
  )
}
