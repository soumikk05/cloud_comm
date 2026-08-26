"""
Face verification routes (Module 4).
"""

from fastapi import APIRouter, UploadFile, File

from app.services.face_service import verify_faces
from app.utils.image_utils import save_upload_to_temp, cleanup_temp_file

router = APIRouter(prefix="/api/face", tags=["face"])


@router.post("/verify")
async def verify(
    document_photo: UploadFile = File(..., description="Photo extracted/cropped from the ID document"),
    selfie_photo: UploadFile = File(..., description="Live selfie photo to compare against"),
):
    """
    Compares a document photo against a live selfie using DeepFace.
    Returns match=None with an "error" message (not a 500) if a face
    can't be detected in either image — keeps the demo from crashing on a
    bad-angle selfie or a low-res doc photo.
    """
    doc_temp_path = save_upload_to_temp(document_photo)
    selfie_temp_path = save_upload_to_temp(selfie_photo)
    try:
        result = verify_faces(doc_temp_path, selfie_temp_path)
        return result
    finally:
        cleanup_temp_file(doc_temp_path)
        cleanup_temp_file(selfie_temp_path)