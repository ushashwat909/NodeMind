import { useState, useRef, useEffect } from 'react'
import { gsap } from '@/animations/gsap'
import './CodeDiffVisualizer.css'

const diffScenarios = [
  {
    id: 'memory-leak',
    title: 'React WebSocket Listener Leak',
    filename: 'client/src/hooks/useRealtimeStream.ts',
    language: 'TypeScript',
    severity: 'HIGH',
    cwe: 'CWE-401: Missing Handler Cleanup',
    confidence: '99.8%',
    summary:
      'Missing cleanup in useEffect callback leaves WebSocket event listeners dangling on component re-render, accumulating hundreds of duplicate handlers in browser memory.',
    diffLines: [
      { type: 'ctx', numOld: 18, numNew: 18, text: '  useEffect(() => {' },
      { type: 'ctx', numOld: 19, numNew: 19, text: '    const socket = getWebSocketConnection(channelId);' },
      { type: 'ctx', numOld: 20, numNew: 20, text: '    const onMessage = (event: MessageEvent) => {' },
      { type: 'ctx', numOld: 21, numNew: 21, text: '      dispatch({ type: "SYNC_EVENT", payload: JSON.parse(event.data) });' },
      { type: 'ctx', numOld: 22, numNew: 22, text: '    };' },
      { type: 'del', numOld: 23, numNew: '', text: '    socket.addEventListener("message", onMessage);' },
      { type: 'add', numOld: '', numNew: 23, text: '    socket.addEventListener("message", onMessage);' },
      { type: 'add', numOld: '', numNew: 24, text: '    return () => {' },
      { type: 'add', numOld: '', numNew: 25, text: '      socket.removeEventListener("message", onMessage);' },
      { type: 'add', numOld: '', numNew: 26, text: '    };' },
      { type: 'ctx', numOld: 24, numNew: 27, text: '  }, [channelId]);' },
    ],
  },
  {
    id: 'sql-injection',
    title: 'Dynamic SQL String Interpolation',
    filename: 'server/src/controllers/audit_query.py',
    language: 'Python',
    severity: 'CRITICAL',
    cwe: 'CWE-89: SQL Injection',
    confidence: '100%',
    summary:
      'Direct f-string parameter interpolation in SQL query enables arbitrary database command execution and tenant data leakage under malicious user input.',
    diffLines: [
      { type: 'ctx', numOld: 52, numNew: 52, text: 'def fetch_tenant_audit_logs(tenant_id: str, actor_id: str):' },
      { type: 'ctx', numOld: 53, numNew: 53, text: '    cursor = get_db_cursor()' },
      { type: 'del', numOld: 54, numNew: '', text: '    query = f"SELECT * FROM audit_events WHERE tenant_id = \'{tenant_id}\' AND actor_id = \'{actor_id}\'"' },
      { type: 'del', numOld: 55, numNew: '', text: '    cursor.execute(query)' },
      { type: 'add', numOld: '', numNew: 54, text: '    query = "SELECT * FROM audit_events WHERE tenant_id = %s AND actor_id = %s"' },
      { type: 'add', numOld: '', numNew: 55, text: '    cursor.execute(query, (tenant_id, actor_id))' },
      { type: 'ctx', numOld: 56, numNew: 56, text: '    return cursor.fetchall()' },
    ],
  },
  {
    id: 'concurrency-race',
    title: 'Unsynchronized Map Mutation in Goroutine',
    filename: 'workers/order_stream.go',
    language: 'Go',
    severity: 'CRITICAL',
    cwe: 'CWE-362: Concurrent Execution without Lock',
    confidence: '99.2%',
    summary:
      'Concurrent read/write access to package-level inventory map without sync.RWMutex lock triggers fatal runtime panic "concurrent map writes" under heavy load.',
    diffLines: [
      { type: 'ctx', numOld: 34, numNew: 34, text: 'func ProcessOrderBatch(ctx context.Context, orders []Order) error {' },
      { type: 'ctx', numOld: 35, numNew: 35, text: '    for _, order := range orders {' },
      { type: 'del', numOld: 36, numNew: '', text: '        inventoryStore[order.SKU] -= order.Quantity' },
      { type: 'add', numOld: '', numNew: 36, text: '        inventoryLock.Lock()' },
      { type: 'add', numOld: '', numNew: 37, text: '        inventoryStore[order.SKU] -= order.Quantity' },
      { type: 'add', numOld: '', numNew: 38, text: '        inventoryLock.Unlock()' },
      { type: 'ctx', numOld: 37, numNew: 39, text: '    }' },
      { type: 'ctx', numOld: 38, numNew: 40, text: '    return nil' },
      { type: 'ctx', numOld: 39, numNew: 41, text: '}' },
    ],
  },
]

