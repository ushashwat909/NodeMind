import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const CLIENT_URL = 'http://localhost:5173'
const SERVER_URL = 'http://localhost:3001/api'

const SUPABASE_URL = 'https://byztyberaoyczdaffbbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enR5YmVyYW95Y3pkYWZmYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjA4NjMsImV4cCI6MjEwNjc5Njg2M30.VLd4yVlRrA5OtAmHx1fb8I5xWHPgPw6kluSALCJY8Bg'

let validToken = null
let testUser = null
let testRepoId = null
let testReviewJobId = null
let testFindingId = null

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

before(async () => {
  // Sign in to retrieve a real active Supabase JWT
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'reviewer@codereview.dev',
      password: 'ReviewerPass123!',
    })
    if (error) {
      console.warn('Initial sign in warning:', error.message)
    } else {
      validToken = data.session?.access_token
      testUser = data.user
    }
  } catch (err) {
    console.warn('Auth setup error:', err.message)
  }
})

describe('SECTION 1: Core User Flow (Steps 1 - 18)', () => {
  test('Step 1: Landing page is accessible and returns valid HTML application bundle', async () => {
    const res = await fetch(CLIENT_URL)
    assert.equal(res.status, 200, 'Frontend dev server should return 200 OK')
    const html = await res.text()
    assert.ok(html.includes('<div id="root"></div>'), 'HTML should contain root application container')
    assert.ok(html.includes('Code Review Agent'), 'HTML should reference Code Review Agent title')
  })

  test('Step 2 & 3: Sign in with valid credentials retrieves real Supabase JWT session', async () => {
    assert.ok(validToken, 'Must receive a valid JWT session token')
    assert.ok(testUser, 'Must receive authenticated user object')
    assert.equal(testUser.email, 'reviewer@codereview.dev')
  })

  test('Step 4: Open dashboard — fetch authenticated repositories and review history', async () => {
    const [repoRes, reviewRes] = await Promise.all([
      fetch(`${SERVER_URL}/repositories`, {
        headers: { Authorization: `Bearer ${validToken}` },
      }),
      fetch(`${SERVER_URL}/reviews`, {
        headers: { Authorization: `Bearer ${validToken}` },
      }),
    ])

    assert.equal(repoRes.status, 200, 'Repositories endpoint must return 200')
    const repoJson = await repoRes.json()
    assert.equal(repoJson.success, true)
    assert.ok(Array.isArray(repoJson.data), 'Repositories data must be an array')

    assert.equal(reviewRes.status, 200, 'Reviews endpoint must return 200')
    const reviewJson = await reviewRes.json()
    assert.equal(reviewJson.success, true)
    assert.ok(Array.isArray(reviewJson.data), 'Reviews data must be an array')

    // Capture an existing repository if available
    if (repoJson.data.length > 0) {
      testRepoId = repoJson.data[0].id
    }
  })

  test('Step 5 & 6: Validate & Connect repository and retrieve branches', async () => {
    const validateRes = await fetch(`${SERVER_URL}/repositories/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        url: 'https://github.com/octocat/Hello-World',
      }),
    })

    const validateJson = await validateRes.json()
    if (validateRes.status === 200) {
      assert.equal(validateJson.success, true)
      assert.equal(validateJson.data.parsed.fullName, 'octocat/Hello-World')
    } else {
      assert.equal(validateRes.status, 400, 'If not 200, must be 400 rate limit')
      assert.equal(validateJson.success, false)
    }

    // Connect repository if none existing
    if (!testRepoId) {
      const connectRes = await fetch(`${SERVER_URL}/repositories/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          fullName: 'octocat/Hello-World',
          defaultBranch: validateJson.data?.repository?.defaultBranch || 'master',
          isPrivate: false,
        }),
      })
      assert.ok([200, 201].includes(connectRes.status))
      const connectJson = await connectRes.json()
      testRepoId = connectJson.data.id
    }
    assert.ok(testRepoId, 'Test repository ID must be established')
  })

  test('Step 7, 8 & 9: Start review, execute processing pipeline, and verify completion', async () => {
    const startReviewRes = await fetch(`${SERVER_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        repositoryId: testRepoId,
        branch: 'master',
        triggerType: 'manual',
      }),
    })

    assert.equal(startReviewRes.status, 201, 'POST /api/reviews must return 201 Created')
    const startJson = await startReviewRes.json()
    assert.equal(startJson.success, true)
    assert.ok(startJson.data.job.id, 'Must return job ID')
    assert.equal(startJson.data.job.status, 'completed', 'Review job status must be completed')
    assert.ok(startJson.data.summary.score !== undefined, 'Review summary must contain quality score')

    testReviewJobId = startJson.data.job.id
  })

  test('Step 10 & 11: View and filter findings for completed review', async () => {
    assert.ok(testReviewJobId, 'Review job ID must exist')

    const findingsRes = await fetch(`${SERVER_URL}/reviews/${testReviewJobId}/findings`, {
      headers: { Authorization: `Bearer ${validToken}` },
    })

    assert.equal(findingsRes.status, 200, 'GET findings must return 200')
    const findingsJson = await findingsRes.json()
    assert.equal(findingsJson.success, true)
    assert.ok(Array.isArray(findingsJson.data), 'Findings must be an array')

    if (findingsJson.data.length > 0) {
      testFindingId = findingsJson.data[0].id
      const firstFinding = findingsJson.data[0]
      assert.ok(firstFinding.severity, 'Finding must specify severity')
      assert.ok(firstFinding.title, 'Finding must specify title')
      assert.ok(firstFinding.category, 'Finding must specify category')
      assert.ok(firstFinding.file_path, 'Finding must specify file_path')
    }
  })

  test('Step 12 & 13: View file context & update finding remediation status', async () => {
    if (!testFindingId) return

    // Update status to resolved
    const updateRes = await fetch(`${SERVER_URL}/reviews/findings/${testFindingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ status: 'resolved' }),
    })

    assert.equal(updateRes.status, 200, 'PATCH finding status must return 200')
    const updateJson = await updateRes.json()
    assert.equal(updateJson.success, true)
    assert.equal(updateJson.data.status, 'resolved')

    // Reopen finding
    const reopenRes = await fetch(`${SERVER_URL}/reviews/findings/${testFindingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ status: 'open' }),
    })
    assert.equal(reopenRes.status, 200)
    const reopenJson = await reopenRes.json()
    assert.equal(reopenJson.data.status, 'open')
  })

  test('Step 14 & 15: Return to review history & open previous review details', async () => {
    assert.ok(testReviewJobId, 'Review job ID must exist')

    const jobRes = await fetch(`${SERVER_URL}/reviews/${testReviewJobId}`, {
      headers: { Authorization: `Bearer ${validToken}` },
    })

    assert.equal(jobRes.status, 200, 'GET /api/reviews/:id must return 200')
    const jobJson = await jobRes.json()
    assert.equal(jobJson.success, true)
    assert.equal(jobJson.data.id, testReviewJobId)
    assert.ok(jobJson.data.repositories, 'Job must include joined repository metadata')
  })

  test('Step 16, 17 & 18: Unauthenticated access to protected API route is denied', async () => {
    const unauthRes = await fetch(`${SERVER_URL}/reviews`, {
      headers: { Authorization: '' },
    })

    assert.equal(unauthRes.status, 401, 'Must return 401 Unauthorized')
    const unauthJson = await unauthRes.json()
    assert.equal(unauthJson.success, false)
    assert.equal(unauthJson.error.code, 'UNAUTHORIZED')
  })
})

describe('SECTION 2: Failure Scenarios', () => {
  test('Failure 1: Invalid login credentials rejected by Supabase Auth', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'reviewer@codereview.dev',
      password: 'CompletelyWrongPassword!',
    })

    assert.equal(data.session, null, 'Session must not be granted')
    assert.ok(error, 'Error must be returned')
    assert.match(error.message, /invalid login credentials/i)
  })

  test('Failure 2: Expired or malformed session rejected with 401', async () => {
    const res = await fetch(`${SERVER_URL}/repositories`, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired_payload_signature',
      },
    })

    assert.equal(res.status, 401)
    const json = await res.json()
    assert.equal(json.error.code, 'UNAUTHORIZED')
  })

  test('Failure 3: Invalid or non-GitHub repository URL rejected with 400', async () => {
    const res = await fetch(`${SERVER_URL}/repositories/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        url: 'https://malicious-site.com/exploit',
      }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'BAD_REQUEST')
  })

  test('Failure 4: Inaccessible or 404 GitHub repository fails gracefully with useful error', async () => {
    const res = await fetch(`${SERVER_URL}/repositories/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        url: 'https://github.com/nonexistent-org-998877/ghost-repo-12345',
      }),
    })

    assert.ok([400, 404].includes(res.status))
    const json = await res.json()
    assert.equal(json.success, false)
    assert.ok(json.error.message.includes('not found') || json.error.message.includes('GitHub repository'))
  })

  test('Failure 5: SSRF attempts with local IP addresses blocked with 400', async () => {
    const res = await fetch(`${SERVER_URL}/repositories/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        url: 'http://169.254.169.254/latest/meta-data',
      }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
  })

  test('Failure 6: Malformed JSON request body returns 400 INVALID_JSON', async () => {
    const res = await fetch(`${SERVER_URL}/repositories/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: '{"broken": json without closing',
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.error.code, 'INVALID_JSON')
  })

  test('Failure 7: Missing required fields returns 400 BAD_REQUEST with detail fields', async () => {
    const res = await fetch(`${SERVER_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({}),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.error.code, 'BAD_REQUEST')
    assert.ok(json.error.details.some((d) => d.field === 'repositoryId'))
  })

  test('Failure 8: Non-existent API route returns 404 ROUTE_NOT_FOUND', async () => {
    const res = await fetch(`${SERVER_URL}/non-existent-qa-path`)
    assert.equal(res.status, 404)
    const json = await res.json()
    assert.equal(json.error.code, 'ROUTE_NOT_FOUND')
  })

  test('Failure 9: Invalid finding status enum value returns 400 BAD_REQUEST', async () => {
    const res = await fetch(`${SERVER_URL}/reviews/findings/fake-id`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ status: 'invalid_status_enum' }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.error.code, 'BAD_REQUEST')
    assert.ok(json.error.details.some((d) => d.field === 'status'))
  })
})
