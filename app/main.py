"""CANTOMESH FastAPI application entry point.

Run locally:
    uvicorn app.main:app --reload
Then open http://127.0.0.1:8000/
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api.routes import router

app = FastAPI(
    title="CANTOMESH · 粵脈·鏡 平仄 Engine",
    version=__version__,
    description="Neuro-symbolic Cantonese opera versification: Claude drafts, "
    "a symbolic 平仄/押韻 verifier enforces the heritage rules.",
)

app.include_router(router)

_WEB_DIR = Path(__file__).resolve().parent.parent / "web"


@app.get("/")
def index() -> FileResponse:
    return FileResponse(_WEB_DIR / "index.html")


if _WEB_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=_WEB_DIR), name="static")
