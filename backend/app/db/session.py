# backend/app/db/session.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

# -------------------------
# DATABASE ENGINE
# -------------------------
engine = create_engine(
    settings.DATABASE_URL,

    # IMPORTANT FIXES
    pool_pre_ping=True,
    pool_recycle=300,

    # OPTIONAL OPTIMIZATION
    pool_size=10,
    max_overflow=20,

    echo=True,
    future=True
)

# -------------------------
# SESSION FACTORY
# -------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# -------------------------
# BASE MODEL
# -------------------------
Base = declarative_base()

# -------------------------
# DB DEPENDENCY
# -------------------------
def get_db():
    """
    FastAPI database dependency
    """

    db: Session = SessionLocal()

    try:
        yield db

    finally:
        db.close()