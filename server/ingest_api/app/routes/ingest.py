"""
POST /v1/ingest — Pi uploads sensor reading batches.

Authentication: bearer token (INGEST_TOKEN from .env).
Idempotency: ON CONFLICT (device_id, ts) DO NOTHING — duplicate batches are safe.
"""
from __future__ import annotations

import logging

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.auth import hash_api_key
from app.config import get_settings
from app.db import get_db
from app.models import ApiKey, Reading
from app.schemas import IngestRequest, IngestResponse


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["ingest"])


def verify_ingest_token(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> None:
    """
    Verify the Authorization header. Accepts either:
      1. Bearer <INGEST_TOKEN>  — the shared bootstrap token (legacy)
      2. Bearer <api_key>       — a user-issued API key from /api-keys

    On API key match, updates last_used_at for usage tracking.
    """
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Path 1: shared INGEST_TOKEN — fast string compare
    if token == get_settings().INGEST_TOKEN:
        return

    # Path 2: API key lookup by SHA-256 hash
    key_hash = hash_api_key(token)
    api_key = db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_active.is_(True),
        )
    ).scalar_one_or_none()

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last_used_at (fire-and-forget — failure here shouldn't reject the ingest)
    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()

@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_ingest_token)],
    summary="Receive a batch of sensor readings from a Pi",
)
def ingest_readings(
    payload: IngestRequest,
    db: Session = Depends(get_db),
) -> IngestResponse:
    """
    Accept a batch of readings from one device.

    Idempotency: rows with a (device_id, ts) already in the DB are silently
    skipped via ON CONFLICT — the Pi can safely retry batches after network
    glitches without creating duplicates.

    Validation: invalid sensor ranges (e.g., pH < 0 or > 14) are rejected at
    the Pydantic layer before this function runs.
    """
    if not payload.readings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty readings list",
        )

    rows = [
        {
            "device_id": payload.device_id,
            "ts":        r.ts,
            "ph":        r.ph,
            "ec":        r.ec,
            "ntu":       r.ntu,
            "wt":        r.wt,
            "do_val":    r.do_val,
        }
        for r in payload.readings
    ]

    stmt = pg_insert(Reading).values(rows)
    stmt = stmt.on_conflict_do_nothing(index_elements=["device_id", "ts"])

    result = db.execute(stmt)
    db.commit()

    received = len(rows)
    inserted = result.rowcount or 0
    skipped  = received - max(inserted, 0)

    logger.info(
        "ingest device_id=%s received=%d inserted=%d skipped=%d",
        payload.device_id, received, inserted, skipped,
    )

    return IngestResponse(
        received=received,
        inserted=inserted,
        skipped=skipped,
    )
