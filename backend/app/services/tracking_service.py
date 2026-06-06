from sqlalchemy.orm import Session
from datetime import datetime

from app.models.trip import Trip
from app.services.safety_engine import calculate_safety_score
from app.services.emergency_auto import check_auto_emergency


# -------------------------------
# Start Trip
# -------------------------------
def start_trip(db: Session, user_id: int, start_location: str, destination: str):
    trip = Trip(
        user_id=user_id,
        start_location=start_location,
        destination=destination,
        status="ongoing",
        started_at=datetime.utcnow()
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


# -------------------------------
# Update Location + SAFETY + EMERGENCY
def update_trip_location(db: Session, trip_id: int, latitude: float, longitude: float):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise Exception("Trip not found")

    # =========================
    # UPDATE LOCATION
    # =========================
    trip.current_latitude = latitude
    trip.current_longitude = longitude

    # =========================
    # TIME UPDATE
    # =========================
    if trip.started_at:
        trip.duration_minutes = (
            datetime.utcnow() - trip.started_at
        ).total_seconds() / 60

    # =========================
    # 🔥 FIX: DISTANCE CALCULATION (MISSING PART)
    # =========================
    if trip.latitude is not None and trip.longitude is not None:
        # simple distance increment (replace with haversine later)
        trip.distance_km += 0.05  # simulate movement per update

    # =========================
    # FIX: SPEED CALCULATION
    # =========================
    if trip.duration_minutes > 0:
        trip.average_speed = (
            trip.distance_km / trip.duration_minutes
        ) * 60
    else:
        trip.average_speed = 0

    # =========================
    # SAFETY ENGINE
    # =========================
    result = calculate_safety_score(trip)

    trip.safety_score = result["score"]
    trip.risk_level = result["risk"]

    # =========================
    # SAVE FIRST
    # =========================
    db.commit()
    db.refresh(trip)

    # =========================
    # AUTO EMERGENCY CHECK
    # =========================
    check_auto_emergency(db, trip)

    return trip

# -------------------------------
# End Trip
# -------------------------------
def end_trip(db: Session, trip_id: int):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise Exception("Trip not found")

    trip.status = "completed"
    trip.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)
    return trip


# -------------------------------
# Get Trips
# -------------------------------
def get_user_trips(db: Session, user_id: int | None):
    query = db.query(Trip)

    if user_id:
        query = query.filter(Trip.user_id == user_id)

    return query.all()