import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  requireProfile?: boolean
}

export const ProtectedRoute = ({ requireProfile = true }: ProtectedRouteProps = {}) => {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Check auth status on mount
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    // Show loading spinner while checking auth
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  // Check if email is verified
  if (user && user.email_verified === false) {
    // Redirect to email verification page if email is not verified
    return <Navigate to="/email-verification" state={{ email: user.email }} replace />
  }

  // Check if profile is completed (only for routes that require it)
  if (requireProfile && user && !user.profile_completed) {
    // Allow access to complete-profile page
    if (location.pathname === '/complete-profile') {
      return <Outlet />
    }
    // Redirect to profile completion page if profile is not completed
    return <Navigate to="/complete-profile" replace />
  }

  // Render child routes if all checks pass
  return <Outlet />
}
