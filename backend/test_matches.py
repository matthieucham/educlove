"""Tests for the matching system."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, date
from bson import ObjectId
from constants import MatchStatus


@pytest.fixture
def mock_db():
    """Create a mock database with necessary methods."""
    db = Mock()

    # Mock repositories
    db.users_repo = Mock()
    db.profiles_repo = Mock()
    db.matches_repo = Mock()

    # Add convenience methods that delegate to repositories
    db.get_user_by_sub = db.users_repo.get_user_by_sub
    db.get_profile = db.profiles_repo.get_profile
    db.handle_profile_like = db.matches_repo.handle_like
    db.get_matches_for_profile = db.matches_repo.get_matches_for_profile
    db.get_accepted_matches = db.matches_repo.get_accepted_matches
    db.get_pending_matches_sent = db.matches_repo.get_pending_matches_sent
    db.get_pending_matches_received = db.matches_repo.get_pending_matches_received

    return db


@pytest.fixture
def client(mock_db, mock_current_user):
    """Create a test client with mocked dependencies."""
    from main import app
    from auth import get_current_user

    # Override the database dependency
    from routes.profiles import get_db

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: mock_current_user

    client = TestClient(app)
    yield client

    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def mock_current_user():
    """Create a mock authenticated user."""
    from models import User

    return User(
        sub="test-user-123",
        email="test@example.com",
        name="Test User",
        provider="test",
        email_verified=True,
        profile_completed=True,
    )


@pytest.fixture
def sample_profiles():
    """Create sample profile data for testing."""
    return {
        "user1": {
            "_id": "profile1",
            "first_name": "Alice",
            "date_of_birth": date(1990, 1, 1),
            "gender": "FEMALE",
            "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
            "looking_for": ["SERIOUS"],
            "looking_for_gender": ["MALE"],
            "subject": "Mathematics",
            "email": "alice@example.com",
        },
        "user2": {
            "_id": "profile2",
            "first_name": "Bob",
            "date_of_birth": date(1988, 5, 15),
            "gender": "MALE",
            "location": {"city_name": "Lyon", "coordinates": [4.8357, 45.7640]},
            "looking_for": ["SERIOUS"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Physics",
            "email": "bob@example.com",
        },
        "user3": {
            "_id": "profile3",
            "first_name": "Charlie",
            "date_of_birth": date(1992, 3, 20),
            "gender": "MALE",
            "location": {"city_name": "Marseille", "coordinates": [5.3698, 43.2965]},
            "looking_for": ["CASUAL", "FRIENDSHIP"],
            "looking_for_gender": ["FEMALE", "MALE"],
            "subject": "Chemistry",
            "email": "charlie@example.com",
        },
    }


class TestLikeProfile:
    """Test the /profiles/{profile_id}:like endpoint."""

    def test_like_profile_success_new_match(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test successfully liking a profile when no reverse match exists."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }
        mock_db.get_profile.return_value = sample_profiles["user2"]
        mock_db.handle_profile_like.return_value = {
            "action": "like_sent",
            "match_id": "match123",
            "status": MatchStatus.PENDING,
            "message": "Like sent successfully",
        }

        # Make request
        response = client.post("/profiles/profile2:like")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "like_sent"
        assert data["status"] == MatchStatus.PENDING
        assert data["message"] == "Like sent successfully"

        # Verify the correct methods were called
        mock_db.get_user_by_sub.assert_called_once_with("test-user-123")
        mock_db.get_profile.assert_called_once_with("profile2")
        mock_db.handle_profile_like.assert_called_once_with("profile1", "profile2")

    def test_like_profile_mutual_match(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test liking a profile that already liked the current user (mutual match)."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }
        mock_db.get_profile.return_value = sample_profiles["user2"]
        mock_db.handle_profile_like.return_value = {
            "action": "mutual_match",
            "match_id": "match123",
            "status": MatchStatus.ACCEPTED,
            "message": "It's a match! You both like each other",
        }

        # Make request
        response = client.post("/profiles/profile2:like")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "mutual_match"
        assert data["status"] == MatchStatus.ACCEPTED
        assert "It's a match" in data["message"]

    def test_like_profile_already_liked(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test trying to like a profile that was already liked."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }
        mock_db.get_profile.return_value = sample_profiles["user2"]
        mock_db.handle_profile_like.return_value = {
            "action": "already_liked",
            "match_id": "match123",
            "status": MatchStatus.PENDING,
            "message": "You have already liked this profile",
        }

        # Make request
        response = client.post("/profiles/profile2:like")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "already_liked"
        assert data["message"] == "You have already liked this profile"

    def test_like_profile_no_profile(self, client, mock_db, mock_current_user):
        """Test liking when user hasn't completed their profile."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": None,
            "profile_completed": False,
        }

        # Make request
        response = client.post("/profiles/profile2:like")

        # Assertions
        assert response.status_code == 400
        data = response.json()
        assert "must complete your profile" in data["detail"]

    def test_like_own_profile(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test trying to like your own profile."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }
        mock_db.get_profile.return_value = sample_profiles["user1"]

        # Make request
        response = client.post("/profiles/profile1:like")

        # Assertions
        assert response.status_code == 400
        data = response.json()
        assert "cannot like your own profile" in data["detail"]

    def test_like_nonexistent_profile(self, client, mock_db, mock_current_user):
        """Test liking a profile that doesn't exist."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }
        mock_db.get_profile.return_value = None

        # Make request
        response = client.post("/profiles/nonexistent:like")

        # Assertions
        assert response.status_code == 404
        data = response.json()
        assert "Profile not found" in data["detail"]


class TestGetMatches:
    """Test the match retrieval endpoints."""

    def test_get_my_matches(self, client, mock_db, mock_current_user, sample_profiles):
        """Test getting all matches for the current user."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }

        # Mock matches
        matches = [
            {
                "_id": "match1",
                "initiator_profile_id": "profile1",
                "target_profile_id": "profile2",
                "status": MatchStatus.PENDING,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            {
                "_id": "match2",
                "initiator_profile_id": "profile3",
                "target_profile_id": "profile1",
                "status": MatchStatus.ACCEPTED,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
        ]
        mock_db.get_matches_for_profile.return_value = matches

        # Mock profile lookups
        def get_profile_side_effect(profile_id):
            if profile_id == "profile2":
                return sample_profiles["user2"]
            elif profile_id == "profile3":
                return sample_profiles["user3"]
            return None

        mock_db.get_profile.side_effect = get_profile_side_effect

        # Make request
        response = client.get("/profiles/my-matches")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["matches"]) == 2

        # Check first match (sent by current user)
        match1 = data["matches"][0]
        assert match1["match_type"] == "sent"
        assert match1["status"] == MatchStatus.PENDING
        assert match1["profile"]["first_name"] == "Bob"

        # Check second match (received by current user)
        match2 = data["matches"][1]
        assert match2["match_type"] == "received"
        assert match2["status"] == MatchStatus.ACCEPTED
        assert match2["profile"]["first_name"] == "Charlie"

    def test_get_accepted_matches(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test getting only accepted matches."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }

        # Mock accepted matches
        matches = [
            {
                "_id": "match1",
                "initiator_profile_id": "profile1",
                "target_profile_id": "profile2",
                "status": MatchStatus.ACCEPTED,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        ]
        mock_db.get_accepted_matches.return_value = matches
        mock_db.get_profile.return_value = sample_profiles["user2"]

        # Make request
        response = client.get("/profiles/my-matches/accepted")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["matches"]) == 1
        assert data["matches"][0]["profile"]["first_name"] == "Bob"

    def test_get_pending_matches_sent(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test getting pending matches sent by the user."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }

        # Mock pending sent matches
        matches = [
            {
                "_id": "match1",
                "initiator_profile_id": "profile1",
                "target_profile_id": "profile2",
                "status": MatchStatus.PENDING,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        ]
        mock_db.get_pending_matches_sent.return_value = matches
        mock_db.get_profile.return_value = sample_profiles["user2"]

        # Make request
        response = client.get("/profiles/my-matches/pending?match_type=sent")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["matches"][0]["match_type"] == "sent"
        assert data["matches"][0]["profile"]["first_name"] == "Bob"

    def test_get_pending_matches_received(
        self, client, mock_db, mock_current_user, sample_profiles
    ):
        """Test getting pending matches received by the user."""
        # Setup mocks
        mock_db.get_user_by_sub.return_value = {
            "_id": "user1",
            "profile_id": "profile1",
            "profile_completed": True,
        }

        # Mock pending received matches
        matches = [
            {
                "_id": "match1",
                "initiator_profile_id": "profile3",
                "target_profile_id": "profile1",
                "status": MatchStatus.PENDING,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        ]
        mock_db.get_pending_matches_received.return_value = matches
        mock_db.get_profile.return_value = sample_profiles["user3"]

        # Make request
        response = client.get("/profiles/my-matches/pending?match_type=received")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["matches"][0]["match_type"] == "received"
        assert data["matches"][0]["profile"]["first_name"] == "Charlie"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
