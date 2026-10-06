import { CodeAnalysisProvider } from './CodeAnalysisProvider.js'
import { MockAnalysisProvider } from './MockAnalysisProvider.js'
import { RuleBasedAnalysisProvider } from './RuleBasedAnalysisProvider.js'
import { AIAnalysisProvider } from './AIAnalysisProvider.js'

export {
  CodeAnalysisProvider,
  MockAnalysisProvider,
  RuleBasedAnalysisProvider,
  AIAnalysisProvider,
}

const providerRegistry = new Map()

// Register default providers
providerRegistry.set('mock', (opts) => new MockAnalysisProvider(opts))
providerRegistry.set('rule_based', (opts) => new RuleBasedAnalysisProvider(opts))
providerRegistry.set('rules', (opts) => new RuleBasedAnalysisProvider(opts))
providerRegistry.set('ai', (opts) => new AIAnalysisProvider(opts))

/**
 * Register a custom analysis provider
 * @param {string} name
 * @param {(opts: object) => CodeAnalysisProvider} factory
 */
export function registerAnalysisProvider(name, factory) {
  providerRegistry.set(name.toLowerCase(), factory)
}

/**
 * Factory to instantiate a code analysis provider by name
 * @param {string} [name] Provider name ('ai' | 'rule_based' | 'mock')
 * @param {object} [options={}]
 * @returns {CodeAnalysisProvider}
 */
export function getAnalysisProvider(name, options = {}) {
  const selectedName = (name || process.env.ANALYSIS_PROVIDER || 'rule_based').toLowerCase()
  const factory = providerRegistry.get(selectedName)

  if (!factory) {
    // If unknown provider requested, default to rule_based
    return new RuleBasedAnalysisProvider(options)
  }

  return factory(options)
}
