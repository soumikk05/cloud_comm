"""
Risk assessment routes (Module 5).

/api/risk/assess is the main pipeline endpoint the frontend hits for the
demo: one document image (+ optional selfie) in, one consolidated risk
JSON out. Internally it runs OCR -> Validation, and Tampering, and
(if a selfie was provided) Face verification, then blends everything via
risk_engine.compute_risk_score.
"""

import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File

from app.services.ocr_service import extract_document_fields
from app.services.validation_service import validate_document
from app.services.tampering_service import analyze_tampering
from app.services.face_service import verify_faces
from app.services.risk_engine import compute_risk_score
from app.utils.image_utils import save_upload_to_temp, cleanup_temp_file

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.post("/assess")
async def assess(
    document_image: UploadFile = File(..., description="Full document image (passport/visa/ID)"),
    selfie_photo: Optional[UploadFile] = File(
        None, description="Optional live selfie — if omitted, face verification is skipped"
    ),
):
    """
    Runs the full pipeline in sequence:
      1. OCR extraction on document_image
      2. Validation on the OCR result
      3. Tampering analysis on document_image
      4. Face verification (document_image vs selfie_photo) — only if a
         selfie was uploaded
      5. Risk scoring — blends 1-4 into a final score/label/summary

    Never raises — every step is independently defensive (per the other
    modules' "never crash the demo" philosophy), so a bad/partial input
    degrades to a higher-risk-with-flags result rather than a 500.
    """
    doc_temp_path = save_upload_to_temp(document_image)
    selfie_temp_path = save_upload_to_temp(selfie_photo) if selfie_photo is not None else None

    try:
        ocr_result = extract_document_fields(doc_temp_path)
        validation_result = validate_document(ocr_result)
        tampering_result = analyze_tampering(doc_temp_path)

        face_result = None
        if selfie_temp_path is not None:
            face_result = verify_faces(doc_temp_path, selfie_temp_path)

        risk_result = compute_risk_score(
            validation_result=validation_result,
            tampering_result=tampering_result,
            face_result=face_result,
        )

        # Include the OCR result too (not just validation's derivative of
        # it) so the frontend can show extracted fields without a second
        # round-trip to /api/ocr/extract.
        return {
            "ocr": ocr_result,
            **risk_result,
        }
    finally:
        cleanup_temp_file(doc_temp_path)
        if selfie_temp_path is not None:
            cleanup_temp_file(selfie_temp_path)