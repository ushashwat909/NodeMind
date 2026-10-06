import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { modalReveal, fadeUp } from '@/animations/gsap'
import { useToast } from '@/context/ToastContext'
import './ConnectRepoModal.css'

const POPULAR_REPOS = [
  { name: 'expressjs/express', label: 'Express.js', lang: 'JavaScript' },
  { name: 'facebook/react', label: 'React', lang: 'JavaScript' },
  { name: 'vercel/next.js', label: 'Next.js', lang: 'TypeScript' },
  { name: 'tailwindlabs/tailwindcss', label: 'Tailwind CSS', lang: 'TypeScript' },
]

export default function ConnectRepoModal({ isOpen, onClose, onRepositoryConnected }) {
  const [step, setStep] = useState('input') // 'input' | 'validating' | 'preview' | 'connecting' | 'success' | 'error'
  const [repoUrl, setRepoUrl] = useState('')
  const [validatedData, setValidatedData] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [createdRepo, setCreatedRepo] = useState(null)

  const cardRef = useRef(null)
  const backdropRef = useRef(null)
  const stepContainerRef = useRef(null)
  const { toast } = useToast()

  // Reset modal state when opened & animate entrance
  useEffect(() => {
    if (isOpen) {
      setStep('input')
      setRepoUrl('')
      setValidatedData(null)
      setSelectedBranch('')
      setErrorMessage(null)
      setCreatedRepo(null)

      if (cardRef.current) {
        modalReveal(cardRef.current, backdropRef.current)
      }
    }
  }, [isOpen])

  // GSAP animation when switching steps
  useEffect(() => {
    if (stepContainerRef.current) {
      fadeUp(stepContainerRef.current, { y: 10, duration: 0.25 })
    }
  }, [step])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && step !== 'connecting') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, step, onClose])

  if (!isOpen) return null

  // Action: Validate repository with backend
  const handleValidate = async (targetUrl = null) => {
    const urlToValidate = (targetUrl || repoUrl).trim()
    if (!urlToValidate) {
      setErrorMessage('Please enter a GitHub repository URL or "owner/repo" name.')
      setStep('input')
      return
    }

    setErrorMessage(null)
    setStep('validating')

    try {
      const response = await api.validateRepository(urlToValidate, 'github')

      if (response?.data?.valid) {
        setValidatedData(response.data)
        setSelectedBranch(response.data.repository?.defaultBranch || 'main')
        setStep('preview')
      } else {
        throw new Error('Repository could not be verified on GitHub.')
      }
    } catch (err) {
      console.error('Validation error:', err)
      setErrorMessage(
        err.message || 'Unable to connect to GitHub. Please verify the URL is public or spelling is correct.'
      )
      setStep('error')
    }
  }

  // Quick Preset Click
  const handleSelectPreset = (fullName) => {
    const url = `https://github.com/${fullName}`
    setRepoUrl(url)
    handleValidate(url)
  }

  // Action: Confirm and Connect Repository
  const handleConfirmConnect = async () => {
    if (!validatedData?.parsed?.fullName) return

    setErrorMessage(null)
    setStep('connecting')

    try {
      const payload = {
        url: validatedData.parsed.htmlUrl,
        fullName: validatedData.parsed.fullName,
        provider: 'github',
        defaultBranch: selectedBranch || validatedData.repository?.defaultBranch || 'main',
      }

      const res = await api.connectRepository(payload)

      if (res?.data) {
        setCreatedRepo(res.data)
        setStep('success')
        toast.success(`Repository ${res.data.full_name} is now connected.`, 'Repository Connected')
        if (onRepositoryConnected) {
          onRepositoryConnected(res.data)
        }
      } else {
        throw new Error('Failed to save repository.')
      }
    } catch (err) {
      console.error('Connection error:', err)
      setErrorMessage(err.message || 'Failed to persist repository in database.')
      setStep('error')
    }
  }

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={(e) => e.target === e.currentTarget && step !== 'connecting' && onClose()}>
      <div className="modal-card glass-panel" ref={cardRef}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
            </svg>
          </div>
          <div className="modal-title-wrap">
            <h2 className="modal-title">Connect GitHub Repository</h2>
            <p className="modal-subtitle">Configure autonomous AST code review for your codebase</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={step === 'connecting'} title="Close">
            ×
          </button>
        </div>

        {/* Step Body */}
        <div className="modal-body" ref={stepContainerRef}>
          {/* STEP 1: Input URL */}
          {step === 'input' && (
            <div className="step-input-view">
              <label htmlFor="repo-url-input" className="form-label">
                Repository URL or Handle
              </label>
              <div className="input-with-button">
                <input
                  id="repo-url-input"
                  type="text"
                  placeholder="https://github.com/owner/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                  className="repo-text-input"
                  autoFocus
                />
                <button
                  type="button"
                  className={`btn btn-primary ${step === 'validating' ? 'is-loading' : ''}`}
                  onClick={() => handleValidate()}
                  disabled={!repoUrl.trim() || step === 'validating'}
                >
                  {step === 'validating' && <span className="btn-spinner" />}
                  <span>{step === 'validating' ? 'Inspecting...' : 'Inspect →'}</span>
                </button>
              </div>

              <div className="presets-section">
                <span className="presets-label">Or try a popular open-source project:</span>
                <div className="preset-chips">
                  {POPULAR_REPOS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      className="preset-chip"
                      onClick={() => handleSelectPreset(item.name)}
                    >
                      <span className="preset-name">{item.name}</span>
                      <span className="preset-lang">{item.lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="security-notice-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>SSRF-protected. Public repositories supported directly. OAuth connection available for private repositories.</span>
              </div>
            </div>
          )}

          {/* STEP 2: Validating Skeleton */}
          {step === 'validating' && (
            <div className="step-validating-view">
              <div className="skeleton-loader-card">
                <div className="skeleton-header">
                  <div className="skeleton-avatar skeleton-pulse" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line skeleton-pulse" style={{ width: '60%' }} />
                    <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
                  </div>
                </div>
                <div className="skeleton-line skeleton-pulse" style={{ width: '90%', marginTop: '1rem' }} />
                <div className="skeleton-line skeleton-pulse" style={{ width: '75%' }} />
              </div>

              <div className="validating-status-indicator">
                <div className="spinner-dot-ring" />
                <div className="validating-text">
                  <span className="validating-title">Contacting GitHub API...</span>
                  <span className="validating-sub">Parsing repository tree, verifying commits and branches</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview Metadata & Select Branch */}
          {step === 'preview' && validatedData && (
            <div className="step-preview-view">
              {/* Repository Metadata Card */}
              <div className="repo-metadata-card">
                <div className="repo-meta-header">
                  {validatedData.repository?.ownerAvatarUrl && (
                    <img
                      src={validatedData.repository.ownerAvatarUrl}
                      alt={validatedData.repository.owner}
                      className="repo-owner-avatar"
                    />
                  )}
                  <div className="repo-meta-title-block">
                    <div className="repo-full-name-row">
                      <h3 className="repo-full-name">{validatedData.repository?.fullName}</h3>
                      <span className={`privacy-badge ${validatedData.repository?.isPrivate ? 'private' : 'public'}`}>
                        {validatedData.repository?.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>
                    <a
                      href={validatedData.repository?.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="repo-external-link"
                    >
                      {validatedData.repository?.htmlUrl} ↗
                    </a>
                  </div>
                </div>

                {validatedData.repository?.description && (
                  <p className="repo-description">{validatedData.repository.description}</p>
                )}

                {/* Tech Pills */}
                <div className="repo-stats-pills">
                  <span className="stat-pill language-pill">
                    <span className="lang-indicator-dot" />
                    {validatedData.repository?.language || 'Multi-language'}
                  </span>
                  <span className="stat-pill">
                    ★ {validatedData.repository?.starsCount?.toLocaleString() || 0} stars
                  </span>
                  <span className="stat-pill">
                    ⑂ {validatedData.repository?.forksCount?.toLocaleString() || 0} forks
                  </span>
                </div>

                {/* Latest Commit Preview */}
                {validatedData.latestCommit && (
                  <div className="latest-commit-box">
                    <div className="commit-header-row">
                      <span className="commit-tag">Latest Commit ({validatedData.latestCommit.shortSha})</span>
                      <span className="commit-author">by {validatedData.latestCommit.author}</span>
                    </div>
                    <div className="commit-message-text">{validatedData.latestCommit.message}</div>
                  </div>
                )}
              </div>

              {/* Branch Selector */}
              <div className="branch-select-section">
                <label htmlFor="branch-select" className="form-label">
                  Monitored Review Branch
                </label>
                <div className="select-wrap">
                  <select
                    id="branch-select"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="branch-dropdown"
                  >
                    {(Array.isArray(validatedData?.branches) && validatedData.branches.length > 0
                      ? validatedData.branches
                      : [validatedData?.repository?.defaultBranch || 'main']
                    ).map((branch) => (
                      <option key={branch} value={branch}>
                        {branch} {branch === validatedData.repository?.defaultBranch ? '(default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep('input')}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className={`btn btn-primary confirm-connect-btn ${step === 'connecting' ? 'is-loading' : ''}`}
                  onClick={handleConfirmConnect}
                  disabled={step === 'connecting'}
                >
                  {step === 'connecting' && <span className="btn-spinner" />}
                  <span>{step === 'connecting' ? 'Connecting...' : 'Confirm & Track Repository →'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Connecting State */}
          {step === 'connecting' && (
            <div className="step-connecting-view">
              <div className="spinner-dot-ring large-spinner" />
              <h3 className="connecting-title">Connecting Repository...</h3>
              <p className="connecting-sub">Persisting repository configuration to Supabase PostgreSQL and preparing AST analysis pipeline.</p>
            </div>
          )}

          {/* STEP 5: Success State */}
          {step === 'success' && (
            <div className="step-success-view">
              <div className="success-icon-badge">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 className="success-title">Repository Connected!</h3>
              <p className="success-desc">
                <strong>{createdRepo?.full_name || validatedData?.parsed?.fullName}</strong> is now linked to your Code Review Agent account.
              </p>
              <div className="success-details-card">
                <div className="detail-row">
                  <span>Default Branch:</span>
                  <code>{createdRepo?.default_branch || selectedBranch}</code>
                </div>
                <div className="detail-row">
                  <span>Language:</span>
                  <span>{createdRepo?.language || validatedData?.repository?.language}</span>
                </div>
                <div className="detail-row">
                  <span>AST Scanner Status:</span>
                  <span className="status-live-tag">
                    <span className="status-dot online pulse" /> Active &amp; Ready
                  </span>
                </div>
              </div>

              <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                View in Dashboard →
              </button>
            </div>
          )}

          {/* STEP 6: Error State */}
          {step === 'error' && (
            <div className="step-error-view">
              <div className="auth-alert error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div className="alert-content">
                  <div className="alert-title">Connection Failed</div>
                  <div className="alert-message">{errorMessage || 'An error occurred while validating the repository.'}</div>
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep('input')}
                >
                  ← Try Another URL
                </button>
                <button
                  type="button"
                  className={`btn btn-primary ${step === 'validating' ? 'is-loading' : ''}`}
                  onClick={() => handleValidate()}
                  disabled={step === 'validating'}
                >
                  {step === 'validating' && <span className="btn-spinner" />}
                  <span>{step === 'validating' ? 'Inspecting...' : 'Retry Inspection ↻'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
