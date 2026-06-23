"""HTTP routes for the 平仄 engine."""

from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.core.generator import llm_available
from app.core.pipeline import translate
from app.core.verifier import verify_text
from app.models.schemas import (
    AnalyzeRequest,
    HealthResponse,
    TranslateRequest,
)

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok", version=__version__, llm_available=llm_available()
    )


@router.post("/analyze")
def analyze(req: AnalyzeRequest) -> dict:
    """Verify supplied verse against 平仄 + 押韵 rules (fully offline)."""
    return verify_text(req.text)


@router.post("/translate")
def translate_endpoint(req: TranslateRequest) -> dict:
    """Generate 平仄-valid verse from modern text (assess-only without API key)."""
    return translate(
        req.modern_text,
        lines=req.lines,
        max_repairs=req.max_repairs,
        model=req.model,
    )
