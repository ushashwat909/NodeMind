import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FindingSkeletonList } from '@/components/common/Skeletons'
import { api } from '@/services/api'
import gsap from 'gsap'
import { staggerReveal, prefersReducedMotion } from '@/animations/motion'

export default function ReviewsView({
  reviewJobs = [],
  selectedReviewId,
  onSelectReviewId,
  onOpenConnectModal,
}) {
  const navigate = useNavigate()
  const [selectedJobId, setSelectedJobId] = useState(selectedReviewId || reviewJobs[0]?.id || null)
  const [findings, setFindings] = useState([])
  const [loadingFindings, setLoadingFindings] = useState(false)
  const [findingsError, setFindingsError] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingFindingId, setUpdatingFindingId] = useState(null)
  const findingsContainerRef = useRef(null)

  // Sync selected review from props if passed
  useEffect(() => {
    const list = Array.isArray(reviewJobs) ? reviewJobs : []
    if (selectedReviewId) {
      setSelectedJobId(selectedReviewId)
    } else if (!selectedJobId && list.length > 0) {
      setSelectedJobId(list[0].id)
    }
  }, [selectedReviewId, reviewJobs, selectedJobId])

  const selectedJob = useMemo(() => {
    const list = Array.isArray(reviewJobs) ? reviewJobs : []
    return list.find((j) => j.id === selectedJobId) || list[0] || null
  }, [reviewJobs, selectedJobId])

  // Fetch findings for the active review job
  const loadFindings = useCallback(async () => {
    if (!selectedJobId) return
    try {
      setLoadingFindings(true)
      setFindingsError(null)
      const res = await api.getReviewFindings(selectedJobId)
      const raw = res?.data?.findings ?? res?.data ?? []
      setFindings(Array.isArray(raw) ? raw : [])
    } catch (err) {
      console.error('Error fetching findings:', err)
      setFindingsError(err.message || 'Could not load findings for this review.')
    } finally {
      setLoadingFindings(false)
    }
  }, [selectedJobId])

  useEffect(() => {
    loadFindings()
  }, [loadFindings])

  // GSAP animation on findings load with React-safe cleanup & reduced motion compliance
  useEffect(() => {
    if (loadingFindings || !findingsContainerRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const cards = findingsContainerRef.current.querySelectorAll('.finding-card')
      if (cards.length > 0) {
        staggerReveal(cards, {
          y: 8,
          duration: 0.25,
          stagger: 0.035,
          ease: 'power2.out',
        })
      }
    }, findingsContainerRef)

    return () => ctx.revert()
  }, [loadingFindings, severityFilter, statusFilter])

  // Update finding status (open -> resolved / dismissed)
  const handleUpdateStatus = async (findingId, newStatus) => {
    try {
      setUpdatingFindingId(findingId)
      await api.updateFindingStatus(findingId, { status: newStatus })
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, status: newStatus } : f))
      )
    } catch (err) {
      alert(`Could not update finding status: ${err.message}`)
    } finally {
      setUpdatingFindingId(null)
    }
  }

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      return true
    })
  }, [findings, severityFilter, statusFilter])

  return (
    <div className="reviews-view">
      <div className="view-header-row">
        <div>
          <div className="title-with-badge">
            <h2 className="view-title">Code Reviews &amp; Findings</h2>
            <span className="count-pill">{reviewJobs.length}</span>
          </div>
          <p className="view-subtitle">Inspect AST code findings, security vulnerabilities, and quality scores</p>
        </div>
      </div>

      {reviewJobs.length === 0 ? (
        <div className="intentional-empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h3 className="empty-state-title">No review runs found</h3>
          <p className="empty-state-desc">
            Trigger a review on any connected repository to inspect detailed source-code findings.
          </p>
          <button type="button" className="btn btn-primary" onClick={onOpenConnectModal}>
            Connect Repository →
          </button>
        </div>
      ) : (
        <div className="reviews-two-column-layout">
          {/* Left: Review Runs Selector */}
          <div className="review-jobs-sidebar dev-card">
            <div className="jobs-sidebar-title">Review Runs</div>
            <div className="jobs-list-scroll">
              {(Array.isArray(reviewJobs) ? reviewJobs : []).map((job) => {
                const isSelected = job.id === selectedJob?.id
                const repoName = job.repositories?.name || job.repositories?.full_name || 'Repository'
                return (
                  <button
                    key={job.id}
                    type="button"
                    className={`job-select-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedJobId(job.id)
                      if (onSelectReviewId) onSelectReviewId(job.id)
                    }}
                  >
                    <div className="job-item-header">
                      <span className="job-repo-name">{repoName}</span>
                      <span className={`status-pill mini ${job.status}`}>{job.status}</span>
                    </div>
                    <div className="job-item-sub">
                      <code>{job.branch}</code>
                      <span className="meta-sep">•</span>
                      <code>{job.commit_sha?.slice(0, 7)}</code>
                      {job.quality_score !== null && (
                        <>
                          <span className="meta-sep">•</span>
                          <span className="job-score-text">{job.quality_score}%</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Selected Review Details & Findings */}
          <div className="review-details-pane dev-card">
            {selectedJob ? (
              <>
                {/* Header Summary Card */}
                <div className="review-job-header">
                  <div className="job-primary-info">
                    <h3 className="job-repo-title">
                      {selectedJob.repositories?.full_name || selectedJob.repositories?.name}
                    </h3>
                    <div className="job-badge-meta-row">
                      <span className="meta-label">Branch:</span>
                      <code className="code-pill branch">{selectedJob.branch}</code>
                      <span className="meta-sep">•</span>
                      <span className="meta-label">Commit:</span>
                      <code className="code-pill commit">{selectedJob.commit_sha?.slice(0, 7)}</code>
                      <span className="meta-sep">•</span>
                      <span className={`status-pill ${selectedJob.status}`}>{selectedJob.status}</span>
                    </div>
                  </div>

                  <div className="job-header-right-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {selectedJob.quality_score !== null && (
                      <div className="quality-score-box">
                        <span className="score-number">{selectedJob.quality_score}</span>
                        <span className="score-max">/100</span>
                        <span className="score-label">Quality Score</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => navigate(`/reviews/${selectedJob.id}`)}
                      title="Open full-screen split-pane code review results screen"
                    >
                      Open Full Workspace ↗
                    </button>
                  </div>
                </div>

                {/* Findings Filters */}
                <div className="findings-filter-bar">
                  <div className="filter-group">
                    <span className="filter-label">Severity:</span>
                    {['all', 'critical', 'high', 'medium', 'low', 'info'].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        className={`filter-pill ${severityFilter === sev ? 'active' : ''}`}
                        onClick={() => setSeverityFilter(sev)}
                      >
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="filter-group">
                    <span className="filter-label">Status:</span>
                    {['all', 'open', 'resolved', 'dismissed'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                        onClick={() => setStatusFilter(st)}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Findings List */}
                <div className="findings-list-wrapper" ref={findingsContainerRef}>
                  {loadingFindings ? (
                    <FindingSkeletonList count={3} />
                  ) : findingsError ? (
                    <div className="auth-alert error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Failed to retrieve findings: {findingsError}</span>
                      <button type="button" className="btn btn-secondary btn-xs" onClick={loadFindings}>
                        Retry ↻
                      </button>
                    </div>
                  ) : filteredFindings.length === 0 ? (
                    <div className="empty-findings-state">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <h4>No findings match active filters</h4>
                      <p>All scanned rules are clean for the selected severity and status criteria.</p>
                    </div>
                  ) : (
                    (Array.isArray(filteredFindings) ? filteredFindings : []).map((finding) => (
                      <div key={finding.id} className="finding-card dev-card">
                        <div className="finding-header-row">
                          <div className="finding-tags">
                            <span className={`severity-badge ${finding.severity}`}>
                              {finding.severity.toUpperCase()}
                            </span>
                            <span className="category-badge">
                              {finding.category}
                            </span>
                            {finding.cwe_id && (
                              <span className="cwe-badge">{finding.cwe_id}</span>
                            )}
                          </div>

                          <div className="finding-status-actions">
                            <span className={`status-tag ${finding.status}`}>{finding.status}</span>
                            {finding.status === 'open' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => handleUpdateStatus(finding.id, 'resolved')}
                                  disabled={updatingFindingId === finding.id}
                                >
                                  Resolve ✓
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => handleUpdateStatus(finding.id, 'dismissed')}
                                  disabled={updatingFindingId === finding.id}
                                >
                                  Dismiss
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleUpdateStatus(finding.id, 'open')}
                                disabled={updatingFindingId === finding.id}
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="finding-title">{finding.title}</div>
                        <div className="finding-location">
                          <code>{finding.file_path || finding.file}:{finding.line_start}</code>
                        </div>

                        <p className="finding-desc">{finding.description}</p>

                        {finding.snippet && (
                          <div className="code-snippet-box">
                            <pre><code>{finding.snippet}</code></pre>
                          </div>
                        )}

                        {finding.recommendation && (
                          <div className="recommendation-box">
                            <strong className="rec-title">Recommendation:</strong>
                            <p className="rec-text">{finding.recommendation}</p>
                          </div>
                        )}

                        {finding.suggested_fix && (
                          <div className="suggested-fix-box">
                            <strong className="fix-title">Suggested Fix:</strong>
                            <pre><code>{finding.suggested_fix}</code></pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="empty-loading-state">
                <p>Select a review run on the left to inspect findings.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
