from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.tracking import TrackingLog
from app.schemas.tracking import TripCreate, TripRead, LocationUpdate

from app.services.tracking_service import (
    create_trip,
    start_trip,
    update_trip_location,
    end_trip,
    get_user_trips,
)

from app.core.dependencies import get_current_user, get_current_admin


router = APIRouter()


@router.post("/create", response_model=TripRead)
def create_tracking_trip(
    data: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_trip(
            db=db,
            user_id=current_user.id,
            start_location=data.start_location,
            destination=data.destination,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{trip_id}/start", response_model=TripRead)
def start_tracking_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return start_trip(
            db=db,
            user_id=current_user.id,
            trip_id=trip_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{trip_id}/location", response_model=TripRead)
def update_location(
    trip_id: int,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return update_trip_location(
            db=db,
            trip_id=trip_id,
            user_id=current_user.id,
            latitude=data.latitude,
            longitude=data.longitude,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{trip_id}/end", response_model=TripRead)
def stop_tracking(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return end_trip(
            db=db,
            trip_id=trip_id,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=List[TripRead])
def my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_trips(db, current_user.id)


@router.get("/recent")
def get_recent_tracking(
    user_id: int,
    db: Session = Depends(get_db),
):
    try:
        return (
            db.query(TrackingLog)
            .filter(TrackingLog.user_id == user_id)
            .order_by(TrackingLog.created_at.desc())
            .limit(10)
            .all()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[TripRead])
def all_trips(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return get_user_trips(db, None)
