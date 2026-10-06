import path from 'node:path'
import { logger } from '../../lib/logger.js'

export class FileRetriever {
  constructor(options = {}) {
    this.fileTimeoutMs = options.fileTimeoutMs || 8000 // 8s timeout per file
    this.maxFileSizeBytes = options.maxFileSizeBytes || 512 * 1024
    this.maxTotalBytes = options.maxTotalBytes || 5 * 1024 * 1024
  }

  /**
   * Helper to execute a promise with a timeout
   */
  async _withTimeout(promise, timeoutMs, errorMsg) {
    let timerId
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      clearTimeout(timerId)
    }
  }

  /**
   * Infers normalized language from file path
   */
  inferLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '')
    const map = {
      js: 'javascript',
      mjs: 'javascript',
      cjs: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      mts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      cc: 'cpp',
      c: 'c',
      h: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
      yaml: 'yaml',
      yml: 'yaml',
      json: 'json',
      dockerfile: 'dockerfile',
    }
    return map[ext] || ext || 'text'
  }

  /**
   * Retrieves content for eligible files with strict failed-file isolation.
   * A single unreadable or timed-out file NEVER halts the entire review.
   *
   * @param {object} gitProvider VCS provider
   * @param {string} repoFullName e.g. "owner/repo"
   * @param {Array<{ path: string }>} eligibleFiles
   * @param {string} ref Branch or commit SHA
   * @returns {Promise<{ retrievedFiles: Array<object>, failedFiles: Array<object>, totalBytes: number }>}
   */
  async retrieveFiles(gitProvider, repoFullName, eligibleFiles = [], ref = 'main') {
    const retrievedFiles = []
    const failedFiles = []
    let totalBytes = 0

    logger.info(`[FileRetriever] Starting safe retrieval for ${eligibleFiles.length} files from ${repoFullName}@${ref}...`)

    // Process files in bounded concurrent chunks (4 at a time) for high performance without saturating network/rate-limits
    const CONCURRENCY = 4
    for (let i = 0; i < eligibleFiles.length; i += CONCURRENCY) {
      if (totalBytes >= this.maxTotalBytes) {
        logger.warn(`[FileRetriever] Reached maximum review payload limit (${this.maxTotalBytes} bytes). Skipping remaining files.`)
        for (let j = i; j < eligibleFiles.length; j++) {
          failedFiles.push({
            path: eligibleFiles[j].path,
            error: 'Total review payload size quota exceeded',
            status: 'skipped',
          })
        }
        break
      }

      const chunk = eligibleFiles.slice(i, i + CONCURRENCY)
      await Promise.all(
        chunk.map(async (item) => {
          if (totalBytes >= this.maxTotalBytes) {
            failedFiles.push({
              path: item.path,
              error: 'Total review payload size quota exceeded',
              status: 'skipped',
            })
            return
          }

          try {
            // Enforce per-file timeout and isolated try/catch
            const fileData = await this._withTimeout(
              gitProvider.getFileContent(repoFullName, item.path, ref),
              this.fileTimeoutMs,
              `File retrieval timed out after ${this.fileTimeoutMs}ms`
            )

            const content = fileData?.content || ''
            const byteLength = Buffer.byteLength(content, 'utf8')

            // Guard against oversized returned content
            if (byteLength > this.maxFileSizeBytes) {
              logger.warn(`[FileRetriever] File ${item.path} content exceeds limit (${byteLength} > ${this.maxFileSizeBytes} bytes). Skipping.`)
              failedFiles.push({
                path: item.path,
                error: `File payload ${byteLength} bytes exceeds limit of ${this.maxFileSizeBytes} bytes`,
                status: 'skipped',
              })
              return
            }

            totalBytes += byteLength
            retrievedFiles.push({
              path: item.path,
              content,
              language: fileData?.language || this.inferLanguage(item.path),
              sizeBytes: byteLength,
              linesCount: content.split('\n').length,
              status: 'retrieved',
            })
          } catch (fileErr) {
            // FAILED-FILE ISOLATION: Log error, record failure, and proceed
            logger.warn(`[FileRetriever] Isolated failure reading file "${item.path}": ${fileErr.message}`)
            failedFiles.push({
              path: item.path,
              error: fileErr.message,
              status: 'failed',
            })
          }
        })
      )
    }

    logger.info(`[FileRetriever] Successfully retrieved ${retrievedFiles.length} files (${Math.round(totalBytes / 1024)} KB). ${failedFiles.length} failed/skipped.`)

    return {
      retrievedFiles,
      failedFiles,
      totalBytes,
    }
  }
}
