from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def create_superadmin():
    db = SessionLocal()

    email = "superadmin@tsc.com"
    password = "2026@TSC"

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print("Superadmin already exists")
        return

    user = User(
        email=email,
        phone="08000000000",            # optional but now filled
        full_name="TSC System Admin",   # optional but now filled
        hashed_password=hash_password(password),
        role=UserRole.SUPERADMIN,       # correct enum usage
        is_active=True,
        is_verified=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print("✅ Superadmin created successfully")
    print("Email:", email)
    print("Password:", password)


if __name__ == "__main__":
    create_superadmin()