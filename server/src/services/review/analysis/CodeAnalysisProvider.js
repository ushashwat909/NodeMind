/**
 * Abstract Base Class for Code Analysis Providers
 * Implementations (AIAnalysisProvider, RuleBasedAnalysisProvider, MockAnalysisProvider)
 * inherit from this to ensure consistent interface and replaceable analysis engines.
 */
export class CodeAnalysisProvider {
  /**
   * @param {string} providerName Unique identifier for the provider (e.g., 'ai', 'rule_based', 'mock')
   * @param {object} [options={}] Configuration options for the analysis engine
   */
  constructor(providerName, options = {}) {
    if (new.target === CodeAnalysisProvider) {
      throw new TypeError('Cannot construct CodeAnalysisProvider instances directly. Subclass must be used.')
    }
    this.providerName = providerName
    this.options = options
  }

  /**
   * Analyzes an individual source code file.
   * @param {{ path: string, content: string, language: string, metadata?: object }} fileData
   * @returns {Promise<Array<object>>} Raw finding objects
   */
  async analyzeFile(fileData) {
    throw new Error(`analyzeFile() must be implemented by subclass ${this.constructor.name}`)
  }

  /**
   * Analyzes a collection of repository files.
   * Default implementation loops through files with isolated error boundaries.
   * @param {{ files: Array<{ path: string, content: string, language: string }>, metadata?: object }} param0
   * @returns {Promise<Array<object>>} Aggregated raw finding objects
   */
  async analyzeRepository({ files, metadata = {} }) {
    const findings = []

    for (const file of files) {
      try {
        const fileFindings = await this.analyzeFile({
          path: file.path,
          content: file.content,
          language: file.language,
          metadata,
        })
        if (Array.isArray(fileFindings)) {
          findings.push(...fileFindings)
        }
      } catch (err) {
        // Individual file analysis error must not crash the whole repository review
        findings.push({
          filePath: file.path,
          severity: 'info',
          category: 'maintainability',
          title: `Analysis Note: Partial file analysis on ${file.path}`,
          description: `Analysis provider encountered a non-fatal warning: ${err.message}`,
          lineStart: 1,
          lineEnd: 1,
          recommendation: 'Verify file syntax and formatting.',
        })
      }
    }

    return findings
  }
}
