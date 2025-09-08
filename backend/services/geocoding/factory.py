"""Factory for creating geocoding service instances based on configuration"""

import os
import logging
from typing import Optional
from .interface import GeocodingService
from .nominatim import NominatimGeocodingService

logger = logging.getLogger(__name__)

# Singleton instance to reuse across the application
_geocoding_service_instance: Optional[GeocodingService] = None


def get_geocoding_service() -> GeocodingService:
    """
    Get the configured geocoding service instance.

    The service provider is determined by the GEOCODING_PROVIDER environment variable.
    Defaults to 'nominatim' if not specified.

    Returns:
        GeocodingService instance

    Raises:
        ValueError: If an unsupported geocoding provider is specified
    """
    global _geocoding_service_instance

    if _geocoding_service_instance is not None:
        return _geocoding_service_instance

    provider = os.getenv("GEOCODING_PROVIDER", "nominatim").lower()

    if provider == "nominatim":
        # Get Nominatim-specific configuration
        timeout = int(os.getenv("GEOCODING_TIMEOUT", "10"))
        _geocoding_service_instance = NominatimGeocodingService(timeout=timeout)
        logger.info(f"Initialized Nominatim geocoding service with timeout={timeout}s")

    # Add more providers here as needed
    # elif provider == "google":
    #     api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    #     if not api_key:
    #         raise ValueError("GOOGLE_MAPS_API_KEY environment variable is required for Google geocoding")
    #     _geocoding_service_instance = GoogleGeocodingService(api_key=api_key)
    #     logger.info("Initialized Google Maps geocoding service")

    # elif provider == "mapbox":
    #     api_key = os.getenv("MAPBOX_API_KEY")
    #     if not api_key:
    #         raise ValueError("MAPBOX_API_KEY environment variable is required for Mapbox geocoding")
    #     _geocoding_service_instance = MapboxGeocodingService(api_key=api_key)
    #     logger.info("Initialized Mapbox geocoding service")

    else:
        raise ValueError(
            f"Unsupported geocoding provider: {provider}. "
            f"Supported providers: nominatim"
            # f"Supported providers: nominatim, google, mapbox"
        )

    return _geocoding_service_instance


async def close_geocoding_service():
    """
    Close the geocoding service and clean up resources.
    Should be called when the application shuts down.
    """
    global _geocoding_service_instance

    if _geocoding_service_instance is not None:
        if hasattr(_geocoding_service_instance, "close"):
            await _geocoding_service_instance.close()
        _geocoding_service_instance = None
        logger.info("Geocoding service closed")
