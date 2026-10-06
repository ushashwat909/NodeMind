/**
 * Abstract Base Class for Git VCS Providers (GitHub, GitLab, Bitbucket, etc.)
 */
export class GitProvider {
  /**
   * Provider identifier (e.g. 'github', 'gitlab')
   * @type {string}
   */
  providerName = 'unknown'

  /**
   * Parses and validates a user-provided repository URL or identifier.
   * Must return sanitized { owner, repo, fullName, htmlUrl, cloneUrl }
   * Throws BadRequestError if URL is malformed or violates security rules (SSRF).
   * @param {string} inputUrl
   * @returns {{ owner: string, repo: string, fullName: string, htmlUrl: string, cloneUrl: string }}
   */
  parseRepositoryUrl(inputUrl) {
    throw new Error('Method parseRepositoryUrl() must be implemented by subclass')
  }

  /**
   * Validates if repository exists and is accessible.
   * @param {string} fullName
   * @param {object} [credentials]
   * @returns {Promise<{ accessible: boolean, isPrivate: boolean, error?: string }>}
   */
  async validateRepository(fullName, credentials = null) {
    throw new Error('Method validateRepository() must be implemented by subclass')
  }

  /**
   * Fetches full metadata for a repository.
   * @param {string} fullName
   * @param {object} [credentials]
   * @returns {Promise<object>}
   */
  async getRepositoryMetadata(fullName, credentials = null) {
    throw new Error('Method getRepositoryMetadata() must be implemented by subclass')
  }

  /**
   * Fetches active branches for the repository.
   * @param {string} fullName
   * @param {object} [credentials]
   * @returns {Promise<Array<string>>}
   */
  async getBranches(fullName, credentials = null) {
    throw new Error('Method getBranches() must be implemented by subclass')
  }

  /**
   * Fetches latest commit on a specific branch.
   * @param {string} fullName
   * @param {string} branch
   * @param {object} [credentials]
   * @returns {Promise<object>}
   */
  async getLatestCommit(fullName, branch, credentials = null) {
    throw new Error('Method getLatestCommit() must be implemented by subclass')
  }

  /**
   * Fetches the supported source file tree for a ref.
   * @param {string} fullName
   * @param {string} ref
   * @param {object} [credentials]
   * @returns {Promise<Array<{ path: string, size: number, type: string, sha: string }>>}
   */
  async getFileTree(fullName, ref, credentials = null) {
    throw new Error('Method getFileTree() must be implemented by subclass')
  }

  /**
   * Retrieves content of a single file.
   * @param {string} fullName
   * @param {string} path
   * @param {string} ref
   * @param {object} [credentials]
   * @returns {Promise<{ content: string, encoding: string, size: number }>}
   */
  async getFileContent(fullName, path, ref, credentials = null) {
    throw new Error('Method getFileContent() must be implemented by subclass')
  }

  /**
   * Checks if file should be ignored (vendor, build, lockfile, media, binary)
   * @param {string} filePath
   * @returns {boolean}
   */
  isIgnoredFile(filePath) {
    const normalized = filePath.replace(/\\/g, '/').toLowerCase()

    // Ignored directories
    const ignoredDirs = [
      'node_modules/',
      'vendor/',
      '.git/',
      '.github/',
      'dist/',
      'build/',
      'out/',
      '.next/',
      '.nuxt/',
      'target/',
      'bin/',
      'obj/',
      'coverage/',
      '.nyc_output/',
      '.cache/',
      '__pycache__/',
      '.pytest_cache/',
      '.venv/',
      'venv/',
      'env/',
    ]
    if (ignoredDirs.some((dir) => normalized.includes(dir) || normalized.startsWith(dir))) {
      return true
    }

    // Ignored specific files
    const ignoredFiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'npm-shrinkwrap.json',
      'composer.lock',
      'cargo.lock',
      'gemfile.lock',
      'go.sum',
      'poetry.lock',
      '.ds_store',
      'thumbs.db',
    ]
    const fileName = normalized.split('/').pop()
    if (ignoredFiles.includes(fileName)) {
      return true
    }

    // Minified or bundle files
    if (fileName.endsWith('.min.js') || fileName.endsWith('.min.css') || fileName.endsWith('.bundle.js') || fileName.endsWith('.bundle.css')) {
      return true
    }

    // Source maps
    if (fileName.endsWith('.map')) {
      return true
    }

    // Binary / Media / Fonts / Archives
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
      '.mp4', '.webm', '.ogg', '.mp3', '.wav',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.jar', '.war',
      '.wasm', '.pyc', '.pyo', '.pyd', '.class',
    ]
    if (binaryExtensions.some((ext) => fileName.endsWith(ext))) {
      return true
    }

    return false
  }

  /**
   * Checks if file is a supported source code file for static/AST analysis
   * @param {string} filePath
   * @returns {boolean}
   */
  isSupportedSourceFile(filePath) {
    if (this.isIgnoredFile(filePath)) {
      return false
    }

    const normalized = filePath.replace(/\\/g, '/').toLowerCase()
    const fileName = normalized.split('/').pop()

    // Config / Infrastructure files
    const specialFiles = [
      'dockerfile',
      '.dockerignore',
      'docker-compose.yml',
      'docker-compose.yaml',
      '.env.example',
    ]
    if (specialFiles.includes(fileName)) {
      return true
    }

    // Supported source code extensions
    const supportedExtensions = [
      '.js', '.jsx', '.mjs', '.cjs',
      '.ts', '.tsx', '.mts', '.cts',
      '.py',
      '.go',
      '.rs',
      '.java', '.kt',
      '.c', '.h', '.cpp', '.hpp', '.cc',
      '.cs',
      '.rb',
      '.php',
      '.sh', '.bash',
      '.sql',
      '.json',
      '.yaml', '.yml',
      '.html', '.css',
    ]

    return supportedExtensions.some((ext) => fileName.endsWith(ext))
  }
}
