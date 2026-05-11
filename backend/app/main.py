from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, users, wallet, admin, tracking, emergency

# 🔥 IMPORT MODELS (forces registration)
import app.models

# 🔥 IMPORT DB ENGINE + BASE
from app.db.base_class import Base
from app.db.session import engine

app = FastAPI(title="TSC API")

# -------------------------
# CREATE TABLES (CRITICAL FIX)
# -------------------------
Base.metadata.create_all(bind=engine)

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# HEALTH CHECK
# -------------------------
@app.get("/")
def root():
    return {"message": "TSC Backend Running"}

# -------------------------
# FAVICON
# -------------------------
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return FileResponse("favicon.ico")

# -------------------------
# ROUTES
# -------------------------
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["Wallet"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(tracking.router, prefix="/api/v1/tracking", tags=["Tracking"])
app.include_router(emergency.router, prefix="/api/v1/emergency", tags=["Emergency"])