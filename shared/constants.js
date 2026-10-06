/**
 * Shared constants across client and server
 */

export const SEVERITY_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
}

export const SUPPORTED_LANGUAGES = [
  { id: 'typescript', name: 'TypeScript', ext: '.ts, .tsx', tag: 'TS' },
  { id: 'javascript', name: 'JavaScript', ext: '.js, .jsx', tag: 'JS' },
  { id: 'python', name: 'Python', ext: '.py', tag: 'PY' },
  { id: 'go', name: 'Go', ext: '.go', tag: 'GO' },
  { id: 'rust', name: 'Rust', ext: '.rs', tag: 'RS' },
  { id: 'java', name: 'Java', ext: '.java', tag: 'JV' },
]

export const API_ROUTES = {
  HEALTH: '/api/health',
}
