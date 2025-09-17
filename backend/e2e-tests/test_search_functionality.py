"""
Test script to verify the search functionality with the new enum values.
"""

from pymongo import MongoClient
from database.mongo_database import MongoDatabase
from database.repositories.profiles import ProfilesRepository

# Database connection
MONGO_URI = "mongodb://root:password@localhost:27017/"
DB_NAME = "educlove"


def test_search_functionality():
    """Test the search functionality with various scenarios."""

    # Connect to database
    db = MongoDatabase(MONGO_URI, DB_NAME)
    db.connect()

    print("Testing search functionality...\n")

    # Test 1: Search with looking_for filter
    print("Test 1: Search for profiles looking for FRIENDSHIP")
    criteria = {"looking_for": ["FRIENDSHIP"]}
    results = db.profiles_repo.search_profiles(criteria)
    print(f"Found {len(results)} profiles looking for FRIENDSHIP")
    if results:
        print(f"Sample profile looking_for: {results[0].get('looking_for', [])}")

    # Test 2: Search with gender filter
    print("\nTest 2: Search for FEMALE profiles")
    criteria = {"gender": ["FEMALE"]}
    results = db.profiles_repo.search_profiles(criteria)
    print(f"Found {len(results)} FEMALE profiles")
    if results:
        print(f"Sample profile gender: {results[0].get('gender', 'N/A')}")

    # Test 3: Search with both looking_for and gender filters
    print("\nTest 3: Search for MALE profiles looking for SERIOUS relationship")
    criteria = {"gender": ["MALE"], "looking_for": ["SERIOUS"]}
    results = db.profiles_repo.search_profiles(criteria)
    print(f"Found {len(results)} MALE profiles looking for SERIOUS relationship")

    # Test 4: Search with current user gender (bidirectional matching)
    print("\nTest 4: Search for profiles that would match with a MALE user")
    criteria = {
        "gender": ["FEMALE"],  # Looking for female profiles
        "looking_for": ["SERIOUS"],
    }
    results = db.profiles_repo.search_profiles(criteria, current_user_gender="MALE")
    print(
        f"Found {len(results)} compatible profiles for a MALE user looking for FEMALE"
    )

    # Test 5: Check data format in database
    print("\nTest 5: Checking data format in database")
    client = MongoClient(MONGO_URI)
    direct_db = client[DB_NAME]

    # Check a profile
    sample_profile = direct_db.profiles.find_one()
    if sample_profile:
        print(
            f"Sample profile looking_for field: {sample_profile.get('looking_for', [])} (type: {type(sample_profile.get('looking_for', []))})"
        )
        print(f"Sample profile gender field: {sample_profile.get('gender', 'N/A')}")

    # Check a search criteria
    sample_criteria = direct_db.search_criteria.find_one()
    if sample_criteria:
        print(
            f"Sample search criteria looking_for field: {sample_criteria.get('looking_for', [])} (type: {type(sample_criteria.get('looking_for', []))})"
        )
        print(
            f"Sample search criteria gender field: {sample_criteria.get('gender', [])} (type: {type(sample_criteria.get('gender', []))})"
        )

    client.close()
    db.disconnect()

    print("\nAll tests completed!")


if __name__ == "__main__":
    test_search_functionality()
