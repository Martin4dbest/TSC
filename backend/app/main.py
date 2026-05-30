from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import os

from app.api.v1 import auth, users, wallet, admin, tracking, emergency, seed

# models (KEEP ONLY ONE SOURCE OF TRIP)
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.tracking import TrackingLog
from app.models.emergency import EmergencyAlert
from app.models.trip import Trip

from app.db.base_class import Base
from app.db.session import engine


app = FastAPI(title="TSC API")


os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/screenshots", exist_ok=True)


Base.metadata.create_all(bind=engine)


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["Wallet"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(tracking.router, prefix="/api/v1/tracking", tags=["Tracking"])
app.include_router(emergency.router, prefix="/api/v1/emergency", tags=["Emergency"])
app.include_router(seed.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "TSC Backend Running"}