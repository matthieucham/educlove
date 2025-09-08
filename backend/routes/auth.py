"""
Authentication routes for the EducLove API.
"""

from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from models import User
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from database.mongo_database import MongoDatabase

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_db():
    """Dependency to get database instance."""
    from main import db

    return db


@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get the current authenticated user's information.
    This endpoint also ensures the user is mirrored in MongoDB.
    """
    # Upsert user to ensure they exist in our database
    user_data = current_user.model_dump()
    user_id = db.upsert_user(user_data)

    # Get the full user data from database
    user = db.get_user_by_id(user_id)

    return {
        "user_id": user_id,
        "sub": user["sub"],
        "email": user["email"],
        "name": user.get("name"),
        "picture": user.get("picture"),
        "provider": user.get("provider"),
        "has_profile": bool(user.get("profile_id")),
        "profile_id": user.get("profile_id"),
        "email_verified": user.get(
            "email_verified", True
        ),  # Default to True for OAuth users
        "profile_completed": user.get(
            "profile_completed", False
        ),  # Default to False for new users
    }
