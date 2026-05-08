from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.core.dependencies import get_current_user, get_current_admin
from app.services.user_service import create_user, get_user_by_id, update_user, delete_user

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

# ------------------------
# Create a new user (Admin only)
# ------------------------
@router.post("/", response_model=UserRead)
def create_new_user(user_data: UserCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return create_user(db=db, user_data=user_data)

# ------------------------
# Get all users (Admin only)
# ------------------------
@router.get("/", response_model=List[UserRead])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(User).offset(skip).limit(limit).all()

# ------------------------
# Get current logged-in user
# ------------------------
@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ------------------------
# Get a user by ID (Admin only)
# ------------------------
@router.get("/{user_id}", response_model=UserRead)
def read_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# ------------------------
# Update user info (Admin only)
# ------------------------
@router.put("/{user_id}", response_model=UserRead)
def update_user_info(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    updated_user = update_user(db, user_id, user_data)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated_user

# ------------------------
# Delete a user (Admin only)
# ------------------------
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if not delete_user(db, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"detail": "User deleted successfully"}