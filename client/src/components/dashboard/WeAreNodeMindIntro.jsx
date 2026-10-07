import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import './WeAreNodeMindIntro.css'

// Letter slices configuration for "WE ARE" and "NODEMINDS"
// Each letter has authentic 3D folded facet tilts, perspective depth, and light gradients
const ROW_1 = [
  { char: 'W', tiltY: -7, z: 24, delay: 0.05, shadow: 'rgba(0,0,0,0.6)' },
  { char: 'E', tiltY: 6, z: 12, delay: 0.1, shadow: 'rgba(0,0,0,0.4)' },
  { char: ' ', isSpace: true },
  { char: 'A', tiltY: -5, z: 18, delay: 0.15, shadow: 'rgba(0,0,0,0.5)' },
  { char: 'R', tiltY: 8, z: 30, delay: 0.2, shadow: 'rgba(0,0,0,0.7)' },
  { char: 'E', tiltY: -4, z: 15, delay: 0.25, shadow: 'rgba(0,0,0,0.45)' },
]

const ROW_2 = [
  { char: 'N', tiltY: -10, z: 35, delay: 0.28, shadow: 'rgba(0,0,0,0.7)' },
  { char: 'O', tiltY: 4, z: 10, delay: 0.32, shadow: 'rgba(0,0,0,0.35)' },
  { char: 'D', tiltY: -6, z: 22, delay: 0.36, shadow: 'rgba(0,0,0,0.55)' },
  { char: 'E', tiltY: 9, z: 32, delay: 0.4, shadow: 'rgba(0,0,0,0.65)' },
  { char: 'M', tiltY: -8, z: 26, delay: 0.44, shadow: 'rgba(0,0,0,0.6)' },
  { char: 'I', tiltY: 12, z: 42, delay: 0.48, shadow: 'rgba(0,0,0,0.8)' },
  { char: 'N', tiltY: -5, z: 18, delay: 0.52, shadow: 'rgba(0,0,0,0.5)' },
  { char: 'D', tiltY: 11, z: 38, delay: 0.56, shadow: 'rgba(0,0,0,0.75)' },
  { char: 'S', tiltY: -9, z: 28, delay: 0.6, shadow: 'rgba(0,0,0,0.65)' },
]

