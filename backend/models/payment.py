from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from .base import generate_uuid, utc_now

class PaymentCreate(BaseModel):
    amount: float
    description: str
    property_id: Optional[str] = None
    recipient_id: Optional[str] = None

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    session_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "cad"
    description: str
    property_id: Optional[str] = None
    recipient_id: Optional[str] = None
    payment_status: str = "pending"
    status: str = "initiated"
    created_at: str = Field(default_factory=utc_now)
