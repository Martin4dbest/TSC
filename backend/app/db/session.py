from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# -------------------------
# LOAD ENV FILE
# -------------------------
load_dotenv()

# -------------------------
# DATABASE URL (SAFE CHECK)
# -------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Please set it in your environment or .env file."
    )

# -------------------------
# ENGINE
# -------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# -------------------------
# FORCE PUBLIC SCHEMA (NEON FIX)
# -------------------------
@event.listens_for(engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO public")
    cursor.close()

# -------------------------
# SESSION
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
# DEPENDENCY
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()