"""
Test suite for ProfileUpdate model and update_my_profile endpoint.
"""

import pytest
from datetime import date
from models import Profile, ProfileUpdate, ProfileBase
from pydantic import ValidationError


class TestProfileModels:
    """Test the Profile model hierarchy."""

    def test_profile_base_contains_common_fields(self):
        """Test that ProfileBase contains all common mutable fields."""
        expected_fields = {
            "location",
            "looking_for",
            "looking_for_gender",
            "subject",
            "photos",
            "description",
            "goals",
            "email",
        }
        actual_fields = set(ProfileBase.model_fields.keys())
        assert (
            expected_fields == actual_fields
        ), f"ProfileBase fields mismatch. Expected: {expected_fields}, Got: {actual_fields}"

    def test_profile_contains_all_fields(self):
        """Test that Profile contains both mutable and immutable fields."""
        expected_immutable = {"first_name", "date_of_birth", "gender"}
        profile_fields = set(Profile.model_fields.keys())
        base_fields = set(ProfileBase.model_fields.keys())

        # Profile should have all base fields plus immutable fields
        assert base_fields.issubset(
            profile_fields
        ), "Profile should contain all ProfileBase fields"
        assert expected_immutable.issubset(
            profile_fields
        ), "Profile should contain immutable fields"

    def test_profile_update_excludes_immutable_fields(self):
        """Test that ProfileUpdate only contains mutable fields."""
        update_fields = set(ProfileUpdate.model_fields.keys())
        base_fields = set(ProfileBase.model_fields.keys())

        # ProfileUpdate should have exactly the same fields as ProfileBase
        assert (
            update_fields == base_fields
        ), "ProfileUpdate should only have mutable fields from ProfileBase"

        # ProfileUpdate should NOT have immutable fields
        immutable_fields = {"first_name", "date_of_birth", "gender"}
        assert not immutable_fields.intersection(
            update_fields
        ), "ProfileUpdate should not contain immutable fields"

    def test_inheritance_hierarchy(self):
        """Test that both Profile and ProfileUpdate inherit from ProfileBase."""
        assert issubclass(
            Profile, ProfileBase
        ), "Profile should inherit from ProfileBase"
        assert issubclass(
            ProfileUpdate, ProfileBase
        ), "ProfileUpdate should inherit from ProfileBase"

    def test_create_profile_with_all_fields(self):
        """Test creating a Profile instance with all required fields."""
        profile_data = {
            "first_name": "John",
            "date_of_birth": date(1990, 1, 1),
            "gender": "MALE",
            "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
            "looking_for": ["FRIENDSHIP", "SERIOUS"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Mathematics",
            "photos": [],
            "description": "Test description",
            "goals": "Test goals",
            "email": "john@example.com",
        }

        profile = Profile(**profile_data)
        assert profile.first_name == "John"
        assert profile.date_of_birth == date(1990, 1, 1)
        assert profile.gender == "MALE"
        assert profile.email == "john@example.com"

    def test_create_profile_update_with_mutable_fields(self):
        """Test creating a ProfileUpdate instance with only mutable fields."""
        update_data = {
            "location": {"city_name": "Lyon", "coordinates": [4.8357, 45.7640]},
            "looking_for": ["CASUAL"],
            "looking_for_gender": ["MALE", "FEMALE"],
            "subject": "Physics",
            "photos": ["photo1.jpg"],
            "description": "Updated description",
            "goals": "Updated goals",
            "email": "john.updated@example.com",
        }

        profile_update = ProfileUpdate(**update_data)
        assert profile_update.location.city_name == "Lyon"
        assert profile_update.subject == "Physics"
        assert profile_update.email == "john.updated@example.com"

    def test_profile_update_rejects_immutable_fields(self):
        """Test that ProfileUpdate raises error when immutable fields are provided."""
        # Try to create ProfileUpdate with immutable fields
        invalid_data = {
            "first_name": "John",  # This should not be allowed
            "date_of_birth": "1990-01-01",  # This should not be allowed
            "gender": "MALE",  # This should not be allowed
            "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
            "looking_for": ["FRIENDSHIP"],
            "looking_for_gender": ["FEMALE"],
            "subject": "Mathematics",
            "photos": [],
            "description": "Test",
            "goals": "Test",
            "email": "john@example.com",
        }

        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(**invalid_data)

        # Check that the error is about unexpected fields
        errors = exc_info.value.errors()
        unexpected_fields = {
            error["loc"][0] for error in errors if error["type"] == "extra_forbidden"
        }
        assert "first_name" in unexpected_fields or any(
            "first_name" in str(error) for error in errors
        )

    def test_profile_update_missing_required_fields(self):
        """Test that ProfileUpdate requires all mutable required fields."""
        # Try to create ProfileUpdate without required fields
        incomplete_data = {
            "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
            # Missing other required fields
        }

        with pytest.raises(ValidationError) as exc_info:
            ProfileUpdate(**incomplete_data)

        # Check that required fields are reported as missing
        errors = exc_info.value.errors()
        missing_fields = {
            error["loc"][0] for error in errors if error["type"] == "missing"
        }
        assert "looking_for" in missing_fields
        assert "looking_for_gender" in missing_fields
        assert "subject" in missing_fields
        assert "email" in missing_fields


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
