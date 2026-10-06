import { UnauthorizedError } from '../utils/errors.js'
import { verifySupabaseToken, getSupabaseUserClient } from '../lib/supabase.js'

/**
 * Extracts Bearer token from Authorization header
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || typeof authHeader !== 'string') {
    return null
  }

  const parts = authHeader.trim().split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1]
}

/**
 * Middleware that strictly enforces authenticated user sessions.
 * Never trusts user-supplied IDs from client payloads.
 * Derives and attaches validated user identity to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req)

    if (!token) {
      throw new UnauthorizedError('Missing or malformed Authorization header. Expected: Bearer <token>')
    }

    const { user, error } = await verifySupabaseToken(token)

    if (error || !user) {
      throw new UnauthorizedError('Invalid, expired, or revoked authentication session.')
    }

    // Attach cryptographically verified user identity
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      app_metadata: user.app_metadata || {},
      user_metadata: user.user_metadata || {},
    }

    req.token = token
    // Attach user-scoped Supabase client that honors PostgreSQL RLS
    req.supabase = getSupabaseUserClient(token)

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Optional authentication middleware for endpoints that can serve both guests and members
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      req.user = null
      req.supabase = null
      return next()
    }

    const { user, error } = await verifySupabaseToken(token)
    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        app_metadata: user.app_metadata || {},
        user_metadata: user.user_metadata || {},
      }
      req.token = token
      req.supabase = getSupabaseUserClient(token)
    } else {
      req.user = null
      req.supabase = null
    }

    next()
  } catch (err) {
    req.user = null
    req.supabase = null
    next()
  }
}
