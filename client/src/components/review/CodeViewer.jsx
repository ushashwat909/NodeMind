import { useState, useMemo, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'

export default function CodeViewer({
  finding,
  repoUrl = null,
  branch = 'main',
}) {
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const bodyRef = useRef(null)
  const briefingRef = useRef(null)

  // Smooth transition when selected finding changes
  useEffect(() => {
    if (!finding?.id || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      if (briefingRef.current) {
        gsap.fromTo(
          briefingRef.current,
          { opacity: 0.85, y: 4 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
        )
      }

      if (bodyRef.current) {
        gsap.fromTo(
          bodyRef.current,
          { opacity: 0.88, y: 3 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
        )

        const errorRows = bodyRef.current.querySelectorAll('.code-line-row.is-highlighted-error')
        if (errorRows.length > 0) {
          gsap.fromTo(
            errorRows,
            { backgroundColor: 'rgba(239, 68, 68, 0.28)' },
            { backgroundColor: 'rgba(239, 68, 68, 0.12)', duration: 0.5, ease: 'power2.out' }
          )
        }
      }
    })

    return () => ctx.revert()
  }, [finding?.id])

  const filePath = finding?.file_path || 'source_file.ts'
  const lineStart = finding?.line_start || 1
  const lineEnd = finding?.line_end || lineStart
  const rawSnippet = finding?.snippet || '// No source snippet available for this finding.'

  // Process snippet into line items with line numbers
  const lines = useMemo(() => {
    const rawLines = rawSnippet.split('\n')
    const baseLine = Math.max(1, lineStart - Math.floor((rawLines.length - (lineEnd - lineStart + 1)) / 2))

    return rawLines.map((text, idx) => {
      const lineNum = baseLine + idx
      const isTarget = lineNum >= lineStart && lineNum <= lineEnd
      return {
        lineNum,
        text,
        isTarget,
      }
    })
  }, [rawSnippet, lineStart, lineEnd])

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(rawSnippet)
    setCopiedSnippet(true)
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  const githubFileUrl = repoUrl && filePath
    ? `${repoUrl}/blob/${branch}/${filePath}#L${lineStart}${lineEnd !== lineStart ? `-L${lineEnd}` : ''}`
    : null

  const getLanguageTag = (path) => {
    const ext = path.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'TypeScript'
      case 'js':
      case 'jsx':
        return 'JavaScript'
      case 'py':
        return 'Python'
      case 'go':
        return 'Go'
      case 'rs':
        return 'Rust'
      case 'json':
        return 'JSON'
      case 'sql':
        return 'SQL'
      default:
        return ext ? ext.toUpperCase() : 'Code'
    }
  }

  const cweNumber = finding?.cwe_id ? finding.cwe_id.replace(/^CWE-/i, '') : null

  return (
    <div className="code-viewer-container">
      {/* 1. At-A-Glance Finding Briefing */}
      {finding && (
        <div ref={briefingRef} className="finding-briefing-card">
          <div className="briefing-top-meta">
            <div className="briefing-badge-cluster">
              <span className={`finding-sev-badge sev-badge-${finding.severity?.toLowerCase()}`}>
                {finding.severity?.toUpperCase()}
              </span>
              {finding.category && (
                <span className="finding-cat-pill">{finding.category}</span>
              )}
              {finding.cwe_id && (
                <a
                  href={`https://cwe.mitre.org/data/definitions/${cweNumber}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="finding-cwe-pill clickable"
                  title="View MITRE CWE security standard"
                >
                  <span>{finding.cwe_id}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
              {finding.owasp_category && (
                <span className="finding-owasp-pill" title="OWASP Top 10 Security Category">
                  {finding.owasp_category}
                </span>
              )}
            </div>

            <div className="briefing-file-location">
              <code>{filePath}:{lineStart}</code>
            </div>
          </div>

          <h2 className="briefing-title-text">{finding.title}</h2>

          {/* Plain-English Impact / Risk Statement */}
          {finding.description && (
            <div className="briefing-risk-box">
              <div className="risk-box-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="risk-box-title">Why this matters & potential impact:</span>
              </div>
              <p className="risk-box-desc">{finding.description}</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Clean Source Code in Context */}
      <div className="code-viewer-panel">
        {/* Code Header Bar */}
        <div className="code-viewer-header">
          <div className="code-header-left">
            <svg className="code-file-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="code-filepath-text">{filePath}</span>
            <span className="code-lang-badge">{getLanguageTag(filePath)}</span>
            <span className="code-line-badge">
              {lineStart === lineEnd ? `Line ${lineStart}` : `Lines ${lineStart}–${lineEnd}`}
            </span>
          </div>

          <div className="code-header-actions">
            {/* Expand/Collapse Context */}
            <button
              type="button"
              className={`btn-code-action ${isExpanded ? 'active' : ''}`}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse surrounding context' : 'Expand full context snippet'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isExpanded ? (
                  <path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M10 4v6m0 0H4m6 0L3 3m10 7h6m0 0V4m0 6l7-7" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            </button>

            {/* View on GitHub */}
            {githubFileUrl && (
              <a
                href={githubFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-code-action"
                title="Open exact file and line on GitHub"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>GitHub</span>
              </a>
            )}

            {/* Copy Snippet */}
            <button
              type="button"
              className="btn-code-action copy"
              onClick={handleCopySnippet}
              title="Copy code snippet to clipboard"
            >
              {copiedSnippet ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: '#34d399' }}>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Viewer Body */}
        <div ref={bodyRef} className={`code-viewer-body ${isExpanded ? 'expanded' : ''}`}>
          <div className="code-table">
            {lines.map((line) => (
              <div
                key={line.lineNum}
                className={`code-line-row ${line.isTarget ? 'is-highlighted-error' : ''}`}
              >
                {/* Line Gutter */}
                <div className="line-gutter">
                  <span className="gutter-number">{line.lineNum}</span>
                  <span className="gutter-marker">
                    {line.isTarget && <span className="error-marker-dot" title="Flagged vulnerability line" />}
                  </span>
                </div>

                {/* Code Content */}
                <div className="line-code-content">
                  <pre className="code-text-pre">
                    <code>{line.text}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
