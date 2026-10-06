import { logger } from '../../lib/logger.js'

/**
 * FileCollector Stage
 * Discovers and collects repository file candidates from VCS providers or test fixtures.
 */
export class FileCollector {
  constructor(options = {}) {
    this.maxDiscoveredFiles = options.maxDiscoveredFiles || 1000
  }

  /**
   * Discovers all files in a repository at a given ref/branch
   * @param {object} gitProvider VCS provider (e.g. GitHubProvider)
   * @param {string} repoFullName e.g. "owner/repo"
   * @param {string} branch Branch or commit SHA
   * @returns {Promise<Array<{ path: string, size?: number, sha?: string, type?: string }>>}
   */
  async collectFiles(gitProvider, repoFullName, branch) {
    if (!gitProvider || typeof gitProvider.getFileTree !== 'function') {
      throw new Error('FileCollector requires a valid GitProvider instance.')
    }

    logger.info(`[FileCollector] Discovering repository tree for ${repoFullName}@${branch}...`)

    const tree = await gitProvider.getFileTree(repoFullName, branch)

    if (!Array.isArray(tree)) {
      logger.warn(`[FileCollector] Empty or invalid tree returned for ${repoFullName}`)
      return []
    }

    const discovered = tree
      .filter(item => item && item.path)
      .slice(0, this.maxDiscoveredFiles)
      .map(item => ({
        path: item.path.replace(/^\/+/, ''), // normalize leading slash
        size: typeof item.size === 'number' ? item.size : null,
        sha: item.sha || null,
        type: item.type || 'blob',
        extension: item.extension || null,
      }))

    logger.info(`[FileCollector] Discovered ${discovered.length} total entries from ${repoFullName}`)
    return discovered
  }
}
