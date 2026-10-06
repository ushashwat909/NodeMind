import { formatError } from '../utils/responseFormatter.js'
import { AppError } from '../utils/errors.js'
import { logger } from '../lib/logger.js'
import config from '../config/index.js'

/**
 * Centralized error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // If headers were already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err)
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(formatError('Malformed JSON payload received in request body', 'INVALID_JSON'))
  }

  // Handle AppError and subclasses
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatError(err.message, err.errorCode, err.details))
  }

  // Handle Supabase PostgREST errors
  if (err.code || err.details || err.hint) {
    if (err.code === '23505') {
      const details = config.isProduction ? null : err.details
      return res.status(409).json(formatError('Resource already exists (unique constraint violation)', 'CONFLICT', details))
    }
    if (err.code === '42501') {
      return res.status(403).json(formatError('Access denied by Row Level Security policy', 'FORBIDDEN'))
    }
    if (err.code === 'PGRST116') {
      return res.status(404).json(formatError('Requested resource was not found', 'NOT_FOUND'))
    }
  }

  // Unexpected server error
  logger.error('Unhandled internal server error:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  })

  const message = config.isProduction
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal server error'

  const details = config.isProduction ? null : { stack: err.stack }

  return res.status(500).json(formatError(message, 'INTERNAL_SERVER_ERROR', details))
}

/**
 * 404 Not Found route handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json(formatError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'))
}
