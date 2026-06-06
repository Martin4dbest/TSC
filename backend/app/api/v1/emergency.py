from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    Form
)

from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import asyncio
from enum import Enum

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.emergency import EmergencyAlert

from app.services.notifications import (
    send_email,
    send_sms,
    send_whatsapp
)

from app.services.geocoding import get_address

router = APIRouter()

connected_clients = []


# =========================
# TIME HELPERS
# =========================

def nigeria_time():
    return datetime.now(timezone.utc) + timedelta(hours=1)


def safe_address(lat, lon):
    if lat is None or lon is None:
        return "Unknown address"
    try:
        return get_address(lat, lon)
    except:
        return "Unknown address"


# =========================
# SAFETY ENGINE
# =========================

class SafetyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


def calculate_risk(payload: dict, user: User = None):
    score = 0

    message = (payload.get("message") or "").lower()
    emergency_type = (payload.get("emergency_type") or "").lower()

    if any(k in message for k in ["kill", "gun", "attack", "kidnap", "blood", "help"]):
        score += 40

    if any(k in emergency_type for k in ["accident", "fire", "robbery"]):
        score += 30

    if payload.get("latitude") and payload.get("longitude"):
        score += 10
    else:
        score += 10

    if user:
        score += 5

    if score >= 70:
        return SafetyLevel.CRITICAL, score
    elif score >= 50:
        return SafetyLevel.HIGH, score
    elif score >= 25:
        return SafetyLevel.MEDIUM, score
    else:
        return SafetyLevel.LOW, score


def should_escalate(alert: EmergencyAlert):
    if alert.status != "active":
        return False

    if not alert.created_at:
        return False

    elapsed = (datetime.now(timezone.utc) - alert.created_at).total_seconds()
    return elapsed > 300


# =========================
# SOS ALERT
# =========================

@router.post("/sos")
def trigger_sos(payload: dict, db: Session = Depends(get_db)):
    try:
        user_id = payload.get("user_id")
        lat = payload.get("latitude")
        lon = payload.get("longitude")

        user = db.query(User).filter(User.id == user_id).first()

        phone = payload.get("phone") or (user.phone if user else "UNKNOWN")
        email = payload.get("email") or (user.email if user else None)
        full_name = payload.get("full_name") or (user.full_name if user else "Unknown User")

        emergency_type = payload.get("emergency_type", "General Emergency")
        message = payload.get("message", "🚨 Emergency Alert")

        safety_level, risk_score = calculate_risk(payload, user)

        sos = EmergencyAlert(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            email=email,
            latitude=lat,
            longitude=lon,
            address=safe_address(lat, lon),
            message=message,
            status="active",
            emergency_type=emergency_type,
            created_at=nigeria_time(),

            # IMPORTANT FIELDS (must exist in DB model)
            risk_score=risk_score,
            safety_level=safety_level.value
        )

        db.add(sos)
        db.commit()
        db.refresh(sos)

        admin_message = f"""
🚨 CRITICAL EMERGENCY ALERT

Type: {emergency_type}
User: {full_name}
Phone: {phone}
Email: {email}
User ID: {user_id}

Message: {message}

Location: {sos.address}
Lat: {lat}
Lon: {lon}

Risk Score: {risk_score}
Safety Level: {safety_level.value}
"""

        try:
            if safety_level == SafetyLevel.CRITICAL:
                send_email(admin_message)
                send_sms(admin_message)
                send_whatsapp(admin_message)

            elif safety_level == SafetyLevel.HIGH:
                send_email(admin_message)
                send_whatsapp(admin_message)

            else:
                send_email(admin_message)

        except Exception as e:
            print("NOTIFICATION ERROR:", e)

        alert = {
            "id": sos.id,
            "user_id": sos.user_id,
            "full_name": sos.full_name,
            "phone": sos.phone,
            "email": sos.email,
            "latitude": sos.latitude,
            "longitude": sos.longitude,
            "address": sos.address,
            "message": sos.message,
            "emergency_type": sos.emergency_type,
            "status": sos.status,
            "created_at": sos.created_at.isoformat(),

            "risk_score": risk_score,
            "safety_level": safety_level.value
        }

        for client in connected_clients[:]:
            try:
                asyncio.create_task(client.send_json(alert))
            except:
                connected_clients.remove(client)

        return {"success": True, "alert": alert}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# SHARE LOCATION
# =========================

@router.post("/share-location")
async def share_location(
    user_id: int = Form(...),
    full_name: str = Form(...),
    phone: str = Form(""),
    email: str = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(None),
    emergency_message: str = Form(""),
    db: Session = Depends(get_db)
):
    try:
        final_address = address or safe_address(latitude, longitude)

        alert = EmergencyAlert(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            email=email,
            latitude=latitude,
            longitude=longitude,
            address=final_address,
            message=emergency_message or "📍 Live location shared",
            status="active",
            created_at=nigeria_time()
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        for client in connected_clients[:]:
            try:
                asyncio.create_task(client.send_json({
                    "id": alert.id,
                    "user_id": alert.user_id,
                    "full_name": alert.full_name,
                    "phone": alert.phone,
                    "email": alert.email,
                    "latitude": alert.latitude,
                    "longitude": alert.longitude,
                    "address": alert.address,
                    "message": alert.message,
                    "created_at": alert.created_at.isoformat()
                }))
            except:
                connected_clients.remove(client)

        return {"success": True, "alert_id": alert.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# WEBSOCKET
# =========================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


# =========================
# GET ALL ALERTS
# =========================

@router.get("/all")
def get_all_emergencies(db: Session = Depends(get_db)):
    alerts = db.query(EmergencyAlert).order_by(EmergencyAlert.id.desc()).all()

    return [
        {
            "id": a.id,
            "user_id": a.user_id,
            "full_name": a.full_name,
            "phone": a.phone,
            "email": a.email,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "address": a.address,
            "message": a.message,
            "status": a.status,
            "emergency_type": a.emergency_type,

            # FIXED ADMIN FIELDS
            "risk_score": getattr(a, "risk_score", 0),
            "safety_level": getattr(a, "safety_level", "LOW"),

            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ]


# =========================
# UPDATE ALERT
# =========================

@router.patch("/{alert_id}")
def update_alert(alert_id: int, payload: dict, db: Session = Depends(get_db)):
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if "status" in payload:
        alert.status = payload["status"]

    if "escalated_to" in payload:
        alert.escalated_to = payload["escalated_to"]

    db.commit()
    db.refresh(alert)

    return {"success": True, "id": alert.id, "status": alert.status}


# =========================
# CLEAR
# =========================

@router.delete("/clear")
def clear_all(db: Session = Depends(get_db)):
    db.query(EmergencyAlert).delete()
    db.commit()
    return {"success": True}


# =========================
# STATS
# =========================

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "users": db.query(User).filter(User.role == UserRole.USER).count(),
        "alerts": db.query(EmergencyAlert).count(),
        "activeAlerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "active").count(),
        "resolvedAlerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "resolved").count(),
        "escalatedAlerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "escalated").count(),
    }