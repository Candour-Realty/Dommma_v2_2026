# Base models and shared utilities
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
