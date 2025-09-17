# AGENTS.md - EducLove Project

## Project Overview

EducLove is a dating platform designed specifically for educators to connect and build meaningful relationships within the education community. The application consists of a React/TypeScript frontend, FastAPI/Python backend, and MongoDB database.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for routing
- **Zustand** for state management
- **React Hook Form** with Zod for form validation
- **Vitest** for testing
- **Axios** for API calls

### Backend
- **FastAPI** (Python web framework)
- **Uvicorn** (ASGI server)
- **PyMongo** (MongoDB driver)
- **Pydantic** for data validation
- **python-jose** for JWT authentication
- **python-dotenv** for environment variables

### Database
- **MongoDB** (NoSQL database)
- **Mongo Express** (Web admin interface)

## Development Environment Setup

### Prerequisites
- Node.js v18+
- Python 3.11+
- Docker and Docker Compose
- Git

### Quick Start - All Services

Use the provided startup script:
```bash
./start-all.sh
```

This launches all services (MongoDB, backend, frontend) with hot reload enabled.

### Manual Setup

#### 1. Database Setup
```bash
docker-compose up -d
```
- MongoDB runs on port 27017
- Mongo Express admin UI on port 8081

#### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API available at http://localhost:8000
- Swagger docs at http://localhost:8000/docs

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend available at http://localhost:5173

## Code Style Guidelines

### Frontend (TypeScript/React)
- Use functional components with hooks
- TypeScript strict mode enabled
- Component files: PascalCase (e.g., `ProfilePage.tsx`)
- Utility files: camelCase (e.g., `authStore.ts`)
- Use absolute imports from `src/`
- Place reusable components in `src/components/`
- Page components in `src/pages/`
- API calls through `src/services/api.ts`
- Type definitions in `src/types/`

### Backend (Python/FastAPI)
- Follow PEP 8 style guide
- Use type hints for all function parameters and returns
- Pydantic models for request/response validation
- Repository pattern for database operations
- Place routes in `backend/routes/`
- Database models in `backend/models.py`
- Repository classes in `backend/database/repositories/`

### Component Structure
```typescript
// Example React component structure
import { useState, useEffect } from 'react';
import { ComponentProps } from '../types';

const ComponentName = ({ prop1, prop2 }: ComponentProps) => {
  // State and hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### API Endpoint Structure
```python
# Example FastAPI endpoint structure
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models import ResponseModel

router = APIRouter(prefix="/api/resource", tags=["resource"])

@router.get("/", response_model=List[ResponseModel])
async def get_resources(
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_database)
):
    """Get list of resources with pagination."""
    try:
        return await db.resources.find().skip(skip).limit(limit).to_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Testing Instructions

### Frontend Testing

#### Unit Tests
```bash
cd frontend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

#### UI Testing Guidelines
**IMPORTANT: When testing login functionality:**
- **DO NOT** fill login form fields manually field by field
- **DO** click on the test account links provided in the login page
- The login page contains clickable test account buttons that auto-fill credentials:
  - marie.dupont@educnat.gouv.fr / password123
  - jean.martin@educnat.gouv.fr / password123
  - sophie.bernard@educnat.gouv.fr / password123

Example UI test approach:
```javascript
// Correct approach for login testing
await page.goto('http://localhost:5173/login');
// Click on test account button instead of filling fields
await page.click('button:has-text("marie.dupont@educnat.gouv.fr")');
await page.click('button[type="submit"]');

// Incorrect approach (DO NOT USE)
// await page.fill('#email', 'marie.dupont@educnat.gouv.fr');
// await page.fill('#password', 'password123');
```

### Backend Testing

#### Running Tests
```bash
cd backend
source venv/bin/activate
pytest                          # Run all tests
pytest -v                       # Verbose output
pytest test_profiles.py         # Specific test file
pytest -k "test_function_name"  # Specific test
```

#### Test Database
Tests should use a separate test database to avoid affecting development data:
```python
# In conftest.py or test files
TEST_DATABASE_URL = "mongodb://localhost:27017/educlove_test"
```

### E2E Testing
```bash
# Backend E2E tests
cd backend/e2e-tests
pytest test_search_functionality.py
pytest test_geocoding_integration.py
```

## Database Management

### Seeding Sample Data
```bash
cd backend
python seed_db.py
```

### Database Migrations
```bash
cd backend
python migrate_enums.py  # For enum field migrations
```

### MongoDB Commands
```bash
# Connect to MongoDB
docker exec -it educlove-mongo mongosh

