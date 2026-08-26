from fastapi import APIRouter, UploadFile, File

from app.services.ocr_service import extract_document_fields
from app.utils.image_utils import save_upload_to_temp, cleanup_temp_file

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/extract")
async def extract(file: UploadFile = File(...)):
    """
    Accepts a document image (passport/visa/national ID), runs OCR
    extraction, and returns structured fields. Never raises on a bad/blurry
    image — errors are surfaced in the response body's "error" field so the
    demo doesn't 500 mid-presentation.
    """
    temp_path = save_upload_to_temp(file)
    try:
        result = extract_document_fields(temp_path)
        return result
    finally:
        cleanup_temp_file(temp_path)