"""Pydantic request/response schemas for the HTTP API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="中文唱词文本，按行或标点分句。", min_length=1)


class TranslateRequest(BaseModel):
    modern_text: str = Field(..., description="现代白话或流行歌词。", min_length=1)
    lines: int = Field(4, ge=2, le=16, description="目标唱词句数。")
    max_repairs: int = Field(2, ge=0, le=5, description="平仄修正重试次数上限。")
    model: Optional[str] = Field(None, description="覆盖默认的 Claude 模型 ID。")


class HealthResponse(BaseModel):
    status: str
    version: str
    llm_available: bool
