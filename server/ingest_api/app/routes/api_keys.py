"""
API keys management — programmatic access tokens for devices and scripts.

  GET    /api-keys              List current user's keys (metadata only)
  POST   /api-keys              Create a new key — plaintext returned ONCE
  DELETE /api-keys/{key_id}     Revoke a key (soft delete; row preserved)
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import generate_api_key, get_current_user
from app.db import get_db
from app.models import ApiKey, User
from app.schemas import ApiKeyCreate, ApiKeyCreated, ApiKeyOut

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get(
    "",
    response_model=list[ApiKeyOut],
    summary="List the current user's API keys",
)
def list_api_keys(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ApiKey]:
    """Return all API keys (active + revoked) for the current user, newest first."""
    keys = db.execute(
        select(ApiKey)
        .where(ApiKey.user_id == user.id)
        .order_by(ApiKey.created_at.desc())
    ).scalars().all()
    return list(keys)


@router.post(
    "",
    response_model=ApiKeyCreated,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API key — plaintext returned ONCE",
)
def create_api_key(
    payload: ApiKeyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ApiKeyCreated:
    """
    Generate a new API key for the current user.

    The plaintext key is returned in the response body ONLY ONCE — store it
    immediately. Only the SHA-256 hash is persisted; the original can't be
    recovered. If lost, revoke this key and create a new one.
    """
    plaintext, key_hash, key_prefix = generate_api_key()

    key = ApiKey(
        user_id=user.id,
        name=payload.name.strip(),
        key_hash=key_hash,
        key_prefix=key_prefix,
        is_active=True,
    )
    db.add(key)
    db.commit()
    db.refresh(key)

    return ApiKeyCreated(
        id=key.id,
        name=key.name,
        key_prefix=key.key_prefix,
        is_active=key.is_active,
        created_at=key.created_at,
        last_used_at=key.last_used_at,
        key=plaintext,
    )


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an API key (soft delete: is_active=false)",
)
def revoke_api_key(
    key_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark a key as revoked. The row stays for audit; revoked keys won't authenticate."""
    key = db.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.user_id == user.id,
        )
    ).scalar_one_or_none()

    if key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    key.is_active = False
    db.commit()
    return None
