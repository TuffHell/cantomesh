"""Pydantic request/response schemas for the HTTP API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="中文唱詞文本，按行或標點分句。", min_length=1)


class TranslateRequest(BaseModel):
    modern_text: str = Field(..., description="現代白話或流行歌詞。", min_length=1)
    lines: int = Field(4, ge=2, le=16, description="目標唱詞句數。")
    max_repairs: int = Field(2, ge=0, le=5, description="平仄修正重試次數上限。")
    model: Optional[str] = Field(None, description="覆蓋默認的 Claude 模型 ID。")


class HealthResponse(BaseModel):
    status: str
    version: str
    llm_available: bool
