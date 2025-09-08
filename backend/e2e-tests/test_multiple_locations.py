"""
Test script to verify that search_profiles correctly handles multiple locations.
"""

import os
import sys
from datetime import datetime, timezone

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from database.repositories.profiles import ProfilesRepository
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DATABASE_NAME", "educlove")


def setup_test_data():
    """Create test profiles with different locations."""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        profiles_repo = ProfilesRepository(db)

        # Clear existing test profiles
        try:
            db.profiles.delete_many({"test_profile": True})
        except Exception as e:
            print(f"Warning: Could not clear existing test profiles: {e}")
            print("Continuing with test data creation...")

        # Create test profiles in different cities
        test_profiles = [
            {
                "user_id": "test_user_1",
                "name": "Alice in Paris",
                "age": 25,
                "gender": "Femme",
                "orientation": "Hétérosexuel",
                "looking_for": ["Relation sérieuse"],
                "location": {
                    "city_name": "Paris",
                    "coordinates": [2.3522, 48.8566],  # Paris coordinates
                },
                "test_profile": True,
            },
            {
                "user_id": "test_user_2",
                "name": "Bob in Lyon",
                "age": 28,
                "gender": "Homme",
                "orientation": "Hétérosexuel",
                "looking_for": ["Relation sérieuse"],
                "location": {
                    "city_name": "Lyon",
                    "coordinates": [4.8357, 45.7640],  # Lyon coordinates
                },
                "test_profile": True,
            },
            {
                "user_id": "test_user_3",
                "name": "Charlie in Marseille",
                "age": 30,
                "gender": "Homme",
                "orientation": "Hétérosexuel",
                "looking_for": ["Amitié"],
                "location": {
                    "city_name": "Marseille",
                    "coordinates": [5.3698, 43.2965],  # Marseille coordinates
                },
                "test_profile": True,
            },
            {
                "user_id": "test_user_4",
                "name": "Diana near Paris",
                "age": 26,
                "gender": "Femme",
                "orientation": "Bisexuel",
                "looking_for": ["Relation sérieuse", "Amitié"],
                "location": {
                    "city_name": "Versailles",
                    "coordinates": [2.1301, 48.8014],  # Versailles (near Paris)
                },
                "test_profile": True,
            },
            {
                "user_id": "test_user_5",
                "name": "Eve in Bordeaux",
                "age": 24,
                "gender": "Femme",
                "orientation": "Hétérosexuel",
                "looking_for": ["Relation sérieuse"],
                "location": {
                    "city_name": "Bordeaux",
                    "coordinates": [-0.5792, 44.8378],  # Bordeaux coordinates
                },
                "test_profile": True,
            },
        ]

        created_ids = []
        for profile in test_profiles:
            profile_id = profiles_repo.create_profile(profile)
            created_ids.append(profile_id)
            print(f"Created profile: {profile['name']} (ID: {profile_id})")

        return created_ids
    except Exception as e:
        print(f"Error setting up test data: {e}")
        print("Make sure MongoDB is running and accessible.")
        return []


def test_multiple_locations():
    """Test searching with multiple locations."""
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    profiles_repo = ProfilesRepository(db)

    print("\n" + "=" * 60)
    print("Testing Multiple Location Search with OR Logic")
    print("=" * 60)

    # Test 1: Search around Paris and Lyon with different radii
    print("\n1. Searching around Paris (50km) and Lyon (30km):")
    criteria = {
        "locations": [
            {"type": "Point", "coordinates": [2.3522, 48.8566]},  # Paris
            {"type": "Point", "coordinates": [4.8357, 45.7640]},  # Lyon
        ],
        "radii": [50, 30],  # 50km around Paris, 30km around Lyon
    }

    results = profiles_repo.search_profiles(criteria)
    print(f"   Found {len(results)} profiles:")
    for profile in results:
        print(f"   - {profile['name']} in {profile['location']['city_name']}")

    # Test 2: Search around three cities
    print("\n2. Searching around Paris (100km), Marseille (50km), and Bordeaux (30km):")
    criteria = {
        "locations": [
            {"type": "Point", "coordinates": [2.3522, 48.8566]},  # Paris
            {"type": "Point", "coordinates": [5.3698, 43.2965]},  # Marseille
            {"type": "Point", "coordinates": [-0.5792, 44.8378]},  # Bordeaux
        ],
        "radii": [100, 50, 30],
    }

    results = profiles_repo.search_profiles(criteria)
    print(f"   Found {len(results)} profiles:")
    profile_ids = set()
    for profile in results:
        print(f"   - {profile['name']} in {profile['location']['city_name']}")
        # Check for duplicates
        if profile["_id"] in profile_ids:
            print(f"     WARNING: Duplicate profile found!")
        profile_ids.add(profile["_id"])

    # Test 3: Search with additional filters
    print("\n3. Searching around Paris (100km) and Lyon (100km) with gender filter:")
    criteria = {
        "locations": [
            {"type": "Point", "coordinates": [2.3522, 48.8566]},  # Paris
            {"type": "Point", "coordinates": [4.8357, 45.7640]},  # Lyon
        ],
        "radii": [100, 100],
        "gender": ["Femme"],
    }

    results = profiles_repo.search_profiles(criteria)
    print(f"   Found {len(results)} female profiles:")
    for profile in results:
        print(
            f"   - {profile['name']} in {profile['location']['city_name']} (Gender: {profile['gender']})"
        )

    # Test 4: Search with one location (should still work)
    print("\n4. Searching with single location (Paris, 50km):")
    criteria = {
        "locations": [{"type": "Point", "coordinates": [2.3522, 48.8566]}],  # Paris
        "radii": [50],
    }

    results = profiles_repo.search_profiles(criteria)
    print(f"   Found {len(results)} profiles:")
    for profile in results:
        print(f"   - {profile['name']} in {profile['location']['city_name']}")

    # Test 5: Search with no location criteria
    print("\n5. Searching without location criteria (all profiles):")
    criteria = {
        "test_profile": True  # This won't be used in the query, but we can filter manually
    }

    results = profiles_repo.search_profiles(criteria)
    # Filter test profiles manually
    test_results = [p for p in results if p.get("test_profile", False)]
    print(f"   Found {len(test_results)} test profiles:")
    for profile in test_results:
        print(f"   - {profile['name']} in {profile['location']['city_name']}")

    # Test 6: Verify no duplicates when a profile matches multiple locations
    print(
        "\n6. Testing duplicate removal (Paris 100km and Versailles 50km should find Diana only once):"
    )
    criteria = {
        "locations": [
            {"type": "Point", "coordinates": [2.3522, 48.8566]},  # Paris
            {"type": "Point", "coordinates": [2.1301, 48.8014]},  # Versailles
        ],
        "radii": [100, 50],  # Both should find Diana in Versailles
    }

    results = profiles_repo.search_profiles(criteria)
    print(f"   Found {len(results)} profiles:")
    diana_count = 0
    for profile in results:
        print(f"   - {profile['name']} in {profile['location']['city_name']}")
        if "Diana" in profile["name"]:
            diana_count += 1

    if diana_count > 1:
        print(f"   ERROR: Diana appeared {diana_count} times (duplicates not removed!)")
    else:
        print(f"   SUCCESS: No duplicates found")

    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)

    # Cleanup
    db.profiles.delete_many({"test_profile": True})
    print("\nTest data cleaned up.")


if __name__ == "__main__":
    print("Setting up test data...")
    setup_test_data()

    print("\nRunning tests...")
    test_multiple_locations()
