"""
Test file for conversations functionality.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timezone
from database.repositories.conversations import (
    ConversationsRepository,
    MESSAGES_PER_BUCKET,
)
from database.repositories.matches import MatchesRepository
from database.mongo_database import MongoDatabase
from bson import ObjectId


class TestConversationsRepository:
    """Test cases for ConversationsRepository."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_db = MagicMock()
        self.mock_collection = MagicMock()
        self.mock_db.__getitem__.return_value = self.mock_collection
        self.repo = ConversationsRepository(self.mock_db)

    def test_create_conversation(self):
        """Test creating a new conversation with initial message."""
        # Arrange
        match_id = "match123"
        sender_profile_id = "profile123"
        sender_name = "John"
        message_content = "Hello! Nice to meet you."

        mock_inserted_id = ObjectId()
        self.mock_collection.insert_one.return_value.inserted_id = mock_inserted_id

        # Act
        result = self.repo.create_conversation(
            match_id, sender_profile_id, sender_name, message_content
        )

        # Assert
        assert result == str(mock_inserted_id)
        self.mock_collection.insert_one.assert_called_once()

        # Verify the conversation data structure
        call_args = self.mock_collection.insert_one.call_args[0][0]
        assert call_args["match_id"] == match_id
        assert call_args["bucket_number"] == 1
        assert call_args["message_count"] == 1
        assert len(call_args["messages"]) == 1
        assert call_args["messages"][0]["sender_profile_id"] == sender_profile_id
        assert call_args["messages"][0]["sender_name"] == sender_name
        assert call_args["messages"][0]["content"] == message_content

    def test_add_message_to_existing_conversation(self):
        """Test adding a message to an existing conversation."""
        # Arrange
        match_id = "match123"
        sender_profile_id = "profile456"
        sender_name = "Jane"
        message_content = "Hi! Nice to meet you too."

        # Mock existing bucket with room for more messages
        existing_bucket = {
            "_id": ObjectId(),
            "match_id": match_id,
            "bucket_number": 1,
            "message_count": 10,  # Less than MESSAGES_PER_BUCKET
            "messages": [],
        }
        self.mock_collection.find_one.return_value = existing_bucket
        self.mock_collection.update_one.return_value.modified_count = 1

        # Act
        result = self.repo.add_message(
            match_id, sender_profile_id, sender_name, message_content
        )

        # Assert
        assert result is True
        self.mock_collection.update_one.assert_called_once()

        # Verify the update operation
        update_call = self.mock_collection.update_one.call_args
        assert update_call[0][0]["_id"] == existing_bucket["_id"]
        assert "$push" in update_call[0][1]
        assert "$inc" in update_call[0][1]
        assert update_call[0][1]["$inc"]["message_count"] == 1

    def test_add_message_creates_new_bucket_when_full(self):
        """Test that a new bucket is created when the current one is full."""
        # Arrange
        match_id = "match123"
        sender_profile_id = "profile789"
        sender_name = "Bob"
        message_content = "Another message"

        # Mock existing bucket that is full
        existing_bucket = {
            "_id": ObjectId(),
            "match_id": match_id,
            "bucket_number": 1,
            "message_count": MESSAGES_PER_BUCKET,  # Bucket is full
            "messages": [],
        }
        self.mock_collection.find_one.return_value = existing_bucket
        mock_inserted_id = ObjectId()
        self.mock_collection.insert_one.return_value.inserted_id = mock_inserted_id

        # Act
        result = self.repo.add_message(
            match_id, sender_profile_id, sender_name, message_content
        )

        # Assert
        assert result is True
        self.mock_collection.insert_one.assert_called_once()

        # Verify new bucket creation
        new_bucket = self.mock_collection.insert_one.call_args[0][0]
        assert new_bucket["match_id"] == match_id
        assert new_bucket["bucket_number"] == 2  # Next bucket number
        assert new_bucket["message_count"] == 1
        assert len(new_bucket["messages"]) == 1

    def test_get_conversation(self):
        """Test retrieving all messages from a conversation."""
        # Arrange
        match_id = "match123"

        # Mock multiple buckets
        buckets = [
            {
                "bucket_number": 1,
                "messages": [{"content": "Message 1"}, {"content": "Message 2"}],
            },
            {
                "bucket_number": 2,
                "messages": [{"content": "Message 3"}, {"content": "Message 4"}],
            },
        ]

        mock_cursor = MagicMock()
        mock_cursor.__iter__ = Mock(return_value=iter(buckets))
        self.mock_collection.find.return_value.sort.return_value = mock_cursor

        # Act
        result = self.repo.get_conversation(match_id)

        # Assert
        assert len(result) == 4
        assert result[0]["content"] == "Message 1"
        assert result[3]["content"] == "Message 4"

    def test_get_conversation_with_pagination(self):
        """Test retrieving messages with pagination."""
        # Arrange
        match_id = "match123"

        # Mock buckets with messages
        buckets = [
            {
                "bucket_number": 1,
                "messages": [{"content": f"Message {i}"} for i in range(1, 6)],
            }
        ]

        mock_cursor = MagicMock()
        mock_cursor.__iter__ = Mock(return_value=iter(buckets))
        self.mock_collection.find.return_value.sort.return_value = mock_cursor

        # Act
        result = self.repo.get_conversation(match_id, limit=2, skip=1)

        # Assert
        assert len(result) == 2
        assert result[0]["content"] == "Message 2"
        assert result[1]["content"] == "Message 3"

    def test_get_latest_messages(self):
        """Test retrieving the latest N messages."""
        # Arrange
        match_id = "match123"
        count = 3

        # Mock buckets in reverse order (latest first)
        buckets = [
            {
                "bucket_number": 2,
                "messages": [
                    {"content": "Message 3"},
                    {"content": "Message 4"},
                    {"content": "Message 5"},
                ],
            },
            {
                "bucket_number": 1,
                "messages": [{"content": "Message 1"}, {"content": "Message 2"}],
            },
        ]

        mock_cursor = MagicMock()
        mock_cursor.__iter__ = Mock(return_value=iter(buckets))
        self.mock_collection.find.return_value.sort.return_value = mock_cursor

        # Act
        result = self.repo.get_latest_messages(match_id, count)

        # Assert
        assert len(result) == 3
        assert result[0]["content"] == "Message 3"
        assert result[2]["content"] == "Message 5"

    def test_conversation_exists(self):
        """Test checking if a conversation exists."""
        # Arrange
        match_id = "match123"

        # Test when conversation exists
        self.mock_collection.find_one.return_value = {"match_id": match_id}

        # Act & Assert
        assert self.repo.conversation_exists(match_id) is True

        # Test when conversation doesn't exist
        self.mock_collection.find_one.return_value = None
        assert self.repo.conversation_exists(match_id) is False


