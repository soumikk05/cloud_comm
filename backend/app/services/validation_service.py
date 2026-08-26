"""
Document Validation service (Module 2).

Pure rules engine — no ML, no external calls. Takes the JSON shape produced
by Module 1 (app/services/ocr_service.extract_document_fields) and runs a
battery of pass/fail checks against it:

  - MRZ checksum validity (surfaced from PassportEye's own confidence flags)
  - Document number format sanity
  - Date logic: not expired, DOB plausible, expiry after issue where known
  - Nationality/country code sanity (ICAO alpha-3)
  - Fallback, lighter-touch checks for the EasyOCR (non-MRZ) path, since
    that path's fields are noisier heuristics rather than checksummed data

Never raises — a malformed/partial input just yields more "failed" or
"skipped" checks, never a crash, so a blurry demo image degrades gracefully
instead of 500ing on stage.
"""

import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

# ICAO 3166-1 alpha-3 country/nationality codes are 3 uppercase letters.
_ALPHA3_PATTERN = re.compile(r"^[A-Z]{3}$")

# Generic passport/visa/ID document number: 6-12 alphanumeric, at least one digit.
_DOC_NUMBER_PATTERN = re.compile(r"^[A-Z0-9]{6,12}$")

MIN_PLAUSIBLE_AGE = 0
MAX_PLAUSIBLE_AGE = 120


