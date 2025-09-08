import { GoogleOAuthProvider } from '@react-oauth/google'
import type { ReactNode } from 'react'

interface GoogleAuthProviderWrapperProps {
  children: ReactNode
}

// Google OAuth Client ID - You'll need to replace this with your actual client ID
// Get it from https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE'

export const GoogleAuthProviderWrapper = ({ children }: GoogleAuthProviderWrapperProps) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  )
}
