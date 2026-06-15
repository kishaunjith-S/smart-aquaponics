"""
Centralised configuration. Reads from .env via python-dotenv.

Never put secrets in this file — they live in .env (gitignored).
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root (one level above app/)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _required(key: str) -> str:
    """Fetch a required env var or raise immediately. Fail-fast > runtime surprises."""
    value = os.getenv(key)
    if not value:
        raise RuntimeError(
            f"Required environment variable {key!r} is missing. "
            f"Check {BASE_DIR / '.env'} against {BASE_DIR / '.env.example'}."
        )
    return value


class Settings:
    # Database
    DATABASE_URL: str = _required("DATABASE_URL")

    # Auth
    JWT_SECRET: str = _required("JWT_SECRET")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

    # Pi ingest
    INGEST_TOKEN: str = _required("INGEST_TOKEN")

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    # App
    APP_NAME: str = os.getenv("APP_NAME", "aquaponics-api")
    APP_ENV: str = os.getenv("APP_ENV", "development")

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


@lru_cache
def get_settings() -> Settings:
    """Cached settings — instantiate once per process."""
    return Settings()
