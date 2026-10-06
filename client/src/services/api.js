import { supabase } from '@/lib/supabase'

const configuredBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const defaultDirect = 'http://localhost:3001'
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
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage = payload?.error?.message || payload?.message || response.statusText || `API error (${response.status})`
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
 * and resilient dev fallback (tries configured API_BASE, falls back to Vite proxy / direct localhost).
 */
async function request(endpoint, options = {}) {
  const authHeaders = await getAuthHeaders()
  const primaryBase = configuredBase || ''

  try {
    return await tryFetch(primaryBase, endpoint, options, authHeaders)
  } catch (primaryErr) {
    // If it's a structured HTTP error (4xx/5xx from API), don't retry with fallback
    if (primaryErr.status) {
      throw primaryErr
    }

    // Network error: try fallback base (relative proxy if base was set, or direct localhost if relative was tried)
    const fallbackBase = primaryBase ? '' : defaultDirect
    try {
      return await tryFetch(fallbackBase, endpoint, options, authHeaders)
    } catch {
      throw primaryErr
    }
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
  validateRepository: (url, provider = 'github') => request('/api/repositories/validate', { method: 'POST', body: JSON.stringify({ url, provider }) }),
  connectRepository: (payload) => request('/api/repositories/connect', { method: 'POST', body: JSON.stringify(payload) }),
  syncGitHubRepositories: (token) => request('/api/repositories/sync-github', { method: 'POST', body: JSON.stringify({ token }) }),
  listRepositories: () => request('/api/repositories', { method: 'GET' }),
  getRepository: (id) => request(`/api/repositories/${id}`, { method: 'GET' }),
  getRepositoryBranches: (id) => request(`/api/repositories/${id}/branches`, { method: 'GET' }),
  getRepositoryTree: (id, branch) => request(`/api/repositories/${id}/tree${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`, { method: 'GET' }),


  /** Reviews */
  createReview: (payload) => request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  listReviews: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/reviews${q ? `?${q}` : ''}`, { method: 'GET' })
  },
  getReviewHistory: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/reviews/history${q ? `?${q}` : ''}`, { method: 'GET' })
  },
  getReview: (id) => request(`/api/reviews/${id}`, { method: 'GET' }),
  getReviewFindings: (id, params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/api/reviews/${id}/findings${q ? `?${q}` : ''}`, { method: 'GET' })
  },
  updateFindingStatus: (findingId, payload) =>
    request(`/api/reviews/findings/${findingId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
}
