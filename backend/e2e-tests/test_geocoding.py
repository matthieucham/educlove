"""
Test script for geocoding integration.
Run with: python test_geocoding.py
"""

import asyncio
import logging
import sys
import os

# Add parent directory to path to import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.geocoding import get_geocoding_service

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


async def test_geocoding():
    """Test the geocoding service with various French cities."""

    geocoding_service = get_geocoding_service()

    # Test cities
    test_cities = [
        ("Paris", "FR"),
        ("Lyon", "FR"),
        ("Marseille", "FR"),
        ("Toulouse", "FR"),
        ("Brest", "FR"),
        ("Nice", "FR"),
        ("Nantes", "FR"),
        ("Strasbourg", "FR"),
        ("Montpellier", "FR"),
        ("Bordeaux", "FR"),
    ]

    print("\n" + "=" * 60)
    print("GEOCODING SERVICE TEST")
    print("=" * 60)
    print(f"\nTesting with provider: Nominatim")
    print("-" * 60)

    successful = 0
    failed = 0

    for city, country in test_cities:
        try:
            print(f"\nTesting: {city}, {country}")

            # Test get_coordinates_from_city
            coordinates = await geocoding_service.get_coordinates_from_city(
                city, country
            )

            if coordinates:
                lon, lat = coordinates
                print(f"  ✓ Coordinates: [{lon:.6f}, {lat:.6f}]")

                # Verify coordinates are valid
                if geocoding_service.validate_coordinates(lon, lat):
                    print(f"  ✓ Coordinates are valid")
                    successful += 1
                else:
                    print(f"  ✗ Invalid coordinates!")
                    failed += 1
            else:
                print(f"  ✗ Failed to geocode")
                failed += 1

            # 1 second delay to respect Nominatim usage policy
            await asyncio.sleep(1)

        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            failed += 1
            # Still wait even on error to respect rate limits
            await asyncio.sleep(1)

    # Test with city details
    print("\n" + "-" * 60)
    print("Testing detailed city information for Brest:")
    print("-" * 60)

    # Wait before next API call
    await asyncio.sleep(1)

    try:
        details = await geocoding_service.get_city_details("Brest", "FR")
        if details:
            print(f"  Place ID: {details.get('place_id')}")
            print(f"  Name: {details.get('name')}")
            print(f"  Display Name: {details.get('display_name')}")
            print(f"  Coordinates: [{details.get('lon')}, {details.get('lat')}]")
            print(f"  Type: {details.get('type')}")
            print(f"  Importance: {details.get('importance')}")
            if "boundingbox" in details:
                print(f"  Bounding Box: {details['boundingbox']}")
        else:
            print("  ✗ No details found")
    except Exception as e:
        print(f"  ✗ Error getting details: {str(e)}")

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Successful geocoding: {successful}/{len(test_cities)}")
    print(f"Failed geocoding: {failed}/{len(test_cities)}")
    print(f"Success rate: {(successful/len(test_cities))*100:.1f}%")

    # Clean up
    if hasattr(geocoding_service, "close"):
        await geocoding_service.close()

    return successful == len(test_cities)


async def test_error_handling():
    """Test error handling with invalid inputs."""

    print("\n" + "=" * 60)
    print("ERROR HANDLING TEST")
    print("=" * 60)

    geocoding_service = get_geocoding_service()

    # Test with non-existent city
    print("\nTesting with non-existent city:")
    result = await geocoding_service.get_coordinates_from_city(
        "XYZNonExistentCity123", "FR"
    )
    if result is None:
        print("  ✓ Correctly returned None for non-existent city")
    else:
        print(f"  ✗ Unexpected result: {result}")

    # Wait 1 second between API calls
    await asyncio.sleep(1)

    # Test with empty city name
    print("\nTesting with empty city name:")
    result = await geocoding_service.get_coordinates_from_city("", "FR")
    if result is None:
        print("  ✓ Correctly returned None for empty city name")
    else:
        print(f"  ✗ Unexpected result: {result}")

    # Clean up
    if hasattr(geocoding_service, "close"):
        await geocoding_service.close()


async def test_integration_with_models():
    """Test geocoding integration with Location model."""

    print("\n" + "=" * 60)
    print("MODEL INTEGRATION TEST")
    print("=" * 60)

    from models import Location

    geocoding_service = get_geocoding_service()

    # Test creating Location objects with geocoded data
    test_cases = ["Paris", "Lyon", "Marseille"]

    print("\nCreating Location objects with geocoded coordinates:")

    for city_name in test_cases:
        print(f"\nProcessing: {city_name}")

        # Get coordinates
        coordinates = await geocoding_service.get_coordinates_from_city(city_name, "FR")

        if coordinates:
            try:
                # Create Location object
                location = Location(city_name=city_name, coordinates=list(coordinates))
                print(f"  ✓ Created Location: {location.city_name}")
                print(f"    Coordinates: {location.coordinates}")
            except Exception as e:
                print(f"  ✗ Failed to create Location: {str(e)}")
        else:
            print(f"  ✗ Failed to geocode {city_name}")

        # Wait between API calls
        await asyncio.sleep(1)

    # Clean up
    if hasattr(geocoding_service, "close"):
        await geocoding_service.close()


async def main():
    """Main test function."""

    print("\n" + "#" * 60)
    print("# GEOCODING INTEGRATION TEST SUITE")
    print("#" * 60)
    print("# Note: Using 1-second delays between API calls to respect")
    print("# Nominatim usage policy. Total test time: ~15 seconds")
    print("#" * 60)

    # Run tests
    geocoding_success = await test_geocoding()
    await test_error_handling()
    await test_integration_with_models()

    # Final result
    print("\n" + "#" * 60)
    if geocoding_success:
        print("# ✓ ALL TESTS PASSED")
    else:
        print("# ✗ SOME TESTS FAILED")
    print("#" * 60)
    print()


if __name__ == "__main__":
    asyncio.run(main())
