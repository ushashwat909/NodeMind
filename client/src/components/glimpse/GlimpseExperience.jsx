import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GlimpseCanvas from './GlimpseCanvas'
import { glimpseAudio } from './glimpseAudio'
import './GlimpseExperience.css'

const CHAPTERS = [
  {
    id: 'connect',
    index: '01',
    kicker: 'CONNECT',
    badge: '1-Click Setup',
    title: 'Connect In Seconds',
    subtitle: 'Works with GitHub, GitLab & Local Repos',
    description:
      'Link your repository in one click. Whenever someone pushes code or opens a pull request, NodeMind reviews it immediately. Your source code is reviewed securely in temporary memory and never stored on disk.',
    metrics: [
      { label: 'Setup Time', value: 'Under 1 min' },
      { label: 'Code Privacy', value: '100% In-Memory' },
      { label: 'Support', value: 'All Branches' },
    ],
    widgetType: 'ingestion',
  },
  {
    id: 'understand',
    index: '02',
    kicker: 'UNDERSTAND',
    badge: 'Deep Code Logic',
    title: 'Understands How Your Code Works',
    subtitle: 'Sees the whole project, not just individual words',
    description:
      'Basic AI tools just look at words and make guesses. NodeMind maps out your whole project so it knows how your functions, database models, and API endpoints connect with each other.',
    metrics: [
      { label: 'Languages', value: 'JS, TS, Python, Go, Rust' },
      { label: 'Deep Context', value: 'Multi-File Aware' },
      { label: 'Accuracy', value: 'Zero Guesswork' },
    ],
    widgetType: 'ast',
  },
  {
    id: 'security',
    index: '03',
    kicker: 'SECURITY',
    badge: 'Catch Bugs Early',
    title: 'Catches Leaks & Bugs Early',
    subtitle: 'Stops security flaws before they hit production',
    description:
      'Accidentally committed an API key? Missed a user permission check? NodeMind flags security vulnerabilities and logic bugs right in your PR before code is ever merged.',
    metrics: [
      { label: 'Security Checks', value: 'Secrets, Auth & OWASP' },
      { label: 'Alert Level', value: 'High, Medium, Low' },
      { label: 'Review Speed', value: 'Instant on every PR' },
    ],
    widgetType: 'heuristics',
  },
  {
    id: 'tracing',
    index: '04',
    kicker: 'TRACING',
    badge: 'Step-by-Step Path',
    title: 'Shows You Exactly Where The Bug Is',
    subtitle: 'No confusing error logs — just clear steps',
    description:
      'Instead of vague warnings, NodeMind shows you the exact path: where untrusted input came in, where it passed through your logic, and where it could cause a crash or leak.',
    metrics: [
      { label: 'Precision', value: 'Exact Line Number' },
      { label: 'Visual Path', value: 'Input → Logic → Database' },
      { label: 'Feedback', value: 'Plain English' },
    ],
    widgetType: 'taint',
  },
  {
    id: 'fixes',
    index: '05',
    kicker: 'QUICK FIX',
    badge: 'Copy-Paste Ready',
    title: 'Ready-To-Use Code Fixes',
    subtitle: 'See the solution before you even ask',
    description:
      "Don't waste hours searching for how to patch an issue. NodeMind writes the exact line-by-line solution with a copy button so you can patch it with total confidence.",
    metrics: [
      { label: 'Fix Format', value: 'Clean Before & After' },
      { label: 'Apply Time', value: '1-Click Copy' },
      { label: 'Safety', value: 'Syntax Tested' },
    ],
    widgetType: 'diff',
  },
  {
    id: 'score',
    index: '06',
    kicker: 'SCORE',
    badge: 'Peace of Mind',
    title: 'Ship Every Release With Confidence',
    subtitle: 'Clear code health score for your team',
    description:
      'Every review gives your team a simple 0–100 health score and clear summary. Review PRs in half the time and ship updates knowing your code is rock solid.',
    metrics: [
      { label: 'Health Score', value: '0 – 100 Rating' },
      { label: 'Time Saved', value: '~70% Faster Reviews' },
      { label: 'Workflow', value: 'GitHub & CI/CD Ready' },
    ],
    widgetType: 'control',
  },
]

