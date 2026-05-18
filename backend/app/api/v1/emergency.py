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

connected_clients: list[WebSocket] = []

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
        user = db.query(User).filter(
            User.id == user_id
        ).first()

        # Fallbacks
        phone = payload.get("phone") or (user.phone if user else "UNKNOWN")
        email = payload.get("email") or (user.email if user else None)
        full_name = payload.get("full_name") or (
            user.full_name if user else "Unknown User"
        )

        sos = EmergencyAlert(
            user_id=user_id,
            full_name=full_name,
            phone=phone,   # FIXED
            email=email,
            latitude=lat,
            longitude=lon,
            address=safe_address(lat, lon),
            message=payload.get(
                "message",
                "🚨 Emergency Alert"
            ),
            status="active",
            emergency_type=payload.get(
                "emergency_type"
            ),
            created_at=nigeria_time()
        )

        db.add(sos)
        db.commit()
        db.refresh(sos)

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
            "status": sos.status,
            "created_at": sos.created_at.isoformat()
        }

        for client in connected_clients[:]:
            try:
                asyncio.create_task(
                    client.send_json(alert)
                )
            except:
                connected_clients.remove(client)

        return {
            "success": True,
            "alert": alert
        }

    except Exception as e:
        db.rollback()
        print("🔥 SOS ERROR:", str(e))
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================
# SHARE LOCATION (NO SCREENSHOT)
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
    db: Session = Depends(get_db)
):
    try:
        final_address = address or safe_address(latitude, longitude)

        alert = EmergencyAlert(
            user_id=user_id,
            full_name=full_name,
            phone=phone,   # ✅ FIXED
            email=email,
            latitude=latitude,
            longitude=longitude,
            address=final_address,
            message="📍 Live location shared",
            status="active",
            created_at=nigeria_time()
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        admin_message = f"""
🚨 LOCATION SHARED

User: {full_name}
Phone: {phone or "N/A"}   # ✅ FIXED DISPLAY
Email: {email or "N/A"}
User ID: {user_id}

Address: {final_address}

Lat: {latitude}
Lon: {longitude}
"""

        try:
            send_email(admin_message)
            send_sms(admin_message)
            send_whatsapp(admin_message)
        except:
            pass

        live_alert = {
            "id": alert.id,
            "user_id": alert.user_id,
            "full_name": alert.full_name,
            "phone": alert.phone,   # ✅ FIXED
            "email": alert.email,
            "latitude": alert.latitude,
            "longitude": alert.longitude,
            "address": alert.address,
            "message": alert.message,
            "created_at": alert.created_at.isoformat()
        }

        for client in connected_clients[:]:
            try:
                asyncio.create_task(client.send_json(live_alert))
            except:
                connected_clients.remove(client)

        return {
            "success": True,
            "alert_id": alert.id,
            "address": final_address
        }

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Share location failed")


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

            # ✅ FIXED PHONE (no more UNKNOWN)
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