import { useState } from 'react'
import ToggleSwitch from '@/components/common/ToggleSwitch'
import { useToast } from '@/context/ToastContext'

export default function SettingsView({
  user,
  profile,
  onSignOut,
  signingOut,
}) {
  const { addToast } = useToast()
  const [policies, setPolicies] = useState({
    autoReview: true,
    strictGating: true,
    deepTaint: true,
    verifiedFixes: true,
    completionAlerts: true,
  })

  const handleToggle = (key, label) => {
    setPolicies((prev) => {
      const next = !prev[key]
      if (addToast) {
        addToast(`${label}: ${next ? 'Policy Activated' : 'Policy Deactivated'}`, next ? 'success' : 'info')
      }
      return { ...prev, [key]: next }
    })
  }

  return (
    <div className="settings-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title">Developer &amp; Account Settings</h2>
          <p className="view-subtitle">Manage organization credentials, analysis rulesets, and database security</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="dev-card settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">User &amp; Organization Identity</h3>
            <span className="badge badge-success">RLS Enforced</span>
          </div>

          <div className="settings-form-list">
            <div className="settings-field">
              <span className="field-label">Display Name</span>
              <span className="field-value">{profile?.display_name || user?.email?.split('@')[0]}</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Primary Email</span>
              <span className="field-value">{user?.email}</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Organization</span>
              <span className="field-value">{profile?.company || 'Personal Engineering Org'}</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Tenant ID (auth.uid)</span>
              <code className="code-pill mono">{user?.id}</code>
            </div>
          </div>
        </div>

        {/* Engine & Ruleset Configuration */}
        <div className="dev-card settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Analysis Engine &amp; Safeguards</h3>
            <span className="badge badge-accent">AST + Static Rules</span>
          </div>

          <div className="settings-form-list">
            <div className="settings-field">
              <span className="field-label">Active Engine</span>
              <span className="field-value">Replaceable Provider (RuleBasedAnalysisProvider)</span>
            </div>
            <div className="settings-field">
              <span className="field-label">AI Engine Fallback</span>
              <span className="field-value">Enabled (Gemini / OpenAI compatible)</span>
            </div>
            <div className="settings-field">
              <span className="field-label">File Size Safeguard</span>
              <span className="field-value">512 KB per file max limit</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Total Review Safeguard</span>
              <span className="field-value">5 MB aggregate review payload cap</span>
            </div>
          </div>
        </div>

        {/* Autonomous Workflow Policies Card with Uiverse Toggle Switches */}
        <div className="dev-card settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Autonomous Workflow Policies</h3>
            <span className="badge badge-accent">Policy Engine</span>
          </div>

          <div className="settings-toggles-list">
            <div className="toggle-setting-row">
              <ToggleSwitch
                id="toggle-auto-review"
                checked={policies.autoReview}
                onChange={() => handleToggle('autoReview', 'Automated PR Reviews')}
                label="Automated Pull Request Reviews"
                description="Trigger AST scans immediately when pull requests are created or updated"
              />
            </div>

            <div className="toggle-setting-row">
              <ToggleSwitch
                id="toggle-strict-gating"
                checked={policies.strictGating}
                onChange={() => handleToggle('strictGating', 'Strict Quality Gating')}
                label="Strict CI Quality Gate"
                description="Block merge status when Critical or High security vulnerabilities are flagged"
              />
            </div>

            <div className="toggle-setting-row">
              <ToggleSwitch
                id="toggle-deep-taint"
                checked={policies.deepTaint}
                onChange={() => handleToggle('deepTaint', 'Deep AST Taint Traversal')}
                label="Cross-File Taint Tracing"
                description="Trace untrusted user inputs across module boundaries to sensitive database sinks"
              />
            </div>

            <div className="toggle-setting-row">
              <ToggleSwitch
                id="toggle-verified-fixes"
                checked={policies.verifiedFixes}
                onChange={() => handleToggle('verifiedFixes', 'Compiler-Verified Fix Diffs')}
                label="Actionable Remediation Diffs"
                description="Synthesize verified 1-click Git patches formatted for GitHub PR suggestions"
              />
            </div>

            <div className="toggle-setting-row">
              <ToggleSwitch
                id="toggle-completion-alerts"
                checked={policies.completionAlerts}
                onChange={() => handleToggle('completionAlerts', 'Real-time Completion Alerts')}
                label="Real-time Completion Notifications"
                description="Display desktop toasts and sound cues when long-running reviews finish"
              />
            </div>
          </div>
        </div>

        {/* Monitored Rulesets */}
        <div className="dev-card settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Monitored Rulesets</h3>
            <span className="badge badge-info">4 Active Packs</span>
          </div>

          <div className="ruleset-pills-list">
            <div className="ruleset-item">
              <span className="status-dot green" />
              <div>
                <strong>OWASP Top 10 Vulnerabilities</strong>
                <p>SQL Injection, Command Injection, Unverified JWT decode, and XSS patterns.</p>
              </div>
            </div>
            <div className="ruleset-item">
              <span className="status-dot green" />
              <div>
                <strong>Event Loop Performance Guards</strong>
                <p>Flags synchronous bcrypt, sync fs calls, and blocking CPU routines on main thread.</p>
              </div>
            </div>
            <div className="ruleset-item">
              <span className="status-dot green" />
              <div>
                <strong>Authentication &amp; Rate Limiting</strong>
                <p>Ensures sensitive endpoints are shielded with dedicated rate limiting middleware.</p>
              </div>
            </div>
            <div className="ruleset-item">
              <span className="status-dot green" />
              <div>
                <strong>Code Hygiene &amp; Clean Architecture</strong>
                <p>Detects leftover console logs, magic numeric timeouts, and dangling unhandled rejections.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Security */}
        <div className="dev-card settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Session Security</h3>
            <span className="badge badge-neutral">Supabase Auth</span>
          </div>

          <div className="settings-form-list">
            <div className="settings-field">
              <span className="field-label">Storage</span>
              <span className="field-value">Browser LocalStorage (Encrypted Token)</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Session Auto-Refresh</span>
              <span className="field-value">Active via Supabase GoTrue client</span>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              className={`btn btn-secondary signout-action-btn ${signingOut ? 'is-loading' : ''}`}
              onClick={onSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <span className="btn-spinner" />
                  <span>Signing out...</span>
                </>
              ) : (
                <span>Sign Out of Session</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
