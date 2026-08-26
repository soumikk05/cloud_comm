# AI-Based Fake Identity & Document Screening System — Backend

Hackathon prototype backend. Analyzes identity/travel documents (passport,
visa, national ID): OCR extraction → rule-based validation → tampering
detection → face verification → combined risk score.

**Status:** Section 1–3 scaffold complete (folder structure, config,
requirements, routes wired to `501 Not Implemented` stubs). Module logic
(OCR, validation, tampering, face, risk engine) is Phase 4/5 — not yet
implemented.

## Setup (Windows / VSCode, local venv)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Also install Tesseract-OCR separately (required by `passporteye`):
https://github.com/UB-Mannheim/tesseract/wiki — add it to your PATH.

## Run

```powershell
uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://127.0.0.1:8000/docs

## Endpoints

| Method | Path                     | Purpose                                   |
|--------|--------------------------|--------------------------------------------|
| GET    | `/health`                | Basic health check                        |
| POST   | `/api/ocr/extract`       | Multipart file → extracted fields JSON    |
| POST   | `/api/validation/check`  | Extracted fields JSON → validation result |
| POST   | `/api/tampering/analyze` | Multipart file → tampering score          |
| POST   | `/api/tampering/cnn-score` | Stub for teammate's CASIA v2.0 CNN model |
| POST   | `/api/face/verify`       | Doc photo + selfie → match result         |
| POST   | `/api/risk/assess`       | Full pipeline → final score + label       |

## Example curl commands

```bash
curl http://127.0.0.1:8000/health

curl -X POST http://127.0.0.1:8000/api/ocr/extract \
  -F "file=@dataset/raw/sample_passport.jpg"

curl -X POST http://127.0.0.1:8000/api/tampering/analyze \
  -F "file=@dataset/synthetic/tampered_sample.jpg"

curl -X POST http://127.0.0.1:8000/api/face/verify \
  -F "doc_photo=@dataset/raw/doc_photo.jpg" \
  -F "selfie=@dataset/raw/selfie.jpg"

curl -X POST http://127.0.0.1:8000/api/risk/assess \
  -F "document=@dataset/raw/sample_passport.jpg" \
  -F "selfie=@dataset/raw/selfie.jpg"
```

## Folder structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, wires all routers
│   ├── config.py            # risk weights, thresholds, model constants
│   ├── api/                 # thin route handlers (one file per module)
│   ├── services/            # actual logic lives here (Phase 4/5)
│   ├── models/               # (empty — reserved for Pydantic schemas / teammate's CNN weights)
│   └── utils/
│       ├── image_utils.py
│       └── mrz_parser.py
├── dataset/
│   ├── raw/        # place real sample doc images here for testing
│   ├── synthetic/  # tampered/synthetic test images
│   ├── casia/       # CASIA v2.0 (teammate's CNN training data)
│   └── midv/         # MIDV dataset if used
├── tests/
├── requirements.txt
└── README.md
```

## Notes / known Windows install gotchas

- `deepface` pulls in `tensorflow`; first call downloads pretrained weights —
  run one warm-up call before the demo, not live on stage.
- We use `deepface` instead of `face_recognition`/`dlib` specifically because
  `dlib`'s pip build frequently fails on Windows without Visual Studio Build
  Tools.
- `paddleocr` is a secondary OCR fallback only — if it's giving install
  trouble, comment it out of `requirements.txt` and rely on `easyocr` alone.

## Next steps (not yet built)

- Phase 4: implement `ocr_service`, `validation_service`, `tampering_service`,
  `face_service` logic and remove the `501` stubs in their route handlers.
- Phase 5: implement `risk_engine.compute_risk` and wire `/api/risk/assess`
  to call all four services in sequence.
