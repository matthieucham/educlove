# Auth0 Registration Workflow Setup

This document explains how to set up and test the new Auth0-based email/password registration workflow for EducLove.

## Overview

The registration workflow now includes:
1. Email/password registration with domain restrictions (only educational emails)
2. Password strength validation
3. Email verification via Auth0
4. Integration with existing MongoDB user database

## Architecture

### Backend Components
- **`backend/services/auth0_service.py`**: Core Auth0 integration service
- **`backend/routes/registration.py`**: Registration API endpoints
- **`backend/database/repositories/users.py`**: User database operations

### Frontend Components
- **`frontend/src/pages/CreateAccountPage.tsx`**: Registration form with real-time validation
- **`frontend/src/pages/EmailVerificationPage.tsx`**: Post-registration email verification page
- **`frontend/src/pages/WelcomePage.tsx`**: Updated with link to new registration

### API Endpoints
- `POST /api/auth/register/create`: Create new user account
- `POST /api/auth/register/login`: Login with email/password
- `POST /api/auth/register/resend-verification`: Resend verification email
- `GET /api/auth/register/validate-email/{email}`: Validate email domain
- `POST /api/auth/register/validate-password`: Validate password strength
- `POST /api/auth/register/reset-password`: Request password reset

## Setup Instructions

### 1. Auth0 Configuration

1. Create an Auth0 account at https://auth0.com
2. Create a new application (Regular Web Application)
3. Configure the following settings:
   - Application Type: Regular Web Application
   - Allowed Callback URLs: `http://localhost:5173/dashboard`
   - Allowed Logout URLs: `http://localhost:5173/`
   - Allowed Web Origins: `http://localhost:5173`

4. Create a Database Connection:
   - Go to Authentication > Database
   - Create a new database connection named "Username-Password-Authentication"
   - Enable password strength requirements

5. Get your credentials from the Settings tab:
   - Domain
   - Client ID
   - Client Secret

### 2. Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=educlove

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
AUTH0_CONNECTION=Username-Password-Authentication

# For development without Auth0
SKIP_AUTH0=false  # Set to true to use mock authentication

# Existing JWT config for Google OAuth (if still needed)
SKIP_JWT_VERIFICATION=true
JWT_SECRET=your-secret-key-for-dev
```

### 3. Install Dependencies

Backend:
```bash
cd backend
pip install -r requirements.txt
```

The `requirements.txt` now includes:
- `requests` for Auth0 API calls
- All existing dependencies

### 4. Run the Application

Start the backend:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Testing the Registration Flow

### Development Mode (Without Auth0)

For local development without Auth0 setup:

1. Set `SKIP_AUTH0=true` in your backend `.env` file
2. The system will use mock authentication
3. Emails won't actually be sent, but the flow will work

### Production Mode (With Auth0)

1. Navigate to http://localhost:5173
2. Click "S'inscrire" to go to the registration page
3. Enter:
   - First name (optional)
   - Educational email (e.g., `test@ac-paris.fr`)
   - Strong password (8+ chars, uppercase, lowercase, number, special char)
   - Confirm password

4. Submit the form
5. You'll be redirected to the email verification page
6. Check your email for the verification link
7. Click the link to verify your email
8. Login with your credentials

### Testing Domain Restrictions

The following domains are allowed:
- All French académies: `ac-paris.fr`, `ac-lyon.fr`, etc. (32 académies in total)
- Ministry domains: `education.gouv.fr`, `enseignementsup-recherche.gouv.fr`

Try registering with:
- ✅ `teacher@ac-paris.fr` - Should work
- ✅ `prof@education.gouv.fr` - Should work
- ✅ `marie.dupont@ac-versailles.fr` - Should work
- ❌ `user@gmail.com` - Should be rejected
- ❌ `test@company.com` - Should be rejected

For testing in development mode with `SKIP_AUTH0=true`, use any valid educational domain email.

### Testing Password Strength

The password must contain:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

Examples:
- ✅ `SecurePass123!` - Strong password
- ❌ `password` - Too weak
- ❌ `12345678` - No letters
- ❌ `Password` - No numbers or special chars

## API Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:8000/api/auth/register/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@ac-paris.fr",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!",
    "first_name": "Marie"
  }'
```

### Validate email domain:
```bash
curl http://localhost:8000/api/auth/register/validate-email/teacher@ac-paris.fr
```

### Validate password strength:
```bash
curl -X POST http://localhost:8000/api/auth/register/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "SecurePass123!"}'
```

### Login with email/password:
```bash
curl -X POST http://localhost:8000/api/auth/register/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@ac-paris.fr",
    "password": "SecurePass123!"
  }'
```

## Troubleshooting

### Common Issues

1. **"Auth0 configuration missing" error**
   - Ensure all Auth0 environment variables are set
   - Or set `SKIP_AUTH0=true` for development

2. **Email not received**
   - Check spam folder
   - Verify Auth0 email settings
   - Ensure email provider is configured in Auth0

3. **Domain validation failing**
   - Check the email domain is in the allowed list
   - Domains are case-insensitive
   - Must be exact match (no wildcards)

4. **Password validation issues**
   - Frontend shows real-time feedback
   - Check all requirements are met
   - Special characters must be from the allowed set

### Debug Mode

To debug Auth0 integration:
1. Check backend logs for detailed error messages
2. Use Auth0 dashboard logs (Monitoring > Logs)
3. Test with `SKIP_AUTH0=true` first to isolate issues

## Security Considerations

1. **Domain Restrictions**: Only educational emails can register
2. **Password Security**: Strong password requirements enforced
3. **Email Verification**: Required before account activation
4. **Rate Limiting**: Consider adding rate limiting to prevent abuse
5. **HTTPS**: Use HTTPS in production for all endpoints
6. **Secrets**: Never commit Auth0 credentials to version control

## Migration from Google OAuth

The system now supports both:
- Google OAuth (existing implementation)
- Auth0 email/password (new implementation)

Users can choose their preferred authentication method. The backend handles both token types.

## Future Enhancements

Consider adding:
1. Social login via Auth0 (Facebook, Google, etc.)
2. Multi-factor authentication (MFA)
3. Password reset flow
4. Account linking (connect Google and email accounts)
5. Custom Auth0 rules for additional validation
6. Webhook integration for user events
