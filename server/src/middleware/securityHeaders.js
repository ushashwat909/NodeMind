/**
 * Security headers middleware enforcing OWASP best practices
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking by forbidding embedding in frames/iframes
  res.setHeader('X-Frame-Options', 'DENY')

  // Enable XSS filter in browsers that support it
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // HTTP Strict Transport Security (production HTTPS only, never localhost dev)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Remove Express powered by header
  res.removeHeader('X-Powered-By')

  next()
}
