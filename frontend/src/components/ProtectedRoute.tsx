import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

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

  // Render child routes if authenticated
  return <Outlet />
}
