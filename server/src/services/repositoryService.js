import { getGitProvider } from './providers/index.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { logger } from '../lib/logger.js'

export class RepositoryService {
  /**
   * Validates a repository URL / identifier, fetches its metadata, branches, and latest commit
   * without persisting. Used by the interactive frontend connection wizard.
   * @param {string} inputUrl - "https://github.com/owner/repo" or "owner/repo"
   * @param {string} [providerName='github']
   */
  async inspectAndValidateRepository(inputUrl, providerName = 'github') {
    const provider = getGitProvider(providerName)

    // 1. Strict parsing and SSRF defense
    const parsed = provider.parseRepositoryUrl(inputUrl)

    // 2. Fetch remote metadata from provider
    const metadata = await provider.getRepositoryMetadata(parsed.fullName)

    // 3. Fetch available branches
    let branches = [metadata.defaultBranch]
    try {
      branches = await provider.getBranches(parsed.fullName)
      // Ensure default branch is first
      if (branches.includes(metadata.defaultBranch)) {
        branches = [metadata.defaultBranch, ...branches.filter((b) => b !== metadata.defaultBranch)]
      }
    } catch (err) {
      logger.warn(`Could not fetch branch list for ${parsed.fullName}: ${err.message}`)
    }

    // 4. Fetch latest commit on default branch
    let latestCommit = null
    try {
      latestCommit = await provider.getLatestCommit(parsed.fullName, metadata.defaultBranch)
    } catch (err) {
      logger.warn(`Could not fetch latest commit for ${parsed.fullName}: ${err.message}`)
    }

    return {
      valid: true,
      provider: provider.providerName,
      parsed,
      repository: metadata,
      branches,
      latestCommit,
    }
  }

  /**
   * Lists all repositories belonging to the authenticated user
   */
  async listUserRepositories(supabaseClient) {
    const { data, error } = await supabaseClient
      .from('repositories')
      .select('*, review_jobs(count)')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching user repositories:', error.message)
      throw error
    }

