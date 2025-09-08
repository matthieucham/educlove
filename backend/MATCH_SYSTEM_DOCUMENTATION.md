# Match Registration System Documentation

## Overview

The EducLove backend implements a comprehensive match registration system that allows authenticated users to create connections with other profiles. The system uses external identity providers for authentication and mirrors users in MongoDB for data persistence.

## Architecture

### 1. Authentication System

#### External Identity Provider Integration
- The system is designed to work with any JWT-based identity provider (Auth0, Firebase, AWS Cognito, Google OAuth, etc.)
- Authentication is pluggable and non-intrusive
- JWT tokens are validated in the `auth.py` module

#### Configuration
Set these environment variables for your identity provider:
```bash
# For production (with JWKS validation)
export JWKS_URI="https://your-provider/.well-known/jwks.json"
export JWT_ISSUER="https://your-provider"
export JWT_AUDIENCE="your-audience"
export JWT_ALGORITHM="RS256"

# For development/testing
export SKIP_JWT_VERIFICATION=true
export JWT_SECRET="your-secret-key-for-dev"
```

#### User Mirroring
- When a user authenticates, their information is automatically mirrored in MongoDB
- User data is stored in the `users` collection with the following structure:
  - `sub`: Subject identifier from the identity provider (unique)
  - `email`: User's email address
  - `name`: User's display name
  - `picture`: Profile picture URL
  - `provider`: Identity provider name
  - `profile_id`: Link to their EducLove profile (if created)
  - `created_at`: First authentication timestamp
  - `last_login`: Most recent authentication timestamp

### 2. Data Models

#### User Model
```python
{
    "sub": "google-oauth2|123456789",  # Unique identifier from provider
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://example.com/photo.jpg",
    "provider": "google",
    "profile_id": "507f1f77bcf86cd799439011",  # Optional, links to Profile
    "created_at": "2024-01-01T10:00:00Z",
    "last_login": "2024-01-15T14:30:00Z"
}
```

#### Match Model
```python
{
    "_id": "507f1f77bcf86cd799439011",
    "initiator_user_id": "507f1f77bcf86cd799439011",  # User who sent the request
    "target_profile_id": "507f191e810c19729de860ea",   # Profile being matched with
    "status": "pending",  # pending | accepted | rejected | blocked
    "message": "Hi! I'd love to connect with you.",    # Optional message
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
}
```

### 3. Match Registration Flow

#### Step 1: User Authentication
1. User authenticates with external identity provider
2. Frontend receives JWT token
3. Frontend includes token in Authorization header: `Bearer <token>`

#### Step 2: User Mirroring
1. Backend validates JWT token
2. Extracts user information from token claims
3. Creates or updates user in MongoDB `users` collection
4. Returns user's MongoDB ID

#### Step 3: Profile Creation (if needed)
1. Authenticated user creates their EducLove profile
2. Profile is stored in `profiles` collection
3. User's `profile_id` is updated to link to their profile

#### Step 4: Match Registration
1. User browses profiles and finds someone they want to match with
2. User sends POST request to `/matches/` with target profile ID
3. Backend creates match record with status "pending"
4. Target user receives the match request

#### Step 5: Match Response
1. Target user can accept, reject, or block the match
2. Only the target user can update match status
3. If accepted, system checks for mutual match

## API Endpoints

### Authentication

#### `GET /auth/me`
Get current authenticated user information and ensure they're mirrored in MongoDB.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
    "user_id": "507f1f77bcf86cd799439011",
    "sub": "google-oauth2|123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://example.com/photo.jpg",
    "provider": "google",
    "has_profile": true,
    "profile_id": "507f191e810c19729de860ea"
}
```

### Match Management

#### `POST /matches/`
Register a new match with another user's profile.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
    "target_profile_id": "507f191e810c19729de860ea",
    "message": "Hi! I'd love to connect with you."
}
```

**Response (201 Created):**
```json
{
    "match_id": "507f1f77bcf86cd799439011",
    "status": "pending",
    "message": "Match request sent successfully"
}
```

**Error Responses:**
- `404 Not Found`: Target profile doesn't exist
- `409 Conflict`: Match already exists with this profile

#### `GET /matches/`
Get all matches for the current user.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Query Parameters:**
- `status` (optional): Filter by status (pending, accepted, rejected, blocked)

