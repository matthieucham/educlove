import axios, { AxiosError } from 'axios'
import type { 
  User, 
  Profile, 
  Match, 
  MatchRequest, 
  MatchStatus,
  SearchFilters,
  MatchesResponse 
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Authentication Service
export const authService = {
  // Get current user info from backend
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Development login with email/password
  devLogin: async (email: string, password: string): Promise<{ access_token: string; user: any }> => {
    const response = await api.post('/auth/dev/login', { email, password })
    return response.data
  },

  // Development register with email/password
  devRegister: async (email: string, password: string, name: string): Promise<{ access_token: string; user: any }> => {
    const response = await api.post('/auth/dev/register', { email, password, name })
    return response.data
  },

  // Set the auth token (called after Google OAuth or dev login)
  setAuthToken: (token: string) => {
    localStorage.setItem('auth_token', token)
  },

  // Clear auth data
  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token')
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token')
  }
}

// Profile Service
export const profileService = {
  // Create a new profile
  createProfile: async (profile: Omit<Profile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ profile_id: string; message: string }> => {
    const response = await api.post('/profiles/', profile)
    return response.data
  },

  // Get all profiles with optional filters
  getProfiles: async (filters?: SearchFilters): Promise<Profile[]> => {
    const response = await api.get('/profiles', { params: filters })
    return response.data
  },

  // Get a specific profile
  getProfile: async (profileId: string): Promise<Profile> => {
    const response = await api.get(`/profiles/${profileId}`)
    return response.data
  },

  // Update profile
  updateProfile: async (profileId: string, data: Partial<Profile>): Promise<Profile> => {
    const response = await api.patch(`/profiles/${profileId}`, data)
    return response.data
  },

  // Delete profile
  deleteProfile: async (profileId: string): Promise<void> => {
    await api.delete(`/profiles/${profileId}`)
  }
}

// Match Service
export const matchService = {
  // Send a match request
  sendMatchRequest: async (request: MatchRequest): Promise<{ match_id: string; status: string; message: string }> => {
    const response = await api.post('/matches/', request)
    return response.data
  },

  // Get all matches for current user
  getMyMatches: async (status?: MatchStatus): Promise<MatchesResponse> => {
    const params = status ? { status } : undefined
    const response = await api.get('/matches/', { params })
    return response.data
  },

  // Get specific match details
  getMatchDetails: async (matchId: string): Promise<Match> => {
    const response = await api.get(`/matches/${matchId}`)
    return response.data
  },

  // Update match status (accept/reject/block)
  updateMatchStatus: async (matchId: string, status: MatchStatus): Promise<{ message: string; is_mutual_match: boolean }> => {
    const response = await api.patch(`/matches/${matchId}/status`, null, {
      params: { status }
    })
    return response.data
  }
}

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return error.response.data.detail
    }
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
  }
  return 'Une erreur inattendue s\'est produite'
}
