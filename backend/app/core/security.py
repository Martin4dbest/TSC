from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.hash import argon2
from app.core.config import settings   # 🔥 ADD THIS

# -----------------------------
# Password hashing
# -----------------------------
def hash_password(password: str) -> str:
    return argon2.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return argon2.verify(password, hashed)

# -----------------------------
# JWT Token
# -----------------------------
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    # 🔥 FIX IMPORTANT
    to_encode["sub"] = str(to_encode["sub"])

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,   # ✅ USE SINGLE SOURCE OF TRUTH
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,   # ✅ SAME KEY HERE
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return {}