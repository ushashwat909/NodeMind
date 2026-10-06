import { useEffect, useRef, memo } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'

function FindingCard({
  finding,
  isSelected = false,
  onSelect,
}) {
  const cardRef = useRef(null)
  const railRef = useRef(null)

  // Selection rail entrance animation
  useEffect(() => {
    if (isSelected && railRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        railRef.current,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.22, ease: 'power2.out', transformOrigin: 'top center' }
      )
    }
  }, [isSelected])

  const handleClick = () => {
    if (onSelect) {
      if (!prefersReducedMotion() && cardRef.current) {
        gsap.fromTo(cardRef.current, { scale: 0.985 }, { scale: 1, duration: 0.16, ease: 'power2.out' })
      }
      onSelect(finding)
    }
  }

  const {
    id,
    severity = 'medium',
    category = 'maintainability',
    title = 'Code Finding',
    file_path = '',
    line_start = 1,
    line_end = 1,
    description = '',
    cwe_id,
    status = 'open',
  } = finding

  const lineDisplay = line_start === line_end ? `L${line_start}` : `L${line_start}-${line_end}`
  const fileName = file_path ? file_path.split('/').pop() : 'file'
  const dirPath = file_path && file_path.includes('/') ? file_path.substring(0, file_path.lastIndexOf('/') + 1) : ''

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'sev-badge-critical'
      case 'high':
        return 'sev-badge-high'
      case 'medium':
        return 'sev-badge-medium'
      case 'low':
        return 'sev-badge-low'
      case 'info':
        return 'sev-badge-info'
      default:
        return 'sev-badge-medium'
    }
  }

  return (
    <article
      ref={cardRef}
      id={`finding-card-${id}`}
      className={`finding-card ${isSelected ? 'selected' : ''} ${status === 'resolved' ? 'is-resolved' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      aria-label={`${severity} finding: ${title} in ${file_path} at line ${line_start}`}
    >
      {/* Top Header Row: Severity Badge, Category, Status, CWE */}
      <div className="card-top-row">
        <div className="card-tags-group">
          {/* Severity Badge */}
          <span className={`finding-sev-badge ${getSeverityBadgeClass(severity)}`}>
            {severity.toUpperCase()}
          </span>

          {/* Category Pill */}
          <span className="finding-cat-pill">
            {category}
          </span>

          {/* CWE Tag */}
          {cwe_id && (
            <span className="finding-cwe-pill" title={`Common Weakness Enumeration: ${cwe_id}`}>
              {cwe_id}
            </span>
          )}
        </div>

        {/* Status indicator */}
        <div className="card-status-pill">
          {status === 'resolved' && <span className="status-badge-resolved">✓ Resolved</span>}
          {status === 'dismissed' && <span className="status-badge-dismissed">Dismissed</span>}
          {status === 'open' && isSelected && <span className="active-marker-indicator" />}
        </div>
      </div>

      {/* Title */}
      <h3 className="card-title-text">{title}</h3>

      {/* File & Line Location */}
      <div className="card-location-row">
        <svg className="location-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
        <span className="card-file-path" title={file_path}>
          {dirPath && <span className="card-dir-prefix">{dirPath}</span>}
          <span className="card-file-name">{fileName}</span>
        </span>
        <span className="card-line-badge">{lineDisplay}</span>
      </div>

      {/* Short Explanation */}
      {description && (
        <p className="card-explanation-text">
          {description.length > 130 ? `${description.slice(0, 130)}...` : description}
        </p>
      )}

      {/* Selected Indicator Rail */}
      {isSelected && (
        <div ref={railRef} className="selected-indicator-rail" aria-hidden="true" />
      )}
    </article>
  )
}

export default memo(FindingCard)
