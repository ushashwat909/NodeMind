import { CodeAnalysisProvider } from './CodeAnalysisProvider.js'

/**
 * Deterministic Mock Analysis Provider for unit, integration, and lifecycle testing.
 * Does not make external network or LLM API calls.
 */
export class MockAnalysisProvider extends CodeAnalysisProvider {
  constructor(options = {}) {
    super('mock', options)
    // Custom findings keyed by file path or wildcard
    this.customFindingsByPath = options.customFindingsByPath || {}
    // Simulated error paths to test failed-file isolation
    this.simulatedErrorPaths = new Set(options.simulatedErrorPaths || [])
    // Simulated delay in milliseconds
    this.simulatedLatencyMs = options.simulatedLatencyMs || 0
  }

  /**
   * Configures preset findings for a specific file path
   * @param {string} path
   * @param {Array<object>} findings
   */
  setFindingsForPath(path, findings) {
    this.customFindingsByPath[path] = findings
  }

  /**
   * Analyzes an individual source code file deterministically
   */
  async analyzeFile({ path, content, language, metadata }) {
    if (this.simulatedLatencyMs > 0) {
      await new Promise(r => setTimeout(r, this.simulatedLatencyMs))
    }

    if (this.simulatedErrorPaths.has(path)) {
      throw new Error(`Simulated mock analysis failure on file: ${path}`)
    }

    // Check if custom findings were injected for this path
    if (this.customFindingsByPath[path]) {
      return this.customFindingsByPath[path].map(f => ({ ...f, filePath: path }))
    }

    const findings = []
    const lines = (content || '').split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      // Deterministic triggers based on content patterns for testing:
      if (line.includes('MOCK_CRITICAL_SQL_INJECTION') || line.includes('SELECT * FROM users WHERE id = \' +')) {
        findings.push({
          filePath: path,
          severity: 'critical',
          category: 'security',
          title: 'SQL Injection in Raw Query',
          description: 'Untrusted user parameter concatenated directly into SQL statement.',
          lineStart: lineNum,
          lineEnd: lineNum,
          recommendation: 'Use parameterized queries ($1) instead of concatenation.',
          suggestedFix: 'await db.query("SELECT * FROM users WHERE id = $1", [userId]);',
          cweId: 'CWE-89',
          owaspCategory: 'A03:2021-Injection',
        })
      }

      if (line.includes('MOCK_CRITICAL_JWT_UNVERIFIED') || line.includes('jwt.decode(')) {
        findings.push({
          filePath: path,
          severity: 'critical',
          category: 'security',
          title: 'Unverified JWT Token Payload Decoding',
          description: 'Token payload decoded without cryptographic verification.',
          lineStart: lineNum,
          lineEnd: lineNum,
          recommendation: 'Verify JWT cryptographic signature with jwt.verify().',
          suggestedFix: 'jwt.verify(token, secret, { algorithms: ["HS256"] });',
          cweId: 'CWE-347',
          owaspCategory: 'A02:2021-Cryptographic Failures',
        })
      }

      if (line.includes('MOCK_HIGH_SYNC_BLOCKING') || line.includes('bcrypt.hashSync(')) {
        findings.push({
          filePath: path,
          severity: 'high',
          category: 'performance',
          title: 'Synchronous Password Hashing Blocks Event Loop',
          description: 'Synchronous CPU-intensive bcrypt hashing blocks event loop execution.',
          lineStart: lineNum,
          lineEnd: lineNum,
          recommendation: 'Use asynchronous bcrypt.hash() to leverage thread pool.',
          suggestedFix: 'await bcrypt.hash(password, 10);',
          cweId: 'CWE-400',
        })
      }

      if (line.includes('MOCK_MEDIUM_MISSING_RATELIMIT') || line.includes('router.post(\'/login\'')) {
        findings.push({
          filePath: path,
          severity: 'medium',
          category: 'security',
          title: 'Authentication Endpoint Missing Rate Limiting',
          description: 'Login endpoint exposed without credential brute-force protection.',
          lineStart: lineNum,
          lineEnd: lineNum,
          recommendation: 'Attach rate limiting middleware to auth endpoints.',
          suggestedFix: 'router.post("/login", authLimiter, handler);',
          cweId: 'CWE-307',
        })
      }

      if (line.includes('MOCK_LOW_CONSOLE_LOG') || line.includes('console.log(')) {
        findings.push({
          filePath: path,
          severity: 'low',
          category: 'style',
          title: 'Console Log in Production Code',
          description: 'Debugging statement left in production source file.',
          lineStart: lineNum,
          lineEnd: lineNum,
          recommendation: 'Replace console.log with structured application logger.',
          suggestedFix: 'logger.debug("Debug event");',
        })
      }
    }

    return findings
  }
}
