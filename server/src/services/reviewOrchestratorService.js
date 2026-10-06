import { reviewService } from './review/index.js'

/**
 * Backward compatibility facade delegating to the modular ReviewService pipeline.
 */
export const reviewOrchestratorService = reviewService
