/**
 * UI formatting utilities
 */

export function formatUptime(uptime) {
  if (!uptime) return '0s'
  return uptime
}

export function truncateHash(hash, length = 7) {
  if (!hash) return ''
  return hash.slice(0, length)
}
