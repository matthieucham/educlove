"""
Matches collection repository.
"""

from typing import Dict, Any, List, Optional
from bson import ObjectId
from datetime import datetime, timezone


class MatchesRepository:
    """Repository for managing matches collection."""

    def __init__(self, db):
        """Initialize with database connection."""
        self.collection = db.matches

    def create_match(self, match_data: Dict[str, Any]) -> str:
        """
        Create a new match between users.
        Returns the match's MongoDB _id.
        """
        # Check if a match already exists between these users
        existing_match = self.collection.find_one(
            {
                "initiator_user_id": match_data["initiator_user_id"],
                "target_profile_id": match_data["target_profile_id"],
            }
        )

        if existing_match:
            raise ValueError("Match already exists between these users")

        match_data["created_at"] = datetime.now(timezone.utc)
        match_data["updated_at"] = datetime.now(timezone.utc)

        result = self.collection.insert_one(match_data)
        return str(result.inserted_id)

    def get_match(self, match_id: str) -> Optional[Dict[str, Any]]:
        """Get a match by its MongoDB _id."""
        try:
            match = self.collection.find_one({"_id": ObjectId(match_id)})
            if match:
                match["_id"] = str(match["_id"])
            return match
        except:
            return None

    def get_user_matches(
        self,
        user_id: str,
        user_profile_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get all matches for a user (both initiated and received).
        Optionally filter by status.
        """
        # Build query
        query = {"$or": [{"initiator_user_id": user_id}]}

        # If user has a profile, also get matches where they are the target
        if user_profile_id:
            query["$or"].append({"target_profile_id": user_profile_id})

        if status:
            query["status"] = status

        matches = list(self.collection.find(query))

        # Convert ObjectId to string
        for match in matches:
            match["_id"] = str(match["_id"])

        return matches

    def update_match_status(self, match_id: str, status: str) -> bool:
        """
        Update the status of a match.
        """
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(match_id)},
                {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
            )

            return result.modified_count > 0
        except:
            return False

    def delete_match(self, match_id: str) -> bool:
        """Delete a match."""
        try:
            result = self.collection.delete_one({"_id": ObjectId(match_id)})
            return result.deleted_count > 0
        except:
            return False

    def check_mutual_match(
        self, user1_id: str, user1_profile_id: str, user2_id: str, user2_profile_id: str
    ) -> bool:
        """
        Check if there's a mutual match between two users.
        Returns True if both users have matched with each other and both matches are accepted.
        """
        # Check if user1 has matched with user2's profile and it's accepted
        match1 = self.collection.find_one(
            {
                "initiator_user_id": user1_id,
                "target_profile_id": user2_profile_id,
                "status": "accepted",
            }
        )

        if not match1:
            return False

        # Check if user2 has matched with user1's profile and it's accepted
        match2 = self.collection.find_one(
            {
                "initiator_user_id": user2_id,
                "target_profile_id": user1_profile_id,
                "status": "accepted",
            }
        )

        return match2 is not None

    def get_mutual_matches(
        self, user_id: str, user_profile_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all mutual matches for a user.
        Returns matches where both users have accepted each other.
        """
        # Get all accepted matches initiated by the user
        initiated_matches = list(
            self.collection.find({"initiator_user_id": user_id, "status": "accepted"})
        )

        mutual_matches = []

        for match in initiated_matches:
            # Check if there's a reciprocal match
            reciprocal = self.collection.find_one(
                {
                    "target_profile_id": user_profile_id,
                    "status": "accepted",
                }
            )
            if reciprocal:
                match["_id"] = str(match["_id"])
                match["is_mutual"] = True
                mutual_matches.append(match)

        return mutual_matches

    def count_matches(
        self,
        user_id: str,
        user_profile_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> int:
        """Count matches for a user, optionally filtered by status."""
        query = {"$or": [{"initiator_user_id": user_id}]}

        if user_profile_id:
            query["$or"].append({"target_profile_id": user_profile_id})

        if status:
            query["status"] = status

        return self.collection.count_documents(query)

    def match_exists(self, initiator_user_id: str, target_profile_id: str) -> bool:
        """Check if a match exists between two users."""
        return (
            self.collection.count_documents(
                {
                    "initiator_user_id": initiator_user_id,
                    "target_profile_id": target_profile_id,
                },
                limit=1,
            )
            > 0
        )
