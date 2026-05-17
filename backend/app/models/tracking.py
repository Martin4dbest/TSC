from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)

from sqlalchemy.sql import func

from datetime import datetime

from app.db.base import Base


# =========================================
# TRIP MODEL
# =========================================

class Trip(Base):
    __tablename__ = "trips"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    start_location = Column(String)

    destination = Column(String)

    current_latitude = Column(
        Float,
        nullable=True,
    )

    current_longitude = Column(
        Float,
        nullable=True,
    )

    status = Column(
        String,
        default="ongoing",
    )

    started_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    ended_at = Column(
        DateTime,
        nullable=True,
    )


# =========================================
# TRACKING LOG MODEL
# =========================================

class TrackingLog(Base):
    __tablename__ = "tracking_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
    )

    latitude = Column(Float)

    longitude = Column(Float)

    status = Column(
        String,
        default="active",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )