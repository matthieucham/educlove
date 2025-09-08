"""
End-to-end test for search criteria functionality
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"


# Test user credentials (you'll need to replace with actual auth token)
# For testing, we'll use the development auth endpoint
def get_auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/auth/dev/login",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Failed to get auth token: {response.status_code} - {response.text}")
        return None


def test_save_search_criteria(token):
    """Test saving search criteria"""
    headers = {"Authorization": f"Bearer {token}"}

    search_criteria = {
        "locations": [
            {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
            {"city_name": "Lyon", "coordinates": [4.8357, 45.7640]},
        ],
        "radii": [25, 50],
        "age_min": 25,
        "age_max": 35,
        "looking_for": ["Relation sérieuse", "Amitié"],
        "subjects": ["Mathématiques", "Physique"],
    }

    response = requests.post(
        f"{BASE_URL}/profiles/search-criteria", json=search_criteria, headers=headers
    )

    print("Save Search Criteria Response:")
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_get_search_criteria(token):
    """Test retrieving search criteria"""
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(f"{BASE_URL}/profiles/search-criteria", headers=headers)

    print("\nGet Search Criteria Response:")
    print(f"Status: {response.status_code}")
    print(f"Body: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_get_filtered_profiles(token):
    """Test getting profiles filtered by search criteria"""
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(f"{BASE_URL}/profiles/", headers=headers)

    print("\nGet Filtered Profiles Response:")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total profiles found: {data.get('total', 0)}")
    if data.get("search_criteria"):
        print("Search criteria applied:")
        print(json.dumps(data["search_criteria"], indent=2))
    return response.status_code == 200


def main():
    print("Testing Search Criteria Functionality\n")
    print("=" * 50)

    # Get auth token
    token = get_auth_token()
    if not token:
        print("Cannot proceed without auth token")
        return

    print(f"Got auth token: {token[:20]}...")
    print("=" * 50)

    # Test saving search criteria
    if test_save_search_criteria(token):
        print("✓ Search criteria saved successfully")
    else:
        print("✗ Failed to save search criteria")

    print("=" * 50)

    # Test getting search criteria
    if test_get_search_criteria(token):
        print("✓ Search criteria retrieved successfully")
    else:
        print("✗ Failed to retrieve search criteria")

    print("=" * 50)

    # Test getting filtered profiles
    if test_get_filtered_profiles(token):
        print("✓ Filtered profiles retrieved successfully")
    else:
        print("✗ Failed to retrieve filtered profiles")

    print("=" * 50)
    print("\nAll tests completed!")


if __name__ == "__main__":
    main()
