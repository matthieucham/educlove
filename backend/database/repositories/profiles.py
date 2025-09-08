"""
Profiles collection repository.
"""

from typing import Dict, Any, List, Optional
from bson import ObjectId
from datetime import datetime, timezone


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

        # Transform location to GeoJSON format for MongoDB
        if "location" in profile_data:
            location = profile_data["location"]
            profile_data["location"] = {
                "type": "Point",
                "coordinates": location["coordinates"],
                "city_name": location["city_name"],
            }

        # Ensure 2dsphere index exists for geospatial queries
        self.collection.create_index([("location", "2dsphere")])

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
            return profile
        except:
            return None

    def update_profile(self, profile_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a profile."""
        try:
            update_data["updated_at"] = datetime.now(timezone.utc)

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

    def search_profiles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search for profiles based on given criteria.
        Supports filtering by various fields and geospatial queries.
        Handles multiple locations with OR logic by performing separate queries.
        """
        # Build base query (non-location filters)
        base_query = {}

        # Build query based on criteria - check for None/null values
        if "age_min" in criteria and criteria["age_min"] is not None:
            base_query.setdefault("age", {})["$gte"] = criteria["age_min"]
        if "age_max" in criteria and criteria["age_max"] is not None:
            base_query.setdefault("age", {})["$lte"] = criteria["age_max"]

        if "education_level" in criteria and criteria["education_level"] is not None:
            base_query["education_level"] = criteria["education_level"]

        if (
            "subjects" in criteria
            and criteria["subjects"]
            and len(criteria["subjects"]) > 0
        ):
            base_query["subjects"] = {"$in": criteria["subjects"]}

        # Filter by gender (note: this filters the profiles themselves, not what they're looking for)
        if "gender" in criteria and criteria["gender"] and len(criteria["gender"]) > 0:
            # Map French gender terms to what might be stored in profiles
            gender_map = {
                "Homme": ["Homme", "Male", "M", "homme"],
                "Femme": ["Femme", "Female", "F", "femme"],
                "Autre": ["Autre", "Other", "autre", "other"],
            }
            gender_queries = []
            for gender in criteria["gender"]:
                if gender in gender_map:
                    gender_queries.extend(gender_map[gender])
                else:
                    gender_queries.append(gender)
            if gender_queries:
                base_query["gender"] = {"$in": gender_queries}

        # Filter by orientation
        if (
            "orientation" in criteria
            and criteria["orientation"]
            and len(criteria["orientation"]) > 0
        ):
            base_query["orientation"] = {"$in": criteria["orientation"]}

        # Filter by what they're looking for
        if (
            "looking_for" in criteria
            and criteria["looking_for"]
            and len(criteria["looking_for"]) > 0
        ):
            base_query["looking_for"] = {"$in": criteria["looking_for"]}

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

        # Convert ObjectId to string and transform location format
        for profile in profiles:
            profile["_id"] = str(profile["_id"])
            # Transform GeoJSON back to simple format for API response
            if "location" in profile and profile["location"].get("type") == "Point":
                profile["location"] = {
                    "city_name": profile["location"].get("city_name", ""),
                    "coordinates": profile["location"]["coordinates"],
                }

        return profiles

    def get_all_profiles(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Get all profiles with pagination."""
        profiles = list(self.collection.find().skip(skip).limit(limit))

        # Convert ObjectId to string and transform location format
        for profile in profiles:
            profile["_id"] = str(profile["_id"])
            # Transform GeoJSON back to simple format for API response
            if "location" in profile and profile["location"].get("type") == "Point":
                profile["location"] = {
                    "city_name": profile["location"].get("city_name", ""),
                    "coordinates": profile["location"]["coordinates"],
                }

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