class TestMatchesWithConversations:
    """Test the integration between matches and conversations."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_db = MagicMock()
        self.mongo_db = MongoDatabase()

        # Mock the repositories
        self.mongo_db.matches_repo = MagicMock()
        self.mongo_db.conversations_repo = MagicMock()
        self.mongo_db.profiles_repo = MagicMock()

    def test_handle_profile_like_with_message_creates_conversation(self):
        """Test that liking a profile with a message creates a conversation."""
        # Arrange
        current_profile_id = "profile123"
        target_profile_id = "profile456"
        message = "Hi! I'd love to connect with you."

        # Mock profile data
        current_profile = {"_id": current_profile_id, "first_name": "John"}
        self.mongo_db.profiles_repo.get_profile.return_value = current_profile

        # Mock successful like action
        self.mongo_db.matches_repo.handle_like.return_value = {
            "action": "like_sent",
            "match_id": "match789",
            "status": "PENDING",
            "message": "Like sent successfully",
            "initial_message": message,
        }

        # Act
        result = self.mongo_db.handle_profile_like(
            current_profile_id, target_profile_id, message
        )

        # Assert
        assert result["action"] == "like_sent"
        self.mongo_db.conversations_repo.create_conversation.assert_called_once_with(
            "match789", current_profile_id, "John", message
        )

    def test_mutual_match_adds_second_message(self):
        """Test that a mutual match adds the second message to existing conversation."""
        # Arrange
        current_profile_id = "profile456"
        target_profile_id = "profile123"
        message = "Hi back! Great to connect!"

        # Mock profile data
        current_profile = {"_id": current_profile_id, "first_name": "Jane"}
        self.mongo_db.profiles_repo.get_profile.return_value = current_profile

        # Mock mutual match result
        self.mongo_db.matches_repo.handle_like.return_value = {
            "action": "mutual_match",
            "match_id": "match789",
            "status": "ACCEPTED",
            "message": "It's a match! You both like each other",
            "reverse_match_message": "Hi! I'd love to connect.",
            "current_message": message,
        }

        # Mock that conversation exists
        self.mongo_db.conversations_repo.conversation_exists.return_value = True

        # Act
        result = self.mongo_db.handle_profile_like(
            current_profile_id, target_profile_id, message
        )

        # Assert
        assert result["action"] == "mutual_match"
        self.mongo_db.conversations_repo.add_message.assert_called_once_with(
            "match789", current_profile_id, "Jane", message
        )


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])
