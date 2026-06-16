"""
POST /chat — Gemini-powered aquaponics assistant.

Auto-injects current sensor readings + WQI into Gemini's context so it can
give personalized advice based on the user's actual system state, not
generic info from training data.

No chat history persisted server-side; the frontend keeps the conversation
in component state. (Simpler v0; can add a chat_history table later.)
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from google import genai
from google.genai import types
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import get_settings
from app.db import get_db
from app.models import Reading, User
from app.schemas import ChatRequest, ChatResponse
from app.wqi import compute_wqi

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

_settings = get_settings()
_client: Optional[genai.Client] = None


def _get_gemini_client() -> genai.Client:
    """Lazy-initialise the Gemini client. Errors out gracefully if key is missing."""
    global _client
    if _client is None:
        if not _settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Chatbot not configured (GEMINI_API_KEY missing on server)",
            )
        _client = genai.Client(api_key=_settings.GEMINI_API_KEY)
    return _client


def _build_context(db: Session) -> str:
    """Fetch the latest reading + WQI and format as plaintext context."""
    row = db.execute(
        select(Reading).order_by(Reading.ts.desc()).limit(1)
    ).scalar_one_or_none()

    if row is None:
        return "Note: No sensor readings are available yet — the device may not have started reporting."

    wqi = compute_wqi(ph=row.ph, wt=row.wt, ec=row.ec, ntu=row.ntu, do=row.do_val)

    def fmt(label: str, value, unit: str = "") -> str:
        if value is None:
            return f"- {label}: no reading"
        return f"- {label}: {value}{unit}"

    lines = [
        f"Current sensor readings from device '{row.device_id}' at {row.ts.isoformat()}:",
        fmt("pH", row.ph),
        fmt("Water temperature", row.wt, "°C"),
        fmt("EC (conductivity)", row.ec, " µS/cm"),
        fmt("Turbidity", row.ntu, " NTU"),
        (fmt("Dissolved Oxygen", row.do_val, " mg/L")
         if row.do_val is not None
         else "- Dissolved Oxygen: not yet measured (probe not installed)"),
        "",
        f"Water Quality Index: {wqi.overall if wqi.overall is not None else 'N/A'} ({wqi.status})",
        f"Individual scores (out of 100): {wqi.individual}",
    ]
    return "\n".join(lines)


SYSTEM_INSTRUCTION = """You are an expert aquaponics assistant for a smart monitoring system.

You help the user understand their water quality data, diagnose issues, and recommend actions for their fish-and-plants ecosystem.

Guidelines:
- Be concise and practical. Most users want actionable advice, not lectures.
- When the user asks about a specific parameter, refer to the live sensor reading in the context.
- Use the WQI scoring (each parameter gets 100/70/30):
  - WQI 90+ = Excellent (all in ideal range)
  - WQI 70-89 = Moderate (acceptable but suboptimal)
  - WQI 50-69 = Poor (multiple parameters need attention)
  - WQI <50 = Critical (immediate intervention)
- Ideal ranges for aquaponics:
  - pH: 6.8 to 7.2 (compromise between fish and plant needs)
  - Water temperature: 22 to 28°C
  - EC: 800 to 1500 µS/cm
  - Turbidity: under 5 NTU
  - Dissolved Oxygen: above 6 mg/L
- If the DO reading is missing, mention that DO is critical for fish health and probe installation is the next step.
- Format your replies with Markdown (bullet points, **bold** for emphasis, code for numeric values).
- If asked something completely off-topic, gently redirect to aquaponics.
"""


@router.post(
    "",
    response_model=ChatResponse,
    summary="Chat with the aquaponics assistant (Gemini AI)",
)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    """Send a message to Gemini with current sensor context auto-injected."""
    client = _get_gemini_client()
    context = _build_context(db)

    full_prompt = f"{context}\n\n---\n\nUser question:\n{payload.prompt}"

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )
    except Exception as e:
        logger.exception("Gemini API call failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Chatbot unavailable: {type(e).__name__}: {e}",
        )

    text = response.text or ""
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Empty response from Gemini",
        )

    return ChatResponse(response=text)
