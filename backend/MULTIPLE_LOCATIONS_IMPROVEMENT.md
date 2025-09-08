# Multiple Locations Search Improvement

## Overview
The `search_profiles` method in `ProfilesRepository` has been improved to support multiple locations with OR logic for geographic queries.

## Problem
Previously, when searching with multiple locations and radii, only the first location was used due to MongoDB's limitation that the `$near` operator cannot be combined with `$or`.

## Solution
The improved implementation:
1. Performs separate queries for each location/radius pair
2. Combines the results from all queries
3. Automatically removes duplicates using a dictionary to track unique profiles by their `_id`

## Implementation Details

### Key Changes in `backend/database/repositories/profiles.py`:

1. **Base Query Separation**: Non-location filters are built as a `base_query` that can be reused
2. **Multiple Queries**: For each location/radius pair, a separate query is executed
3. **Duplicate Removal**: Results are stored in a dictionary using profile `_id` as the key, automatically preventing duplicates
4. **Fallback Handling**: If no locations have valid radii, the method falls back to using just the base query

### Code Structure:
```python
# Build base query for non-location filters
base_query = {...}

# Use dictionary to track unique profiles
profiles_dict = {}

# Perform query for each location
for location, radius in zip(locations, radii):
    if radius > 0:
        location_query = base_query.copy()
        location_query["location"] = {
            "$near": {
                "$geometry": location,
                "$maxDistance": radius_meters
            }
        }
        # Execute and add results to dict (auto-removes duplicates)
        for profile in results:
            profiles_dict[profile_id] = profile

# Convert back to list
profiles = list(profiles_dict.values())
```

## Testing

A comprehensive test suite has been created in `backend/e2e-tests/test_multiple_locations.py` that verifies:

1. **Multiple Location Search**: Tests searching around multiple cities with different radii
2. **Duplicate Removal**: Verifies that profiles matching multiple location criteria appear only once
3. **Combined Filters**: Tests location search combined with other filters (gender, age, etc.)
4. **Single Location**: Ensures backward compatibility with single location searches
5. **No Location**: Tests that searches without location criteria still work

### Running the Tests

Prerequisites:
- MongoDB must be installed and running
- MongoDB connection configured in `.env` file

```bash
# Install MongoDB (macOS)
brew install mongodb-community
brew services start mongodb-community

# Run the test
cd backend
python e2e-tests/test_multiple_locations.py
```

## Example Usage

```python
# Search for profiles around multiple cities
criteria = {
    "locations": [
        {"type": "Point", "coordinates": [2.3522, 48.8566]},  # Paris
        {"type": "Point", "coordinates": [4.8357, 45.7640]},  # Lyon
        {"type": "Point", "coordinates": [5.3698, 43.2965]}   # Marseille
    ],
    "radii": [50, 30, 40],  # Different radius for each location (in km)
    "gender": ["Femme"],    # Additional filters still work
    "age_min": 25,
    "age_max": 35
}

results = profiles_repo.search_profiles(criteria)
```

## Benefits

1. **True OR Logic**: Users can now search for profiles around multiple locations simultaneously
2. **No Duplicates**: Profiles that match multiple location criteria are returned only once
3. **Flexible Radii**: Each location can have its own search radius
4. **Backward Compatible**: Single location searches continue to work as before
5. **Performance**: While multiple queries are performed, the duplicate removal is efficient using dictionary lookups

## Notes

- MongoDB's `$near` operator inherently sorts results by distance, but when combining multiple queries, this ordering is lost
- The implementation prioritizes finding all matching profiles over maintaining distance-based sorting
- For very large numbers of locations, consider implementing pagination or limiting the number of locations per search
