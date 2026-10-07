import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableSkeleton, MetricsSkeleton } from '@/components/common/Skeletons'
import gsap from 'gsap'
import { staggerReveal, prefersReducedMotion } from '@/animations/motion'
import './OverviewView.css'

export default function OverviewView({
  metrics,
  recentJobs = [],
  repositories = [],
  loadingData,
  dataError = null,
  onRetrySync = null,
  onOpenConnectModal,
  onTriggerReview,
  triggeringReviewId,
  onSelectReview,
  onNavigateToTab,
  onShowIntro,
  userName = 'Architect',
}) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const cardRefs = useRef([])

  // Interactive 3D mouse tilt on metric cards
  const handleCardMouseMove = useCallback((e, index) => {
    const card = cardRefs.current[index]
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`)
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`)
  }, [])

  const handleCardMouseLeave = useCallback((index) => {
    const card = cardRefs.current[index]
    if (!card) return
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)'
  }, [])

  useEffect(() => {
    if (loadingData || !containerRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const elements = containerRef.current.querySelectorAll('.animate-fade-in')
      if (elements.length > 0) {
        staggerReveal(elements, {
          y: 12,
          duration: 0.35,
          stagger: 0.05,
          ease: 'power2.out',
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [loadingData])

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="overview-view" ref={containerRef}>
      {/* 1. Command Telemetry Banner */}
      <div className="overview-command-banner animate-fade-in">
        <div className="banner-telemetry-left">
          <span className="banner-meta-tag">Code Review & Security Analysis</span>
          <h1 className="banner-heading-title">
            Overview <span className="banner-user-greet">· {userName}</span>
          </h1>
          <div className="banner-badges-strip">
            <span className="telemetry-chip">
              <span className="chip-dot-green" />
              AST Engine Active
            </span>
            <span className="telemetry-chip">
              🛡️ Zero-Code Retention
            </span>
            <span className="telemetry-chip">
              ⚡ OWASP Top 10 Rules Active
            </span>
          </div>
        </div>

        <div className="banner-actions-right">
          {onShowIntro && (
            <button
              type="button"
              className="banner-replay-btn"
              onClick={onShowIntro}
              title="Experience the 3D 'WE ARE NODEMIND' cinematic intro"
            >
              <span>⚡</span>
              <span>We Are NodeMind</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenConnectModal}
          >
            + Connect Repo
          </button>
        </div>
      </div>

      {/* 2. 3D Cyber-Metrics Grid */}
      {loadingData ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="cyber-metrics-grid animate-fade-in">
          {/* Metric 1: Repositories */}
          <div
            ref={(el) => (cardRefs.current[0] = el)}
            className="cyber-metric-card accent-cyan"
            onMouseMove={(e) => handleCardMouseMove(e, 0)}
            onMouseLeave={() => handleCardMouseLeave(0)}
          >
            <div className="card-top-row">
              <span className="card-index-kicker">Repositories</span>
              <span className="card-badge-pill cyan">MONITORED</span>
            </div>
            <div>
              <p className="card-title-label">Connected Repos</p>
              <div className="card-numeric-display">
                <span className="card-big-num">{metrics.totalRepos}</span>
              </div>
            </div>
            <p className="card-caption-text">
              {metrics.totalRepos === 1 ? '1 active repository linked' : `${metrics.totalRepos} active repositories linked`}
            </p>
          </div>

          {/* Metric 2: Reviews Completed */}
          <div
            ref={(el) => (cardRefs.current[1] = el)}
            className="cyber-metric-card accent-violet"
            onMouseMove={(e) => handleCardMouseMove(e, 1)}
            onMouseLeave={() => handleCardMouseLeave(1)}
          >
            <div className="card-top-row">
              <span className="card-index-kicker">Code Reviews</span>
              <span className="card-badge-pill violet">COMPLETED</span>
            </div>
            <div>
              <p className="card-title-label">Reviews Completed</p>
              <div className="card-numeric-display">
                <span className="card-big-num">{metrics.completedReviews}</span>
              </div>
            </div>
            <p className="card-caption-text">
              {metrics.completedReviews > 0 ? 'Full AST & rules evaluated' : 'No review runs executed yet'}
            </p>
          </div>

          {/* Metric 3: Open Findings */}
          <div
            ref={(el) => (cardRefs.current[2] = el)}
            className="cyber-metric-card accent-amber"
            onMouseMove={(e) => handleCardMouseMove(e, 2)}
            onMouseLeave={() => handleCardMouseLeave(2)}
          >
            <div className="card-top-row">
              <span className="card-index-kicker">Open Findings</span>
              <span className="card-badge-pill amber">ACTIVE</span>
            </div>
            <div>
              <p className="card-title-label">Open Findings</p>
              <div className="card-numeric-display">
                <span className="card-big-num">{metrics.openFindings}</span>
              </div>
            </div>
            <p className="card-caption-text">Across all monitored branches & PRs</p>
          </div>

          {/* Metric 4: Critical Findings */}
          <div
            ref={(el) => (cardRefs.current[3] = el)}
            className="cyber-metric-card accent-emerald"
            onMouseMove={(e) => handleCardMouseMove(e, 3)}
            onMouseLeave={() => handleCardMouseLeave(3)}
          >
            <div className="card-top-row">
              <span className="card-index-kicker">Critical Blockers</span>
              <span className="card-badge-pill emerald">
                {metrics.criticalFindings > 0 ? 'ATTENTION' : 'CLEAN'}
              </span>
            </div>
            <div>
              <p className="card-title-label">Critical Findings</p>
              <div className="card-numeric-display">
                <span className="card-big-num">{metrics.criticalFindings}</span>
              </div>
            </div>
            <p className="card-caption-text">
              {metrics.criticalFindings > 0 ? 'Immediate remediation required' : 'Zero blocking vulnerabilities'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Main Overview Section: Recent Reviews or Creative AST Radar Matrix */}
      <div className="overview-section-card animate-fade-in">
        <div className="section-card-header">
          <div>
            <h2 className="section-title">Autonomous Code Reviews</h2>
            <p className="section-sub">Latest repository audits, AST security scans & inline diffs</p>
          </div>
          {recentJobs.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('reviews')}
            >
              View All Reviews →
            </button>
          )}
        </div>

        {loadingData ? (
          <TableSkeleton rows={3} columns={7} />
        ) : dataError && recentJobs.length === 0 ? (
          <div className="auth-alert error" style={{ margin: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Failed to load recent reviews: {dataError}</span>
            {onRetrySync && (
              <button type="button" className="btn btn-secondary btn-xs" onClick={onRetrySync}>
                Retry ↻
              </button>
            )}
          </div>
        ) : recentJobs.length === 0 ? (
          /* Creative Autonomous AST Audit Matrix Empty State */
          <div className="ast-radar-matrix-container">
            {/* Terminal Window Header */}
            <div className="matrix-terminal-topbar">
              <div className="matrix-window-dots">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <span className="matrix-route-path">nodemind.engine/security-radar</span>
              <span className="matrix-state-tag">AWAITING COMMITS</span>
            </div>

            {/* Radar Centerpiece */}
            <div className="matrix-hero-body">
              <div className="radar-orb-visual">
                <div className="radar-ring ring-1" />
                <div className="radar-ring ring-2" />
                <div className="radar-ring ring-3" />
                <div className="radar-sweep-beam" />
                <div className="radar-center-core">
                  <div className="core-pulse-inner" />
                </div>
                <div className="radar-node-dot node-1" />
                <div className="radar-node-dot node-2" />
                <div className="radar-node-dot node-3" />
              </div>

              <div className="matrix-kicker-meta">Continuous Security & Code Quality Scanner</div>
              <h3 className="matrix-title-main">Autonomous Review Pipeline Standby</h3>
              <p className="matrix-desc-copy">
                {repositories.length === 0
                  ? 'Connect any public or private GitHub repository to trigger automated line-by-line diff patches, CWE risk detection, and architectural boundaries scoring.'
                  : `You have ${repositories.length} connected repository ready for inspection. Launch an autonomous AST review below.`}
              </p>

              <div className="matrix-cta-actions-row">
                <button
                  type="button"
                  className="matrix-btn-connect-primary"
                  onClick={onOpenConnectModal}
                >
                  <span>Connect Repository</span>
                  <span>→</span>
                </button>

                {repositories.length > 0 ? (
                  <button
                    type="button"
                    className="matrix-btn-demo-sample"
                    onClick={() => onTriggerReview(repositories[0])}
                    disabled={triggeringReviewId === repositories[0].id}
                  >
                    <span>{triggeringReviewId === repositories[0].id ? 'Analyzing...' : `Run Review on ${repositories[0].name} ▶`}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="matrix-btn-demo-sample"
                    onClick={() => onNavigateToTab('repositories')}
                  >
                    <span>Explore Repositories ↗</span>
                  </button>
                )}
              </div>

              {/* Streaming Terminal Log Preview */}
              <div className="matrix-terminal-console-footer">
                <div className="terminal-log-line active">
                  <span className="terminal-tag-success">[NODE_01]</span>
                  <span>AST Engine v2.4 initialized in ephemeral memory buffer.</span>
                </div>
                <div className="terminal-log-line active">
                  <span className="terminal-tag-info">[RULES]</span>
                  <span>Loaded 142 OWASP CWE rules · Cryptographic decay analyzer armed.</span>
                </div>
                <div className="terminal-log-line">
                  <span className="terminal-tag-warn">[STATUS]</span>
                  <span>Awaiting incoming webhook push or manual commit trigger.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Recent Reviews Table */
          <div className="table-responsive-wrapper">
            <table className="dev-table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Branch</th>
                  <th>Commit</th>
                  <th>Findings</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(recentJobs) ? recentJobs : []).map((job) => {
                  const repoName = job.repositories?.full_name || job.repositories?.name || 'Repository'
                  const totalFindings = (job.critical_count || 0) + (job.high_count || 0) + (job.medium_count || 0) + (job.low_count || 0) + (job.info_count || 0)

                  return (
                    <tr key={job.id} className="dev-table-row">
                      <td className="cell-repo">
                        <div className="repo-name-text">{repoName}</div>
                      </td>
                      <td className="cell-branch">
                        <code className="code-pill branch">{job.branch}</code>
                      </td>
                      <td className="cell-commit">
                        <div className="commit-cell-wrap">
                          <code className="code-pill commit">{job.commit_sha?.slice(0, 7)}</code>
                          {job.commit_message && (
                            <span className="commit-msg-snippet" title={job.commit_message}>
                              {job.commit_message.split('\n')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="cell-findings">
                        <div className="findings-pill-group">
                          {job.critical_count > 0 && (
                            <span className="severity-badge-mini critical" title="Critical Findings">
                              {job.critical_count} critical
                            </span>
                          )}
                          {job.high_count > 0 && (
                            <span className="severity-badge-mini high" title="High Findings">
                              {job.high_count} high
                            </span>
                          )}
                          {totalFindings === 0 && (
                            <span className="severity-badge-mini passed">
                              Clean ✓
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="cell-status">
                        <span className={`status-pill-badge ${job.status}`}>
                          <span className={`status-dot ${job.status === 'completed' ? 'green' : job.status === 'failed' ? 'red' : 'amber'}`} />
                          {job.status}
                        </span>
                      </td>
                      <td className="cell-date">
                        <span className="date-text">{formatDate(job.created_at)}</span>
                      </td>
                      <td className="cell-action" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => onSelectReview(job.id)}
                        >
                          View Diff ↗
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
