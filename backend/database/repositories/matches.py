"""Repository for managing profile matches."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from constants import MatchStatus


class MatchesRepository:
    """Repository for managing matches between profiles."""

    def __init__(self, db):
        self.collection = db["matches"]
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create necessary indexes for efficient querying."""
        # Unique compound index to prevent duplicate matches
        # A match between two profiles should be unique regardless of direction
        self.collection.create_index(
            [("initiator_profile_id", 1), ("target_profile_id", 1)], unique=True
        )

        # Index for finding matches where a profile is the target
        self.collection.create_index([("target_profile_id", 1), ("status", 1)])

        # Index for finding matches where a profile is the initiator
        self.collection.create_index([("initiator_profile_id", 1), ("status", 1)])

        # Index for finding all matches for a profile (as initiator or target)
        self.collection.create_index([("initiator_profile_id", 1)])
        self.collection.create_index([("target_profile_id", 1)])

        # Index for sorting by creation date
        self.collection.create_index([("created_at", -1)])

    def find_match(
        self, initiator_profile_id: str, target_profile_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find a match between two profiles.

        Args:
            initiator_profile_id: The profile ID of the initiator
            target_profile_id: The profile ID of the target

        Returns:
            The match document if found, None otherwise
        """
        match = self.collection.find_one(
            {
                "initiator_profile_id": initiator_profile_id,
                "target_profile_id": target_profile_id,
            }
        )
        if match:
            match["_id"] = str(match["_id"])
        return match

    def find_reverse_match(
        self, current_profile_id: str, target_profile_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find a match where the current user is the target and the other user is the initiator.

        Args:
            current_profile_id: The current user's profile ID
            target_profile_id: The profile ID that the current user is targeting

        Returns:
            The match document if found, None otherwise
        """
        match = self.collection.find_one(
            {
                "initiator_profile_id": target_profile_id,
                "target_profile_id": current_profile_id,
            }
        )
        if match:
            match["_id"] = str(match["_id"])
        return match

    def create_match(
        self,
        initiator_profile_id: str,
        target_profile_id: str,
        status: str = None,
        initial_message: str = None,
    ) -> str:
        """
        Create a new match between two profiles.

        Args:
            initiator_profile_id: The profile ID of the user initiating the match
            target_profile_id: The profile ID of the user being targeted
            status: Initial status (defaults to PENDING)
            initial_message: Optional initial message from the initiator

        Returns:
            The ID of the created match
        """
        match_data = {
            "initiator_profile_id": initiator_profile_id,
            "target_profile_id": target_profile_id,
            "status": status or MatchStatus.PENDING,
            "initial_message": initial_message,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        result = self.collection.insert_one(match_data)
        return str(result.inserted_id)

    def update_match_status(self, match_id: str, status: str) -> bool:
        """
        Update the status of a match.

        Args:
            match_id: The ID of the match to update
            status: The new status

        Returns:
            True if the update was successful, False otherwise
        """
        try:
            object_id = ObjectId(match_id)
        except:
            return False

        result = self.collection.update_one(
            {"_id": object_id},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count > 0

    def update_match_status_by_profiles(
        self, initiator_profile_id: str, target_profile_id: str, status: str
    ) -> bool:
        """
        Update the status of a match by profile IDs.

        Args:
            initiator_profile_id: The profile ID of the initiator
            target_profile_id: The profile ID of the target
            status: The new status

        Returns:
            True if the update was successful, False otherwise
        """
        result = self.collection.update_one(
            {
                "initiator_profile_id": initiator_profile_id,
                "target_profile_id": target_profile_id,
            },
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count > 0

    def get_matches_for_profile(
        self,
        profile_id: str,
        status: Optional[str] = None,
        as_initiator: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get all matches for a profile.

        Args:
            profile_id: The profile ID to get matches for
            status: Optional status filter
            as_initiator: If True, only return matches where profile is initiator.
                         If False, only return matches where profile is target.
                         If None, return all matches.

        Returns:
            List of match documents
        """
        query = {}

        if as_initiator is True:
            query["initiator_profile_id"] = profile_id
        elif as_initiator is False:
            query["target_profile_id"] = profile_id
        else:
            # Get matches where profile is either initiator or target
            query["$or"] = [
                {"initiator_profile_id": profile_id},
                {"target_profile_id": profile_id},
            ]

        if status:
            query["status"] = status

        cursor = self.collection.find(query).sort("created_at", -1)

        matches = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            matches.append(doc)

        return matches

    def get_accepted_matches(self, profile_id: str) -> List[Dict[str, Any]]:
        """
        Get all accepted (mutual) matches for a profile.

        Args:
            profile_id: The profile ID to get matches for

        Returns:
            List of accepted match documents
        """
        return self.get_matches_for_profile(profile_id, status=MatchStatus.ACCEPTED)

    def get_pending_matches_received(self, profile_id: str) -> List[Dict[str, Any]]:
        """
        Get pending matches where the profile is the target (received requests).

        Args:
            profile_id: The profile ID

        Returns:
            List of pending match documents where profile is target
        """
        return self.get_matches_for_profile(
            profile_id, status=MatchStatus.PENDING, as_initiator=False
        )

    def get_pending_matches_sent(self, profile_id: str) -> List[Dict[str, Any]]:
        """
        Get pending matches where the profile is the initiator (sent requests).

        Args:
            profile_id: The profile ID

        Returns:
            List of pending match documents where profile is initiator
        """
        return self.get_matches_for_profile(
            profile_id, status=MatchStatus.PENDING, as_initiator=True
        )

    def is_matched(self, profile1_id: str, profile2_id: str) -> bool:
        """
        Check if two profiles have an accepted match.

        Args:
            profile1_id: First profile ID
            profile2_id: Second profile ID

        Returns:
            True if there's an accepted match between the profiles
        """
        match = self.collection.find_one(
            {
                "$or": [
                    {
                        "initiator_profile_id": profile1_id,
                        "target_profile_id": profile2_id,
                        "status": MatchStatus.ACCEPTED,
                    },
                    {
                        "initiator_profile_id": profile2_id,
                        "target_profile_id": profile1_id,
                        "status": MatchStatus.ACCEPTED,
                    },
                ]
            }
        )
        return match is not None

    def delete_match(self, match_id: str) -> bool:
        """
        Delete a match.

        Args:
            match_id: The ID of the match to delete

        Returns:
            True if the match was deleted, False otherwise
        """
        try:
            object_id = ObjectId(match_id)
        except:
            return False

        result = self.collection.delete_one({"_id": object_id})
        return result.deleted_count > 0

    def delete_matches_for_profile(self, profile_id: str) -> int:
        """
        Delete all matches for a profile.

        Args:
            profile_id: The profile ID

        Returns:
            Number of matches deleted
        """
        result = self.collection.delete_many(
            {
                "$or": [
                    {"initiator_profile_id": profile_id},
                    {"target_profile_id": profile_id},
                ]
            }
        )
        return result.deleted_count

    def handle_like(
        self, current_profile_id: str, target_profile_id: str, message: str = None
    ) -> Dict[str, Any]:
        """
        Handle a like action from one profile to another with an optional message.
        This implements the matching logic:
        - Check if there's a reverse match (target liked current user)
        - If yes and status is PENDING, update to ACCEPTED (mutual match)
        - If no reverse match, create a new PENDING match

        Args:
            current_profile_id: The profile ID of the user performing the like
            target_profile_id: The profile ID being liked
            message: Optional message to send with the like

        Returns:
            Dictionary with the result of the action
        """
        # First check if current user already liked this profile
        existing_match = self.find_match(current_profile_id, target_profile_id)
        if existing_match:
            return {
                "action": "already_liked",
                "match_id": existing_match["_id"],
                "status": existing_match["status"],
                "message": "You have already liked this profile",
            }

        # Check for reverse match (target user liked current user)
        reverse_match = self.find_reverse_match(current_profile_id, target_profile_id)

        if reverse_match and reverse_match["status"] == MatchStatus.PENDING:
            # Mutual match! Update the existing match to ACCEPTED
            success = self.update_match_status_by_profiles(
                target_profile_id, current_profile_id, MatchStatus.ACCEPTED
            )
            if success:
                return {
                    "action": "mutual_match",
                    "match_id": reverse_match["_id"],
                    "status": MatchStatus.ACCEPTED,
                    "message": "It's a match! You both like each other",
                    "reverse_match_message": reverse_match.get("initial_message"),
                    "current_message": message,
                }
            else:
                return {
                    "action": "error",
                    "message": "Failed to update match status",
                }

        # No reverse match or reverse match is not pending, create new pending match
        match_id = self.create_match(
            current_profile_id, target_profile_id, initial_message=message
        )
        return {
            "action": "like_sent",
            "match_id": match_id,
            "status": MatchStatus.PENDING,
            "message": "Like sent successfully",
            "initial_message": message,
        }
