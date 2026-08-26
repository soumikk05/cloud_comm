"""
Face Verification service (Module 4).

Uses DeepFace.verify() to compare a document photo (extracted/cropped from
the ID) against a live/selfie photo. DeepFace is used instead of
face_recognition/dlib specifically because dlib's build tooling is a
common source of Windows install failures (see requirements.txt note) —
DeepFace ships a pure TensorFlow/Keras backend and installs cleanly there.

Never raises — no-face, multiple-faces, and low-quality-image cases are
all caught and surfaced as a structured "error"/"warning" in the response
rather than crashing the pipeline, per the same philosophy as the other
modules.
"""

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# DeepFace supports several verification backbones; VGG-Face is the
# library's default and a solid balance of speed/accuracy for a demo.
# Kept as a named constant so it's a one-line swap (e.g. "Facenet",
# "ArcFace") if VGG-Face underperforms on your sample photos.
DEEPFACE_MODEL_NAME = "VGG-Face"

# Face detector backend. "opencv" is the fastest/most Windows-friendly
# option and needs no extra downloads beyond what DeepFace already pulls,
# unlike "mtcnn"/"retinaface" which are more accurate but heavier.
DEEPFACE_DETECTOR_BACKEND = "opencv"

# DeepFace.verify() computes a distance (0 = identical) and applies its own
# model-specific threshold to decide "verified" — we surface both the raw
# distance and DeepFace's own boolean rather than re-deriving our own cutoff.


def verify_faces(document_photo_path: str, selfie_photo_path: str) -> Dict[str, Any]:
    """
    Main entry point.

    Returns:
    {
        "match": bool | None,
        "distance": float | None,
        "threshold": float | None,
        "model": str,
        "detector_backend": str,
        "error": None | str
    }
    """
    try:
        # Local import: DeepFace pulls in TensorFlow at import time, which
        # is slow (~seconds) — keep it lazy so app startup / other routes
        # aren't penalized if face verification is never called.
        from deepface import DeepFace

        result = DeepFace.verify(
            img1_path=document_photo_path,
            img2_path=selfie_photo_path,
            model_name=DEEPFACE_MODEL_NAME,
            detector_backend=DEEPFACE_DETECTOR_BACKEND,
            enforce_detection=True,  # raise if no face found, so we can
                                      # catch it below and return a clean
                                      # "no face detected" error instead of
                                      # DeepFace comparing on a blank/garbage
                                      # region
        )

        return {
            "match": bool(result.get("verified")),
            "distance": round(float(result.get("distance")), 4) if result.get("distance") is not None else None,
            "threshold": round(float(result.get("threshold")), 4) if result.get("threshold") is not None else None,
            "model": DEEPFACE_MODEL_NAME,
            "detector_backend": DEEPFACE_DETECTOR_BACKEND,
            "error": None,
        }

    except ValueError as exc:
        # DeepFace raises ValueError (via its detector backend) specifically
        # for "no face detected in image" — the most common failure mode
        # for a blurry doc scan or a selfie taken at a bad angle. Treat this
        # as an expected, clean failure rather than a real error.
        logger.info("Face verification: no face detected — %s", exc)
        return {
            "match": None,
            "distance": None,
            "threshold": None,
            "model": DEEPFACE_MODEL_NAME,
            "detector_backend": DEEPFACE_DETECTOR_BACKEND,
            "error": f"Could not detect a face in one or both images: {exc}",
        }

    except Exception as exc:
        logger.error("Face verification failed: %s", exc)
        return {
            "match": None,
            "distance": None,
            "threshold": None,
            "model": DEEPFACE_MODEL_NAME,
            "detector_backend": DEEPFACE_DETECTOR_BACKEND,
            "error": f"Face verification failed: {exc}",
        }