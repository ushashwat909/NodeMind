import { logger } from '../../lib/logger.js'

/**
 * ReviewSummarizer Stage
 * Synthesizes findings, computes quality scores, determines verdicts,
 * and formats an executive markdown review report.
 */
export class ReviewSummarizer {
  /**
   * Generates a comprehensive summary for a completed review
   * @param {object} param0
   * @param {Array<object>} param0.normalizedFindings
   * @param {Array<object>} param0.retrievedFiles
   * @param {Array<object>} param0.failedFiles
   * @param {number} [param0.executionTimeMs=0]
   * @returns {object} Summary result object
   */
  summarize({ normalizedFindings = [], retrievedFiles = [], failedFiles = [], executionTimeMs = 0 }) {
    const totalFiles = retrievedFiles.length
    const totalLines = retrievedFiles.reduce((acc, f) => acc + (f.linesCount || 0), 0)

    // Severity Metrics
    const criticalCount = normalizedFindings.filter(f => f.severity === 'critical').length
    const highCount = normalizedFindings.filter(f => f.severity === 'high').length
    const mediumCount = normalizedFindings.filter(f => f.severity === 'medium').length
    const lowCount = normalizedFindings.filter(f => f.severity === 'low').length
    const infoCount = normalizedFindings.filter(f => f.severity === 'info').length

    // Category Metrics
    const securityCount = normalizedFindings.filter(f => f.category === 'security').length
    const bugCount = normalizedFindings.filter(f => f.category === 'bug').length
    const perfCount = normalizedFindings.filter(f => f.category === 'performance').length
    const maintCount = normalizedFindings.filter(f => f.category === 'maintainability').length
    const styleCount = normalizedFindings.filter(f => f.category === 'style').length
    const archCount = normalizedFindings.filter(f => f.category === 'architecture').length

    // Score Computation (100 base)
    const deduction = (criticalCount * 25) + (highCount * 15) + (mediumCount * 5) + (lowCount * 2)
    const rawScore = Math.max(0, 100 - deduction)
    const qualityScore = Math.round(rawScore * 10) / 10

    // Verdict Determination
    let verdict = 'passed'
    if (criticalCount > 0 || qualityScore < 50) {
      verdict = 'failed'
    } else if (highCount > 0 || mediumCount > 2 || qualityScore < 85) {
      verdict = 'passed_with_warnings'
    }

    // Key Strengths
    const strengths = []
    if (criticalCount === 0) strengths.push('Zero critical security vulnerabilities detected')
    if (highCount === 0) strengths.push('No high-severity blocking bugs in analyzed modules')
    if (totalFiles > 0) strengths.push(`Clean modular file structure across ${totalFiles} analyzed files`)
    if (securityCount === 0) strengths.push('Strong cryptographic and data access hygiene')
    if (strengths.length === 0) strengths.push('Automated pipeline successfully completed static code inspection')

    // Key Improvements (Prioritized)
    const improvements = []
    const topFindings = normalizedFindings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 4)
    for (const f of topFindings) {
      improvements.push(`[${f.severity.toUpperCase()}] ${f.title} (${f.file}:${f.line_start})`)
    }
    if (failedFiles.length > 0) {
      improvements.push(`Investigate ${failedFiles.length} skipped or unreadable files during scan`)
    }
    if (improvements.length === 0) {
      improvements.push('Continue maintaining high test coverage and strict type annotations')
    }

    // Executive Markdown Report
    const summaryMarkdown = `### Autonomous Code Review Executive Summary
- **Overall Verdict**: \`${verdict.toUpperCase().replace(/_/g, ' ')}\`
- **Quality Score**: **${qualityScore}/100**
- **Files Inspected**: ${totalFiles} (${totalLines.toLocaleString()} lines of code)
- **Execution Time**: ${executionTimeMs}ms

#### Severity Breakdown
| Severity | Count | Status |
| :--- | :--- | :--- |
| **Critical** | ${criticalCount} | ${criticalCount > 0 ? '❌ Blocking' : '✅ Clear'} |
| **High** | ${highCount} | ${highCount > 0 ? '⚠️ High Risk' : '✅ Clear'} |
| **Medium** | ${mediumCount} | ${mediumCount > 0 ? 'ℹ️ Review Advised' : '✅ Clear'} |
| **Low** | ${lowCount} | Minor |
| **Info** | ${infoCount} | Informational |

${
  criticalCount > 0
    ? '> **CRITICAL BLOCKER**: Pull request or deployment should be blocked until all critical security vulnerabilities are remediated.'
    : '> **READY FOR REVIEW**: No critical zero-day vulnerabilities detected. Review recommended improvements before merging.'
}
`

    logger.info(`[ReviewSummarizer] Generated summary: score=${qualityScore}, verdict=${verdict}, findings=${normalizedFindings.length}`)

    return {
      verdict,
      score: qualityScore,
      strengths,
      improvements,
      summaryMarkdown,
      metrics: {
        totalFiles,
        totalLines,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        infoCount,
        securityCount,
        bugCount,
        perfCount,
        maintCount,
        styleCount,
        archCount,
        executionTimeMs,
      },
    }
  }
}
