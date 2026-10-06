import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/animations/motion'
import './FromCodeToReviewSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const STAGES = [
  {
    num: '01',
    id: 'connect',
    title: 'CONNECT',
    subtitle: 'VCS Repository Integration',
    desc: 'Point to any public or private GitHub repository. Code Review Agent discovers branches, commits, and pull requests via encrypted webhooks with zero persistent disk cloning.',
    tag: 'GITHUB REST & GRAPHQL',
    stageVisual: {
      header: 'vcs://github.com/enterprise/core-api',
      branch: 'main @ commit 7f9a2d4',
      badge: 'CONNECTED',
      badgeClass: 'badge-connected',
      lines: [
        { type: 'cmd', text: '$ git remote verify origin/main' },
        { type: 'log', text: '-> Repository discovered: enterprise/core-api (34.2 MB)' },
        { type: 'log', text: '-> Remote VCS branch verified: [main, staging, release/v2.4]' },
        { type: 'log', text: '-> Webhook listener registered for PR #142 (Target: main)' },
        { type: 'success', text: '✓ In-memory tree buffer created. Ephemeral audit lock acquired.' },
      ],
      stats: '12 Branches Indexed · Ephemeral Buffer · Zero Code Retained',
    },
  },
  {
    num: '02',
    id: 'analyze',
    title: 'ANALYZE',
    subtitle: 'Multi-Language AST Traversal',
    desc: 'The review engine parses syntactic trees across TypeScript, JavaScript, Python, Go, and SQL. Excludes vendor assets, test fixtures, and lockfiles to isolate business logic.',
    tag: 'LEXER & AST ENGINE',
    stageVisual: {
      header: 'ast://parser/symbol-tree',
      branch: 'AST Pipeline: 42 Files Evaluated',
      badge: 'PARSING',
      badgeClass: 'badge-parsing',
      lines: [
        { type: 'cmd', text: '$ ast-engine traverse --depth=max --ignore-vendors' },
        { type: 'log', text: '[Tree] Discovered src/services/authService.ts (1.8 KB)' },
        { type: 'log', text: '[Tree] Discovered src/api/webhookHandler.ts (3.4 KB)' },
        { type: 'log', text: '[Tree] Skipped dist/bundle.js (Generated Artifact)' },
        { type: 'log', text: '[Tree] Skipped node_modules/ (Excluded Vendor Library)' },
        { type: 'success', text: '✓ 42 candidate source files lexed into AST semantic graphs.' },
      ],
      stats: '12+ Language Lexers · Multi-Root Discovery · Sub-second Evaluation',
    },
  },
  {
    num: '03',
    id: 'understand',
    title: 'UNDERSTAND',
    subtitle: 'CWE-Mapped Finding Classification',
    desc: 'Identifies hardcoded secrets, injection vectors, SSRF vulnerabilities, and auth bypasses. Every finding is tied directly to the exact file path and line numbers with blast-radius scoring.',
    tag: 'SECURITY & DEFECT RULES',
    stageVisual: {
      header: 'finding://SEC-AUTH-001/cwe-798',
      branch: 'Severity: HIGH (Score: 8.5/10)',
      badge: 'FLAGGED',
      badgeClass: 'badge-flagged',
      lines: [
        { type: 'warning', text: '[Security Finding: SEC-AUTH-001 · CWE-798]' },
        { type: 'cmd', text: 'File: src/services/authService.ts:48' },
        { type: 'code-del', text: '48 |  const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_key");' },
        { type: 'log', text: 'Impact: Fallback secret key allows arbitrary forged JWT tokens in staging/prod.' },
        { type: 'log', text: 'Blast Radius: Complete authentication bypass across all tenant routes.' },
        { type: 'success', text: '✓ Finding canonicalized into structured remediation schema.' },
      ],
      stats: 'CWE-798 · OWASP Top 10 · High Blast Radius · Remediation Attached',
    },
  },
  {
    num: '04',
    id: 'fix',
    title: 'FIX',
    subtitle: 'Unified Patch Generation',
    desc: 'Surfaces actionable unified diffs and explanations before pull requests merge. Engineers can copy the fix directly or apply it as an automated PR review suggestion.',
    tag: 'VERIFIED DIFF PATCHES',
    stageVisual: {
      header: 'patch://src/services/authService.ts',
      branch: 'Unified Diff Ready for Merge',
      badge: 'PATCH READY',
      badgeClass: 'badge-patch',
      lines: [
        { type: 'cmd', text: '--- a/src/services/authService.ts' },
        { type: 'cmd', text: '+++ b/src/services/authService.ts' },
        { type: 'code-del', text: '-  const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_key");' },
        { type: 'code-add', text: '+  const jwtSecret = process.env.JWT_SECRET;' },
        { type: 'code-add', text: '+  if (!jwtSecret) {' },
        { type: 'code-add', text: '+    throw new ConfigurationError("JWT_SECRET is required");' },
        { type: 'code-add', text: '+  }' },
        { type: 'code-add', text: '+  const decoded = jwt.verify(token, jwtSecret);' },
      ],
      stats: 'Inline Patch · Syntax Verified · Copy Ready · CI Integrated',
    },
  },
]

