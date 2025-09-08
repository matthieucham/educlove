// User and Authentication Types
export interface User {
  user_id: string
  sub: string
  email: string
  name?: string
  picture?: string
  provider: string
  has_profile: boolean
  profile_id?: string
  email_verified?: boolean
  profile_completed?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

// Profile Types
export interface Profile {
  id: string
  userId: string
  name: string
  age: number
  location: string
  teachingSubject: string
  teachingExperience: number
  lookingFor: 'friendship' | 'casual' | 'serious'
  sexualOrientation: string
  description: string
  photos: Photo[]
  interests: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Photo {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

// Search and Filter Types
export interface SearchFilters {
  gender?: string[]
  ageRange?: { min: number; max: number }
  location?: LocationFilter[]
  lookingFor?: string[]
  subjects?: string[]
}

export interface LocationFilter {
  city: string
  radius: number
  coordinates?: { lat: number; lng: number }
}

// Match Types
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'

export interface Match {
  id: string
  initiator_user_id: string
  target_profile_id: string
  status: MatchStatus
  message?: string
  created_at: Date
  updated_at: Date
  matched_profile?: Profile
  direction?: 'sent' | 'received'
  is_mutual?: boolean
}

export interface MatchRequest {
  target_profile_id: string
  message?: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ProfilesResponse {
  profiles: Profile[]
  total: number
  page: number
  limit: number
}

export interface MatchesResponse {
  matches: Match[]
  total: number
}

// Google OAuth Types
export interface GoogleCredentialResponse {
  credential?: string
  select_by?: string
  clientId?: string
}

export interface DecodedGoogleToken {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
  locale: string
  iat: number
  exp: number
}
