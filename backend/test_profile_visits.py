"""Tests for profile visit tracking functionality."""

import pytest
from datetime import datetime, timezone
from database.mongo_database import MongoDatabase
from bson import ObjectId


@pytest.fixture
def db():
    """Create a test database instance."""
    test_db = MongoDatabase(
        uri="mongodb://root:password@localhost:27017/", db_name="educlove_test"
    )
    test_db.connect()
    yield test_db
    # Cleanup: drop test collections
    test_db.db["profile_visits"].drop()
    test_db.db["users"].drop()
    test_db.db["profiles"].drop()
    test_db.disconnect()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user_data = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
        "provider": "test",
        "email_verified": True,
        "profile_completed": True,
    }
    user_id = db.upsert_user(user_data)
    return user_id


@pytest.fixture
def test_profile(db):
    """Create a test profile."""
    profile_data = {
        "first_name": "Jane",
        "date_of_birth": "1990-01-01",
        "gender": "FEMALE",
        "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
        "looking_for": ["FRIENDSHIP"],
        "looking_for_gender": ["MALE", "FEMALE"],
        "subject": "Mathematics",
        "email": "jane@example.com",
    }
    profile_id = db.create_profile(profile_data)
    return profile_id


def test_record_visit(db, test_user, test_profile):
    """Test recording a profile visit."""
    visit_id = db.record_profile_visit(test_user, test_profile)
    assert visit_id is not None

    # Verify the visit was recorded
    has_visited = db.has_visited_profile(test_user, test_profile)
    assert has_visited is True


def test_record_duplicate_visit_updates_timestamp(db, test_user, test_profile):
    """Test that recording a duplicate visit updates the timestamp."""
    # Record first visit
    visit_id_1 = db.record_profile_visit(test_user, test_profile)

    # Get the first visit timestamp
    visits_1 = db.get_visited_profiles(test_user)
    assert len(visits_1) == 1
    first_timestamp = visits_1[0]["visited_at"]

    # Wait a moment and record second visit
    import time

    time.sleep(0.1)

    visit_id_2 = db.record_profile_visit(test_user, test_profile)

    # Should still have only one visit record
    visits_2 = db.get_visited_profiles(test_user)
    assert len(visits_2) == 1

    # But the timestamp should be updated
    second_timestamp = visits_2[0]["visited_at"]
    assert second_timestamp > first_timestamp


def test_has_visited_profile(db, test_user, test_profile):
    """Test checking if a user has visited a profile."""
    # Initially should not have visited
    has_visited = db.has_visited_profile(test_user, test_profile)
    assert has_visited is False

    # Record a visit
    db.record_profile_visit(test_user, test_profile)

    # Now should have visited
    has_visited = db.has_visited_profile(test_user, test_profile)
    assert has_visited is True


def test_get_visited_profiles(db, test_user):
    """Test retrieving visited profiles."""
    # Create multiple profiles
    profile_ids = []
    for i in range(3):
        profile_data = {
            "first_name": f"User{i}",
            "date_of_birth": "1990-01-01",
            "gender": "FEMALE",
            "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
            "looking_for": ["FRIENDSHIP"],
            "looking_for_gender": ["MALE"],
            "subject": "Mathematics",
            "email": f"user{i}@example.com",
        }
        profile_id = db.create_profile(profile_data)
        profile_ids.append(profile_id)

    # Visit all profiles
    for profile_id in profile_ids:
        db.record_profile_visit(test_user, profile_id)

    # Retrieve visited profiles
    visits = db.get_visited_profiles(test_user)
    assert len(visits) == 3

    # Verify all profile IDs are present
    visited_ids = [v["visited_profile_id"] for v in visits]
    assert set(visited_ids) == set(profile_ids)


def test_get_visited_profile_ids(db, test_user):
    """Test retrieving just the visited profile IDs."""
    # Create and visit multiple profiles
    profile_ids = []
    for i in range(2):
        profile_data = {
            "first_name": f"User{i}",
            "date_of_birth": "1990-01-01",
            "gender": "MALE",
            "location": {"city_name": "Lyon", "coordinates": [4.8357, 45.7640]},
            "looking_for": ["CASUAL"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Physics",
            "email": f"user{i}@example.com",
        }
        profile_id = db.create_profile(profile_data)
        profile_ids.append(profile_id)
        db.record_profile_visit(test_user, profile_id)

    # Get just the IDs
    visited_ids = db.get_visited_profile_ids(test_user)
    assert len(visited_ids) == 2
    assert set(visited_ids) == set(profile_ids)


def test_get_visit_count(db, test_user):
    """Test getting the count of visited profiles."""
    # Initially should be 0
    count = db.get_visit_count(test_user)
    assert count == 0

    # Create and visit profiles
    for i in range(5):
        profile_data = {
            "first_name": f"User{i}",
            "date_of_birth": "1990-01-01",
            "gender": "OTHER",
            "location": {"city_name": "Marseille", "coordinates": [5.3698, 43.2965]},
            "looking_for": ["SERIOUS"],
            "looking_for_gender": ["OTHER"],
            "subject": "Chemistry",
            "email": f"user{i}@example.com",
        }
        profile_id = db.create_profile(profile_data)
        db.record_profile_visit(test_user, profile_id)

    # Count should be 5
    count = db.get_visit_count(test_user)
    assert count == 5


def test_pagination(db, test_user):
    """Test pagination of visited profiles."""
    # Create and visit 10 profiles
    for i in range(10):
        profile_data = {
            "first_name": f"User{i}",
            "date_of_birth": "1990-01-01",
            "gender": "MALE",
            "location": {"city_name": "Nice", "coordinates": [7.2619, 43.7102]},
            "looking_for": ["FRIENDSHIP"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Biology",
            "email": f"user{i}@example.com",
        }
        profile_id = db.create_profile(profile_data)
        db.record_profile_visit(test_user, profile_id)

    # Get first page (5 items)
    page1 = db.get_visited_profiles(test_user, limit=5, skip=0)
    assert len(page1) == 5

    # Get second page (5 items)
    page2 = db.get_visited_profiles(test_user, limit=5, skip=5)
    assert len(page2) == 5

    # Verify no overlap
    page1_ids = {v["visited_profile_id"] for v in page1}
    page2_ids = {v["visited_profile_id"] for v in page2}
    assert len(page1_ids.intersection(page2_ids)) == 0


def test_ttl_index_exists(db):
    """Test that the TTL index is created on the collection."""
    indexes = db.db["profile_visits"].index_information()

    # Check for TTL index on visited_at field
    ttl_index_found = False
    for index_name, index_info in indexes.items():
        if "visited_at" in str(index_info.get("key", [])):
            if "expireAfterSeconds" in index_info:
                ttl_index_found = True
                # Verify it's set to 30 days (2592000 seconds)
                assert index_info["expireAfterSeconds"] == 2592000
                break

    assert ttl_index_found, "TTL index not found on visited_at field"


def test_unique_compound_index_exists(db):
    """Test that the unique compound index exists."""
    indexes = db.db["profile_visits"].index_information()

    # Check for unique compound index on user_id and visited_profile_id
    compound_index_found = False
    for index_name, index_info in indexes.items():
        key = index_info.get("key", [])
        if len(key) == 2:
            field_names = [field[0] for field in key]
            if "user_id" in field_names and "visited_profile_id" in field_names:
                if index_info.get("unique", False):
                    compound_index_found = True
                    break

    assert compound_index_found, "Unique compound index not found"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
