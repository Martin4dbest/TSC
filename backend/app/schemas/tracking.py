# app/schemas/tracking.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# -------------------------------
# Create Trip
# -------------------------------
class TripCreate(BaseModel):
    start_location: str
    destination: str


# -------------------------------
# Update Location
# -------------------------------
class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


# -------------------------------
# Read Trip
# -------------------------------
class TripRead(BaseModel):
    id: int
    user_id: int
    start_location: str
    destination: str
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    is_active: bool
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True