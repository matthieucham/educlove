from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.mongo_database import MongoDatabase
from contextlib import asynccontextmanager
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

logger = logging.getLogger(__name__)

# Import route modules
from routes import auth, profiles, registration, profile_visits

# Define the database instance
db = MongoDatabase()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to the database on startup
    db.connect()
    yield
    # Disconnect from the database on shutdown
    db.disconnect()


app = FastAPI(
    title="EducLove API",
    description="Dating platform for educators - Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
    ],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(registration.router, prefix="/api")
app.include_router(profile_visits.router)

# Include development auth router if in development mode
if os.getenv("SKIP_JWT_VERIFICATION", "false").lower() == "true":
    from auth_dev import router as dev_auth_router

    app.include_router(dev_auth_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the EducLove API"}
