"""
Test suite for profiles endpoints and geolocation functionality.
"""

import pytest
import json
from conftest import TEST_USER_ID, SAMPLE_PROFILES, PARIS_COORDS


class TestProfiles:
    """Test suite for profiles endpoints."""

    def test_get_profiles_for_user_no_criteria(
        self, client, auth_headers, app_with_mock_db
    ):
        """Test getting a single random profile when user has no search criteria."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.get_search_criteria.return_value = None
        # Now returns a single random profile
        mock_db.get_random_profile_for_user.return_value = SAMPLE_PROFILES[0]

        # Make request
        response = client.get("/profiles/", headers=auth_headers)

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["profiles"]) == 1
        assert data["profiles"][0]["first_name"] == "Alice"

    def test_get_profiles_for_user_with_criteria(
        self, client, auth_headers, app_with_mock_db
    ):
        """Test getting a single random profile when user has search criteria."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.get_search_criteria.return_value = {
            "gender": ["Femme"],
            "age_min": 25,
            "age_max": 35,
        }
        # Return a single random profile
        mock_db.get_random_profile_for_user.return_value = SAMPLE_PROFILES[0]

        # Make request
        response = client.get("/profiles/", headers=auth_headers)

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["profiles"]) == 1
        assert data["search_criteria"]["gender"] == ["Femme"]

    def test_get_profiles_unauthorized(self, client):
        """Test getting profiles without authentication."""
        # Make request without auth headers
        response = client.get("/profiles/")

        # Should return 403 Forbidden
        assert response.status_code == 403


class TestMyProfile:
    """Test suite for my-profile endpoints."""

    def test_create_my_profile(self, client, auth_headers, app_with_mock_db):
        """Test creating a new profile for the authenticated user."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.upsert_user.return_value = TEST_USER_ID
        mock_db.get_user_by_id.return_value = {"_id": TEST_USER_ID}  # No profile_id
        mock_db.create_profile.return_value = "new-profile-id"

        # Profile data
        profile_data = {
            "first_name": "Test",
            "date_of_birth": "1994-01-01",
            "gender": "MALE",
            "location": {
                "city_name": "Paris",
                "coordinates": PARIS_COORDS,
            },
            "looking_for": ["SERIOUS"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Mathématiques",
            "description": "Test description",
            "goals": "Test goals",
            "email": "test@example.com",
        }

        # Make request
        response = client.post(
            "/profiles/my-profile", json=profile_data, headers=auth_headers
        )

        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data["profile_id"] == "new-profile-id"
        assert data["message"] == "Profile created successfully"

        # Verify database calls
        mock_db.create_profile.assert_called_once()
        mock_db.users_repo.update_user_profile.assert_called_once_with(
            TEST_USER_ID, "new-profile-id"
        )

    def test_create_my_profile_already_exists(
        self, client, auth_headers, app_with_mock_db
    ):
        """Test creating a profile when user already has one."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.upsert_user.return_value = TEST_USER_ID
        mock_db.get_user_by_id.return_value = {
            "_id": TEST_USER_ID,
            "profile_id": "existing-profile",
        }

        # Complete profile data with all required fields
        profile_data = {
            "first_name": "Test",
            "date_of_birth": "1994-01-01",
            "gender": "MALE",
            "location": {
                "city_name": "Paris",
                "coordinates": PARIS_COORDS,
            },
            "looking_for": ["SERIOUS"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Mathématiques",
            "description": "Test description",
            "goals": "Test goals",
            "email": "test@example.com",
        }

        # Make request
        response = client.post(
            "/profiles/my-profile", json=profile_data, headers=auth_headers
        )

        # Assertions
        assert response.status_code == 400
        assert "already has a profile" in response.json()["detail"]

    def test_get_my_profile(self, client, auth_headers, app_with_mock_db):
        """Test getting the authenticated user's profile."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {
            "_id": TEST_USER_ID,
            "profile_id": "test-profile-1",
        }
        mock_db.get_profile.return_value = SAMPLE_PROFILES[0]

        # Make request
        response = client.get("/profiles/my-profile", headers=auth_headers)

        # Assertions
        assert response.status_code == 200
        profile = response.json()
        assert profile["_id"] == "test-profile-1"
        assert profile["first_name"] == "Alice"

    def test_get_my_profile_not_found(self, client, auth_headers, app_with_mock_db):
        """Test getting profile when user has no profile."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}  # No profile_id

        # Make request
        response = client.get("/profiles/my-profile", headers=auth_headers)

        # Assertions
        assert response.status_code == 404
        assert response.json()["detail"] == "User has no profile"

    def test_update_my_profile(self, client, auth_headers, app_with_mock_db):
        """Test updating the authenticated user's profile."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {
            "_id": TEST_USER_ID,
            "profile_id": "test-profile-1",
        }

        # Complete updated profile data with all required fields
        profile_data = {
            "location": {
                "city_name": "Paris",
                "coordinates": PARIS_COORDS,
            },
            "looking_for": ["SERIOUS"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Mathématiques",
            "description": "Updated description",
            "goals": "Updated goals",
            "email": "test@example.com",
        }

        # Make request
        response = client.put(
            "/profiles/my-profile", json=profile_data, headers=auth_headers
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["profile_id"] == "test-profile-1"
        assert data["message"] == "Profile updated successfully"

        # Verify the update was called with correct data
        mock_db.profiles_repo.update_profile.assert_called_once()

    def test_delete_my_profile(self, client, auth_headers, app_with_mock_db):
        """Test deleting the authenticated user's profile."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {
            "_id": TEST_USER_ID,
            "profile_id": "test-profile-1",
        }

        # Make request
        response = client.delete("/profiles/my-profile", headers=auth_headers)

        # Assertions
        assert response.status_code == 200
        # Note: Delete is not yet implemented, so we get a placeholder response
        assert "deletion not yet implemented" in response.json()["message"]


