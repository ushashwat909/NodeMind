import { logger } from '../../lib/logger.js'
import { getAnalysisProvider } from './analysis/index.js'

/**
 * CodeAnalyzer Stage
 * Orchestrates code analysis through replaceable CodeAnalysisProviders.
 */
export class CodeAnalyzer {
  /**
   * @param {object} [options={}]
   * @param {import('./analysis/CodeAnalysisProvider.js').CodeAnalysisProvider} [options.provider]
   * @param {string} [options.providerName]
   */
  constructor(options = {}) {
    this.provider = options.provider || getAnalysisProvider(options.providerName)
    this.analysisTimeoutMs = options.analysisTimeoutMs || 30000
  }

  /**
   * Analyzes an array of retrieved files with error isolation
   * @param {Array<{ path: string, content: string, language: string }>} files
   * @param {object} [metadata={}]
   * @returns {Promise<{ rawFindings: Array<object>, analyzedCount: number, errorCount: number }>}
   */
  async analyzeFiles(files = [], metadata = {}) {
    logger.info(`[CodeAnalyzer] Executing analysis with provider "${this.provider.providerName}" on ${files.length} files...`)

    const rawFindings = []
    let analyzedCount = 0
    let errorCount = 0

    for (const file of files) {
      try {
        const findings = await this.provider.analyzeFile({
          path: file.path,
          content: file.content,
          language: file.language,
          metadata,
        })

        if (Array.isArray(findings)) {
          for (const finding of findings) {
            rawFindings.push({
              ...finding,
              filePath: finding.filePath || finding.file || file.path,
            })
          }
        }
        analyzedCount++
      } catch (err) {
        // Failed file analysis isolation: log and continue
        logger.warn(`[CodeAnalyzer] Isolated analysis failure for ${file.path}: ${err.message}`)
        errorCount++
      }
    }

    logger.info(`[CodeAnalyzer] Analysis complete: ${analyzedCount} files analyzed, ${rawFindings.length} raw findings discovered, ${errorCount} file warnings.`)

    return {
      rawFindings,
      analyzedCount,
      errorCount,
    }
  }
}
