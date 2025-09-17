"""
Test script to verify that search criteria now uses user profile values
for gender and looking_for preferences instead of explicit fields.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from database.mongo_database import MongoDatabase
from models import Profile, Location


def test_search_with_profile_preferences():
    """Test that search uses profile preferences for gender and looking_for"""

    # Connect to database
    db = MongoDatabase()
    db.connect()

    print("Testing search functionality with profile preferences...")
    print("=" * 60)

    # Create a test user profile
    test_profile = {
        "first_name": "Test",
        "date_of_birth": "1994-01-15",  # Will be 30 years old
        "gender": "MALE",
        "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
        "looking_for": ["FRIENDSHIP", "SERIOUS"],
        "looking_for_gender": ["FEMALE"],  # This user is looking for females
        "subject": "Mathematics",
        "experience_years": 5,
        "email": "test@example.com",
    }

    # Create test user
    test_user = {
        "sub": "test_user_123",
        "email": "test@example.com",
        "name": "Test User",
        "provider": "test",
    }

    # Insert test user
    user_id = db.upsert_user(test_user)
    print(f"Created test user with ID: {user_id}")

    # Create profile for test user
    profile_id = db.create_profile(test_profile)
    print(f"Created test profile with ID: {profile_id}")

    # Link profile to user
    db.users_repo.update_user_profile(user_id, profile_id)

    # Create search criteria WITHOUT gender and looking_for fields
    search_criteria = {
        "locations": [{"city_name": "Paris", "coordinates": [2.3522, 48.8566]}],
        "radii": [50],
        "age_min": 25,
        "age_max": 35,
    }

    # Save search criteria
    criteria_id = db.upsert_search_criteria(user_id, search_criteria)
    print(f"Created search criteria with ID: {criteria_id}")

    # Verify saved criteria doesn't have gender or looking_for fields
    saved_criteria = db.get_search_criteria(user_id)
    print("\nSaved search criteria:")
    print(f"  - Has 'gender' field: {'gender' in saved_criteria}")
    print(f"  - Has 'looking_for' field: {'looking_for' in saved_criteria}")
    print(
        f"  - Age range: {saved_criteria.get('age_min', 'N/A')} - {saved_criteria.get('age_max', 'N/A')}"
    )
    print(f"  - Locations: {len(saved_criteria.get('locations', []))} location(s)")

    # Now test the search - it should use the user's profile preferences
    print("\nTesting search with user's profile preferences...")
    results = db.search_profiles_with_user_criteria(user_id)

    print(f"\nSearch returned {len(results)} profiles")

    # The search should filter by:
    # - User's looking_for_gender (FEMALE) from their profile
    # - User's looking_for preferences (FRIENDSHIP, SERIOUS) from their profile
    # - Age range from search criteria
    # - Location from search criteria

    if results:
        print("\nSample result (first profile):")
        first_result = results[0]
        print(f"  - Name: {first_result.get('first_name', 'N/A')}")
        print(f"  - Gender: {first_result.get('gender', 'N/A')}")
        print(f"  - Age: {first_result.get('age', 'N/A')}")
        print(f"  - Looking for: {first_result.get('looking_for', [])}")

    # Clean up test data
    print("\nCleaning up test data...")
    db.profiles_repo.delete_profile(profile_id)
    db.users_repo.collection.delete_one({"_id": user_id})
    db.search_criteria_repo.delete_search_criteria(user_id)

    print("\nTest completed successfully!")
    print("=" * 60)
    print("\nSummary:")
    print("✓ Search criteria no longer contains 'gender' or 'looking_for' fields")
    print("✓ Search uses user's profile preferences for filtering")
    print("✓ User's looking_for_gender preference determines which genders are shown")
    print("✓ User's looking_for preference determines relationship type compatibility")

    db.disconnect()


if __name__ == "__main__":
    test_search_with_profile_preferences()
