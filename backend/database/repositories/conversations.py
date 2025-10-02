"""Repository for managing conversations between matched profiles."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import logging

# Constants for bucket pattern
MESSAGES_PER_BUCKET = 100  # Maximum messages per bucket

logger = logging.getLogger(__name__)


class ConversationsRepository:
    """Repository for managing conversations using bucket pattern."""

    def __init__(self, db):
        self.collection = db["conversations"]
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create necessary indexes for efficient querying."""
        # Index for finding conversations by match_id
        self.collection.create_index([("match_id", 1)])

        # Index for finding conversations by match_id and bucket_number
        self.collection.create_index([("match_id", 1), ("bucket_number", 1)])

        # Index for sorting by creation date
        self.collection.create_index([("created_at", -1)])

    def create_conversation(
        self,
        match_id: str,
        sender_profile_id: str,
        sender_name: str,
        message_content: str,
    ) -> str:
        """
        Create a new conversation with the first message.

        Args:
            match_id: The ID of the match this conversation belongs to
            sender_profile_id: The profile ID of the message sender
            sender_name: The name of the sender
            message_content: The content of the message

        Returns:
            The ID of the created conversation bucket
        """
        conversation_data = {
            "match_id": match_id,
            "bucket_number": 1,
            "message_count": 1,
            "messages": [
                {
                    "datetime": datetime.now(timezone.utc),
                    "sender_profile_id": sender_profile_id,
                    "sender_name": sender_name,
                    "content": message_content,
                }
            ],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        result = self.collection.insert_one(conversation_data)
        return str(result.inserted_id)

    def add_message(
        self,
        match_id: str,
        sender_profile_id: str,
        sender_name: str,
        message_content: str,
    ) -> bool:
        """
        Add a message to an existing conversation.
        Implements bucket pattern - creates new bucket if current is full.

        Args:
            match_id: The ID of the match this conversation belongs to
            sender_profile_id: The profile ID of the message sender
            sender_name: The name of the sender
            message_content: The content of the message

        Returns:
            True if message was added successfully, False otherwise
        """
        # Find the latest bucket for this conversation
        latest_bucket = self.collection.find_one(
            {"match_id": match_id}, sort=[("bucket_number", -1)]
        )

        if not latest_bucket:
            # No conversation exists, create one
            self.create_conversation(
                match_id, sender_profile_id, sender_name, message_content
            )
            return True

        # Check if current bucket is full
        if latest_bucket["message_count"] >= MESSAGES_PER_BUCKET:
            # Create a new bucket
            new_bucket_data = {
                "match_id": match_id,
                "bucket_number": latest_bucket["bucket_number"] + 1,
                "message_count": 1,
                "messages": [
                    {
                        "datetime": datetime.now(timezone.utc),
                        "sender_profile_id": sender_profile_id,
                        "sender_name": sender_name,
                        "content": message_content,
                    }
                ],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            result = self.collection.insert_one(new_bucket_data)
            return result.inserted_id is not None
        else:
            # Add message to current bucket
            new_message = {
                "datetime": datetime.now(timezone.utc),
                "sender_profile_id": sender_profile_id,
                "sender_name": sender_name,
                "content": message_content,
            }

            result = self.collection.update_one(
                {"_id": latest_bucket["_id"]},
                {
                    "$push": {"messages": new_message},
                    "$inc": {"message_count": 1},
                    "$set": {"updated_at": datetime.now(timezone.utc)},
                },
            )
            return result.modified_count > 0

    def get_conversation(
        self, match_id: str, limit: Optional[int] = None, skip: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all messages for a conversation.

        Args:
            match_id: The ID of the match
            limit: Optional limit on number of messages to return
            skip: Optional number of messages to skip (for pagination)

        Returns:
            List of messages in chronological order
        """
        # Get all buckets for this conversation
        buckets = list(
            self.collection.find({"match_id": match_id}).sort("bucket_number", 1)
        )

        if not buckets:
            return []

        # Flatten all messages from all buckets
        all_messages = []
        for bucket in buckets:
            for message in bucket.get("messages", []):
                all_messages.append(message)

        # Apply pagination if requested
        if skip:
            all_messages = all_messages[skip:]
        if limit:
            all_messages = all_messages[:limit]

        return all_messages

    def get_latest_messages(
        self, match_id: str, count: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get the latest N messages from a conversation.

        Args:
            match_id: The ID of the match
            count: Number of latest messages to retrieve

        Returns:
            List of latest messages in chronological order
        """
        # Get all buckets for this conversation, sorted by bucket number descending
        buckets = list(
            self.collection.find({"match_id": match_id}).sort("bucket_number", -1)
        )

        if not buckets:
            return []

        # Collect messages from buckets until we have enough
        messages = []
        for bucket in buckets:
            bucket_messages = bucket.get("messages", [])
            # Add messages from this bucket (they're already in chronological order)
            messages = bucket_messages + messages

            if len(messages) >= count:
                # We have enough messages, trim to exact count
                messages = messages[-count:]
                break

        return messages

    def get_conversation_summary(self, match_id: str) -> Dict[str, Any]:
        """
        Get a summary of a conversation.

        Args:
            match_id: The ID of the match

        Returns:
            Dictionary with conversation summary
        """
        # Get all buckets for this conversation
        buckets = list(
            self.collection.find({"match_id": match_id}).sort("bucket_number", 1)
        )

        if not buckets:
            return {
                "match_id": match_id,
                "total_messages": 0,
                "total_buckets": 0,
                "first_message": None,
                "last_message": None,
                "created_at": None,
                "updated_at": None,
            }

        # Calculate total messages
        total_messages = sum(bucket["message_count"] for bucket in buckets)

        # Get first and last messages
        first_bucket = buckets[0]
        last_bucket = buckets[-1]

        first_message = (
            first_bucket["messages"][0] if first_bucket.get("messages") else None
        )
        last_message = (
            last_bucket["messages"][-1] if last_bucket.get("messages") else None
        )

        return {
            "match_id": match_id,
            "total_messages": total_messages,
            "total_buckets": len(buckets),
            "first_message": first_message,
            "last_message": last_message,
            "created_at": first_bucket.get("created_at"),
            "updated_at": last_bucket.get("updated_at"),
        }

    def get_conversations_for_matches(
        self, match_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get conversation summaries for multiple matches.

        Args:
            match_ids: List of match IDs

        Returns:
            Dictionary mapping match_id to conversation summary
        """
        summaries = {}
        for match_id in match_ids:
            summaries[match_id] = self.get_conversation_summary(match_id)
        return summaries

    def delete_conversation(self, match_id: str) -> int:
        """
        Delete all conversation buckets for a match.

        Args:
            match_id: The ID of the match

        Returns:
            Number of buckets deleted
        """
        result = self.collection.delete_many({"match_id": match_id})
        return result.deleted_count

    def conversation_exists(self, match_id: str) -> bool:
        """
        Check if a conversation exists for a match.

        Args:
            match_id: The ID of the match

        Returns:
            True if conversation exists, False otherwise
        """
        return self.collection.find_one({"match_id": match_id}) is not None

    def get_unread_count(
        self,
        match_id: str,
        profile_id: str,
        last_read_datetime: Optional[datetime] = None,
    ) -> int:
        """
        Get count of unread messages for a profile in a conversation.

        Args:
            match_id: The ID of the match
            profile_id: The profile ID of the reader
            last_read_datetime: The datetime of the last read message

        Returns:
            Number of unread messages
        """
        if not last_read_datetime:
            # If no last read time, all messages from others are unread
            all_messages = self.get_conversation(match_id)
            return sum(
                1 for msg in all_messages if msg.get("sender_profile_id") != profile_id
            )

        # Count messages after last_read_datetime that are not from this profile
        all_messages = self.get_conversation(match_id)
        unread_count = 0
        for msg in all_messages:
            if (
                msg.get("datetime") > last_read_datetime
                and msg.get("sender_profile_id") != profile_id
            ):
                unread_count += 1

        return unread_count
