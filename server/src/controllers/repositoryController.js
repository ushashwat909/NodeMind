import { repositoryService } from '../services/repositoryService.js'
import { formatSuccess } from '../utils/responseFormatter.js'

/**
 * Validates a repository URL / identifier, fetches remote metadata and branch info
 * POST /api/repositories/validate
 */
export async function validateRepository(req, res, next) {
  try {
    const { url, provider } = req.body
    const result = await repositoryService.inspectAndValidateRepository(url, provider)
    return res.status(200).json(formatSuccess(result, 'Repository verified and inspected successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * Connects and imports a repository into the user's workspace
 * POST /api/repositories/connect
 */
export async function connectRepository(req, res, next) {
  try {
    const { url, fullName, provider, defaultBranch } = req.body
    const repo = await repositoryService.connectRepository(req.supabase, req.user, {
      url,
      fullName,
      provider,
      defaultBranch,
    })
    return res.status(201).json(formatSuccess(repo, 'Repository connected and imported successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * Lists user's connected repositories
 * GET /api/repositories
 */
export async function listRepositories(req, res, next) {
  try {
    const repos = await repositoryService.listUserRepositories(req.supabase)
    return res.status(200).json(formatSuccess(repos, 'User repositories retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * Retrieves a single repository by ID
 * GET /api/repositories/:id
 */
export async function getRepository(req, res, next) {
  try {
    const { id } = req.params
    const repo = await repositoryService.getRepositoryById(req.supabase, id)
    return res.status(200).json(formatSuccess(repo, 'Repository details retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * Fetches available branches for a connected repository
 * GET /api/repositories/:id/branches
 */
export async function getRepositoryBranches(req, res, next) {
  try {
    const { id } = req.params
    const branches = await repositoryService.getRepositoryBranches(req.supabase, id)
    return res.status(200).json(formatSuccess({ branches }, 'Branches retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * Fetches supported source files for a connected repository
 * GET /api/repositories/:id/tree
 */
export async function getRepositoryTree(req, res, next) {
  try {
    const { id } = req.params
    const { branch } = req.query
    const files = await repositoryService.getRepositoryTree(req.supabase, id, branch)
    return res.status(200).json(formatSuccess({ files, count: files.length }, 'File tree retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

/**
 * Synchronizes user's GitHub repositories and imports them into review system
 * POST /api/repositories/sync-github
 */
export async function syncGitHubRepositories(req, res, next) {
  try {
    const { token } = req.body || {}
    const result = await repositoryService.syncGitHubRepositories(req.supabase, req.user, token)
    return res.status(200).json(
      formatSuccess(
        result,
        `Successfully synchronized ${result.syncedCount} repositories from GitHub`
      )
    )
  } catch (err) {
    next(err)
  }
}

