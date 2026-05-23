from fastapi import APIRouter
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

router = APIRouter()


@router.get("/seed/superadmin")
def seed_superadmin():
    db = SessionLocal()

    try:
        email = "tscsuper2@gmail.com"
        password = "2026@TSC"

        # check if already exists
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            return {
                "message": "⚠️ Superadmin already exists",
                "email": existing.email,
                "role": existing.role.value  # FIXED HERE TOO
            }

        # create superadmin
        superadmin = User(
            email=email,
            phone="09045531092",
            full_name="TSC System Admin",
            hashed_password=hash_password(password),
            role=UserRole.SUPERADMIN,
            is_active=True,
            is_verified=True,
        )

        db.add(superadmin)
        db.commit()
        db.refresh(superadmin)

        return {
            "message": "✅ Superadmin created successfully",
            "email": email,
            "password": password,
            "role": superadmin.role.value  # ✅ FIXED (important)
        }

    except Exception as e:
        db.rollback()
        return {
            "message": "❌ Error creating superadmin",
            "error": str(e)
        }

    finally:
        db.close()