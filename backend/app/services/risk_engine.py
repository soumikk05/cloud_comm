"""
Risk Scoring Engine (Module 5).

Combines the outputs of the previous four modules into one consolidated
result:
  - Module 2 (validation_service.validate_document)   -> validation failures
  - Module 3 (tampering_service.analyze_tampering)     -> tampering_score
  - Module 4 (face_service.verify_faces)               -> face match/mismatch

Blends these into a single weighted risk_score (0-100, higher = riskier),
maps it to a LOW/MEDIUM/HIGH label, and produces a plain-English list of
flags for the demo UI to show directly (e.g. "MRZ checksum failed").

Pure aggregation logic — no I/O, no file handling — so it's trivially
testable and reusable from risk_score_routes.py regardless of how the
upstream results were obtained (fresh pipeline run vs. re-scoring
already-computed module outputs).

Never raises — missing/errored upstream module results just contribute 0
to that component and get flagged in the summary, rather than crashing the
whole assessment.
"""

from typing import Any, Dict, List, Optional

# --- Weights (Section 4 spec: validation 30%, tampering 40%, face 30%) ----
# Configurable constants, not inline magic numbers, so these can be retuned
# live during the demo without hunting through the blending logic.
WEIGHT_VALIDATION = 0.30
WEIGHT_TAMPERING = 0.40
WEIGHT_FACE = 0.30

# risk_score -> label thresholds (Section 4 spec).
LOW_RISK_MAX = 30
MEDIUM_RISK_MAX = 65

# Face verification's "distance" isn't itself 0-100, so a mismatch/absence
# of a confident match contributes this many risk points on the 0-100
# scale (a match contributes 0). Kept as a constant so a "no selfie
# provided" demo run can be tuned separately if needed.
FACE_MISMATCH_RISK_POINTS = 100.0
FACE_NO_SELFIE_RISK_POINTS = 0.0  # selfie optional -> don't penalize its absence


def compute_risk_score(
    validation_result: Optional[Dict[str, Any]],
    tampering_result: Optional[Dict[str, Any]],
    face_result: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Main entry point. Each argument is the raw dict returned by the
    corresponding module (validate_document / analyze_tampering /
    verify_faces), or None if that step wasn't run (e.g. no selfie
    provided so face verification was skipped entirely).

    Returns:
    {
        "risk_score": float (0-100),
        "risk_label": "LOW" | "MEDIUM" | "HIGH",
        "component_scores": {"validation": float, "tampering": float, "face": float},
        "flags": [str, ...],   # plain-English summary of key issues
        "modules": {"validation": ..., "tampering": ..., "face": ...}  # raw pass-through
    }
    """
    flags: List[str] = []

    validation_component, validation_flags = _score_validation(validation_result)
    tampering_component, tampering_flags = _score_tampering(tampering_result)
    face_component, face_flags = _score_face(face_result)

    flags.extend(validation_flags)
    flags.extend(tampering_flags)
    flags.extend(face_flags)

    risk_score = (
        validation_component * WEIGHT_VALIDATION
        + tampering_component * WEIGHT_TAMPERING
        + face_component * WEIGHT_FACE
    )
    risk_score = round(min(100.0, max(0.0, risk_score)), 2)

    return {
        "risk_score": risk_score,
        "risk_label": _label_for_score(risk_score),
        "component_scores": {
            "validation": round(validation_component, 2),
            "tampering": round(tampering_component, 2),
            "face": round(face_component, 2),
        },
        "flags": flags if flags else ["No issues detected across validation, tampering, or face checks"],
        "modules": {
            "validation": validation_result,
            "tampering": tampering_result,
            "face": face_result,
        },
    }


# --- Per-module scoring -----------------------------------------------------

def _score_validation(result: Optional[Dict[str, Any]]) -> tuple[float, List[str]]:
    """
    Validation is pass/fail per-check (Module 2 is deliberately binary).
    Convert that into a 0-100 risk component as "fraction of checks that
    failed", and surface each individual failure reason as a flag.
    """
    flags: List[str] = []

    if not result or not result.get("checks"):
        flags.append("Validation was not run or produced no checks")
        return 0.0, flags

    checks = result["checks"]
    fail_count = result.get("fail_count", sum(1 for c in checks if not c.get("passed")))
    total = len(checks)

    for check in checks:
        if not check.get("passed"):
            flags.append(f"Validation: {check.get('reason', check.get('name', 'unknown check failed'))}")

    component = (fail_count / total) * 100 if total else 0.0
    return component, flags


def _score_tampering(result: Optional[Dict[str, Any]]) -> tuple[float, List[str]]:
    """
    Tampering already produces a 0-100 tampering_score (Module 3) — use it
    directly as the risk component. Surface each triggered sub-check as a
    flag (ELA / EXIF / copy-move).
    """
    flags: List[str] = []

    if not result:
        flags.append("Tampering analysis was not run")
        return 0.0, flags

    if result.get("error"):
        flags.append(f"Tampering analysis error: {result['error']}")
        return 0.0, flags

    for check in result.get("checks", []):
        if check.get("triggered"):
            flags.append(f"Tampering: {check.get('detail', check.get('name', 'check triggered'))}")

    component = float(result.get("tampering_score", 0.0))
    return component, flags


def _score_face(result: Optional[Dict[str, Any]]) -> tuple[float, List[str]]:
    """
    Face verification is optional per the spec ("+ optional selfie") — no
    selfie provided means this component contributes 0 risk rather than
    being penalized. A detection error (no face found) is flagged but
    treated as "unknown" rather than "risky", since it's usually an image
    quality issue, not evidence of fraud.
    """
    flags: List[str] = []

    if not result:
        # No selfie supplied at all — expected/valid for a doc-only run.
        return FACE_NO_SELFIE_RISK_POINTS, flags

    if result.get("error"):
        flags.append(f"Face verification could not be completed: {result['error']}")
        return FACE_NO_SELFIE_RISK_POINTS, flags

    if result.get("match") is True:
        return 0.0, flags

    # match is False (a confident mismatch) — this IS a real risk signal.
    flags.append(
        f"Face mismatch detected (distance={result.get('distance')}, threshold={result.get('threshold')})"
    )
    return FACE_MISMATCH_RISK_POINTS, flags


def _label_for_score(score: float) -> str:
    if score <= LOW_RISK_MAX:
        return "LOW"
    if score <= MEDIUM_RISK_MAX:
        return "MEDIUM"
    return "HIGH"