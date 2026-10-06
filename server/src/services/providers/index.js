import { GitProvider } from './GitProvider.js'
import { GitHubProvider, gitHubProvider } from './GitHubProvider.js'
import { BadRequestError } from '../../utils/errors.js'

const providers = new Map()
providers.set('github', gitHubProvider)

/**
 * Returns the requested GitProvider instance.
 * Enables adding GitLab, Bitbucket, Azure DevOps without refactoring app code.
 * @param {string} [name='github']
 * @returns {GitProvider}
 */
export function getGitProvider(name = 'github') {
  const normalized = (name || 'github').toLowerCase()
  const provider = providers.get(normalized)

  if (!provider) {
    throw new BadRequestError(`VCS Provider "${name}" is not supported. Supported providers: ${Array.from(providers.keys()).join(', ')}`)
  }

  return provider
}

/**
 * Registers an additional provider instance (e.g. GitLabProvider)
 * @param {string} name
 * @param {GitProvider} providerInstance
 */
export function registerGitProvider(name, providerInstance) {
  providers.set(name.toLowerCase(), providerInstance)
}

export { GitProvider, GitHubProvider, gitHubProvider }
