"""
Central configuration for the fake identity / document screening backend.
Keep tunable constants here instead of hardcoding them inline in services,
so the risk-scoring weights etc. can be adjusted in one place during demo prep.
"""

# --- Risk scoring weights (must sum to 1.0) ---
RISK_WEIGHT_VALIDATION = 0.30
RISK_WEIGHT_TAMPERING = 0.40
RISK_WEIGHT_FACE_MISMATCH = 0.30

# --- Risk label thresholds (inclusive lower bound, exclusive upper unless max) ---
RISK_LABEL_LOW_MAX = 30
RISK_LABEL_MEDIUM_MAX = 65
# > RISK_LABEL_MEDIUM_MAX => HIGH

# --- OCR ---
EASYOCR_LANGS = ["en"]
MRZ_LINE_MIN_LENGTH = 30  # heuristic: lines >= this length are candidate MRZ lines

# --- Tampering detection ---
ELA_JPEG_QUALITY = 90          # quality used when resaving for Error Level Analysis
ELA_ERROR_THRESHOLD = 40       # pixel error intensity considered "suspicious"
ORB_MATCH_DISTANCE_THRESHOLD = 40  # Hamming distance cutoff for copy-move keypoint matches
SUSPICIOUS_EXIF_SOFTWARE = ["photoshop", "gimp", "paint.net", "affinity"]

# --- Face verification ---
DEEPFACE_MODEL_NAME = "VGG-Face"     # solid accuracy/speed tradeoff for a demo
DEEPFACE_DISTANCE_METRIC = "cosine"

# --- Misc ---
TODAY_DATE_FORMAT = "%Y-%m-%d"
