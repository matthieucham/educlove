import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '../types'
import { authService } from '../services/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  loginWithEmail: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        loginWithEmail: async (email: string, password: string) => {
          set({ isLoading: true, error: null })

          try {
            // Call development auth endpoint
            const response = await authService.devLogin(email, password)

            // Store the token
            authService.setAuthToken(response.access_token)

            // Get user info from backend
            const userInfo = await authService.getCurrentUser()

            set({
              user: userInfo,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } catch (error) {
            console.error('Login error:', error)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Email ou mot de passe incorrect'
            })
          }
        },

        register: async (email: string, password: string, name: string) => {
          set({ isLoading: true, error: null })

          try {
            // Call development auth endpoint
            const response = await authService.devRegister(email, password, name)

            // Store the token
            authService.setAuthToken(response.access_token)

            // Get user info from backend
            const userInfo = await authService.getCurrentUser()

            set({
              user: userInfo,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } catch (error) {
            console.error('Registration error:', error)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Échec de l\'inscription. Cet email est peut-être déjà utilisé.'
            })
          }
        },

        logout: () => {
          authService.logout()
          set({
            user: null,
            isAuthenticated: false,
            error: null
          })
        },

        checkAuth: async () => {
          const token = authService.getToken()

          if (!token) {
            set({ isAuthenticated: false, user: null })
            return
          }

          set({ isLoading: true })

          try {
            // Verify token is still valid by fetching user info
            const userInfo = await authService.getCurrentUser()

            set({
              user: userInfo,
              isAuthenticated: true,
              isLoading: false
            })
          } catch (error) {
            // Token is invalid or expired
            authService.logout()
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            })
          }
        },

        clearError: () => {
          set({ error: null })
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
)
