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

    start_location: Optional[str] = None
    destination: Optional[str] = None

    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None

    status: str

    distance_km: Optional[float] = 0
    duration_minutes: Optional[float] = 0
    average_speed: Optional[float] = 0

    safety_score: Optional[int] = 100
    risk_level: Optional[str] = "SAFE"

    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True