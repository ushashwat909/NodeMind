import { useState } from 'react'
import './CodeReviewShowcase.css'

const DEMO_SAMPLES = [
  {
    id: 'auth',
    fileName: 'src/services/authService.ts',
    lang: 'TypeScript',
    branch: 'main',
    commit: '7f9a2d4',
    severity: 'HIGH',
    severityClass: 'high',
    title: 'Hardcoded Secret Fallback Vulnerability',
    category: 'Authentication Security · CWE-798',
    targetLines: [47, 48, 49],
    highlightLine: 48,
    lines: [
      { num: 42, text: 'export async function verifyUserSession(token: string): Promise<UserSession> {' },
      { num: 43, text: '  if (!token) {' },
      { num: 44, text: "    throw new AuthenticationError('Bearer authorization token is missing');" },
      { num: 45, text: '  }' },
      { num: 46, text: '' },
      { num: 47, text: '  // Verify incoming claims against token signature' },
      {
        num: 48,
        text: "  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');",
        highlight: true,
      },
      { num: 49, text: '  return decoded as UserSession;' },
      { num: 50, text: '}' },
    ],
    whyItMatters:
      'If process.env.JWT_SECRET is omitted or undefined in staging or production, signature verification falls back to a static known default. Attackers can forge administrative JWT tokens signed with this fallback key to completely bypass authentication controls.',
    suggestedFix: {
      del: "const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');",
      add: `const jwtSecret = process.env.JWT_SECRET;\nif (!jwtSecret) {\n  throw new ConfigurationError('JWT_SECRET environment variable is required');\n}\nconst decoded = jwt.verify(token, jwtSecret);`,
    },
  },
  {
    id: 'webhook',
    fileName: 'src/api/webhookHandler.ts',
    lang: 'TypeScript',
    branch: 'release/v2',
    commit: 'c1b48e2',
    severity: 'CRITICAL',
    severityClass: 'critical',
    title: 'Missing Webhook HMAC Signature Verification',
    category: 'API Integrity · CWE-353',
    targetLines: [82, 83, 84],
    highlightLine: 83,
    lines: [
      { num: 79, text: 'export async function handleStripeWebhook(req: Request, res: Response) {' },
      { num: 80, text: "  const sig = req.headers['stripe-signature'];" },
      { num: 81, text: '  const rawBody = req.body;' },
      { num: 82, text: '' },
      {
        num: 83,
        text: '  // Direct execution without crypto signature validation',
        highlight: true,
      },
      {
        num: 84,
        text: '  await recordCustomerFulfillment(JSON.parse(rawBody));',
        highlight: true,
      },
      { num: 85, text: '  return res.status(200).send({ received: true });' },
      { num: 86, text: '}' },
    ],
    whyItMatters:
      'The webhook endpoint fulfills order events without verifying Stripe crypto HMAC signatures. An attacker can POST arbitrary forged payment events to mark unpaid checkouts as fulfilled.',
    suggestedFix: {
      del: 'await recordCustomerFulfillment(JSON.parse(rawBody));',
      add: `const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);\nawait recordCustomerFulfillment(event.data.object);`,
    },
  },
  {
    id: 'db',
    fileName: 'src/db/connectionPool.ts',
    lang: 'TypeScript',
    branch: 'main',
    commit: '3e8891a',
    severity: 'HIGH',
    severityClass: 'high',
    title: 'Raw SQL String Concatenation Injection',
    category: 'Injection Vulnerability · CWE-89',
    targetLines: [111, 112, 113],
    highlightLine: 112,
    lines: [
      { num: 109, text: 'export async function findUserByTenant(tenantId: string, email: string) {' },
      { num: 110, text: '  const pool = await getDatabasePool();' },
      { num: 111, text: '' },
      {
        num: 112,
        text: "  const query = `SELECT * FROM users WHERE tenant_id = '${tenantId}' AND email = '${email}'`;",
        highlight: true,
      },
      { num: 113, text: '  const result = await pool.query(query);' },
      { num: 114, text: '  return result.rows[0];' },
      { num: 115, text: '}' },
    ],
    whyItMatters:
      'Interpolating unescaped parameters directly into raw SQL template strings permits SQL injection attacks, risking cross-tenant data exfiltration or table destruction.',
    suggestedFix: {
      del: "const query = `SELECT * FROM users WHERE tenant_id = '${tenantId}' AND email = '${email}'`;\nconst result = await pool.query(query);",
      add: `const query = 'SELECT * FROM users WHERE tenant_id = $1 AND email = $2';\nconst result = await pool.query(query, [tenantId, email]);`,
    },
  },
]

