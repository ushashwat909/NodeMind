import { CodeAnalysisProvider } from './CodeAnalysisProvider.js'

/**
 * Standard ruleset definitions for static pattern & heuristic analysis
 */
export const RULES = [
  // 1. Security: JWT
  {
    id: 'SEC-JWT-001',
    severity: 'critical',
    category: 'security',
    cweId: 'CWE-347',
    owaspCategory: 'A02:2021-Cryptographic Failures',
    title: 'Improper JWT Signature Verification (Unverified Decode)',
    pattern: /jwt\.decode\s*\(/i,
    description: 'jwt.decode() decodes the token payload without verifying its cryptographic signature. Attackers can forge arbitrary tokens and elevate privileges.',
    recommendation: 'Replace jwt.decode() with jwt.verify() specifying trusted algorithms and keys.',
    suggestedFix: 'const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ["RS256"] });',
  },
  // 2. Security: SQL Injection
  {
    id: 'SEC-SQL-001',
    severity: 'critical',
    category: 'security',
    cweId: 'CWE-89',
    owaspCategory: 'A03:2021-Injection',
    title: 'SQL Injection via Untrusted Query Concatenation',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*(?:WHERE|\+).*['"]?\s*\+\s*[a-zA-Z0-9_.]+/i,
    description: 'Dynamic SQL query built using raw string concatenation with untrusted input without parameterized prepared statements.',
    recommendation: 'Use parameterized queries ($1, ?) or an ORM query builder.',
    suggestedFix: 'const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);',
  },
  // 3. Security: Command Injection
  {
    id: 'SEC-CMD-001',
    severity: 'critical',
    category: 'security',
    cweId: 'CWE-78',
    owaspCategory: 'A03:2021-Injection',
    title: 'Command Injection via Unsanitized Child Process Execution',
    pattern: /(?:child_process|cp)\.(?:exec|execSync)\s*\(\s*`[^`]*\$\{/i,
    description: 'Passing untrusted template literals to shell execution functions allows remote arbitrary command execution on the host server.',
    recommendation: 'Use execFile or spawn with an explicit array of non-shell arguments.',
    suggestedFix: 'execFile("command", [safeArgument], (err, stdout) => { ... });',
  },
  // 4. Security: Hardcoded Credentials / Secrets
  {
    id: 'SEC-SECRET-001',
    severity: 'high',
    category: 'security',
    cweId: 'CWE-798',
    owaspCategory: 'A07:2021-Identification and Authentication Failures',
    title: 'Hardcoded Secret or Fallback Key in Source Code',
    pattern: /(?:fallback_insecure_jwt_secret_key|api_key\s*=\s*['"][a-zA-Z0-9_\-]{20,}['"]|secret\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"])/i,
    description: 'Plaintext secret or API key found hardcoded in repository source code, risking credential exposure in version control.',
    recommendation: 'Move secrets into environment variables and access via process.env.',
    suggestedFix: 'const apiKey = process.env.API_KEY || (() => { throw new Error("API_KEY missing"); })();',
  },
  // 5. Security: Missing Rate Limiting on Auth
  {
    id: 'SEC-RATE-001',
    severity: 'medium',
    category: 'security',
    cweId: 'CWE-307',
    owaspCategory: 'A07:2021-Identification and Authentication Failures',
    title: 'Authentication Route Declared Without Rate Limiting',
    pattern: /router\.post\s*\(\s*['"]\/(?:login|signin|register|signup|forgot-password)['"]\s*,\s*(?!.*(?:rateLimit|limiter))/i,
    description: 'Authentication endpoint declared without dedicated rate limiting middleware, enabling credential stuffing and brute-force attacks.',
    recommendation: 'Attach express-rate-limit middleware to prevent high-frequency brute-force attempts.',
    suggestedFix: 'router.post("/login", authRateLimiter, loginHandler);',
  },
  // 6. Security: Insecure Deserialization / eval
  {
    id: 'SEC-EVAL-001',
    severity: 'critical',
    category: 'security',
    cweId: 'CWE-95',
    owaspCategory: 'A03:2021-Injection',
    title: 'Execution of Dynamic Code via eval()',
    pattern: /\beval\s*\(/i,
    description: 'Use of eval() executes arbitrary strings as JavaScript code, introducing high-severity remote code execution vulnerabilities.',
    recommendation: 'Refactor code to use JSON.parse() or specific dispatch mappings instead of dynamic code evaluation.',
    suggestedFix: 'const data = JSON.parse(rawString);',
  },
  // 7. Bug: Unhandled Promise / Missing Await
  {
    id: 'BUG-PROMISE-001',
    severity: 'high',
    category: 'bug',
    cweId: 'CWE-754',
    title: 'Fire-and-Forget Async Operation Without Catch Handler',
    pattern: /new\s+Promise\b(?!.*\.catch)/i,
    description: 'Unhandled promise creation without a .catch() handler can lead to unhandled rejection crashes in Node.js runtime.',
    recommendation: 'Chain .catch() or wrap async calls inside a try-catch block.',
    suggestedFix: 'new Promise((resolve, reject) => { ... }).catch(handleError);',
  },
  // 8. Performance: Synchronous Event Loop Blocking
  {
    id: 'PERF-SYNC-001',
    severity: 'high',
    category: 'performance',
    cweId: 'CWE-400',
    title: 'Synchronous CPU-Bound Password Hashing on Main Thread',
    pattern: /bcrypt\.hashSync\s*\(/i,
    description: 'Synchronous bcrypt.hashSync() blocks the Node.js main thread, freezing the event loop for 100-300ms per request.',
    recommendation: 'Use asynchronous bcrypt.hash() which delegates to the Libuv worker thread pool.',
    suggestedFix: 'const hash = await bcrypt.hash(password, 12);',
  },
  // 9. Performance: Sync File I/O
  {
    id: 'PERF-FS-001',
    severity: 'medium',
    category: 'performance',
    cweId: 'CWE-400',
    title: 'Synchronous File System I/O in Application Flow',
    pattern: /fs\.(?:readFileSync|writeFileSync|appendFileSync)\s*\(/i,
    description: 'Synchronous file read/write operations block thread execution and severely degrade throughput under concurrent requests.',
    recommendation: 'Use promises-based fs/promises (fs.readFile / fs.writeFile) with async/await.',
    suggestedFix: 'const data = await fs.promises.readFile(filePath, "utf-8");',
  },
  // 10. Style: Debugger Statement in Production
  {
    id: 'STYLE-DEBUG-001',
    severity: 'medium',
    category: 'style',
    title: 'Active debugger Statement Left in Code',
    pattern: /\bdebugger\s*;/i,
    description: 'A debugger breakpoint statement was left in production source code, which will pause runtime execution when inspected.',
    recommendation: 'Remove debugger statements before pushing to version control.',
    suggestedFix: '// debugger statement removed',
  },
  // 11. Style: Console Logging
  {
    id: 'STYLE-LOG-001',
    severity: 'low',
    category: 'style',
    title: 'Development console.log() in Application Code',
    pattern: /console\.(?:log|debug)\s*\(/i,
    description: 'console.log() pollutes standard output, is unformatted for centralized telemetry, and may unintentionally leak sensitive runtime variables.',
    recommendation: 'Use a structured logging library like pino, winston, or an application logger.',
    suggestedFix: 'logger.info({ userId }, "User authenticated successfully");',
  },
  // 12. Maintainability: Magic Numbers
  {
    id: 'MAINT-MAGIC-001',
    severity: 'info',
    category: 'maintainability',
    title: 'Magic Number Constant Without Named Definition',
    pattern: /(?:setTimeout|setInterval)\s*\([^,]+,\s*(?:86400000|3600000|600000|86400)/i,
    description: 'Large raw millisecond literals reduce readability and make temporal configurations difficult to maintain.',
    recommendation: 'Extract magic numeric intervals into named descriptive constants.',
    suggestedFix: 'const ONE_DAY_MS = 24 * 60 * 60 * 1000;\nsetTimeout(cleanup, ONE_DAY_MS);',
  },
]

/**
 * High-performance deterministic rule-based analysis engine.
 */
export class RuleBasedAnalysisProvider extends CodeAnalysisProvider {
  constructor(options = {}) {
    super('rule_based', options)
    this.rules = options.rules || RULES
  }

  /**
   * Analyzes an individual file using compiled static rules
   */
  async analyzeFile({ path, content, language, metadata }) {
    if (!content || typeof content !== 'string') {
      return []
    }

    const findings = []
    const lines = content.split('\n')
    const MAX_FINDINGS_PER_FILE = 50
    const MAX_LINE_EVAL_LENGTH = 2000

    for (const rule of this.rules) {
      if (findings.length >= MAX_FINDINGS_PER_FILE) break

      for (let i = 0; i < lines.length; i++) {
        if (findings.length >= MAX_FINDINGS_PER_FILE) break

        const line = lines[i]
        // Guard against ReDoS on adversarial ultra-long lines (e.g. minified binaries or payload inflation)
        const evalLine = line.length > MAX_LINE_EVAL_LENGTH ? line.slice(0, MAX_LINE_EVAL_LENGTH) : line

        if (rule.pattern.test(evalLine)) {
          const lineNum = i + 1
          const startIdx = Math.max(0, i - 1)
          const endIdx = Math.min(lines.length, i + 2)
          let snippet = lines.slice(startIdx, endIdx).join('\n')
          if (snippet.length > 1000) {
            snippet = snippet.slice(0, 1000) + '... [truncated]'
          }

          findings.push({
            filePath: path,
            severity: rule.severity,
            category: rule.category,
            title: rule.title,
            description: rule.description,
            lineStart: lineNum,
            lineEnd: lineNum,
            snippet,
            recommendation: rule.recommendation,
            suggestedFix: rule.suggestedFix || null,
            cweId: rule.cweId || null,
            owaspCategory: rule.owaspCategory || null,
          })
        }
      }
    }

    return findings
  }
}
