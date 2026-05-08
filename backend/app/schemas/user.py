from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from app.models.user import UserRole


# -------------------
# USER CREATE
# -------------------
class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    full_name: Optional[str] = None

    # password validation
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    # phone validation
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and not v.isdigit():
            raise ValueError("Phone must be numeric")
        return v

    # ✅ FIXED: cross-field validation (correct Pydantic v2 way)
    @model_validator(mode="after")
    def check_identifier(self):
        if not self.email and not self.phone:
            raise ValueError("Either email or phone must be provided")
        return self


# -------------------
# USER LOGIN
# -------------------
class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str


# -------------------
# TOKEN
# -------------------
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# -------------------
# USER RESPONSE
# -------------------
class UserRead(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    role: UserRole   # ✅ correct enum usage

    class Config:
        from_attributes = True   # Pydantic v2 ORM mode


# -------------------
# USER UPDATE
# -------------------
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v and len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v