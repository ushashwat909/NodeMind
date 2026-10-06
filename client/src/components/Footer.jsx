import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import './Footer.css'

export default function Footer() {
  const [healthData, setHealthData] = useState(null)
  const [healthStatus, setHealthStatus] = useState('checking')

  useEffect(() => {
    let mounted = true

    const checkHealth = async () => {
      try {
        const res = await api.health()
        if (mounted) {
          setHealthData(res?.data || res)
          setHealthStatus('ok')
        }
      } catch {
        if (mounted) {
          setHealthStatus('offline')
        }
      }
    }

    checkHealth()
    const timer = setInterval(checkHealth, 10000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const uptimeLabel = healthData?.uptimeSeconds != null
    ? (healthData.uptimeSeconds >= 60
        ? `${Math.floor(healthData.uptimeSeconds / 60)}m uptime`
        : `${healthData.uptimeSeconds}s uptime`)
    : (healthData?.uptime || 'Online')

  return (
    <footer className="footer-root">
      <div className="container">
        {/* Top Grid */}
        <div className="footer-top-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <div className="footer-brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                  <circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
                </svg>
              </div>
              <span className="footer-brand-title">Code Review Agent</span>
            </Link>
            <p className="footer-tagline">
              Autonomous AST-grade static and semantic code analysis. Surfaces actionable inline fixes before pull requests merge.
            </p>

            {/* Live Operational Status */}
            <div className="footer-status-indicator">
              <span className={`status-bubble ${healthStatus}`} />
              <span className="status-bubble-text">
                {healthStatus === 'ok' ? (
                  <>API Operational &bull; {uptimeLabel}</>
                ) : healthStatus === 'checking' ? (
                  'Checking Backend Status...'
                ) : (
                  'Backend Offline (Connecting...)'
                )}
              </span>
            </div>
          </div>

          {/* Links Cols */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Product</h4>
            <ul className="footer-list">
              <li><a href="/#features">Repository Analysis</a></li>
              <li><a href="/#features">Issue Detection</a></li>
              <li><a href="/#code-inspector">Diff Inspector</a></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><a href="/#security">Security Architecture</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading">Developers</h4>
            <ul className="footer-list">
              <li><a href="/#code-inspector">CLI Documentation</a></li>
              <li><a href="/#how-it-works">GitHub App</a></li>
              <li><a href="/#how-it-works">GitLab CI Setup</a></li>
              <li><Link to="/login">REST API Access</Link></li>
              <li><Link to="/login">AST Rules Engine</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading">Security &amp; Legal</h4>
            <ul className="footer-list">
              <li><a href="/#security">Zero Retention Policy</a></li>
              <li><a href="/#security">SOC2 Compliance Roadmap</a></li>
              <li><a href="/#security">Data Encryption</a></li>
              <li><a href="/#security">Privacy Policy</a></li>
              <li><a href="/#security">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            &copy; 2026 Code Review Agent. Powered by Supabase, Express &amp; React.
          </p>
          <div className="footer-tech-stack">
            <span>TypeScript</span>
            <span className="dot-sep">&bull;</span>
            <span>React + Vite</span>
            <span className="dot-sep">&bull;</span>
            <span>Express</span>
            <span className="dot-sep">&bull;</span>
            <span>Supabase</span>
            <span className="dot-sep">&bull;</span>
            <span>GSAP</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
