import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { numberCount, scaleIn, prefersReducedMotion } from '@/animations/motion'

export default function ReviewHeader({
  job,
  repo,
  result,
  findingsCount = 0,
  onReRun,
  reRunning = false,
  onExportReport,
}) {
  const navigate = useNavigate()
  const [copiedSha, setCopiedSha] = useState(false)
  const statusRef = useRef(null)
  const scoreRef = useRef(null)

  const repoFullName = repo?.full_name || repo?.name || job?.repositories?.full_name || job?.repositories?.name || 'Repository'
  const repoUrl = repo?.html_url || (job?.repositories?.name ? `https://github.com/${repoFullName}` : null)
  const branchName = job?.branch || repo?.default_branch || 'main'
  const commitSha = job?.commit_sha || ''
  const shortSha = commitSha ? commitSha.slice(0, 7) : 'head'
  const score = job?.quality_score != null ? Math.round(Number(job.quality_score)) : (result?.score != null ? Math.round(Number(result.score)) : 100)
  const status = job?.status || 'completed'

  // Animate status pill & quality score on mount or job change
  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      if (statusRef.current) {
        scaleIn(statusRef.current, { scale: 0.88, duration: 0.28, delay: 0.1 })
      }
      if (scoreRef.current) {
        numberCount(scoreRef.current, score, {
          duration: 0.6,
          ease: 'power2.out',
        })
      }
    })

    return () => ctx.revert()
  }, [job?.id, status, score])

  const handleCopySha = (e) => {
    e.stopPropagation()
    if (!commitSha) return
    navigator.clipboard.writeText(commitSha)
    setCopiedSha(true)
    setTimeout(() => setCopiedSha(false), 2000)
  }

  const formatReviewDate = (dateStr) => {
    if (!dateStr) return 'Just now'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getScoreColorClass = (scoreVal) => {
    if (scoreVal >= 85) return 'score-high'
    if (scoreVal >= 60) return 'score-mid'
    return 'score-low'
  }

  return (
    <header className="review-header">
      {/* Top Breadcrumb & Navigation */}
      <div className="review-header-nav">
        <button
          type="button"
          className="btn-back-nav"
          onClick={() => navigate('/dashboard')}
          title="Return to Dashboard"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Dashboard</span>
        </button>

        <span className="nav-breadcrumb-sep">/</span>
        <span className="nav-breadcrumb-crumb">Reviews</span>
        <span className="nav-breadcrumb-sep">/</span>
        <span className="nav-breadcrumb-current">{repoFullName}</span>
      </div>

      {/* Main Header Metadata & Actions Row */}
      <div className="review-header-main">
        {/* Left: Repo, Branch, Commit, Timestamp */}
        <div className="header-meta-group">
          <div className="header-title-row">
            <h1 className="header-repo-title">
              {repoUrl ? (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                  title="Open in GitHub"
                >
                  {repoFullName}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ) : (
                <span>{repoFullName}</span>
              )}
            </h1>

            {/* Overall Status Pill */}
            <div ref={statusRef} className={`status-pill ${status}`}>
              <span className={`status-dot ${status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'amber pulse'}`} />
              <span className="status-label">{status.toUpperCase()}</span>
            </div>
          </div>

          <div className="header-sub-meta">
            {/* Branch */}
            <div className="meta-pill branch-pill" title={`Monitored Branch: ${branchName}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              <span>{branchName}</span>
            </div>

            {/* Commit SHA */}
            <button
              type="button"
              className="meta-pill commit-pill"
              onClick={handleCopySha}
              title={`Commit ${commitSha} (Click to copy)`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <line x1="1.05" y1="12" x2="7" y2="12" />
                <line x1="17.01" y1="12" x2="22.96" y2="12" />
              </svg>
              <span>{shortSha}</span>
              <span className="copy-hint">{copiedSha ? '✓ Copied' : 'copy'}</span>
            </button>

            {/* Findings Count Tag */}
            {findingsCount > 0 && (
              <div className="meta-pill findings-pill" title={`${findingsCount} total issues identified`}>
                <span>{findingsCount} findings</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="meta-timestamp" title={job?.created_at}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatReviewDate(job?.created_at || job?.completed_at)}</span>
            </div>
          </div>
        </div>

        {/* Right: Quality Score Gauge & Action CTAs */}
        <div className="header-actions-group">
          {/* Quality Score Indicator */}
          <div className="quality-gauge-box">
            <div className="gauge-number-row">
              <span ref={scoreRef} className={`gauge-score ${getScoreColorClass(score)}`}>{score}</span>
              <span className="gauge-max">/100</span>
            </div>
            <span className="gauge-label">Quality Score</span>
          </div>

          {/* Action CTAs */}
          <div className="header-buttons-row">
            {onExportReport && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onExportReport}
                title="View and export executive review summary"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Report</span>
              </button>
            )}

            {onReRun && (
              <button
                type="button"
                className={`btn btn-primary btn-sm ${reRunning ? 'is-loading' : ''}`}
                onClick={onReRun}
                disabled={reRunning}
                title="Re-run autonomous code review"
              >
                {reRunning ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Re-run Review</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