export default function CodeReviewShowcase() {
  const [activeTab, setActiveTab] = useState(DEMO_SAMPLES[0])
  const [copiedFix, setCopiedFix] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab.suggestedFix.add)
    setCopiedFix(true)
    setTimeout(() => setCopiedFix(false), 2000)
  }

  return (
    <div className="code-review-showcase-box">
      {/* Top File Tab Selector */}
      <div className="showcase-topbar">
        <div className="showcase-tabs-group">
          {DEMO_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className={`showcase-tab-btn ${activeTab.id === sample.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(sample)}
            >
              <span className={`file-status-dot ${sample.severityClass}`} />
              <span className="file-name-label">{sample.fileName}</span>
            </button>
          ))}
        </div>

        <div className="showcase-meta-right">
          <span className="meta-branch-tag">branch: {activeTab.branch}</span>
          <span className="meta-commit-tag">commit: {activeTab.commit}</span>
        </div>
      </div>

      {/* Main 2-Column Developer Composition */}
      <div className="showcase-body-grid">
        {/* LEFT COLUMN: Source Code View with Highlighted Range */}
        <div className="showcase-code-column">
          <div className="code-header-sub">
            <span className="file-crumb-path">{activeTab.fileName}</span>
            <span className="file-lang-pill">{activeTab.lang}</span>
          </div>

          <div className="code-editor-viewport">
            <table className="code-lines-table">
              <tbody>
                {activeTab.lines.map((line) => (
                  <tr
                    key={line.num}
                    className={`editor-row ${line.highlight ? 'is-vuln-row' : ''}`}
                  >
                    <td className="editor-gutter">
                      <span className="line-num">{line.num}</span>
                      {line.highlight && <span className="vuln-indicator-bullet" />}
                    </td>
                    <td className="editor-content">
                      <pre className="code-text-line">
                        <code>{line.text}</code>
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Review Finding & Suggested Fix Panel */}
        <div className="showcase-finding-column">
          {/* Finding Header */}
          <div className="finding-header-box">
            <div className="finding-tags-row">
              <span className={`finding-sev-pill ${activeTab.severityClass}`}>
                {activeTab.severity} SEVERITY
              </span>
              <span className="finding-cwe-pill">{activeTab.category}</span>
            </div>
            <h4 className="finding-title-text">{activeTab.title}</h4>
            <span className="finding-loc-tag">
              Lines {activeTab.targetLines.join(', ')} · Flagged by AST security engine
            </span>
          </div>

          {/* Why This Matters */}
          <div className="finding-explanation-block">
            <span className="explanation-section-title">WHY THIS MATTERS</span>
            <p className="explanation-paragraph">{activeTab.whyItMatters}</p>
          </div>

          {/* Suggested Fix (Unified Diff) */}
          <div className="finding-diff-box">
            <div className="diff-bar-top">
              <span className="diff-bar-label">SUGGESTED MITIGATION</span>
              <button
                type="button"
                className="btn-copy-patch"
                onClick={handleCopy}
              >
                {copiedFix ? 'COPIED TO CLIPBOARD' : 'COPY PATCH'}
              </button>
            </div>

            <div className="diff-stream-viewport">
              <div className="diff-line-item del">
                <span className="diff-symbol">-</span>
                <pre className="diff-pre">
                  <code>{activeTab.suggestedFix.del}</code>
                </pre>
              </div>
              <div className="diff-line-item add">
                <span className="diff-symbol">+</span>
                <pre className="diff-pre">
                  <code>{activeTab.suggestedFix.add}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
