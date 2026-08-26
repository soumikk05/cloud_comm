from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.validation_service import validate_document

router = APIRouter(prefix="/api/validation", tags=["validation"])


class ExtractionInput(BaseModel):
    """
    Mirrors the JSON shape returned by POST /api/ocr/extract, so the
    frontend (or a Postman test) can pipe that response straight into this
    endpoint unchanged. `fields` and `confidence` are left as free-form
    dicts because their shape differs between the MRZ path and the
    EasyOCR fallback path (see ocr_service.py).
    """
    document_type: str
    fields: Dict[str, Any] = {}
    confidence: Dict[str, Any] = {}
    error: Optional[str] = None


@router.post("/check")
async def check(extraction: ExtractionInput):
    """
    Accepts an OCR extraction result and runs rule-based validation checks
    against it (MRZ checksums, document number format, date logic, etc).
    Never raises — a malformed/partial extraction just yields more failed
    or skipped checks in the response.
    """
    result = validate_document(extraction.dict())
    return result