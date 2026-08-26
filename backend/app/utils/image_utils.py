"""
Shared image helpers used across services (OCR, tampering, face).
"""

import os
import shutil
import tempfile
from fastapi import UploadFile

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".pdf"}


def save_upload_to_temp(upload_file: UploadFile) -> str:
    """
    Persists an incoming FastAPI UploadFile to a temp file on disk and
    returns its path. PassportEye/EasyOCR/DeepFace all expect a file path
    (or numpy array), not a raw UploadFile, so every route does this first.

    Caller is responsible for deleting the temp file when done
    (see cleanup_temp_file below) — otherwise /tmp fills up during a demo.
    """
    suffix = os.path.splitext(upload_file.filename or "")[1].lower()
    if suffix not in ALLOWED_EXTENSIONS:
        # Don't hard-fail here — let the caller decide; but default to .jpg
        # so downstream libraries that sniff extension don't choke.
        suffix = suffix or ".jpg"

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(upload_file.file, tmp)
    finally:
        tmp.close()
    return tmp.name


def cleanup_temp_file(path: str) -> None:
    """Best-effort delete of a temp file created by save_upload_to_temp."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass