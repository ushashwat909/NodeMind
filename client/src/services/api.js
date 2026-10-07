import { supabase } from '@/lib/supabase'

/**
 * Dynamically resolves the API base URL:
 * 1. In development:
 *    - Defaults to relative '' so requests route through Vite's dev server proxy (/api -> :3001).
 *      This works identically whether accessed via localhost, 127.0.0.1, LAN IP (e.g. 192.168.x.x),
 *      or any other laptop or mobile device on the network.
 *    - If VITE_API_URL contains localhost/127.0.0.1 but the page is opened from another machine,
 *      we avoid pointing the remote client to its own localhost and route through Vite proxy.
 * 2. In production:
 *    - Uses VITE_API_URL if configured, otherwise relative ''.
 */
function resolvePrimaryBase() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

  if (typeof window !== 'undefined') {
    const isLocalhostHost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'

    // Remote device accessing over LAN: avoid pointing to client device's localhost
    if (!isLocalhostHost && (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envUrl) || !envUrl)) {
      return ''
    }
  }

  // In development, empty or localhost URL uses Vite dev proxy relative ''
  if (import.meta.env.DEV) {
    if (!envUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(envUrl)) {
      return ''
    }
  }

  return envUrl
}

function resolveDirectFallback() {
  if (typeof window !== 'undefined' && window.location.hostname) {
    // Points to port 3001 of the host machine that served the page
    return `http://${window.location.hostname}:3001`
  }
  return 'http://127.0.0.1:3001'
}

/**
 * Retrieves the active session token to authenticate backend API calls
 */
async function getAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) {
      return { Authorization: `Bearer ${data.session.access_token}` }
    }
  } catch (err) {
    console.warn('[API] Could not retrieve session token:', err.message)
  }
  return {}
}

