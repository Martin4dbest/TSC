from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SafetyActivationCreate(BaseModel):
    plan: str = "standard"


class SafetyActivationRead(BaseModel):
    id: int
    trip_id: int
    user_id: int
    status: str
    plan: str
    fee: float
    activation_reference: Optional[str] = None
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    coverage_details: Optional[str] = None
    emergency_contacts: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
