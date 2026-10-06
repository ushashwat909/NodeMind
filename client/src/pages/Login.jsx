import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const [showOauthSetupModal, setShowOauthSetupModal] = useState(false)
  const [copiedCallback, setCopiedCallback] = useState(false)

  const { signIn, signInWithOAuth, user, loading: authLoading, authError, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = location.state?.from?.pathname || '/dashboard'

  const getFriendlyAuthError = (err) => {
    if (!err) return null
    const lower = err.toLowerCase()
    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Invalid email or password. Please verify your credentials and try again.'
    }
    if (lower.includes('email not confirmed')) {
      return 'Email address has not been confirmed. Check your inbox for the confirmation email or check spam.'
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many login attempts. Please wait 60 seconds before retrying.'
    }
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
      return 'Unable to reach authentication service. Check your network connection and try again.'
    }
    return err
  }

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!authLoading && user) {
      navigate(destination, { replace: true })
    }
  }, [user, authLoading, navigate, destination])

  const activeError = errorMsg || authError

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    clearError()

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setSubmitting(true)

    const res = await signIn({ email, password })

    if (res.success) {
      setSuccessMsg('Authentication successful. Redirecting...')
      setTimeout(() => {
        navigate(destination, { replace: true })
      }, 600)
    } else {
      setErrorMsg(res.error || 'Invalid email or password.')
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
        setErrorMsg(res.error || `Failed to initialize ${provider} authentication.`)
      }
    }
  }


  return (
    <div className="auth-page">
      <div className="auth-ambient-glow" aria-hidden="true" />
      <div className="auth-container">
        {/* Brand */}
        <Link to="/" className="auth-brand" title="Back to Homepage">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
            </svg>
          </div>
          <span className="brand-name">Code Review Agent</span>
        </Link>

        {/* Auth Card */}
        <div className="auth-card glass-panel">
          <h1 className="auth-title">Sign in to your account</h1>
          <p className="auth-subtitle">
            Access your analyzed repositories and pull request findings.
          </p>

          {activeError && (
            <div className="auth-alert error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{getFriendlyAuthError(activeError)}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert success" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* GitHub OAuth button */}
          <button
            type="button"
            className="btn btn-secondary oauth-btn"
            onClick={() => handleOAuth('github')}
            disabled={submitting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
            </svg>
            <span>Continue with GitHub</span>
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <div className="label-with-link">
                <label htmlFor="login-password">Password</label>
              </div>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>

            <button type="submit" className={`btn btn-primary auth-submit-btn ${submitting ? 'is-loading' : ''}`} disabled={submitting}>
              {submitting && <span className="btn-spinner" />}
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="auth-footer-prompt">
            <span>Don&apos;t have an account?</span>{' '}
            <Link to="/signup" className="auth-switch-link">
              Create an account
            </Link>
          </div>
        </div>

        <Link to="/" className="back-home-link">
          &larr; Back to Code Review Agent
        </Link>
      </div>

      {showOauthSetupModal && (
        <div className="modal-backdrop" onClick={() => setShowOauthSetupModal(false)}>
          <div className="modal-card glass-panel" style={{ maxWidth: 520, margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="modal-title-wrap">
                <h2 className="modal-title">Enable GitHub OAuth in Supabase</h2>
                <p className="modal-subtitle">One-time configuration required to enable GitHub sign-in</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowOauthSetupModal(false)}>×</button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, margin: 0 }}>
                Supabase requires GitHub to be toggled on in your project dashboard with a GitHub OAuth Client ID and Secret:
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.35rem' }}>
                  STEP 1: Create OAuth App on GitHub
                </span>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem' }}>
                  Open <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>github.com/settings/applications/new</a> and paste this Authorization Callback URL:
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
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.35rem' }}>
                  STEP 2: Enable in Supabase Dashboard
                </span>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem' }}>
                  Go to <a href="https://supabase.com/dashboard/project/byztyberaoyczdaffbbe/auth/providers" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>Authentication &rarr; Providers &rarr; GitHub</a>, toggle <strong>Enable GitHub</strong>, paste your Client ID & Client Secret, and click Save.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOauthSetupModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
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

