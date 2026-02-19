from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from .base import generate_uuid, utc_now

# Calendar Event Models
class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    title: str
    description: str = ""
    event_type: str  # viewing, meeting, maintenance, moving
    listing_id: Optional[str] = None
    start_time: str
    end_time: str
    location: str = ""
    attendees: List[str] = []
    google_event_id: Optional[str] = None  # If synced with Google Calendar
    status: str = "confirmed"  # confirmed, cancelled, completed
    reminder_minutes: int = 30
    notes: str = ""
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

class CalendarEventCreate(BaseModel):
    title: str
    description: str = ""
    event_type: str
    listing_id: Optional[str] = None
    start_time: str
    end_time: str
    location: str = ""
    attendees: List[str] = []
    reminder_minutes: int = 30
    notes: str = ""

class GoogleCalendarToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: str
    access_token: str
    refresh_token: str
    token_expiry: str
    scope: str = ""
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)

# Moving Quote Models
class MovingQuoteRequest(BaseModel):
    origin_address: str
    destination_address: str
    move_date: str
    home_size: str  # studio, 1br, 2br, 3br, 4br+, house
    has_elevator_origin: bool = False
    has_elevator_destination: bool = False
    floor_origin: int = 1
    floor_destination: int = 1
    special_items: List[str] = []  # piano, pool_table, antiques, etc.
    packing_service: bool = False
    storage_needed: bool = False
    storage_duration_months: int = 0

class MovingQuote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    user_id: Optional[str] = None
    request: MovingQuoteRequest
    estimated_cost_low: float
    estimated_cost_high: float
    estimated_hours: float
    distance_km: float
    truck_size: str
    crew_size: int
    includes_packing: bool
    includes_storage: bool
    storage_monthly_cost: Optional[float] = None
    valid_until: str
    provider_name: str = "DOMMMA Moving"
    notes: List[str] = []
    created_at: str = Field(default_factory=utc_now)
