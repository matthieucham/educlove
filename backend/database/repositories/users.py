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

        # Check if user already exists
        existing_user = self.collection.find_one({"sub": user_data_copy["sub"]})

        if existing_user:
            # For existing users, only update specific fields to preserve email_verified and profile_completed
            update_fields = {
                "last_login": user_data_copy["last_login"],
                "email": user_data_copy.get("email"),
                "name": user_data_copy.get("name"),
                "picture": user_data_copy.get("picture"),
                "provider": user_data_copy.get("provider"),
            }
            # Remove None values
            update_fields = {k: v for k, v in update_fields.items() if v is not None}

            result = self.collection.find_one_and_update(
                {"sub": user_data_copy["sub"]},
                {"$set": update_fields},
                return_document=True,
            )
        else:
            # For new users, set all fields including defaults
            user_data_copy["email_verified"] = user_data_copy.get(
                "email_verified", False
            )
            user_data_copy["profile_completed"] = user_data_copy.get(
                "profile_completed", False
            )

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

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by their email address."""
        user = self.collection.find_one({"email": email.lower()})
        if user:
            user["_id"] = str(user["_id"])
        return user

    def update_user_last_login(self, user_id: str) -> bool:
        """Update the last login timestamp for a user."""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"last_login": datetime.now(timezone.utc)}},
            )
            return result.modified_count > 0
        except:
            return False

    def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Update specific fields for a user."""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": update_data}
            )
            return result.modified_count > 0
        except:
            return False

    def update_email_verified(self, user_id: str, verified: bool) -> bool:
        """Update the email_verified status for a user."""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": {"email_verified": verified}}
            )
            return result.modified_count > 0
        except:
            return False
