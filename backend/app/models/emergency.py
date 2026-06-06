from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)

    # =========================
    # USER RELATIONSHIP
    # =========================
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship(
        "User",
        back_populates="emergencies"
    )

    # =========================
    # USER INFO
    # =========================
    full_name = Column(String, nullable=True)

    phone = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)

    # =========================
    # EMERGENCY DATA
    # =========================
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    address = Column(String, nullable=True)

    message = Column(String, nullable=False, default="🚨 Emergency Alert")

    # ✅ FIXED STATUS SYSTEM
    status = Column(
        String,
        nullable=False,
        default="pending",
        index=True
    )

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # =========================
    # ESCALATION FIELDS
    # =========================
    emergency_type = Column(String, nullable=True, index=True)

    escalated_to = Column(String, nullable=True)
    escalated_at = Column(DateTime, nullable=True)

    # =========================
    # SHARE FEATURE SUPPORT
    # =========================
    screenshot = Column(String, nullable=True)
    share_type = Column(String, nullable=True)


class EmergencyFeedback(Base):
    __tablename__ = "emergency_feedback"

    id = Column(Integer, primary_key=True, index=True)

    # ✅ ADDED FIELD HERE
    emergency_id = Column(
        Integer,
        ForeignKey("emergency_alerts.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    full_name = Column(String, nullable=True)

    outcome = Column(
        String,
        nullable=False
    )
    # rescued
    # helped
    # not_helped

    feedback = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    emergency = relationship(
        "EmergencyAlert",
        back_populates="feedbacks"
    )