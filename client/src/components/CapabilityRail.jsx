import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { prefersReducedMotion } from '@/animations/motion'
import './CapabilityRail.css'

const CAPABILITIES = [
  {
    id: 'repo',
    num: '01',
    title: 'Repository Analysis',
    tag: 'PARSER & AST ENGINE',
    summary:
      'Full repository tree discovery with multi-language AST parsing across TypeScript, JavaScript, Python, Go, Rust, Dockerfile, and SQL.',
    stats: '12+ Language Lexers · Multi-Root Discovery · Ignored-Asset Filtering',
    codeSnippet: `// Stage 1: Discovered 48 candidate files
[Tree] Discovered src/services/auth.ts (1.8 KB)
[Tree] Discovered src/api/routes.ts (3.4 KB)
[Tree] Skipped dist/bundle.js (Generated)
[Tree] Skipped node_modules/ (Excluded Vendor)
-> Eligible files queued for AST traversal: 42`,
  },
  {
    id: 'security',
    num: '02',
    title: 'Security Findings',
    tag: 'OWASP TOP 10 & CWE',
    summary:
      'CWE-mapped vulnerability detection targeting hardcoded tokens, SQL injections, SSRF endpoints, permissive CORS, and broken auth.',
    stats: 'CWE-798 · CWE-89 · CWE-918 · OWASP Top 10 Benchmarks',
    codeSnippet: `[Security Rule: SEC-AUTH-001]
Finding: Hardcoded secret fallback string
File: src/services/auth.ts:48
Severity: HIGH (Score: 8.5/10)
Blast Radius: Complete authentication bypass
Remediation Diff: Auto-generated patch ready`,
  },
  {
    id: 'perf',
    num: '03',
    title: 'Performance Review',
    tag: 'LATENCY & MEMORY',
    summary:
      'Isolates unindexed queries, blocking loops, memory leaks, unbuffered streams, and redundant network roundtrips.',
    stats: 'N+1 Query Detection · Connection Leaks · Event-Loop Blocking',
    codeSnippet: `[Perf Rule: PERF-DB-004]
Finding: Sequential N+1 query inside array map
File: src/controllers/billing.ts:114
Impact: High database latency on >100 tenants
Fix: Bulk batch SELECT ... WHERE id IN (...)`,
  },
  {
    id: 'maint',
    num: '04',
    title: 'Maintainability',
    tag: 'CODE HEALTH & COMPLEXITY',
    summary:
      'Calculates cyclomatic complexity, dead code branches, structural anti-patterns, and unmaintainable coupling.',
    stats: 'Cyclomatic Score · Code Duplication · Dead-Branch Pruning',
    codeSnippet: `[Maint Rule: MAINT-COMPLEXITY-012]
Finding: Function exceeds cyclomatic threshold (24 > 15)
File: src/utils/ruleMatcher.ts:32
Recommendation: Extract strategy pattern handlers
Refactor impact: +28% maintainability index`,
  },
  {
    id: 'history',
    num: '05',
    title: 'Review History',
    tag: 'IMMUTABLE AUDIT TRAIL',
    summary:
      'Chronological tracking of every audited commit, quality metrics, resolved findings, and verified mitigation diffs.',
    stats: 'Quality Score Gauges · Commit Deltas · Zero-Retention Storage',
    codeSnippet: `[Audit Record: REV-2026-9812]
Repo: org/core-api @ commit 4f9e11a
Status: COMPLETED (Quality Score: 94%)
Total Findings: 3 (Resolved: 2, Open: 1)
Timestamp: 2026-10-06T11:42:00Z [Verified]`,
  },
]

export default function CapabilityRail() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const previewRef = useRef(null)
  const activeCap = CAPABILITIES[selectedIndex]

  useEffect(() => {
    if (prefersReducedMotion() || !previewRef.current) return

    gsap.fromTo(
      previewRef.current,
      { opacity: 0.6, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
    )
  }, [selectedIndex])

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (index + 1) % CAPABILITIES.length
      setSelectedIndex(nextIndex)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (index - 1 + CAPABILITIES.length) % CAPABILITIES.length
      setSelectedIndex(prevIndex)
    }
  }

  return (
    <section className="capability-rail-section" id="capabilities-rail">
      <div className="capability-container">
        {/* Section Header */}
        <div className="capability-header-block">
          <div className="header-meta-row">
            <span className="meta-index-tag">ENGINE BENCHMARKS</span>
            <span className="meta-sep">/</span>
            <span className="meta-label">DISCIPLINED STATIC AUDITING</span>
          </div>
          <h2 className="capability-main-title">SELECTED CAPABILITIES</h2>
        </div>

        {/* 2-Column Editorial Showcase */}
        <div className="capability-showcase-grid">
          {/* LEFT: Interactive Numbered List */}
          <div className="capability-list-column" role="tablist" aria-label="Capabilities Selector">
            {CAPABILITIES.map((cap, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={cap.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className={`capability-item-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <span className="cap-num">{cap.num}</span>
                  <div className="cap-title-wrap">
                    <span className="cap-title">{cap.title}</span>
                    <span className="cap-tag-pill">{cap.tag}</span>
                  </div>
                  <span className="cap-arrow-mark">→</span>
                </button>
              )
            })}
          </div>

          {/* RIGHT: Dynamic Visual Preview Console */}
          <div className="capability-preview-column">
            <div ref={previewRef} className="capability-preview-card">
              <div className="preview-topbar">
                <div className="preview-meta-left">
                  <span className="preview-index-tag">
                    {activeCap.num} // {activeCap.title}
                  </span>
                </div>
                <span className="preview-tag-badge">{activeCap.tag}</span>
              </div>

              <div className="preview-body-content">
                <p className="preview-summary-text">{activeCap.summary}</p>

                <div className="preview-terminal-window">
                  <div className="terminal-header-mini">
                    <span className="term-dot" />
                    <span className="term-dot" />
                    <span className="term-dot" />
                    <span className="term-file-title">engine://inspect/{activeCap.id}.log</span>
                  </div>
                  <pre className="terminal-code-stream">
                    <code>{activeCap.codeSnippet}</code>
                  </pre>
                </div>

                <div className="preview-stats-footer">
                  <span className="stats-label">SPECIFICATIONS:</span>
                  <span className="stats-value">{activeCap.stats}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
