"""
Pydantic models for API request/response.

Naming convention:
    *Create   -> request body schemas (incoming validation)
    *Out      -> response schemas (outgoing serialization)
    *Internal -> shared helper schemas
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Health ─────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    db: str
    app: str
    env: str


# ─── Ingest (Pi -> EC2) ─────────────────────────────────────────────────────

class ReadingIn(BaseModel):
    """One sensor reading sent from the Pi.

    All sensor fields are optional — missing or null = sensor unavailable.
    Server stores them as SQL NULL (not 0.0).
    """
    ts:        datetime               = Field(..., description="UTC timestamp (ISO 8601)")
    ph:        Optional[float]        = Field(None, ge=0, le=14, description="pH")
    ec:        Optional[float]        = Field(None, ge=0, description="EC (µS/cm)")
    ntu:       Optional[float]        = Field(None, ge=0, description="Turbidity (NTU)")
    wt:        Optional[float]        = Field(None, ge=-10, le=100, description="Water temp (°C)")
    do_val:    Optional[float]        = Field(None, ge=0, le=50, description="Dissolved O₂ (mg/L)")


class IngestRequest(BaseModel):
    """Pi → EC2 ingest payload. One batch can contain many readings."""
    device_id: str                    = Field(..., min_length=1, max_length=64)
    readings:  list[ReadingIn]        = Field(..., min_length=1, max_length=500)


class IngestResponse(BaseModel):
    received:  int = Field(..., description="Number of readings in the request")
    inserted:  int = Field(..., description="Number of new rows actually inserted (duplicates skipped)")
    skipped:   int = Field(..., description="Duplicates skipped via ON CONFLICT")


# ─── Dashboard responses ────────────────────────────────────────────────────

class RawValues(BaseModel):
    """Raw sensor values for a single reading or bucket."""
    pH:           Optional[float] = None
    temp:         Optional[float] = None
    DO:           Optional[float] = None
    conductivity: Optional[float] = None
    turbidity:    Optional[float] = None


class IndividualScores(BaseModel):
    """Per-parameter WQI scores (100/70/30 or None if no reading)."""
    wqi_pH:   Optional[int] = None
    wqi_temp: Optional[int] = None
    wqi_do:   Optional[int] = None
    wqi_cond: Optional[int] = None
    wqi_turb: Optional[int] = None


class WQIRecord(BaseModel):
    """One row on the dashboard table: raw values + scores + status."""
    timestamp:         str
    device_id:         str
    raw_values:        RawValues
    individual_scores: IndividualScores
    overall_wqi:       Optional[float]
    status:            str


class LatestResponse(BaseModel):
    """Response for GET /api/latest — single most recent reading."""
    success: bool = True
    record:  Optional[WQIRecord] = None


class HistoryResponse(BaseModel):
    """Response for GET /api/history — paginated/limited list of recent records."""
    records: list[WQIRecord]
    total:   int

    model_config = ConfigDict(from_attributes=True)


# ─── Auth ───────────────────────────────────────────────────────────────────

from uuid import UUID
from pydantic import EmailStr


class UserCreate(BaseModel):
    full_name: str          = Field(..., min_length=1, max_length=120)
    email:     EmailStr
    password:  str          = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class UserOut(BaseModel):
    id:         UUID
    full_name:  str
    email:      EmailStr
    is_admin:   bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"


# ─── API Keys ───────────────────────────────────────────────────────────────

class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class ApiKeyOut(BaseModel):
    """API key as shown in the list view — no plaintext."""
    id:           UUID
    name:         str
    key_prefix:   str
    is_active:    bool
    created_at:   datetime
    last_used_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreated(ApiKeyOut):
    """Returned ONCE at creation — includes the plaintext key."""
    key: str = Field(..., description="Full API key — shown only once, store securely.")


# ─── Chat ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000, description="User's message to the assistant")


class ChatResponse(BaseModel):
    response: str = Field(..., description="The assistant's reply (Markdown formatted)")
