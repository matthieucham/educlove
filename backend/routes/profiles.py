"""
Profile routes for the EducLove API.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from auth import get_current_user
from models import Profile, ProfileUpdate, User, SearchCriteria, Location
from typing import TYPE_CHECKING, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from services.geocoding import get_geocoding_service
import logging

if TYPE_CHECKING:
    from database.mongo_database import MongoDatabase

router = APIRouter(prefix="/profiles", tags=["profiles"])
logger = logging.getLogger(__name__)


class SearchCriteriaRequest(BaseModel):
    """Request model for search criteria without user_id"""

    locations: List[Dict[str, Any]] = Field(
        default=[], description="List of locations to search in"
    )
    radii: List[int] = Field(
        default=[], description="Search radius in km for each location"
    )
    age_min: Optional[int] = Field(None, ge=18, description="Minimum age")
    age_max: Optional[int] = Field(None, le=100, description="Maximum age")
    subjects: List[str] = Field(default=[], description="Teaching subjects")


def get_db():
    """Dependency to get database instance."""
    from main import db

    return db


# ============================================================================
# PROFILES BROWSING ROUTES
# ============================================================================


@router.get("/")
def get_profiles_for_user(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get a single random profile filtered by the current user's search criteria,
    excluding profiles the user has already visited.
    If no criteria are saved, uses default matching logic.
    Returns None if no eligible profiles are found.
    """
    # Get user ID from the authenticated user
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Get a single random profile excluding visited ones
    profile = db.get_random_profile_for_user(user["_id"])

    # Get the user's search criteria to return with the response
    search_criteria = db.get_search_criteria(user["_id"])

    if profile:
        # Return a single profile in an array for backward compatibility
        # Frontend expects an array of profiles
        return {
            "profiles": [profile],
            "total": 1,
            "search_criteria": search_criteria,
        }
    else:
        # No eligible profiles found
        return {
            "profiles": [],
            "total": 0,
            "search_criteria": search_criteria,
            "message": "No more profiles available matching your criteria",
        }


# ============================================================================
# MY PROFILE ROUTES
# ============================================================================


@router.post("/my-profile", status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    profile: Profile,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Create a profile for the authenticated user.
    Automatically geocodes the location if only city name is provided.
    """
    try:
        # First, ensure the user is mirrored in the database
        user_data = current_user.model_dump(exclude={"profile_id"})
        user_id = db.upsert_user(user_data)

        # Check if user already has a profile
        user = db.get_user_by_id(user_id)
        if user and user.get("profile_id"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a profile. Use PUT to update it.",
            )

        # Geocode the location if coordinates are not provided or are [0, 0]
        if profile.location and (
            not profile.location.coordinates
            or profile.location.coordinates == [0, 0]
            or profile.location.coordinates == [0.0, 0.0]
        ):
            geocoding_service = get_geocoding_service()
            coordinates = await geocoding_service.get_coordinates_from_city(
                profile.location.city_name, country="FR"
            )

            if coordinates:
                # Update the location with geocoded coordinates
                profile.location.coordinates = list(coordinates)
                logger.info(
                    f"Geocoded location '{profile.location.city_name}' to {coordinates}"
                )
            else:
                logger.warning(
                    f"Could not geocode location '{profile.location.city_name}', using default [0, 0]"
                )
                profile.location.coordinates = [0, 0]

        # Create the profile
        profile_data = profile.model_dump(by_alias=True)
        profile_id = db.create_profile(profile_data)

        # Link the profile to the user and mark profile as completed
        db.users_repo.update_user_profile(user_id, profile_id)
        db.users_repo.update_user(user_id, {"profile_completed": True})

        return {"profile_id": profile_id, "message": "Profile created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/completion-status")
def get_profile_completion_status(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Check if the authenticated user has completed their profile.
    """
    # Get user from database
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {
        "profile_completed": user.get("profile_completed", False),
        "has_profile": bool(user.get("profile_id")),
        "profile_id": user.get("profile_id"),
    }


@router.get("/my-profile")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get the profile of the authenticated user.
    """
    # Get user from database
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check if user has a profile
    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User has no profile"
        )

    # Get the profile
    profile = db.get_profile(user["profile_id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    return profile


@router.put("/my-profile")
async def update_my_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Update the profile of the authenticated user.
    Only allows updating mutable fields (excludes first_name, date_of_birth, gender).
    Automatically geocodes the location if only city name is provided.
    """
    try:
        # Get user from database
        user = db.get_user_by_sub(current_user.sub)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Check if user has a profile
        if not user.get("profile_id"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User has no profile. Use POST to create one.",
            )

        # Geocode the location if coordinates are not provided or are [0, 0]
        if profile_update.location and (
            not profile_update.location.coordinates
            or profile_update.location.coordinates == [0, 0]
            or profile_update.location.coordinates == [0.0, 0.0]
        ):
            geocoding_service = get_geocoding_service()
            coordinates = await geocoding_service.get_coordinates_from_city(
                profile_update.location.city_name, country="FR"
            )

            if coordinates:
                # Update the location with geocoded coordinates
                profile_update.location.coordinates = list(coordinates)
                logger.info(
                    f"Geocoded location '{profile_update.location.city_name}' to {coordinates}"
                )
            else:
                logger.warning(
                    f"Could not geocode location '{profile_update.location.city_name}', using default [0, 0]"
                )
                profile_update.location.coordinates = [0, 0]

        # Update the profile (only mutable fields)
        profile_data = profile_update.model_dump(by_alias=True)
        success = db.profiles_repo.update_profile(user["profile_id"], profile_data)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found or update failed",
            )

        return {
            "profile_id": user["profile_id"],
            "message": "Profile updated successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/my-profile")
