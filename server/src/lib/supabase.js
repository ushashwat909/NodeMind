import { createClient } from '@supabase/supabase-js'
import config from '../config/index.js'
import { logger } from './logger.js'

let supabaseAdmin = null
let supabasePublic = null

/**
 * Returns a public Supabase client configured with the anon key.
 * Used for public operations, token verification, and health checks.
 */
export function getSupabasePublic() {
  if (supabasePublic) return supabasePublic

  supabasePublic = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return supabasePublic
}

/**
 * Returns a Supabase client configured with the service_role key.
 * This client bypasses RLS — used exclusively for server-side trusted tasks.
 * Falls back to public client if service role key is not yet configured.
 */
export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin

  const key = config.supabase.serviceRoleKey && !config.supabase.serviceRoleKey.includes('your_supabase')
    ? config.supabase.serviceRoleKey
    : config.supabase.anonKey

  supabaseAdmin = createClient(config.supabase.url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return supabaseAdmin
}

/**
 * Creates a user-scoped Supabase client that forwards the user's JWT.
 * Postgres RLS policies evaluate `auth.uid()` against this user's identity.
 * @param {string} accessToken - Verified Bearer JWT
 */
export function getSupabaseUserClient(accessToken) {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

/**
 * Verifies a JWT token with Supabase Auth and returns the authenticated user.
 * @param {string} token
 * @returns {Promise<{ user: any, error: any }>}
 */
export async function verifySupabaseToken(token) {
  try {
    const client = getSupabasePublic()
    const { data, error } = await client.auth.getUser(token)
    if (error || !data?.user) {
      return { user: null, error: error || new Error('Invalid or expired token') }
    }
    return { user: data.user, error: null }
  } catch (err) {
    logger.error('Token verification exception:', err.message)
    return { user: null, error: err }
  }
}
