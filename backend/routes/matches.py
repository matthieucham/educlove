"""
Match routes for the EducLove API.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from auth import get_current_user
from models import User, MatchRequest, MatchStatus
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from database.mongo_database import MongoDatabase

router = APIRouter(prefix="/matches", tags=["matches"])


def get_db():
    """Dependency to get database instance."""
    from main import db

    return db


@router.post("/", status_code=status.HTTP_201_CREATED)
def register_match(
    match_request: MatchRequest,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Register a new match with another user's profile.
    The current user must be authenticated.

    Returns:
    - match_id: The ID of the created match
    - status: The status of the match (initially 'pending')
    - message: Success message
    """
    try:
        # Ensure the user is in the database
        user_data = current_user.model_dump()
        user_id = db.upsert_user(user_data)

        # Check if the target profile exists
        if not db.profiles_repo.profile_exists(match_request.target_profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target profile not found",
            )

        # Create the match
        match_data = {
            "initiator_user_id": user_id,
            "target_profile_id": match_request.target_profile_id,
            "status": MatchStatus.pending.value,
            "message": match_request.message,
        }

        try:
            match_id = db.create_match(match_data)
        except ValueError as e:
            if "already exists" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="You have already sent a match request to this profile",
                )
            raise

        return {
            "match_id": match_id,
            "status": MatchStatus.pending.value,
            "message": "Match request sent successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def get_my_matches(
    status: Optional[MatchStatus] = None,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get all matches for the current user.

    Query parameters:
    - status: Filter by match status (pending, accepted, rejected, blocked)

    Returns a list of matches where the user is either the initiator or the target.
    """
    try:
        # Ensure the user is in the database
        user_data = current_user.model_dump()
        user_id = db.upsert_user(user_data)

        # Get matches
        matches = db.get_user_matches(user_id, status.value if status else None)

        # Enrich match data with profile information
        for match in matches:
            # Get the other person's profile
            if match["initiator_user_id"] == user_id:
                # Current user initiated, get target profile
                profile = db.get_profile(match["target_profile_id"])
                match["matched_profile"] = profile
                match["direction"] = "sent"
            else:
                # Current user is target, get initiator's profile
                initiator = db.get_user_by_id(match["initiator_user_id"])
                if initiator and initiator.get("profile_id"):
                    profile = db.get_profile(initiator["profile_id"])
                    match["matched_profile"] = profile
                match["direction"] = "received"

        return {"matches": matches, "total": len(matches)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{match_id}/status")
def update_match_status(
    match_id: str,
    status: MatchStatus,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Update the status of a match.
    Only the target user can accept/reject a match.

    Parameters:
    - match_id: The ID of the match to update
    - status: The new status (accepted, rejected, blocked)
    """
    try:
        # Ensure the user is in the database
        user_data = current_user.model_dump()
        user_id = db.upsert_user(user_data)

        # Update the match status
        success = db.update_match_status(match_id, status.value, user_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this match or match not found",
            )

        # Check for mutual match if status is accepted
        is_mutual = False
        if status == MatchStatus.accepted:
            match = db.get_match(match_id)
            if match:
                is_mutual = db.check_mutual_match(user_id, match["target_profile_id"])

        return {
            "message": f"Match status updated to {status.value}",
            "is_mutual_match": is_mutual,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{match_id}")
def get_match_details(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get details of a specific match.
    User must be either the initiator or target of the match.
    """
    try:
        # Ensure the user is in the database
        user_data = current_user.model_dump()
        user_id = db.upsert_user(user_data)

        # Get the match
        match = db.get_match(match_id)

        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
            )

        # Check if user is part of this match
        user = db.get_user_by_id(user_id)
        user_profile_id = user.get("profile_id") if user else None

        if (
            match["initiator_user_id"] != user_id
            and match["target_profile_id"] != user_profile_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this match",
            )

        return match

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
