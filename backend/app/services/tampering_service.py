"""
Tampering Detection service (Module 3).

Rule-based, no trained model — three independent signals, each scored
0-100 (higher = more suspicious), then blended into a single
tampering_score. A teammate is separately fine-tuning a CNN classifier on
CASIA v2.0; that plugs in later via the /api/tampering/cnn-score stub and
is NOT combined into this score yet (see tampering_routes.py).

Signals:
  1. Error Level Analysis (ELA) — resave at a known JPEG quality, diff
     against the original. Regions that were edited/pasted-in tend to
     re-compress differently than the rest of the image, showing up as
     abnormally bright/high-error patches.
  2. EXIF metadata — look for editing-software tags (Photoshop, GIMP) and
     missing/inconsistent timestamp fields. Weak signal on its own (easy to
     strip), but free and occasionally damning.
  3. Copy-move forgery detection — ORB keypoint matching *within* the same
     image. Flags duplicated regions (e.g. a stamp or photo copy-pasted
     elsewhere in the doc).

Never raises — any per-check failure (unreadable image, no EXIF, etc.)
degrades that check to a 0/skipped contribution rather than crashing the
whole analysis, per the same philosophy as ocr_service/validation_service.
"""

import io
import logging
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

# --- Tunables -----------------------------------------------------------

ELA_JPEG_QUALITY = 90          # recompression quality used for the ELA diff
ELA_SUSPICIOUS_MEAN_THRESHOLD = 12.0   # mean pixel diff above this -> suspicious
ELA_SUSPICIOUS_MAX_THRESHOLD = 100.0   # any hotspot above this -> suspicious

# Software tags in EXIF that indicate the image was opened in an editor.
# Not proof of tampering (cropping in Preview is legit) but a real flag.
_EDITING_SOFTWARE_KEYWORDS = [
    "photoshop", "gimp", "affinity", "lightroom", "paint.net", "pixlr",
]

# ORB copy-move: minimum number of "good" matches (excluding trivial
# near-identical/adjacent keypoint pairs) before we call it a duplicated
# region rather than normal texture repetition (e.g. plain background).
COPY_MOVE_MIN_MATCHES = 10
COPY_MOVE_MIN_DISTANCE_PX = 40  # matched points closer than this are treated
                                 # as the same feature, not a copy-move pair

# Blend weights for the three signals -> overall tampering_score (0-100).
# Kept as named constants (not inline) so risk_engine.py's weighting story
# stays legible and these can be retuned independently of module 5's weights.
WEIGHT_ELA = 0.5
WEIGHT_EXIF = 0.15
WEIGHT_COPY_MOVE = 0.35


def analyze_tampering(image_path: str) -> Dict[str, Any]:
    """
    Main entry point.

    Returns:
    {
        "tampering_score": float (0-100, higher = more suspicious),
        "checks": [{"name": str, "triggered": bool, "score": float, "detail": str}, ...],
        "error": None | str
    }
    """
    try:
        checks: List[Dict[str, Any]] = []

        ela_check = _error_level_analysis(image_path)
        checks.append(ela_check)

        exif_check = _exif_analysis(image_path)
        checks.append(exif_check)

        copy_move_check = _copy_move_detection(image_path)
        checks.append(copy_move_check)

        tampering_score = (
            ela_check["score"] * WEIGHT_ELA
            + exif_check["score"] * WEIGHT_EXIF
            + copy_move_check["score"] * WEIGHT_COPY_MOVE
        )

        return {
            "tampering_score": round(tampering_score, 2),
            "checks": checks,
            "error": None,
        }
    except Exception as exc:  # pragma: no cover - defensive, see module docstring
        logger.error("Tampering analysis failed: %s", exc)
        return {
            "tampering_score": 0.0,
            "checks": [],
            "error": f"Tampering analysis failed on this image: {exc}",
        }


# --- 1. Error Level Analysis ---------------------------------------------

