from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from enum import Enum
from datetime import datetime, timezone


class LookingForEnum(str, Enum):
    friendship = "Amitié"
    casual = "Relation légère"
    serious = "Relation sérieuse"


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
    age: int = Field(..., gt=17)
    location: Location = Field(
        ..., description="Geolocation information for the profile"
    )
    looking_for: LookingForEnum
    subject: str = Field(..., min_length=1, max_length=100)
    experience_years: int = Field(..., ge=0)
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
                "age": 28,
                "location": {"city_name": "Paris", "coordinates": [2.3522, 48.8566]},
                "looking_for": "Relation sérieuse",
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
    gender: List[str] = Field(default=[], description="Preferred genders")
    orientation: List[str] = Field(default=[], description="Preferred orientations")
    looking_for: List[LookingForEnum] = Field(
        default=[], description="What they are looking for"
    )
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
                "gender": ["Homme", "Femme"],
                "orientation": ["Hétérosexuel(le)", "Bisexuel(le)"],
                "looking_for": ["Relation sérieuse"],
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
