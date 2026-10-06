/**
 * Standard API response envelope formatter
 * Output shape:
 * {
 *   success: true,
 *   data: { ... },
 *   message?: "...",
 *   meta?: { timestamp: "..." }
 * }
 */
export function formatSuccess(data = null, message = null, meta = {}) {
  const response = {
    success: true,
    data,
  }

  if (message) {
    response.message = message
  }

  response.meta = {
    timestamp: new Date().toISOString(),
    ...meta,
  }

  return response
}

/**
 * Standard API error envelope formatter
 * Output shape:
 * {
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human readable message",
 *     details?: [ ... ]
 *   }
 * }
 */
export function formatError(message, code = 'INTERNAL_ERROR', details = null) {
  const errorObj = {
    code,
    message,
  }

  if (details !== null && details !== undefined) {
    errorObj.details = details
  }

  return {
    success: false,
    error: errorObj,
  }
}
