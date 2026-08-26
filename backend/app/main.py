"""
FastAPI app entrypoint — wires up all module routers.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    ocr_routes,
    validation_routes,
    tampering_routes,
    face_routes,
    risk_score_routes,
)

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="AI-Based Fake Identity & Document Screening System",
    description=(
        "Hackathon prototype backend: OCR extraction, rule-based document "
        "validation, rule-based tampering detection, face verification, "
        "and a combined risk-scoring pipeline for passport/visa/ID checks."
    ),
    version="0.1.0",
)

# Allow the React frontend dev server to reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_routes.router)
app.include_router(validation_routes.router)
app.include_router(tampering_routes.router)
app.include_router(face_routes.router)
app.include_router(risk_score_routes.router)


@app.get("/health", tags=["health"])
async def health():
    """Basic health check — confirms the API process is up and responding."""
    return {"status": "ok"}