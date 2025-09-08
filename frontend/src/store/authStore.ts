import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, DecodedGoogleToken } from '../types'
import { authService } from '../services/api'
import { jwtDecode } from 'jwt-decode'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  loginWithGoogle: (credential: string) => Promise<void>
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

        loginWithGoogle: async (credential: string) => {
          set({ isLoading: true, error: null })
          
          try {
            // Decode the Google JWT to get user info
            const decodedToken = jwtDecode<DecodedGoogleToken>(credential)
            
            // Store the Google credential as our auth token
            // In production, you'd exchange this with your backend for a proper token
            authService.setAuthToken(credential)
            
            // Get user info from backend (which will create/update user in MongoDB)
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
              error: 'Échec de la connexion. Veuillez réessayer.'
            })
            authService.logout()
          }
        },

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
