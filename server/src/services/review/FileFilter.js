import path from 'node:path'
import { logger } from '../../lib/logger.js'

export const DEFAULT_FILTER_CONFIG = {
  maxFileSizeBytes: 512 * 1024, // 512 KB per file
  maxTotalReviewBytes: 5 * 1024 * 1024, // 5 MB total payload
  maxReviewFiles: 50, // max files to analyze per job
}

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.nuxt',
  'coverage',
  'vendor',
  'out',
  'tmp',
  'temp',
  '.cache',
  '.turbo',
  'bower_components',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  'storybook-static',
])

const IGNORED_GENERATED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
  'poetry.lock',
  'mix.lock',
  '.ds_store',
  'thumbs.db',
])

const UNSUPPORTED_EXTENSIONS = new Set([
  // Images & Media
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp', '.mp4', '.mp3', '.wav',
  // Binaries & Archives
  '.zip', '.tar', '.gz', '.7z', '.rar', '.pdf', '.exe', '.dll', '.so', '.dylib', '.wasm', '.class', '.pyc',
  // Fonts
  '.ttf', '.woff', '.woff2', '.eot', '.otf',
  // Sourcemaps
  '.map',
])

const SUPPORTED_SOURCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx',
  '.ts', '.mts', '.tsx',
  '.py', '.pyw',
  '.go',
  '.rs',
  '.java',
  '.c', '.h', '.cpp', '.hpp', '.cc',
  '.cs',
  '.php',
  '.rb',
  '.sql',
  '.sh', '.bash', '.zsh',
  '.json',
  '.yaml', '.yml',
  '.toml',
  '.env.example',
  '.dockerfile',
])

/**
 * FileFilter Stage
 * Enforces security boundaries, resource quotas, and ignores non-source/generated assets.
 */
export class FileFilter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config }
  }

  /**
   * Evaluates whether a file path falls into an ignored directory
   * @param {string} filePath
   * @returns {boolean}
   */
  isIgnoredDirectory(filePath) {
    const parts = filePath.toLowerCase().split(/[\\/]/)
    return parts.some(part => IGNORED_DIRECTORIES.has(part))
  }

  /**
   * Evaluates whether a file is a generated asset or lockfile
   * @param {string} filePath
   * @returns {boolean}
   */
  isGeneratedFile(filePath) {
    const base = path.basename(filePath).toLowerCase()
    if (IGNORED_GENERATED_FILES.has(base)) return true
    if (base.endsWith('.min.js') || base.endsWith('.min.css')) return true
    return false
  }

  /**
   * Evaluates whether a file extension is supported for code review
   * @param {string} filePath
   * @returns {boolean}
   */
  isSupportedSource(filePath) {
    const base = path.basename(filePath).toLowerCase()
    if (base === 'dockerfile' || base === 'makefile') return true

    const ext = path.extname(filePath).toLowerCase()
    if (!ext) return false
    if (UNSUPPORTED_EXTENSIONS.has(ext)) return false
    return SUPPORTED_SOURCE_EXTENSIONS.has(ext)
  }

  /**
   * Filters candidate files according to security and performance rules
   * @param {Array<{ path: string, size?: number }>} files
   * @returns {{ eligible: Array<object>, skipped: Array<object>, metrics: object }}
   */
  filterFiles(files = []) {
    const eligible = []
    const skipped = []
    let accumulatedBytes = 0

    for (const file of files) {
      const normalizedPath = file.path.replace(/^\/+/, '')

      // 1. Directory Exclusion
      if (this.isIgnoredDirectory(normalizedPath)) {
        skipped.push({ path: normalizedPath, reason: 'ignored_directory' })
        continue
      }

      // 2. Generated & Lockfile Exclusion
      if (this.isGeneratedFile(normalizedPath)) {
        skipped.push({ path: normalizedPath, reason: 'ignored_generated' })
        continue
      }

      // 3. Unsupported / Binary File Types
      if (!this.isSupportedSource(normalizedPath)) {
        skipped.push({ path: normalizedPath, reason: 'unsupported_file_type' })
        continue
      }

      // 4. File Size Safeguard
      if (typeof file.size === 'number' && file.size > this.config.maxFileSizeBytes) {
        skipped.push({
          path: normalizedPath,
          reason: 'oversized_file',
          size: file.size,
          limit: this.config.maxFileSizeBytes,
        })
        continue
      }

      // 5. Total Review Payload Safeguard
      const estimatedSize = typeof file.size === 'number' ? file.size : 10 * 1024 // fallback estimate 10KB
      if (accumulatedBytes + estimatedSize > this.config.maxTotalReviewBytes) {
        skipped.push({
          path: normalizedPath,
          reason: 'total_review_size_exceeded',
          accumulatedBytes,
          limit: this.config.maxTotalReviewBytes,
        })
        continue
      }

      // 6. Max Files Quota
      if (eligible.length >= this.config.maxReviewFiles) {
        skipped.push({
          path: normalizedPath,
          reason: 'max_review_files_quota_reached',
          limit: this.config.maxReviewFiles,
        })
        continue
      }

      accumulatedBytes += estimatedSize
      eligible.push(file)
    }

    logger.info(`[FileFilter] Filtered ${files.length} candidates: ${eligible.length} eligible, ${skipped.length} skipped (${Math.round(accumulatedBytes / 1024)} KB payload)`)

    return {
      eligible,
      skipped,
      metrics: {
        totalDiscovered: files.length,
        eligibleCount: eligible.length,
        skippedCount: skipped.length,
        accumulatedBytes,
      },
    }
  }
}
