import { formatSuccess } from '../utils/responseFormatter.js'
import { getSupabasePublic } from '../lib/supabase.js'
import config from '../config/index.js'

/**
 * Health check controller
 * GET /api/health
 */
export async function getHealth(req, res, next) {
  try {
    let databaseStatus = 'healthy'
    let dbLatencyMs = null

    try {
      const start = process.hrtime.bigint()
      const supabase = getSupabasePublic()
      const { error } = await supabase.from('profiles').select('id').limit(1)
      const end = process.hrtime.bigint()
      dbLatencyMs = Number((Number(end - start) / 1e6).toFixed(2))
      if (error && error.code !== 'PGRST116') {
        databaseStatus = 'degraded'
      }
    } catch {
      databaseStatus = 'unreachable'
    }

    const healthData = {
      status: 'ok',
      service: 'code-review-agent-api',
      environment: config.nodeEnv,
      version: '0.1.0',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: databaseStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
        heapUsedMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
      },
      nodeVersion: process.version,
    }

    return res.status(200).json(formatSuccess(healthData, 'System is healthy and operational'))
  } catch (err) {
    next(err)
  }
}
