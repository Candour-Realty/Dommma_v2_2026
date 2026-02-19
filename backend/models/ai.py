from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from .base import generate_uuid, utc_now

class IssueAnalysisRequest(BaseModel):
    image_data: str  # base64 data URL
    description: Optional[str] = ""

class DocumentAnalysisRequest(BaseModel):
    document_text: str
    document_type: str = "lease"

class CommuteSearchRequest(BaseModel):
    work_addresses: List[str]
    max_commute_minutes: int = 45
    transport_mode: str = "transit"

class RoommateCompatibilityRequest(BaseModel):
    profile_id: str
    target_profile_ids: List[str] = []