async function tryFetch(baseUrl, endpoint, options, authHeaders) {
  const url = `${baseUrl}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)
  const contentType = response.headers.get('content-type') || ''

  // If response is not JSON (e.g. Netlify SPA fallback index.html with 200 OK), reject it as an invalid API response
  if (!contentType.includes('application/json')) {
    const err = new Error(`Expected JSON from API, received ${contentType || 'non-JSON content'}`)
    err.status = response.ok ? 404 : response.status
    throw err
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      payload?.error?.message || payload?.message || response.statusText || `API error (${response.status})`
    const errorDetails = payload?.error?.details || null
    const err = new Error(errorMessage)
    err.status = response.status
    err.code = payload?.error?.code || 'API_ERROR'
    err.details = errorDetails
    throw err
  }

  return payload
}

/**
 * Fetch wrapper for the Express API with automatic JWT forwarding, structured error parsing,
 * and resilient fallback.
 */
async function request(endpoint, options = {}) {
  const authHeaders = await getAuthHeaders()
  const primaryBase = resolvePrimaryBase()

  try {
    return await tryFetch(primaryBase, endpoint, options, authHeaders)
  } catch (primaryErr) {
    // If it's a real API HTTP error (4xx from express with JSON), don't retry fallback
    if (primaryErr.status && primaryErr.code !== 'API_ERROR' && primaryErr.status !== 404 && primaryErr.status < 500) {
      throw primaryErr
    }

    // Try dev direct host fallback if relative proxy failed in development
    if (import.meta.env.DEV) {
      const fallbackBase = resolveDirectFallback()
      if (primaryBase !== fallbackBase) {
        try {
          return await tryFetch(fallbackBase, endpoint, options, authHeaders)
        } catch {
          // Fall back to original error
        }
      }
    }

    throw primaryErr
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data) => request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  /** System health */
  health: () => request('/api/health'),

  /** Repositories */
  validateRepository: (url, provider = 'github') =>
    request('/api/repositories/validate', { method: 'POST', body: JSON.stringify({ url, provider }) }),
  connectRepository: (payload) =>
    request('/api/repositories/connect', { method: 'POST', body: JSON.stringify(payload) }),
  syncGitHubRepositories: (token) =>
    request('/api/repositories/sync-github', { method: 'POST', body: JSON.stringify({ token }) }),
  listRepositories: () => request('/api/repositories', { method: 'GET' }),
  getRepository: (id) => request(`/api/repositories/${id}`, { method: 'GET' }),
  getRepositoryBranches: (id) => request(`/api/repositories/${id}/branches`, { method: 'GET' }),
  getRepositoryTree: (id, branch) =>
    request(`/api/repositories/${id}/tree${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`, { method: 'GET' }),

  /** Reviews */
  createReview: (payload) => request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  listReviews: async (params = {}) => {
    try {
      const q = new URLSearchParams(params).toString()
      const res = await request(`/api/reviews${q ? `?${q}` : ''}`, { method: 'GET' })
      if (res?.data?.jobs || Array.isArray(res?.data)) return res
    } catch (err) {
      console.warn('[API] Express listReviews fallback to Supabase:', err.message)
    }

    let query = supabase
      .from('review_jobs')
      .select('*, repositories(name, full_name, language)')
      .order('created_at', { ascending: false })

    if (params.repositoryId) query = query.eq('repository_id', params.repositoryId)
    if (params.status && params.status !== 'all') query = query.eq('status', params.status)
    if (params.limit) query = query.limit(parseInt(params.limit, 10))

    const { data, error } = await query
    if (error) throw error
    return { data: { jobs: data || [] } }
  },

  getReviewHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/reviews/history${q ? `?${q}` : ''}`, { method: 'GET' })
  },

  /**
   * Resilient single review retrieval: attempts Express API first,
   * falls back directly to Supabase client with fuzzy UUID prefix matching.
   */
  getReview: async (id) => {
    try {
      const res = await request(`/api/reviews/${id}`, { method: 'GET' })
      if (res?.data?.job || res?.data) return res
    } catch (err) {
      console.warn('[API] Express getReview unavailable, falling back to direct Supabase:', err.message)
    }

    // Direct Supabase query
    let { data, error } = await supabase
      .from('review_jobs')
      .select('*, repositories(id, name, full_name, default_branch, html_url, language), review_results(*), review_files(*)')
      .eq('id', id)
      .maybeSingle()

    // Fuzzy UUID prefix fallback in case of single character URL mismatch
    if (!data && id && id.length >= 8) {
      const prefix = id.slice(0, 24)
      const { data: fuzzy } = await supabase
        .from('review_jobs')
        .select('*, repositories(id, name, full_name, default_branch, html_url, language), review_results(*), review_files(*)')
        .ilike('id', `${prefix}%`)
        .limit(1)
        .maybeSingle()
      if (fuzzy) data = fuzzy
    }

    if (error || !data) {
      throw error || new Error(`Review job with ID ${id} not found or access restricted.`)
    }

    return { data: { job: data } }
  },

  /**
   * Resilient findings retrieval: attempts Express API first,
   * falls back directly to Supabase client.
   */
  getReviewFindings: async (id, params = {}) => {
    try {
      const q = new URLSearchParams(params).toString()
      const res = await request(`/api/reviews/${id}/findings${q ? `?${q}` : ''}`, { method: 'GET' })
      if (res?.data?.findings || Array.isArray(res?.data)) return res
    } catch (err) {
      console.warn('[API] Express getReviewFindings unavailable, falling back to direct Supabase:', err.message)
    }

    let query = supabase
      .from('review_findings')
      .select('*')
      .eq('review_job_id', id)
      .order('created_at', { ascending: true })

    if (params.severity && params.severity !== 'all') {
      query = query.eq('severity', params.severity)
    }
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status)
    }

    let { data, error } = await query

    // If findings empty and ID might be fuzzy prefix
    if ((!data || data.length === 0) && id && id.length >= 8) {
      const prefix = id.slice(0, 24)
      const { data: jobMatch } = await supabase
        .from('review_jobs')
        .select('id')
        .ilike('id', `${prefix}%`)
        .limit(1)
        .maybeSingle()
      if (jobMatch?.id && jobMatch.id !== id) {
        const { data: fuzzyFindings } = await supabase
          .from('review_findings')
          .select('*')
          .eq('review_job_id', jobMatch.id)
          .order('created_at', { ascending: true })
        if (fuzzyFindings && fuzzyFindings.length > 0) {
          data = fuzzyFindings
        }
      }
    }

    if (error) throw error
    return { data: { findings: data || [] } }
  },

  /**
   * Resilient finding status update: Express API with Supabase direct fallback.
   */
  updateFindingStatus: async (findingId, payload) => {
    try {
      const res = await request(`/api/reviews/findings/${findingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (res?.data) return res
    } catch (err) {
      console.warn('[API] Express updateFindingStatus fallback to Supabase:', err.message)
    }

    const updateData = {
      status: payload.status,
      dismissed_reason: payload.status === 'dismissed' ? (payload.dismissedReason || null) : null,
      dismissed_at: payload.status === 'dismissed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('review_findings')
      .update(updateData)
      .eq('id', findingId)
      .select()
      .single()

    if (error) throw error
    return { data }
  },
}
