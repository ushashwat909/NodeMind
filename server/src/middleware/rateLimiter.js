import { RateLimitExceededError } from '../utils/errors.js'
import config from '../config/index.js'

class MemoryStore {
  constructor() {
    this.hits = new Map()
    // Periodic cleanup of stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.hits.entries()) {
      if (record.resetAt <= now) {
        this.hits.delete(key)
      }
    }
  }

  increment(key, windowMs) {
    const now = Date.now()
    const record = this.hits.get(key)

    if (!record || record.resetAt <= now) {
      const newRecord = {
        count: 1,
        resetAt: now + windowMs,
      }
      this.hits.set(key, newRecord)
      return { count: 1, resetAt: newRecord.resetAt }
    }

    record.count += 1
    return { count: record.count, resetAt: record.resetAt }
  }
}

const defaultStore = new MemoryStore()

/**
 * Creates a rate limiter middleware
 * @param {object} options
 * @param {number} [options.windowMs] - Window length in ms
 * @param {number} [options.max] - Max requests per window
 * @param {string} [options.prefix] - Key prefix for separating route limits
 */
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs
  const max = options.max || config.rateLimit.maxRequests
  const prefix = options.prefix || 'rl'
  const store = options.store || defaultStore

  return (req, res, next) => {
    // Determine key: user ID if authenticated, else IP address
    const identifier = req.user?.id || req.ip || req.socket?.remoteAddress || '127.0.0.1'
    const key = `${prefix}:${identifier}`

    const { count, resetAt } = store.increment(key, windowMs)
    const remaining = Math.max(0, max - count)
    const resetSeconds = Math.ceil((resetAt - Date.now()) / 1000)

    res.setHeader('RateLimit-Limit', max)
    res.setHeader('RateLimit-Remaining', remaining)
    res.setHeader('RateLimit-Reset', resetSeconds)

    if (count > max) {
      res.setHeader('Retry-After', resetSeconds)
      return next(new RateLimitExceededError('Rate limit exceeded. Please retry later.', resetSeconds))
    }

    next()
  }
}

// Global default rate limiter
export const globalRateLimiter = createRateLimiter()

// Stricter rate limiter for resource-intensive review creation
export const reviewTriggerRateLimiter = createRateLimiter({
  max: config.rateLimit.reviewMaxRequests,
  windowMs: 60 * 1000,
  prefix: 'review_trigger',
})
