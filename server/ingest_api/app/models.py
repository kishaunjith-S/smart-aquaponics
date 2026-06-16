"""
SQLAlchemy ORM models matching the RDS schema (see server/migrations/).

Naming follows the column names in PostgreSQL exactly so .from_orm() and
.model_dump() round-trips don't need field aliasing.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db import Base


class Reading(Base):
    """Raw 5-second sensor reading. Mirrors the `readings` table."""
    __tablename__ = "readings"
    __table_args__ = (
        UniqueConstraint("device_id", "ts", name="readings_device_id_ts_key"),
    )

    id:          Mapped[int]      = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    device_id:   Mapped[str]      = mapped_column(String, nullable=False, index=True)
    ts:          Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ph:          Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ec:          Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntu:         Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wt:          Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    do_val:      Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )


class Reading1Min(Base):
    """1-minute rollup. Mirrors the `readings_1min` table.

    Populated automatically by pg_cron — the API only reads from this.
    """
    __tablename__ = "readings_1min"

    device_id:  Mapped[str]      = mapped_column(String, primary_key=True)
    bucket:     Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)

    # pH
    ph_avg:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ph_min:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ph_max:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ph_count: Mapped[int]             = mapped_column(Integer, nullable=False)

    # EC
    ec_avg:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ec_min:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ec_max:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ec_count: Mapped[int]             = mapped_column(Integer, nullable=False)

    # Turbidity
    ntu_avg:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntu_min:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntu_max:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ntu_count: Mapped[int]             = mapped_column(Integer, nullable=False)

    # Water temperature
    wt_avg:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wt_min:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wt_max:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wt_count: Mapped[int]             = mapped_column(Integer, nullable=False)

    # Dissolved Oxygen (placeholder — no probe yet)
    do_avg:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    do_min:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    do_max:   Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    do_count: Mapped[int]             = mapped_column(Integer, nullable=False)


# ─── Auth ───────────────────────────────────────────────────────────────────

from uuid import UUID, uuid4
from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class User(Base):
    __tablename__ = "users"

    id:            Mapped[UUID]     = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    full_name:     Mapped[str]      = mapped_column(Text, nullable=False)
    email:         Mapped[str]      = mapped_column(Text, unique=True, nullable=False, index=True)
    password_hash: Mapped[str]      = mapped_column(Text, nullable=False)
    is_admin:      Mapped[bool]     = mapped_column(Boolean, nullable=False, default=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ApiKey(Base):
    __tablename__ = "api_keys"

    id:           Mapped[UUID]     = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id:      Mapped[UUID]     = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name:         Mapped[str]      = mapped_column(Text, nullable=False)
    key_hash:     Mapped[str]      = mapped_column(Text, nullable=False, unique=True)
    key_prefix:   Mapped[str]      = mapped_column(Text, nullable=False)
    is_active:    Mapped[bool]     = mapped_column(Boolean, nullable=False, default=True)
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
