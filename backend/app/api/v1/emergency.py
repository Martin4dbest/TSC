from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio

from app.db.session import get_db
from app.models.emergency import EmergencyAlert

router = APIRouter()

# =========================
# ACTIVE WEBSOCKETS
# =========================
connected_clients: list[WebSocket] = []


# =========================
# SOS CREATE ALERT
# =========================
@router.post("/sos")
def trigger_sos(payload: dict, db: Session = Depends(get_db)):

    sos = EmergencyAlert(
        user_id=payload.get("user_id"),
        full_name=payload.get("full_name"),
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
        message=payload.get("message", "🚨 Emergency Alert"),
        status="active",
        created_at=datetime.utcnow()
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
        "message": sos.message,
        "status": sos.status,
        "created_at": sos.created_at.isoformat()
    }

    # =========================
    # SAFE WEBSOCKET BROADCAST
    # =========================
    for client in connected_clients[:]:
        try:
            asyncio.create_task(client.send_json(alert))
        except:
            connected_clients.remove(client)

    return {
        "success": True,
        "message": "SOS sent successfully",
        "alert": alert
    }


# =========================
# GET ALL ALERTS
# =========================
@router.get("/all")
def get_all_emergencies(db: Session = Depends(get_db)):

    alerts = db.query(EmergencyAlert)\
        .order_by(EmergencyAlert.id.desc())\
        .all()

    return [
        {
            "id": a.id,
            "user_id": a.user_id,
            "full_name": a.full_name,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "message": a.message,
            "status": a.status,
            "created_at": a.created_at
        }
        for a in alerts
    ]


# =========================
# SINGLE UNIFIED UPDATE ENDPOINT
# (dispatch / resolve / escalate)
# =========================
@router.patch("/{alert_id}")
def update_alert(alert_id: int, payload: dict, db: Session = Depends(get_db)):

    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    allowed_status = ["active", "dispatched", "resolved", "escalated"]

    if "status" in payload:
        if payload["status"] not in allowed_status:
            raise HTTPException(status_code=400, detail="Invalid status")

        alert.status = payload["status"]

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Alert updated",
        "id": alert.id,
        "status": alert.status
    }


# =========================
# WEBSOCKET LIVE FEED
# =========================
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)