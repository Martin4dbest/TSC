# app/api/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserCreate, UserUpdate
from app.services.admin_service import (
    create_admin_user,
    get_admin_by_id,
    get_all_admins,
    update_admin_user,
    delete_admin_user
)
from app.core.dependencies import get_current_admin

router = APIRouter()


# -------------------------------
# Create Admin
# -------------------------------
@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_admin(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    try:
        return create_admin_user(
            db=db,
            email=user_data.email,
            phone=user_data.phone,
            password=user_data.password,
            full_name=user_data.full_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------
# Get Admin by ID
# -------------------------------
@router.get("/{admin_id}", response_model=UserRead)
def read_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    admin = get_admin_by_id(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin


# -------------------------------
# List Admins
# -------------------------------
@router.get("/", response_model=List[UserRead])
def list_admins(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    return get_all_admins(db)


# -------------------------------
# Update Admin
# -------------------------------
@router.put("/{admin_id}", response_model=UserRead)
def update_admin(
    admin_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    try:
        return update_admin_user(
            db,
            admin_id,
            email=user_data.email,
            phone=user_data.phone,
            full_name=user_data.full_name,
            password=user_data.password
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------
# Delete Admin
# -------------------------------
@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    try:
        delete_admin_user(db, admin_id)
        return
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))