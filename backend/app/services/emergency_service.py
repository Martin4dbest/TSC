from sqlalchemy.orm import Session
from app.models.emergency import Emergency

def create_emergency_alert(db: Session, user_id: int, description: str) -> Emergency:
    alert = Emergency(user_id=user_id, description=description)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

def get_user_emergencies(db: Session, user_id: int):
    return db.query(Emergency).filter(Emergency.user_id == user_id).all()

def resolve_emergency(db: Session, emergency_id: int):
    # Example: mark emergency as resolved by deleting or flagging
    alert = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not alert:
        raise ValueError("Emergency not found")
    # Here we simply delete it (or you can add a 'resolved' column instead)
    db.delete(alert)
    db.commit()
    return alert