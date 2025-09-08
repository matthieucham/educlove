"""Abstract interface for geocoding services"""

from abc import ABC, abstractmethod
from typing import Optional, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class GeocodingService(ABC):
    """Abstract base class for geocoding services"""

    @abstractmethod
    async def get_coordinates_from_city(
        self, city: str, country: str = "FR"
    ) -> Optional[Tuple[float, float]]:
        """
        Get GPS coordinates (longitude, latitude) from a city name.

        Args:
            city: Name of the city to geocode
            country: ISO 3166-1 alpha-2 country code (default: "FR" for France)

        Returns:
            Tuple of (longitude, latitude) if found, None otherwise
        """
        pass

    @abstractmethod
    async def get_city_details(
        self, city: str, country: str = "FR"
    ) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a city including coordinates and metadata.

        Args:
            city: Name of the city to geocode
            country: ISO 3166-1 alpha-2 country code (default: "FR" for France)

        Returns:
            Dictionary with city details if found, None otherwise
        """
        pass

    def validate_coordinates(self, lon: float, lat: float) -> bool:
        """
        Validate that coordinates are within valid ranges.

        Args:
            lon: Longitude value
            lat: Latitude value

        Returns:
            True if coordinates are valid, False otherwise
        """
        return -180 <= lon <= 180 and -90 <= lat <= 90
