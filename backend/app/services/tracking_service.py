from sqlalchemy.orm import Session
from datetime import datetime
from app.models.tracking import Trip


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
# Update Location
# -------------------------------
def update_trip_location(db: Session, trip_id: int, latitude: float, longitude: float):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise Exception("Trip not found")

    trip.current_latitude = latitude
    trip.current_longitude = longitude

    db.commit()
    db.refresh(trip)
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