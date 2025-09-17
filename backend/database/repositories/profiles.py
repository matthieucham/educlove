"""
Profiles collection repository.
"""

from typing import Dict, Any, List, Optional
from bson import ObjectId
from datetime import datetime, timezone, date


class ProfilesRepository:
    """Repository for managing profiles collection."""

    def __init__(self, db):
        """Initialize with database connection."""
        self.collection = db.profiles

    def create_profile(self, profile_data: Dict[str, Any]) -> str:
        """
        Create a new profile.
        Returns the profile's MongoDB _id.
        """
        profile_data["created_at"] = datetime.now(timezone.utc)
        profile_data["updated_at"] = datetime.now(timezone.utc)

        # Convert date_of_birth from date to datetime for MongoDB
        if "date_of_birth" in profile_data:
            dob = profile_data["date_of_birth"]
            if isinstance(dob, date) and not isinstance(dob, datetime):
                # Convert date to datetime at midnight UTC
                profile_data["date_of_birth"] = datetime.combine(
                    dob, datetime.min.time()
                )

        # Transform location to GeoJSON format for MongoDB
        if "location" in profile_data:
            location = profile_data["location"]
            profile_data["location"] = {
                "type": "Point",
                "coordinates": location["coordinates"],
                "city_name": location["city_name"],
            }

        # Try to ensure 2dsphere index exists for geospatial queries
        # This might fail if authentication is not properly set up, but it's not critical
        try:
            self.collection.create_index([("location", "2dsphere")])
        except Exception:
            # Index creation failed, but we can still insert the document
            pass

        result = self.collection.insert_one(profile_data)
        return str(result.inserted_id)

    def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a profile by its MongoDB _id."""
        try:
            profile = self.collection.find_one({"_id": ObjectId(profile_id)})
            if profile:
                profile["_id"] = str(profile["_id"])
                # Transform GeoJSON back to simple format for API response
                if "location" in profile and profile["location"].get("type") == "Point":
                    profile["location"] = {
                        "city_name": profile["location"].get("city_name", ""),
                        "coordinates": profile["location"]["coordinates"],
                    }

                # Compute age from date_of_birth
                if "date_of_birth" in profile:
                    today = date.today()
                    dob = profile["date_of_birth"]
                    if isinstance(dob, str):
                        dob = datetime.fromisoformat(dob).date()
                    elif isinstance(dob, datetime):
                        dob = dob.date()
                    profile["age"] = (
                        today.year
                        - dob.year
                        - ((today.month, today.day) < (dob.month, dob.day))
                    )
            return profile
        except:
            return None

    def update_profile(self, profile_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a profile."""
        try:
            update_data["updated_at"] = datetime.now(timezone.utc)

            # Convert date_of_birth from date to datetime for MongoDB
            if "date_of_birth" in update_data:
                dob = update_data["date_of_birth"]
                if isinstance(dob, date) and not isinstance(dob, datetime):
                    # Convert date to datetime at midnight UTC
                    update_data["date_of_birth"] = datetime.combine(
                        dob, datetime.min.time()
                    )

            # Transform location to GeoJSON format if present
            if "location" in update_data:
                location = update_data["location"]
                update_data["location"] = {
                    "type": "Point",
                    "coordinates": location["coordinates"],
                    "city_name": location["city_name"],
                }

            result = self.collection.update_one(
                {"_id": ObjectId(profile_id)}, {"$set": update_data}
            )
            return result.modified_count > 0
        except:
            return False

    def delete_profile(self, profile_id: str) -> bool:
        """Delete a profile."""
        try:
            result = self.collection.delete_one({"_id": ObjectId(profile_id)})
            return result.deleted_count > 0
        except:
            return False

    def search_profiles(
        self, criteria: Dict[str, Any], current_user_profile: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for profiles based on given criteria.
        Supports filtering by various fields and geospatial queries.
        Handles multiple locations with OR logic by performing separate queries.

        Args:
            criteria: Search criteria including age, location, subjects, etc.
            current_user_profile: The profile of the current user doing the search
        """
        # Build base query (non-location filters)
        base_query = {}

        # Age filtering using date_of_birth in MongoDB query
        today = date.today()
        age_min = criteria.get("age_min")
        age_max = criteria.get("age_max")

        if age_max is not None:
            # For max age, date_of_birth must be after (today - age_max - 1 years)
            min_birth_date = date(today.year - age_max - 1, today.month, today.day)
            base_query.setdefault("date_of_birth", {})["$gt"] = datetime.combine(
                min_birth_date, datetime.min.time()
            )

        if age_min is not None:
            # For min age, date_of_birth must be before or equal to (today - age_min years)
            max_birth_date = date(today.year - age_min, today.month, today.day)
            base_query.setdefault("date_of_birth", {})["$lte"] = datetime.combine(
                max_birth_date, datetime.min.time()
            )

        if "education_level" in criteria and criteria["education_level"] is not None:
            base_query["education_level"] = criteria["education_level"]

        if (
            "subjects" in criteria
            and criteria["subjects"]
            and len(criteria["subjects"]) > 0
        ):
            base_query["subjects"] = {"$in": criteria["subjects"]}

        # Use the current user's looking_for_gender preference to filter profiles by gender
        if current_user_profile and current_user_profile.get("looking_for_gender"):
            base_query["gender"] = {"$in": current_user_profile["looking_for_gender"]}

        # Filter by orientation
        if (
            "orientation" in criteria
            and criteria["orientation"]
            and len(criteria["orientation"]) > 0
        ):
            base_query["orientation"] = {"$in": criteria["orientation"]}

        # Use the current user's looking_for preference to find compatible profiles
        # Only return profiles that are looking for at least one of the same relationship types
        if current_user_profile and current_user_profile.get("looking_for"):
            # Use $elemMatch to find profiles where at least one looking_for value matches
            base_query["looking_for"] = {
                "$elemMatch": {"$in": current_user_profile["looking_for"]}
            }

        # Handle location-based search with multiple locations and radii
        profiles_dict = {}  # Use dict to track unique profiles by _id

        if (
            "locations" in criteria
            and criteria["locations"]
            and len(criteria["locations"]) > 0
            and "radii" in criteria
            and criteria["radii"]
            and len(criteria["radii"]) > 0
        ):
            # MongoDB $near doesn't support OR with multiple locations
            # So we perform multiple queries and combine results
            for location, radius in zip(criteria["locations"], criteria["radii"]):
                if radius is not None and radius > 0:
                    # Create a copy of base query for this location
                    location_query = base_query.copy()
                    # Convert radius from km to meters (MongoDB uses meters)
                    radius_meters = radius * 1000
                    location_query["location"] = {
                        "$near": {
                            "$geometry": location,
                            "$maxDistance": radius_meters,
                        }
                    }

                    # Execute query for this location
                    location_profiles = list(self.collection.find(location_query))

                    # Add profiles to dict (automatically handles duplicates)
                    for profile in location_profiles:
                        profile_id = str(profile["_id"])
                        if profile_id not in profiles_dict:
                            profiles_dict[profile_id] = profile

            # If no valid locations with positive radius, just use base query
            if not profiles_dict:
                profiles = list(self.collection.find(base_query))
                for profile in profiles:
                    profiles_dict[str(profile["_id"])] = profile
        else:
            # No location criteria, just use base query
            profiles = list(self.collection.find(base_query))
            for profile in profiles:
                profiles_dict[str(profile["_id"])] = profile

        # Convert dict values back to list
        profiles = list(profiles_dict.values())

        # Additional filtering based on gender preferences
        # Only return profiles of people who are looking for the current user's gender
        if current_user_profile and current_user_profile.get("gender"):
            current_user_gender = current_user_profile["gender"]
            filtered_profiles = []
            for profile in profiles:
                # Check if this profile is looking for the current user's gender
                if profile.get(
                    "looking_for_gender"
                ) and current_user_gender in profile.get("looking_for_gender", []):
                    filtered_profiles.append(profile)
            profiles = filtered_profiles

        # Convert ObjectId to string and transform location format
        for profile in profiles:
            profile["_id"] = str(profile["_id"])
            # Transform GeoJSON back to simple format for API response
            if "location" in profile and profile["location"].get("type") == "Point":
                profile["location"] = {
                    "city_name": profile["location"].get("city_name", ""),
                    "coordinates": profile["location"]["coordinates"],
                }

            # Compute age for display
            if "date_of_birth" in profile:
                today = date.today()
                dob = profile["date_of_birth"]
                if isinstance(dob, str):
                    dob = datetime.fromisoformat(dob).date()
                elif isinstance(dob, datetime):
                    dob = dob.date()
                profile["age"] = (
                    today.year
                    - dob.year
                    - ((today.month, today.day) < (dob.month, dob.day))
                )

        return profiles

    def get_all_profiles(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Get all profiles with pagination."""
        profiles = list(self.collection.find().skip(skip).limit(limit))

        # Convert ObjectId to string and transform location format
        today = date.today()
        for profile in profiles:
            profile["_id"] = str(profile["_id"])
            # Transform GeoJSON back to simple format for API response
            if "location" in profile and profile["location"].get("type") == "Point":
                profile["location"] = {
                    "city_name": profile["location"].get("city_name", ""),
                    "coordinates": profile["location"]["coordinates"],
                }

            # Compute age from date_of_birth
            if "date_of_birth" in profile:
                dob = profile["date_of_birth"]
                if isinstance(dob, str):
                    dob = datetime.fromisoformat(dob).date()
                elif isinstance(dob, datetime):
                    dob = dob.date()
                profile["age"] = (
                    today.year
                    - dob.year
                    - ((today.month, today.day) < (dob.month, dob.day))
                )

        return profiles

    def count_profiles(self, criteria: Dict[str, Any] = {}) -> int:
        """Count profiles matching the criteria."""
        return self.collection.count_documents(criteria)

    def profile_exists(self, profile_id: str) -> bool:
        """Check if a profile exists."""
        try:
            return (
                self.collection.count_documents({"_id": ObjectId(profile_id)}, limit=1)
                > 0
            )
        except:
            return False