# Common commands
use educlove
db.users.find()
db.profiles.find()
db.search_criteria.find()
```

## API Documentation

### Authentication
The application uses JWT tokens for authentication:
- Development mode: Email/password authentication
- Production mode: Email/password authentication managed by Auth0 service
- Token stored in localStorage as `auth-storage`

### Key API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

#### Profiles
- `GET /api/profiles` - List profiles with filtering
- `GET /api/profiles/{id}` - Get specific profile
- `PUT /api/profiles/{id}` - Update profile
- `POST /api/profiles/{id}/photos` - Upload photos

#### Search & Matching
- `GET /api/search-criteria` - Get user's search criteria
- `PUT /api/search-criteria` - Update search criteria
- `GET /api/matches` - Get matches based on criteria
- `POST /api/matches/{id}/like` - Like a profile
- `POST /api/matches/{id}/pass` - Pass on a profile

#### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/{conversation_id}` - Get messages in conversation
- `POST /api/messages` - Send message

## Common Development Tasks

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Update navigation if needed
4. Add corresponding API endpoint if required
5. Write tests for the new page

### Adding a New API Endpoint
1. Create route handler in `backend/routes/`
2. Add Pydantic models in `backend/models.py`
3. Implement repository methods if needed
4. Update API documentation
5. Write tests for the endpoint

### Modifying Database Schema
1. Update Pydantic models in `backend/models.py`
2. Create migration script if needed
3. Update repository methods
4. Update seed data if applicable
5. Test with existing data

## Environment Variables

### Backend (.env)
```bash
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=educlove
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=30
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

## Debugging Tips

### Frontend Debugging
- React DevTools for component inspection
- Network tab for API calls
- Console for error messages
- Vite provides detailed error overlays

### Backend Debugging
- FastAPI automatic docs at `/docs`
- Use `print()` or `logging` for debug output
- Interactive debugger: `import pdb; pdb.set_trace()`
- Check MongoDB data with Mongo Express

### Common Issues

#### CORS Errors
- Backend CORS middleware configured in `main.py`
- Ensure frontend API URL matches backend host

#### Authentication Issues
- Check JWT token in localStorage
- Verify token expiration
- Ensure auth headers sent with requests

#### Database Connection
- Verify MongoDB container is running: `docker ps`
- Check connection string in `.env`
- Review MongoDB logs: `docker logs educlove-mongo`

## Deployment Considerations

### Production Build
```bash
# Frontend
cd frontend
npm run build  # Creates dist/ folder

# Backend
cd backend
pip freeze > requirements.txt  # Update dependencies
```

### Security Checklist
- [ ] Environment variables properly configured
- [ ] JWT secret key is strong and unique
- [ ] CORS settings restricted to production domain
- [ ] Database has authentication enabled
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] XSS protection in frontend
- [ ] HTTPS enabled in production

## Performance Optimization

### Frontend
- Lazy load routes and components
- Optimize images (WebP format preferred)
- Use React.memo for expensive components
- Implement virtual scrolling for long lists

### Backend
- Add database indexes for common queries
- Implement caching for frequently accessed data
- Use pagination for list endpoints
- Optimize database queries with projections

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commits:
- `feat: add user profile editing`
- `fix: resolve login redirect issue`
- `docs: update API documentation`
- `test: add profile component tests`
- `refactor: optimize database queries`

### Pre-commit Checklist
- [ ] All tests passing
- [ ] Linting errors resolved
- [ ] Documentation updated if needed
- [ ] No console.log or debug code
- [ ] Environment variables documented

## Additional Resources

### Project Documentation
- `README.md` - General project overview
- `PHASE1_IMPLEMENTATION.md` - Implementation details
- `REGISTRATION_WORKFLOW_DESIGN.md` - Registration flow
- `LOCAL_AUTH_SETUP.md` - Authentication setup
- `backend/MATCH_SYSTEM_DOCUMENTATION.md` - Matching algorithm
- `backend/GEOCODING_INTEGRATION.md` - Location services

### External Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Contact & Support

For questions or issues:
1. Check existing documentation
2. Review closed issues/PRs
3. Create a detailed issue with reproduction steps
4. Include relevant error messages and logs