    return data || []
  }

  /**
   * Retrieves a single repository by ID
   */
  async getRepositoryById(supabaseClient, repoId) {
    const { data, error } = await supabaseClient
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .single()

    if (error || !data) {
      throw new NotFoundError(`Repository with ID ${repoId} not found or access denied.`)
    }

    return data
  }

  /**
   * Connects and persists a repository for the authenticated user in Supabase
   */
  async connectRepository(supabaseClient, user, { url, fullName, provider = 'github', defaultBranch = null }) {
    const input = url || fullName
    if (!input) {
      throw new BadRequestError('Repository URL or full name is required.')
    }

    const gitProvider = getGitProvider(provider)
    const parsed = gitProvider.parseRepositoryUrl(input)

    // Fetch confirmed metadata from VCS
    const meta = await gitProvider.getRepositoryMetadata(parsed.fullName)

    const finalBranch = defaultBranch || meta.defaultBranch || 'main'

    // Upsert into repositories table using user's RLS-scoped client
    const { data: repo, error } = await supabaseClient
      .from('repositories')
      .upsert(
        {
          user_id: user.id,
          provider: gitProvider.providerName,
          repo_identifier: meta.repoIdentifier,
          name: meta.name,
          full_name: meta.fullName,
          clone_url: meta.cloneUrl,
          html_url: meta.htmlUrl,
          default_branch: finalBranch,
          is_private: meta.isPrivate,
          language: meta.language,
          description: meta.description,
          stars_count: meta.starsCount,
          forks_count: meta.forksCount,
          is_active: true,
          settings: {
            auto_review_prs: true,
            fail_on_critical: true,
            rulesets: ['security', 'performance', 'clean_code'],
            monitored_branches: [finalBranch],
          },
        },
        { onConflict: 'user_id,provider,full_name' }
      )
      .select()
      .single()

    if (error) {
      logger.error('Failed to upsert repository in Supabase:', error.message)
      throw error
    }

    return repo
  }

  /**
   * Fetches branches for a connected repository
   */
  async getRepositoryBranches(supabaseClient, repoId) {
    const repo = await this.getRepositoryById(supabaseClient, repoId)
    const provider = getGitProvider(repo.provider)
    return await provider.getBranches(repo.full_name)
  }

  /**
   * Fetches supported source code file tree for a connected repository
   */
  async getRepositoryTree(supabaseClient, repoId, branch = null) {
    const repo = await this.getRepositoryById(supabaseClient, repoId)
    const provider = getGitProvider(repo.provider)
    const targetBranch = branch || repo.default_branch || 'main'
    return await provider.getFileTree(repo.full_name, targetBranch)
  }

  /**
   * Synchronizes all GitHub repositories for the authenticated user.
   * If token is not passed, falls back to stored token in repository_connections.
   * Batch upserts discovered repositories into public.repositories.
   */
  async syncGitHubRepositories(supabaseClient, user, token = null) {
    let resolvedToken = token

    if (!resolvedToken) {
      const { data: conn } = await supabaseClient
        .from('repository_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'github')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (conn?.access_token_encrypted) {
        resolvedToken = conn.access_token_encrypted
      }
    }

    if (!resolvedToken) {
      throw new BadRequestError('GitHub authentication token is required to synchronize repositories.')
    }

    const provider = getGitProvider('github')

    // 1. Fetch user's GitHub profile
    let ghUser = null
    try {
      ghUser = await provider.getAuthenticatedUser({ token: resolvedToken })
    } catch (err) {
      logger.warn(`Could not fetch GitHub user profile: ${err.message}`)
    }

    // 2. Fetch all repositories owned or accessible by user
    const repos = await provider.getUserRepositories({ token: resolvedToken })

    // 3. Upsert repository connection record if ghUser available
    if (ghUser) {
      try {
        await supabaseClient.from('repository_connections').upsert(
          {
            user_id: user.id,
            provider: 'github',
            account_identifier: ghUser.login,
            account_name: ghUser.name || ghUser.login,
            account_avatar_url: ghUser.avatar_url || null,
            access_token_encrypted: resolvedToken,
            scopes: ['repo', 'read:user', 'user:email'],
            status: 'active',
            metadata: {
              public_repos: ghUser.public_repos,
              total_private_repos: ghUser.total_private_repos,
              last_synced_at: new Date().toISOString(),
            },
          },
          { onConflict: 'user_id,provider,account_identifier' }
        )
      } catch (connErr) {
        logger.warn(`Could not save repository connection: ${connErr.message}`)
      }
    }

    if (!repos || repos.length === 0) {
      return { syncedCount: 0, repositories: [] }
    }

    // 4. Batch upsert repositories into public.repositories
    const reposToUpsert = repos.map((repo) => ({
      user_id: user.id,
      provider: 'github',
      repo_identifier: repo.repoIdentifier,
      name: repo.name,
      full_name: repo.fullName,
      clone_url: repo.cloneUrl,
      html_url: repo.htmlUrl,
      default_branch: repo.defaultBranch || 'main',
      is_private: repo.isPrivate,
      language: repo.language,
      description: repo.description,
      stars_count: repo.starsCount,
      forks_count: repo.forksCount,
      is_active: true,
      settings: {
        auto_review_prs: true,
        fail_on_critical: true,
        rulesets: ['security', 'performance', 'clean_code'],
        monitored_branches: [repo.defaultBranch || 'main'],
      },
    }))

    const batchSize = 25
    const upsertedRepos = []

    for (let i = 0; i < reposToUpsert.length; i += batchSize) {
      const chunk = reposToUpsert.slice(i, i + batchSize)
      const { data, error } = await supabaseClient
        .from('repositories')
        .upsert(chunk, { onConflict: 'user_id,provider,full_name' })
        .select('id, name, full_name, provider, html_url, language, default_branch, is_private, last_reviewed_at, created_at, stars_count, forks_count')

      if (error) {
        logger.error(`Error upserting repository chunk ${i}: ${error.message}`)
        throw error
      }
      if (data) {
        upsertedRepos.push(...data)
      }
    }

    return {
      syncedCount: upsertedRepos.length,
      repositories: upsertedRepos,
    }
  }
}

export const repositoryService = new RepositoryService()

