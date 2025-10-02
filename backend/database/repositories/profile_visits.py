"""Repository for managing profile visits with TTL functionality."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from constants import PROFILE_VISIT_TTL_SECONDS


class ProfileVisitsRepository:
    """Repository for profile visit tracking with automatic expiration."""

    def __init__(self, db):
        self.collection = db["profile_visits"]
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create necessary indexes including TTL index for automatic expiration."""
        # TTL index: automatically delete documents after the configured TTL period
        self.collection.create_index(
            "visited_at", expireAfterSeconds=PROFILE_VISIT_TTL_SECONDS
        )

        # Unique compound index to prevent duplicate visits
        # Also useful for upsert operations
        self.collection.create_index(
            [("user_id", 1), ("visited_profile_id", 1)], unique=True
        )

        # Index for efficient querying of user's visit history
        self.collection.create_index([("user_id", 1), ("visited_at", -1)])

    def record_visit(self, user_id: str, visited_profile_id: str) -> str:
        """
        Record a profile visit. If the user has already visited this profile,
        update the visited_at timestamp (which resets the TTL).

        Args:
            user_id: The ID of the user who visited the profile
            visited_profile_id: The ID of the profile that was visited

        Returns:
            The ID of the visit record (as string)
        """
        visit_data = {
            "user_id": user_id,
            "visited_profile_id": visited_profile_id,
            "visited_at": datetime.now(timezone.utc),
        }

        # Use upsert to either create new or update existing visit
        result = self.collection.update_one(
            {"user_id": user_id, "visited_profile_id": visited_profile_id},
            {"$set": visit_data},
            upsert=True,
        )

        if result.upserted_id:
            return str(result.upserted_id)
        else:
            # Find and return the existing document's ID
            existing = self.collection.find_one(
                {"user_id": user_id, "visited_profile_id": visited_profile_id}
            )
            return str(existing["_id"]) if existing else None

    def has_visited(self, user_id: str, visited_profile_id: str) -> bool:
        """
        Check if a user has visited a specific profile (within the TTL period).

        Args:
            user_id: The ID of the user
            visited_profile_id: The ID of the profile to check

        Returns:
            True if the user has visited this profile, False otherwise
        """
        result = self.collection.find_one(
            {"user_id": user_id, "visited_profile_id": visited_profile_id}
        )
        return result is not None

    def get_visited_profiles(
        self, user_id: str, limit: int = 100, skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get the list of profiles a user has visited, ordered by most recent first.

        Args:
            user_id: The ID of the user
            limit: Maximum number of results to return (default: 100)
            skip: Number of results to skip for pagination (default: 0)

        Returns:
            List of visit records with profile IDs and timestamps
        """
        cursor = (
            self.collection.find({"user_id": user_id})
            .sort("visited_at", -1)
            .skip(skip)
            .limit(limit)
        )

        visits = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            visits.append(doc)

        return visits

    def get_visited_profile_ids(self, user_id: str) -> List[str]:
        """
        Get just the profile IDs that a user has visited (useful for filtering).

        Args:
            user_id: The ID of the user

        Returns:
            List of visited profile IDs
        """
        cursor = self.collection.find(
            {"user_id": user_id}, {"visited_profile_id": 1, "_id": 0}
        )

        return [doc["visited_profile_id"] for doc in cursor]

    def get_visit_count(self, user_id: str) -> int:
        """
        Get the total number of profiles a user has visited (within the TTL period).

        Args:
            user_id: The ID of the user

        Returns:
            Count of visited profiles
        """
        return self.collection.count_documents({"user_id": user_id})

    def delete_visit(self, user_id: str, visited_profile_id: str) -> bool:
        """
        Delete a specific visit record (e.g., if user wants to "unsee" a profile).

        Args:
            user_id: The ID of the user
            visited_profile_id: The ID of the profile

        Returns:
            True if a record was deleted, False otherwise
        """
        result = self.collection.delete_one(
            {"user_id": user_id, "visited_profile_id": visited_profile_id}
        )
        return result.deleted_count > 0

    def delete_all_visits(self, user_id: str) -> int:
        """
        Delete all visit records for a user.

        Args:
            user_id: The ID of the user

        Returns:
            Number of records deleted
        """
        result = self.collection.delete_many({"user_id": user_id})
        return result.deleted_count
