import 'dotenv/config'

/**
 * Validates critical environment variables at startup
 */
function validateEnv() {
  const missing = []

  if (!process.env.SUPABASE_URL) {
    missing.push('SUPABASE_URL')
  }

  if (!process.env.SUPABASE_ANON_KEY) {
    missing.push('SUPABASE_ANON_KEY')
  }

  if (missing.length > 0) {
    console.error(`[Config Error] Missing required environment variables: ${missing.join(', ')}`)
    console.error('Please configure server/.env based on server/.env.example.')
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  // Warn if service role key is not configured in production
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase')
  ) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Config Warning] SUPABASE_SERVICE_ROLE_KEY is not configured. Admin overrides will be unavailable.')
    }
  }
}

validateEnv()

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || 'https://byztyberaoyczdaffbbe.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '120', 10),
    reviewMaxRequests: 20, // max 20 review job runs per minute per user/IP
  },
}

export default config
