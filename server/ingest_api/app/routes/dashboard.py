"""
Dashboard read endpoints — consumed by the Next.js frontend.

  GET /api/latest?device_id=...
    Most recent raw reading (from `readings` table) with WQI scores
    computed on the fly.

  GET /api/history?device_id=...&limit=200
    Last N minute-bucket rollups (from `readings_1min`) with WQI computed
    from the per-minute averages. Default 200 buckets, max 1000.

WQI is calculated at read time, not stored. This lets us retune the
THRESHOLDS in wqi.py without a schema migration.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Reading, Reading1Min
from app.schemas import (
    HistoryResponse,
    IndividualScores,
    LatestResponse,
    RawValues,
    WQIRecord,
)
from app.wqi import compute_wqi


router = APIRouter(prefix="/api", tags=["dashboard"])


def _build_record(
    *,
    timestamp: str,
    device_id: str,
    ph: Optional[float],
    ec: Optional[float],
    ntu: Optional[float],
    wt: Optional[float],
    do_val: Optional[float],
) -> WQIRecord:
    """Build one WQIRecord from raw values, computing WQI internally."""
    result = compute_wqi(ph=ph, wt=wt, ec=ec, ntu=ntu, do=do_val)

    return WQIRecord(
        timestamp=timestamp,
        device_id=device_id,
        raw_values=RawValues(
            pH=ph,
            temp=wt,
            DO=do_val,
            conductivity=ec,
            turbidity=ntu,
        ),
        individual_scores=IndividualScores(**result.individual),
        overall_wqi=result.overall,
        status=result.status,
    )


@router.get(
    "/latest",
    response_model=LatestResponse,
    summary="Get the most recent reading with WQI scores",
)
def get_latest(
    device_id: Optional[str] = Query(
        None,
        description="Filter to one device. If omitted, returns latest across ALL devices.",
    ),
    db: Session = Depends(get_db),
) -> LatestResponse:
    """Return the most recent raw reading, with WQI scores."""
    stmt = select(Reading).order_by(Reading.ts.desc()).limit(1)
    if device_id:
        stmt = (
            select(Reading)
            .where(Reading.device_id == device_id)
            .order_by(Reading.ts.desc())
            .limit(1)
        )

    row = db.execute(stmt).scalar_one_or_none()

    if row is None:
        return LatestResponse(success=True, record=None)

    return LatestResponse(
        success=True,
        record=_build_record(
            timestamp=row.ts.isoformat(),
            device_id=row.device_id,
            ph=row.ph,
            ec=row.ec,
            ntu=row.ntu,
            wt=row.wt,
            do_val=row.do_val,
        ),
    )


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get the last N minute-bucket rollups with WQI scores",
)
def get_history(
    device_id: Optional[str] = Query(None, description="Filter to one device."),
    limit: int = Query(
        200,
        ge=1,
        le=1000,
        description="Number of minute-bucket rollups to return (most recent first).",
    ),
    db: Session = Depends(get_db),
) -> HistoryResponse:
    """Return the last N 1-minute rollups, with WQI computed from averages."""
    stmt = select(Reading1Min).order_by(Reading1Min.bucket.desc()).limit(limit)
    if device_id:
        stmt = (
            select(Reading1Min)
            .where(Reading1Min.device_id == device_id)
            .order_by(Reading1Min.bucket.desc())
            .limit(limit)
        )

    rows = db.execute(stmt).scalars().all()

    records = [
        _build_record(
            timestamp=row.bucket.isoformat(),
            device_id=row.device_id,
            ph=row.ph_avg,
            ec=row.ec_avg,
            ntu=row.ntu_avg,
            wt=row.wt_avg,
            do_val=row.do_avg,
        )
        for row in rows
    ]

    return HistoryResponse(records=records, total=len(records))
