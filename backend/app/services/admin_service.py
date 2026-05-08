from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.core.security import hash_password


# -------------------------------
# CREATE ADMIN
# -------------------------------
def create_admin_user(db: Session, email: str, phone: str, password: str, full_name: str) -> User:

    existing = db.query(User).filter(
        (User.email == email) | (User.phone == phone)
    ).first()

    if existing:
        raise Exception("User with this email or phone already exists")

    admin_user = User(
        email=email,
        phone=phone,
        full_name=full_name,
        hashed_password=hash_password(password),

        # ✅ FIX: use role instead of is_admin
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user


# -------------------------------
# GET ADMIN BY ID
# -------------------------------
def get_admin_by_id(db: Session, admin_id: int) -> User | None:
    return db.query(User).filter(
        User.id == admin_id,
        User.role == UserRole.ADMIN
    ).first()


# -------------------------------
# GET ALL ADMINS
# -------------------------------
def get_all_admins(db: Session):
    return db.query(User).filter(
        User.role == UserRole.ADMIN
    ).all()


# -------------------------------
# UPDATE ADMIN
# -------------------------------
def update_admin_user(db: Session, admin_id: int, **kwargs) -> User:

    admin = get_admin_by_id(db, admin_id)

    if not admin:
        raise Exception("Admin not found")

    if kwargs.get("full_name"):
        admin.full_name = kwargs["full_name"]

    if kwargs.get("email"):
        admin.email = kwargs["email"]

    if kwargs.get("phone"):
        admin.phone = kwargs["phone"]

    if kwargs.get("password"):
        admin.hashed_password = hash_password(kwargs["password"])

    db.commit()
    db.refresh(admin)
    return admin


# -------------------------------
# DELETE ADMIN
# -------------------------------
def delete_admin_user(db: Session, admin_id: int):

    admin = get_admin_by_id(db, admin_id)

    if not admin:
        raise Exception("Admin not found")

    db.delete(admin)
    db.commit()