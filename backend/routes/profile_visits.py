"""API routes for profile visit tracking."""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from auth import get_current_user
from database.mongo_database import MongoDatabase
from models import ProfileVisit

router = APIRouter(prefix="/api/profile-visits", tags=["profile-visits"])


def get_db():
    """Dependency to get database instance."""
    from main import db

    return db


@router.post("/{profile_id}", status_code=status.HTTP_201_CREATED)
async def record_visit(
    profile_id: str,
    current_user: dict = Depends(get_current_user),
    db: MongoDatabase = Depends(get_db),
):
    """
    Record that the current user visited a profile.
    If the profile was already visited, updates the timestamp (resets TTL).
    """
    user_id = current_user["_id"]

    # Verify the profile exists
    profile = db.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Don't record visits to own profile
    if current_user.get("profile_id") == profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record visit to your own profile",
        )

    try:
        visit_id = db.record_profile_visit(user_id, profile_id)
        return {
            "message": "Visit recorded successfully",
            "visit_id": visit_id,
            "user_id": user_id,
            "visited_profile_id": profile_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record visit: {str(e)}",
        )


@router.get("/{profile_id}/visited", response_model=bool)
async def check_if_visited(
    profile_id: str,
    current_user: dict = Depends(get_current_user),
    db: MongoDatabase = Depends(get_db),
):
    """
    Check if the current user has visited a specific profile.
    Returns true if visited within the TTL period, false otherwise.
    """
    user_id = current_user["_id"]

    try:
        has_visited = db.has_visited_profile(user_id, profile_id)
        return has_visited
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check visit status: {str(e)}",
        )


@router.get("/", response_model=List[dict])
async def get_visited_profiles(
    limit: int = 100,
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
    db: MongoDatabase = Depends(get_db),
):
    """
    Get the list of profiles the current user has visited.
    Returns visits ordered by most recent first.
    """
    user_id = current_user["_id"]

    try:
        visits = db.get_visited_profiles(user_id, limit=limit, skip=skip)
        return visits
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve visited profiles: {str(e)}",
        )


@router.get("/ids", response_model=List[str])
async def get_visited_profile_ids(
    current_user: dict = Depends(get_current_user),
    db: MongoDatabase = Depends(get_db),
):
    """
    Get just the profile IDs that the current user has visited.
    Useful for filtering search results.
    """
    user_id = current_user["_id"]

    try:
        profile_ids = db.get_visited_profile_ids(user_id)
        return profile_ids
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve visited profile IDs: {str(e)}",
        )


@router.get("/count", response_model=int)
async def get_visit_count(
    current_user: dict = Depends(get_current_user),
    db: MongoDatabase = Depends(get_db),
):
    """
    Get the total number of profiles the current user has visited.
    """
    user_id = current_user["_id"]

    try:
        count = db.get_visit_count(user_id)
        return count
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve visit count: {str(e)}",
        )
