from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import asyncio
import os
import shutil

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

# =========================
# UPLOAD DIRECTORY SAFE SETUP
# =========================
UPLOAD_DIR = "uploads/screenshots"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

    lat = payload.get("latitude")
    lon = payload.get("longitude")

    sos = EmergencyAlert(
        user_id=payload.get("user_id"),
        full_name=payload.get("full_name"),
        latitude=lat,
        longitude=lon,
        address=safe_address(lat, lon),
        message=payload.get("message", "🚨 Emergency Alert"),
        status="active",
        emergency_type=payload.get("emergency_type"),
        created_at=nigeria_time()
    )

    db.add(sos)
    db.commit()
    db.refresh(sos)

    alert = {
        "id": sos.id,
        "user_id": sos.user_id,
        "full_name": sos.full_name,
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "address": sos.address,
        "message": sos.message,
        "status": sos.status,
        "created_at": sos.created_at.isoformat()
    }

    for client in connected_clients[:]:
        try:
            asyncio.create_task(client.send_json(alert))
        except:
            connected_clients.remove(client)

    return {"success": True, "alert": alert}


# =========================
# SHARE LOCATION + SCREENSHOT (FIXED & SAFE)
# =========================
@router.post("/share-location")
async def share_location(
    user_id: int = Form(...),
    full_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(None),
    screenshot: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        file_path = None

        # Save screenshot if exists
        if screenshot:
            timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            filename = f"{user_id}_{timestamp}_{screenshot.filename}"
            file_path = os.path.join(UPLOAD_DIR, filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(screenshot.file, buffer)

        # fallback address
        final_address = address or safe_address(latitude, longitude)

        alert = EmergencyAlert(
            user_id=user_id,
            full_name=full_name,
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
User ID: {user_id}

Address: {final_address}

Lat: {latitude}
Lon: {longitude}

Screenshot: {file_path or "No screenshot"}
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
            "screenshot": f"/uploads/screenshots/{filename}",
            "address": final_address
        }

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Share location failed")


# =========================
# GET ALL ALERTS (FIXED SAFETY)
# =========================
@router.get("/all")
def get_all_emergencies(db: Session = Depends(get_db)):

    alerts = db.query(EmergencyAlert).order_by(EmergencyAlert.id.desc()).all()

    result = []

    for a in alerts:
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "full_name": a.full_name,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "address": a.address or safe_address(a.latitude, a.longitude),
            "message": a.message,
            "status": a.status,
            "emergency_type": a.emergency_type,
            "escalated_to": a.escalated_to,
            "escalated_at": a.escalated_at,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })

    return result


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

    db.commit()
    db.refresh(alert)

    return {"success": True, "id": alert.id, "status": alert.status}


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
def clear_all_emergencies(db: Session = Depends(get_db)):
    db.query(EmergencyAlert).delete()
    db.commit()
    return {"success": True}


# =========================
# STATS
# =========================
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):

    return {
        "users": db.query(User).count(),
        "alerts": db.query(EmergencyAlert).count(),
        "activeAlerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "active").count(),
        "resolvedAlerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "resolved").count(),
        "escalatedAlerts": db.query(EmergencyAlert).filter(EmergencyAlert.status == "escalated").count(),
        "wallet": 0
    }