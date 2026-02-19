from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from .base import generate_uuid, utc_now

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=utc_now)

class ChatSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    messages: List[ChatMessage] = []
    created_at: str = Field(default_factory=utc_now)

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    user_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    listings: List[dict] = []
    suggestions: List[str] = []

class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    sender_id: str
    recipient_id: str
    content: str
    read: bool = False
    created_at: str = Field(default_factory=utc_now)

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class FCMTokenCreate(BaseModel):
    user_id: str
    token: str

class FCMToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    token: str
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    body: str
    notification_type: str
    data: Optional[Dict[str, Any]] = None
