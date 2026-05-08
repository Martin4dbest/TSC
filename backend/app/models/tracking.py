from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.db.base import Base
from datetime import datetime


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    start_location = Column(String)
    destination = Column(String)

    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)

    status = Column(String, default="ongoing")

    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)