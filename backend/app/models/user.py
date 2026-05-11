from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum
from datetime import datetime


class UserRole(str, enum.Enum):
    USER = "user"
    DRIVER = "driver"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # -----------------------
    # IDENTITY
    # -----------------------
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)

    # -----------------------
    # AUTH
    # -----------------------
    hashed_password = Column(String, nullable=False)

    # -----------------------
    # ROLE (FIXED SAFE ENUM)
    # -----------------------
    role = Column(
        Enum(
            UserRole,
            name="userrole",
            native_enum=False,   # 🔥 IMPORTANT FIX (prevents DB mismatch issues)
            values_callable=lambda x: [e.value for e in x]
        ),
        default=UserRole.USER.value,
        nullable=False
    )

    # -----------------------
    # STATUS
    # -----------------------
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # -----------------------
    # RELATIONSHIP
    # -----------------------
    emergencies = relationship(
        "EmergencyAlert",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------
    # TIMESTAMPS
    # -----------------------
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)