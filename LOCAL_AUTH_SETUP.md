# Local Development Authentication Setup

## Overview
This document describes the local development authentication system implemented for EducLove, which allows developers to test the application without needing Google OAuth configuration.

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
export SKIP_JWT_VERIFICATION=true
./venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Access the Application
- Open http://localhost:5174 (or 5173)
- Navigate to the login page
- Toggle to "Mode développement" (Development Mode)

## 🔐 Test Accounts

The following test accounts are pre-configured:

| Email | Password | Name |
|-------|----------|------|
| marie.dupont@educnat.gouv.fr | password123 | Marie Dupont |
| jean.martin@educnat.gouv.fr | password123 | Jean Martin |
| sophie.bernard@educnat.gouv.fr | password123 | Sophie Bernard |

**Note:** You can also use any email/password combination - the system will automatically create a new account on first login.

## 🏗️ Architecture

### Backend Components

#### 1. **auth_dev.py** - Development Authentication Module
- Provides local email/password authentication
- Creates JWT tokens for development
- Maintains in-memory user store
- Endpoints:
  - `POST /auth/dev/login` - Login with email/password
  - `POST /auth/dev/register` - Register new user
  - `GET /auth/dev/users` - List all registered users (debug)

#### 2. **auth.py** - Main Authentication Module
- Handles JWT token validation
- Supports multiple identity providers
- Falls back to simple JWT implementation when `python-jose` is unavailable
- Configured via environment variables

#### 3. **main.py** - FastAPI Application
- Conditionally includes dev auth router when `SKIP_JWT_VERIFICATION=true`
- Provides protected endpoints requiring authentication

### Frontend Components

#### 1. **authStore.ts** - Zustand Authentication Store
- Manages authentication state
- Provides methods for:
  - `loginWithGoogle()` - Google OAuth login
  - `loginWithEmail()` - Development email/password login
  - `logout()` - Clear authentication
  - `checkAuth()` - Verify token validity

#### 2. **api.ts** - API Service Layer
- Axios instance with interceptors
- Automatically adds Bearer token to requests
- Handles 401 responses by redirecting to login
- Services:
  - `authService` - Authentication operations
  - `profileService` - Profile management
  - `matchService` - Match operations

#### 3. **LoginPage.tsx** - Login Interface
- Toggle between Google OAuth and Development mode
- Form validation for email/password
- Displays test account information in dev mode

#### 4. **ProtectedRoute.tsx** - Route Protection
- Wraps protected routes
- Redirects to login if not authenticated
- Shows loading state during auth check

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# JWT Configuration
SKIP_JWT_VERIFICATION=true  # Enable development mode
JWT_SECRET=your-secret-key-for-dev

# MongoDB
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=educlove

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

#### Frontend (.env)
```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Google OAuth (optional for dev)
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

## 🧪 Testing the Authentication Flow

### 1. Login Flow
1. Navigate to `/login`
2. Ensure "Mode développement" is selected
3. Enter test credentials or any email/password
4. Click "Se connecter"
5. Should redirect to `/dashboard`

### 2. Protected Routes
- Try accessing `/dashboard` without login → Redirects to `/login`
- Login → Access granted to protected routes
- Refresh page → Session persists (localStorage)

### 3. API Authentication
- Open DevTools → Network tab
- After login, observe API calls
- Should see `Authorization: Bearer <token>` header

### 4. Logout Flow
1. Click logout (when implemented in UI)
2. Token cleared from localStorage
3. Redirected to login page

## 🐛 Troubleshooting

### "Module 'jose' not found"
```bash
cd backend
./venv/bin/pip install "python-jose[cryptography]"
```

### "Module 'dotenv' not found"
```bash
cd backend
./venv/bin/pip install python-dotenv
```

### Python Version Mismatch
If you see errors about Python 3.11 vs 3.13:
```bash
cd backend
rm -rf venv
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

### Backend Not Accepting Connections
- Ensure MongoDB is running
- Check if port 8000 is available
- Verify CORS settings include your frontend URL

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` in frontend/.env
- Ensure backend is running on the specified port
- Check browser console for CORS errors

## 📝 Development Workflow

### Adding New Protected Endpoints

1. **Backend**: Use the `get_current_user` dependency
```python
@app.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.name}"}
```

2. **Frontend**: Calls are automatically authenticated
```typescript
const response = await api.get('/protected')
// Token automatically included
```

### Creating New Users Programmatically

```bash
curl -X POST http://localhost:8000/auth/dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@educnat.gouv.fr",
    "password": "password123",
    "name": "New User"
  }'
```

## 🚀 Production Considerations

**⚠️ IMPORTANT**: The development authentication system is for local development only!

For production:
1. Set `SKIP_JWT_VERIFICATION=false`
2. Configure proper JWT validation
3. Use real identity provider (Google OAuth, Auth0, etc.)
4. Remove or disable `/auth/dev/*` endpoints
5. Use secure JWT secrets
6. Enable HTTPS
7. Configure proper CORS origins

## 📚 Related Documentation

- [Phase 1 Implementation](./PHASE1_IMPLEMENTATION.md) - Overall implementation details
- [Frontend Review](./frontend/FRONTEND_REVIEW_AND_ENHANCEMENTS.md) - Frontend architecture
- [Match System](./backend/MATCH_SYSTEM_DOCUMENTATION.md) - Match system documentation

## ✅ Summary

The local development authentication system provides:
- ✅ Simple email/password authentication for development
- ✅ JWT token generation and validation
- ✅ Protected route implementation
- ✅ Persistent sessions via localStorage
- ✅ Test accounts for quick testing
- ✅ Auto-registration for new users
- ✅ Full integration with backend API

This allows developers to work on the application without needing external authentication providers configured, significantly speeding up the development process.