export default function WeAreNodeMindIntro({ isOpen, onClose, userName = 'Architect' }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const lettersRef = useRef([])
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const audioInitializedRef = useRef(false)

  // Play a soft high-tech harmonic synthesizer chime via Web Audio API
  const playCyberChime = useCallback(() => {
    try {
      if (audioInitializedRef.current) return
      audioInitializedRef.current = true
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      const now = ctx.currentTime
      const freqs = [220, 440, 660, 880]
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2)
        
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.04 / (idx + 1), now + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 1.5)
      })
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, [])

  // Smooth interactive 3D mouse parallax
  const handleMouseMove = useCallback((e) => {
    if (!sceneRef.current || isExiting) return
    const { clientX, clientY } = e
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const dx = (clientX - cx) / cx
    const dy = (clientY - cy) / cy

    // Scene tilt
    gsap.to(sceneRef.current, {
      rotateY: dx * 16,
      rotateX: -dy * 14,
      duration: 0.8,
      ease: 'power2.out',
      transformPerspective: 1200,
    })

    // Individual letter slice depth offset
    lettersRef.current.forEach((el, idx) => {
      if (!el) return
      const factor = (idx % 3 + 1) * 4
      gsap.to(el, {
        x: dx * factor,
        y: dy * factor,
        duration: 0.6,
        ease: 'power2.out',
      })
    })
  }, [isExiting])

  const handleExit = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)

    if (!containerRef.current) {
      onClose()
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        onClose()
      },
    })

    // Dramatic cinematic camera zoom and curtain split reveal
    tl.to(lettersRef.current, {
      scale: 1.25,
      opacity: 0,
      filter: 'blur(16px)',
      stagger: 0.02,
      duration: 0.6,
      ease: 'power3.in',
    })
      .to(
        containerRef.current,
        {
          opacity: 0,
          scale: 1.05,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        '-=0.3'
      )
  }, [isExiting, onClose])

  // Key listeners for ESC or Enter to instantly enter
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleExit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleExit])

  // Timeline Entrance Sequence
  useEffect(() => {
    if (!isOpen) return

    playCyberChime()

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Reset transforms
      gsap.set(containerRef.current, { opacity: 1, scale: 1 })
      gsap.set('.sadumedia-emblem', { opacity: 0, y: -20, scale: 0.8 })
      gsap.set('.intro-hud-top, .intro-hud-bottom', { opacity: 0, y: 15 })

      // Animate letters with 3D folding cascade
      tl.fromTo(
        lettersRef.current,
        {
          opacity: 0,
          rotateX: 95,
          y: 70,
          scale: 0.85,
        },
        {
          opacity: 1,
          rotateX: 0,
          y: 0,
          scale: 1,
          stagger: 0.035,
          duration: 0.9,
          ease: 'power4.out',
        }
      )
        .to(
          '.sadumedia-emblem',
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: 'back.out(1.7)',
          },
          '-=0.7'
        )
        .to(
          ['.intro-hud-top', '.intro-hud-bottom'],
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
          },
          '-=0.4'
        )
    }, containerRef)

    // Progress bar and auto-close timer (4.2 seconds)
    const startTime = Date.now()
    const totalDuration = 4200
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const p = Math.min(100, (elapsed / totalDuration) * 100)
      setProgress(p)
      if (elapsed >= totalDuration) {
        clearInterval(interval)
        handleExit()
      }
    }, 40)

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', handleMouseMove)
      ctx.revert()
    }
  }, [isOpen, handleMouseMove, handleExit, playCyberChime])

  if (!isOpen) return null

  lettersRef.current = []

  return (
    <div
      ref={containerRef}
      className={`we-are-nodemind-overlay ${isExiting ? 'is-exiting' : ''}`}
      onClick={handleExit}
      role="dialog"
      aria-modal="true"
      aria-label="NodeMind Welcome Sequence"
    >
      {/* Background Ambience & Cyber Grid */}
      <div className="intro-cyber-grid" />
      <div className="intro-ambient-glow" />
      <div className="intro-scanline" />

      {/* Top HUD Bar */}
      <div className="intro-hud-top">
        <div className="hud-meta-left">
          <span className="hud-pulse-dot" />
          <span className="hud-code-tag">SYSTEM // 001 · KERNEL INITIALIZED</span>
        </div>
        <div className="hud-meta-right">
          <span className="hud-session-tag">WORKSPACE: {userName.toUpperCase()}</span>
          <span className="hud-status-badge">ONLINE</span>
        </div>
      </div>

      {/* Main 3D Typographic Centerpiece */}
      <div className="intro-center-stage">
        {/* Sadumedia-style Diamond Emblem */}
        <div className="sadumedia-emblem">
          <svg width="48" height="24" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 0L58 12L40 24L22 12L40 0Z" fill="#FFFFFF" fillOpacity="0.95" />
            <path d="M58 12L76 24L58 36L40 24L58 12Z" fill="#CBD5E1" fillOpacity="0.8" />
            <path d="M22 12L40 24L22 36L4 24L22 12Z" fill="#94A3B8" fillOpacity="0.65" />
            <polygon points="40,24 50,32 40,40 30,32" fill="#FF6B4A" fillOpacity="0.9" />
          </svg>
        </div>

        {/* 3D Perspective Scene */}
        <div ref={sceneRef} className="sadumedia-3d-scene">
          {/* Row 1: WE ARE */}
          <div className="typo-row row-we-are">
            {ROW_1.map((item, idx) => {
              if (item.isSpace) {
                return <span key={`space-${idx}`} className="slice-space" />
              }
              return (
                <div
                  key={`r1-${idx}`}
                  ref={(el) => (lettersRef.current[idx] = el)}
                  className="letter-slice-card"
                  style={{
                    '--tilt-y': `${item.tiltY}deg`,
                    '--depth-z': `${item.z}px`,
                    '--shadow-color': item.shadow,
                  }}
                >
                  <span className="letter-char">{item.char}</span>
                  <span className="letter-facet-highlight" />
                  <span className="letter-facet-shadow" />
                </div>
              )
            })}
          </div>

          {/* Row 2: NODEMINDS */}
          <div className="typo-row row-nodeminds">
            {ROW_2.map((item, idx) => {
              const globalIdx = ROW_1.length + idx
              return (
                <div
                  key={`r2-${idx}`}
                  ref={(el) => (lettersRef.current[globalIdx] = el)}
                  className="letter-slice-card is-nodemind-card"
                  style={{
                    '--tilt-y': `${item.tiltY}deg`,
                    '--depth-z': `${item.z}px`,
                    '--shadow-color': item.shadow,
                  }}
                >
                  <span className="letter-char">{item.char}</span>
                  <span className="letter-facet-highlight" />
                  <span className="letter-facet-shadow" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Supporting Micro-Kicker */}
        <div className="intro-tagline-statement">
          <span className="tagline-segment">AUTONOMOUS AST AUDIT KERNEL</span>
          <span className="tagline-sep">/</span>
          <span className="tagline-segment">ZERO-CODE RETENTION</span>
          <span className="tagline-sep">/</span>
          <span className="tagline-segment">REAL-TIME THREAT VERIFICATION</span>
        </div>
      </div>

      {/* Bottom HUD & Action Controls */}
      <div className="intro-hud-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="hud-bottom-details">
          <span className="hud-mono-text">PRESS ANYWHERE OR HIT [SPACE] TO ENTER</span>
        </div>

        <button
          type="button"
          className="intro-enter-btn"
          onClick={handleExit}
          aria-label="Enter NodeMind Workspace"
        >
          <span>ENTER WORKSPACE</span>
          <span className="btn-arrow-glow">→</span>
        </button>

        {/* Auto-advance progress bar */}
        <div className="intro-progress-bar-track">
          <div className="intro-progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
