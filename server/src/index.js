import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import routes from './routes/index.js'
import { securityHeaders } from './middleware/securityHeaders.js'
import { requestLogger } from './middleware/requestLogger.js'
import { globalRateLimiter } from './middleware/rateLimiter.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { logger } from './lib/logger.js'

const app = express()

// 1. Security Headers (OWASP recommendations)
app.use(securityHeaders)

// 2. CORS (allow configured client origin and local development origins with credentials)
const isAllowedOrigin = (origin) => {
  if (!origin) return true
  // In development, allow all origins (local network devices, other laptops, mobile, localhost, tunnels)
  if (!config.isProduction) return true
  if (origin === config.clientUrl) return true
  if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return true
  return false
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
)

// 3. Request performance logging
app.use(requestLogger)

// 4. Rate limiting (sliding window)
app.use('/api', globalRateLimiter)

// 5. Body parser with safe payload limits
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 6. Mount API routes
app.use('/api', routes)

// 7. 404 Not Found handler
app.use('/api', notFoundHandler)

// 8. Centralized structured error handler
app.use(errorHandler)

// 9. Server lifecycle & Graceful Shutdown
let server = null

import { fileURLToPath } from 'node:url'

const isMainScript = Boolean(
  process.argv[1] && (
    fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith('src/index.js') ||
    process.argv[1].endsWith('src\\index.js') ||
    process.argv[1].includes('index.js')
  )
)

if (isMainScript && process.env.NODE_ENV !== 'test') {
  const host = '0.0.0.0'
  server = app.listen(config.port, host, () => {
    logger.info(`
  ┌──────────────────────────────────────────────┐
  │  Code Review Agent — API Backend             │
  │  Host:        ${host.padEnd(31)}│
  │  Port:        ${String(config.port).padEnd(31)}│
  │  Env:         ${config.nodeEnv.padEnd(31)}│
  │  Health:      http://${host}:${config.port}/api/health │
  │  Repositories:http://${host}:${config.port}/api/repositories │
  │  Reviews:     http://${host}:${config.port}/api/reviews │
  └──────────────────────────────────────────────┘
    `)
  })

  function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Shutting down gracefully...`)
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed cleanly. Exiting process.')
        process.exit(0)
      })

      // Force close if open connections take too long
      setTimeout(() => {
        logger.error('Forcefully terminating server after timeout.')
        process.exit(1)
      }, 5000).unref()
    } else {
      process.exit(0)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}

export default app
