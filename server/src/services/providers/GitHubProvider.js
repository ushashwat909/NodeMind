import { GitProvider } from './GitProvider.js'
import { BadRequestError, NotFoundError } from '../../utils/errors.js'
import { logger } from '../../lib/logger.js'

const GITHUB_API_BASE = 'https://api.github.com'
const MAX_SCAN_FILES = 200
const MAX_FILE_SIZE_BYTES = 512 * 1024 // 500 KB limit to prevent oversized payloads

export class GitHubProvider extends GitProvider {
  providerName = 'github'

  /**
   * Safely parses and validates GitHub repository URLs, preventing SSRF and injection
   * @param {string} inputUrl
   * @returns {{ owner: string, repo: string, fullName: string, htmlUrl: string, cloneUrl: string }}
   */
  parseRepositoryUrl(inputUrl) {
    if (!inputUrl || typeof inputUrl !== 'string') {
      throw new BadRequestError('Repository URL or identifier must be a non-empty string.')
    }

    const trimmed = inputUrl.trim()

    // Payload length limit to prevent buffer abuse
    if (trimmed.length > 500) {
      throw new BadRequestError('Repository URL exceeds maximum allowed length.')
    }

    // SSRF Prevention: disallow userinfo trick (@)
    if (trimmed.includes('@')) {
      throw new BadRequestError('Repository URL contains invalid credentials or characters.')
    }

    let rawPath = ''

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      let parsedUrl
      try {
        parsedUrl = new URL(trimmed)
      } catch {
        throw new BadRequestError('Malformed repository URL syntax.')
      }

      // Enforce HTTPS
      if (parsedUrl.protocol !== 'https:') {
        throw new BadRequestError('Only secure HTTPS GitHub URLs are supported.')
      }

      // Strict Hostname verification (No arbitrary domains, no internal IPs, no subdomains)
      const allowedHosts = ['github.com', 'www.github.com']
      if (!allowedHosts.includes(parsedUrl.hostname.toLowerCase())) {
        throw new BadRequestError('Invalid repository host. Only github.com repositories are supported.')
      }

      // Disallow non-standard ports
      if (parsedUrl.port && parsedUrl.port !== '443') {
        throw new BadRequestError('Invalid port specified for GitHub repository.')
      }

      rawPath = parsedUrl.pathname
    } else {
      // Shorthand format: "owner/repo" or "github.com/owner/repo"
      rawPath = trimmed.replace(/^github\.com\//i, '')
    }

    // Normalize and clean path segments
    const segments = rawPath
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean)

    if (segments.length < 2) {
      throw new BadRequestError('Repository identifier must include both owner and repository name (e.g. "facebook/react").')
    }

    const rawOwner = segments[0]
    let rawRepo = segments[1]

    // Strip trailing .git if present
    rawRepo = rawRepo.replace(/\.git$/i, '')

    // Strict GitHub naming regex:
    // Owner: 1-39 alphanumeric with hyphens, not starting/ending with hyphen
    const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
    // Repo: 1-100 alphanumeric with hyphens, underscores, dots
    const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/

    if (!ownerRegex.test(rawOwner)) {
      throw new BadRequestError(`Invalid GitHub owner format: "${rawOwner}".`)
    }

    if (!repoRegex.test(rawRepo) || rawRepo === '.' || rawRepo === '..') {
      throw new BadRequestError(`Invalid GitHub repository name format: "${rawRepo}".`)
    }

    const fullName = `${rawOwner}/${rawRepo}`

