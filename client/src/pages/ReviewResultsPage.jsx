import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import ReviewHeader from '@/components/review/ReviewHeader'
import ReviewSummaryMetrics from '@/components/review/ReviewSummaryMetrics'
import FindingsToolbar from '@/components/review/FindingsToolbar'
import FindingsList from '@/components/review/FindingsList'
import CodeViewer from '@/components/review/CodeViewer'
import DiffSuggestionPanel from '@/components/review/DiffSuggestionPanel'
import ReviewExecutiveSummaryModal from '@/components/review/ReviewExecutiveSummaryModal'
import { ReviewResultsSkeleton } from '@/components/common/Skeletons'
import ReviewProgressModal from '@/components/common/ReviewProgressModal'
import { pageEnter, prefersReducedMotion } from '@/animations/motion'
import gsap from 'gsap'
import './ReviewResults.css'

export default function ReviewResultsPage() {
  const { id: reviewId } = useParams()
  const navigate = useNavigate()

  // Data States
  const [job, setJob] = useState(null)
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFindingId, setSelectedFindingId] = useState(null)
  const [reRunning, setReRunning] = useState(false)
  const [updatingFindingId, setUpdatingFindingId] = useState(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [fileFilter, setFileFilter] = useState('all')
  const [sortBy, setSortBy] = useState('severity')

  // Mobile View Toggle: 'findings' | 'code'
  const [mobileActiveTab, setMobileActiveTab] = useState('code')

  // Refs for animations
  const pageContainerRef = useRef(null)
  const codePanelRef = useRef(null)

  // 1. Fetch Review Job & Findings
  const loadReviewDetails = useCallback(async () => {
    if (!reviewId) return
    try {
      setLoading(true)
      setError(null)

      const [jobRes, findingsRes] = await Promise.all([
        api.getReview(reviewId),
        api.getReviewFindings(reviewId),
      ])

      const reviewData = jobRes?.data?.job || jobRes?.data || null
      const rawFindings = findingsRes?.data?.findings ?? findingsRes?.data ?? []
      const findingsData = Array.isArray(rawFindings) ? rawFindings : []

      setJob(reviewData)
      setFindings(findingsData)

      // If resolved ID differs from URL parameter (e.g. fuzzy match or minor typo in URL), update URL seamlessly
      if (reviewData?.id && reviewData.id !== reviewId) {
        navigate(`/reviews/${reviewData.id}`, { replace: true })
      }

      // Auto-select first finding if available
      if (findingsData.length > 0) {
        setSelectedFindingId((prev) => {
          if (prev && findingsData.some((f) => f.id === prev)) return prev
          return findingsData[0].id
        })
      }
    } catch (err) {
      console.error('[ReviewResultsPage] Failed to fetch review:', err)
      setError(err.message || 'Could not load review job details.')
    } finally {
      setLoading(false)
    }
  }, [reviewId])

  useEffect(() => {
    loadReviewDetails()
  }, [loadReviewDetails])

  // GSAP Entrance Animation on complete load with React-safe cleanup
  useEffect(() => {
    if (loading || !pageContainerRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      pageEnter(pageContainerRef.current, { y: 12, duration: 0.32 })
    }, pageContainerRef)

    return () => ctx.revert()
  }, [loading])

  // 2. Computed Unique Filter Lists & Counts
  const availableFiles = useMemo(() => {
    const set = new Set()
    findings.forEach((f) => {
      if (f.file_path) set.add(f.file_path)
    })
    return Array.from(set).sort()
  }, [findings])

  const availableCategories = useMemo(() => {
    const set = new Set()
    findings.forEach((f) => {
      if (f.category) set.add(f.category)
    })
    return Array.from(set).sort()
  }, [findings])

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    findings.forEach((f) => {
      const sev = f.severity?.toLowerCase()
      if (counts[sev] != null) counts[sev]++
    })
    return counts
  }, [findings])

  // 3. Filtered & Sorted Findings
  const filteredFindings = useMemo(() => {
    let result = findings.filter((f) => {
      // Severity Filter
      if (severityFilter !== 'all' && f.severity?.toLowerCase() !== severityFilter) {
        return false
      }
      // Category Filter
      if (categoryFilter !== 'all' && f.category?.toLowerCase() !== categoryFilter) {
        return false
      }
      // File Filter
      if (fileFilter !== 'all' && f.file_path !== fileFilter) {
        return false
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = f.title?.toLowerCase().includes(q)
        const matchFile = f.file_path?.toLowerCase().includes(q)
        const matchDesc = f.description?.toLowerCase().includes(q)
        const matchCwe = f.cwe_id?.toLowerCase().includes(q)
        const matchCode = f.snippet?.toLowerCase().includes(q) || f.suggested_fix?.toLowerCase().includes(q)
        if (!matchTitle && !matchFile && !matchDesc && !matchCwe && !matchCode) {
          return false
        }
      }
      return true
    })

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'severity') {
        const rank = { critical: 1, high: 2, medium: 3, low: 4, info: 5 }
        const rDiff = (rank[a.severity?.toLowerCase()] || 99) - (rank[b.severity?.toLowerCase()] || 99)
        if (rDiff !== 0) return rDiff
        return (a.line_start || 0) - (b.line_start || 0)
      }
      if (sortBy === 'line') {
        return (a.line_start || 0) - (b.line_start || 0)
      }
      if (sortBy === 'file') {
        return (a.file_path || '').localeCompare(b.file_path || '')
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '')
      }
      return 0
    })

    return result
  }, [findings, severityFilter, categoryFilter, fileFilter, searchQuery, sortBy])

  // Ensure selectedFinding points to a valid item
  const selectedFinding = useMemo(() => {
    return (
      filteredFindings.find((f) => f.id === selectedFindingId) ||
      filteredFindings[0] ||
      findings.find((f) => f.id === selectedFindingId) ||
      findings[0] ||
      null
    )
  }, [filteredFindings, selectedFindingId, findings])

  // Smooth GSAP transition on code view when selected finding changes
  const handleSelectFinding = useCallback((finding) => {
    setSelectedFindingId(finding.id)
    setMobileActiveTab('code') // Switch to code view on mobile
    if (codePanelRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        codePanelRef.current,
        { opacity: 0.88, y: 3 },
        { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }
      )
    }
  }, [])

  // Mobile finding stepper navigation
  const currentIndex = useMemo(() => {
    if (!selectedFinding) return -1
    return filteredFindings.findIndex((f) => f.id === selectedFinding.id)
  }, [filteredFindings, selectedFinding])

  const handlePrevFinding = useCallback(() => {
    if (filteredFindings.length === 0) return
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : filteredFindings.length - 1
    handleSelectFinding(filteredFindings[prevIdx])
  }, [filteredFindings, currentIndex, handleSelectFinding])

  const handleNextFinding = useCallback(() => {
    if (filteredFindings.length === 0) return
    const nextIdx = currentIndex < filteredFindings.length - 1 ? currentIndex + 1 : 0
    handleSelectFinding(filteredFindings[nextIdx])
  }, [filteredFindings, currentIndex, handleSelectFinding])

  // 4. Keyboard Navigation (Arrow keys / J/K, C to copy fix, / to search, Esc to reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur()
        }
        return
      }

      if (filteredFindings.length === 0) return

      const currentIndex = filteredFindings.findIndex((f) => f.id === selectedFindingId)

      // Down / J: Next Finding
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        const nextIdx = currentIndex < filteredFindings.length - 1 ? currentIndex + 1 : 0
        handleSelectFinding(filteredFindings[nextIdx])
      }
      // Up / K: Previous Finding
      else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        const prevIdx = currentIndex > 0 ? currentIndex - 1 : filteredFindings.length - 1
        handleSelectFinding(filteredFindings[prevIdx])
      }
      // C: Copy Suggested Fix Code
      else if (e.key === 'c' || e.key === 'C') {
        if (selectedFinding?.suggested_fix) {
          e.preventDefault()
          navigator.clipboard.writeText(selectedFinding.suggested_fix)
        }
      }
      // /: Focus search input
      else if (e.key === '/') {
        e.preventDefault()
        const searchInput = document.querySelector('.search-field')
        if (searchInput) searchInput.focus()
      }
      // Esc: Reset filters
      else if (e.key === 'Escape') {
        setSearchQuery('')
        setSeverityFilter('all')
        setCategoryFilter('all')
        setFileFilter('all')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredFindings, selectedFindingId, selectedFinding, handleSelectFinding])

  // 5. Update Finding Status (Resolve / Dismiss / Reopen)
  const handleUpdateFindingStatus = async (findingId, newStatus) => {
    try {
      setUpdatingFindingId(findingId)
      await api.updateFindingStatus(findingId, { status: newStatus })
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, status: newStatus } : f))
      )
    } catch (err) {
      alert(`Could not update finding: ${err.message}`)
    } finally {
      setUpdatingFindingId(null)
    }
  }

  // Re-run modal state
  const [reviewProgressState, setReviewProgressState] = useState({
    isOpen: false,
    job: null,
    repo: null,
    progress: 0,
    error: null,
  })

  // 6. Trigger Re-run of Review Pipeline with Intelligent Progress Modal
  const handleReRunReview = async () => {
    if (!job?.repository_id) return
    const targetRepo = job.repositories || { id: job.repository_id, full_name: 'Repository', default_branch: job.branch }
    setReRunning(true)
    setReviewProgressState({
      isOpen: true,
      job: null,
      repo: targetRepo,
      progress: 15,
      error: null,
    })

    const timer = setInterval(() => {
      setReviewProgressState((prev) => {
        if (!prev.isOpen || prev.progress >= 92 || prev.error) return prev
        return { ...prev, progress: Math.min(92, prev.progress + 11) }
      })
    }, 250)

    try {
      const res = await api.createReview({
        repositoryId: job.repository_id,
        branch: job.branch || 'main',
        triggerType: 'manual',
      })
      clearInterval(timer)
      const newJob = res?.data?.job || res?.data || null
      setReviewProgressState((prev) => ({
        ...prev,
        job: newJob,
        progress: 100,
        error: null,
      }))
    } catch (err) {
      clearInterval(timer)
      console.error('[ReviewResultsPage] Re-run review failed:', err)
      setReviewProgressState((prev) => ({
        ...prev,
        progress: 100,
        error: err.message || 'Review re-run encountered an issue. Check repository permissions and branch.',
      }))
    } finally {
      setReRunning(false)
    }
  }

  // 7. Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSeverityFilter('all')
    setCategoryFilter('all')
    setFileFilter('all')
    setSortBy('severity')
  }

  if (loading) {
    return <ReviewResultsSkeleton />
  }

  if (error || !job) {
    return (
      <div className="review-error-view">
        <div className="error-icon-box">✕</div>
        <h3 className="error-title">Review Unavailable</h3>
        <p className="error-desc">
          {error || 'Unable to retrieve AST findings or review metadata. The review may have been pruned or access is restricted.'}
        </p>
        <div className="error-action-row">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={loadReviewDetails}>
            Retry Fetching Review ↻
          </button>
        </div>
      </div>
    )
  }

  const reviewResult = job.review_results?.[0] || null
  const repo = job.repositories || null

  return (
    <div className="review-results-page" ref={pageContainerRef}>
      {/* 1. Header Area */}
      <ReviewHeader
        job={job}
        repo={repo}
        result={reviewResult}
        findingsCount={findings.length}
        onReRun={handleReRunReview}
        reRunning={reRunning}
        onExportReport={() => setIsReportModalOpen(true)}
      />

      {/* 2. Summary Metric Counters */}
      <ReviewSummaryMetrics
        totalFindings={findings.length}
        criticalCount={job.critical_count ?? severityCounts.critical}
        highCount={job.high_count ?? severityCounts.high}
        mediumCount={job.medium_count ?? severityCounts.medium}
        lowCount={job.low_count ?? severityCounts.low}
        infoCount={job.info_count ?? severityCounts.info}
        filesCount={job.total_files || (job.review_files?.length || 1)}
        linesCount={job.total_lines || 0}
        activeSeverityFilter={severityFilter}
        onSelectSeverity={setSeverityFilter}
      />

      {/* Mobile Tab Switcher */}
      <div className="mobile-view-tabs">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileActiveTab === 'findings' ? 'active' : ''}`}
          onClick={() => setMobileActiveTab('findings')}
        >
          Findings ({filteredFindings.length})
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileActiveTab === 'code' ? 'active' : ''}`}
          onClick={() => setMobileActiveTab('code')}
        >
          Code View & Fix
        </button>
      </div>

      {/* 3. Main Split-Pane Workspace */}
      <main className="review-split-workspace">
        {/* Left Column: Findings Toolbar + Findings List */}
        <aside className={`workspace-findings-column ${mobileActiveTab === 'findings' ? 'mobile-visible' : ''}`}>
          <FindingsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            severityFilter={severityFilter}
            onSeverityChange={setSeverityFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            fileFilter={fileFilter}
            onFileChange={setFileFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            availableFiles={availableFiles}
            availableCategories={availableCategories}
            severityCounts={severityCounts}
            totalCount={findings.length}
            filteredCount={filteredFindings.length}
            onResetFilters={handleResetFilters}
          />

          <FindingsList
            findings={filteredFindings}
            selectedFindingId={selectedFinding?.id}
            onSelectFinding={handleSelectFinding}
            hasActiveFilters={
              searchQuery.trim() !== '' ||
              severityFilter !== 'all' ||
              categoryFilter !== 'all' ||
              fileFilter !== 'all'
            }
            onResetFilters={handleResetFilters}
          />
        </aside>

        {/* Right Column: Code Viewer + Diff / Suggestion Inspector */}
        <section
          className={`workspace-code-column ${mobileActiveTab === 'code' ? 'mobile-visible' : ''}`}
          ref={codePanelRef}
        >
          {selectedFinding ? (
            <>
              {/* Mobile Finding Overview & Stepper (prioritizes Finding first on Mobile) */}
              <div className="mobile-finding-header-card">
                <div className="mobile-header-nav-row">
                  <button
                    type="button"
                    className="mobile-back-findings-btn"
                    onClick={() => setMobileActiveTab('findings')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span>All Findings ({filteredFindings.length})</span>
                  </button>

                  <div className="mobile-stepper-controls">
                    <span className="mobile-step-counter">
                      {currentIndex >= 0 ? `${currentIndex + 1} of ${filteredFindings.length}` : ''}
                    </span>
                    <button
                      type="button"
                      className="mobile-step-btn"
                      onClick={handlePrevFinding}
                      aria-label="Previous finding"
                      title="Previous finding"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="mobile-step-btn"
                      onClick={handleNextFinding}
                      aria-label="Next finding"
                      title="Next finding"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Viewer Panel (Code context) */}
              <CodeViewer
                finding={selectedFinding}
                repoUrl={repo?.html_url || (repo?.full_name ? `https://github.com/${repo.full_name}` : null)}
                branch={job.branch || 'main'}
              />

              {/* Diff & Suggested Fix Panel */}
              <DiffSuggestionPanel
                finding={selectedFinding}
                onUpdateStatus={handleUpdateFindingStatus}
                updatingStatus={updatingFindingId === selectedFinding.id}
              />
            </>
          ) : (
            <div className="code-column-empty">
              <div className="empty-code-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3>No Finding Selected</h3>
              <p>Select a code finding from the list on the left to inspect source code and remediation guidance.</p>
            </div>
          )}
        </section>
      </main>

      {/* Executive Report Modal */}
      <ReviewExecutiveSummaryModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        job={job}
        result={reviewResult}
      />

      {/* Intelligent Review Processing Progress Modal for Re-runs */}
      {reviewProgressState.isOpen && (
        <ReviewProgressModal
          isOpen={reviewProgressState.isOpen}
          onClose={() => {
            const nextJobId = reviewProgressState.job?.id
            setReviewProgressState((prev) => ({ ...prev, isOpen: false }))
            if (nextJobId && nextJobId !== reviewId) {
              navigate(`/reviews/${nextJobId}`)
            } else {
              loadReviewDetails()
            }
          }}
          job={reviewProgressState.job}
          repo={reviewProgressState.repo}
          progress={reviewProgressState.progress}
          error={reviewProgressState.error}
          onRetry={handleReRunReview}
        />
      )}
    </div>
  )
}
