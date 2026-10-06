import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, modalReveal, scaleIn, prefersReducedMotion } from '../../animations/gsap'
import { useToast } from '../../context/ToastContext'
import './ReviewProgressModal.css'

const STAGES = [
  { id: 'preparing', title: 'Preparing repository', desc: 'Validating Git access, resolving default branch & target commit' },
  { id: 'collecting', title: 'Collecting files', desc: 'Scanning repository tree and applying size & security safeguards' },
  { id: 'retrieving', title: 'Retrieving source files', desc: 'Reading file contents safely with isolated failure boundaries' },
  { id: 'analyzing', title: 'Analyzing source', desc: 'Evaluating static AST patterns, OWASP Top 10, and event loop guards' },
  { id: 'normalizing', title: 'Normalizing findings', desc: 'Classifying severities, CWE tags, and constructing remediation patches' },
  { id: 'generating', title: 'Generating review', desc: 'Calculating quality score (0–100) and executive summary report' },
  { id: 'saving', title: 'Saving results', desc: 'Persisting findings, reviewed files, and audit trail into database' },
]

export default function ReviewProgressModal({
  isOpen = false,
  onClose,
  job = null,
  repo = null,
  error = null,
  onRetry = null,
  progress = 0,
}) {
  const navigate = useNavigate()
  const progressFillRef = useRef(null)
  const modalCardRef = useRef(null)
  const backdropRef = useRef(null)
  const iconRef = useRef(null)
  const { toast } = useToast()

  // Map backend stage string or progress to stage index
  const getActiveStageIndex = () => {
    if (error || job?.status === 'failed') return -1
    if (job?.status === 'completed' || progress >= 100) return STAGES.length

    const stageId = job?.metadata?.stage
    if (stageId) {
      const idx = STAGES.findIndex((s) => s.id === stageId)
      if (idx !== -1) return idx
    }

    // Fallback based on progress percentage
    if (progress < 25) return 0
    if (progress < 45) return 1
    if (progress < 60) return 2
    if (progress < 75) return 3
    if (progress < 85) return 4
    if (progress < 95) return 5
    return 6
  }

  const activeStageIndex = getActiveStageIndex()
  const isCompleted = job?.status === 'completed' || (progress >= 100 && !error)
  const isFailed = job?.status === 'failed' || Boolean(error)

  // Modal entrance animation
  useEffect(() => {
    if (isOpen && modalCardRef.current) {
      modalReveal(modalCardRef.current, backdropRef.current)
    }
  }, [isOpen])

  // Animate progress bar fill smoothly
  useEffect(() => {
    if (prefersReducedMotion()) return
    if (progressFillRef.current) {
      gsap.to(progressFillRef.current, {
        width: `${Math.min(100, Math.max(8, progress))}%`,
        duration: 0.35,
        ease: 'power2.out',
      })
    }
  }, [progress])

  // Completion / Failure micro-animations and feedback
  useEffect(() => {
    if (isCompleted && iconRef.current) {
      scaleIn(iconRef.current, { scale: 0.85, duration: 0.35 })
      toast.success('Autonomous AST review pipeline completed!', 'Review Ready')
    } else if (isFailed && iconRef.current) {
      scaleIn(iconRef.current, { scale: 0.85, duration: 0.35 })
      toast.error('Review pipeline halted on error.', 'Execution Issue')
    }
  }, [isCompleted, isFailed])

  if (!isOpen) return null

  const repoName = repo?.full_name || repo?.name || job?.repositories?.full_name || 'Repository'
  const branchName = job?.branch || repo?.default_branch || 'main'

  return (
    <div className="review-progress-backdrop" ref={backdropRef}>
      <div className="review-progress-card glass-panel" ref={modalCardRef}>
        {/* Header */}
        <div className="progress-card-header">
          <div className="progress-header-icon-wrap" ref={iconRef}>
            {isCompleted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : isFailed ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <span className="spinner-progress-dot" />
            )}
          </div>

          <div className="progress-header-text">
            <h2 className="progress-modal-title">
              {isCompleted ? 'Review Completed Successfully' : isFailed ? 'Review Pipeline Encountered Error' : 'Autonomous Review in Progress'}
            </h2>
            <p className="progress-modal-sub">
              Analyzing <code className="code-pill mono">{repoName}</code> on branch <code className="code-pill branch">{branchName}</code>
            </p>
          </div>

          {/* Close button only enabled if completed or failed */}
          {(isCompleted || isFailed) && (
            <button type="button" className="progress-close-btn" onClick={onClose} title="Close">
              ×
            </button>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${isCompleted ? 'completed' : isFailed ? 'failed' : ''}`}
              ref={progressFillRef}
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          </div>
          <div className="progress-bar-meta">
            <span className="progress-status-caption">
              {isCompleted
                ? 'All pipeline stages finished'
                : isFailed
                ? 'Execution halted'
                : STAGES[activeStageIndex]?.title || 'Processing pipeline...'}
            </span>
            <span className="progress-percent-label">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Real Stage Stepper */}
        <div className="pipeline-stages-list">
          {STAGES.map((stage, idx) => {
            const isStepCompleted = isCompleted || activeStageIndex > idx
            const isStepActive = !isCompleted && !isFailed && activeStageIndex === idx
            const isStepPending = !isCompleted && !isFailed && activeStageIndex < idx

            return (
              <div
                key={stage.id}
                className={`stage-row ${isStepCompleted ? 'done' : isStepActive ? 'active' : isStepPending ? 'pending' : ''}`}
              >
                {/* Stage Indicator Icon */}
                <div className="stage-indicator-wrap">
                  {isStepCompleted ? (
                    <span className="stage-icon-done">✓</span>
                  ) : isStepActive ? (
                    <span className="stage-icon-active-pulse" />
                  ) : (
                    <span className="stage-icon-pending">{idx + 1}</span>
                  )}
                  {idx < STAGES.length - 1 && <span className="stage-line-connector" />}
                </div>

                {/* Stage Description */}
                <div className="stage-text-block">
                  <div className="stage-title-row">
                    <span className="stage-title">{stage.title}</span>
                    {isStepActive && <span className="stage-live-badge">Running</span>}
                  </div>
                  <span className="stage-desc">{stage.desc}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Error Details Box (if failed) */}
        {isFailed && (
          <div className="review-failed-notice">
            <div className="failed-title">Error Diagnosis:</div>
            <p className="failed-message">
              {error || job?.error_message || 'The review pipeline encountered an unexpected error.'}
            </p>
            <p className="failed-advice">
              Verify that the repository exists on GitHub, default branch is accessible, and VCS rate limits are not exceeded.
            </p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="progress-card-footer">
          {isCompleted && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose()
                  if (job?.id) navigate(`/reviews/${job.id}`)
                }}
              >
                Open Review Results Screen →
              </button>
            </>
          )}

          {isFailed && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                Dismiss
              </button>
              {onRetry && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onRetry}
                >
                  Retry Review Pipeline ↻
                </button>
              )}
            </>
          )}

          {!isCompleted && !isFailed && (
            <span className="running-notice-text">
              AST analyzer is evaluating code in sandbox. You can keep this open or close safely.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
