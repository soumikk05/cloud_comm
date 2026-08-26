"""
Tampering detection routes (Module 3).
"""

from fastapi import APIRouter, UploadFile, File

from app.services.tampering_service import analyze_tampering
from app.utils.image_utils import save_upload_to_temp, cleanup_temp_file

router = APIRouter(prefix="/api/tampering", tags=["tampering"])


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Runs the rule-based tampering analysis (ELA + EXIF + copy-move) on an
    uploaded document image and returns a tampering_score (0-100) with a
    per-check breakdown. Never raises on a bad/unreadable image — the
    "error" field in the response covers that instead.
    """
    temp_path = save_upload_to_temp(file)
    try:
        result = analyze_tampering(temp_path)
        return result
    finally:
        cleanup_temp_file(temp_path)


@router.post("/cnn-score")
async def cnn_score(file: UploadFile = File(...)):
    """
    STUB — placeholder for the teammate's CASIA v2.0 fine-tuned CNN
    tampering classifier. Wire the real model in here once it's ready;
    until then this returns a fixed placeholder so the endpoint shape is
    stable and the frontend/risk_engine can integrate against it early.

    Deliberately NOT called by /api/risk/assess yet (see risk_engine.py) —
    plug it in there once `cnn_score` below is a real inference call.
    """
    temp_path = save_upload_to_temp(file)
    try:
        # TODO: replace with real model inference, e.g.:
        #   score = cnn_model.predict(preprocess(temp_path))
        return {
            "cnn_score": None,
            "model": "casia_cnn_v1 (not yet wired)",
            "note": "Placeholder endpoint — awaiting teammate's fine-tuned model integration.",
        }
    finally:
        cleanup_temp_file(temp_path)