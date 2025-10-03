"""
Test the random profile selection with visited profiles exclusion.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from bson import ObjectId
from datetime import datetime, date
from database.repositories.profiles import ProfilesRepository
from database.mongo_database import MongoDatabase


class TestRandomProfileSelection:
    """Test the random profile selection functionality."""

    def test_get_random_profile_excluding_visited(self):
        """Test that visited profiles are excluded from random selection."""
        # Create a mock database
        mock_db = Mock()
        mock_collection = Mock()
        mock_db.profiles = mock_collection

        # Create repository
        repo = ProfilesRepository(mock_db)

        # Mock profile data
        mock_profile = {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "first_name": "Test",
            "date_of_birth": datetime(1990, 1, 1),
            "gender": "female",
            "looking_for_gender": ["male"],
            "location": {
                "type": "Point",
                "coordinates": [2.3522, 48.8566],
                "city_name": "Paris",
            },
        }

        # Mock aggregation result
        mock_collection.aggregate.return_value = [mock_profile]

        # Test criteria
        criteria = {
            "age_min": 25,
            "age_max": 35,
            "locations": [{"city_name": "Paris", "coordinates": [2.3522, 48.8566]}],
            "radii": [50],
        }

        # Current user profile
        current_user_profile = {"gender": "male", "looking_for_gender": ["female"]}

        # Visited profile IDs
        visited_profile_ids = ["607f1f77bcf86cd799439012", "607f1f77bcf86cd799439013"]

        # Call the method
        result = repo.get_random_profile_excluding_visited(
            criteria, current_user_profile, visited_profile_ids
        )

        # Verify the result
        assert result is not None
        assert result["_id"] == str(mock_profile["_id"])
        assert result["first_name"] == "Test"
        assert "age" in result

        # Verify the aggregation pipeline was called correctly
        mock_collection.aggregate.assert_called_once()
        pipeline = mock_collection.aggregate.call_args[0][0]

        # Check that the pipeline includes exclusion of visited profiles
        has_nin_stage = False
        for stage in pipeline:
            if "$match" in stage:
                if "_id" in stage["$match"] and "$nin" in stage["$match"]["_id"]:
                    has_nin_stage = True
                    # Verify visited IDs are ObjectIds
                    visited_oids = stage["$match"]["_id"]["$nin"]
                    assert len(visited_oids) == 2
                    break

        assert has_nin_stage, "Pipeline should exclude visited profiles"

        # Check that pipeline includes $sample stage
        has_sample = any("$sample" in stage for stage in pipeline)
        assert has_sample, "Pipeline should include $sample stage for random selection"

    def test_get_random_profile_no_matches(self):
        """Test when no profiles match the criteria."""
        # Create a mock database
        mock_db = Mock()
        mock_collection = Mock()
        mock_db.profiles = mock_collection

        # Create repository
        repo = ProfilesRepository(mock_db)

        # Mock empty aggregation result
        mock_collection.aggregate.return_value = []

        # Test criteria
        criteria = {"age_min": 25, "age_max": 35}

        # Call the method
        result = repo.get_random_profile_excluding_visited(criteria)

        # Verify the result is None
        assert result is None

    def test_mongo_database_get_random_profile_for_user(self):
        """Test the MongoDatabase wrapper method."""
        # Create a mock MongoDatabase instance
        db = MongoDatabase()

        # Mock the repositories
        db.users_repo = Mock()
        db.profiles_repo = Mock()
        db.search_criteria_repo = Mock()
        db.profile_visits_repo = Mock()

        # Mock user data
        user_id = "user123"
        mock_user = {"_id": user_id, "profile_id": "profile123"}
        db.users_repo.get_user_by_id.return_value = mock_user

        # Mock current user profile
        mock_current_profile = {
            "_id": "profile123",
            "gender": "male",
            "looking_for_gender": ["female"],
        }
        db.profiles_repo.get_profile.return_value = mock_current_profile

        # Mock search criteria
        mock_criteria = {"age_min": 25, "age_max": 35}
        db.search_criteria_repo.get_search_criteria.return_value = mock_criteria

        # Mock visited profile IDs
        mock_visited_ids = ["visited1", "visited2"]
        db.profile_visits_repo.get_visited_profile_ids.return_value = mock_visited_ids

        # Mock random profile result
        mock_random_profile = {
            "_id": "random_profile",
            "first_name": "Random",
            "age": 28,
        }
        db.profiles_repo.get_random_profile_excluding_visited.return_value = (
            mock_random_profile
        )

        # Call the method
        result = db.get_random_profile_for_user(user_id)

        # Verify the result
        assert result == mock_random_profile

        # Verify the calls
        db.users_repo.get_user_by_id.assert_called_once_with(user_id)
        db.profiles_repo.get_profile.assert_called_once_with("profile123")
        db.search_criteria_repo.get_search_criteria.assert_called_once_with(user_id)
        db.profile_visits_repo.get_visited_profile_ids.assert_called_once_with(user_id)
        db.profiles_repo.get_random_profile_excluding_visited.assert_called_once_with(
            mock_criteria, mock_current_profile, mock_visited_ids
        )

    def test_route_returns_single_profile(self):
        """Test that the route returns a single profile."""
        from routes.profiles import get_profiles_for_user
        from models import User

        # Mock dependencies
        mock_user = User(sub="test_sub", email="test@example.com", provider="auth0")
        mock_db = Mock()

        # Mock database user
        mock_db_user = {"_id": "user123"}
        mock_db.get_user_by_sub.return_value = mock_db_user

        # Mock random profile
        mock_profile = {"_id": "profile123", "first_name": "Test", "age": 30}
        mock_db.get_random_profile_for_user.return_value = mock_profile

        # Mock search criteria
        mock_criteria = {"age_min": 25}
        mock_db.get_search_criteria.return_value = mock_criteria

        # Call the route function
        result = get_profiles_for_user(current_user=mock_user, db=mock_db)

        # Verify the result
        assert "profiles" in result
        assert len(result["profiles"]) == 1
        assert result["profiles"][0] == mock_profile
        assert result["total"] == 1
        assert result["search_criteria"] == mock_criteria

        # Verify database calls
        mock_db.get_user_by_sub.assert_called_once_with("test_sub")
        mock_db.get_random_profile_for_user.assert_called_once_with("user123")

    def test_route_returns_empty_when_no_profiles(self):
        """Test that the route returns empty array when no profiles available."""
        from routes.profiles import get_profiles_for_user
        from models import User

        # Mock dependencies
        mock_user = User(sub="test_sub", email="test@example.com", provider="auth0")
        mock_db = Mock()

        # Mock database user
        mock_db_user = {"_id": "user123"}
        mock_db.get_user_by_sub.return_value = mock_db_user

        # Mock no profile found
        mock_db.get_random_profile_for_user.return_value = None

        # Mock search criteria
        mock_criteria = {"age_min": 25}
        mock_db.get_search_criteria.return_value = mock_criteria

        # Call the route function
        result = get_profiles_for_user(current_user=mock_user, db=mock_db)

        # Verify the result
        assert "profiles" in result
        assert len(result["profiles"]) == 0
        assert result["total"] == 0
        assert result["search_criteria"] == mock_criteria
        assert "message" in result
        assert "No more profiles available" in result["message"]


if __name__ == "__main__":
    # Run the tests
    test = TestRandomProfileSelection()

    print("Testing random profile selection with visited exclusion...")
    test.test_get_random_profile_excluding_visited()
    print("✓ Visited profiles are correctly excluded")

    print("\nTesting when no profiles match...")
    test.test_get_random_profile_no_matches()
    print("✓ Returns None when no matches")

    print("\nTesting MongoDatabase wrapper...")
    test.test_mongo_database_get_random_profile_for_user()
    print("✓ MongoDatabase method works correctly")

    print("\nTesting route returns single profile...")
    test.test_route_returns_single_profile()
    print("✓ Route returns single profile correctly")

    print("\nTesting route with no available profiles...")
    test.test_route_returns_empty_when_no_profiles()
    print("✓ Route handles no profiles gracefully")

    print("\n✅ All tests passed!")
