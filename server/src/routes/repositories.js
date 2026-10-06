import { Router } from 'express'
import {
  validateRepository,
  connectRepository,
  syncGitHubRepositories,
  listRepositories,
  getRepository,
  getRepositoryBranches,
  getRepositoryTree,
} from '../controllers/repositoryController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validator.js'

const router = Router()

// All repository routes require verified user session
router.use(requireAuth)

/**
 * POST /api/repositories/sync-github
 * Synchronizes repositories from GitHub for the authenticated user
 */
router.post('/sync-github', syncGitHubRepositories)

/**
 * POST /api/repositories/validate
 * Validates a repository URL / identifier, checks remote existence, returns branches & metadata
 */
router.post(
  '/validate',
  validate({
    body: {
      url: { required: true, type: 'string', minLength: 3, maxLength: 500 },
      provider: { type: 'string', enum: ['github', 'gitlab', 'bitbucket', 'custom'] },
    },
  }),
  validateRepository
)


/**
 * POST /api/repositories/connect
 * Imports and connects a repository into user's workspace
 */
router.post(
  '/connect',
  (req, res, next) => {
    if (req.body?.url && !req.body?.fullName) {
      req.body.fullName = req.body.url
    }
    next()
  },
  validate({
    body: {
      fullName: { required: true, type: 'string', minLength: 3, maxLength: 500 },
      provider: { type: 'string', enum: ['github', 'gitlab', 'bitbucket', 'custom'] },
      defaultBranch: { type: 'string', minLength: 1, maxLength: 100 },
    },
  }),
  connectRepository
)

/**
 * GET /api/repositories
 * Lists tracked repositories for the current user
 */
router.get('/', listRepositories)

/**
 * GET /api/repositories/:id
 * Fetches single repository
 */
router.get(
  '/:id',
  validate({
    params: {
      id: { required: true, type: 'string' },
    },
  }),
  getRepository
)

/**
 * GET /api/repositories/:id/branches
 * Fetches branch list for a repository
 */
router.get(
  '/:id/branches',
  validate({
    params: {
      id: { required: true, type: 'string' },
    },
  }),
  getRepositoryBranches
)

/**
 * GET /api/repositories/:id/tree
 * Fetches supported source files for a repository ref
 */
router.get(
  '/:id/tree',
  validate({
    params: {
      id: { required: true, type: 'string' },
    },
  }),
  getRepositoryTree
)

export default router