def _error_level_analysis(image_path: str) -> Dict[str, Any]:
    """
    Resave the image at a fixed JPEG quality and diff it against the
    original. Untouched regions of a genuine JPEG converge to a stable
    compression error; pasted-in or heavily edited regions (which came from
    a different generation/source) stand out as brighter patches in the
    diff. This is the classic ELA technique — cheap, no model needed.

    Note: this signal is JPEG-specific by nature (it's measuring
    recompression error). For PNG/lossless input we still run it, since
    the initial load + resave still surfaces *some* differential signal,
    but treat the result as weaker evidence.
    """
    name = "error_level_analysis"
    try:
        original = Image.open(image_path).convert("RGB")

        buffer = io.BytesIO()
        original.save(buffer, "JPEG", quality=ELA_JPEG_QUALITY)
        buffer.seek(0)
        resaved = Image.open(buffer)

        original_arr = np.asarray(original).astype(np.int16)
        resaved_arr = np.asarray(resaved).astype(np.int16)

        diff = np.abs(original_arr - resaved_arr)
        mean_diff = float(diff.mean())
        max_diff = float(diff.max())

        # Normalize into a 0-100 "suspicion" score. Two thresholds combined:
        # a high *average* error suggests broad recompression mismatch
        # (e.g. whole image resaved from a screenshot), while a high *peak*
        # error localized to a hotspot suggests a small pasted-in region.
        mean_component = min(100.0, (mean_diff / ELA_SUSPICIOUS_MEAN_THRESHOLD) * 60)
        max_component = min(100.0, (max_diff / ELA_SUSPICIOUS_MAX_THRESHOLD) * 40)
        score = round(mean_component + max_component, 2)
        score = min(score, 100.0)

        triggered = mean_diff > ELA_SUSPICIOUS_MEAN_THRESHOLD or max_diff > ELA_SUSPICIOUS_MAX_THRESHOLD

        return {
            "name": name,
            "triggered": triggered,
            "score": score,
            "detail": (
                f"ELA mean diff={mean_diff:.2f}, max diff={max_diff:.2f} "
                f"(thresholds: mean>{ELA_SUSPICIOUS_MEAN_THRESHOLD}, max>{ELA_SUSPICIOUS_MAX_THRESHOLD})"
            ),
        }
    except Exception as exc:
        logger.warning("ELA check failed: %s", exc)
        return {"name": name, "triggered": False, "score": 0.0, "detail": f"ELA check skipped: {exc}"}


# --- 2. EXIF metadata analysis --------------------------------------------

def _exif_analysis(image_path: str) -> Dict[str, Any]:
    """
    Look for editing-software signatures and missing/odd timestamp fields.
    A weak, easily-stripped signal on its own — most real forgeries strip
    or never had EXIF — but it's essentially free to check and occasionally
    catches a lazy edit (e.g. Software: "Adobe Photoshop 25.0").
    """
    name = "exif_metadata"
    try:
        image = Image.open(image_path)
        raw_exif = image._getexif() if hasattr(image, "_getexif") else None

        if not raw_exif:
            # No EXIF at all is *very* common for legitimately re-scanned/
            # re-photographed ID documents, so this is NOT itself
            # suspicious — just an uninformative/skipped check.
            return {
                "name": name,
                "triggered": False,
                "score": 0.0,
                "detail": "No EXIF metadata present (common for scans/screenshots — not inherently suspicious)",
            }

        tags = {ExifTags.TAGS.get(k, k): v for k, v in raw_exif.items()}

        software = str(tags.get("Software", "")).lower()
        editing_flagged = any(kw in software for kw in _EDITING_SOFTWARE_KEYWORDS)

        has_datetime = bool(tags.get("DateTime") or tags.get("DateTimeOriginal"))
        datetime_mismatch = (
            "DateTime" in tags and "DateTimeOriginal" in tags
            and tags["DateTime"] != tags["DateTimeOriginal"]
        )

        flags = []
        score = 0.0
        if editing_flagged:
            flags.append(f"Software tag indicates an image editor: '{tags.get('Software')}'")
            score += 70.0
        if not has_datetime:
            flags.append("No timestamp fields present in EXIF")
            score += 15.0
        if datetime_mismatch:
            flags.append("DateTime and DateTimeOriginal disagree")
            score += 25.0

        score = min(score, 100.0)
        triggered = bool(flags)

        return {
            "name": name,
            "triggered": triggered,
            "score": round(score, 2),
            "detail": "; ".join(flags) if flags else "EXIF present, no editing signatures or timestamp issues found",
        }
    except Exception as exc:
        logger.warning("EXIF check failed: %s", exc)
        return {"name": name, "triggered": False, "score": 0.0, "detail": f"EXIF check skipped: {exc}"}


