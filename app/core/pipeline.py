"""Neuro-symbolic translation pipeline: generate -> verify -> repair.

    modern text ──> [Claude draft] ──> [symbolic verifier] ──┐
                         ▲                                     │ violations?
                         └──────── feedback (re-prompt) ◀──────┘
                                          │ no violations / budget spent
                                          ▼
                                    best verse + report

Without an API key the pipeline runs in assess-only mode: it verifies whatever
verse the user supplies and returns the diagnostic report, so the engine is
useful and demoable even offline.
"""

from __future__ import annotations

from .generator import generate, llm_available
from .verifier import verify_text


def _feedback_from(report: dict) -> str:
    return "\n".join(f"- {v}" for v in report["violations"])


def translate(
    modern_text: str,
    *,
    lines: int = 4,
    max_repairs: int = 2,
    model: str | None = None,
) -> dict:
    """Translate modern text into 平仄-valid Cantonese opera verse."""
    if not llm_available():
        report = verify_text(modern_text)
        return {
            "mode": "assess_only",
            "available": False,
            "input": modern_text,
            "verse": modern_text,
            "report": report,
            "iterations": 0,
            "note": "评估模式：已分析输入文本的平仄与押韵。设置 ANTHROPIC_API_KEY 以启用生成。",
        }

    feedback: str | None = None
    best: dict | None = None
    iterations = 0

    for attempt in range(max_repairs + 1):
        iterations = attempt + 1
        gen = generate(modern_text, lines=lines, feedback=feedback, model=model)
        if not gen.available:
            return {
                "mode": "unavailable",
                "available": False,
                "input": modern_text,
                "note": gen.note,
            }
        report = verify_text(gen.text)
        candidate = {
            "mode": "generate",
            "available": True,
            "input": modern_text,
            "verse": gen.text,
            "report": report,
            "iterations": iterations,
            "model": gen.model,
        }
        if best is None or report["score"] > best["report"]["score"]:
            best = candidate
        if report["ok"]:
            return candidate
        feedback = _feedback_from(report)

    return best  # best-effort after exhausting the repair budget
