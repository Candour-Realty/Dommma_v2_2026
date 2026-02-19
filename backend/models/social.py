from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from .base import generate_uuid, utc_now

class RoommateProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    name: str = ""
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    budget_min: int = 500
    budget_max: int = 2000
    move_in_date: Optional[str] = None
    preferred_areas: List[str] = []
    lifestyle: List[str] = []  # early_bird, night_owl, quiet, social, clean, etc.
    pets: bool = False
    smoking: bool = False
    bio: str = ""
    avatar: Optional[str] = None
    status: str = "active"
    compatibility_preferences: Dict[str, Any] = {}  # For AI matching
    created_at: str = Field(default_factory=utc_now)

class RoommateProfileCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    budget_min: int = 500
    budget_max: int = 2000
    move_in_date: Optional[str] = None
    preferred_areas: List[str] = []
    lifestyle: List[str] = []
    pets: bool = False
    smoking: bool = False
    bio: str = ""
    compatibility_preferences: Dict[str, Any] = {}

class RoommateConnection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    requester_id: str
    target_id: str
    message: str = ""
    status: str = "pending"  # pending, accepted, rejected
    compatibility_score: Optional[float] = None
    created_at: str = Field(default_factory=utc_now)

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    listing_id: str
    created_at: str = Field(default_factory=utc_now)
