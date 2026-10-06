import { logger } from '../../lib/logger.js'

export const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info'])
export const VALID_CATEGORIES = new Set(['bug', 'security', 'performance', 'maintainability', 'style', 'architecture'])

const SEVERITY_RANK = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  info: 5,
}

const SEVERITY_SYNONYMS = {
  blocker: 'critical',
  fatal: 'critical',
  urgent: 'critical',
  error: 'high',
  warn: 'medium',
  warning: 'medium',
  moderate: 'medium',
  minor: 'low',
  notice: 'info',
  hint: 'info',
  informational: 'info',
}

const CATEGORY_SYNONYMS = {
  bug_risk: 'bug',
  defect: 'bug',
  correctness: 'bug',
  reliability: 'bug',
  vuln: 'security',
  vulnerability: 'security',
  sec: 'security',
  perf: 'performance',
  speed: 'performance',
  optimization: 'performance',
  code_style: 'style',
  formatting: 'style',
  lint: 'style',
  best_practice: 'maintainability',
  refactoring: 'maintainability',
  complexity: 'maintainability',
  design: 'architecture',
  modularity: 'architecture',
  structure: 'architecture',
}

/**
 * FindingNormalizer Stage
 * Enforces canonical finding schema and normalized severity/category enums across all providers.
 */
export class FindingNormalizer {
  /**
   * Normalizes a severity string into the canonical enum
   * @param {string} raw
   * @returns {'critical' | 'high' | 'medium' | 'low' | 'info'}
   */
  normalizeSeverity(raw) {
    if (!raw || typeof raw !== 'string') return 'medium'
    const lower = raw.trim().toLowerCase()
    if (VALID_SEVERITIES.has(lower)) return lower
    if (SEVERITY_SYNONYMS[lower]) return SEVERITY_SYNONYMS[lower]
    return 'medium'
  }

  /**
   * Normalizes a category string into the canonical enum
   * @param {string} raw
   * @returns {'bug' | 'security' | 'performance' | 'maintainability' | 'style' | 'architecture'}
   */
  normalizeCategory(raw) {
    if (!raw || typeof raw !== 'string') return 'maintainability'
    const lower = raw.trim().toLowerCase()
    if (VALID_CATEGORIES.has(lower)) return lower
    if (CATEGORY_SYNONYMS[lower]) return CATEGORY_SYNONYMS[lower]
    return 'maintainability'
  }

  /**
   * Normalizes file path, stripping traversal attempts and leading slashes
   * @param {string} rawPath
   * @returns {string}
   */
  normalizeFilePath(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return 'unknown_file'
    let cleaned = rawPath.replace(/\\/g, '/').replace(/^\/+/, '').trim()
    // Strip null bytes and repeatedly strip traversal segments
    cleaned = cleaned.replace(/\0/g, '')
    while (cleaned.includes('..')) {
      cleaned = cleaned.replace(/(?:^|\/)\.\.(?:\/|$)/g, '/')
      cleaned = cleaned.replace(/\/+/g, '/').replace(/^\/+/, '')
    }
    return cleaned || 'unknown_file'
  }

  /**
   * Normalizes a list of raw finding objects into the strict application schema
   * @param {Array<object>} rawFindings
   * @param {Map<string, { content: string, linesCount: number }>} [filesMap]
   * @returns {Array<object>} Normalized findings sorted by severity
   */
  normalizeFindings(rawFindings = [], filesMap = new Map()) {
    const normalized = []

    for (const raw of rawFindings) {
      if (!raw || typeof raw !== 'object') continue

      const filePath = this.normalizeFilePath(raw.file || raw.filePath || '')
      const fileInfo = filesMap.get(filePath)
      const maxLines = fileInfo?.linesCount || 10000

      // Line numbers validation & clamping
      let lineStart = parseInt(raw.line_start ?? raw.lineStart, 10)
      if (isNaN(lineStart) || lineStart < 1) lineStart = 1
      if (lineStart > maxLines) lineStart = maxLines

      let lineEnd = parseInt(raw.line_end ?? raw.lineEnd, 10)
      if (isNaN(lineEnd) || lineEnd < lineStart) lineEnd = lineStart
      if (lineEnd > maxLines) lineEnd = maxLines

      // Generate snippet if missing
      let snippet = raw.snippet || null
      if (!snippet && fileInfo && fileInfo.content) {
        const lines = fileInfo.content.split('\n')
        const startIdx = Math.max(0, lineStart - 2)
        const endIdx = Math.min(lines.length, lineEnd + 1)
        snippet = lines.slice(startIdx, endIdx).join('\n')
      }

      const item = {
        severity: this.normalizeSeverity(raw.severity),
        category: this.normalizeCategory(raw.category),
        title: String(raw.title || 'Code Quality Finding').trim().slice(0, 250),
        description: String(raw.description || 'Potential issue identified in source file.').trim(),
        file: filePath,
        line_start: lineStart,
        line_end: lineEnd,
        recommendation: String(raw.recommendation || 'Review and refactor the code according to project best practices.').trim(),
        suggested_fix: raw.suggested_fix || raw.suggestedFix ? String(raw.suggested_fix || raw.suggestedFix).trim() : null,
        // Optional enrichments
        snippet,
        cwe_id: raw.cwe_id || raw.cweId || null,
        owasp_category: raw.owasp_category || raw.owaspCategory || null,
      }

      normalized.push(item)
    }

    // Sort by severity rank (critical first, info last), then file, then line
    normalized.sort((a, b) => {
      const rankDiff = (SEVERITY_RANK[a.severity] || 99) - (SEVERITY_RANK[b.severity] || 99)
      if (rankDiff !== 0) return rankDiff
      if (a.file !== b.file) return a.file.localeCompare(b.file)
      return a.line_start - b.line_start
    })

    logger.info(`[FindingNormalizer] Normalized ${normalized.length} findings into canonical schema.`)
    return normalized
  }
}
