import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false })

  const [showOauthSetupModal, setShowOauthSetupModal] = useState(false)
  const [copiedCallback, setCopiedCallback] = useState(false)

  const { signUp, signInWithOAuth, user, loading: authLoading, authError, clearError } = useAuth()
  const navigate = useNavigate()

  // Animation references
  const pageRef = useRef(null)
  const editorialVisualRef = useRef(null)
  const headlineRef = useRef(null)
  const accentWordRef = useRef(null)
  const kickerRef = useRef(null)
  const subStatementRef = useRef(null)
  const bottomMetaRef = useRef(null)
  const formPanelRef = useRef(null)

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, navigate])

  // GSAP Entrance Sequence
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        editorialVisualRef.current,
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1.03, duration: 1.1, ease: 'power2.out' },
        0
      )

      tl.fromTo(
        [kickerRef.current, subStatementRef.current, bottomMetaRef.current],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.08 },
        0.2
      )

      const lines = headlineRef.current?.querySelectorAll('.editorial-display-line span')
      if (lines && lines.length > 0) {
        tl.fromTo(
          lines,
          { opacity: 0, y: 48 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out' },
          0.25
        )
      }

      tl.fromTo(
        formPanelRef.current,
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.75, ease: 'power2.out' },
        0.35
      )
    }, pageRef)

    return () => ctx.revert()
  }, [])

  // Interactive cursor hover on headline
  const handleEditorialMouseMove = (e) => {
    if (!accentWordRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    gsap.to(accentWordRef.current, {
      x: x * 10,
      y: y * 6,
      duration: 0.35,
      ease: 'power1.out',
    })
  }

  const handleEditorialMouseLeave = () => {
    if (!accentWordRef.current) return
    gsap.to(accentWordRef.current, {
      x: 0,
      y: 0,
      duration: 0.45,
      ease: 'power2.out',
    })
  }

  const getFriendlyAuthError = (err) => {
    if (!err) return null
    const lower = err.toLowerCase()
    if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already exists')) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many sign-up attempts. Please wait 60 seconds before retrying.'
    }
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
      return 'Unable to reach authentication service. Please check your network connection.'
    }
    return err
  }

  const activeError = errorMsg || authError

  const handleSignUp = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    clearError()

    let hasError = false
    const newFieldErrors = { email: false, password: false }

    if (!email || !email.includes('@')) {
      newFieldErrors.email = true
      hasError = true
    }

    if (!password || password.length < 6) {
      newFieldErrors.password = true
      hasError = true
    }

    setFieldErrors(newFieldErrors)

    if (hasError) {
      if (password && password.length < 6) {
        setErrorMsg('Password should be at least 6 characters.')
      } else {
        setErrorMsg('Please enter a valid work email and password.')
      }
      return
    }

    setSubmitting(true)

    const res = await signUp({ email, password, fullName })

    if (res.success) {
      setIsSuccess(true)
      if (res.data?.session) {
        setSuccessMsg('Account created and verified! Redirecting to console...')
        setTimeout(() => navigate('/dashboard', { replace: true }), 900)
      } else if (res.data?.user?.identities?.length === 0) {
        setErrorMsg('An account with this email already exists. Please sign in instead.')
        setSubmitting(false)
        setIsSuccess(false)
      } else {
        setSuccessMsg('Account created successfully! Check your email to confirm your address, then sign in.')
        setSubmitting(false)
      }
    } else {
      setErrorMsg(res.error || 'Registration failed. Please check your details.')
      setSubmitting(false)
    }
  }

  const handleOAuth = async (provider) => {
    setErrorMsg(null)
    clearError()
    const res = await signInWithOAuth({ provider })
    if (!res.success) {
      if (res.code === 'PROVIDER_NOT_ENABLED') {
        setShowOauthSetupModal(true)
      } else {
        setErrorMsg(res.error || `Failed to initialize ${provider} registration.`)
      }
    }
  }

  return (
    <div className="login-editorial-page" ref={pageRef}>
      <div className="login-editorial-grid">
        {/* ============================================================
            LEFT PANEL: EDITORIAL STATEMENT & ENGINEERING PHOTOGRAPHY
            ============================================================ */}
        <section
          className="login-editorial-left"
          onMouseMove={handleEditorialMouseMove}
          onMouseLeave={handleEditorialMouseLeave}
          aria-label="Editorial Brand Overview"
        >
          <div className="editorial-visual-background">
            <img
              ref={editorialVisualRef}
              src="/images/engineering/engineering-01.jpg"
              alt="Engineering team analyzing code pull request"
              className="editorial-visual-img"
              loading="lazy"
              decoding="async"
            />
            <div className="editorial-visual-scrim" />
            <div className="editorial-visual-grid-overlay" />
          </div>

          <header className="editorial-top-meta">
            <Link to="/" className="editorial-brand-link" title="Return to Homepage">
              <div className="editorial-brand-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                  <circle cx="12" cy="12" r="2.2" fill="currentColor" />
                </svg>
              </div>
              <span className="editorial-brand-name">Code Review Agent</span>
              <span className="editorial-brand-tag">REGISTER // 002</span>
            </Link>

            <div className="editorial-status-pill">
              <span className="status-dot-pulse" aria-hidden="true" />
              <span>Ready to Provision</span>
            </div>
          </header>

          <div className="editorial-headline-container">
            <div className="editorial-kicker" ref={kickerRef}>
              <span>// 002 — ENGINEERING AT VELOCITY</span>
            </div>

            <h1 className="editorial-display-heading" ref={headlineRef}>
              <span className="editorial-display-line">
                <span>SCALE YOUR</span>
              </span>
              <span className="editorial-display-line">
                <span className="accent-word" ref={accentWordRef}>
                  REVIEWS.
                </span>
              </span>
              <span className="editorial-display-line">
                <span>ZERO BLIND</span>
              </span>
              <span className="editorial-display-line">
                <span>SPOTS.</span>
              </span>
            </h1>

            <p className="editorial-sub-statement" ref={subStatementRef}>
              Equip your development pipeline with multi-model AST static analysis, automated edge case detection, and actionable inline pull request feedback.
            </p>
          </div>

          <footer className="editorial-bottom-meta" ref={bottomMetaRef}>
            <div className="editorial-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Setup Time</span>
                <span className="meta-value">&lt; 60 Seconds</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Integration</span>
                <span className="meta-value">GitHub App &amp; Webhook</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Encryption</span>
                <span className="meta-value">AES-256 at Rest</span>
              </div>
            </div>

            <div className="editorial-security-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Zero telemetry on private source code. Non-destructive repository read access.</span>
            </div>
          </footer>
        </section>

        {/* ============================================================
            RIGHT PANEL: REGISTRATION INTERFACE
            ============================================================ */}
        <section className="login-editorial-right" ref={formPanelRef} aria-label="Sign Up Interface">
          <nav className="auth-top-nav">
            <Link to="/" className="auth-nav-back">
              <span>&larr;</span>
              <span>Back to overview</span>
            </Link>

            <span className="auth-session-tag">PROVISION // ACCOUNT</span>
          </nav>

          <div className="auth-form-wrapper">
            <header className="auth-editorial-header">
              <h2 className="auth-editorial-title">Create Account</h2>
              <p className="auth-editorial-desc">
                Deploy autonomous review agents across your GitHub repositories in under two minutes.
              </p>
            </header>

            {activeError && (
              <div className="auth-feedback-banner error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{getFriendlyAuthError(activeError)}</span>
              </div>
            )}

            {successMsg && (
              <div className="auth-feedback-banner success" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="button"
              className="auth-github-btn"
              onClick={() => handleOAuth('github')}
              disabled={submitting || isSuccess}
              aria-label="Sign up with GitHub"
            >
              <div className="github-btn-content">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </div>
              <span className="github-arrow-icon">&rarr;</span>
            </button>

            <div className="auth-editorial-divider" aria-hidden="true">
              <span>or register with email</span>
            </div>

            <form onSubmit={handleSignUp} className="auth-editorial-form" noValidate>
              <div className="auth-field-group">
                <div className="auth-field-label-row">
                  <label htmlFor="signup-name">Developer / Team Name</label>
                  <span className="auth-field-meta">OPTIONAL</span>
                </div>
                <div className="auth-input-container">
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Jane Developer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    disabled={submitting || isSuccess}
                    className="auth-text-input"
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="auth-field-label-row">
                  <label htmlFor="signup-email">Work Email</label>
                  <span className="auth-field-meta">REQUIRED</span>
                </div>
                <div className="auth-input-container">
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="developer@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: false }))
                    }}
                    autoComplete="email"
                    disabled={submitting || isSuccess}
                    className={`auth-text-input ${fieldErrors.email ? 'has-error' : ''}`}
                    aria-invalid={fieldErrors.email}
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="auth-field-label-row">
                  <label htmlFor="signup-password">Password</label>
                  <span className="auth-field-meta">MIN 6 CHARS</span>
                </div>
                <div className="auth-input-container">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: false }))
                    }}
                    autoComplete="new-password"
                    disabled={submitting || isSuccess}
                    className={`auth-text-input ${fieldErrors.password ? 'has-error' : ''}`}
                    aria-invalid={fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="auth-input-adornment"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`auth-primary-submit-btn ${submitting ? 'is-loading' : ''} ${isSuccess ? 'is-success' : ''}`}
                disabled={submitting || isSuccess}
              >
                {submitting && <span className="btn-spinner" aria-hidden="true" />}
                <span>
                  {isSuccess
                    ? 'ACCOUNT PROVISIONED ✓'
                    : submitting
                    ? 'PROVISIONING...'
                    : 'CREATE ACCOUNT'}
                </span>
                {!submitting && !isSuccess && <span className="auth-cta-arrow">&rarr;</span>}
              </button>
            </form>

            <div className="auth-switch-prompt">
              <span>Already have an account?</span>{' '}
              <Link to="/login" className="auth-action-link">
                Sign in &rarr;
              </Link>
            </div>
          </div>

          <footer className="auth-right-footer">
            <span className="auth-footer-tech">ZERO SOURCE CODE RETENTION</span>
            <span className="auth-footer-tech">PROVISIONING ENGINE V2.4</span>
          </footer>
        </section>
      </div>

      {showOauthSetupModal && (
        <div className="modal-backdrop" onClick={() => setShowOauthSetupModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="modal-title-wrap">
                <h3 className="modal-title">Enable GitHub OAuth in Supabase</h3>
                <p className="modal-subtitle">One-time configuration required to enable GitHub sign-in</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowOauthSetupModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                Supabase requires GitHub to be toggled on in your project dashboard with a GitHub OAuth Client ID and Secret:
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#ff6b4a', fontWeight: 600, marginBottom: '0.35rem' }}>
                  STEP 1: Create OAuth App on GitHub
                </span>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem' }}>
                  Open{' '}
                  <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer" style={{ color: '#ff6b4a', textDecoration: 'underline' }}>
                    github.com/settings/applications/new
                  </a>{' '}
                  and paste this Authorization Callback URL:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value="https://byztyberaoyczdaffbbe.supabase.co/auth/v1/callback"
                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e6edf3', padding: '0.35rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText('https://byztyberaoyczdaffbbe.supabase.co/auth/v1/callback')
                      setCopiedCallback(true)
                      setTimeout(() => setCopiedCallback(false), 2000)
                    }}
                  >
                    {copiedCallback ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#ff6b4a', fontWeight: 600, marginBottom: '0.35rem' }}>
                  STEP 2: Enable in Supabase Dashboard
                </span>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem' }}>
                  Go to{' '}
                  <a href="https://supabase.com/dashboard/project/byztyberaoyczdaffbbe/auth/providers" target="_blank" rel="noopener noreferrer" style={{ color: '#ff6b4a', textDecoration: 'underline' }}>
                    Authentication &rarr; Providers &rarr; GitHub
                  </a>, toggle <strong>Enable GitHub</strong>, paste your Client ID &amp; Client Secret, and click Save.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOauthSetupModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="auth-primary-submit-btn"
                  style={{ width: 'auto', padding: '0.55rem 1rem', fontSize: '0.8rem', marginTop: 0 }}
                  onClick={() => {
                    setShowOauthSetupModal(false)
                    handleOAuth('github')
                  }}
                >
                  Retry GitHub Login ↻
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
