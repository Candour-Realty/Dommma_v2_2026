from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from .base import generate_uuid, utc_now

class ContractorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    business_name: str
    description: str = ""
    specialties: List[str] = []
    service_areas: List[str] = []
    hourly_rate: Optional[float] = None
    years_experience: int = 0
    license_number: Optional[str] = None
    insurance: bool = False
    portfolio_images: List[str] = []
    avatar: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    completed_jobs: int = 0
    verified: bool = False
    status: str = "active"
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class ContractorProfileCreate(BaseModel):
    business_name: str
    description: str = ""
    specialties: List[str] = []
    service_areas: List[str] = []
    hourly_rate: Optional[float] = None
    years_experience: int = 0
    license_number: Optional[str] = None
    insurance: bool = False
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class ContractorService(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    contractor_id: str
    title: str
    description: str
    category: str
    price_type: str = "fixed"  # fixed, hourly, quote
    price: Optional[float] = None
    duration_estimate: Optional[str] = None
    images: List[str] = []
    status: str = "active"
    created_at: str = Field(default_factory=utc_now)

class ContractorServiceCreate(BaseModel):
    title: str
    description: str
    category: str
    price_type: str = "fixed"
    price: Optional[float] = None
    duration_estimate: Optional[str] = None

class ServiceBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    customer_id: str
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address: str = ""
    status: str = "pending"  # pending, confirmed, in_progress, completed, cancelled
    amount: Optional[float] = None
    payment_status: str = "unpaid"  # unpaid, paid, refunded
    payment_session_id: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class ServiceBookingCreate(BaseModel):
    contractor_id: str
    service_id: Optional[str] = None
    title: str
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address: str = ""
    notes: Optional[str] = None

class ReviewCreate(BaseModel):
    rating: int
    review: str

class ContractorJob(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    maintenance_request_id: Optional[str] = None
    landlord_id: str
    contractor_id: Optional[str] = None
    title: str
    description: str
    category: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    status: str = "open"  # open, assigned, in_progress, completed, cancelled
    bids: List[Dict[str, Any]] = []
    selected_bid_id: Optional[str] = None
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class ContractorJobCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    maintenance_request_id: Optional[str] = None

class ContractorBid(BaseModel):
    contractor_id: str
    amount: float
    estimated_days: int
    message: str

# Portfolio Models for V5
class PortfolioProject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    contractor_id: str
    title: str
    description: str
    category: str
    images: List[str] = []
    before_images: List[str] = []
    after_images: List[str] = []
    client_name: Optional[str] = None
    client_testimonial: Optional[str] = None
    project_date: Optional[str] = None
    duration: Optional[str] = None
    cost_range: Optional[str] = None
    featured: bool = False
    status: str = "active"
    created_at: str = Field(default_factory=utc_now)

class PortfolioProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    images: List[str] = []
    before_images: List[str] = []
    after_images: List[str] = []
    client_name: Optional[str] = None
    client_testimonial: Optional[str] = None
    project_date: Optional[str] = None
    duration: Optional[str] = None
    cost_range: Optional[str] = None
    featured: bool = False
