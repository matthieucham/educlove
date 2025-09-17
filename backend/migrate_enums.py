"""
Migration script to update existing profiles and search criteria to use new enum values.
"""

from pymongo import MongoClient
from typing import Dict, Any, List

# Database connection
MONGO_URI = "mongodb://root:password@localhost:27017/"
DB_NAME = "educlove"

# Mapping for looking_for values
LOOKING_FOR_MAP = {
    "Amitié": "FRIENDSHIP",
    "Relation légère": "CASUAL",
    "Relation sérieuse": "SERIOUS",
    # Also handle lowercase versions
    "amitié": "FRIENDSHIP",
    "relation légère": "CASUAL",
    "relation sérieuse": "SERIOUS",
}

# Mapping for gender values
GENDER_MAP = {
    "Homme": "MALE",
    "Femme": "FEMALE",
    "Autre": "OTHER",
    # Also handle various formats
    "homme": "MALE",
    "femme": "FEMALE",
    "autre": "OTHER",
    "Male": "MALE",
    "Female": "FEMALE",
    "Other": "OTHER",
    "M": "MALE",
    "F": "FEMALE",
    "H": "MALE",
}


def migrate_profiles(db):
    """Migrate profiles collection to use new enum values."""
    profiles_collection = db.profiles

    # Find all profiles
    profiles = profiles_collection.find({})

    updated_count = 0
    for profile in profiles:
        update_needed = False
        update_data = {}

        # Update looking_for field
        if "looking_for" in profile:
            new_looking_for = []
            # Handle both single value and list
            looking_for_values = profile["looking_for"]
            if not isinstance(looking_for_values, list):
                looking_for_values = [looking_for_values]

            for value in looking_for_values:
                if value in LOOKING_FOR_MAP:
                    new_looking_for.append(LOOKING_FOR_MAP[value])
                    update_needed = True
                else:
                    new_looking_for.append(value)

            # Always store as a list
            update_data["looking_for"] = new_looking_for
            if not isinstance(profile["looking_for"], list):
                update_needed = True  # Force update if it was a single value

        # Update gender field
        if "gender" in profile and profile["gender"] in GENDER_MAP:
            update_data["gender"] = GENDER_MAP[profile["gender"]]
            update_needed = True

        # Update looking_for_gender field if it exists
        if "looking_for_gender" in profile:
            new_looking_for_gender = []
            # Handle both single value and list
            looking_for_gender_values = profile["looking_for_gender"]
            if not isinstance(looking_for_gender_values, list):
                looking_for_gender_values = [looking_for_gender_values]

            for value in looking_for_gender_values:
                if value in GENDER_MAP:
                    new_looking_for_gender.append(GENDER_MAP[value])
                    update_needed = True
                else:
                    new_looking_for_gender.append(value)

            # Always store as a list
            update_data["looking_for_gender"] = new_looking_for_gender
            if not isinstance(profile["looking_for_gender"], list):
                update_needed = True  # Force update if it was a single value

        # Apply updates if needed
        if update_needed and update_data:
            profiles_collection.update_one(
                {"_id": profile["_id"]}, {"$set": update_data}
            )
            updated_count += 1
            print(f"Updated profile {profile['_id']}")

    print(f"Updated {updated_count} profiles")


def migrate_search_criteria(db):
    """Migrate search_criteria collection to use new enum values."""
    search_criteria_collection = db.search_criteria

    # Find all search criteria
    criteria_list = search_criteria_collection.find({})

    updated_count = 0
    for criteria in criteria_list:
        update_needed = False
        update_data = {}

        # Update looking_for field
        if "looking_for" in criteria:
            new_looking_for = []
            # Handle both single value and list
            looking_for_values = criteria["looking_for"]
            if not isinstance(looking_for_values, list):
                looking_for_values = [looking_for_values]

            for value in looking_for_values:
                if value in LOOKING_FOR_MAP:
                    new_looking_for.append(LOOKING_FOR_MAP[value])
                    update_needed = True
                else:
                    new_looking_for.append(value)

            # Always store as a list
            update_data["looking_for"] = new_looking_for
            if not isinstance(criteria["looking_for"], list):
                update_needed = True  # Force update if it was a single value

        # Update gender field (this is the "with" field - who they want to match with)
        if "gender" in criteria:
            new_gender = []
            # Handle both single value and list
            gender_values = criteria["gender"]
            if not isinstance(gender_values, list):
                gender_values = [gender_values]

            for value in gender_values:
                if value in GENDER_MAP:
                    new_gender.append(GENDER_MAP[value])
                    update_needed = True
                else:
                    new_gender.append(value)

            # Always store as a list
            update_data["gender"] = new_gender
            if not isinstance(criteria["gender"], list):
                update_needed = True  # Force update if it was a single value

        # Apply updates if needed
        if update_needed and update_data:
            search_criteria_collection.update_one(
                {"_id": criteria["_id"]}, {"$set": update_data}
            )
            updated_count += 1
            print(
                f"Updated search criteria for user {criteria.get('user_id', 'unknown')}"
            )

    print(f"Updated {updated_count} search criteria documents")


def main():
    """Main migration function."""
    print("Starting enum migration...")

    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    try:
        # Migrate profiles
        print("\nMigrating profiles...")
        migrate_profiles(db)

        # Migrate search criteria
        print("\nMigrating search criteria...")
        migrate_search_criteria(db)

        print("\nMigration completed successfully!")

    except Exception as e:
        print(f"Error during migration: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    main()
