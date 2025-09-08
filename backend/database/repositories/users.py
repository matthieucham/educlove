"""
Users collection repository.
"""

from typing import Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timezone


class UsersRepository:
    """Repository for managing users collection."""

    def __init__(self, db):
        """Initialize with database connection."""
        self.collection = db.users

    def upsert_user(self, user_data: Dict[str, Any]) -> str:
        """
        Create or update a user based on their 'sub' (subject identifier).
        Returns the user's MongoDB _id.
        """
        # Separate created_at from user_data to avoid conflicts
        user_data_copy = user_data.copy()

        # Remove created_at from user_data if it exists
        if "created_at" in user_data_copy:
            del user_data_copy["created_at"]

        # Always update last_login
        user_data_copy["last_login"] = datetime.now(timezone.utc)

        result = self.collection.find_one_and_update(
            {"sub": user_data_copy["sub"]},
            {
                "$set": user_data_copy,
                "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
            },
            upsert=True,
            return_document=True,
        )
        return str(result["_id"])

    def get_user_by_sub(self, sub: str) -> Optional[Dict[str, Any]]:
        """Get a user by their subject identifier from the identity provider."""
        user = self.collection.find_one({"sub": sub})
        if user:
            user["_id"] = str(user["_id"])
        return user

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their MongoDB _id."""
        try:
            user = self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except:
            return None

    def update_user_profile(self, user_id: str, profile_id: str) -> bool:
        """Link a profile to a user."""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": {"profile_id": profile_id}}
            )
            return result.modified_count > 0
        except:
            return False

    def get_user_by_profile_id(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their profile_id."""
        user = self.collection.find_one({"profile_id": profile_id})
        if user:
            user["_id"] = str(user["_id"])
        return user
