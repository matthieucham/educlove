import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleAuthProviderWrapper } from './components/GoogleAuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleAuthProviderWrapper>
      <App />
    </GoogleAuthProviderWrapper>
  </StrictMode>,
)
