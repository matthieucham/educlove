from database.database import Database
from database.repositories.users import UsersRepository
from database.repositories.profiles import ProfilesRepository
from database.repositories.search_criteria import SearchCriteriaRepository
from database.repositories.profile_visits import ProfileVisitsRepository
from pymongo import MongoClient
from typing import Dict, Any, List, Optional
from bson import ObjectId


class MongoDatabase(Database):
    def __init__(
        self,
        uri: str = "mongodb://root:password@localhost:27017/",
        db_name: str = "educlove",
    ):
        self.client = None
        self.db = None
        self.uri = uri
        self.db_name = db_name
        self.users_repo = None
        self.profiles_repo = None
        self.search_criteria_repo = None
        self.profile_visits_repo = None

    def connect(self):
        try:
            self.client = MongoClient(self.uri)
            self.db = self.client[self.db_name]

            # Initialize repositories
            self.users_repo = UsersRepository(self.db)
            self.profiles_repo = ProfilesRepository(self.db)
            self.search_criteria_repo = SearchCriteriaRepository(self.db)
            self.profile_visits_repo = ProfileVisitsRepository(self.db)

            print("Successfully connected to MongoDB.")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")

    def disconnect(self):
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB.")

    # Profile methods - delegate to ProfilesRepository
    def create_profile(self, profile_data: Dict[str, Any]) -> str:
        return self.profiles_repo.create_profile(profile_data)

    def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        return self.profiles_repo.get_profile(profile_id)

    def search_profiles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        return self.profiles_repo.search_profiles(criteria)

    def search_profiles_with_user_criteria(self, user_id: str) -> List[Dict[str, Any]]:
        """Search profiles using the user's saved search criteria."""
        # Get the current user's profile to pass their preferences
        user = self.get_user_by_id(user_id)
        current_user_profile = None
        if user and user.get("profile_id"):
            current_user_profile = self.get_profile(user["profile_id"])

        criteria = self.search_criteria_repo.get_search_criteria(user_id)
        if not criteria:
            # If no criteria saved, still use user's profile preferences
            if current_user_profile:
                # Create minimal criteria with just the user's profile preferences
                return self.profiles_repo.search_profiles({}, current_user_profile)
            else:
                # No criteria and no profile, return all profiles
                return self.profiles_repo.get_all_profiles()

        # Pass the raw criteria and current user's profile to search_profiles
        # The search_profiles method will use the profile for gender and looking_for preferences
        return self.profiles_repo.search_profiles(criteria, current_user_profile)

    # User methods - delegate to UsersRepository
    def upsert_user(self, user_data: Dict[str, Any]) -> str:
        return self.users_repo.upsert_user(user_data)

    def get_user_by_sub(self, sub: str) -> Optional[Dict[str, Any]]:
        return self.users_repo.get_user_by_sub(sub)

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.users_repo.get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return self.users_repo.get_user_by_email(email)

    def update_user_last_login(self, user_id: str) -> bool:
        return self.users_repo.update_user_last_login(user_id)

    # Search criteria methods - delegate to SearchCriteriaRepository
    def upsert_search_criteria(
        self, user_id: str, criteria_data: Dict[str, Any]
    ) -> str:
        """Create or update search criteria for a user."""
        return self.search_criteria_repo.upsert_search_criteria(user_id, criteria_data)

    def get_search_criteria(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get search criteria for a user."""
        return self.search_criteria_repo.get_search_criteria(user_id)

    def delete_search_criteria(self, user_id: str) -> bool:
        """Delete search criteria for a user."""
        return self.search_criteria_repo.delete_search_criteria(user_id)

    # Profile visit methods - delegate to ProfileVisitsRepository
    def record_profile_visit(self, user_id: str, visited_profile_id: str) -> str:
        """Record that a user visited a profile."""
        return self.profile_visits_repo.record_visit(user_id, visited_profile_id)

    def has_visited_profile(self, user_id: str, visited_profile_id: str) -> bool:
        """Check if a user has visited a specific profile."""
        return self.profile_visits_repo.has_visited(user_id, visited_profile_id)

    def get_visited_profiles(
        self, user_id: str, limit: int = 100, skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Get the list of profiles a user has visited."""
        return self.profile_visits_repo.get_visited_profiles(user_id, limit, skip)

    def get_visited_profile_ids(self, user_id: str) -> List[str]:
        """Get just the profile IDs that a user has visited."""
        return self.profile_visits_repo.get_visited_profile_ids(user_id)

    def get_visit_count(self, user_id: str) -> int:
        """Get the total number of profiles a user has visited."""
        return self.profile_visits_repo.get_visit_count(user_id)
