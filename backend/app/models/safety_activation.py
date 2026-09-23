from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


class TripSafetyActivation(Base):
    __tablename__ = "trip_safety_activations"

    id = Column(Integer, primary_key=True, index=True)

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    status = Column(
        String,
        nullable=False,
        default="pending",
        index=True,
    )

    plan = Column(
        String,
        nullable=False,
        default="standard",
    )

    fee = Column(
        Float,
        nullable=False,
        default=0.0,
    )

    activation_reference = Column(
        String,
        unique=True,
        index=True,
        nullable=True,
    )

    activated_at = Column(
        DateTime,
        nullable=True,
    )

    expires_at = Column(
        DateTime,
        nullable=True,
    )

    coverage_details = Column(
        Text,
        nullable=True,
    )

    emergency_contacts = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    trip = relationship(
        "Trip",
        backref="safety_activation",
    )

    user = relationship(
        "User",
    )
