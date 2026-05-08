from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from app.api.v1 import auth, users, wallet, admin, tracking, emergency

app = FastAPI(title="TSC API")

# -------------------------
# CORS FIX (IMPORTANT)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # ⚠️ keep for dev only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "TSC Backend Running"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return FileResponse("favicon.ico")

# Register all routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["Wallet"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(tracking.router, prefix="/api/v1/tracking", tags=["Tracking"])
app.include_router(emergency.router, prefix="/api/v1/emergency", tags=["Emergency"])