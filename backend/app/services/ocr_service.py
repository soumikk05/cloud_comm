"""
OCR extraction service (Module 1).

Flow:
  1. Try PassportEye's MRZ reader first — if it finds a valid-looking MRZ,
     treat the document as a passport (or MRZ-bearing visa/ID) and return
     checksum-validated fields.
  2. If no MRZ is found, fall back to EasyOCR for raw text, guess the
     document type from keywords, and pull fields out with regex/positional
     heuristics (Module 1 "visa/ID" path).
  3. Never raise — always return a JSON-serializable dict, with an "error"
     key set on failure, so a blurry/garbage image can't crash the demo.
"""

import re
import logging
from typing import Any, Dict, List, Optional

from app.config import EASYOCR_LANGS
from app.utils.mrz_parser import mrz_to_fields

logger = logging.getLogger(__name__)

# Lazy-loaded singletons — importing/initializing easyocr's Reader is slow
# (~seconds, loads model weights), so we only pay that cost once, on first
# use, not on every request or at import time.
_easyocr_reader = None


def _get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr  # local import: keep app startup fast if OCR unused
        _easyocr_reader = easyocr.Reader(EASYOCR_LANGS, gpu=False)
    return _easyocr_reader


def extract_document_fields(image_path: str) -> Dict[str, Any]:
    """
    Main entry point. Returns:
    {
        "document_type": "passport" | "visa" | "national_id" | "unknown",
        "fields": {...},
        "confidence": {...},
        "error": None | str
    }
    """
    # --- Attempt 1: MRZ via PassportEye (passports, and many visas/IDs too) ---
    try:
        mrz_result = _try_passporteye(image_path)
        if mrz_result is not None:
            return mrz_result
    except Exception as exc:  # pragma: no cover - defensive, see module docstring
        logger.warning("PassportEye MRZ read failed, falling back to EasyOCR: %s", exc)

    # --- Attempt 2: EasyOCR + regex/positional parsing ---
    try:
        return _extract_via_easyocr(image_path)
    except Exception as exc:
        logger.error("EasyOCR extraction failed: %s", exc)
        return {
            "document_type": "unknown",
            "fields": {},
            "confidence": {},
            "error": f"OCR failed on this image: {exc}",
        }


def _try_passporteye(image_path: str) -> Optional[Dict[str, Any]]:
    from passporteye import read_mrz  # local import, same reasoning as easyocr

    mrz = read_mrz(image_path)
    if mrz is None:
        return None  # no MRZ lines detected at all -> let EasyOCR path handle it

    parsed = mrz_to_fields(mrz)

    # valid_score is PassportEye's own 0-100 OCR confidence for the MRZ read.
    # Below ~30 it's usually noise (e.g. random horizontal lines mistaken for
    # MRZ) rather than a real MRZ zone, so don't commit to "passport" then —
    # let the EasyOCR fallback have a shot instead.
    ocr_confidence = parsed["confidence"].get("mrz_ocr_confidence")
    if ocr_confidence is not None and ocr_confidence < 30:
        return None

    doc_type_raw = parsed["fields"].get("document_type", "")
    document_type = "passport" if doc_type_raw.upper().startswith("P") else "visa"

    return {
        "document_type": document_type,
        "fields": parsed["fields"],
        "confidence": parsed["confidence"],
        "error": None,
    }


# --- EasyOCR fallback path (visas / national IDs / anything without MRZ) ---

_DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[\/\-. ](?:\d{1,2}|[A-Za-z]{3})[\/\-. ]\d{2,4})\b"
)
_DOC_NUMBER_PATTERN = re.compile(r"\b[A-Z0-9]{6,12}\b")

_TYPE_KEYWORDS = {
    "visa": ["visa", "entry permit", "multiple entry", "single entry"],
    "national_id": ["identity card", "national id", "id card", "resident card"],
    "driving_license": ["driving licence", "driver's license", "driving license"],
}


def _extract_via_easyocr(image_path: str) -> Dict[str, Any]:
    reader = _get_easyocr_reader()
    results = reader.readtext(image_path)  # list of (bbox, text, confidence)

    if not results:
        return {
            "document_type": "unknown",
            "fields": {},
            "confidence": {},
            "error": "No readable text detected in image (blurry or empty upload?)",
        }

    lines: List[str] = [text.strip() for _, text, _ in results if text.strip()]
    full_text = " | ".join(lines)
    lowered = full_text.lower()

    document_type = "unknown"
    for dtype, keywords in _TYPE_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            document_type = dtype
            break

    dates_found = _DATE_PATTERN.findall(full_text)
    doc_numbers_found = [
        tok for tok in _DOC_NUMBER_PATTERN.findall(full_text)
        if any(ch.isdigit() for ch in tok)  # filter out pure-letter false positives
    ]

    # Positional heuristic: the longest all-caps line is usually the holder's
    # name on visas/IDs (this is a coarse hackathon heuristic, not OCR layout
    # analysis — good enough for a demo, flagged in README as a known limit).
    caps_lines = [ln for ln in lines if ln.isupper() and len(ln.split()) >= 2]
    probable_name = max(caps_lines, key=len) if caps_lines else ""

    fields = {
        "document_type_guess": document_type,
        "probable_name": probable_name,
        "dates_found": dates_found,
        "issue_or_expiry_date": dates_found[0] if len(dates_found) >= 1 else "",
        "second_date_found": dates_found[1] if len(dates_found) >= 2 else "",
        "document_number_candidates": doc_numbers_found,
        "document_number": doc_numbers_found[0] if doc_numbers_found else "",
        "raw_text_lines": lines,
    }

    # Per-field confidence: average EasyOCR per-token confidence, as a stand-in
    # since we don't have per-field bounding boxes mapped to fields here.
    avg_conf = sum(c for _, _, c in results) / len(results)
    confidence = {
        "ocr_average_confidence": round(avg_conf, 3),
        "document_type_guess": "keyword_match" if document_type != "unknown" else "none",
    }

    return {
        "document_type": document_type,
        "fields": fields,
        "confidence": confidence,
        "error": None,
    }