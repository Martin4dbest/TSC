from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    alert_type = Column(String, default="emergency")
    message = Column(String, nullable=True)

    status = Column(String, default="active")  # active / resolved

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User")