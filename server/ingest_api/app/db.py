"""
SQLAlchemy engine and session factory.

We use SQLAlchemy 2.0 style: explicit sessions, no implicit globals.
The `get_db` dependency below is the FastAPI-idiomatic way to provide
a per-request DB session that's properly closed afterward.
"""
from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

_settings = get_settings()

engine = create_engine(
    _settings.DATABASE_URL,
    pool_size=5,          # 5 persistent connections — plenty for one Pi
    max_overflow=5,       # bursts up to 10 if needed
    pool_pre_ping=True,   # detect dead connections after RDS reboots
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
