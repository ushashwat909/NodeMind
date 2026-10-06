import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableSkeleton, MetricsSkeleton } from '@/components/common/Skeletons'
import gsap from 'gsap'
import { staggerReveal, prefersReducedMotion } from '@/animations/motion'

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
}) {
  const navigate = useNavigate()
  const containerRef = useRef(null)

  useEffect(() => {
    if (loadingData || !containerRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const elements = containerRef.current.querySelectorAll('.animate-fade-in')
      if (elements.length > 0) {
        staggerReveal(elements, {
          y: 10,
          duration: 0.3,
          stagger: 0.045,
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
      {/* Metrics Row */}
      {loadingData ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="overview-metrics-grid">
          {/* Metric 1: Repositories */}
          <div className="overview-metric-card animate-fade-in">
            <div className="metric-header">
              <span className="metric-title">Connected Repos</span>
              <span className="metric-icon-wrap neutral">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                </svg>
              </span>
            </div>
            <div className="metric-value">
              {metrics.totalRepos}
            </div>
            <div className="metric-caption">
              {metrics.totalRepos === 1 ? '1 active repository' : `${metrics.totalRepos} active repositories`}
            </div>
          </div>

          {/* Metric 2: Reviews Completed */}
          <div className="overview-metric-card animate-fade-in">
            <div className="metric-header">
              <span className="metric-title">Reviews Completed</span>
              <span className="metric-icon-wrap primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
            </div>
            <div className="metric-value">
              {metrics.completedReviews}
            </div>
            <div className="metric-caption">
              {metrics.completedReviews > 0 ? 'Full AST & rules evaluated' : 'No review runs yet'}
            </div>
          </div>

          {/* Metric 3: Open Findings */}
          <div className="overview-metric-card animate-fade-in">
            <div className="metric-header">
              <span className="metric-title">Open Findings</span>
              <span className="metric-icon-wrap warning">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
            </div>
            <div className="metric-value">
              {metrics.openFindings}
            </div>
            <div className="metric-caption">Across all monitored branches</div>
          </div>

          {/* Metric 4: Critical Findings */}
          <div className="overview-metric-card animate-fade-in">
            <div className="metric-header">
              <span className="metric-title">Critical Findings</span>
              <span className={`metric-icon-wrap ${metrics.criticalFindings > 0 ? 'danger' : 'success'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 22 22 22" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
            </div>
            <div className="metric-value">
              {metrics.criticalFindings}
            </div>
            <div className="metric-caption">
              {metrics.criticalFindings > 0 ? 'Immediate remediation required' : 'Zero blocking zero-days'}
            </div>
          </div>
        </div>
      )}

      {/* Main Overview Section: Recent Reviews */}
      <div className="overview-section-card animate-fade-in">
        <div className="section-card-header">
          <div>
            <h2 className="section-title">Recent Reviews</h2>
            <p className="section-sub">Latest autonomous code reviews and security scans</p>
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
          /* Intentional Empty State */
          <div className="intentional-empty-state">
            <div className="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <h3 className="empty-state-title">No reviews yet</h3>
            <p className="empty-state-desc">
              {repositories.length === 0
                ? 'Connect your first GitHub repository to trigger automated security audits, bug risk detection, and quality scores.'
                : 'You have connected repositories ready for inspection. Run your first review now.'}
            </p>
            {repositories.length === 0 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenConnectModal}
              >
                Connect your first repository →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onTriggerReview(repositories[0])}
                disabled={triggeringReviewId === repositories[0].id}
              >
                {triggeringReviewId === repositories[0].id ? 'Analyzing...' : `Run Review on ${repositories[0].name} ▶`}
              </button>
            )}
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
                          {job.critical_count === 0 && job.high_count === 0 && (
                            <span className="severity-badge-mini passed">
                              {totalFindings} issues
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="cell-status">
                        <span className={`status-pill ${job.status}`}>
                          {job.status === 'completed' && <span className="status-dot green" />}
                          {job.status === 'running' && <span className="status-dot amber pulse" />}
                          {job.status === 'failed' && <span className="status-dot red" />}
                          {job.status === 'queued' && <span className="status-dot gray" />}
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
                          onClick={() => {
                            if (onSelectReview) onSelectReview(job.id)
                            navigate(`/reviews/${job.id}`)
                          }}
                        >
                          Inspect →
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

      {/* Developer CLI Helper */}
      <div className="overview-cli-box animate-fade-in">
        <div className="cli-box-header">
          <span className="cli-box-title">CLI Autonomous Review Command</span>
          <span className="cli-box-badge">Local or CI/CD Pipeline</span>
        </div>
        <div className="cli-box-code">
          <code>npx code-review-agent@latest scan --repo {repositories[0]?.full_name || 'owner/repository'}</code>
        </div>
      </div>
    </div>
  )
}
