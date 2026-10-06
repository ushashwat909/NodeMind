import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'
import { SkeletonRow } from '../common/Skeletons'
import { modalReveal } from '../../animations/gsap'
import './StartReviewModal.css'

export default function StartReviewModal({
  isOpen = false,
  onClose,
  repo = null,
  onStartReview,
}) {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(repo?.default_branch || 'main')
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchError, setBranchError] = useState(null)
  const [useCustomBranch, setUseCustomBranch] = useState(false)
  const [customBranchName, setCustomBranchName] = useState('')

  const modalRef = useRef(null)
  const backdropRef = useRef(null)

  // Load branches when modal opens for a repository
  const loadBranches = async () => {
    if (!repo?.id) return
    setLoadingBranches(true)
    setBranchError(null)
    try {
      const res = await api.getRepositoryBranches(repo.id)
      
      // Resiliently extract branch array across all response shapes:
      // res.data.branches, res.data, res.branches, or empty array fallback
      const raw = res?.data?.branches ?? res?.data ?? res?.branches ?? []
      const branchList = Array.isArray(raw)
        ? raw.map((b) => (typeof b === 'string' ? b : b?.name || String(b))).filter(Boolean)
        : []

      setBranches(branchList)

      if (branchList.length > 0) {
        const defaultCandidate = repo.default_branch && branchList.includes(repo.default_branch)
          ? repo.default_branch
          : branchList[0]
        setSelectedBranch(defaultCandidate)
      } else {
        setSelectedBranch(repo.default_branch || 'main')
      }
    } catch (err) {
      console.error('[StartReviewModal] Failed to fetch branches:', err)
      setBranches([])
      setBranchError(
        err.message || 'GitHub repository branches could not be fetched. Check repository access permissions and try again.'
      )
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => {
    if (isOpen && repo) {
      setBranches([])
      setSelectedBranch(repo.default_branch || 'main')
      setUseCustomBranch(false)
      setCustomBranchName('')
      setBranchError(null)
      loadBranches()

      if (modalRef.current) {
        modalReveal(modalRef.current, backdropRef.current)
      }
    }
  }, [isOpen, repo])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !repo) return null

  // Ensure branches is always treated as an array
  const safeBranches = Array.isArray(branches) ? branches : []

  const targetBranch = useCustomBranch
    ? customBranchName.trim() || repo.default_branch || 'main'
    : selectedBranch || repo.default_branch || 'main'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!targetBranch) return
    onStartReview(repo, targetBranch)
    onClose()
  }

  const repoName = repo.full_name || repo.name || 'Repository'

  return (
    <div className="start-review-backdrop" ref={backdropRef} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="start-review-card glass-panel" ref={modalRef}>
        {/* Header */}
        <div className="start-review-header">
          <div className="start-review-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="start-review-titles">
            <h3 className="start-review-title">Launch Autonomous Review</h3>
            <p className="start-review-sub">Configure pipeline parameters and target Git branch</p>
          </div>
          <button type="button" className="start-review-close-btn" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Repository Overview Card */}
        <div className="start-review-repo-card dev-card">
          <div className="review-repo-row">
            <span className="repo-label">Repository:</span>
            <code className="code-pill mono">{repoName}</code>
            <span className={`privacy-badge ${repo.is_private ? 'private' : 'public'}`}>
              {repo.is_private ? 'Private' : 'Public'}
            </span>
          </div>
          <div className="review-repo-row secondary">
            <span className="repo-label">Language:</span>
            <span>{repo.language || 'Multi-language'}</span>
            <span className="meta-sep">&bull;</span>
            <span className="repo-label">Default:</span>
            <code className="code-pill branch">{repo.default_branch || 'main'}</code>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="start-review-form">
          <div className="form-group">
            <div className="branch-label-row">
              <label htmlFor="branch-select" className="form-label">
                Target Git Branch
              </label>
              {!loadingBranches && !branchError && (
                <button
                  type="button"
                  className="switch-branch-mode-btn"
                  onClick={() => setUseCustomBranch(!useCustomBranch)}
                >
                  {useCustomBranch ? '&larr; Choose from branch list' : 'Enter custom branch / PR ref'}
                </button>
              )}
            </div>

            {/* BRANCH LOADING STATE */}
            {loadingBranches && (
              <div className="branch-loading-box">
                <div className="branch-skeleton-row">
                  <SkeletonRow width="100%" height="38px" />
                </div>
                <div className="branch-loading-text">
                  <span className="spinner-progress-dot sm" />
                  <span>Fetching branches from GitHub API...</span>
                </div>
              </div>
            )}

            {/* BRANCH ERROR STATE & RETRY */}
            {!loadingBranches && branchError && (
              <div className="branch-error-box">
                <div className="auth-alert error">
                  <div className="alert-content">
                    <span className="alert-title">Branch Discovery Notice</span>
                    <span className="alert-message">{branchError}</span>
                  </div>
                </div>
                <div className="branch-error-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={loadBranches}
                  >
                    Retry Loading Branches &#8635;
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setBranchError(null)
                      setUseCustomBranch(true)
                    }}
                  >
                    Specify Branch Manually &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* BRANCH SUCCESS / EMPTY STATE */}
            {!loadingBranches && !branchError && (
              <>
                {useCustomBranch ? (
                  <div className="custom-branch-input-wrap">
                    <input
                      id="branch-input"
                      type="text"
                      className="repo-text-input"
                      placeholder="e.g. feature/auth-refactor or refs/pull/42/head"
                      value={customBranchName}
                      onChange={(e) => setCustomBranchName(e.target.value)}
                      autoFocus
                    />
                    <span className="input-helper-text">
                      Autonomous AST scanner will pull this ref directly from GitHub.
                    </span>
                  </div>
                ) : safeBranches.length === 0 ? (
                  /* Branch Empty State */
                  <div className="branch-empty-box">
                    <span className="empty-branch-text">
                      No additional branches detected. Review will analyze default branch <code>{repo.default_branch || 'main'}</code>.
                    </span>
                  </div>
                ) : (
                  /* Branch List Populated */
                  <div className="select-wrap">
                    <select
                      id="branch-select"
                      className="branch-dropdown"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      {safeBranches.map((b) => (
                        <option key={b} value={b}>
                          {b} {b === repo.default_branch ? '(default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="start-review-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingBranches || !targetBranch}
            >
              Start Review Pipeline &#9654;
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
