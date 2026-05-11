from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base


class EmergencyAlert(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)

    # linked user
    user_id = Column(Integer, ForeignKey("users.id"))

    # emergency details
    full_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    message = Column(
        String,
        nullable=False,
        default="🚨 Emergency Alert"
    )

    status = Column(
        String,
        nullable=False,
        default="active"
    )

    # timestamp
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # relationship
    user = relationship(
        "User",
        back_populates="emergencies"
    )