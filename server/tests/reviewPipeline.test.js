import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  FileFilter,
  FileRetriever,
  FindingNormalizer,
  ReviewSummarizer,
  CodeAnalyzer,
  ReviewService,
  MockAnalysisProvider,
  RuleBasedAnalysisProvider,
  getAnalysisProvider,
} from '../src/services/review/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const SAMPLE_REPO_DIR = path.join(FIXTURES_DIR, 'sample-repo')
const EXPECTED_FINDINGS_PATH = path.join(FIXTURES_DIR, 'expected-findings.json')

describe('Code Review Agent: FileFilter Safeguards', () => {
  const filter = new FileFilter({ maxFileSizeBytes: 1024 * 100 }) // 100 KB limit for test

  it('filters out ignored directories, lockfiles, minified files, and binary assets', () => {
    const candidateFiles = [
      { path: 'auth/jwt_auth.js', size: 500 },
      { path: 'database/userRepository.js', size: 600 },
      { path: 'node_modules/express/index.js', size: 2000 },
      { path: 'dist/app.bundle.js', size: 50000 },
      { path: 'ignored/bundle.min.js', size: 1200 },
      { path: 'package-lock.json', size: 3000 },
      { path: 'assets/logo.png', size: 4000 },
      { path: 'oversized_script.js', size: 200 * 1024 }, // 200 KB > 100 KB limit
    ]

    const { eligible, skipped, metrics } = filter.filterFiles(candidateFiles)

    assert.equal(eligible.length, 2)
    assert.deepEqual(eligible.map(f => f.path), ['auth/jwt_auth.js', 'database/userRepository.js'])

    assert.equal(skipped.length, 6)
    const skippedReasons = skipped.map(s => s.reason)
    assert.ok(skippedReasons.includes('ignored_directory'))
    assert.ok(skippedReasons.includes('ignored_generated'))
    assert.ok(skippedReasons.includes('unsupported_file_type'))
    assert.ok(skippedReasons.includes('oversized_file'))
  })
})

describe('Code Review Agent: FileRetriever with Failed-File Isolation', () => {
  it('safely isolates unreadable files without crashing the review', async () => {
    const retriever = new FileRetriever()

    // Mock git provider where one file throws an error
    const mockGitProvider = {
      async getFileContent(repoFullName, filePath) {
        if (filePath === 'broken/corrupt_file.js') {
          throw new Error('404 File Not Found on Remote VCS')
        }
        return {
          content: `export const value = 42; // content for ${filePath}`,
          language: 'javascript',
        }
      },
    }

    const filesToRetrieve = [
      { path: 'valid1.js' },
      { path: 'broken/corrupt_file.js' },
      { path: 'valid2.js' },
    ]

    const { retrievedFiles, failedFiles } = await retriever.retrieveFiles(
      mockGitProvider,
      'test-owner/test-repo',
      filesToRetrieve,
      'main'
    )

    // Failed file isolated: 2 retrieved successfully, 1 recorded in failedFiles
    assert.equal(retrievedFiles.length, 2)
    assert.equal(retrievedFiles[0].path, 'valid1.js')
    assert.equal(retrievedFiles[1].path, 'valid2.js')

    assert.equal(failedFiles.length, 1)
    assert.equal(failedFiles[0].path, 'broken/corrupt_file.js')
    assert.equal(failedFiles[0].status, 'failed')
    assert.ok(failedFiles[0].error.includes('404 File Not Found'))
  })
})

describe('Code Review Agent: FindingNormalizer & Schema Compliance', () => {
  const normalizer = new FindingNormalizer()

  it('normalizes arbitrary severity and category variants into canonical schema', () => {
    const rawFindings = [
      {
        severity: 'fatal', // synonym for critical
        category: 'bug_risk', // synonym for bug
        title: 'Null pointer exception on null dereference',
        description: 'May throw TypeError at runtime',
        file: '../unsafe/path/foo.js', // directory traversal
        lineStart: '12',
        lineEnd: '14',
        recommendation: 'Add null check',
      },
      {
        severity: 'warning', // synonym for medium
        category: 'code_style', // synonym for style
        title: 'Trailing whitespace',
        description: 'Excess whitespace found',
        file: '/src/bar.js',
        lineStart: 0, // invalid line number -> normalized to 1
        lineEnd: -5,
        recommendation: 'Trim whitespace',
      },
    ]

    const normalized = normalizer.normalizeFindings(rawFindings)

    assert.equal(normalized.length, 2)

    // Item 1
    assert.equal(normalized[0].severity, 'critical')
    assert.equal(normalized[0].category, 'bug')
    assert.equal(normalized[0].file, 'unsafe/path/foo.js') // sanitized traversal
    assert.equal(normalized[0].line_start, 12)
    assert.equal(normalized[0].line_end, 14)

    // Item 2
    assert.equal(normalized[1].severity, 'medium')
    assert.equal(normalized[1].category, 'style')
    assert.equal(normalized[1].file, 'src/bar.js')
    assert.equal(normalized[1].line_start, 1)
    assert.equal(normalized[1].line_end, 1)
  })
})

