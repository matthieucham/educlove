"""
Test script to verify gender field is properly handled in profiles
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Test credentials
test_email = "test@example.com"
test_password = "password123"


def test_gender_field():
    """Test that gender field is properly stored and retrieved"""

    # Step 1: Login to get auth token
    print("1. Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/auth/dev/login",
        json={"email": test_email, "password": test_password},
    )

    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")

    # Step 2: Create a profile with gender field
    print("\n2. Creating profile with gender field...")
    profile_data = {
        "first_name": "Test",
        "age": 30,
        "gender": "FEMALE",  # Testing gender field
        "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
        "looking_for": "Amitié",
        "subject": "MATHEMATICS",
        "experience_years": 5,
        "photos": [],
        "description": "<p>Test description</p>",
        "goals": "<p>Test goals</p>",
        "email": test_email,
    }

    create_response = requests.post(
        f"{BASE_URL}/profiles/my-profile", json=profile_data, headers=headers
    )

    if create_response.status_code == 201:
        print("✓ Profile created successfully")
    elif create_response.status_code == 400:
        print("Profile already exists, trying to update...")
        # Try updating instead
        update_response = requests.put(
            f"{BASE_URL}/profiles/my-profile", json=profile_data, headers=headers
        )
        if update_response.status_code == 200:
            print("✓ Profile updated successfully")
        else:
            print(f"Update failed: {update_response.text}")
            return
    else:
        print(f"Create failed: {create_response.text}")
        return

    # Step 3: Retrieve the profile and verify gender field
    print("\n3. Retrieving profile to verify gender field...")
    get_response = requests.get(f"{BASE_URL}/profiles/my-profile", headers=headers)

    if get_response.status_code != 200:
        print(f"Failed to retrieve profile: {get_response.text}")
        return

    profile = get_response.json()
    print(f"✓ Profile retrieved successfully")
    print(f"\nProfile data:")
    print(f"  - First name: {profile.get('first_name')}")
    print(f"  - Age: {profile.get('age')}")
    print(f"  - Gender: {profile.get('gender')}")  # Check if gender is present
    print(f"  - Location: {profile.get('location', {}).get('city_name')}")
    print(f"  - Subject: {profile.get('subject')}")

    # Verify gender field
    if "gender" in profile:
        print(f"\n✅ SUCCESS: Gender field is properly stored and retrieved!")
        print(f"   Gender value: {profile['gender']}")
    else:
        print(f"\n❌ ERROR: Gender field is missing from the profile!")

    return profile


if __name__ == "__main__":
    print("Testing Gender Field in Profile API")
    print("=" * 40)
    test_gender_field()
