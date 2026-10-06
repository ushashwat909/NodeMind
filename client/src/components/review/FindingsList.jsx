import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { staggerReveal, fadeUp, prefersReducedMotion } from '@/animations/motion'
import FindingCard from './FindingCard'

export default function FindingsList({
  findings = [],
  selectedFindingId = null,
  onSelectFinding,
  hasActiveFilters = false,
  onResetFilters,
}) {
  const listRef = useRef(null)
  const emptyRef = useRef(null)

  // Stagger reveal of findings with reusable motion utility & cleanup
  useEffect(() => {
    if (!listRef.current || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // Stagger only the top 12 visible items to keep main thread completely fluid
      const cards = listRef.current.querySelectorAll('.finding-card:nth-child(-n+12)')
      if (cards.length > 0) {
        staggerReveal(cards, {
          y: 10,
          duration: 0.22,
          stagger: 0.025,
          ease: 'power2.out',
        })
      }
    }, listRef)

    return () => ctx.revert()
  }, [findings])

  // Fade up empty states
  useEffect(() => {
    if (emptyRef.current && !prefersReducedMotion()) {
      fadeUp(emptyRef.current, { y: 10, duration: 0.28 })
    }
  }, [findings.length, hasActiveFilters])

  // Scroll selected card into view smoothly when keyboard navigated
  useEffect(() => {
    if (!selectedFindingId || !listRef.current) return
    const activeEl = listRef.current.querySelector(`#finding-card-${selectedFindingId}`)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedFindingId])

  if (findings.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="findings-empty-state" ref={emptyRef}>
          <div className="empty-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h4 className="empty-title">No findings match active filters</h4>
          <p className="empty-desc">
            Try adjusting your search query, severity, or category filters.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetFilters}
          >
            Reset Filters
          </button>
        </div>
      )
    }

    return (
      <div className="findings-empty-state clean" ref={emptyRef}>
        <div className="empty-icon-wrap success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h4 className="empty-title">Clean Review — No Issues Found</h4>
        <p className="empty-desc">
          All static analysis rules, security checks, and code standards passed successfully.
        </p>
      </div>
    )
  }

  return (
    <div className="findings-list-container">
      <div className="findings-cards-scroll" ref={listRef} role="region" aria-label="Findings List">
        {findings.map((f, idx) => (
          <FindingCard
            key={f.id}
            finding={f}
            index={idx}
            isSelected={f.id === selectedFindingId}
            onSelect={onSelectFinding}
          />
        ))}
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="findings-keyboard-hint">
        <span className="kbd-shortcut-item">
          <kbd className="dev-kbd">↑</kbd><kbd className="dev-kbd">↓</kbd> or <kbd className="dev-kbd">J</kbd><kbd className="dev-kbd">K</kbd> to navigate
        </span>
        <span className="kbd-shortcut-item">
          <kbd className="dev-kbd">C</kbd> copy fix
        </span>
        <span className="kbd-shortcut-item">
          <kbd className="dev-kbd">/</kbd> search
        </span>
      </div>
    </div>
  )
}
