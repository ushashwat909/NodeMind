import crypto from 'node:crypto'
import { logger } from '../../lib/logger.js'

/**
 * FindingPersister Stage
 * Persists files, normalized findings, results, and audit history to Supabase PostgreSQL.
 */
export class FindingPersister {
  /**
   * Generates a deterministic checksum for a file's content
   */
  _computeChecksum(content) {
    return crypto.createHash('sha256').update(content || '').digest('hex')
  }

  /**
   * Persists all review artifacts into Supabase PostgreSQL
   * @param {object} param0
   * @param {object} param0.supabaseClient RLS-scoped Supabase client
   * @param {object} param0.user Authenticated user
   * @param {object} param0.repo Repository record
   * @param {object} param0.job Review job record
   * @param {Array<object>} param0.retrievedFiles
   * @param {Array<object>} param0.failedFiles
   * @param {Array<object>} param0.normalizedFindings
   * @param {object} param0.summary
   * @returns {Promise<object>} Persistence result
   */
  async persistReviewArtifacts({
    supabaseClient,
    user,
    repo,
    job,
    retrievedFiles = [],
    failedFiles = [],
    normalizedFindings = [],
    summary = {},
  }) {
    logger.info(`[FindingPersister] Persisting artifacts for job ${job.id} (${normalizedFindings.length} findings, ${retrievedFiles.length} files)...`)

    const fileRecordMap = new Map()

    // 1. Persist Review Files (Retrieved files)
    for (const file of retrievedFiles) {
      const fileFindingsCount = normalizedFindings.filter(f => f.file === file.path).length
      const checksum = this._computeChecksum(file.content)

      const { data: fileRec, error: fileErr } = await supabaseClient
        .from('review_files')
        .insert({
          review_job_id: job.id,
          repository_id: repo.id,
          user_id: user.id,
          file_path: file.path,
          language: file.language || 'text',
          status: 'analyzed',
          lines_count: file.linesCount || 0,
          findings_count: fileFindingsCount,
          checksum,
        })
        .select('id, file_path')
        .single()

      if (!fileErr && fileRec) {
        fileRecordMap.set(file.path, fileRec.id)
      } else if (fileErr) {
        logger.warn(`[FindingPersister] Error persisting review_file for ${file.path}: ${fileErr.message}`)
      }
    }

    // Persist Failed / Skipped Files
    for (const file of failedFiles) {
      const { data: failedRec, error: failErr } = await supabaseClient
        .from('review_files')
        .insert({
          review_job_id: job.id,
          repository_id: repo.id,
          user_id: user.id,
          file_path: file.path,
          language: 'unknown',
          status: file.status || 'failed',
          lines_count: 0,
          findings_count: 0,
          error_message: file.error || 'File skipped during retrieval',
        })
        .select('id, file_path')
        .single()

      if (!failErr && failedRec) {
        fileRecordMap.set(file.path, failedRec.id)
      }
    }

    // 2. Persist Normalized Findings
    if (normalizedFindings.length > 0) {
      const findingsPayload = normalizedFindings.map(f => ({
        review_job_id: job.id,
        repository_id: repo.id,
        review_file_id: fileRecordMap.get(f.file) || null,
        user_id: user.id,
        file_path: f.file,
        severity: f.severity,
        category: f.category,
        title: f.title,
        description: f.description,
        line_start: f.line_start,
        line_end: f.line_end,
        snippet: f.snippet || null,
        recommendation: f.recommendation,
        suggested_fix: f.suggested_fix || null,
        cwe_id: f.cwe_id || null,
        owasp_category: f.owasp_category || null,
        status: 'open',
      }))

      // Batch insert findings in chunks of 50 to prevent payload limits
      const CHUNK_SIZE = 50
      for (let i = 0; i < findingsPayload.length; i += CHUNK_SIZE) {
        const chunk = findingsPayload.slice(i, i + CHUNK_SIZE)
        const { error: findingsErr } = await supabaseClient
          .from('review_findings')
          .insert(chunk)

        if (findingsErr) {
          logger.error(`[FindingPersister] Error persisting findings chunk (${i}-${i + chunk.length}):`, findingsErr.message)
        }
      }
    }

    // 3. Persist Review Results
    const { error: resultErr } = await supabaseClient
      .from('review_results')
      .upsert({
        review_job_id: job.id,
        repository_id: repo.id,
        user_id: user.id,
        verdict: summary.verdict || 'passed',
        score: summary.score ?? 100,
        summary_markdown: summary.summaryMarkdown || '',
        strengths: summary.strengths || [],
        improvements: summary.improvements || [],
        critical_issues: summary.metrics?.criticalCount || 0,
        high_issues: summary.metrics?.highCount || 0,
        medium_issues: summary.metrics?.mediumCount || 0,
        low_issues: summary.metrics?.lowCount || 0,
        info_issues: summary.metrics?.infoCount || 0,
        rules_evaluated: (summary.metrics?.totalFiles || 0) * 12,
        execution_time_ms: summary.metrics?.executionTimeMs || 0,
      }, { onConflict: 'review_job_id' })

    if (resultErr) {
      logger.error('[FindingPersister] Error persisting review_result:', resultErr.message)
    }

    // 4. Update Repository's last_reviewed_at
    await supabaseClient
      .from('repositories')
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq('id', repo.id)

    // 5. Append Audit Log to review_history
    await supabaseClient
      .from('review_history')
      .insert({
        repository_id: repo.id,
        user_id: user.id,
        review_job_id: job.id,
        event_type: 'job_completed',
        actor_id: user.id,
        commit_sha: job.commit_sha,
        quality_score: summary.score,
        critical_count: summary.metrics?.criticalCount || 0,
        high_count: summary.metrics?.highCount || 0,
        description: `Autonomous review completed. Verdict: ${summary.verdict}, Score: ${summary.score}%, Findings: ${normalizedFindings.length}.`,
      })

    logger.info(`[FindingPersister] Persistence complete for job ${job.id}`)
    return {
      filesPersisted: retrievedFiles.length + failedFiles.length,
      findingsPersisted: normalizedFindings.length,
    }
  }
}
