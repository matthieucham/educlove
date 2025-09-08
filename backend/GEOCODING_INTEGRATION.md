# Geocoding Integration Documentation

## Overview
The backend now includes a geocoding service that automatically converts city names to GPS coordinates. This service is integrated into profile creation/updates and search criteria management.

## Architecture

### Service Structure
```
backend/services/geocoding/
├── __init__.py          # Package exports
├── interface.py         # Abstract base class defining the geocoding interface
├── nominatim.py        # Nominatim (OpenStreetMap) implementation
└── factory.py          # Factory for creating geocoding service instances
```

### Key Components

1. **GeocodingService Interface** (`interface.py`)
   - Abstract base class defining the geocoding contract
   - Methods:
     - `get_coordinates_from_city(city: str, country: str = "FR") -> Optional[Tuple[float, float]]`
     - `get_city_details(city: str, country: str = "FR") -> Optional[Dict[str, Any]]`
     - `validate_coordinates(lon: float, lat: float) -> bool`

2. **NominatimGeocodingService** (`nominatim.py`)
   - Implementation using OpenStreetMap's Nominatim API
   - Free, no API key required
   - Respects usage policy with built-in delays
   - Returns coordinates in [longitude, latitude] format

3. **Service Factory** (`factory.py`)
   - Creates geocoding service instances based on environment configuration
   - Singleton pattern for efficient resource usage
   - Easy switching between providers via environment variables

## Configuration

### Environment Variables
Add to your `.env` file:

```env
# Geocoding Configuration
GEOCODING_PROVIDER=nominatim  # Options: nominatim (more providers can be added)
GEOCODING_TIMEOUT=10          # Request timeout in seconds

# Future providers (commented out):
# GOOGLE_MAPS_API_KEY=your-key  # For Google Maps provider
# MAPBOX_API_KEY=your-key        # For Mapbox provider
```

## Integration Points

### 1. Profile Management
- **Create Profile** (`POST /profiles/my-profile`)
  - Automatically geocodes location if coordinates are missing or [0, 0]
  - Updates profile with geocoded coordinates before saving

- **Update Profile** (`PUT /profiles/my-profile`)
  - Re-geocodes location if city name changes
  - Preserves manual coordinates if provided

### 2. Search Criteria
- **Save/Update Search Criteria** (`POST/PUT /profiles/my-profile/search-criteria`)
  - Geocodes all locations in the search criteria
  - Handles multiple locations efficiently
  - Preserves existing valid coordinates

## Usage Examples

### Backend API Usage

When creating or updating a profile, the frontend can send just the city name:

```json
{
  "first_name": "Marie",
  "age": 28,
  "location": {
    "city_name": "Paris",
    "coordinates": [0, 0]  // Will be auto-geocoded
  },
  "looking_for": "Relation sérieuse",
  "subject": "Mathématiques",
  "experience_years": 5,
  "email": "marie@example.com"
}
```

The backend will automatically geocode and return:

```json
{
  "location": {
    "city_name": "Paris",
    "coordinates": [2.320041, 48.858890]  // Auto-filled by geocoding
  }
}
```

### Direct Service Usage (for testing/debugging)

```python
from services.geocoding import get_geocoding_service

async def example():
    geocoding_service = get_geocoding_service()
    
    # Get coordinates for a city
    coords = await geocoding_service.get_coordinates_from_city("Lyon", "FR")
    if coords:
        lon, lat = coords
        print(f"Lyon coordinates: {lon}, {lat}")
    
    # Get detailed city information
    details = await geocoding_service.get_city_details("Marseille", "FR")
    if details:
        print(f"City: {details['name']}")
        print(f"Full name: {details['display_name']}")
```

## Adding New Geocoding Providers

To add a new geocoding provider (e.g., Google Maps):

1. Create a new implementation file (e.g., `google_maps.py`):
```python
from .interface import GeocodingService

class GoogleMapsGeocodingService(GeocodingService):
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def get_coordinates_from_city(self, city: str, country: str = "FR"):
        # Implement Google Maps API call
        pass
```

2. Update the factory (`factory.py`):
```python
elif provider == "google":
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_MAPS_API_KEY required")
    _geocoding_service_instance = GoogleMapsGeocodingService(api_key=api_key)
```

3. Update environment configuration:
```env
GEOCODING_PROVIDER=google
GOOGLE_MAPS_API_KEY=your-api-key
```

## Testing

Run the geocoding tests:
```bash
cd backend/e2e-tests
python test_geocoding.py
```

The test suite includes:
- Geocoding of 10 major French cities
- Coordinate validation
- Error handling (non-existent cities, empty inputs)
- Integration with Location model
- Respects API rate limits (1-second delays)

## Rate Limiting and Usage Policy

### Nominatim (OpenStreetMap)
- **Rate Limit**: 1 request per second
- **Usage Policy**: 
  - Must include User-Agent header (handled automatically)
  - No heavy usage (bulk geocoding should be done carefully)
  - Consider using your own Nominatim instance for production
- **Cost**: Free

### Future Providers
- **Google Maps**: 
  - Free tier: $200/month credit (~40,000 geocoding requests)
  - Rate limit: 50 requests/second
  
- **Mapbox**: 
  - Free tier: 100,000 requests/month
  - Rate limit: 600 requests/minute

## Error Handling

The geocoding service handles various error scenarios:

1. **Network Errors**: Returns `None` and logs the error
2. **Invalid City Names**: Returns `None` 
3. **API Timeouts**: Configurable timeout (default 10 seconds)
4. **Invalid Coordinates**: Validation ensures coordinates are within valid ranges
5. **Missing API Keys**: Factory raises clear error messages

## Frontend Integration

The frontend should:
1. Allow users to enter city names in text fields
2. Optionally show a map for visual selection
3. Send city names to the backend (coordinates optional)
4. Display geocoded locations on maps using returned coordinates

## Monitoring and Logging

All geocoding operations are logged:
- Successful geocoding with coordinates
- Failed geocoding attempts
- API errors and timeouts
- Invalid coordinate warnings

Monitor logs for:
```
INFO - Successfully geocoded Paris, FR: (2.320041, 48.858890)
WARNING - Could not geocode location 'InvalidCity', using default [0, 0]
ERROR - Network error while geocoding: <error details>
```

## Future Enhancements

1. **Caching**: Implement Redis caching to reduce API calls for common cities
2. **Batch Geocoding**: Process multiple cities in optimized batches
3. **Reverse Geocoding**: Convert coordinates back to city names
4. **Address Geocoding**: Support full addresses, not just city names
5. **Fallback Providers**: Automatically switch providers if one fails
6. **Geocoding Analytics**: Track most searched cities for optimization
