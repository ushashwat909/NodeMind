import { Router } from 'express'
import {
  createReviewJob,
  listReviewJobs,
  getReviewHistory,
  getReviewJobById,
  getReviewFindings,
  updateFindingStatus,
} from '../controllers/reviewController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validator.js'
import { reviewTriggerRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// All review routes require authenticated user session
router.use(requireAuth)

/**
 * POST /api/reviews
 * Triggers and executes a new review job
 */
router.post(
  '/',
  reviewTriggerRateLimiter,
  validate({
    body: {
      repositoryId: { required: true, type: 'string' },
      branch: { type: 'string' },
      commitSha: { type: 'string' },
      triggerType: { type: 'string', enum: ['manual', 'pull_request', 'push', 'scheduled', 'api'] },
      pullRequestNumber: { type: 'integer', min: 1 },
    },
  }),
  createReviewJob
)

/**
 * GET /api/reviews
 * Lists review jobs for the user
 */
router.get('/', listReviewJobs)

/**
 * GET /api/reviews/history
 * Retrieves audit history log events with pagination and filtering
 */
router.get('/history', getReviewHistory)

/**
 * GET /api/reviews/:id
 * Retrieves review job status and result summary
 */
router.get(
  '/:id',
  validate({
    params: {
      id: { required: true, type: 'string' },
    },
  }),
  getReviewJobById
)

/**
 * GET /api/reviews/:id/findings
 * Retrieves code findings for a review job
 */
router.get(
  '/:id/findings',
  validate({
    params: {
      id: { required: true, type: 'string' },
    },
    query: {
      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
      status: { type: 'string', enum: ['open', 'resolved', 'dismissed', 'false_positive', 'ignored'] },
    },
  }),
  getReviewFindings
)

/**
 * PATCH /api/reviews/findings/:findingId
 * Updates finding status (resolved, dismissed, etc.)
 */
router.patch(
  '/findings/:findingId',
  validate({
    params: {
      findingId: { required: true, type: 'string' },
    },
    body: {
      status: { required: true, type: 'string', enum: ['open', 'resolved', 'dismissed', 'false_positive', 'ignored'] },
      dismissedReason: { type: 'string', maxLength: 500 },
    },
  }),
  updateFindingStatus
)

export default router
