from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class Database(ABC):
    @abstractmethod
    def connect(self):
        """Connects to the database."""
        pass

    @abstractmethod
    def disconnect(self):
        """Disconnects from the database."""
        pass

    # Profile methods
    @abstractmethod
    def create_profile(self, profile_data: Dict[str, Any]) -> str:
        """Creates a new user profile and returns its ID."""
        pass

    @abstractmethod
    def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a profile by its ID."""
        pass

    @abstractmethod
    def search_profiles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Searches for profiles based on given criteria."""
        pass

    # User methods
    @abstractmethod
    def upsert_user(self, user_data: Dict[str, Any]) -> str:
        """Create or update a user based on their 'sub' (subject identifier)."""
        pass

    @abstractmethod
    def get_user_by_sub(self, sub: str) -> Optional[Dict[str, Any]]:
        """Get a user by their subject identifier from the identity provider."""
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by their MongoDB _id."""
        pass
