# app/services/user_service.py
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password


# -------------------------------
# Create User
# -------------------------------
def create_user(db: Session, email: str, phone: str, password: str, full_name: str):
    existing = db.query(User).filter(
        (User.email == email) | (User.phone == phone)
    ).first()

    if existing:
        raise Exception("User already exists")

    user = User(
        email=email,
        phone=phone,
        full_name=full_name,
        hashed_password=hash_password(password),
        is_active=True,
        is_admin=False
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# -------------------------------
# Get User by ID
# -------------------------------
def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


# -------------------------------
# Update User
# -------------------------------
def update_user(db: Session, user_id: int, **kwargs):
    user = get_user_by_id(db, user_id)

    if not user:
        raise Exception("User not found")

    if "email" in kwargs and kwargs["email"]:
        user.email = kwargs["email"]

    if "phone" in kwargs and kwargs["phone"]:
        user.phone = kwargs["phone"]

    if "full_name" in kwargs and kwargs["full_name"]:
        user.full_name = kwargs["full_name"]

    if "password" in kwargs and kwargs["password"]:
        user.hashed_password = hash_password(kwargs["password"])

    db.commit()
    db.refresh(user)
    return user


# -------------------------------
# Delete User
# -------------------------------
def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)

    if not user:
        raise Exception("User not found")

    db.delete(user)
    db.commit()