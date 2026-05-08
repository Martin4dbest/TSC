from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from app.db.base import Base
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
    # ROLE (FIXED)
    # -----------------------
    role = Column(
        Enum(
            UserRole,
            name="userrole",
            values_callable=lambda enum_cls: [e.value for e in enum_cls]
        ),
        default=UserRole.USER,
        nullable=False
    )

    # -----------------------
    # STATUS
    # -----------------------
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # -----------------------
    # TIMESTAMPS
    # -----------------------
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)