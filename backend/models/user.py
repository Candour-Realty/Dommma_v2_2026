from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from .base import generate_uuid, utc_now

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    user_type: str

class UserLogin(BaseModel):
    email: str
    password: str
    user_type: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    email: str
    name: str
    user_type: str
    created_at: str = Field(default_factory=utc_now)
