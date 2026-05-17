from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# =========================
# BASE
# =========================
class EmergencyBase(BaseModel):
    full_name: Optional[str] = None
    message: Optional[str] = "🚨 Emergency Alert"

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    address: Optional[str] = None

    emergency_type: Optional[str] = None
    status: Optional[str] = "active"


# =========================
# CREATE (SOS / SHARE)
# =========================
class EmergencyCreate(EmergencyBase):
    user_id: int


# =========================
# READ (ADMIN DASHBOARD)
# =========================
class EmergencyRead(EmergencyBase):
    id: int
    user_id: int

    created_at: datetime

    # NEW FEATURES
    screenshot: Optional[str] = None
    share_type: Optional[str] = None
    escalated_to: Optional[str] = None
    escalated_at: Optional[datetime] = None

    class Config:
        orm_mode = True