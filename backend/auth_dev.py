"""
Development authentication module for local testing.
This module provides a simple email/password authentication system for development.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from jose import jwt
from typing import Optional
import hashlib
import os

# Development router for auth endpoints
router = APIRouter(prefix="/auth/dev", tags=["dev-auth"])

# Simple in-memory user store for development
DEV_USERS = {}

# JWT Configuration for development
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for dev

class DevLoginRequest(BaseModel):
    email: EmailStr
    password: str

class DevRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class DevTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

def hash_password(password: str) -> str:
    """Simple password hashing for development"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_dev_token(user_data: dict) -> str:
    """Create a development JWT token"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": user_data["email"],
        "email": user_data["email"],
        "name": user_data["name"],
        "picture": user_data.get("picture", "https://ui-avatars.com/api/?name=" + user_data["name"].replace(" ", "+")),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": "educlove-dev"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register", response_model=DevTokenResponse)
async def dev_register(request: DevRegisterRequest):
    """
    Development endpoint to register a new user.
    Creates a user and returns a JWT token.
    """
    # Check if user already exists
    if request.email in DEV_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create user
    user_data = {
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    DEV_USERS[request.email] = user_data
    
    # Create token
    token = create_dev_token(user_data)
    
    return DevTokenResponse(
        access_token=token,
        user={
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": f"https://ui-avatars.com/api/?name={user_data['name'].replace(' ', '+')}"
        }
    )

@router.post("/login", response_model=DevTokenResponse)
async def dev_login(request: DevLoginRequest):
    """
    Development endpoint to login a user.
    Validates credentials and returns a JWT token.
    """
    # Check if user exists
    if request.email not in DEV_USERS:
        # Auto-create user for easier development
        user_data = {
            "email": request.email,
            "password_hash": hash_password(request.password),
            "name": request.email.split("@")[0].replace(".", " ").title(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        DEV_USERS[request.email] = user_data
    else:
        user_data = DEV_USERS[request.email]
        # Validate password
        if user_data["password_hash"] != hash_password(request.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    
    # Create token
    token = create_dev_token(user_data)
    
    return DevTokenResponse(
        access_token=token,
        user={
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": f"https://ui-avatars.com/api/?name={user_data['name'].replace(' ', '+')}"
        }
    )

@router.get("/users")
async def get_dev_users():
    """
    Development endpoint to list all registered users.
    Useful for debugging.
    """
    return {
        "users": [
            {
                "email": email,
                "name": data["name"],
                "created_at": data["created_at"]
            }
            for email, data in DEV_USERS.items()
        ]
    }

# Pre-populate with some test users
DEV_USERS.update({
    "marie.dupont@educnat.gouv.fr": {
        "email": "marie.dupont@educnat.gouv.fr",
        "password_hash": hash_password("password123"),
        "name": "Marie Dupont",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    "jean.martin@educnat.gouv.fr": {
        "email": "jean.martin@educnat.gouv.fr",
        "password_hash": hash_password("password123"),
        "name": "Jean Martin",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    "sophie.bernard@educnat.gouv.fr": {
        "email": "sophie.bernard@educnat.gouv.fr",
        "password_hash": hash_password("password123"),
        "name": "Sophie Bernard",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
})
