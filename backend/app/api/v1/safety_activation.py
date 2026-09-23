from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.safety_activation import (
    SafetyActivationCreate,
    SafetyActivationRead,
)
from app.services.safety_activation_service import (
    activate_trip_safety,
    get_trip_safety_activation,
)


router = APIRouter(
    prefix="/safety",
    tags=["Trip Safety"],
)


@router.post(
    "/trips/{trip_id}/activate",
    response_model=SafetyActivationRead,
)
def activate_safety(
    trip_id: int,
    data: SafetyActivationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return activate_trip_safety(
            db=db,
            user_id=current_user.id,
            trip_id=trip_id,
            plan=data.plan,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Safety activation failed",
        )


@router.get(
    "/trips/{trip_id}",
    response_model=SafetyActivationRead,
)
def get_safety(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activation = get_trip_safety_activation(
        db=db,
        user_id=current_user.id,
        trip_id=trip_id,
    )

    if not activation:
        raise HTTPException(
            status_code=404,
            detail="Safety activation not found",
        )

    return activation
