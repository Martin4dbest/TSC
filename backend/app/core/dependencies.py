from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.core.config import settings
from jose import jwt, JWTError


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# -------------------------
# CURRENT USER
# -------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

    except JWTError as e:
        # 🔥 THIS SHOWS REAL ERROR INSTEAD OF HIDING IT
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token error: {str(e)}"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


# -------------------------
# ADMIN CHECK
# -------------------------
def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# -------------------------
# SUPERADMIN ONLY
# -------------------------
def require_superadmin(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )

    return current_user


# -------------------------
# DB SESSION (OPTIONAL FIX)
# -------------------------
def get_db_session():
    db = get_db()
    try:
        yield db
    finally:
        db.close()