export default function FromCodeToReviewSection() {
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const sectionRef = useRef(null)
  const visualCardRef = useRef(null)
  const stageElementsRef = useRef([])

  const currentStage = STAGES[activeStageIndex]

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return

    const section = sectionRef.current

    const ctx = gsap.context(() => {
      // Create ScrollTrigger triggers for each stage block
      stageElementsRef.current.forEach((el, idx) => {
        if (!el) return

        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onEnter: () => setActiveStageIndex(idx),
          onEnterBack: () => setActiveStageIndex(idx),
        })
      })
    }, section)

    return () => ctx.revert()
  }, [])

  // Animate the visual stage card smoothly on stage change
  useEffect(() => {
    if (prefersReducedMotion() || !visualCardRef.current) return

    gsap.fromTo(
      visualCardRef.current,
      { opacity: 0.75, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    )
  }, [activeStageIndex])

  return (
    <section ref={sectionRef} className="from-code-section" id="how-it-works">
      <div className="from-code-container">
        {/* Section Header */}
        <div className="from-code-header">
          <div className="header-meta-row">
            <span className="meta-index-tag">03 / PIPELINE ARCHITECTURE</span>
            <span className="meta-sep">/</span>
            <span className="meta-label">FOUR-STAGE REVIEW LIFECYCLE</span>
          </div>
          <h2 className="from-code-title">
            FROM CODE
            <br />
            TO REVIEW.
          </h2>
          <p className="from-code-lead">
            One cohesive review engine replaces disjointed linters and scanners. Follow the
            journey from git commit discovery to unified inline diff patches.
          </p>
        </div>

        {/* 2-Column Sticky Layout: Left Stages, Right Unified Interactive Stage */}
        <div className="from-code-body-grid">
          {/* LEFT: Scrollable Stage Content Blocks */}
          <div className="from-code-stages-col">
            {STAGES.map((stage, idx) => {
              const isActive = idx === activeStageIndex
              return (
                <div
                  key={stage.id}
                  ref={(el) => (stageElementsRef.current[idx] = el)}
                  className={`stage-step-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveStageIndex(idx)}
                >
                  <div className="stage-step-header">
                    <span className="stage-num">{stage.num}</span>
                    <span className="stage-pill">{stage.tag}</span>
                  </div>

                  <h3 className="stage-title">{stage.title}</h3>
                  <span className="stage-subtitle">{stage.subtitle}</span>
                  <p className="stage-desc">{stage.desc}</p>

                  <div className="stage-indicator-bar">
                    <div className="stage-indicator-fill" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* RIGHT: Pinned Interactive Stage Visual Console */}
          <div className="from-code-visual-col">
            <div className="sticky-visual-wrapper">
              <div ref={visualCardRef} className="shared-stage-console">
                {/* Console Topbar */}
                <div className="console-topbar">
                  <div className="console-traffic-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <span className="console-header-path">{currentStage.stageVisual.header}</span>
                  <span className={`console-badge ${currentStage.stageVisual.badgeClass}`}>
                    {currentStage.stageVisual.badge}
                  </span>
                </div>

                {/* Console Metadata Bar */}
                <div className="console-metabar">
                  <span className="metabar-branch">{currentStage.stageVisual.branch}</span>
                  <span className="metabar-step-tag">STAGE {currentStage.num} OF 04</span>
                </div>

                {/* Console Code & Log Stream */}
                <div className="console-stream-body">
                  <pre className="stream-pre">
                    <code>
                      {currentStage.stageVisual.lines.map((line, lIdx) => (
                        <div key={lIdx} className={`stream-line ${line.type}`}>
                          {line.text}
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>

                {/* Console Footer Specifications */}
                <div className="console-footer">
                  <span className="footer-spec-label">SPECIFICATION:</span>
                  <span className="footer-spec-val">{currentStage.stageVisual.stats}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
