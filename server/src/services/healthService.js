const startedAt = Date.now()

export function getHealthMetrics() {
  const uptimeMs = Date.now() - startedAt
  const seconds = Math.floor(uptimeMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const uptimeStr =
    hours > 0
      ? `${hours}h ${minutes % 60}m`
      : minutes > 0
        ? `${minutes}m ${seconds % 60}s`
        : `${seconds}s`

  return {
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    uptime: uptimeStr,
    timestamp: new Date().toISOString(),
  }
}
