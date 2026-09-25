from sqlalchemy.orm import Session

from app.models.safety_activation import TripSafetyActivation
from app.services.tsc_platform_service import (
    activate_trip_from_workflow,
)


def activate_trip_safety(
    db: Session,
    user_id: int,
    trip_id: int,
    plan: str = "standard",
):
    # The old plan argument remains for API compatibility.
    # Pricing and coverage now come from the Admin-approved
    # TSC safety policy attached to the trip.
    return activate_trip_from_workflow(
        db=db,
        user_id=user_id,
        trip_id=trip_id,
    )


def get_trip_safety_activation(
    db: Session,
    user_id: int,
    trip_id: int,
):
    return (
        db.query(TripSafetyActivation)
        .filter(
            TripSafetyActivation.trip_id == trip_id,
            TripSafetyActivation.user_id == user_id,
        )
        .first()
    )
