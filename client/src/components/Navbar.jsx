import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from '@/animations/gsap'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import './Navbar.css'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [healthStatus, setHealthStatus] = useState('checking')
  const { user, signOut } = useAuth()
  const navRef = useRef(null)

  // Detect scroll to adjust navbar background blur/border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check backend health for subtle status badge
  useEffect(() => {
    let mounted = true

    const checkHealth = async () => {
      try {
        await api.health()
        if (mounted) setHealthStatus('online')
      } catch {
        if (mounted) setHealthStatus('degraded')
      }
    }

    checkHealth()
    const timer = setInterval(checkHealth, 10000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  // GSAP entrance animation for navbar
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
    }, navRef)

    return () => ctx.revert()
  }, [])

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`} ref={navRef}>
      <div className="container navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" aria-label="Code Review Agent Home">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Code Review Agent</span>
            <span className="brand-badge">v0.1</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          <a href="/#features" className="nav-link">Product</a>
          <a href="/#how-it-works" className="nav-link">How it works</a>
          <a href="/#code-inspector" className="nav-link">Code Inspector</a>
          <a href="/#security" className="nav-link">Security</a>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Engine status indicator */}
          <div className="engine-status-pill" title={`Analysis Engine: ${healthStatus === 'online' ? 'Online' : 'Standby'}`}>
            <span className={`status-dot ${healthStatus}`}></span>
            <span className="status-label">
              {healthStatus === 'online' ? 'Engine Ready' : 'Standby'}
            </span>
          </div>

          {user ? (
            <div className="nav-auth-group">
              <Link to="/dashboard" className="btn btn-secondary nav-dashboard-btn" title="Go to Dashboard">
                <span className="nav-user-indicator" />
                <span className="nav-user-label">Dashboard</span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost nav-signout-btn"
                onClick={() => signOut()}
                title="Sign out of your session"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost nav-signin-btn">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-primary nav-cta-btn">
                <span>Get started</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button 
            type="button" 
            className="mobile-toggle"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <nav className="mobile-nav">
            <a href="/#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Product</a>
            <a href="/#how-it-works" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="/#code-inspector" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Code Inspector</a>
            <a href="/#security" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Security</a>
            <hr className="mobile-divider" />
            {user ? (
              <>
                <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard ({user.email})
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary mobile-cta-btn"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut()
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                <Link to="/signup" className="btn btn-primary mobile-cta-btn" onClick={() => setMobileMenuOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
