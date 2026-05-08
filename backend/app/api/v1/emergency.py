# app/api/v1/emergency.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.emergency import EmergencyCreate, EmergencyRead
from app.services.emergency_service import (
    create_emergency_alert,
    get_user_emergencies,
    resolve_emergency
)
from app.core.dependencies import get_current_user, get_current_admin

router = APIRouter()


# -------------------------------
# Create Emergency Alert
# -------------------------------
@router.post("/", response_model=EmergencyRead)
def trigger_emergency(
    data: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return create_emergency_alert(
            db=db,
            user_id=current_user.id,
            message=data.message,
            location=data.location
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------
# Get My Emergency History
# -------------------------------
@router.get("/me", response_model=List[EmergencyRead])
def my_emergencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_emergencies(db, current_user.id)


# -------------------------------
# Admin: View all emergencies
# -------------------------------
@router.get("/", response_model=List[EmergencyRead])
def all_emergencies(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return get_user_emergencies(db, None)  # None = all users


# -------------------------------
# Resolve Emergency (Admin)
# -------------------------------
@router.put("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    try:
        resolve_emergency(db, alert_id)
        return {"message": "Emergency resolved"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))