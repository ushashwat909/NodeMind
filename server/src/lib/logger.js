const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info')

function shouldLog(level) {
  return (LEVELS[level] ?? 1) >= (LEVELS[currentLevel] ?? 1)
}

function timestamp() {
  return new Date().toISOString()
}

const SENSITIVE_KEY_REGEX = /password|token|access_token|secret|api_?key|auth(?:orization)?|service_?role/i

/**
 * Sanitizes strings, removing tokens, JWTs, secrets, and credentials
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/Bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[a-zA-Z0-9_\-]{8,}\.eyJ[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]+/g, '[REDACTED_JWT]')
    .replace(/(?:ghp_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,})/g, '[REDACTED_GH_TOKEN]')
    .replace(/([?&](?:key|api_key|token|access_token|secret)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*['"]?[a-zA-Z0-9_\-.]+['"]?/gi, '$1: [REDACTED]')
}

/**
 * Recursively scrubs objects and arrays of sensitive keys and values
 */
function sanitizeArg(arg, depth = 0) {
  if (depth > 5 || arg === null || arg === undefined) return arg

  if (typeof arg === 'string') {
    return sanitizeString(arg)
  }

  if (arg instanceof Error) {
    const sanitizedError = new Error(sanitizeString(arg.message))
    if (arg.stack) {
      sanitizedError.stack = sanitizeString(arg.stack)
    }
    return sanitizedError
  }

  if (Array.isArray(arg)) {
    return arg.map((item) => sanitizeArg(item, depth + 1))
  }

  if (typeof arg === 'object') {
    const sanitized = {}
    for (const [key, val] of Object.entries(arg)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeArg(val, depth + 1)
      }
    }
    return sanitized
  }

  return arg
}

function sanitizeAll(args) {
  return args.map((a) => sanitizeArg(a))
}

export const logger = {
  debug(...args) {
    if (shouldLog('debug')) {
      console.debug(`[${timestamp()}] [DEBUG]`, ...sanitizeAll(args))
    }
  },
  info(...args) {
    if (shouldLog('info')) {
      console.log(`[${timestamp()}] [INFO]`, ...sanitizeAll(args))
    }
  },
  warn(...args) {
    if (shouldLog('warn')) {
      console.warn(`[${timestamp()}] [WARN]`, ...sanitizeAll(args))
    }
  },
  error(...args) {
    if (shouldLog('error')) {
      console.error(`[${timestamp()}] [ERROR]`, ...sanitizeAll(args))
    }
  },
}
