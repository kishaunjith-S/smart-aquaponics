"""
Authentication primitives: password hashing, JWT, API key generation.

We use:
- bcrypt (via passlib) for password and API-key hashing — well-tested,
  intentionally slow to thwart brute force
- HS256 JWT (via python-jose) for session tokens

The hashed-vs-plaintext distinction matters: passwords + API keys are
ALWAYS stored as bcrypt hashes. The plaintext API key is shown to the
user ONCE at creation, never recoverable from the DB.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import User


_settings = get_settings()
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Password hashing ───────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd_context.verify(plain, hashed)
    except Exception:
        return False
# ─── API key generation + hashing ───────────────────────────────────────────
# We use SHA-256 (not bcrypt) for API keys because:
#  1) The plaintext key is already 32+ random bytes — no brute-force advantage
#     from a slow hash.
#  2) Per-request key lookup needs O(1), not O(n_keys).

import hashlib


def generate_api_key() -> tuple[str, str, str]:
    """
    Generate a new API key.

    Returns:
        (plaintext_key, key_hash, key_prefix)
        - plaintext is shown to the user ONCE
        - key_hash (sha256 hex) goes into the DB
        - key_prefix is the first 13 chars, used for display in the UI
    """
    plaintext = "akey_" + secrets.token_urlsafe(32)
    key_hash  = hashlib.sha256(plaintext.encode()).hexdigest()
    key_prefix = plaintext[:13]   # "akey_" + 8 chars
    return plaintext, key_hash, key_prefix


def hash_api_key(plain: str) -> str:
    return hashlib.sha256(plain.encode()).hexdigest()


def verify_api_key(plain: str, hashed: str) -> bool:
    return secrets.compare_digest(hash_api_key(plain), hashed)

# ─── JWT ────────────────────────────────────────────────────────────────────

def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """Sign a JWT containing `sub=<user_id>` and an expiry."""
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or _settings.JWT_EXPIRE_MINUTES,
    )
    payload = {"sub": subject, "exp": expires}
    return jwt.encode(payload, _settings.JWT_SECRET, algorithm=_settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """Return the `sub` claim if the token is valid, else None."""
    try:
        payload = jwt.decode(token, _settings.JWT_SECRET, algorithms=[_settings.JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ─── FastAPI dependency: extract logged-in User from Authorization header ──

def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: parses `Authorization: Bearer <jwt>` and returns
    the User row. Raises 401 otherwise.

    Used on protected routes like:
        @app.get("/api/latest")
        def latest(user: User = Depends(get_current_user), ...):
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise credentials_exc

    user_id = decode_access_token(token)
    if not user_id:
        raise credentials_exc

    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if user is None:
        raise credentials_exc

    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    """Like get_current_user, but additionally requires is_admin=True."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