# --- 3. Copy-move forgery detection (ORB) ---------------------------------

def _copy_move_detection(image_path: str) -> Dict[str, Any]:
    """
    Detect duplicated regions within the same image using ORB keypoints
    matched against themselves (self-matching). A cluster of strong matches
    between two spatially distant patches suggests one was copy-pasted from
    the other (e.g. a stamp or photo duplicated to cover an alteration).

    We exclude trivially-close matches (a keypoint matching its own near
    neighbours, which happens constantly on repetitive textures like MRZ
    lines or hatched security backgrounds) via COPY_MOVE_MIN_DISTANCE_PX.
    """
    name = "copy_move_detection"
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"name": name, "triggered": False, "score": 0.0, "detail": "Could not read image for copy-move check"}

        orb = cv2.ORB_create(nfeatures=1500)
        keypoints, descriptors = orb.detectAndCompute(img, None)

        if descriptors is None or len(keypoints) < 20:
            return {
                "name": name,
                "triggered": False,
                "score": 0.0,
                "detail": "Too few keypoints detected — image likely too small/blurry for copy-move analysis",
            }

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        # Match the descriptor set against itself (k=2 to get each
        # keypoint's best non-self match via knn, then filter below).
        matches = bf.knnMatch(descriptors, descriptors, k=2)

        genuine_pairs: List[Tuple[int, int]] = []
        for match_pair in matches:
            if len(match_pair) < 2:
                continue
            best, second = match_pair
            if best.queryIdx == best.trainIdx:
                # A keypoint always matches itself perfectly (distance 0) —
                # skip that trivial self-match and look at the next best.
                best = second
            if best.queryIdx == best.trainIdx:
                continue

            pt1 = keypoints[best.queryIdx].pt
            pt2 = keypoints[best.trainIdx].pt
            spatial_dist = float(np.hypot(pt1[0] - pt2[0], pt1[1] - pt2[1]))

            # A strong descriptor match (low Hamming distance) between two
            # keypoints that are spatially far apart is the copy-move
            # signature. Close-together matches are just repetitive local
            # texture and are ignored.
            if best.distance < 40 and spatial_dist > COPY_MOVE_MIN_DISTANCE_PX:
                pair_key = tuple(sorted((best.queryIdx, best.trainIdx)))
                genuine_pairs.append(pair_key)

        unique_pairs = set(genuine_pairs)
        match_count = len(unique_pairs)

        score = min(100.0, (match_count / COPY_MOVE_MIN_MATCHES) * 100)
        triggered = match_count >= COPY_MOVE_MIN_MATCHES

        return {
            "name": name,
            "triggered": triggered,
            "score": round(score, 2),
            "detail": (
                f"{match_count} candidate duplicated-region keypoint pairs found "
                f"(flag threshold: {COPY_MOVE_MIN_MATCHES})"
            ),
        }
    except Exception as exc:
        logger.warning("Copy-move check failed: %s", exc)
        return {"name": name, "triggered": False, "score": 0.0, "detail": f"Copy-move check skipped: {exc}"}