export default function GlimpseExperience({
  isOpen = true,
  onClose,
}) {
  const navigate = useNavigate()
  const [scrollProgress, setScrollProgress] = useState(0) // 0 to 5
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [copiedPatch, setCopiedPatch] = useState(false)
  const [audioPromptDismissed, setAudioPromptDismissed] = useState(false)
  const containerRef = useRef(null)
  const scrollTargetRef = useRef(0)
  const touchStartYRef = useRef(0)

  // Handle Close
  const handleExit = useCallback(() => {
    glimpseAudio.setMuted(true)
    if (onClose) {
      onClose()
    } else {
      navigate('/')
    }
  }, [onClose, navigate])

  // Chapter Jump Helper
  const scrollToChapter = useCallback((index) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, index))
    glimpseAudio.playChapterTransition()
    scrollTargetRef.current = clamped
  }, [])

  // ESC and keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        handleExit()
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        scrollToChapter(Math.min(CHAPTERS.length - 1, activeChapterIndex + 1))
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToChapter(Math.max(0, activeChapterIndex - 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeChapterIndex, handleExit, scrollToChapter])

  // Wheel Scroll Handling with smooth, deliberate damping
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY * 0.001
    scrollTargetRef.current = Math.max(0, Math.min(CHAPTERS.length - 1, scrollTargetRef.current + delta))
  }, [])

  // Touch Handling for Mobile
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    const touchY = e.touches[0].clientY
    const deltaY = touchStartYRef.current - touchY
    touchStartYRef.current = touchY
    const delta = deltaY * 0.0025
    scrollTargetRef.current = Math.max(0, Math.min(CHAPTERS.length - 1, scrollTargetRef.current + delta))
  }

  // Smooth Render Tick with spring interpolation
  useEffect(() => {
    let animId = null
    const tick = () => {
      setScrollProgress((prev) => {
        const target = scrollTargetRef.current
        const diff = target - prev
        const next = Math.abs(diff) < 0.001 ? target : prev + diff * 0.12
        const nextChapter = Math.round(next)
        if (nextChapter !== activeChapterIndex) {
          setActiveChapterIndex(nextChapter)
          glimpseAudio.setChapter(nextChapter, next - Math.floor(next))
        }
        return next
      })
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [activeChapterIndex])

  // Toggle Audio
  const toggleSound = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    setAudioPromptDismissed(true)
    glimpseAudio.setMuted(nextMuted)
    if (!nextMuted) {
      glimpseAudio.setChapter(activeChapterIndex)
    }
  }

  const handleCopySamplePatch = () => {
    const patch = `// Recommended Patch
- payload = jwt.decode(token, secret)
+ payload = jwt.decode(token, secret, { verify: true })`
    navigator.clipboard.writeText(patch)
    setCopiedPatch(true)
    glimpseAudio.playClick()
    setTimeout(() => setCopiedPatch(false), 2200)
  }

  if (!isOpen) return null

  const curChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0]
  const progressPercent = (scrollProgress / (CHAPTERS.length - 1)) * 100
  // Fine scroll progress relative to current chapter (-0.5 to +0.5) for elastic depth
  const scrollOffset = scrollProgress - activeChapterIndex

  return (
    <div
      ref={containerRef}
      className="glimpse-root-overlay"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      role="dialog"
      aria-modal="true"
      aria-label="NodeMind Glimpse Interactive Preview"
    >
      {/* 1. Full-Screen 3D Holographic Canvas */}
      <GlimpseCanvas scrollProgress={scrollProgress} />

      {/* Ambient Visual Film Layers */}
      <div className="glimpse-scanline-fx" />
      <div className="glimpse-noise-grain" />

      {/* 2. TOP TELEMETRY HUD */}
      <header className="glimpse-top-hud">
        <div className="hud-brand-block">
          <span className="hud-pulse-radar" />
          <span className="hud-brand-title">NODEMIND</span>
          <span className="hud-meta-badge">GLIMPSE</span>
        </div>

        {/* Human, Friendly Chapter Pills */}
        <nav className="hud-chapter-nav" aria-label="Glimpse Chapters">
          {CHAPTERS.map((ch, idx) => {
            const isActive = activeChapterIndex === idx
            return (
              <button
                key={ch.id}
                type="button"
                className={`chapter-nav-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => scrollToChapter(idx)}
                aria-label={`Jump to stage ${idx + 1}: ${ch.title}`}
              >
                <span className="pill-num">{ch.index}</span>
                <span className="pill-name">{ch.kicker}</span>
              </button>
            )
          })}
        </nav>

        {/* Right HUD Controls */}
        <div className="hud-controls-right">
          {/* Audio Sound Toggle */}
          <button
            type="button"
            className={`hud-sound-btn ${!isMuted ? 'sound-active' : ''}`}
            onClick={toggleSound}
            title={isMuted ? 'Enable sound' : 'Mute sound'}
            aria-label="Toggle Sound"
          >
            <span className="sound-icon-bars">
              <span className="sound-bar" />
              <span className="sound-bar" />
              <span className="sound-bar" />
            </span>
            <span className="sound-text">{isMuted ? 'SOUND' : 'AUDIO ON'}</span>
          </button>

          {/* Close / Return Button */}
          <button
            type="button"
            className="hud-close-btn"
            onClick={handleExit}
            aria-label="Exit Glimpse Preview"
          >
            <span>✕ CLOSE</span>
          </button>
        </div>
      </header>

      {/* Unobtrusive Audio Prompt Toast */}
      {isMuted && !audioPromptDismissed && (
        <div className="glimpse-sound-toast" onClick={toggleSound}>
          <span className="toast-pulse-dot" />
          <span>Tap to enable soundscape</span>
          <span className="toast-cta">SOUND 🔊</span>
        </div>
      )}

      {/* 3. MAIN STORYTELLING STAGE - DYNAMIC POP-UP CARD SYSTEM */}
      <main className="glimpse-stage-viewport">
        <div
          key={curChapter.id}
          className="glimpse-chapter-card card-pop-up"
          style={{
            transform: `perspective(1000px) translateY(${scrollOffset * -24}px) scale(${1 - Math.min(0.08, Math.abs(scrollOffset) * 0.16)}) rotateX(${scrollOffset * -4}deg)`,
          }}
        >
          {/* Card Top Step Banner */}
          <div className="card-top-kicker">
            <span className="kicker-step-pill">
              <span className="kicker-pulse-dot" />
              STEP {curChapter.index} OF 06
            </span>
            <span className="kicker-sep">/</span>
            <span className="kicker-label">{curChapter.kicker}</span>
            <span className="kicker-badge">{curChapter.badge}</span>
          </div>

          {/* Clean, Human Headline */}
          <h1 className="chapter-display-title">{curChapter.title}</h1>
          <div className="chapter-subtitle-line">{curChapter.subtitle}</div>

          {/* Clear, Human Description */}
          <p className="chapter-body-desc">{curChapter.description}</p>

          {/* Key Friendly Metrics */}
          <div className="chapter-metrics-strip">
            {curChapter.metrics.map((m, idx) => (
              <div key={idx} className="metric-chip">
                <span className="metric-chip-label">{m.label}</span>
                <span className="metric-chip-val">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Interactive Demo Widgets per Chapter */}
          <div className="chapter-micro-widget">
            {/* Widget 1: Pull Request Stream */}
            {curChapter.widgetType === 'ingestion' && (
              <div className="widget-box widget-ingestion">
                <div className="widget-header">
                  <span className="widget-dot green" />
                  <span className="widget-title">Live Pull Request Activity</span>
                  <span className="widget-status">IN-MEMORY SCAN</span>
                </div>
                <div className="widget-code-feed">
                  <div className="feed-line">
                    <span className="feed-tag">PR #42</span>
                    <span className="feed-branch">feat/user-checkout</span>
                    <span className="feed-diff">+3 files modified</span>
                  </div>
                  <div className="feed-line highlight">
                    <span className="feed-tag">STATUS</span>
                    <span className="feed-diff">✓ Security scan completed in 240ms · 0 issues</span>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 2: Context Diagram */}
            {curChapter.widgetType === 'ast' && (
              <div className="widget-box widget-ast">
                <div className="widget-header">
                  <span className="widget-dot violet" />
                  <span className="widget-title">Full Project Map & Context</span>
                  <span className="widget-status">ALL FILES LINKED</span>
                </div>
                <div className="ast-tree-nodes">
                  <div className="ast-pill">API Route</div>
                  <span className="ast-arrow">→</span>
                  <div className="ast-pill">Auth Middleware</div>
                  <span className="ast-arrow">→</span>
                  <div className="ast-pill active-ast">Token Validator</div>
                  <span className="ast-arrow">→</span>
                  <div className="ast-pill">Database Query</div>
                </div>
              </div>
            )}

            {/* Widget 3: Clear Security Alert */}
            {curChapter.widgetType === 'heuristics' && (
              <div className="widget-box widget-heuristics">
                <div className="widget-header">
                  <span className="widget-dot red" />
                  <span className="widget-title">Vulnerability Detected Before Merge</span>
                  <span className="widget-status">INTERCEPTED</span>
                </div>
                <div className="threat-findings-mini">
                  <div className="threat-item high">
                    <span className="threat-badge">HIGH ALERT</span>
                    <span className="threat-title">Missing JWT Signature Verification</span>
                    <span className="threat-loc">auth/verify.ts:42</span>
                  </div>
                  <div className="threat-tip">
                    <span>💡 NodeMind already generated the exact fix below</span>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 4: 3-Step Visual Trace */}
            {curChapter.widgetType === 'taint' && (
              <div className="widget-box widget-taint">
                <div className="widget-header">
                  <span className="widget-dot amber" />
                  <span className="widget-title">Step-by-Step Path of the Bug</span>
                  <span className="widget-status">LINE 42</span>
                </div>
                <div className="taint-path-grid">
                  <div className="path-node source">
                    <span className="node-kicker">1. ENTRY POINT</span>
                    <span className="node-code">User login request</span>
                  </div>
                  <div className="path-connector">→</div>
                  <div className="path-node tainted">
                    <span className="node-kicker">2. PASSES THROUGH</span>
                    <span className="node-code">Unverified token payload</span>
                  </div>
                  <div className="path-connector">→</div>
                  <div className="path-node sink">
                    <span className="node-kicker">3. DANGER SINK</span>
                    <span className="node-code">Database query update</span>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 5: 1-Click Code Patch */}
            {curChapter.widgetType === 'diff' && (
              <div className="widget-box widget-diff">
                <div className="widget-header">
                  <span className="widget-dot emerald" />
                  <span className="widget-title">Ready-to-Apply Code Solution</span>
                  <button
                    type="button"
                    className="btn-copy-patch-sample"
                    onClick={handleCopySamplePatch}
                  >
                    {copiedPatch ? '✓ Copied to Clipboard!' : 'Copy Fix'}
                  </button>
                </div>
                <div className="diff-code-preview">
                  <div className="diff-row del">
                    <span className="diff-mark">-</span>
                    <code>payload = jwt.decode(token, secret)</code>
                  </div>
                  <div className="diff-row add">
                    <span className="diff-mark">+</span>
                    <code>payload = jwt.decode(token, secret, &#123; verify: true &#125;)</code>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 6: Code Health Summary & Launch */}
            {curChapter.widgetType === 'control' && (
              <div className="widget-box widget-control">
                <div className="widget-header">
                  <span className="widget-dot indigo" />
                  <span className="widget-title">Project Health Score</span>
                  <span className="widget-status">READY TO SHIP</span>
                </div>
                <div className="score-summary-row">
                  <div className="score-big-pill">
                    <span className="score-num">96</span>
                    <span className="score-out">/100</span>
                  </div>
                  <div className="score-desc">
                    <strong>Zero critical vulnerabilities found.</strong>
                    <span>Code is tested, secure, and ready for deployment.</span>
                  </div>
                </div>
                <div className="control-final-cta-row">
                  <Link to="/dashboard" className="glimpse-cta-primary" onClick={handleExit}>
                    <span>START FREE CODE REVIEW</span>
                    <span className="cta-arrow">→</span>
                  </Link>
                  <button
                    type="button"
                    className="glimpse-cta-replay"
                    onClick={() => scrollToChapter(0)}
                  >
                    <span>↺ Start Over</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Card Action Bar: Prev, Step Dots, Next */}
          <div className="card-pop-actions">
            <button
              type="button"
              className="card-nav-prev"
              onClick={() => scrollToChapter(activeChapterIndex - 1)}
              disabled={activeChapterIndex === 0}
              aria-label="Previous stage"
            >
              ← Previous
            </button>

            <div className="card-dots-indicator" aria-label="Step Indicator">
              {CHAPTERS.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`card-step-dot ${activeChapterIndex === idx ? 'is-active' : ''}`}
                  onClick={() => scrollToChapter(idx)}
                  title={`Stage ${idx + 1}: ${ch.title}`}
                  aria-label={`Go to stage ${idx + 1}`}
                />
              ))}
            </div>

            {activeChapterIndex < CHAPTERS.length - 1 ? (
              <button
                type="button"
                className="card-nav-next"
                onClick={() => scrollToChapter(activeChapterIndex + 1)}
                aria-label="Next stage"
              >
                <span>Next Stage</span>
                <span>→</span>
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="card-nav-next is-cta"
                onClick={handleExit}
                aria-label="Launch Workspace"
              >
                <span>Open Workspace</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* 4. BOTTOM TELEMETRY FOOTER */}
      <footer className="glimpse-bottom-hud">
        {/* Telemetry Left */}
        <div className="hud-bottom-telemetry">
          <span className="telemetry-coord">
            STAGE 0{activeChapterIndex + 1} OF 06
          </span>
          <span className="telemetry-sep">·</span>
          <span className="telemetry-depth">
            {Math.round(progressPercent)}% COMPLETE
          </span>
          <span className="telemetry-sep">·</span>
          <span className="telemetry-hint">
            SCROLL OR CLICK TO ADVANCE
          </span>
        </div>

        {/* Scrubber Track & Dots */}
        <div className="hud-scrubber-track">
          <div
            className="hud-scrubber-fill"
            style={{ width: `${progressPercent}%` }}
          />
          {CHAPTERS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`scrubber-step-dot ${activeChapterIndex === idx ? 'is-active' : ''}`}
              style={{ left: `${(idx / (CHAPTERS.length - 1)) * 100}%` }}
              onClick={() => scrollToChapter(idx)}
              aria-label={`Jump to stage ${idx + 1}`}
            />
          ))}
        </div>

        {/* Right Action Hint */}
        <div className="hud-bottom-hint">
          {activeChapterIndex < CHAPTERS.length - 1 ? (
            <button
              type="button"
              className="hud-next-step-btn"
              onClick={() => scrollToChapter(activeChapterIndex + 1)}
            >
              <span>NEXT STEP</span>
              <span>↓</span>
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="hud-next-step-btn is-final"
              onClick={handleExit}
            >
              <span>GET STARTED</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  )
}
