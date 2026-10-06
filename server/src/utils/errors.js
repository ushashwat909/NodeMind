/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required or token invalid', details = null) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied for this resource', details = null) {
    super(message, 403, 'FORBIDDEN', details)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists or conflict detected', details = null) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity', details = null) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details)
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message = 'Too many requests. Please slow down and try again later.', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds: retryAfter })
  }
}
