"""
Authentication routes: register, login, who-am-I.

  POST /auth/register  — create an account (open registration; first user
                         becomes admin).
  POST /auth/login     — exchange email+password for a JWT.
  GET  /auth/me        — return the current user (requires JWT).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.db import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user account (open registration)",
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    """
    Create a new user. The very first registered user is automatically
    promoted to admin — that's the bootstrap admin.
    """
    # Normalize email to lowercase to prevent duplicate-with-different-case accounts
    email_normalized = payload.email.lower().strip()

    # If this is the very first user, grant admin
    is_first_user = db.execute(select(func.count(User.id))).scalar_one() == 0

    user = User(
        full_name=payload.full_name.strip(),
        email=email_normalized,
        password_hash=hash_password(payload.password),
        is_admin=is_first_user,
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists",
        )

    db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate and receive a JWT",
)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    """
    Validate credentials. Returns a JWT on success.

    Error responses are intentionally generic ("Invalid email or password")
    to avoid leaking which step failed (user enumeration prevention).
    """
    email_normalized = payload.email.lower().strip()
    user = db.execute(
        select(User).where(User.email == email_normalized)
    ).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get the current authenticated user",
)
def me(user: User = Depends(get_current_user)) -> User:
    """Echoes the user resolved from the JWT. Sanity-check endpoint."""
    return user
