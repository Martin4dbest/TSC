from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # =========================
    # LOCATIONS
    # =========================
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)

    start_location = Column(String, nullable=True)
    destination = Column(String, nullable=True)

    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)

    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)

    # =========================
    # ANALYTICS
    # =========================
    distance_km = Column(Float, default=0)
    duration_minutes = Column(Float, default=0)
    average_speed = Column(Float, default=0)

    # =========================
    # SAFETY ENGINE
    # =========================
    safety_score = Column(Integer, default=100)
    risk_level = Column(String, default="SAFE")

    # =========================
    # STATUS
    # =========================
    status = Column(String, default="ongoing")

    # =========================
    # TIMESTAMPS
    # =========================
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # =========================
    # RELATIONSHIPS
    # =========================
    user = relationship("User", back_populates="trips")

    tracking_logs = relationship(
        "TrackingLog",
        back_populates="trip",
        cascade="all, delete-orphan",
    )