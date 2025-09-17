#!/usr/bin/env python3
"""
Standalone script to seed the database with sample profiles.
Run from the backend directory: python seed_db.py
"""

import json
from pathlib import Path
from pymongo import MongoClient
from datetime import datetime, timezone, date


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

        # Convert date_of_birth string to datetime object for MongoDB
        if "date_of_birth" in profile and isinstance(profile["date_of_birth"], str):
            profile["date_of_birth"] = datetime.fromisoformat(profile["date_of_birth"])

        # Transform location to GeoJSON format for MongoDB
        if "location" in profile:
            location = profile["location"]
            profile["location"] = {
                "type": "Point",
                "coordinates": location["coordinates"],
                "city_name": location["city_name"],
            }

        # Add experience_years if not present (for backward compatibility)
        if "experience_years" not in profile:
            profile["experience_years"] = 5  # Default value

        profiles_collection.insert_one(profile)

    print(f"Successfully seeded {len(profiles_data)} profiles with geolocation data.")

    # Verify one profile to show the structure
    sample = profiles_collection.find_one()
    if sample:
        print(f"\nSample profile structure:")
        print(f"  Name: {sample.get('first_name')}")
        print(f"  Date of Birth: {sample.get('date_of_birth')}")
        if "date_of_birth" in sample:
            today = date.today()
            dob = sample["date_of_birth"]
            if isinstance(dob, datetime):
                dob = dob.date()
            age = (
                today.year
                - dob.year
                - ((today.month, today.day) < (dob.month, dob.day))
            )
            print(f"  Computed Age: {age}")
        print(f"  Location: {sample.get('location', {}).get('city_name')}")
        print(f"  Coordinates: {sample.get('location', {}).get('coordinates')}")

    client.close()
    print("\nDatabase seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
