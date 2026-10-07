import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, useRouteError, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import RootLayout from './layouts/RootLayout'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReviewResultsPage = lazy(() => import('./pages/ReviewResultsPage'))
const GlimpsePage = lazy(() => import('./pages/GlimpsePage'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteFallback() {
  return (
    <div className="route-loading-fallback" role="status" aria-label="Loading view">
      <div className="route-loader-spinner" />
    </div>
  )
}

function RouteErrorBoundary() {
  const error = useRouteError()
  console.error('[Application Route Error]:', error)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#07090e' }}>
      <div style={{ maxWidth: 480, width: '100%', background: '#0e121a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: '1rem' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 650, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Application Notice
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {error?.message || 'An unexpected state occurred while displaying this view.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
            style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
          >
            Reload View &#8635;
          </button>
          <Link
            to="/dashboard"
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
          >
            Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteFallback />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <Login />
          </Suspense>
        ),
      },
      { path: 'signin', element: <Navigate to="/login" replace /> },
      {
        path: 'signup',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <SignUp />
          </Suspense>
        ),
      },
      {
        path: 'glimpse',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <GlimpsePage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<RouteFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews/:id',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<RouteFallback />}>
              <ReviewResultsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  )
}
