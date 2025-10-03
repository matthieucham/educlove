from database.database import Database
from database.repositories.users import UsersRepository
from database.repositories.profiles import ProfilesRepository
from database.repositories.search_criteria import SearchCriteriaRepository
from database.repositories.profile_visits import ProfileVisitsRepository
from database.repositories.matches import MatchesRepository
from database.repositories.conversations import ConversationsRepository
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
        self.matches_repo = None
        self.conversations_repo = None

    def connect(self):
        try:
            self.client = MongoClient(self.uri)
            self.db = self.client[self.db_name]

            # Initialize repositories
            self.users_repo = UsersRepository(self.db)
            self.profiles_repo = ProfilesRepository(self.db)
            self.search_criteria_repo = SearchCriteriaRepository(self.db)
            self.profile_visits_repo = ProfileVisitsRepository(self.db)
            self.matches_repo = MatchesRepository(self.db)
            self.conversations_repo = ConversationsRepository(self.db)

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

    def get_random_profile_for_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single random profile for a user based on their search criteria,
        excluding profiles they have already visited.

        Args:
            user_id: The ID of the user requesting a profile

        Returns:
            A single random profile matching criteria, or None if no matches
        """
        # Get the current user's profile for preferences
        user = self.get_user_by_id(user_id)
        current_user_profile = None
        if user and user.get("profile_id"):
            current_user_profile = self.get_profile(user["profile_id"])

        # Get the user's search criteria
        criteria = self.search_criteria_repo.get_search_criteria(user_id)
        if not criteria:
            criteria = {}  # Use empty criteria if none saved

        # Get the list of visited profile IDs
        visited_profile_ids = self.profile_visits_repo.get_visited_profile_ids(user_id)

        # Get a random profile excluding visited ones
        return self.profiles_repo.get_random_profile_excluding_visited(
            criteria, current_user_profile, visited_profile_ids
        )

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

    # Match methods - delegate to MatchesRepository
    def handle_profile_like(
        self, current_profile_id: str, target_profile_id: str, message: str = None
    ) -> Dict[str, Any]:
        """
        Handle a like action from one profile to another with an optional message.
        Creates a conversation with the initial message if provided.
        """
        # Get the current user's profile to get their name
        current_profile = self.get_profile(current_profile_id)
        if not current_profile:
            return {"action": "error", "message": "Current user profile not found"}

        # Handle the like with message
        result = self.matches_repo.handle_like(
            current_profile_id, target_profile_id, message
        )

        # If a message was provided and the like was successful, create/update conversation
        if message and result["action"] in ["like_sent", "mutual_match"]:
            match_id = result["match_id"]
            sender_name = current_profile.get("first_name", "Unknown")

            if result["action"] == "like_sent":
                # Create new conversation with the initial message
                self.conversations_repo.create_conversation(
                    match_id, current_profile_id, sender_name, message
                )
            elif result["action"] == "mutual_match":
                # It's a mutual match - add the second message to the conversation
                # First check if conversation exists (it should from the reverse match)
                if self.conversations_repo.conversation_exists(match_id):
                    # Add the mutual match message
                    self.conversations_repo.add_message(
                        match_id, current_profile_id, sender_name, message
                    )
                else:
                    # If no conversation exists yet (shouldn't happen but handle it)
                    # Get the other person's profile for their initial message
                    target_profile = self.get_profile(target_profile_id)
                    if target_profile and result.get("reverse_match_message"):
                        # Create conversation with both messages
                        self.conversations_repo.create_conversation(
                            match_id,
                            target_profile_id,
                            target_profile.get("first_name", "Unknown"),
                            result["reverse_match_message"],
                        )
                        # Add the current user's message
                        self.conversations_repo.add_message(
                            match_id, current_profile_id, sender_name, message
                        )

        return result

    def get_matches_for_profile(
        self, profile_id: str, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get matches for a profile, optionally filtered by status."""
        return self.matches_repo.get_matches_for_profile(profile_id, status)

    def get_accepted_matches(self, profile_id: str) -> List[Dict[str, Any]]:
        """Get all accepted (mutual) matches for a profile."""
        return self.matches_repo.get_accepted_matches(profile_id)

    def get_pending_matches_received(self, profile_id: str) -> List[Dict[str, Any]]:
        """Get pending matches where the profile is the target."""
        return self.matches_repo.get_pending_matches_received(profile_id)

    def get_pending_matches_sent(self, profile_id: str) -> List[Dict[str, Any]]:
        """Get pending matches where the profile is the initiator."""
        return self.matches_repo.get_pending_matches_sent(profile_id)

    def is_matched(self, profile1_id: str, profile2_id: str) -> bool:
        """Check if two profiles have an accepted match."""
        return self.matches_repo.is_matched(profile1_id, profile2_id)

    # Conversation methods - delegate to ConversationsRepository
    def get_conversation(
        self, match_id: str, limit: Optional[int] = None, skip: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get all messages for a conversation."""
        return self.conversations_repo.get_conversation(match_id, limit, skip)

    def send_message(
        self, match_id: str, sender_profile_id: str, sender_name: str, message: str
    ) -> bool:
        """Send a message in a conversation."""
        return self.conversations_repo.add_message(
            match_id, sender_profile_id, sender_name, message
        )

    def get_conversation_summary(self, match_id: str) -> Dict[str, Any]:
        """Get a summary of a conversation."""
        return self.conversations_repo.get_conversation_summary(match_id)

    def get_conversations_for_matches(
        self, match_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Get conversation summaries for multiple matches."""
        return self.conversations_repo.get_conversations_for_matches(match_ids)
