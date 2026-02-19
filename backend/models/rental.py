from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from .base import generate_uuid, utc_now

class RentalApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    listing_id: str
    landlord_id: Optional[str] = None
    full_name: str
    email: str
    phone: str
    current_address: str
    move_in_date: str
    employer: Optional[str] = None
    job_title: Optional[str] = None
    monthly_income: Optional[float] = None
    employment_length: Optional[str] = None
    references: List[Dict[str, str]] = []
    num_occupants: int = 1
    has_pets: bool = False
    pet_details: Optional[str] = None
    additional_notes: Optional[str] = None
    status: str = "pending"  # pending, under_review, approved, rejected
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class ApplicationCreate(BaseModel):
    listing_id: str
    full_name: str
    email: str
    phone: str
    current_address: str
    move_in_date: str
    employer: Optional[str] = None
    job_title: Optional[str] = None
    monthly_income: Optional[float] = None
    employment_length: Optional[str] = None
    references: List[Dict[str, str]] = []
    num_occupants: int = 1
    has_pets: bool = False
    pet_details: Optional[str] = None
    additional_notes: Optional[str] = None

class MaintenanceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    landlord_id: Optional[str] = None
    property_id: Optional[str] = None
    title: str
    description: str
    category: str
    priority: str = "medium"
    images: List[str] = []
    status: str = "open"
    assigned_contractor_id: Optional[str] = None
    scheduled_date: Optional[str] = None
    completed_date: Optional[str] = None
    cost: Optional[float] = None
    notes: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class MaintenanceRequestCreate(BaseModel):
    property_id: Optional[str] = None
    title: str
    description: str
    category: str
    priority: str = "medium"
    images: List[str] = []

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    name: str
    type: str
    content: Optional[str] = None
    url: Optional[str] = None
    status: str = "active"
    signed: bool = False
    signed_at: Optional[str] = None
    created_at: str = Field(default_factory=utc_now)
