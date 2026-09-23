from math import radians, sin, cos, sqrt, atan2
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.tracking import TrackingLog
from app.models.safety_activation import TripSafetyActivation
from app.services.safety_engine import calculate_safety_score
from app.services.emergency_auto import check_auto_emergency


EARTH_RADIUS_KM = 6371.0


def _validate_coordinates(latitude: float, longitude: float):
    if not -90 <= latitude <= 90:
        raise ValueError("Invalid latitude")

    if not -180 <= longitude <= 180:
        raise ValueError("Invalid longitude")


def _haversine_distance(latitude1, longitude1, latitude2, longitude2):
    lat1 = radians(latitude1)
    lon1 = radians(longitude1)
    lat2 = radians(latitude2)
    lon2 = radians(longitude2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def create_trip(db: Session, user_id: int, start_location: str, destination: str):
    trip = Trip(
        user_id=user_id,
        start_location=start_location,
        destination=destination,
        status="draft",
        started_at=None,
        distance_km=0,
        duration_minutes=0,
        average_speed=0,
        safety_score=100,
        risk_level="SAFE",
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip


def start_trip(db: Session, user_id: int, trip_id: int):
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
        raise ValueError("Only draft trips can be started")

    activation = (
        db.query(TripSafetyActivation)
        .filter(
            TripSafetyActivation.trip_id == trip_id,
            TripSafetyActivation.user_id == user_id,
            TripSafetyActivation.status == "active",
        )
        .first()
    )

    if not activation:
        raise ValueError("Active safety activation is required before starting")

    if activation.expires_at and activation.expires_at <= datetime.utcnow():
        raise ValueError("Safety activation has expired")

    trip.status = "ongoing"
    trip.started_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)

    return trip


def update_trip_location(
    db: Session,
    trip_id: int,
    user_id: int,
    latitude: float,
    longitude: float,
):
    _validate_coordinates(latitude, longitude)

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

    if trip.status != "ongoing":
        raise ValueError("Trip is not ongoing")

    now = datetime.utcnow()

    previous_latitude = trip.current_latitude
    previous_longitude = trip.current_longitude
    distance_delta = 0.0

    if previous_latitude is not None and previous_longitude is not None:
        distance_delta = _haversine_distance(
            previous_latitude,
            previous_longitude,
            latitude,
            longitude,
        )

        if distance_delta < 0.005:
            distance_delta = 0.0

    trip.distance_km = (trip.distance_km or 0.0) + distance_delta
    trip.current_latitude = latitude
    trip.current_longitude = longitude

    if trip.started_at:
        duration_seconds = (now - trip.started_at).total_seconds()
        trip.duration_minutes = max(0, duration_seconds / 60)

    if trip.duration_minutes and trip.duration_minutes > 0:
        trip.average_speed = (
            trip.distance_km / trip.duration_minutes
        ) * 60
    else:
        trip.average_speed = 0

    tracking_log = TrackingLog(
        user_id=user_id,
        trip_id=trip.id,
        latitude=latitude,
        longitude=longitude,
        status="active",
        created_at=now,
    )

    db.add(tracking_log)

    result = calculate_safety_score(trip)
    trip.safety_score = result["score"]
    trip.risk_level = result["risk"]

    db.commit()
    db.refresh(trip)

    check_auto_emergency(db, trip)

    return trip


def end_trip(db: Session, trip_id: int, user_id: int):
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

    if trip.status != "ongoing":
        raise ValueError("Trip is not ongoing")

    trip.status = "completed"
    trip.ended_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)

    return trip


def get_user_trips(db: Session, user_id: int | None):
    query = db.query(Trip)

    if user_id is not None:
        query = query.filter(Trip.user_id == user_id)

    return query.order_by(Trip.id.desc()).all()
