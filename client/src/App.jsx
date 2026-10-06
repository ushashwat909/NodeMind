import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import RootLayout from '@/layouts/RootLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import './App.css'

const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/Login'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ReviewResultsPage = lazy(() => import('@/pages/ReviewResultsPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function RouteFallback() {
  return (
    <div className="route-loading-fallback" role="status" aria-label="Loading view">
      <div className="route-loader-spinner" />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
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
