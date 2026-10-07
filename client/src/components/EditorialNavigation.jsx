import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'
import { supabase } from '@/lib/supabase'
import './EditorialNavigation.css'

export default function EditorialNavigation() {
  const [session, setSession] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const overlayRef = useRef(null)
  const menuLinksRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      authListener?.subscription?.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Animate Mobile Menu Overlay
  useEffect(() => {
    if (!overlayRef.current) return
    if (prefersReducedMotion()) {
      overlayRef.current.style.display = mobileMenuOpen ? 'flex' : 'none'
      return
    }

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      const tl = gsap.timeline()
      tl.set(overlayRef.current, { display: 'flex', opacity: 0 })
        .to(overlayRef.current, { opacity: 1, duration: 0.35, ease: 'power2.out' })
        .fromTo(
          menuLinksRef.current.querySelectorAll('.mobile-menu-item'),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' },
          '-=0.2'
        )
    } else {
      document.body.style.overflow = ''
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          if (overlayRef.current) overlayRef.current.style.display = 'none'
        },
      })
    }
  }, [mobileMenuOpen])

  const handleNavClick = (anchorId) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(anchorId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className={`editorial-nav-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="editorial-nav-container">
          {/* Brand */}
          <Link to="/" className="editorial-nav-brand" aria-label="NodeMind Home">
            <span className="brand-dot-indicator" />
            <span className="brand-title-primary">NODEMIND</span>
            <span className="brand-meta-code">/ AG-2.4</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="editorial-nav-links" aria-label="Main Navigation">
            <button
              type="button"
              className="editorial-nav-link"
              onClick={() => handleNavClick('code-showcase')}
            >
              PRODUCT
            </button>
            <button
              type="button"
              className="editorial-nav-link"
              onClick={() => handleNavClick('engineers-who-ship')}
            >
              CULTURE
            </button>
            <button
              type="button"
              className="editorial-nav-link"
              onClick={() => handleNavClick('how-it-works')}
            >
              HOW IT WORKS
            </button>
            <button
              type="button"
              className="editorial-nav-link"
              onClick={() => handleNavClick('capabilities')}
            >
              WHAT WE REVIEW
            </button>
            <button
              type="button"
              className="editorial-nav-link"
              onClick={() => handleNavClick('security')}
            >
              SECURITY
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="editorial-nav-actions">
            {session ? (
              <Link to="/dashboard" className="editorial-btn-primary">
                <span>DASHBOARD</span>
                <span className="btn-arrow-mark">→</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="editorial-btn-ghost">
                  SIGN IN
                </Link>
                <Link to="/signup" className="editorial-btn-primary">
                  <span>GET STARTED</span>
                  <span className="btn-arrow-mark">→</span>
                </Link>
              </>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              className="editorial-mobile-trigger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="trigger-label">MENU</span>
              <span className="trigger-bars">
                <span className="bar-line" />
                <span className="bar-line" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Editorial Mobile Overlay */}
      <div
        ref={overlayRef}
        className="editorial-mobile-overlay"
        style={{ display: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <div className="mobile-overlay-header">
          <div className="overlay-brand">
            <span className="brand-dot-indicator" />
            <span className="brand-title-primary">NODEMIND</span>
          </div>
          <button
            type="button"
            className="mobile-overlay-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <span>CLOSE</span>
            <span className="close-cross">×</span>
          </button>
        </div>

        <nav ref={menuLinksRef} className="mobile-overlay-links">
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => handleNavClick('code-showcase')}
          >
            <span className="item-num">01</span>
            <span className="item-text">PRODUCT</span>
          </button>
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => handleNavClick('engineers-who-ship')}
          >
            <span className="item-num">02</span>
            <span className="item-text">CULTURE</span>
          </button>
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => handleNavClick('how-it-works')}
          >
            <span className="item-num">03</span>
            <span className="item-text">HOW IT WORKS</span>
          </button>
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => handleNavClick('capabilities')}
          >
            <span className="item-num">04</span>
            <span className="item-text">WHAT WE REVIEW</span>
          </button>
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => handleNavClick('security')}
          >
            <span className="item-num">05</span>
            <span className="item-text">SECURITY</span>
          </button>
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => {
              setMobileMenuOpen(false)
              navigate(session ? '/dashboard' : '/login')
            }}
          >
            <span className="item-num">05</span>
            <span className="item-text">{session ? 'WORKSPACE' : 'SIGN IN'}</span>
          </button>
        </nav>

        <div className="mobile-overlay-footer">
          <div className="overlay-footer-meta">
            <span className="footer-meta-tag">AUTOMATED REPOSITORY ANALYSIS ENGINE</span>
            <span className="footer-meta-ver">ZERO-CODE RETENTION // V2.4</span>
          </div>
          <div className="overlay-footer-cta">
            <Link
              to={session ? '/dashboard' : '/signup'}
              className="editorial-btn-primary full-width"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{session ? 'OPEN WORKSPACE' : 'LAUNCH NODEMIND'}</span>
              <span className="btn-arrow-mark">→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
