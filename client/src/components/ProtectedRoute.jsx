import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-loading-screen" role="status" aria-label="Loading authentication">
        <div className="loading-card">
          <div className="brand-icon loading-spin-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>
            </svg>
          </div>
          <div className="loading-text-wrap">
            <span className="loading-title">Verifying Session</span>
            <span className="loading-sub">Connecting to Supabase...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Preserve attempted destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? children : <Outlet />
}
