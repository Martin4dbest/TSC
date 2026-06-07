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
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.emergency import EmergencyAlert
from app.models.emergency import EmergencyFeedback

from app.services.notifications import (
    send_email,
    send_sms,
    send_whatsapp
)

from app.services.geocoding import get_address

router = APIRouter()

connected_clients: list[WebSocket] = []

# =========================
# SCHEMAS (DATA VALIDATION)
# =========================
class FeedbackRequest(BaseModel):
    emergency_id: int | None = None
    user_id: int
    full_name: str
    outcome: str
    feedback: str


# =========================
# HELPERS
# =========================
def safe_address(lat, lon):
    if lat is None or lon is None:
        return "Unknown address"
    try:
        return get_address(lat, lon)
    except:
        return "Unknown address"


def nigeria_time():
    return datetime.now(timezone.utc) + timedelta(hours=1)


# =========================
# SOS ALERT
# =========================
@router.post("/sos")
def trigger_sos(payload: dict, db: Session = Depends(get_db)):
    try:
        print("SOS PAYLOAD:", payload)

        user_id = payload.get("user_id")
        lat = payload.get("latitude")
        lon = payload.get("longitude")

        # Get user from DB
        user = db.query(User).filter(User.id == user_id).first()

        # Fallbacks
        phone = payload.get("phone") or (user.phone if user else "UNKNOWN")
        email = payload.get("email") or (user.email if user else None)
        full_name = payload.get("full_name") or (user.full_name if user else "Unknown User")

        emergency_type = payload.get("emergency_type", "General Emergency")
        message = payload.get("message", "🚨 Emergency Alert")

        # Save emergency
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
            created_at=nigeria_time()
        )

        db.add(sos)
        db.commit()
        db.refresh(sos)

        # =========================
        # ADMIN MESSAGE (FULL DETAILS)
        # =========================
        admin_message = f"""
🚨 CRITICAL EMERGENCY ALERT

Emergency Unit:
{emergency_type}

User:
{full_name}

Phone:
{phone or "N/A"}

Email:
{email or "N/A"}

User ID:
{user_id}

Emergency Message:
{message}

Location:
{sos.address}

Latitude:
{lat}

Longitude:
{lon}
"""

        # Send notifications
        try:
            send_email(admin_message)
            send_sms(admin_message)
            send_whatsapp(admin_message)
        except Exception as notify_error:
            print("NOTIFICATION ERROR:", notify_error)

        # =========================
        # RESPONSE ALERT
        # =========================
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
            "created_at": sos.created_at.isoformat()
        }

        # WebSocket push
        for client in connected_clients[:]:
            try:
                asyncio.create_task(client.send_json(alert))
            except:
                connected_clients.remove(client)

        return {
            "success": True,
            "alert": alert
        }

    except Exception as e:
        db.rollback()
        print("🔥 SOS ERROR:", str(e))
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
        final_address = address or safe_address(
            latitude,
            longitude
        )

        alert = EmergencyAlert(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            email=email,
            latitude=latitude,
            longitude=longitude,
            address=final_address,
            message=(
                emergency_message
                or "📍 Live location shared"
            ),
            status="active",
            created_at=nigeria_time()
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        admin_message = f"""
🚨 EMERGENCY ALERT

User: {full_name}
Phone: {phone or "N/A"}
Email: {email or "N/A"}
User ID: {user_id}

Address: {final_address}

Latitude: {latitude}
Longitude: {longitude}

Emergency Message:
{emergency_message or "No message provided"}
"""

        try:
            send_email(admin_message)
            send_sms(admin_message)
            send_whatsapp(admin_message)
        except Exception as notify_error:
            print(
                "NOTIFICATION ERROR:",
                notify_error
            )

        live_alert = {
            "id": alert.id,
            "user_id": alert.user_id,
            "full_name": alert.full_name,
            "phone": alert.phone,
            "email": alert.email,
            "latitude": alert.latitude,
            "longitude": alert.longitude,
            "address": alert.address,
            "message": alert.message,
            "created_at": (
                alert.created_at.isoformat()
            ),
        }

        # =========================
        # WEBSOCKET PUSH
        # =========================
        for client in connected_clients[:]:
            try:
                asyncio.create_task(
                    client.send_json(
                        live_alert
                    )
                )
            except:
                connected_clients.remove(
                    client
                )

        return {
            "success": True,
            "alert_id": alert.id,
            "address": final_address,
            "message": alert.message,
        }

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Share location failed"
        )


# =========================
# GET ALL ALERTS
# =========================
@router.get("/all")
def get_all_emergencies(db: Session = Depends(get_db)):
    alerts = db.query(EmergencyAlert).order_by(
        EmergencyAlert.id.desc()
    ).all()

    result = []
    for a in alerts:
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "full_name": a.full_name,
            "phone": (
                a.phone
                if a.phone and a.phone != "UNKNOWN"
                else (a.user.phone if a.user and a.user.phone else None)
            ),
            "email": a.email,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "address": a.address or safe_address(
                a.latitude,
                a.longitude
            ),
            "message": a.message,
            "status": a.status,
            "emergency_type": a.emergency_type,
            "escalated_to": a.escalated_to,
            "escalated_at": a.escalated_at,
            "created_at": (
                a.created_at.isoformat()
                if a.created_at
                else None
            )
        })

    return result


# =========================
# UPDATE ALERT
# =========================
@router.patch("/{alert_id}")
def update_alert(
    alert_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    alert = db.query(EmergencyAlert).filter(
        EmergencyAlert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    if "status" in payload:
        alert.status = payload["status"]

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "id": alert.id,
        "status": alert.status
    }


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
# CLEAR ALERTS
# =========================
@router.delete("/clear")
def clear_all_emergencies(
    db: Session = Depends(get_db)
):
    db.query(EmergencyAlert).delete()
    db.commit()
    return {"success": True}


# =========================
# STATS
# =========================
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return {
        "users": db.query(User).filter(
            User.role == UserRole.USER
        ).count(),
        "alerts": db.query(EmergencyAlert).count(),
        "activeAlerts": db.query(
            EmergencyAlert
        ).filter(
            EmergencyAlert.status == "active"
        ).count(),
        "resolvedAlerts": db.query(
            EmergencyAlert
        ).filter(
            EmergencyAlert.status == "resolved"
        ).count(),
        "escalatedAlerts": db.query(
            EmergencyAlert
        ).filter(
            EmergencyAlert.status == "escalated"
        ).count(),
        "wallet": 0
    }


# =========================
# EMERGENCY FEEDBACK
# =========================
@router.post("/feedback")
def submit_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    try:
        # ✅ SAFE emergency_id handling
        emergency_id = payload.emergency_id

        if emergency_id is not None:
            emergency = db.query(EmergencyAlert).filter(
                EmergencyAlert.id == emergency_id
            ).first()

            if not emergency:
                emergency_id = None  # 🔥 IMPORTANT SAFE FALLBACK

        feedback = EmergencyFeedback(
            emergency_id=emergency_id,  # SAFE NOW
            user_id=payload.user_id,
            full_name=payload.full_name,
            outcome=payload.outcome,
            feedback=payload.feedback,
        )

        db.add(feedback)
        db.commit()
        db.refresh(feedback)

        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "id": feedback.id
        }

    except Exception as e:
        db.rollback()
        print("FEEDBACK ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))