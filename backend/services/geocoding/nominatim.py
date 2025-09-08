"""Nominatim geocoding service implementation"""

import aiohttp
import logging
from typing import Optional, Tuple, Dict, Any
from urllib.parse import urlencode
from .interface import GeocodingService

logger = logging.getLogger(__name__)


class NominatimGeocodingService(GeocodingService):
    """Nominatim OpenStreetMap geocoding service implementation"""

    BASE_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "EduClove/1.0"  # Required by Nominatim usage policy

    def __init__(self, timeout: int = 10):
        """
        Initialize Nominatim geocoding service.

        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self.session = None

    async def _ensure_session(self):
        """Ensure aiohttp session is created"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={"User-Agent": self.USER_AGENT}
            )

    async def close(self):
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()

    async def get_coordinates_from_city(
        self, city: str, country: str = "FR"
    ) -> Optional[Tuple[float, float]]:
        """
        Get GPS coordinates from a city name using Nominatim API.

        Args:
            city: Name of the city to geocode
            country: ISO 3166-1 alpha-2 country code (default: "FR" for France)

        Returns:
            Tuple of (longitude, latitude) if found, None otherwise
        """
        try:
            details = await self.get_city_details(city, country)
            if details:
                lon = float(details["lon"])
                lat = float(details["lat"])
                if self.validate_coordinates(lon, lat):
                    return (lon, lat)
                else:
                    logger.warning(
                        f"Invalid coordinates received for {city}, {country}: ({lon}, {lat})"
                    )
            return None
        except Exception as e:
            logger.error(f"Error getting coordinates for {city}, {country}: {str(e)}")
            return None

    async def get_city_details(
        self, city: str, country: str = "FR"
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a city from Nominatim API.

        Args:
            city: Name of the city to geocode
            country: ISO 3166-1 alpha-2 country code (default: "FR" for France)

        Returns:
            Dictionary with city details if found, None otherwise
        """
        await self._ensure_session()

        # Build query parameters
        params = {
            "city": city,
            "country": country,
            "format": "json",
            "limit": 1,  # We only need the best match
            "addressdetails": 1,  # Include address details
        }

        url = f"{self.BASE_URL}?{urlencode(params)}"

        try:
            logger.info(f"Geocoding request for city: {city}, country: {country}")

            async with self.session.get(url, timeout=self.timeout) as response:
                if response.status == 200:
                    data = await response.json()

                    if data and len(data) > 0:
                        # Return the first (best) match
                        result = data[0]
                        logger.info(
                            f"Successfully geocoded {city}, {country}: "
                            f"({result.get('lon')}, {result.get('lat')})"
                        )
                        return result
                    else:
                        logger.warning(f"No results found for {city}, {country}")
                        return None
                else:
                    logger.error(
                        f"Nominatim API returned status {response.status} for {city}, {country}"
                    )
                    return None

        except aiohttp.ClientTimeout:
            logger.error(f"Timeout while geocoding {city}, {country}")
            return None
        except aiohttp.ClientError as e:
            logger.error(f"Network error while geocoding {city}, {country}: {str(e)}")
            return None
        except Exception as e:
            logger.error(
                f"Unexpected error while geocoding {city}, {country}: {str(e)}"
            )
            return None

    async def __aenter__(self):
        """Async context manager entry"""
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
