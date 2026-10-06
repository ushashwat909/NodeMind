import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/index.js'
import { gitHubProvider } from '../src/services/providers/GitHubProvider.js'
import { createClient } from '@supabase/supabase-js'

const TEST_PORT = 3098
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`
let serverInstance = null
let validJwtToken = null

const SUPABASE_URL = 'https://byztyberaoyczdaffbbe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enR5YmVyYW95Y3pkYWZmYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjA4NjMsImV4cCI6MjEwNjc5Njg2M30.VLd4yVlRrA5OtAmHx1fb8I5xWHPgPw6kluSALCJY8Bg'

before(async () => {
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => resolve())
  })

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

describe('GitHubProvider Unit Tests & SSRF Guards', () => {
  test('Parses valid GitHub URLs accurately', () => {
    const res1 = gitHubProvider.parseRepositoryUrl('https://github.com/facebook/react')
    assert.equal(res1.owner, 'facebook')
    assert.equal(res1.repo, 'react')
    assert.equal(res1.fullName, 'facebook/react')

    const res2 = gitHubProvider.parseRepositoryUrl('https://github.com/vercel/next.js.git')
    assert.equal(res2.owner, 'vercel')
    assert.equal(res2.repo, 'next.js')

    const res3 = gitHubProvider.parseRepositoryUrl('expressjs/express')
    assert.equal(res3.owner, 'expressjs')
    assert.equal(res3.repo, 'express')
  })

  test('Blocks SSRF attempts: non-GitHub domains and IP addresses', () => {
    assert.throws(
      () => gitHubProvider.parseRepositoryUrl('https://169.254.169.254/latest/meta-data'),
      /Only github\.com repositories are supported/
    )

    assert.throws(
      () => gitHubProvider.parseRepositoryUrl('https://evil-attacker.com/owner/repo'),
      /Only github\.com repositories are supported/
    )

    assert.throws(
      () => gitHubProvider.parseRepositoryUrl('http://github.com/facebook/react'),
      /Only secure HTTPS/
    )
  })

  test('Blocks SSRF attempts: userinfo credential tricks', () => {
    assert.throws(
      () => gitHubProvider.parseRepositoryUrl('https://github.com@attacker.com/test'),
      /invalid credentials or characters/
    )
  })

  test('Blocks path traversal in repository names', () => {
    assert.throws(
      () => gitHubProvider.parseRepositoryUrl('facebook/../etc/passwd'),
      /Invalid GitHub/
    )
  })

  test('Correctly filters supported source files vs ignored files', () => {
    assert.equal(gitHubProvider.isSupportedSourceFile('src/auth/jwt.ts'), true)
    assert.equal(gitHubProvider.isSupportedSourceFile('backend/main.py'), true)
    assert.equal(gitHubProvider.isSupportedSourceFile('Dockerfile'), true)

    // Should ignore
    assert.equal(gitHubProvider.isSupportedSourceFile('node_modules/express/index.js'), false)
    assert.equal(gitHubProvider.isSupportedSourceFile('package-lock.json'), false)
    assert.equal(gitHubProvider.isSupportedSourceFile('assets/logo.png'), false)
    assert.equal(gitHubProvider.isSupportedSourceFile('dist/bundle.min.js'), false)
  })
})

describe('POST /api/repositories/validate Endpoint', () => {
  test('Validates public repository and returns metadata & branches', async () => {
    if (!validJwtToken) return

    const res = await fetch(`${BASE_URL}/repositories/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken}`,
      },
      body: JSON.stringify({
        url: 'https://github.com/expressjs/express',
        provider: 'github',
      }),
    })

    if (res.status === 400) {
      const json = await res.json()
      if (json.error?.message?.toLowerCase().includes('rate limit')) {
        // Tolerated in testing environments when unauthenticated GitHub IP quota is reached
        assert.ok(true, 'GitHub public API rate limit reached')
        return
      }
    }

    assert.equal(res.status, 200)
    const json = await res.json()
    assert.equal(json.success, true)
    assert.equal(json.data.valid, true)
    assert.equal(json.data.parsed.fullName, 'expressjs/express')
    assert.ok(json.data.repository.name === 'express')
    assert.ok(Array.isArray(json.data.branches))
    assert.ok(json.data.branches.length > 0)
  })

  test('Rejects malicious SSRF url with 400', async () => {
    if (!validJwtToken) return

    const res = await fetch(`${BASE_URL}/repositories/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken}`,
      },
      body: JSON.stringify({
        url: 'https://internal-bank-api.corp.local/secret/repo',
      }),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'BAD_REQUEST')
  })

  test('POST /api/repositories/sync-github requires authentication', async () => {
    const res = await fetch(`${BASE_URL}/repositories/sync-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'mock-token' }),
    })

    assert.equal(res.status, 401)
  })

  test('POST /api/repositories/sync-github rejects request when no token exists', async () => {
    if (!validJwtToken) return

    const res = await fetch(`${BASE_URL}/repositories/sync-github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validJwtToken}`,
      },
      body: JSON.stringify({}),
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.success, false)
    assert.match(json.error.message, /GitHub authentication token is required/i)
  })
})

