"""
Face verification routes (Module 4).
"""

from fastapi import APIRouter, UploadFile, File

from app.models.schemas import FaceVerifyResponse
from app.services.face_service import verify_faces
from app.services.liveness_service import check_liveness
from app.utils.image_utils import save_upload_to_temp, cleanup_temp_file

router = APIRouter(prefix="/api/face", tags=["face"])


@router.post("/verify", response_model=FaceVerifyResponse)
def verify(
    document_photo: UploadFile = File(..., description="Photo extracted/cropped from the ID document"),
    selfie_photo: UploadFile = File(..., description="Live selfie photo to compare against"),
):
    """
    Compares a document photo against a live selfie using DeepFace (VGG-Face).
    Runs synchronously in a worker threadpool to avoid blocking event loops during neural inference.
    Returns match=None with an error message (not a 500) if faces cannot be detected.
    """
    doc_temp_path = save_upload_to_temp(document_photo)
    selfie_temp_path = save_upload_to_temp(selfie_photo)
    try:
        result = verify_faces(doc_temp_path, selfie_temp_path)
        return result
    finally:
        cleanup_temp_file(doc_temp_path)
        cleanup_temp_file(selfie_temp_path)


@router.post("/liveness")
def liveness(selfie_photo: UploadFile = File(...), challenge: str | None = None):
    path = save_upload_to_temp(selfie_photo)
    try: return check_liveness(path, challenge)
    finally: cleanup_temp_file(path)
