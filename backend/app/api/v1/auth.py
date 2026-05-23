# app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app.schemas.user import UserCreate, UserLogin, Token
from app.services.auth_service import (
    register_user,
    login_user,
    decode_token_and_get_user
)
from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# -------------------------------
# REGISTER
# -------------------------------
@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = register_user(
            db,
            email=data.email,
            phone=data.phone,
            password=data.password,
            full_name=data.full_name
        )

        access_token = create_access_token({
            "sub": str(user.id),
            "role": user.role.value if hasattr(user.role, "value") else user.role
        })

        role = user.role.value if hasattr(user.role, "value") else user.role

        return {
            "access_token": access_token,
            "refresh_token": access_token,
            "token_type": "bearer",
            "role": role
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------
# LOGIN
# -------------------------------
@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        result = login_user(
            db,
            email=data.email,
            phone=data.phone,
            password=data.password
        )

        user = result["user"]

        access_token = create_access_token({
            "sub": str(user["id"]),
            "role": user["role"]
        })

        return {
            "access_token": access_token,
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "role": user["role"]   # ✅ CRITICAL FIX
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


# -------------------------------
# ME
# -------------------------------
@router.get("/me")
def get_me(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = decode_token_and_get_user(token, db)

    role = user.role.value if hasattr(user.role, "value") else user.role

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": role
    }


# -------------------------------
# REFRESH TOKEN
# -------------------------------
@router.post("/refresh", response_model=Token)
def refresh_token(token: str):
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    user_id = payload.get("sub")

    new_access_token = create_access_token({
        "sub": str(user_id),
        "role": payload.get("role", "user")
    })

    return {
        "access_token": new_access_token,
        "refresh_token": token,
        "token_type": "bearer",
        "role": payload.get("role", "user")
    }