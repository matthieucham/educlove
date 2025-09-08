"""
Common test configuration and fixtures for backend tests.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
import os
import sys
import json
import base64

# Set environment variables for testing
os.environ["SKIP_JWT_VERIFICATION"] = "true"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/test"  # Dummy URI

# Test configuration
TEST_USER_ID = "test-user-123"
TEST_EMAIL = "test@example.com"
TEST_NAME = "John Doe"

# Test data for profiles
PARIS_COORDS = [2.3522, 48.8566]
LYON_COORDS = [4.8357, 45.764]
MARSEILLE_COORDS = [5.3698, 43.2965]

SAMPLE_PROFILES = [
    {
        "_id": "test-profile-1",
        "first_name": "Alice",
        "age": 28,
        "location": {
            "type": "Point",
            "coordinates": PARIS_COORDS,
            "city_name": "Paris",
        },
        "looking_for": "Relation sérieuse",
        "subject": "Physique",
        "experience_years": 6,
        "photos": [],
        "description": "Test profile 1",
        "goals": "Test goals 1",
        "email": "alice@test.com",
    },
    {
        "_id": "test-profile-2",
        "first_name": "Bob",
        "age": 32,
        "location": {"type": "Point", "coordinates": LYON_COORDS, "city_name": "Lyon"},
        "looking_for": "Amitié",
        "subject": "Histoire",
        "experience_years": 8,
        "photos": [],
        "description": "Test profile 2",
        "goals": "Test goals 2",
        "email": "bob@test.com",
    },
    {
        "_id": "test-profile-3",
        "first_name": "Clara",
        "age": 25,
        "location": {
            "type": "Point",
            "coordinates": MARSEILLE_COORDS,
            "city_name": "Marseille",
        },
        "looking_for": "Relation légère",
        "subject": "Biologie",
        "experience_years": 3,
        "photos": [],
        "description": "Test profile 3",
        "goals": "Test goals 3",
        "email": "clara@test.com",
    },
]


def create_mock_db():
    """Create a mock database with all necessary methods."""
    mock_db = MagicMock()

    # Mock basic database methods
    mock_db.connect = Mock()
    mock_db.disconnect = Mock()
    mock_db.upsert_user = Mock(return_value=TEST_USER_ID)
    mock_db.get_user_by_id = Mock(
        return_value={
            "sub": TEST_USER_ID,
            "email": TEST_EMAIL,
            "name": TEST_NAME,
            "provider": "test-provider",
            "profile_id": None,
        }
    )
    mock_db.get_profile = Mock(return_value=None)
    mock_db.search_profiles = Mock(return_value=[])
    mock_db.create_profile = Mock(return_value="test-profile-id")

    # Mock repositories
    mock_db.users_repo = MagicMock()
    mock_db.users_repo.upsert_user = Mock(return_value=TEST_USER_ID)
    mock_db.users_repo.update_user_profile = Mock()

    mock_db.profiles_repo = MagicMock()
    mock_db.profiles_repo.search_profiles = Mock(return_value=[])
    mock_db.profiles_repo.get_profile = Mock(return_value=None)

    mock_db.matches_repo = MagicMock()

    return mock_db


@pytest.fixture
def app_with_mock_db():
    """Create app with mocked database."""
    # Mock the MongoDatabase class before importing main
    with patch("database.mongo_database.MongoDatabase") as MockDB:
        # Configure the mock
        mock_db_instance = create_mock_db()
        MockDB.return_value = mock_db_instance

        # Clear any cached imports
        if "main" in sys.modules:
            del sys.modules["main"]
        if "routes.auth" in sys.modules:
            del sys.modules["routes.auth"]
        if "routes.profiles" in sys.modules:
            del sys.modules["routes.profiles"]
        if "routes.matches" in sys.modules:
            del sys.modules["routes.matches"]

        # Import main which will use the mocked database
        from main import app

        # Store the mock for later use
        app.mock_db = mock_db_instance

        yield app

        # Cleanup
        if "main" in sys.modules:
            del sys.modules["main"]


@pytest.fixture
def client(app_with_mock_db):
    """Create a test client."""
    return TestClient(app_with_mock_db)


@pytest.fixture
def test_token():
    """Create a test JWT token for authentication."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": TEST_USER_ID,
        "email": TEST_EMAIL,
        "name": TEST_NAME,
        "iss": "test-provider",
    }

    header_b64 = (
        base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    )
    payload_b64 = (
        base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    )

    return f"{header_b64}.{payload_b64}.test-signature"


@pytest.fixture
def auth_headers(test_token):
    """Create authorization headers with test token."""
    return {"Authorization": f"Bearer {test_token}"}
