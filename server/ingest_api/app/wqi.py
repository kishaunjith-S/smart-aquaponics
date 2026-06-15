"""
Water Quality Index (WQI) calculation for aquaponics.

Per-parameter scoring (0/30/70/100 tiers):
    100 = ideal range (aquaponics-optimal)
     70 = acceptable but not ideal
     30 = critical / out of healthy range
   None = no reading available (sensor offline / probe missing)

NULL handling:
    A NULL raw reading -> None score -> excluded from the overall WQI
    average. Never imputed to zero — that would falsely tank WQI.

Tweak the THRESHOLDS dict to retune ranges; the code stays the same.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


# (param, min_ideal, max_ideal, min_acceptable, max_acceptable)
# Outside [min_acceptable, max_acceptable] = critical (30).
# Outside [min_ideal, max_ideal] but inside acceptable = moderate (70).
# Inside [min_ideal, max_ideal] = excellent (100).
THRESHOLDS: dict[str, tuple[float, float, float, float]] = {
    "ph":  (6.8, 7.2, 6.0, 8.0),     # aquaponic sweet spot
    "wt":  (22.0, 28.0, 15.0, 32.0), # °C
    "ec":  (800.0, 1500.0, 300.0, 2500.0),  # µS/cm
    "ntu": (0.0, 5.0, 0.0, 50.0),    # NTU, only upper bound matters
    "do":  (6.0, 100.0, 3.0, 100.0), # mg/L, only lower bound matters
}


def score_parameter(name: str, value: Optional[float]) -> Optional[int]:
    """Return WQI score (100 / 70 / 30) for one parameter, or None if value is missing."""
    if value is None:
        return None

    bounds = THRESHOLDS.get(name)
    if bounds is None:
        raise ValueError(f"No WQI thresholds defined for parameter {name!r}")

    min_ideal, max_ideal, min_acceptable, max_acceptable = bounds

    if min_ideal <= value <= max_ideal:
        return 100
    if min_acceptable <= value <= max_acceptable:
        return 70
    return 30


@dataclass
class WQIResult:
    individual: dict[str, Optional[int]]  # {"wqi_pH": 100, "wqi_temp": 70, ...}
    overall:    Optional[float]            # mean of available scores, or None if all missing
    status:     str                        # "Excellent" | "Moderate" | "Poor" | "Critical" | "No Data"


def status_for(overall: Optional[float]) -> str:
    if overall is None:    return "No Data"
    if overall >= 90:      return "Excellent"
    if overall >= 70:      return "Moderate"
    if overall >= 50:      return "Poor"
    return "Critical"


def compute_wqi(
    *,
    ph:  Optional[float] = None,
    wt:  Optional[float] = None,
    ec:  Optional[float] = None,
    ntu: Optional[float] = None,
    do:  Optional[float] = None,
) -> WQIResult:
    """Compute WQI from raw sensor values. Missing values are excluded from the overall.

    Returns:
        WQIResult with per-parameter scores, overall, and status label.
    """
    scores = {
        "wqi_pH":   score_parameter("ph",  ph),
        "wqi_temp": score_parameter("wt",  wt),
        "wqi_do":   score_parameter("do",  do),
        "wqi_cond": score_parameter("ec",  ec),
        "wqi_turb": score_parameter("ntu", ntu),
    }

    valid = [s for s in scores.values() if s is not None]
    overall = sum(valid) / len(valid) if valid else None

    return WQIResult(
        individual=scores,
        overall=round(overall, 1) if overall is not None else None,
        status=status_for(overall),
    )
