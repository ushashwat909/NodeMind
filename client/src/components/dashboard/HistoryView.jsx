import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableSkeleton } from '@/components/common/Skeletons'
import { api } from '@/services/api'
import gsap from 'gsap'
import { staggerReveal, prefersReducedMotion } from '@/animations/motion'

export default function HistoryView({
  repositories = [],
  onSelectReview,
  onNavigateToTab,
}) {
  const navigate = useNavigate()
  const [historyJobs, setHistoryJobs] = useState([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(8)
  const [statusFilter, setStatusFilter] = useState('all')
  const [repoFilter, setRepoFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const tbodyRef = useRef(null)

  useEffect(() => {
    if (loading || !tbodyRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const rows = tbodyRef.current.querySelectorAll('.dev-table-row')
      if (rows.length > 0) {
        staggerReveal(rows, {
          y: 8,
          duration: 0.25,
          stagger: 0.03,
          ease: 'power2.out',
        })
      }
    }, tbodyRef)

    return () => ctx.revert()
  }, [loading, historyJobs.length])

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        limit,
      }
      if (statusFilter !== 'all') params.status = statusFilter
      if (repoFilter !== 'all') params.repositoryId = repoFilter

      const res = await api.listReviews(params)
      if (res?.data) {
        if (Array.isArray(res.data)) {
          setHistoryJobs(res.data)
          setTotalJobs(res.data.length)
        } else {
          setHistoryJobs(res.data.jobs || [])
          setTotalJobs(res.data.total || 0)
        }
      }
    } catch (err) {
      console.error('Error loading review history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, repoFilter])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const totalPages = Math.max(1, Math.ceil(totalJobs / limit))

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="history-view">
      <div className="view-header-row">
        <div>
          <div className="title-with-badge">
            <h2 className="view-title">Review History &amp; Audit Trail</h2>
            <span className="count-pill">{totalJobs} total</span>
          </div>
          <p className="view-subtitle">Chronological record of code reviews, AST scans, and quality outcomes</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="history-filter-toolbar dev-card">
        <div className="filter-item">
          <label htmlFor="history-status-select" className="filter-field-label">Status:</label>
          <select
            id="history-status-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="history-repo-select" className="filter-field-label">Repository:</label>
          <select
            id="history-repo-select"
            value={repoFilter}
            onChange={(e) => {
              setRepoFilter(e.target.value)
              setPage(1)
            }}
            className="filter-select"
          >
            <option value="all">All Repositories</option>
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.full_name}
              </option>
            ))}
          </select>
        </div>

        {(statusFilter !== 'all' || repoFilter !== 'all') && (
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => {
              setStatusFilter('all')
              setRepoFilter('all')
              setPage(1)
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="overview-section-card">
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : error ? (
          <div className="auth-alert error" style={{ margin: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Failed to retrieve review audit history: {error}</span>
            <button type="button" className="btn btn-secondary btn-xs" onClick={loadHistory}>
              Retry ↻
            </button>
          </div>
        ) : historyJobs.length === 0 ? (
          <div className="intentional-empty-state">
            <h3 className="empty-state-title">No review jobs found</h3>
            <p className="empty-state-desc">
              {statusFilter !== 'all' || repoFilter !== 'all'
                ? 'No review jobs match your active status or repository filters.'
                : 'No review jobs have been executed yet. Run your first review from the Repositories tab.'}
            </p>
            {statusFilter === 'all' && repoFilter === 'all' && onNavigateToTab && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigateToTab('repositories')}
                style={{ marginTop: '0.75rem' }}
              >
                Go to Repositories →
              </button>
            )}
            {(statusFilter !== 'all' || repoFilter !== 'all') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStatusFilter('all')
                  setRepoFilter('all')
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive-wrapper">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Review ID</th>
                    <th>Repository</th>
                    <th>Branch / Commit</th>
                    <th>Score</th>
                    <th>Findings</th>
                    <th>Status</th>
                    <th>Executed At</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef}>
                  {historyJobs.map((job) => {
                    const repoName = job.repositories?.name || job.repositories?.full_name || 'Repository'
                    return (
                      <tr key={job.id} className="dev-table-row">
                        <td className="cell-id">
                          <code className="code-pill mono">{job.id.slice(0, 8)}</code>
                        </td>
                        <td className="cell-repo">
                          <div className="repo-name-text">{repoName}</div>
                        </td>
                        <td className="cell-commit">
                          <div className="commit-cell-wrap">
                            <code className="code-pill branch">{job.branch}</code>
                            <span className="meta-sep">•</span>
                            <code className="code-pill commit">{job.commit_sha?.slice(0, 7)}</code>
                          </div>
                        </td>
                        <td className="cell-score">
                          {job.quality_score !== null ? (
                            <span className={`score-badge ${job.quality_score >= 85 ? 'high' : job.quality_score >= 60 ? 'mid' : 'low'}`}>
                              {job.quality_score}%
                            </span>
                          ) : (
                            <span className="score-badge neutral">—</span>
                          )}
                        </td>
                        <td className="cell-findings">
                          <div className="findings-pill-group">
                            {job.critical_count > 0 && (
                              <span className="severity-badge-mini critical">{job.critical_count} crit</span>
                            )}
                            {job.high_count > 0 && (
                              <span className="severity-badge-mini high">{job.high_count} high</span>
                            )}
                            {job.critical_count === 0 && job.high_count === 0 && (
                              <span className="severity-badge-mini passed">Clean</span>
                            )}
                          </div>
                        </td>
                        <td className="cell-status">
                          <span className={`status-pill ${job.status}`}>
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
                            onClick={() => {
                              if (onSelectReview) onSelectReview(job.id)
                              navigate(`/reviews/${job.id}`)
                            }}
                          >
                            Inspect Findings →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Page {page} of {totalPages} ({totalJobs} total runs)
              </span>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