def validate_document(extraction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point. `extraction` is the dict returned by
    ocr_service.extract_document_fields (or the equivalent JSON body posted
    to /api/validation/check).

    Returns:
    {
        "document_type": ...,
        "checks": [{"name": str, "passed": bool, "reason": str}, ...],
        "pass_count": int,
        "fail_count": int,
        "overall_valid": bool
    }
    """
    document_type = extraction.get("document_type", "unknown")
    fields = extraction.get("fields", {}) or {}
    confidence = extraction.get("confidence", {}) or {}

    if extraction.get("error"):
        # OCR already failed upstream — nothing meaningful to validate.
        return _build_result(document_type, [
            _check("ocr_precondition", False, f"Skipped: OCR extraction reported an error: {extraction['error']}")
        ])

    checks: List[Dict[str, Any]] = []

    if document_type in ("passport", "visa") and "document_number" in fields and confidence.get("document_number") is not None:
        # This came through the PassportEye/MRZ path — we have real checksums.
        checks.extend(_validate_mrz_backed_document(fields, confidence))
    else:
        # This came through the EasyOCR fallback path — softer heuristic checks.
        checks.extend(_validate_fallback_document(fields))

    return _build_result(document_type, checks)


# --- MRZ-backed validation (passports, MRZ visas/IDs) ------------------------

def _validate_mrz_backed_document(fields: Dict[str, Any], confidence: Dict[str, Any]) -> List[Dict[str, Any]]:
    checks = []

    # 1. Overall MRZ composite checksum (covers doc number, DOB, expiry, etc.
    #    combined) — this is the single strongest signal PassportEye gives us.
    composite_valid = bool(confidence.get("overall_composite"))
    checks.append(_check(
        "mrz_composite_checksum",
        composite_valid,
        "MRZ composite checksum passed" if composite_valid
        else "MRZ composite checksum FAILED — document number, DOB, or expiry may be altered",
    ))

    # 2. Individual field checksums, for a more granular breakdown than the
    #    composite alone (helps point to *which* field looks tampered).
    for field_name, label in [
        ("document_number", "document_number_checksum"),
        ("date_of_birth", "date_of_birth_checksum"),
        ("expiration_date", "expiration_date_checksum"),
    ]:
        valid = bool(confidence.get(field_name))
        checks.append(_check(
            label,
            valid,
            f"{field_name} checksum passed" if valid else f"{field_name} checksum FAILED",
        ))

    # 3. Document number format sanity (belt-and-braces on top of checksum).
    doc_number = (fields.get("document_number") or "").upper()
    doc_number_ok = bool(_DOC_NUMBER_PATTERN.match(doc_number))
    checks.append(_check(
        "document_number_format",
        doc_number_ok,
        "Document number format looks valid" if doc_number_ok
        else f"Document number '{doc_number}' does not match expected alphanumeric pattern",
    ))

    # 4. Nationality / country code sanity.
    nationality = (fields.get("nationality") or "").upper()
    nationality_ok = bool(_ALPHA3_PATTERN.match(nationality)) if nationality else False
    checks.append(_check(
        "nationality_code_format",
        nationality_ok,
        "Nationality code looks like valid ICAO alpha-3" if nationality_ok
        else f"Nationality code '{nationality}' is missing or not a 3-letter ICAO code",
    ))

    # 5. Expiry date logic: must be a real date, and we report expired
    #    documents as a failed check (a checkpoint should flag these).
    checks.append(_date_not_expired_check(fields.get("expiration_date")))

    # 6. Date of birth plausibility.
    checks.append(_dob_plausible_check(fields.get("date_of_birth")))

    return checks


# --- Fallback (EasyOCR, non-MRZ) validation ---------------------------------

def _validate_fallback_document(fields: Dict[str, Any]) -> List[Dict[str, Any]]:
    checks = []

    doc_number = (fields.get("document_number") or "").upper()
    doc_number_ok = bool(_DOC_NUMBER_PATTERN.match(doc_number)) if doc_number else False
    checks.append(_check(
        "document_number_format",
        doc_number_ok,
        "Document number candidate looks plausible" if doc_number_ok
        else "No plausible document number found by OCR (low confidence extraction)",
    ))

    name_found = bool(fields.get("probable_name"))
    checks.append(_check(
        "name_detected",
        name_found,
        "A probable name line was detected" if name_found
        else "Could not confidently detect a name on this document",
    ))

    dates_found = fields.get("dates_found") or []
    checks.append(_check(
        "date_fields_present",
        len(dates_found) >= 1,
        f"Found {len(dates_found)} date-like field(s)" if dates_found
        else "No dates detected — cannot verify expiry/validity",
    ))

    # Best-effort expiry check using whichever date field we guessed as expiry.
    checks.append(_date_not_expired_check(fields.get("issue_or_expiry_date"), lenient=True))

    return checks


# --- Shared date-logic helpers ----------------------------------------------

def _parse_date_safe(raw: Optional[str]) -> Optional[date]:
    """Try a few common formats; return None if unparseable rather than raising."""
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%d %m %Y", "%d/%m/%y"):
        try:
            return datetime.strptime(raw.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _date_not_expired_check(raw_expiry: Optional[str], lenient: bool = False) -> Dict[str, Any]:
    parsed = _parse_date_safe(raw_expiry)
    if parsed is None:
        name = "expiry_date_not_expired"
        if lenient:
            # Fallback OCR dates are unreliable enough that "couldn't parse"
            # shouldn't hard-fail a check — surface it as a skip instead.
            return _check(name, True, "Could not confidently parse expiry date — skipped, not treated as failure")
        return _check(name, False, f"Could not parse expiration date '{raw_expiry}'")

    is_valid = parsed >= date.today()
    return _check(
        "expiry_date_not_expired",
        is_valid,
        f"Document valid until {parsed.isoformat()}" if is_valid
        else f"Document EXPIRED on {parsed.isoformat()}",
    )


def _dob_plausible_check(raw_dob: Optional[str]) -> Dict[str, Any]:
    parsed = _parse_date_safe(raw_dob)
    if parsed is None:
        return _check("date_of_birth_plausible", False, f"Could not parse date of birth '{raw_dob}'")

    if parsed > date.today():
        return _check("date_of_birth_plausible", False, f"Date of birth {parsed.isoformat()} is in the future")

    age_years = (date.today() - parsed).days // 365
    plausible = MIN_PLAUSIBLE_AGE <= age_years <= MAX_PLAUSIBLE_AGE
    return _check(
        "date_of_birth_plausible",
        plausible,
        f"Age ~{age_years} years is plausible" if plausible
        else f"Age ~{age_years} years is outside plausible range",
    )


# --- Small helpers -----------------------------------------------------------

def _check(name: str, passed: bool, reason: str) -> Dict[str, Any]:
    return {"name": name, "passed": passed, "reason": reason}


def _build_result(document_type: str, checks: List[Dict[str, Any]]) -> Dict[str, Any]:
    pass_count = sum(1 for c in checks if c["passed"])
    fail_count = len(checks) - pass_count
    return {
        "document_type": document_type,
        "checks": checks,
        "pass_count": pass_count,
        "fail_count": fail_count,
        # overall_valid is deliberately strict: ANY failed check fails the
        # document. The risk engine (Module: risk_engine.py) is what turns
        # this into a graded score — validation itself stays binary per-check.
        "overall_valid": fail_count == 0 and len(checks) > 0,
    }