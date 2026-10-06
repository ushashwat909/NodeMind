import { reviewService } from '../services/review/index.js'
import { formatSuccess } from '../utils/responseFormatter.js'

export async function createReviewJob(req, res, next) {
  try {
    const { repositoryId, branch, commitSha, triggerType, pullRequestNumber } = req.body

    const result = await reviewService.createReviewJob(req.supabase, req.user, {
      repositoryId,
      branch,
      commitSha,
      triggerType,
      pullRequestNumber,
    })

    return res.status(201).json(formatSuccess(result, 'Review job executed and persisted successfully'))
  } catch (err) {
    next(err)
  }
}

export async function listReviewJobs(req, res, next) {
  try {
    const { repositoryId, status, limit, page } = req.query
    const result = await reviewService.listUserReviews(req.supabase, {
      repositoryId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    })

    return res.status(200).json(formatSuccess(result, 'Review jobs retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

export async function getReviewHistory(req, res, next) {
  try {
    const { repositoryId, eventType, limit, page } = req.query
    const result = await reviewService.getReviewHistory(req.supabase, {
      repositoryId,
      eventType,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    })

    return res.status(200).json(formatSuccess(result, 'Review history retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

export async function getReviewJobById(req, res, next) {
  try {
    const { id } = req.params
    const job = await reviewService.getReviewById(req.supabase, id)
    return res.status(200).json(formatSuccess(job, 'Review job retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

export async function getReviewFindings(req, res, next) {
  try {
    const { id } = req.params
    const { severity, status } = req.query
    const findings = await reviewService.getReviewFindings(req.supabase, id, {
      severity,
      status,
    })

    return res.status(200).json(formatSuccess(findings, 'Review findings retrieved successfully'))
  } catch (err) {
    next(err)
  }
}

export async function updateFindingStatus(req, res, next) {
  try {
    const { findingId } = req.params
    const { status, dismissedReason } = req.body

    const updated = await reviewService.updateFindingStatus(req.supabase, findingId, {
      status,
      dismissedReason,
    })

    return res.status(200).json(formatSuccess(updated, 'Finding status updated successfully'))
  } catch (err) {
    next(err)
  }
}