**Response:**
```json
{
    "matches": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "initiator_user_id": "507f1f77bcf86cd799439011",
            "target_profile_id": "507f191e810c19729de860ea",
            "status": "pending",
            "message": "Hi!",
            "created_at": "2024-01-15T14:30:00Z",
            "updated_at": "2024-01-15T14:30:00Z",
            "matched_profile": { /* Profile data */ },
            "direction": "sent"  // or "received"
        }
    ],
    "total": 1
}
```

#### `PATCH /matches/{match_id}/status`
Update the status of a match (only for target user).

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Query Parameters:**
- `status`: New status (accepted, rejected, blocked)

**Response:**
```json
{
    "message": "Match status updated to accepted",
    "is_mutual_match": false
}
```

**Error Responses:**
- `403 Forbidden`: User is not authorized to update this match
- `404 Not Found`: Match doesn't exist

#### `GET /matches/{match_id}`
Get details of a specific match.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "initiator_user_id": "507f1f77bcf86cd799439011",
    "target_profile_id": "507f191e810c19729de860ea",
    "status": "pending",
    "message": "Hi!",
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
}
```

## Security Considerations

### Authentication
1. **Token Validation**: Always validate JWT tokens in production
2. **HTTPS Only**: Use HTTPS in production to protect tokens in transit
3. **Token Expiration**: Implement token refresh mechanism
4. **CORS Configuration**: Configure CORS appropriately for your frontend domains

### Authorization
1. **Match Updates**: Only target users can accept/reject matches
2. **Match Viewing**: Users can only view matches they're part of
3. **Profile Creation**: Users can only create one profile per account

### Data Protection
1. **Input Validation**: All inputs are validated using Pydantic models
2. **SQL Injection**: MongoDB queries use parameterized queries
3. **Rate Limiting**: Implement rate limiting to prevent abuse (not included in base implementation)

## Database Indexes

For optimal performance, create these MongoDB indexes:

```javascript
// Users collection
db.users.createIndex({ "sub": 1 }, { unique: true })
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "profile_id": 1 })

// Matches collection
db.matches.createIndex({ "initiator_user_id": 1 })
db.matches.createIndex({ "target_profile_id": 1 })
db.matches.createIndex({ "status": 1 })
db.matches.createIndex({ 
    "initiator_user_id": 1, 
    "target_profile_id": 1 
}, { unique: true })

// Profiles collection
db.profiles.createIndex({ "email": 1 })
db.profiles.createIndex({ "city": 1 })
db.profiles.createIndex({ "looking_for": 1 })
```

## Testing

### Development Setup
1. Start MongoDB:
   ```bash
   docker-compose up -d mongodb
   ```

2. Set environment variables:
   ```bash
   export SKIP_JWT_VERIFICATION=true
   export JWT_SECRET=your-secret-key-for-dev
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Testing with curl

1. Create a test JWT token (you can use jwt.io for testing):
   ```json
   {
     "sub": "test-user-123",
     "email": "test@example.com",
     "name": "Test User"
   }
   ```

2. Test authentication:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/auth/me
   ```

3. Register a match:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"target_profile_id": "PROFILE_ID", "message": "Hello!"}' \
        http://localhost:8000/matches/
   ```

## Integration with Frontend

### Authentication Flow
1. User logs in via identity provider
2. Frontend stores JWT token (localStorage or secure cookie)
3. Include token in all API requests: `Authorization: Bearer <token>`

### Match Registration UI
1. Display profiles to authenticated users
2. Add "Match" button on each profile
3. On click, call `POST /matches/` endpoint
4. Handle success/error responses appropriately
5. Update UI to show pending match status

### Match Management UI
1. Create a "My Matches" page
2. Fetch matches with `GET /matches/`
3. Display sent and received matches separately
4. For received matches, show accept/reject buttons
5. Update match status with `PATCH /matches/{id}/status`

## Future Enhancements

1. **Real-time Notifications**: Implement WebSocket for instant match notifications
2. **Mutual Match Celebrations**: Special UI when mutual match occurs
3. **Match Expiration**: Auto-expire pending matches after X days
4. **Block List**: Prevent blocked users from sending new matches
5. **Match History**: Track all match status changes
6. **Analytics**: Track match success rates and user engagement
7. **Recommendation System**: Suggest profiles based on match history