def delete_my_profile(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Delete the profile of the authenticated user.
    """
    # Get user from database
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Check if user has a profile
    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User has no profile"
        )

    # TODO: Implement delete_profile method in ProfilesRepository
    # For now, we'll return a placeholder response
    return {"message": "Profile deletion not yet implemented"}


# ============================================================================
# MY SEARCH CRITERIA ROUTES
# ============================================================================


@router.post("/my-profile/search-criteria")
async def save_my_search_criteria(
    criteria: SearchCriteriaRequest,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Save or update search criteria for the authenticated user.
    Automatically geocodes locations if only city names are provided.
    """
    try:
        # Get user ID from the authenticated user
        user = db.get_user_by_sub(current_user.sub)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Process and geocode locations
        geocoding_service = get_geocoding_service()
        processed_locations = []

        for location_data in criteria.locations:
            # Check if this is a Location object or a dict
            if isinstance(location_data, dict):
                city_name = location_data.get("city_name", "")
                coordinates = location_data.get("coordinates", [0, 0])

                # Geocode if coordinates are missing or invalid
                if (
                    not coordinates
                    or coordinates == [0, 0]
                    or coordinates == [0.0, 0.0]
                ):
                    if city_name:
                        coords = await geocoding_service.get_coordinates_from_city(
                            city_name, country="FR"
                        )
                        if coords:
                            coordinates = list(coords)
                            logger.info(
                                f"Geocoded location '{city_name}' to {coordinates}"
                            )
                        else:
                            logger.warning(
                                f"Could not geocode location '{city_name}', using default [0, 0]"
                            )
                            coordinates = [0, 0]

                processed_locations.append(
                    {"city_name": city_name, "coordinates": coordinates}
                )

        # Update criteria with processed locations
        criteria_data = criteria.model_dump(by_alias=True)
        criteria_data["locations"] = processed_locations

        # Save the search criteria
        criteria_id = db.upsert_search_criteria(user["_id"], criteria_data)

        return {
            "criteria_id": criteria_id,
            "message": "Search criteria saved successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving search criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/my-profile/search-criteria")
async def update_my_search_criteria(
    criteria: SearchCriteriaRequest,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Update search criteria for the authenticated user.
    This is an alias for POST since we use upsert.
    """
    return await save_my_search_criteria(criteria, current_user, db)


@router.get("/my-profile/search-criteria")
def get_my_search_criteria(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get the saved search criteria for the authenticated user.
    """
    # Get user ID from the authenticated user
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    criteria = db.get_search_criteria(user["_id"])
    if not criteria:
        return {"message": "No search criteria found", "criteria": None}

    return {"criteria": criteria}


@router.delete("/my-profile/search-criteria")
def delete_my_search_criteria(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Delete the saved search criteria for the authenticated user.
    """
    # Get user ID from the authenticated user
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    success = db.delete_search_criteria(user["_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No search criteria found to delete",
        )

    return {"message": "Search criteria deleted successfully"}


# ============================================================================
# MATCHING ROUTES
# ============================================================================


class LikeProfileRequest(BaseModel):
    """Request model for liking a profile with a message"""

    message: str = Field(
        ..., min_length=1, max_length=500, description="Message to send with the like"
    )


@router.post("/{profile_id}:like")
def like_profile(
    profile_id: str,
    request: LikeProfileRequest,
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Like a profile (send a match request) with a message.

    This endpoint handles the matching logic:
    - If the target profile has already liked the current user's profile (reverse match exists with PENDING status),
      the match status is updated to ACCEPTED (mutual match)
    - Otherwise, a new match is created with PENDING status
    - A conversation is initiated with the provided message

    Args:
        profile_id: The ID of the profile to like
        request: The request body containing the message
        current_user: The authenticated user
        db: Database connection

    Returns:
        Result of the like action including match status
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile before liking other profiles",
        )

    current_profile_id = user["profile_id"]

    # Check if the target profile exists
    target_profile = db.get_profile(profile_id)
    if not target_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    # Prevent users from liking their own profile
    if current_profile_id == profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot like your own profile",
        )

    # Handle the like action with message
    result = db.handle_profile_like(current_profile_id, profile_id, request.message)

    return result


@router.get("/my-matches")
def get_my_matches(
    status: Optional[str] = Query(
        None,
        description="Filter by match status (PENDING, ACCEPTED, REJECTED, BLOCKED)",
    ),
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get all matches for the current user's profile.

    Args:
        status: Optional status filter
        current_user: The authenticated user
        db: Database connection

    Returns:
        List of matches with profile information
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view matches",
        )

    profile_id = user["profile_id"]

    # Get matches
    matches = db.get_matches_for_profile(profile_id, status)

    # Enrich matches with profile information
    enriched_matches = []
    for match in matches:
        # Determine which profile to fetch (the other person's profile)
        if match["initiator_profile_id"] == profile_id:
            other_profile_id = match["target_profile_id"]
            match_type = "sent"  # Current user initiated
        else:
            other_profile_id = match["initiator_profile_id"]
            match_type = "received"  # Current user received

        # Get the other person's profile
        other_profile = db.get_profile(other_profile_id)

        if other_profile:
            enriched_match = {
                "match_id": match["_id"],
                "status": match["status"],
                "match_type": match_type,
                "created_at": match["created_at"],
                "updated_at": match["updated_at"],
                "profile": other_profile,
            }
            enriched_matches.append(enriched_match)

    return {"matches": enriched_matches, "total": len(enriched_matches)}


@router.get("/my-matches/accepted")
def get_my_accepted_matches(
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get all accepted (mutual) matches for the current user.

    Returns:
        List of accepted matches with profile information
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view matches",
        )

    profile_id = user["profile_id"]

    # Get accepted matches
    matches = db.get_accepted_matches(profile_id)

    # Enrich matches with profile information
    enriched_matches = []
    for match in matches:
        # Determine which profile to fetch
        if match["initiator_profile_id"] == profile_id:
            other_profile_id = match["target_profile_id"]
        else:
            other_profile_id = match["initiator_profile_id"]

        # Get the other person's profile
        other_profile = db.get_profile(other_profile_id)

        if other_profile:
            enriched_match = {
                "match_id": match["_id"],
                "created_at": match["created_at"],
                "updated_at": match["updated_at"],
                "profile": other_profile,
            }
            enriched_matches.append(enriched_match)

    return {"matches": enriched_matches, "total": len(enriched_matches)}


@router.get("/my-matches/pending")
def get_my_pending_matches(
    match_type: Optional[str] = Query(
        None, description="Filter by 'sent' or 'received'"
    ),
    current_user: User = Depends(get_current_user),
    db: "MongoDatabase" = Depends(get_db),
):
    """
    Get pending matches for the current user.

    Args:
        match_type: Optional filter - 'sent' for matches initiated by user, 'received' for matches received

    Returns:
        List of pending matches with profile information
    """
    # Get the current user's profile
    user = db.get_user_by_sub(current_user.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if not user.get("profile_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete your profile to view matches",
        )

    profile_id = user["profile_id"]

    # Get pending matches based on type
    if match_type == "sent":
        matches = db.get_pending_matches_sent(profile_id)
    elif match_type == "received":
        matches = db.get_pending_matches_received(profile_id)
    else:
        # Get all pending matches
        matches = db.get_matches_for_profile(profile_id, status="PENDING")

    # Enrich matches with profile information
    enriched_matches = []
    for match in matches:
        # Determine which profile to fetch and match type
        if match["initiator_profile_id"] == profile_id:
            other_profile_id = match["target_profile_id"]
            current_match_type = "sent"
        else:
            other_profile_id = match["initiator_profile_id"]
            current_match_type = "received"

        # Skip if filtering and doesn't match the requested type
        if match_type and current_match_type != match_type:
            continue

        # Get the other person's profile
        other_profile = db.get_profile(other_profile_id)

        if other_profile:
            enriched_match = {
                "match_id": match["_id"],
                "match_type": current_match_type,
                "created_at": match["created_at"],
                "profile": other_profile,
            }
            enriched_matches.append(enriched_match)

    return {"matches": enriched_matches, "total": len(enriched_matches)}
