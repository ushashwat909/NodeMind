import { logger } from '../lib/logger.js'

/**
 * Lightweight request and response performance logger
 */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1e6
    const formattedDuration = durationMs.toFixed(2)
    const userTag = req.user?.id ? `[User: ${req.user.id.slice(0, 8)}]` : '[Anon]'

    const logLine = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${formattedDuration}ms ${userTag}`

    if (res.statusCode >= 500) {
      logger.error(logLine)
    } else if (res.statusCode >= 400) {
      logger.warn(logLine)
    } else {
      logger.info(logLine)
    }
  })

  next()
}
