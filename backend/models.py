from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from enum import Enum
from datetime import datetime, timezone, date


class LookingForEnum(str, Enum):
    FRIENDSHIP = "FRIENDSHIP"
    CASUAL = "CASUAL"
    SERIOUS = "SERIOUS"


class GenderEnum(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class Location(BaseModel):
    """Location model with city name and GPS coordinates"""

    city_name: str = Field(
        ..., min_length=1, max_length=100, description="Name of the city"
    )
    coordinates: List[float] = Field(
        ...,
        min_items=2,
        max_items=2,
        description="GPS coordinates [longitude, latitude]",
    )

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v):
        """Validate that coordinates are within valid ranges"""
        if len(v) != 2:
            raise ValueError(
                "Coordinates must have exactly 2 values: [longitude, latitude]"
            )
        lon, lat = v
        if not (-180 <= lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    class Config:
        json_schema_extra = {
            "example": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]}
        }


class Profile(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: date = Field(..., description="User's date of birth")
    gender: Optional[str] = Field(None, max_length=20, description="User's gender")
    location: Location = Field(
        ..., description="Geolocation information for the profile"
    )
    looking_for: List[str] = Field(
        ...,
        description="What the user is looking for (multiple selections allowed)",
    )
    looking_for_gender: List[str] = Field(
        ..., description="Gender preferences (MALE, FEMALE, OTHER)"
    )
    subject: str = Field(..., min_length=1, max_length=100)
    photos: List[str] = []
    description: Optional[str] = Field(None, max_length=5000)
    goals: Optional[str] = Field(None, max_length=5000)
    email: EmailStr

    class Config:
        from_attributes = True
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "first_name": "Jane",
                "date_of_birth": "1996-03-15",
                "gender": "FEMALE",
                "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
                "looking_for": ["Amitié", "Relation sérieuse"],
                "looking_for_gender": ["MALE", "FEMALE"],
                "subject": "Mathématiques",
                "experience_years": 5,
                "photos": ["http://example.com/photo1.jpg"],
                "description": "A passionate math teacher looking for a serious relationship.",
                "goals": "My goal is to inspire students and find a life partner.",
                "email": "jane.doe@example.com",
            }
        }


class SearchCriteria(BaseModel):
    """Search criteria model for filtering profiles"""

    user_id: str = Field(..., description="User ID who owns these search criteria")
    locations: List[Location] = Field(
        default=[], description="List of locations to search in"
    )
    radii: List[int] = Field(
        default=[], description="Search radius in km for each location"
    )
    age_min: Optional[int] = Field(None, ge=18, description="Minimum age")
    age_max: Optional[int] = Field(None, le=100, description="Maximum age")
    subjects: List[str] = Field(default=[], description="Teaching subjects")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "locations": [
                    {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
                    {"city_name": "Lyon", "coordinates": [4.8357, 45.7640]},
                ],
                "radii": [25, 50],
                "age_min": 25,
                "age_max": 35,
                "subjects": ["Mathématiques", "Physique"],
            }
        }


class User(BaseModel):
    """User model for authenticated users from external identity provider"""

    sub: str = Field(..., description="Subject identifier from identity provider")
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    provider: str = Field(
        ..., description="Identity provider name (e.g., 'google', 'auth0')"
    )
    profile_id: Optional[str] = Field(
        None, description="Associated profile ID if user has created a profile"
    )
    email_verified: bool = Field(
        default=False, description="Whether the email has been verified"
    )
    profile_completed: bool = Field(
        default=False, description="Whether the user has completed their profile"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "sub": "google-oauth2|123456789",
                "email": "user@example.com",
                "name": "John Doe",
                "picture": "https://example.com/photo.jpg",
                "provider": "google",
                "profile_id": "507f1f77bcf86cd799439011",
                "email_verified": True,
                "profile_completed": True,
            }
        }


class MatchStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    blocked = "blocked"


class Match(BaseModel):
    """Match model representing a connection between two users"""

    initiator_user_id: str = Field(..., description="User ID who initiated the match")
    target_profile_id: str = Field(..., description="Profile ID of the matched person")
    status: MatchStatus = Field(default=MatchStatus.pending)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: Optional[str] = Field(
        None, max_length=500, description="Optional message with the match request"
    )

    class Config:
        from_attributes = True
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "initiator_user_id": "507f1f77bcf86cd799439011",
                "target_profile_id": "507f191e810c19729de860ea",
                "status": "pending",
                "message": "Hi! I'd love to connect with you.",
            }
        }


class MatchRequest(BaseModel):
    """Request model for creating a new match"""

    target_profile_id: str = Field(..., description="Profile ID to match with")
    message: Optional[str] = Field(
        None, max_length=500, description="Optional message with the match request"
    )
