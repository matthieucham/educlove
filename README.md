# EducLove - Educational Dating Platform

A modern dating platform designed specifically for educators to connect, share experiences, and build meaningful relationships within the education community.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript - Modern UI library with type safety
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **React Router** - Client-side routing
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing utilities

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **Uvicorn** - ASGI server for running FastAPI
- **PyMongo** - MongoDB driver for Python
- **Pydantic** - Data validation using Python type annotations

### Database
- **MongoDB** - NoSQL database for flexible data storage
- **Mongo Express** - Web-based MongoDB admin interface

### Infrastructure
- **Docker & Docker Compose** - Containerization for database services
- **Python Virtual Environment** - Isolated Python dependencies

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Docker** and **Docker Compose**
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd educlove
```

### 2. Database Setup

Start MongoDB and Mongo Express using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- MongoDB on port `27017`
- Mongo Express (admin UI) on port `8081` - Access at http://localhost:8081

### 3. Backend Setup

#### Create and activate Python virtual environment:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Python dependencies:

```bash
pip install -r requirements.txt
```

#### Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- API: http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs
- Alternative API Documentation (ReDoc): http://localhost:8000/redoc

### 4. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

#### Install Node dependencies:

```bash
npm install
```

#### Start the development server:

```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## 🚀 Quick Start (All Services)

### Using the Startup Script (Recommended)

We provide a convenient bash script that launches all required services with a single command:

```bash
./start-all.sh
```

This script will:
- Start Docker containers (MongoDB and Mongo Express)
- Launch the backend server with hot reload enabled
- Launch the frontend server with hot reload enabled
- Handle graceful shutdown when you press CTRL+C

**Prerequisites for the script:**
- Ensure you have already installed dependencies:
  ```bash
  # Backend dependencies
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  
  # Frontend dependencies
  cd ../frontend
  npm install
  ```

**Service URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- MongoDB: mongodb://localhost:27017
- Mongo Express: http://localhost:8081

**To stop all services:** Press `CTRL+C` in the terminal where the script is running.

### Manual Startup (Alternative)

If you prefer to start services individually in separate terminals:

#### Terminal 1 - Database:
```bash
docker-compose up -d
```

#### Terminal 2 - Backend:
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 3 - Frontend:
```bash
cd frontend
npm run dev
```

## 🧪 Running Tests

### Frontend Tests

Run all frontend tests:
```bash
cd frontend
npm test
```

Run tests in watch mode:
```bash
cd frontend
npm run test:watch
```

Run tests with coverage:
```bash
cd frontend
npm run test:coverage
```

### Backend Tests

Run backend tests (if available):
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pytest
```

## 📁 Project Structure

```
educlove/
├── backend/                 # Backend API (FastAPI)
│   ├── database/            # Database models and connections
│   │   ├── database.py      # Base database interface
│   │   ├── mongo_database.py # MongoDB implementation
│   │   ├── sample_profiles.json # Sample data
│   ├── seed_db.py           # Database seeding script
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # Pydantic models
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Python virtual environment (git-ignored)
│
├── frontend/                # Frontend React application
│   ├── src/
│   │   ├── assets/          # Static assets (images, etc.)
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Main App component
│   │   ├── main.tsx         # Application entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Public static files
│   ├── package.json         # Node dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── tsconfig.json        # TypeScript configuration
│
├── docker-compose.yml       # Docker services configuration
├── package.json             # Root package.json (if needed)
└── README.md               # This file
```

## 🔧 Development Workflow

1. **Make changes** to the code
2. **Backend auto-reloads** thanks to the `--reload` flag
3. **Frontend auto-reloads** thanks to Vite's HMR (Hot Module Replacement)
4. **Run tests** to ensure nothing is broken
5. **Commit changes** with descriptive messages

## 📝 Available Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Backend Commands
- `uvicorn main:app --reload` - Start development server
- `pytest` - Run tests (if configured)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure Docker is running
- Check if MongoDB container is up: `docker ps`
- Verify MongoDB is accessible: `docker logs educlove-mongo`

### Backend Import Errors
- Make sure you're in the `backend` directory when running the server
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Port Already in Use
- Backend (8000): `lsof -i :8000` and kill the process
- Frontend (5173): `lsof -i :5173` and kill the process
- MongoDB (27017): `docker-compose down` and restart

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests to ensure everything works
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to the branch: `git push origin feature/your-feature`
6. Create a Pull Request

## 📄 License

[Add your license information here]

## 👥 Team

[Add team information here]

## 📞 Support

For issues or questions, please [create an issue](link-to-issues) or contact the development team.
