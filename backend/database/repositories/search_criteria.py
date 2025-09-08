"""
Search criteria collection repository.
"""

from typing import Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timezone


class SearchCriteriaRepository:
    """Repository for managing search criteria collection."""

    def __init__(self, db):
        """Initialize with database connection."""
        self.collection = db.search_criteria

    def upsert_search_criteria(
        self, user_id: str, criteria_data: Dict[str, Any]
    ) -> str:
        """
        Create or update search criteria for a user.
        Returns the search criteria's MongoDB _id.
        """
        # Ensure user_id is in the criteria
        criteria_data["user_id"] = user_id
        criteria_data["updated_at"] = datetime.now(timezone.utc)

        # Transform locations to GeoJSON format for MongoDB if present
        if "locations" in criteria_data:
            for i, location in enumerate(criteria_data["locations"]):
                if isinstance(location, dict) and "coordinates" in location:
                    criteria_data["locations"][i] = {
                        "type": "Point",
                        "coordinates": location["coordinates"],
                        "city_name": location.get("city_name", ""),
                    }

        # Check if criteria already exists for this user
        existing = self.collection.find_one({"user_id": user_id})

        if existing:
            # Update existing criteria
            result = self.collection.update_one(
                {"user_id": user_id}, {"$set": criteria_data}
            )
            return str(existing["_id"])
        else:
            # Create new criteria
            criteria_data["created_at"] = datetime.now(timezone.utc)
            result = self.collection.insert_one(criteria_data)
            return str(result.inserted_id)

    def get_search_criteria(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get search criteria for a specific user."""
        criteria = self.collection.find_one({"user_id": user_id})
        if criteria:
            criteria["_id"] = str(criteria["_id"])
            # Transform GeoJSON back to simple format for API response
            if "locations" in criteria:
                for i, location in enumerate(criteria["locations"]):
                    if isinstance(location, dict) and location.get("type") == "Point":
                        criteria["locations"][i] = {
                            "city_name": location.get("city_name", ""),
                            "coordinates": location["coordinates"],
                        }
        return criteria

    def delete_search_criteria(self, user_id: str) -> bool:
        """Delete search criteria for a user."""
        result = self.collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0

    def build_profile_query(self, criteria: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build a MongoDB query for profiles based on search criteria.
        """
        query = {}

        # Age range filter
        if criteria.get("age_min") is not None:
            query.setdefault("age", {})["$gte"] = criteria["age_min"]
        if criteria.get("age_max") is not None:
            query.setdefault("age", {})["$lte"] = criteria["age_max"]

        # Gender filter - pass it directly to the query
        if criteria.get("gender"):
            query["gender"] = criteria["gender"]

        # Orientation filter
        if criteria.get("orientation"):
            query["orientation"] = criteria["orientation"]

        # Looking for filter
        if criteria.get("looking_for"):
            query["looking_for"] = {"$in": criteria["looking_for"]}

        # Subject filter
        if criteria.get("subjects"):
            query["subject"] = {"$in": criteria["subjects"]}

        # Location-based search with multiple locations and radii
        if criteria.get("locations") and criteria.get("radii"):
            location_queries = []
            for location, radius in zip(criteria["locations"], criteria["radii"]):
                if radius > 0:  # Only add location query if radius is greater than 0
                    # Convert radius from km to meters (MongoDB uses meters)
                    radius_meters = radius * 1000
                    location_query = {
                        "location": {
                            "$near": {
                                "$geometry": {
                                    "type": "Point",
                                    "coordinates": location["coordinates"],
                                },
                                "$maxDistance": radius_meters,
                            }
                        }
                    }
                    location_queries.append(location_query)

            # If we have location queries, use $or to match any of them
            if location_queries:
                if len(location_queries) == 1:
                    query.update(location_queries[0])
                else:
                    # MongoDB doesn't support $or with $near, so we'll use the first location
                    # In a production system, you might want to run multiple queries and combine results
                    query.update(location_queries[0])

        return query
