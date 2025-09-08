#!/usr/bin/env python3
"""
Standalone script to seed the database with sample profiles.
Run from the backend directory: python seed_db.py
"""

import json
from pathlib import Path
from pymongo import MongoClient
from datetime import datetime, timezone


def seed_database():
    """
    Connects to the MongoDB database, clears the existing profiles,
    and seeds it with sample data from a JSON file.
    """
    # Connect to MongoDB directly
    client = MongoClient("mongodb://root:password@localhost:27017/")
    db = client["educlove"]
    profiles_collection = db.profiles

    # Clear existing profiles
    profiles_collection.delete_many({})
    print("Cleared existing profiles.")

    # Create 2dsphere index for geospatial queries
    profiles_collection.create_index([("location", "2dsphere")])
    print("Created 2dsphere index for location field.")

    # Load sample profiles from JSON file
    json_path = Path(__file__).parent / "database" / "sample_profiles.json"
    with open(json_path, "r") as f:
        profiles_data = json.load(f)

    # Transform and insert profiles
    for profile in profiles_data:
        # Add timestamps
        profile["created_at"] = datetime.now(timezone.utc)
        profile["updated_at"] = datetime.now(timezone.utc)

        # Transform location to GeoJSON format for MongoDB
        if "location" in profile:
            location = profile["location"]
            profile["location"] = {
                "type": "Point",
                "coordinates": location["coordinates"],
                "city_name": location["city_name"],
            }

        profiles_collection.insert_one(profile)

    print(f"Successfully seeded {len(profiles_data)} profiles with geolocation data.")

    # Verify one profile to show the structure
    sample = profiles_collection.find_one()
    if sample:
        print(f"\nSample profile structure:")
        print(f"  Name: {sample.get('first_name')}")
        print(f"  Location: {sample.get('location', {}).get('city_name')}")
        print(f"  Coordinates: {sample.get('location', {}).get('coordinates')}")

    client.close()
    print("\nDatabase seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
