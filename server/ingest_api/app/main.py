"""
FastAPI app: Aquaponics monitoring API.

Run locally with:
    uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload

In production, fronted by nginx and run under systemd via gunicorn:
    gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 127.0.0.1:5001
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.schemas import HealthResponse
from app.routes import auth, dashboard, ingest

_settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown (close DB pool etc. — SQLAlchemy handles automatically)


app = FastAPI(
    title="Aquaponics Monitoring API",
    description="Backend API for the smart aquaponics monitoring system.",
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.CORS_ORIGINS or ["*"] if _settings.is_development else _settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(ingest.router)
app.include_router(dashboard.router)

# ─── /health ─────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health(db: Session = Depends(get_db)) -> HealthResponse:
    """
    Liveness + DB connectivity check.

    Returns HTTP 200 only if the API process is alive AND it can reach the DB.
    Use this for load balancer health checks and uptime monitors.
    """
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unreachable: {type(e).__name__}",
        ) from e

    return HealthResponse(
        status="ok",
        db=db_status,
        app=_settings.APP_NAME,
        env=_settings.APP_ENV,
    )


# ─── Root ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "name": _settings.APP_NAME,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
