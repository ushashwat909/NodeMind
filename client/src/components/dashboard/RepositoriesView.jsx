import { useState, useMemo, useEffect, useRef } from 'react'
import { RepoSkeletonList } from '@/components/common/Skeletons'
import gsap from 'gsap'
import { staggerReveal, prefersReducedMotion } from '@/animations/motion'

export default function RepositoriesView({
  repositories = [],
  loadingData,
  dataError = null,
  onRetrySync = null,
  onOpenConnectModal,
  onTriggerReview,
  triggeringReviewId,
  onSyncGithub = null,
  isSyncingGithub = false,
  hasGithubToken = false,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState(null)
  const listRef = useRef(null)
  const searchInputRef = useRef(null)

  const handleSyncClick = () => {
    if (hasGithubToken && onSyncGithub) {
      onSyncGithub()
    } else {
      setIsTokenModalOpen(true)
    }
  }

  const handleTokenSubmit = async (e) => {
    e.preventDefault()
    const cleanToken = tokenInput.trim()
    if (!cleanToken) {
      setTokenError('Please enter a GitHub Personal Access Token or OAuth token.')
      return
    }
    setTokenError(null)
    if (onSyncGithub) {
      const res = await onSyncGithub(cleanToken)
      if (res?.success) {
        setIsTokenModalOpen(false)
        setTokenInput('')
      } else {
        setTokenError(res?.error || 'Failed to sync repositories with provided token.')
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])


  const filteredRepositories = useMemo(() => {
    if (!searchQuery.trim()) return repositories
    const q = searchQuery.toLowerCase()
    return repositories.filter(
      (r) =>
        r.full_name?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q)
    )
  }, [repositories, searchQuery])

  useEffect(() => {
    if (loadingData || !listRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const items = listRef.current.querySelectorAll('.repo-list-item')
      if (items.length > 0) {
        staggerReveal(items, {
          y: 8,
          duration: 0.28,
          stagger: 0.04,
          ease: 'power2.out',
        })
      }
    }, listRef)

    return () => ctx.revert()
  }, [loadingData, filteredRepositories.length])

  const formatLastReviewed = (dateString) => {
    if (!dateString) return 'Never reviewed'
    const date = new Date(dateString)
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Reviewed just now'
    if (diffSec < 3600) return `Reviewed ${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `Reviewed ${Math.floor(diffSec / 3600)}h ago`
    return `Reviewed on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  }

  return (
    <div className="repositories-view">
      {/* Header and Controls */}
      <div className="view-header-row">
        <div>
          <div className="title-with-badge">
            <h2 className="view-title">Connected Repositories</h2>
            <span className="count-pill">{repositories.length}</span>
          </div>
          <p className="view-subtitle">Repositories synchronized from GitHub for autonomous code and security reviews</p>
        </div>

        <div className="view-action-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-secondary ${isSyncingGithub ? 'is-loading' : ''}`}
            onClick={handleSyncClick}
            disabled={isSyncingGithub}
            title="Import all repositories from your GitHub account"
          >
            {isSyncingGithub ? (
              <>
                <span className="btn-spinner" />
                <span>Syncing GitHub...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Sync GitHub Repos ↻</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenConnectModal}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="repos-filter-bar">
        <div className="search-input-wrap dev-input-wrapper">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by repository name, owner, or language... (/ to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-text-input dev-input"
          />
          {searchQuery ? (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          ) : (
            <span className="input-kbd-hint">/</span>
          )}
        </div>
      </div>

      {/* Repositories List */}
      {loadingData ? (
        <RepoSkeletonList count={3} />
      ) : dataError && repositories.length === 0 ? (
        /* Error State with Actionable Retry */
        <div className="intentional-empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="empty-state-title">Failed to load repositories</h3>
          <p className="empty-state-desc">
            Synchronization error: {dataError}. Verify your network connection or try refreshing repository data.
          </p>
          {onRetrySync && (
            <button type="button" className="btn btn-primary" onClick={onRetrySync}>
              Retry Loading Repositories ↻
            </button>
          )}
        </div>
      ) : repositories.length === 0 ? (
        /* Empty State: No Repositories */
        <div className="intentional-empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <h3 className="empty-state-title">No repositories connected yet</h3>
          <p className="empty-state-desc">
            Automatically import all your GitHub repositories or link individual codebases for autonomous AST scanning and code reviews.
          </p>
          <div className="empty-state-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-secondary ${isSyncingGithub ? 'is-loading' : ''}`}
              onClick={handleSyncClick}
              disabled={isSyncingGithub}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Sync All GitHub Repositories ↻</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={onOpenConnectModal}>
              Connect single repository →
            </button>
          </div>
        </div>
      ) : filteredRepositories.length === 0 ? (

        /* Empty State: Filter Mismatch */
        <div className="intentional-empty-state">
          <h3 className="empty-state-title">No repositories match &ldquo;{searchQuery}&rdquo;</h3>
          <p className="empty-state-desc">Try searching for a different owner, repository name, or language.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setSearchQuery('')}>
            Clear filter
          </button>
        </div>
      ) : (
        <div className="repositories-list" ref={listRef}>
          {filteredRepositories.map((repo) => {
            const isReviewRunning = triggeringReviewId === repo.id
            const ownerName = repo.full_name?.split('/')[0] || 'owner'
            const repoSlug = repo.name || repo.full_name?.split('/')[1] || repo.full_name

            return (
              <div key={repo.id} className="repo-list-item dev-card">
                <div className="repo-main-info">
                  <div className="repo-title-row">
                    <span className="repo-owner-name">{ownerName} /</span>
                    <h3 className="repo-name-heading">{repoSlug}</h3>
                    <span className={`privacy-badge ${repo.is_private ? 'private' : 'public'}`}>
                      {repo.is_private ? 'Private' : 'Public'}
                    </span>
                  </div>

                  <div className="repo-meta-row">
                    <div className="meta-item">
                      <span className="meta-label">Branch:</span>
                      <code className="code-pill branch">{repo.default_branch || 'main'}</code>
                    </div>
                    <span className="meta-sep">•</span>
                    <div className="meta-item">
                      <span className="meta-label">Language:</span>
                      <span className="meta-value">{repo.language || 'Multi-language'}</span>
                    </div>
                    <span className="meta-sep">•</span>
                    <div className="meta-item">
                      <span className="meta-label">VCS:</span>
                      <span className="meta-value uppercase">{(repo.provider || 'github').toUpperCase()}</span>
                    </div>
                    <span className="meta-sep">•</span>
                    <div className="meta-item">
                      <span className="meta-value date-highlight">{formatLastReviewed(repo.last_reviewed_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="repo-action-group">
                  <a
                    href={repo.html_url || `https://github.com/${repo.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    title="Open on GitHub"
                  >
                    GitHub ↗
                  </a>
                  <button
                    type="button"
                    className={`btn btn-primary btn-sm ${isReviewRunning ? 'is-loading' : ''}`}
                    onClick={() => onTriggerReview(repo)}
                    disabled={isReviewRunning}
                  >
                    {isReviewRunning ? (
                      <>
                        <span className="btn-spinner" />
                        <span>Scanning AST...</span>
                      </>
                    ) : (
                      <>
                        <span>Run Review ▶</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* GitHub Sync Token Modal */}
      {isTokenModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && !isSyncingGithub && setIsTokenModalOpen(false)}
        >
          <div className="modal-card glass-panel" style={{ maxWidth: 480, margin: 'auto' }}>
            <div className="modal-header">
              <div className="modal-header-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="modal-title-wrap">
                <h2 className="modal-title">Sync GitHub Repositories</h2>
                <p className="modal-subtitle">Automatically import all your codebases into the review system</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsTokenModalOpen(false)}
                disabled={isSyncingGithub}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleTokenSubmit} style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Enter your GitHub Personal Access Token (classic or fine-grained with <code>repo</code> permissions) to automatically import all your repositories:
              </p>

              {tokenError && (
                <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
                  <span>{tokenError}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="gh-token-input" style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: '#c7d2fe' }}>
                  GitHub Access Token (PAT)
                </label>
                <input
                  id="gh-token-input"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="search-text-input dev-input"
                  style={{ width: '100%' }}
                  disabled={isSyncingGithub}
                  autoFocus
                />
                <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                  Your token is securely used to synchronize your repository metadata. Generate one at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>github.com/settings/tokens</a>.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsTokenModalOpen(false)}
                  disabled={isSyncingGithub}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSyncingGithub ? 'is-loading' : ''}`}
                  disabled={isSyncingGithub}
                >
                  {isSyncingGithub ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <span>Import All Repositories →</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

