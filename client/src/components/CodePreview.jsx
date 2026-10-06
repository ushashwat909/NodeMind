import { useState, useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, numberCount } from '@/animations/gsap'
import { useToast } from '@/context/ToastContext'
import './CodePreview.css'

export default function CodePreview() {
  const [fixApplied, setFixApplied] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const windowRef = useRef(null)
  const laserRef = useRef(null)
  const flaggedLineRef = useRef(null)
  const cardRef = useRef(null)
  const confidenceRef = useRef(null)

  // Signature Hero Animation Sequence
  useEffect(() => {
    if (prefersReducedMotion()) {
      if (confidenceRef.current) confidenceRef.current.textContent = '99.4% confidence'
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.6 })

      // 1. Laser beam starts at line 44 and scans down
      if (laserRef.current) {
        tl.fromTo(
          laserRef.current,
          { opacity: 0, y: 0 },
          { opacity: 1, duration: 0.2, ease: 'power1.out' }
        ).to(
          laserRef.current,
          { y: 155, duration: 0.75, ease: 'power1.inOut' },
          '-=0.05'
        )
      }

      // 2. Line 49 pulses when scanned
      if (flaggedLineRef.current) {
        tl.to(
          flaggedLineRef.current,
          { backgroundColor: 'rgba(239, 68, 68, 0.16)', duration: 0.2, yoyo: true, repeat: 1 },
          '-=0.2'
        )
      }

      // 3. Inline card unfurls with clip-path panel reveal
      if (cardRef.current) {
        tl.fromTo(
          cardRef.current,
          { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)', y: 8 },
          { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 0.45, ease: 'power2.out' },
          '-=0.15'
        )
      }

      // 4. Fade out laser beam cleanly
      if (laserRef.current) {
        tl.to(laserRef.current, { opacity: 0, duration: 0.25 }, '-=0.35')
      }

      // 5. Roll up confidence counter to 99.4%
      if (confidenceRef.current) {
        tl.add(() => {
          numberCount(
            confidenceRef.current,
            99.4,
            { decimals: 1, suffix: '% confidence', duration: 0.7, startValue: 20 }
          )
        }, '-=0.25')
      }
    }, windowRef)

    return () => ctx.revert()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(`// Fixed atomic transaction
const newBal = await db.transaction(async (tx) => {
  const locked = await tx.wallets.forUpdate().where({ userId });
  return tx.wallets.decrement(locked.id, charge.amount);
});`)
    setCopied(true)
    toast.success('AST-verified remediation patch copied to clipboard.', 'Diff Copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-review-window" ref={windowRef} role="region" aria-label="Visual Code Review Preview">
      {/* Signature AST Laser Scanning Beam */}
      <div className="code-laser-beam" ref={laserRef} aria-hidden="true" />

      {/* Window Titlebar */}
      <div className="window-header">
        <div className="window-controls">
          <span className="dot dot-close" />
          <span className="dot dot-minimize" />
          <span className="dot dot-expand" />
        </div>
        <div className="file-breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <span className="folder">services</span>
          <span className="sep">/</span>
          <span className="filename">transaction_ledger.ts</span>
          <span className="git-branch">git: feat/atomic-ledger</span>
        </div>
        <div className="header-meta">
          <span className="diff-stat-add">+12</span>
          <span className="diff-stat-sub">-4</span>
          <span className="status-badge-review">Review in Progress</span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="editor-canvas">
        {/* Line 44 */}
        <div className="code-row">
          <span className="line-num">44</span>
          <span className="code-text"><span className="kw">export async function</span> <span className="fn">processSettlement</span>(userId: <span className="type">string</span>, charge: <span className="type">ChargePayload</span>) &#123;</span>
        </div>

        {/* Line 45 */}
        <div className="code-row">
          <span className="line-num">45</span>
          <span className="code-text">&nbsp;&nbsp;<span className="kw">const</span> account = <span className="kw">await</span> <span className="fn">verifyAccountStatus</span>(userId);</span>
        </div>

        {/* Line 46 */}
        <div className="code-row">
          <span className="line-num">46</span>
          <span className="code-text">&nbsp;&nbsp;<span className="kw">if</span> (!account.isActive) <span className="kw">throw new</span> <span className="type">AccountSuspendedError</span>();</span>
        </div>

        {/* Line 47 */}
        <div className="code-row">
          <span className="line-num">47</span>
          <span className="code-text">&nbsp;&nbsp;</span>
        </div>

        {/* Line 48 - Comment */}
        <div className="code-row">
          <span className="line-num">48</span>
          <span className="code-text comment">&nbsp;&nbsp;// Deduct balance directly from repository</span>
        </div>

        {/* Line 49 - Flagged Vulnerable Line */}
        <div className={`code-row code-flagged-row ${fixApplied ? 'resolved' : ''}`} ref={flaggedLineRef}>
          <span className="line-num highlight-num">49</span>
          <span className="code-text">
            {fixApplied ? (
              <span className="fixed-code-line">&nbsp;&nbsp;<span className="kw">const</span> newBal = <span className="kw">await</span> db.<span className="fn">transaction</span>(<span className="kw">async</span> (tx) =&gt; &#123; <span className="comment">/* Row locked */</span> &#125;);</span>
            ) : (
              <span>&nbsp;&nbsp;<span className="kw">const</span> newBal = <span className="kw">await</span> walletRepo.<span className="fn">decrement</span>(userId, charge.amount);</span>
            )}
          </span>
          <span className="gutter-marker" title="Critical finding on line 49">●</span>
        </div>

        {/* INLINE REVIEW ANNOTATION CARD (Pinned to Line 49) */}
        <div className="inline-review-card" ref={cardRef}>
          <div className="review-card-header">
            <div className="severity-badge-wrap">
              <span className="severity-indicator critical" />
              <span className="severity-title">CRITICAL FINDING</span>
              <span className="cwe-tag">CWE-362: Race Condition</span>
            </div>
            <div className="review-meta-actions">
              <span className="confidence-pill" ref={confidenceRef}>0% confidence</span>
              <button 
                type="button" 
                className="copy-btn" 
                onClick={handleCopy} 
                title="Copy suggested patch"
              >
                {copied ? 'Copied' : 'Copy Diff'}
              </button>
            </div>
          </div>

          <p className="review-explanation">
            <strong>State Desynchronization Risk:</strong> Non-atomic balance decrement permits concurrent webhook retries to double-credit or exceed credit limits. Mutation must be wrapped in an isolated row lock.
          </p>

          {/* Suggested Fix Diff */}
          <div className="suggested-diff-container">
            <div className="diff-header">
              <span className="diff-title">Suggested Remediation (AST-verified):</span>
              <span className="diff-tag">Auto-generated patch</span>
            </div>
            <div className="diff-block">
              <div className="diff-line diff-del">
                <span className="diff-symbol">-</span>
                <code>&nbsp;&nbsp;const newBal = await walletRepo.decrement(userId, charge.amount);</code>
              </div>
              <div className="diff-line diff-add">
                <span className="diff-symbol">+</span>
                <code>&nbsp;&nbsp;const newBal = await db.transaction(async (tx) =&gt; &#123;</code>
              </div>
              <div className="diff-line diff-add">
                <span className="diff-symbol">+</span>
                <code>&nbsp;&nbsp;&nbsp;&nbsp;const locked = await tx.wallets.forUpdate().where(&#123; userId &#125;);</code>
              </div>
              <div className="diff-line diff-add">
                <span className="diff-symbol">+</span>
                <code>&nbsp;&nbsp;&nbsp;&nbsp;return tx.wallets.decrement(locked.id, charge.amount);</code>
              </div>
              <div className="diff-line diff-add">
                <span className="diff-symbol">+</span>
                <code>&nbsp;&nbsp;&#125;);</code>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="review-card-actions">
            <button 
              type="button" 
              className={`apply-fix-btn ${fixApplied ? 'applied' : ''}`}
              onClick={() => setFixApplied(!fixApplied)}
            >
              {fixApplied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Patch Applied (Revert)</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Accept Suggested Fix</span>
                </>
              )}
            </button>
            <span className="action-hint">Passes regression tests &amp; ESLint</span>
          </div>
        </div>

        {/* Line 50 */}
        <div className="code-row">
          <span className="line-num">50</span>
          <span className="code-text">&nbsp;&nbsp;<span className="kw">await</span> auditLog.<span className="fn">record</span>(&#123; userId, delta: charge.amount, newBal &#125;);</span>
        </div>

        {/* Line 51 */}
        <div className="code-row">
          <span className="line-num">51</span>
          <span className="code-text">&nbsp;&nbsp;<span className="kw">return</span> &#123; status: <span className="str">'settled'</span>, balance: newBal &#125;;</span>
        </div>

        {/* Line 52 */}
        <div className="code-row">
          <span className="line-num">52</span>
          <span className="code-text">&#125;</span>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="window-footer">
        <div className="footer-stat">
          <span className="pulse-indicator-small" />
          <span>AST Engine: <strong>318ms</strong></span>
        </div>
        <div className="footer-stat">
          <span>Zero False-Positive Rating</span>
        </div>
        <div className="footer-stat">
          <span>Target: <strong>main &larr; feat/atomic-ledger</strong></span>
        </div>
      </div>
    </div>
  )
}
