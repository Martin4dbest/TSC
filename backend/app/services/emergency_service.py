from sqlalchemy.orm import Session
from app.models.emergency import EmergencyAlert


# =========================
# CREATE EMERGENCY ALERT
# =========================
def create_emergency_alert(db: Session, user_id: int, description: str) -> EmergencyAlert:

    alert = EmergencyAlert(
        user_id=user_id,
        message=description,
        status="active"
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert


# =========================
# GET USER EMERGENCIES
# =========================
def get_user_emergencies(db: Session, user_id: int):

    return db.query(EmergencyAlert)\
        .filter(EmergencyAlert.user_id == user_id)\
        .order_by(EmergencyAlert.id.desc())\
        .all()


# =========================
# RESOLVE EMERGENCY
# =========================
def resolve_emergency(db: Session, emergency_id: int):

    alert = db.query(EmergencyAlert)\
        .filter(EmergencyAlert.id == emergency_id)\
        .first()

    if not alert:
        raise ValueError("Emergency not found")

    # OPTION 1 (SAFE): mark as resolved
    alert.status = "resolved"

    # OPTION 2 (NOT RECOMMENDED): delete record
    # db.delete(alert)

    db.commit()
    db.refresh(alert)

    return alert