export default function CodeDiffVisualizer() {
  const [activeTab, setActiveTab] = useState(0)
  const [viewMode, setViewMode] = useState('diff') // 'diff' | 'remediated'
  const diffBoxRef = useRef(null)
  const sectionRef = useRef(null)

  const scenario = diffScenarios[activeTab]

  // Section entrance reveal on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.diff-inspector-card', {
        opacity: 0,
        y: 40,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Crossfade diff content when changing tabs
  useEffect(() => {
    if (diffBoxRef.current) {
      gsap.fromTo(
        diffBoxRef.current,
        { opacity: 0.3, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }, [activeTab, viewMode])

  return (
    <section className="diff-section" id="code-inspector" ref={sectionRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <span className="section-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 18l6-6-6-6"></path>
              <path d="M8 6l-6 6 6 6"></path>
            </svg>
            Interactive Diff Inspector
          </span>
          <h2 className="section-heading">See what linters miss.</h2>
          <p className="section-description">
            Explore authentic flaw patterns discovered in real pull requests and examine the syntactically validated fixes generated by the agent.
          </p>
        </div>

        {/* Diff Box Container */}
        <div className="diff-inspector-card glass-panel">
          {/* Top Scenario Selector Tabs */}
          <div className="scenario-tab-bar">
            <div className="tabs-list" role="tablist" aria-label="Code issue scenarios">
              {diffScenarios.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === idx}
                  className={`scenario-tab ${activeTab === idx ? 'active' : ''}`}
                  onClick={() => setActiveTab(idx)}
                >
                  <span className={`scenario-severity-dot ${sc.severity.toLowerCase()}`} />
                  <span className="tab-title">{sc.title}</span>
                  <span className="tab-lang">{sc.language}</span>
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${viewMode === 'diff' ? 'active' : ''}`}
                onClick={() => setViewMode('diff')}
              >
                Unified Diff
              </button>
              <button
                type="button"
                className={`mode-btn ${viewMode === 'remediated' ? 'active' : ''}`}
                onClick={() => setViewMode('remediated')}
              >
                Clean Patch
              </button>
            </div>
          </div>

          {/* Finding Diagnostic Bar */}
          <div className="diff-meta-strip">
            <div className="meta-left">
              <span className={`severity-tag ${scenario.severity.toLowerCase()}`}>
                {scenario.severity}
              </span>
              <span className="cwe-label">{scenario.cwe}</span>
              <span className="filepath-label">{scenario.filename}</span>
            </div>
            <div className="meta-right">
              <span className="confidence-label">Confidence: <strong>{scenario.confidence}</strong></span>
              <span className="status-label-auto">Verified Patch</span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="diff-explanation-box">
            <div className="exp-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <p className="exp-text">{scenario.summary}</p>
          </div>

          {/* Code Lines Display */}
          <div className="diff-code-viewport" ref={diffBoxRef}>
            {scenario.diffLines
              .filter((line) => (viewMode === 'remediated' ? line.type !== 'del' : true))
              .map((line, idx) => (
                <div
                  key={idx}
                  className={`diff-view-row ${line.type === 'add' ? 'row-add' : line.type === 'del' ? 'row-del' : 'row-ctx'}`}
                >
                  <span className="gutter-num old-num">{line.numOld || ''}</span>
                  <span className="gutter-num new-num">{line.numNew || ''}</span>
                  <span className="gutter-sign">
                    {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                  </span>
                  <pre className="line-content">
                    <code>{line.text}</code>
                  </pre>
                </div>
              ))}
          </div>

          {/* Diff Bottom Action Bar */}
          <div className="diff-card-footer">
            <div className="footer-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Remediation builds without syntax or type errors</span>
            </div>
            <div className="footer-actions">
              <span className="patch-ready-pill">
                git apply &lt; remediation.patch
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
