# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, Token
from app.services.auth_service import register_user, login_user, create_access_token
from app.db.session import get_db
import jwt
from app.core.config import settings

router = APIRouter()


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

        return {
            "access_token": access_token,
            "refresh_token": access_token,  # temporary (until refresh is fully implemented)
            "token_type": "bearer"
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

        # Your service already returns token
        return {
            "access_token": result["access_token"],
            "refresh_token": result["access_token"],  # temporary
            "token_type": "bearer"
        }

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


# -------------------------------
# REFRESH TOKEN (OPTIONAL FOR NOW)
# -------------------------------
@router.post("/refresh", response_model=Token)
def refresh_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        user_id = int(payload.get("sub"))

        new_access_token = create_access_token({"sub": str(user_id)})

        return {
            "access_token": new_access_token,
            "refresh_token": token,
            "token_type": "bearer"
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")