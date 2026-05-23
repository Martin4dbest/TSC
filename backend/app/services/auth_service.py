# app/services/auth_service.py

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from jose import jwt

from app.models.user import User
from app.core.security import hash_password, verify_password
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

    existing_user = query.first()

    if existing_user:
        raise ValueError("User already exists")

    user = User(
        email=email,
        phone=phone,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role  # ✅ IMPORTANT FIX: respect role if passed
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# =====================================================
# LOGIN USER
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

    # ✅ FIX: include role inside JWT
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    refresh_token = create_refresh_token(user.id)

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role  # ✅ frontend needs this
    }


# =====================================================
# CREATE REFRESH TOKEN
# =====================================================
def create_refresh_token(user_id: int):

    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh"
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


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

        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user:
            raise Exception("User not found")

        return user

    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")

    except jwt.JWTError:
        raise Exception("Invalid token")