from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.services.emergency_service import create_emergency_alert

# =========================
# AUTO EMERGENCY TRIGGER
# =========================
def check_auto_emergency(db: Session, trip: Trip):
    
    score = trip.safety_score or 100
    risk = trip.risk_level

    # 🚨 CRITICAL CONDITION
    if score <= 30 or risk == "CRITICAL":
        return create_emergency_alert(
            db=db,
            user_id=trip.user_id,
            description="CRITICAL ALERT: Immediate assistance required (Auto Triggered)"
        )

    # ⚠️ HIGH RISK CONDITION
    if score <= 50 or risk == "HIGH":
        return create_emergency_alert(
            db=db,
            user_id=trip.user_id,
            description="HIGH RISK detected during trip (Auto Triggered)"
        )

    return None