describe('Code Review Agent: Analysis Provider Replaceability & Mock Provider', () => {
  it('instantiates MockAnalysisProvider and executes deterministic analysis', async () => {
    const mockProvider = new MockAnalysisProvider()

    const findings = await mockProvider.analyzeFile({
      path: 'src/auth.js',
      content: 'const payload = jwt.decode(token);\nconsole.log(payload);',
      language: 'javascript',
    })

    assert.equal(findings.length, 2)
    const severities = findings.map(f => f.severity)
    assert.ok(severities.includes('critical'))
    assert.ok(severities.includes('low'))
  })

  it('CodeAnalyzer isolates an analyzer crash on a single file', async () => {
    const mockProvider = new MockAnalysisProvider({
      simulatedErrorPaths: ['src/failing.js'],
    })

    const analyzer = new CodeAnalyzer({ provider: mockProvider })

    const files = [
      { path: 'src/good.js', content: 'const x = 1;', language: 'javascript' },
      { path: 'src/failing.js', content: 'broken syntax', language: 'javascript' },
      { path: 'src/good2.js', content: 'const y = 2;', language: 'javascript' },
    ]

    const result = await analyzer.analyzeFiles(files)
    assert.equal(result.analyzedCount, 2)
    assert.equal(result.errorCount, 1)
  })
})

