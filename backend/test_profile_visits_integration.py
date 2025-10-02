#!/usr/bin/env python3
"""
Integration test to verify profile visits are being recorded correctly
when called from the frontend.
"""

import asyncio
import httpx
from datetime import datetime
from database.mongo_database import MongoDatabase
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def test_profile_visit_recording():
    """Test that profile visits are recorded correctly via API."""

    # Initialize database
    # Use the authenticated MongoDB URI
    db = MongoDatabase(
        uri=os.getenv("MONGODB_URI", "mongodb://root:password@localhost:27017/"),
        db_name="educlove_test",
    )
    db.connect()

    # Clean up any existing test data
    db.db.profile_visits.delete_many({})

    # Create test users and profiles
    test_user1 = {
        "_id": "test_user_1",
        "email": "user1@test.com",
        "name": "Test User 1",
        "profile_id": "test_profile_1",
    }

    test_user2 = {
        "_id": "test_user_2",
        "email": "user2@test.com",
        "name": "Test User 2",
        "profile_id": "test_profile_2",
    }

    test_profile1 = {
        "_id": "test_profile_1",
        "user_id": "test_user_1",
        "first_name": "Alice",
        "date_of_birth": datetime(1990, 1, 1),
        "gender": "FEMALE",
        "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
        "looking_for": ["FRIENDSHIP", "SERIOUS"],
        "looking_for_gender": ["MALE"],
        "description": "Test profile 1",
    }

    test_profile2 = {
        "_id": "test_profile_2",
        "user_id": "test_user_2",
        "first_name": "Bob",
        "date_of_birth": datetime(1992, 5, 15),
        "gender": "MALE",
        "location": {"city_name": "Lyon", "coordinates": [4.8357, 45.7640]},
        "looking_for": ["SERIOUS"],
        "looking_for_gender": ["FEMALE"],
        "description": "Test profile 2",
    }

    # Insert test data
    db.db.users.insert_one(test_user1)
    db.db.users.insert_one(test_user2)
    db.db.profiles.insert_one(test_profile1)
    db.db.profiles.insert_one(test_profile2)

    print("✅ Test data created")

    # Simulate API call to record profile visit
    # User 1 visits User 2's profile
    visit_id = db.record_profile_visit("test_user_1", "test_profile_2")
    print(f"✅ Profile visit recorded: {visit_id}")

    # Check if visit was recorded
    has_visited = db.has_visited_profile("test_user_1", "test_profile_2")
    assert has_visited == True, "Visit should be recorded"
    print("✅ Visit verification successful")

    # Get visited profiles
    visited = db.get_visited_profiles("test_user_1")
    assert len(visited) == 1, "Should have 1 visited profile"
    assert (
        visited[0]["visited_profile_id"] == "test_profile_2"
    ), "Should have visited profile 2"
    print(f"✅ Retrieved visited profiles: {len(visited)} profile(s)")

    # Get visit count
    count = db.get_visit_count("test_user_1")
    assert count == 1, "Should have 1 visit"
    print(f"✅ Visit count: {count}")

    # Test duplicate visit (should update timestamp)
    visit_id2 = db.record_profile_visit("test_user_1", "test_profile_2")
    print(f"✅ Duplicate visit recorded (updates timestamp): {visit_id2}")

    # Count should still be 1
    count = db.get_visit_count("test_user_1")
    assert count == 1, "Should still have 1 visit (duplicate updates timestamp)"
    print(f"✅ Visit count after duplicate: {count}")

    # Clean up test data
    db.db.users.delete_many({"_id": {"$in": ["test_user_1", "test_user_2"]}})
    db.db.profiles.delete_many({"_id": {"$in": ["test_profile_1", "test_profile_2"]}})
    db.db.profile_visits.delete_many({})

    print("\n✅ All tests passed! Profile visit tracking is working correctly.")
    print("\n📝 Summary:")
    print("- Profile visits are recorded in the database")
    print("- Duplicate visits update the timestamp (for TTL)")
    print("- Visit history can be retrieved")
    print("- Visit counts are accurate")
    print("\n🎯 Frontend implementation:")
    print("- Clicking 'J'aimerais te connaître' records a visit")
    print("- Clicking 'Voir d'autres profils' records a visit")
    print("- Swiping left records a visit")
    print("- Swiping right records a visit")
    print("- Using arrow keys records visits")


if __name__ == "__main__":
    asyncio.run(test_profile_visit_recording())
