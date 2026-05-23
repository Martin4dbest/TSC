# app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from pydantic import BaseModel

from app.schemas.user import UserCreate, UserLogin, Token
from app.services.auth_service import (
    register_user,
    login_user,
    create_access_token,
    create_refresh_token,
    decode_token_and_get_user
)
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class RefreshRequest(BaseModel):
    token: str


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

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user.role
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

        return {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "role": user.role
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


# -------------------------------
# GET CURRENT USER
# -------------------------------
@router.get("/me")
def get_me(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        user = decode_token_and_get_user(token, db)

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }

    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# -------------------------------
# REFRESH TOKEN
# -------------------------------
@router.post("/refresh", response_model=Token)
def refresh_token(data: RefreshRequest):
    try:
        payload = jwt.decode(
            data.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = int(payload.get("sub"))

        new_access_token = create_access_token({"sub": str(user_id)})
        new_refresh_token = create_refresh_token({"sub": str(user_id)})

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")