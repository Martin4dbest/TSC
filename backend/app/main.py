from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import os

from app.api.v1 import auth, users, wallet, admin, tracking, emergency

# ✅ IMPORTANT: explicit model imports (prevents SQLAlchemy mapper crash)
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.tracking import TrackingLog
from app.models.emergency import EmergencyAlert

from app.db.base_class import Base
from app.db.session import engine


# =====================================
# FASTAPI APP (KEEP STANDARD NAME)
# =====================================
app = FastAPI(title="TSC API")


# =====================================
# CREATE UPLOAD FOLDERS
# =====================================
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/screenshots", exist_ok=True)


# =====================================
# CREATE DATABASE TABLES
# =====================================
Base.metadata.create_all(bind=engine)


# =====================================
# STATIC FILES
# =====================================
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# =====================================
# CORS
# =====================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================
# ROUTES
# =====================================
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["Wallet"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(tracking.router, prefix="/api/v1/tracking", tags=["Tracking"])
app.include_router(emergency.router, prefix="/api/v1/emergency", tags=["Emergency"])


# =====================================
# HEALTH CHECK
# =====================================
@app.get("/")
def root():
    return {"message": "TSC Backend Running"}