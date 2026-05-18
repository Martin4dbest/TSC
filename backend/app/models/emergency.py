from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
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

    # NEW FIELDS (FIX)
    phone = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)

    # =========================
    # EMERGENCY DATA
    # =========================
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    address = Column(String, nullable=True)

    message = Column(String, nullable=False, default="🚨 Emergency Alert")

    status = Column(String, nullable=False, default="active", index=True)

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