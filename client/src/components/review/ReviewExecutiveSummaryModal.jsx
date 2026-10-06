import { useState, useEffect, useRef } from 'react'
import { modalReveal, prefersReducedMotion } from '@/animations/motion'

export default function ReviewExecutiveSummaryModal({
  isOpen = false,
  onClose,
  job,
  result,
}) {
  const [copied, setCopied] = useState(false)
  const backdropRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    if (isOpen && cardRef.current) {
      modalReveal(cardRef.current, backdropRef.current)
    }
  }, [isOpen])

  if (!isOpen) return null

  const summaryMarkdown = result?.summary_markdown || `### Autonomous Code Review Executive Summary
- **Repository**: ${job?.repositories?.full_name || job?.repositories?.name || 'Repository'}
- **Branch**: ${job?.branch || 'main'}
- **Commit**: ${job?.commit_sha?.slice(0, 7) || 'HEAD'}
- **Quality Score**: **${Math.round(job?.quality_score || 100)}/100**
- **Status**: ${job?.status?.toUpperCase()}

#### Severity Breakdown
- Critical: ${job?.critical_count || 0}
- High: ${job?.high_count || 0}
- Medium: ${job?.medium_count || 0}
- Low: ${job?.low_count || 0}
- Info: ${job?.info_count || 0}
`

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([summaryMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `review-summary-${job?.commit_sha?.slice(0, 7) || 'latest'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    if (cardRef.current && !prefersReducedMotion()) {
      const modal = modalReveal(cardRef.current, backdropRef.current)
      if (modal?.close) {
        modal.close(onClose)
        return
      }
    }
    onClose()
  }

  return (
    <div ref={backdropRef} className="summary-modal-backdrop" onClick={handleClose}>
      <div ref={cardRef} className="summary-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="summary-modal-header">
          <div className="modal-title-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3>Executive Review Summary & Markdown Report</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="summary-modal-body">
          <pre className="summary-markdown-pre">
            <code>{summaryMarkdown}</code>
          </pre>
        </div>

        <div className="summary-modal-footer">
          <div className="footer-left">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownload}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download .md</span>
            </button>
          </div>

          <div className="footer-right">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied Markdown' : 'Copy Markdown'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
