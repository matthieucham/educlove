"""Application-wide constants."""

from enum import Enum

# Profile visit TTL settings
# Time in seconds after which a profile visit record expires and is automatically deleted
# Default: 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
PROFILE_VISIT_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days


# Match status constants
class MatchStatus(str, Enum):
    """Status values for profile matches."""

    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"
