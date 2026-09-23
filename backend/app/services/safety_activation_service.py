from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.safety_activation import TripSafetyActivation
from app.services.wallet_service import (
    get_wallet_by_user,
    create_transaction,
)


SAFETY_PLANS = {
    "standard": {
        "fee": 500.0,
        "duration_hours": 24,
        "coverage": (
            "Trip monitoring, safety alerts and emergency response."
        ),
    },
    "premium": {
        "fee": 1000.0,
        "duration_hours": 24,
        "coverage": (
            "Trip monitoring, enhanced safety alerts and priority "
            "emergency response."
        ),
    },
}


def activate_trip_safety(
    db: Session,
    user_id: int,
    trip_id: int,
    plan: str = "standard",
):
    plan = plan.lower().strip()

    if plan not in SAFETY_PLANS:
        raise ValueError("Invalid safety plan")

    trip = (
        db.query(Trip)
        .filter(
            Trip.id == trip_id,
            Trip.user_id == user_id,
        )
        .first()
    )

    if not trip:
        raise ValueError("Trip not found")

    if trip.status != "draft":
        raise ValueError(
            "Safety can only be activated for a draft trip"
        )

    existing = (
        db.query(TripSafetyActivation)
        .filter(
            TripSafetyActivation.trip_id == trip_id,
            TripSafetyActivation.user_id == user_id,
        )
        .first()
    )

    if existing and existing.status == "active":
        return existing

    plan_data = SAFETY_PLANS[plan]
    fee = plan_data["fee"]

    wallet = get_wallet_by_user(db, user_id)

    if (wallet.balance or 0.0) < fee:
        raise ValueError(
            f"Insufficient wallet balance. Required: {fee:.2f}"
        )

    now = datetime.utcnow()
    reference = f"SA-{uuid4().hex[:20].upper()}"

    wallet.balance -= fee

    activation = existing or TripSafetyActivation(
        trip_id=trip.id,
        user_id=user_id,
    )

    activation.status = "active"
    activation.plan = plan
    activation.fee = fee
    activation.activation_reference = reference
    activation.activated_at = now
    activation.expires_at = now + timedelta(
        hours=plan_data["duration_hours"]
    )
    activation.coverage_details = plan_data["coverage"]

    db.add(activation)

    create_transaction(
        db=db,
        user_id=user_id,
        wallet_id=wallet.id,
        amount=fee,
        transaction_type="debit",
        status="completed",
        reference=reference,
    )

    db.commit()
    db.refresh(activation)

    return activation


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
