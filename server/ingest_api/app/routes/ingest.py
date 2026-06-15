"""
POST /v1/ingest — Pi uploads sensor reading batches.

Authentication: bearer token (INGEST_TOKEN from .env).
Idempotency: ON CONFLICT (device_id, ts) DO NOTHING — duplicate batches are safe.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import Reading
from app.schemas import IngestRequest, IngestResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["ingest"])


def verify_ingest_token(authorization: str = Header(default="")) -> None:
    """Verify the Authorization: Bearer <INGEST_TOKEN> header."""
    expected = get_settings().INGEST_TOKEN
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing ingest token",
            headers={"WWW-Authenticate": "Bearer"},
        )


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