    return {
      owner: rawOwner,
      repo: rawRepo,
      fullName,
      htmlUrl: `https://github.com/${fullName}`,
      cloneUrl: `https://github.com/${fullName}.git`,
    }
  }

  /**
   * Internal authenticated / unauthenticated GitHub API requester
   */
  async _request(endpoint, credentials = null, options = {}) {
    if (!endpoint || typeof endpoint !== 'string' || endpoint.includes('..') || endpoint.includes('\0')) {
      throw new BadRequestError('Invalid or potentially unsafe GitHub API endpoint path.')
    }

    const cleanEndpoint = endpoint.replace(/^\/+/, '')
    const url = `${GITHUB_API_BASE}/${cleanEndpoint}`
    const headers = {
      'User-Agent': 'CodeReviewAgent-Engine/1.0',
      Accept: 'application/vnd.github.v3+json',
      ...options.headers,
    }

    // Attach private repo credential if provided (PAT, OAuth token, or GitHub App token)
    const token = credentials?.token || process.env.GITHUB_TOKEN
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const timeoutMs = options.timeoutMs || 12000
    const signal = options.signal || AbortSignal.timeout(timeoutMs)

    let response
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal,
        redirect: 'error', // Prevent SSRF redirect hijacking
      })
    } catch (fetchErr) {
      if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
        throw new BadRequestError(`GitHub API request timed out (${timeoutMs}ms). Check connection and repository permissions.`)
      }
      throw new BadRequestError(`Failed to reach GitHub API: ${fetchErr.message}`)
    }

    // Handle GitHub Rate Limiting
    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get('x-ratelimit-remaining')
      if (remaining === '0') {
        const resetTime = response.headers.get('x-ratelimit-reset')
        const waitMinutes = resetTime ? Math.ceil((Number(resetTime) * 1000 - Date.now()) / 60000) : 10
        throw new BadRequestError(
          `GitHub API rate limit exceeded. Please wait ${waitMinutes} minutes or configure a GitHub access token.`
        )
      }
    }

    if (response.status === 404) {
      throw new NotFoundError(`Repository or resource not found on GitHub: ${endpoint}`)
    }

    if (!response.ok) {
      const errBody = await response.text()
      logger.warn(`GitHub API ${response.status} on ${endpoint}: ${errBody.slice(0, 150)}`)
      throw new BadRequestError(`GitHub API error (${response.status}): ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Validates if repository exists and returns accessibility state
   */
  async validateRepository(fullName, credentials = null) {
    try {
      const data = await this._request(`repos/${fullName}`, credentials)
      return {
        accessible: true,
        isPrivate: data.private || false,
        name: data.name,
        fullName: data.full_name,
        defaultBranch: data.default_branch || 'main',
        description: data.description || '',
      }
    } catch (err) {
      if (err instanceof NotFoundError) {
        return {
          accessible: false,
          isPrivate: false,
          error: 'Repository does not exist or is private without authentication.',
        }
      }
      throw err
    }
  }

  /**
   * Fetches repository metadata from GitHub
   */
  async getRepositoryMetadata(fullName, credentials = null) {
    const data = await this._request(`repos/${fullName}`, credentials)

    return {
      repoIdentifier: `github:${data.id}`,
      name: data.name,
      fullName: data.full_name,
      owner: data.owner?.login || fullName.split('/')[0],
      ownerAvatarUrl: data.owner?.avatar_url || null,
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      defaultBranch: data.default_branch || 'main',
      isPrivate: data.private || false,
      language: data.language || 'Unknown',
      description: data.description || '',
      starsCount: data.stargazers_count || 0,
      forksCount: data.forks_count || 0,
      openIssuesCount: data.open_issues_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  /**
   * Fetches active branches
   */
  async getBranches(fullName, credentials = null) {
    const data = await this._request(`repos/${fullName}/branches?per_page=100`, credentials)
    return data.map((b) => b.name)
  }

  /**
   * Fetches latest commit on a branch
   */
  async getLatestCommit(fullName, branch, credentials = null) {
    const data = await this._request(`repos/${fullName}/commits/${encodeURIComponent(branch)}`, credentials)

    return {
      sha: data.sha,
      shortSha: data.sha.slice(0, 7),
      message: data.commit?.message?.split('\n')[0] || 'No commit message',
      author: data.commit?.author?.name || data.author?.login || 'Unknown',
      date: data.commit?.author?.date || null,
    }
  }

  /**
   * Fetches repository git tree and filters to supported source code files
   */
  async getFileTree(fullName, ref = 'main', credentials = null) {
    const data = await this._request(`repos/${fullName}/git/trees/${encodeURIComponent(ref)}?recursive=1`, credentials)

    if (!data.tree || !Array.isArray(data.tree)) {
      return []
    }

    const sourceFiles = []

    for (const item of data.tree) {
      if (item.type !== 'blob') continue

      // Security: Validate against path traversal
      if (
        !item.path ||
        item.path.includes('..') ||
        item.path.startsWith('/') ||
        item.path.includes('\0')
      ) {
        continue
      }

      // Check if file is an ignored or unsupported type
      if (!this.isSupportedSourceFile(item.path)) {
        continue
      }

      // Oversized payload protection: skip files > 500KB
      if (item.size && item.size > MAX_FILE_SIZE_BYTES) {
        continue
      }

      const extension = item.path.includes('.') ? item.path.split('.').pop().toLowerCase() : ''

      sourceFiles.push({
        path: item.path,
        size: item.size || 0,
        sha: item.sha,
        extension,
      })

      // Limit max files analyzed per review to prevent memory/time exhaustion
      if (sourceFiles.length >= MAX_SCAN_FILES) {
        break
      }
    }

    return sourceFiles
  }

  /**
   * Retrieves content of a single source file safely
   */
  async getFileContent(fullName, path, ref = 'main', credentials = null) {
    // Security: Validate path against traversal
    if (
      !path ||
      typeof path !== 'string' ||
      path.includes('..') ||
      path.startsWith('/') ||
      path.includes('\0')
    ) {
      throw new BadRequestError('Invalid file path for retrieval.')
    }

    const cleanPath = path.replace(/^\/+/, '')
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/')

    const data = await this._request(`repos/${fullName}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`, credentials)

    if (data.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError(`File size (${data.size} bytes) exceeds maximum analyzable limit (500KB).`)
    }

    let content = ''
    if (data.encoding === 'base64' && data.content) {
      content = Buffer.from(data.content, 'base64').toString('utf8')
    } else if (typeof data.content === 'string') {
      content = data.content
    }

    return {
      path: cleanPath,
      content,
      size: data.size,
      sha: data.sha,
    }
  }

  /**
   * Fetches repositories accessible to the authenticated GitHub user
   * @param {Object} credentials - { token: string }
   * @returns {Promise<Array>} List of normalized repository objects
   */
  async getUserRepositories(credentials = null) {
    const data = await this._request('user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member', credentials)

    if (!Array.isArray(data)) {
      return []
    }

    return data.map((repo) => ({
      repoIdentifier: `github:${repo.id}`,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner?.login || repo.full_name.split('/')[0],
      ownerAvatarUrl: repo.owner?.avatar_url || null,
      cloneUrl: repo.clone_url,
      htmlUrl: repo.html_url,
      defaultBranch: repo.default_branch || 'main',
      isPrivate: repo.private || false,
      language: repo.language || 'Unknown',
      description: repo.description || '',
      starsCount: repo.stargazers_count || 0,
      forksCount: repo.forks_count || 0,
      openIssuesCount: repo.open_issues_count || 0,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
    }))
  }

  /**
   * Fetches authenticated GitHub user profile
   * @param {Object} credentials - { token: string }
   */
  async getAuthenticatedUser(credentials = null) {
    return await this._request('user', credentials)
  }
}

export const gitHubProvider = new GitHubProvider()
