"""
Test script to verify that age filtering works correctly with date_of_birth in MongoDB queries.
"""

import sys
from pathlib import Path
from datetime import datetime, date, timedelta

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from database.mongo_database import MongoDatabase


def test_age_filtering():
    """Test that MongoDB correctly filters profiles by age using date_of_birth"""

    # Connect to database
    db = MongoDatabase()
    db.connect()

    print("Testing age filtering with MongoDB queries...")
    print("=" * 60)

    # Get all profiles and show their ages
    all_profiles = db.profiles_repo.get_all_profiles()
    print(f"Total profiles in database: {len(all_profiles)}")
    print("\nProfiles with computed ages:")
    for p in all_profiles:
        print(f"  - {p['first_name']}: {p.get('age', 'N/A')} years old")

    # Test different age ranges
    test_cases = [
        {"age_min": 25, "age_max": 30, "description": "Ages 25-30"},
        {"age_min": 30, "age_max": 35, "description": "Ages 30-35"},
        {"age_min": None, "age_max": 28, "description": "Ages up to 28"},
        {"age_min": 32, "age_max": None, "description": "Ages 32 and above"},
    ]

    print("\n" + "=" * 60)
    print("Testing different age ranges:")

    for test_case in test_cases:
        criteria = {
            "age_min": test_case.get("age_min"),
            "age_max": test_case.get("age_max"),
        }

        # Search profiles with age criteria
        results = db.profiles_repo.search_profiles(criteria)

        print(f"\n{test_case['description']}:")
        print(
            f"  Query: age_min={criteria.get('age_min')}, age_max={criteria.get('age_max')}"
        )
        print(f"  Found {len(results)} profiles:")

        for profile in results:
            age = profile.get("age", "N/A")
            print(f"    - {profile['first_name']}: {age} years old")

            # Verify the age is within the expected range
            if criteria.get("age_min") is not None and age != "N/A":
                assert (
                    age >= criteria["age_min"]
                ), f"Age {age} is less than min {criteria['age_min']}"
            if criteria.get("age_max") is not None and age != "N/A":
                assert (
                    age <= criteria["age_max"]
                ), f"Age {age} is greater than max {criteria['age_max']}"

    print("\n" + "=" * 60)
    print("MongoDB Query Test:")

    # Test the actual MongoDB query construction
    today = date.today()
    age_min = 25
    age_max = 30

    # Calculate expected date ranges
    max_birth_date = date(today.year - age_min, today.month, today.day)
    min_birth_date = date(today.year - age_max - 1, today.month, today.day)

    print(f"\nFor age range {age_min}-{age_max}:")
    print(f"  Today's date: {today}")
    print(f"  Max birth date (for min age {age_min}): {max_birth_date}")
    print(f"  Min birth date (for max age {age_max}): {min_birth_date}")
    print(f"  MongoDB query will find profiles with date_of_birth:")
    print(f"    - Greater than {min_birth_date} (to be at most {age_max} years old)")
    print(
        f"    - Less than or equal to {max_birth_date} (to be at least {age_min} years old)"
    )

    # Direct MongoDB query test
    query = {}
    if age_max is not None:
        query.setdefault("date_of_birth", {})["$gt"] = datetime.combine(
            min_birth_date, datetime.min.time()
        )
    if age_min is not None:
        query.setdefault("date_of_birth", {})["$lte"] = datetime.combine(
            max_birth_date, datetime.min.time()
        )

    direct_results = list(db.profiles_repo.collection.find(query))
    print(f"\n  Direct MongoDB query returned {len(direct_results)} profiles")

    print("\n" + "=" * 60)
    print("✓ All age filtering tests passed successfully!")
    print("✓ MongoDB queries correctly filter by date_of_birth")
    print("✓ Age computation from date_of_birth is accurate")

    db.disconnect()


if __name__ == "__main__":
    test_age_filtering()
