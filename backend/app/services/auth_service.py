# app/services/auth_service.py

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from jose import jwt

from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.core.config import settings

REFRESH_TOKEN_EXPIRE_DAYS = 7


# =====================================================
# REGISTER USER
# =====================================================

def register_user(
    db: Session,
    email: str = None,
    phone: str = None,
    password: str = None,
    full_name: str = None,
    role: str = "user"
):

    if not email and not phone:
        raise ValueError("Email or phone is required")

    query = db.query(User)

    if email:
        query = query.filter(User.email == email)

    if phone:
        query = query.filter(User.phone == phone)

    if query.first():
        raise ValueError("User already exists")

    user = User(
        email=email,
        phone=phone,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# =====================================================
# LOGIN USER (FIXED)
# =====================================================

def login_user(
    db: Session,
    email: str = None,
    phone: str = None,
    password: str = None
):

    if not email and not phone:
        raise ValueError("Email or phone required")

    query = db.query(User)

    if email:
        query = query.filter(User.email == email)

    if phone:
        query = query.filter(User.phone == phone)

    user = query.first()

    if not user:
        raise ValueError("User not found")

    if not verify_password(password, user.hashed_password):
        raise ValueError("Invalid credentials")

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    refresh_token = jwt.encode(
        {
            "sub": str(user.id),
            "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "type": "refresh"
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    # ✅ CLEAN RESPONSE (NO nested dict, NO duplication)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role
    }


# =====================================================
# DECODE TOKEN
# =====================================================

def decode_token_and_get_user(token: str, db: Session):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise Exception("Invalid token payload")

        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise Exception("User not found")

        return user

    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")

    except jwt.InvalidTokenError:
        raise Exception("Invalid token")