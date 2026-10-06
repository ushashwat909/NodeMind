import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/index.js'
import { createClient } from '@supabase/supabase-js'

const TEST_PORT = 3099
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`
let serverInstance = null
let validJwtToken = null

const SUPABASE_URL = 'https://byztyberaoyczdaffbbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enR5YmVyYW95Y3pkYWZmYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjA4NjMsImV4cCI6MjEwNjc5Njg2M30.VLd4yVlRrA5OtAmHx1fb8I5xWHPgPw6kluSALCJY8Bg'

before(async () => {
  // Start test server on distinct port
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      resolve()
    })
  })

  // Authenticate as test user to get a verified JWT token
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data } = await supabase.auth.signInWithPassword({
      email: 'reviewer@codereview.dev',
      password: 'ReviewerPass123!',
    })
    validJwtToken = data?.session?.access_token || null
  } catch (err) {
    console.warn('Could not authenticate test user:', err.message)
  }
})

after(async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve))
  }
})

describe('1. Health Endpoint Tests', () => {
  test('GET /api/health returns 200 with standard envelope and uptime', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    assert.equal(res.status, 200)

    const json = await res.json()
    assert.equal(json.success, true)
    assert.equal(json.data.status, 'ok')
    assert.equal(json.data.service, 'code-review-agent-api')
    assert.ok(json.data.uptimeSeconds >= 0)
    assert.ok(json.data.database.status)
    assert.ok(json.meta.timestamp)
  })

  test('Security headers are present on response', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(res.headers.get('x-frame-options'), 'DENY')
    assert.equal(res.headers.get('x-xss-protection'), '1; mode=block')
  })
})

describe('2. Authentication Failures & Identity Protection', () => {
  test('GET /api/repositories returns 401 when no token is provided', async () => {
    const res = await fetch(`${BASE_URL}/repositories`)
    assert.equal(res.status, 401)

    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'UNAUTHORIZED')
    assert.match(json.error.message, /Missing or malformed Authorization header/i)
  })

  test('GET /api/repositories returns 401 when token is invalid', async () => {
    const res = await fetch(`${BASE_URL}/repositories`, {
      headers: {
        Authorization: 'Bearer invalid-token-1234567890',
      },
    })
    assert.equal(res.status, 401)

    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'UNAUTHORIZED')
  })

  test('POST /api/reviews returns 401 when unauthenticated', async () => {
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryId: '00000000-0000-0000-0000-000000000000' }),
    })
    assert.equal(res.status, 401)
  })
})

describe('3. Request Validation Tests', () => {
  test('POST /api/repositories/connect returns 400 when fullName is missing', async () => {
    if (!validJwtToken) return

    const res = await fetch(`${BASE_URL}/repositories/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken}`,
      },
      body: JSON.stringify({ provider: 'github' }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'BAD_REQUEST')
    assert.ok(Array.isArray(json.error.details))
    assert.ok(json.error.details.some((d) => d.field === 'fullName'))
  })

  test('POST /api/reviews returns 400 when repositoryId is missing', async () => {
    if (!validJwtToken) return

    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken}`,
      },
      body: JSON.stringify({ branch: 'main' }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'BAD_REQUEST')
    assert.ok(json.error.details.some((d) => d.field === 'repositoryId'))
  })

  test('PATCH /api/reviews/findings/:id returns 400 for invalid status enum', async () => {
    if (!validJwtToken) return

    const res = await fetch(`${BASE_URL}/reviews/findings/test-finding-id`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken}`,
      },
      body: JSON.stringify({ status: 'not-a-valid-status' }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'BAD_REQUEST')
    assert.ok(json.error.details.some((d) => d.field === 'status'))
  })

  test('Malformed JSON returns 400 with INVALID_JSON code', async () => {
    const res = await fetch(`${BASE_URL}/repositories/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken || 'fake'}`,
      },
      body: '{ "invalidJson": broken',
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'INVALID_JSON')
  })
})

describe('4. Error Handling & 404 Tests', () => {
  test('Non-existent route returns 404 with ROUTE_NOT_FOUND code', async () => {
    const res = await fetch(`${BASE_URL}/non-existent-endpoint-xyz`)
    assert.equal(res.status, 404)

    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'ROUTE_NOT_FOUND')
    assert.ok(json.error.message.includes('/api/non-existent-endpoint-xyz'))
  })
})

describe('5. Authenticated Review Lifecycle Tests', () => {
  test('Authenticated user can list repositories and review jobs', async () => {
    if (!validJwtToken) {
      console.warn('Skipping authenticated lifecycle test: no valid JWT token')
      return
    }

    // 1. List user repositories
    const repoRes = await fetch(`${BASE_URL}/repositories`, {
      headers: { Authorization: `Bearer ${validJwtToken}` },
    })
    assert.equal(repoRes.status, 200)
    const repoJson = await repoRes.json()
    assert.equal(repoJson.success, true)
    assert.ok(Array.isArray(repoJson.data))

    if (repoJson.data.length > 0) {
      const testRepo = repoJson.data[0]

      // 2. Trigger review job on the repository
      const reviewRes = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validJwtToken}`,
        },
        body: JSON.stringify({
          repositoryId: testRepo.id,
          branch: 'main',
          triggerType: 'manual',
        }),
      })

      assert.equal(reviewRes.status, 201)
      const reviewJson = await reviewRes.json()
      assert.equal(reviewJson.success, true)
      assert.ok(reviewJson.data.job.id)
      assert.equal(reviewJson.data.job.status, 'completed')
      assert.ok(reviewJson.data.metrics.totalFiles > 0)
      assert.ok(reviewJson.data.summary.score !== undefined)

      // 3. Fetch findings for the completed review
      const findingsRes = await fetch(`${BASE_URL}/reviews/${reviewJson.data.job.id}/findings`, {
        headers: { Authorization: `Bearer ${validJwtToken}` },
      })
      assert.equal(findingsRes.status, 200)
      const findingsJson = await findingsRes.json()
      assert.equal(findingsJson.success, true)
      assert.ok(Array.isArray(findingsJson.data))
      assert.ok(findingsJson.data.length > 0)
      assert.ok(findingsJson.data.some((f) => f.severity === 'critical'))
    }
  })
})
