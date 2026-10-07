import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'
import './WhatWeReviewModal.css'

export default function WhatWeReviewModal({ pillar, allPillars, onClose, onSelectPillar }) {
  const [copiedPatch, setCopiedPatch] = useState(false)
  const backdropRef = useRef(null)
  const sheetRef = useRef(null)

  const currentIndex = allPillars.findIndex((p) => p.id === pillar.id)

  const handlePrev = (e) => {
    e?.stopPropagation()
    const prevIndex = (currentIndex - 1 + allPillars.length) % allPillars.length
    onSelectPillar(allPillars[prevIndex])
  }

  const handleNext = (e) => {
    e?.stopPropagation()
    const nextIndex = (currentIndex + 1) % allPillars.length
    onSelectPillar(allPillars[nextIndex])
  }

  const handleClose = () => {
    if (prefersReducedMotion() || !sheetRef.current || !backdropRef.current) {
      onClose()
      return
    }

    gsap.to(sheetRef.current, {
      scale: 0.94,
      opacity: 0,
      y: 20,
      duration: 0.22,
      ease: 'power2.in',
    })

    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: onClose,
    })
  }

  const handleCopyPatch = (e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(pillar.codeSnippet)
    setCopiedPatch(true)
    setTimeout(() => setCopiedPatch(false), 2000)
  }

  // Handle keyboard events (ESC to close, Left/Right for pagination)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [currentIndex])

  // GSAP Entrance animation
  useEffect(() => {
    if (prefersReducedMotion() || !sheetRef.current || !backdropRef.current) return

    gsap.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    )

    gsap.fromTo(
      sheetRef.current,
      { opacity: 0, scale: 0.94, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
    )
  }, [pillar.id])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={backdropRef}
      className="pillar-modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${pillar.title} Detailed Specification`}
    >
      <div
        ref={sheetRef}
        className="pillar-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls Bar */}
        <div className="modal-topbar">
          <div className="modal-topbar-left">
            <span className="modal-index-pill">{pillar.num} / AUDIT DOMAIN</span>
            <span className="modal-tag-pill">{pillar.tag}</span>
          </div>

          <div className="modal-topbar-right">
            <button
              type="button"
              className="modal-nav-btn"
              onClick={handlePrev}
              title="Previous domain (Left Arrow)"
              aria-label="Previous audit domain"
            >
              <span>←</span>
              <span>PREV</span>
            </button>
            <button
              type="button"
              className="modal-nav-btn"
              onClick={handleNext}
              title="Next domain (Right Arrow)"
              aria-label="Next audit domain"
            >
              <span>NEXT</span>
              <span>→</span>
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={handleClose}
              title="Close modal (ESC)"
              aria-label="Close specification modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="modal-body-grid">
          {/* Left Column: Title, Full Description, Rules Checklist, CTA */}
          <div className="modal-details-col">
            <div className="modal-heading-wrap">
              <span className="modal-category-hint">
                {pillar.badgeText || 'ANALYSIS SPECIFICATION'}
              </span>
              <h2 className="modal-title">{pillar.title}</h2>
            </div>

            <p className="modal-full-desc">
              {pillar.fullDescription || pillar.summary}
            </p>

            {/* Key Detection Rules */}
            <div className="modal-rules-box">
              <span className="rules-box-title">CRITICAL DETECTION PATTERNS</span>
              <ul className="rules-list">
                {(pillar.keyRules || [pillar.stats]).map((rule, idx) => (
                  <li key={idx} className="rule-item">
                    <span className="rule-icon">✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Row */}
            <div className="modal-action-row">
              <Link to="/dashboard" className="modal-cta-primary">
                <span>CONNECT GITHUB REPO</span>
                <span>→</span>
              </Link>
              <span className="modal-spec-tag">
                FREQUENCY: {pillar.auditFrequency || 'Continuous Webhook Evaluation'}
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Code Diff & Image Preview */}
          <div className="modal-visual-col">
            {/* Live Code Visualizer */}
            <div className="modal-code-window">
              <div className="modal-code-topbar">
                <div className="modal-code-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <span className="modal-code-file">{pillar.codeFile}</span>
                <button
                  type="button"
                  className="modal-copy-btn"
                  onClick={handleCopyPatch}
                >
                  {copiedPatch ? 'COPIED PATCH' : 'COPY PATCH'}
                </button>
              </div>
              <pre className="modal-code-pre">
                <code>{pillar.codeSnippet}</code>
              </pre>
            </div>

            {/* Photographic Context Card */}
            <div className="modal-photo-wrapper">
              <img
                src={pillar.photo}
                alt={`${pillar.title} engineering context`}
                className="modal-photo"
                loading="eager"
              />
              <div className="modal-photo-overlay" />
              <div className="modal-photo-badge">
                <div className="modal-badge-left">
                  <span className="modal-dot-green" />
                  <span>{pillar.stats}</span>
                </div>
                <span className="modal-freq-tag">IN-MEMORY AUDIT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
