from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


# =========================
# EMERGENCY ALERT MODEL
# =========================
class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)

    # USER RELATIONSHIP
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship(
        "User",
        back_populates="emergencies"
    )

    # USER INFO
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)

    # LOCATION DATA
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)

    # EMERGENCY INFO
    message = Column(String, nullable=False, default="🚨 Emergency Alert")
    status = Column(String, nullable=False, default="pending", index=True)
    emergency_type = Column(String, nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # ESCALATION
    escalated_to = Column(String, nullable=True)
    escalated_at = Column(DateTime, nullable=True)

    # SHARE SUPPORT
    screenshot = Column(String, nullable=True)
    share_type = Column(String, nullable=True)

    # ✅ FEEDBACK RELATIONSHIP (FIXED)
    feedbacks = relationship(
        "EmergencyFeedback",
        back_populates="emergency",
        cascade="all, delete-orphan"
    )


# =========================
# EMERGENCY FEEDBACK MODEL (SIMPLIFIED + FIXED)
# =========================
class EmergencyFeedback(Base):
    __tablename__ = "emergency_feedback"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 KEEP ONLY THIS (MANDATORY LINK)
    emergency_id = Column(
        Integer,
        ForeignKey("emergency_alerts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # ⚠️ OPTIONAL: keep user_id ONLY for tracking (NOT required from frontend)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    full_name = Column(String, nullable=True)

    outcome = Column(String, nullable=False)
    # rescued | helped | not_helped

    feedback = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # RELATIONSHIPS
    emergency = relationship(
        "EmergencyAlert",
        back_populates="feedbacks"
    )

    user = relationship("User")