class TestSearchCriteria:
    """Test suite for search criteria endpoints."""

    def test_save_search_criteria(self, client, auth_headers, app_with_mock_db):
        """Test saving search criteria for the authenticated user."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.upsert_search_criteria.return_value = "criteria-id"

        # Search criteria data
        criteria_data = {
            "gender": ["Femme"],
            "age_min": 25,
            "age_max": 35,
            "locations": [{"city_name": "Paris", "coordinates": PARIS_COORDS}],
            "radii": [50],
        }

        # Make request
        response = client.post(
            "/profiles/my-profile/search-criteria",
            json=criteria_data,
            headers=auth_headers,
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["criteria_id"] == "criteria-id"
        assert data["message"] == "Search criteria saved successfully"

    def test_get_search_criteria(self, client, auth_headers, app_with_mock_db):
        """Test getting search criteria for the authenticated user."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.get_search_criteria.return_value = {
            "_id": "criteria-id",
            "user_id": TEST_USER_ID,
            "gender": ["Femme"],
            "age_min": 25,
            "age_max": 35,
        }

        # Make request
        response = client.get(
            "/profiles/my-profile/search-criteria", headers=auth_headers
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["criteria"]["gender"] == ["Femme"]
        assert data["criteria"]["age_min"] == 25

    def test_get_search_criteria_not_found(
        self, client, auth_headers, app_with_mock_db
    ):
        """Test getting search criteria when none exist."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.get_search_criteria.return_value = None

        # Make request
        response = client.get(
            "/profiles/my-profile/search-criteria", headers=auth_headers
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["criteria"] is None
        assert "No search criteria found" in data["message"]

    def test_update_search_criteria(self, client, auth_headers, app_with_mock_db):
        """Test updating search criteria (PUT is an alias for POST)."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.upsert_search_criteria.return_value = "criteria-id"

        # Updated criteria data
        criteria_data = {"gender": ["Homme", "Femme"], "age_min": 20, "age_max": 40}

        # Make request
        response = client.put(
            "/profiles/my-profile/search-criteria",
            json=criteria_data,
            headers=auth_headers,
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["criteria_id"] == "criteria-id"

    def test_delete_search_criteria(self, client, auth_headers, app_with_mock_db):
        """Test deleting search criteria for the authenticated user."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.delete_search_criteria.return_value = True

        # Make request
        response = client.delete(
            "/profiles/my-profile/search-criteria", headers=auth_headers
        )

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Search criteria deleted successfully"

    def test_delete_search_criteria_not_found(
        self, client, auth_headers, app_with_mock_db
    ):
        """Test deleting search criteria when none exist."""
        # Configure the mock
        mock_db = app_with_mock_db.mock_db
        mock_db.get_user_by_sub.return_value = {"_id": TEST_USER_ID}
        mock_db.delete_search_criteria.return_value = False

        # Make request
        response = client.delete(
            "/profiles/my-profile/search-criteria", headers=auth_headers
        )

        # Assertions
        assert response.status_code == 404
        assert "No search criteria found to delete" in response.json()["detail"]


class TestGeolocation:
    """Test suite for geolocation functionality."""

    def test_location_data_structure(self):
        """Test that location data has correct GeoJSON format."""
        for profile in SAMPLE_PROFILES:
            location = profile["location"]

            # Check GeoJSON format
            assert location["type"] == "Point"
            assert isinstance(location["coordinates"], list)
            assert len(location["coordinates"]) == 2
            assert isinstance(location["coordinates"][0], (int, float))
            assert isinstance(location["coordinates"][1], (int, float))

            # Check city name
            assert "city_name" in location
            assert isinstance(location["city_name"], str)

    def test_coordinates_format(self):
        """Test that coordinates are in [longitude, latitude] format."""
        location = SAMPLE_PROFILES[0]["location"]
        coords = location["coordinates"]

        # Should be [longitude, latitude]
        assert coords[0] == PARIS_COORDS[0]  # Longitude
        assert coords[1] == PARIS_COORDS[1]  # Latitude
