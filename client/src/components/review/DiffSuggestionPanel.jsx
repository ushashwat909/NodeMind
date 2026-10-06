import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'

export default function DiffSuggestionPanel({
  finding,
  onUpdateStatus,
  updatingStatus = false,
}) {
  const [copiedFix, setCopiedFix] = useState(false)
  const [copiedOriginal, setCopiedOriginal] = useState(false)
  const [viewMode, setViewMode] = useState('diff') // 'diff' | 'side-by-side'
  const workspaceRef = useRef(null)

  const {
    id,
    title = 'Remediation Suggestion',
    snippet = '',
    suggested_fix = '',
    recommendation = '',
    description = '',
    cwe_id,
    owasp_category,
    status = 'open',
  } = finding || {}

  useEffect(() => {
    if (!workspaceRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        workspaceRef.current,
        { opacity: 0.85, y: 3 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      )
    }, workspaceRef)

    return () => ctx.revert()
  }, [id, viewMode])

  if (!finding) {
    return (
      <div className="diff-panel-empty">
        <p>Select a finding to inspect source code and remediation recommendations.</p>
      </div>
    )
  }

  // Handle single line or target code from snippet
  const currentLines = snippet ? snippet.split('\n') : []
  const suggestedLines = suggested_fix ? suggested_fix.split('\n') : []

  const handleCopyFix = () => {
    if (!suggested_fix) return
    navigator.clipboard.writeText(suggested_fix)
    setCopiedFix(true)
    setTimeout(() => setCopiedFix(false), 2000)
  }

  const handleCopyOriginal = () => {
    if (!snippet) return
    navigator.clipboard.writeText(snippet)
    setCopiedOriginal(true)
    setTimeout(() => setCopiedOriginal(false), 2000)
  }

  return (
    <div className="diff-suggestion-panel">
      {/* Panel Top Header */}
      <div className="diff-panel-header">
        <div className="diff-title-group">
          <div className="diff-header-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Remediation & Proposed Fix</span>
          </div>
          <span className="diff-finding-label">{title}</span>
        </div>

        {/* View mode toggle & Action CTA */}
        <div className="diff-controls-group">
          <div className="diff-view-modes">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setViewMode('diff')}
            >
              Unified Diff
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side-by-Side
            </button>
          </div>

          {/* Status Buttons */}
          <div className="diff-status-actions">
            {status !== 'resolved' ? (
              <button
                type="button"
                className="btn btn-secondary btn-xs btn-resolve"
                onClick={() => onUpdateStatus && onUpdateStatus(id, 'resolved')}
                disabled={updatingStatus}
                title="Mark this finding as resolved"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Resolve</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-xs btn-reopen"
                onClick={() => onUpdateStatus && onUpdateStatus(id, 'open')}
                disabled={updatingStatus}
                title="Reopen finding"
              >
                Reopen
              </button>
            )}

            {status !== 'dismissed' && (
              <button
                type="button"
                className="btn btn-secondary btn-xs btn-dismiss"
                onClick={() => onUpdateStatus && onUpdateStatus(id, 'dismissed')}
                disabled={updatingStatus}
                title="Dismiss finding as false positive or acceptable risk"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Code Comparison Workspace */}
      <div ref={workspaceRef} className="diff-comparison-workspace">
        {suggested_fix ? (
          viewMode === 'diff' ? (
            /* Unified Diff View */
            <div className="diff-unified-box">
              <div className="diff-box-bar">
                <span className="diff-bar-title">Proposed Patch</span>
                <button
                  type="button"
                  className="btn-copy-fix"
                  onClick={handleCopyFix}
                  title="Copy suggested replacement code"
                >
                  {copiedFix ? '✓ Copied Fix!' : 'Copy Fix'}
                </button>
              </div>

              <div className="diff-code-stream">
                {/* Current / Original lines marked with - */}
                {currentLines.map((line, idx) => (
                  <div key={`del-${idx}`} className="diff-line-row del">
                    <span className="diff-gutter del">-</span>
                    <pre className="diff-pre">
                      <code>{line}</code>
                    </pre>
                  </div>
                ))}

                {/* Suggested replacement lines marked with + */}
                {suggestedLines.map((line, idx) => (
                  <div key={`add-${idx}`} className="diff-line-row add">
                    <span className="diff-gutter add">+</span>
                    <pre className="diff-pre">
                      <code>{line}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Side-by-Side View */
            <div className="diff-side-by-side-grid">
              {/* Current Code Column */}
              <div className="side-column current">
                <div className="side-column-header">
                  <span className="column-title">Current Code</span>
                  <button
                    type="button"
                    className="btn-copy-code-mini"
                    onClick={handleCopyOriginal}
                  >
                    {copiedOriginal ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="side-code-body del">
                  {currentLines.map((line, idx) => (
                    <div key={idx} className="side-line-row">
                      <span className="side-gutter-num">{idx + 1}</span>
                      <pre className="side-pre">
                        <code>{line}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Code Column */}
              <div className="side-column suggested">
                <div className="side-column-header">
                  <span className="column-title">Suggested Code</span>
                  <button
                    type="button"
                    className="btn-copy-code-mini highlight"
                    onClick={handleCopyFix}
                  >
                    {copiedFix ? '✓ Copied Fix!' : 'Copy Fix'}
                  </button>
                </div>
                <div className="side-code-body add">
                  {suggestedLines.map((line, idx) => (
                    <div key={idx} className="side-line-row">
                      <span className="side-gutter-num">{idx + 1}</span>
                      <pre className="side-pre">
                        <code>{line}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="no-fix-callout">
            <p>Automatic code patch is not generated for this heuristic. Please follow the guidance below.</p>
          </div>
        )}
      </div>

      {/* "Why this change helps" & Explanation Section */}
      <div className="why-change-helps-section">
        <h4 className="why-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Why this change helps
        </h4>

        {recommendation && (
          <div className="recommendation-content-block">
            <p className="rec-text">{recommendation}</p>
          </div>
        )}

        {description && description !== recommendation && (
          <p className="rec-subtext">{description}</p>
        )}

        {/* References & Standards Badges */}
        {(cwe_id || owasp_category) && (
          <div className="remediation-references-row">
            <span className="ref-label">Standards & Compliance:</span>
            {cwe_id && (
              <a
                href={`https://cwe.mitre.org/data/definitions/${cwe_id.replace('CWE-', '')}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="ref-pill cwe"
                title="View MITRE CWE definition"
              >
                <span>{cwe_id}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
            {owasp_category && (
              <span className="ref-pill owasp" title="OWASP Top 10 Category">
                {owasp_category}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