describe('Code Review Agent: Full Deterministic Review Lifecycle on Sample Repository', () => {
  it('analyzes sample repository fixture and matches expected findings', async () => {
    // 1. Read files directly from fixture directory
    const fixtureFiles = [
      'auth/jwt_auth.js',
      'database/userRepository.js',
      'services/passwordService.js',
      'routes/authRoutes.js',
      'utils/helpers.js',
      'ignored/bundle.min.js',
      'package-lock.json',
      'assets/logo.png',
    ]

    const discoveredEntries = fixtureFiles.map(relPath => {
      const fullPath = path.join(SAMPLE_REPO_DIR, relPath)
      const stat = fs.existsSync(fullPath) ? fs.statSync(fullPath) : { size: 100 }
      return { path: relPath, size: stat.size }
    })

    // 2. Stage: Filter
    const filter = new FileFilter()
    const { eligible, skipped } = filter.filterFiles(discoveredEntries)

    // Assert ignored assets were filtered out
    assert.equal(eligible.length, 5)
    assert.equal(skipped.length, 3)
    assert.ok(skipped.some(s => s.path === 'ignored/bundle.min.js'))
    assert.ok(skipped.some(s => s.path === 'package-lock.json'))
    assert.ok(skipped.some(s => s.path === 'assets/logo.png'))

    // 3. Stage: Retrieval
    const mockProvider = {
      async getFileContent(_, filePath) {
        const fullPath = path.join(SAMPLE_REPO_DIR, filePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        return { content, language: 'javascript' }
      },
    }

    const retriever = new FileRetriever()
    const { retrievedFiles, failedFiles } = await retriever.retrieveFiles(
      mockProvider,
      'test-org/sample-repo',
      eligible,
      'main'
    )

    assert.equal(retrievedFiles.length, 5)
    assert.equal(failedFiles.length, 0)

    // 4. Stage: Analysis (RuleBasedAnalysisProvider)
    const ruleProvider = new RuleBasedAnalysisProvider()
    const analyzer = new CodeAnalyzer({ provider: ruleProvider })
    const { rawFindings } = await analyzer.analyzeFiles(retrievedFiles)

    // 5. Stage: Normalization
    const normalizer = new FindingNormalizer()
    const filesMap = new Map(retrievedFiles.map(f => [f.path, f]))
    const normalizedFindings = normalizer.normalizeFindings(rawFindings, filesMap)

    // 6. Stage: Summarization
    const summarizer = new ReviewSummarizer()
    const summary = summarizer.summarize({
      normalizedFindings,
      retrievedFiles,
      failedFiles,
      executionTimeMs: 150,
    })

    // 7. Verify Results against Expected Findings Fixture
    const expectedRaw = fs.readFileSync(EXPECTED_FINDINGS_PATH, 'utf8')
    const expectedFindings = JSON.parse(expectedRaw)

    assert.equal(normalizedFindings.length, expectedFindings.length)

    // Verify finding categories and severities
    const criticals = normalizedFindings.filter(f => f.severity === 'critical')
    assert.equal(criticals.length, 2, 'Should detect 2 critical vulnerabilities (JWT decode & SQLi)')

    const highs = normalizedFindings.filter(f => f.severity === 'high')
    assert.equal(highs.length, 1, 'Should detect 1 high performance issue (sync bcrypt)')

    const mediums = normalizedFindings.filter(f => f.severity === 'medium')
    assert.equal(mediums.length, 1, 'Should detect 1 medium security issue (auth route rate limiting)')

    const lows = normalizedFindings.filter(f => f.severity === 'low')
    assert.equal(lows.length, 1, 'Should detect 1 low style issue (console.log)')

    // Verify Summary
    assert.equal(summary.verdict, 'failed', 'Verdict must be "failed" when critical vulnerabilities exist')
    assert.ok(summary.score < 60, 'Quality score must have substantial deductions for 2 criticals + 1 high')
    assert.equal(summary.metrics.totalFiles, 5)
    assert.ok(summary.summaryMarkdown.includes('CRITICAL BLOCKER'))
  })
})

describe('Code Review Agent: Review Job Lifecycle Status Transitions', () => {
  it('manages queued -> running -> completed transition lifecycle', async () => {
    const jobState = {
      id: 'job-12345',
      status: 'queued',
      progress: 0,
    }

    const updates = []

    const mockSupabase = {
      from(table) {
        return {
          insert(payload) {
            return {
              select() {
                return {
                  single() {
                    return { data: { id: 'job-12345', ...payload }, error: null }
                  },
                }
              },
            }
          },
          update(patch) {
            updates.push(patch)
            Object.assign(jobState, patch)
            return {
              eq(col, val) {
                return {
                  select() {
                    return {
                      single() {
                        return { data: { ...jobState }, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
          upsert() {
            return { error: null }
          },
        }
      },
    }

    const mockRepo = {
      id: 'repo-abc',
      full_name: 'test/repo',
      provider: 'github',
      default_branch: 'main',
    }

    const mockGitProvider = {
      async getFileTree() {
        return [{ path: 'index.js', size: 100 }]
      },
      async getFileContent() {
        return { content: 'console.log("hello");', language: 'javascript' }
      },
      async getLatestCommit() {
        return { sha: 'abcdef123456', author: 'tester', message: 'test commit' }
      },
    }

    const reviewService = new ReviewService({
      analyzer: new CodeAnalyzer({ provider: new MockAnalysisProvider() }),
    })

    const result = await reviewService.executePipeline({
      supabaseClient: mockSupabase,
      user: { id: 'user-xyz' },
      repo: mockRepo,
      job: { id: 'job-12345', commit_sha: 'abcdef123456' },
      gitProvider: mockGitProvider,
      targetBranch: 'main',
      startTime: Date.now(),
    })

    // Verify progression: started with running (progress: 15), ended with completed (progress: 100)
    assert.equal(jobState.status, 'completed')
    assert.equal(jobState.progress, 100)
    assert.ok(updates.some(u => u.status === 'running'))
    assert.ok(updates.some(u => u.status === 'completed'))
    assert.equal(result.job.status, 'completed')
  })

  it('transitions to "failed" when pipeline throws unrecoverable fatal error', async () => {
    const jobState = {
      id: 'job-fatal-999',
      status: 'queued',
      progress: 0,
    }

    const mockSupabase = {
      from(table) {
        return {
          update(patch) {
            Object.assign(jobState, patch)
            return {
              eq() {
                return { error: null }
              },
            }
          },
          insert() {
            return { error: null }
          },
        }
      },
    }

    const failingCollector = {
      async collectFiles() {
        throw new Error('Fatal unrecoverable Git provider corruption')
      },
    }

    const reviewService = new ReviewService({
      collector: failingCollector,
      retriever: {
        async retrieveFiles() {
          throw new Error('Fatal unrecoverable retrieval abort')
        },
      },
    })

    await assert.rejects(async () => {
      await reviewService.executePipeline({
        supabaseClient: mockSupabase,
        user: { id: 'user-xyz' },
        repo: { id: 'repo-abc', full_name: 'test/fatal-repo' },
        job: { id: 'job-fatal-999', commit_sha: '111222' },
        gitProvider: {},
        targetBranch: 'main',
        startTime: Date.now(),
      })
    }, /Fatal unrecoverable retrieval abort/)

    // Status was updated to 'failed'
    assert.equal(jobState.status, 'failed')
    assert.ok(jobState.error_message.includes('Fatal unrecoverable'))
  })
})
