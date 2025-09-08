# Registration Workflow Design

## Overview
This document outlines the redesigned registration workflow for EducLove, implementing a two-step registration process with email verification and profile completion.

## User Journey

### Step 1: Account Creation (`/create-account`)
**Purpose**: Create user credentials and verify email domain

**Components**:
- Email input (with domain validation for French educational institutions)
- Password input (with strength indicator)
- Password confirmation input
- Real-time validation feedback

**Flow**:
1. User clicks "S'inscrire" from WelcomePage
2. Navigates to `/create-account` (CreateAccountPage)
3. User enters:
   - Email (must be from approved educational domains)
   - Password (must meet strength requirements)
   - Password confirmation (must match)
4. On submit:
   - Create Auth0 user account
   - Send verification email
   - Store user in MongoDB with `email_verified: false`
   - Redirect to `/email-verification`

### Step 2: Email Verification (`/email-verification`)
**Purpose**: Confirm email ownership

**Components**:
- Verification status message
- Resend email button
- Instructions for checking email

**Flow**:
1. User receives verification email
2. Clicks verification link in email
3. Auth0 marks email as verified
4. User returns to app
5. System updates MongoDB: `email_verified: true`
6. Redirect to `/complete-profile` (renamed from `/register`)

### Step 3: Profile Completion (`/complete-profile`)
**Purpose**: Collect essential profile information

**Components**:
- Personal information form:
  - First name
  - Birth date (year/month/day dropdowns)
  - Gender selection
  - Location (city with map picker option)
  - Relationship preferences
  - Profile photo upload

**Flow**:
1. User fills out profile information
2. On submit:
   - Create/update profile in MongoDB
   - Mark profile as complete
   - Redirect to `/dashboard`

## Technical Architecture

### Frontend Routes
```typescript
// Public routes
<Route path="/" element={<WelcomePage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/create-account" element={<CreateAccountPage />} />
<Route path="/email-verification" element={<EmailVerificationPage />} />

// Semi-protected route (requires auth but not full profile)
<Route element={<ProtectedRoute requireProfile={false} />}>
  <Route path="/complete-profile" element={<CompleteProfilePage />} />
</Route>

// Fully protected routes (requires auth + complete profile)
<Route element={<ProtectedRoute requireProfile={true} />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/profiles" element={<ProfilesPage />} />
  // ... other protected routes
</Route>
```

### Backend Endpoints

#### Registration Flow
- `POST /api/auth/register/validate-email` - Validate email domain
- `POST /api/auth/register/validate-password` - Check password strength
- `POST /api/auth/register/create` - Create Auth0 user and send verification
- `POST /api/auth/register/resend-verification` - Resend verification email
- `GET /api/auth/verify-email-status` - Check if email is verified

#### Profile Completion
- `POST /api/profiles/complete` - Save initial profile data
- `GET /api/profiles/completion-status` - Check if profile is complete

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  auth0_id: String,
  email_verified: Boolean,
  profile_completed: Boolean,
  created_at: Date,
  updated_at: Date
}
```

#### Profiles Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId, // Reference to Users collection
  first_name: String,
  birth_date: Date,
  gender: String,
  location: {
    city: String,
    coordinates: [Number, Number]
  },
  looking_for: String,
  looking_for_gender: String,
  profile_photo_url: String,
  created_at: Date,
  updated_at: Date
}
```

## Security Considerations

1. **Email Domain Validation**
   - Only allow French educational domains (ac-*.fr, education.gouv.fr)
   - Validate on both frontend and backend

2. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

3. **Email Verification**
   - Required before accessing any protected routes
   - Verification link expires after 24 hours
   - Rate limiting on resend requests

4. **Profile Completion**
   - Required before accessing main app features
   - Validate all inputs on backend
   - Sanitize user inputs to prevent XSS

## State Management

### Auth Store Updates
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  // ... other fields
}
```

### Navigation Guards
1. **Not authenticated** → Redirect to `/login`
2. **Authenticated but email not verified** → Redirect to `/email-verification`
3. **Email verified but profile incomplete** → Redirect to `/complete-profile`
4. **Fully authenticated with complete profile** → Allow access

## UI/UX Improvements

### Visual Feedback
- Real-time validation with color-coded indicators
- Password strength meter
- Loading states during API calls
- Success/error toast notifications

### Progressive Disclosure
- Step indicators showing registration progress
- Clear messaging about what's required at each step
- Option to save and continue later (for profile completion)

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly error messages
- High contrast mode support

## Error Handling

### Common Scenarios
1. **Email already registered**
   - Show clear message
   - Offer password reset option

2. **Verification email not received**
   - Provide resend button
   - Show spam folder reminder
   - Support contact option

3. **Session timeout during registration**
   - Save progress locally
   - Allow resuming from last step

4. **Network errors**
   - Retry mechanisms
   - Offline detection
   - Clear error messages

## Testing Strategy

### Unit Tests
- Form validation logic
- Password strength calculator
- Email domain validator

### Integration Tests
- Complete registration flow
- Email verification process
- Profile completion

### E2E Tests
- Full user journey from landing to dashboard
- Error scenarios
- Edge cases (browser back button, etc.)

## Migration Plan

### Phase 1: Update Backend
1. Add `profile_completed` field to users
2. Create profile completion endpoints
3. Update authentication middleware

### Phase 2: Update Frontend
1. Rename RegisterPage to CompleteProfilePage
2. Update routing logic
3. Implement new ProtectedRoute logic

### Phase 3: Data Migration
1. Mark existing users as `profile_completed: true`
2. Ensure backward compatibility

## Future Enhancements

1. **Social Login Integration**
   - Google OAuth for educational accounts
   - Microsoft Azure AD for academic institutions

2. **Multi-step Profile Builder**
   - Additional optional fields
   - Interests and hobbies
   - Teaching subjects and levels

3. **Verification Improvements**
   - SMS verification as backup
   - Institutional verification via API

4. **Onboarding Experience**
   - Welcome tutorial
   - Profile tips
   - Feature highlights
