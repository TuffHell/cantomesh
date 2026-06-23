"""LLM-backed generation of Cantonese opera verse (the neural half).

Generation is delegated to Claude when ANTHROPIC_API_KEY is set. The model is
*not* trusted blindly — its output is fed to the symbolic verifier and, on
violations, re-prompted with the specific failures (the repair loop lives in
pipeline.py). When no key is present the engine runs in assess-only mode; this
module simply reports that generation is unavailable.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

DEFAULT_MODEL = os.environ.get("CANTOMESH_MODEL", "claude-sonnet-4-6")

_SYSTEM = (
    "你是一位粤剧撰曲名家，精通梆黄体、依字行腔、平仄与押韵。"
    "你将现代白话或流行歌词改写为地道的粤剧唱词。"
    "规则：上句（单数句）句末用仄声；下句（双数句）句末用平声且全部下句押同一韵。"
    "只输出唱词，每句一行，不要解释、不要标点以外的内容。"
)


@dataclass
class GenerationResult:
    text: str
    available: bool
    model: str | None = None
    note: str | None = None


def llm_available() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def _build_user_prompt(modern_text: str, lines: int, feedback: str | None) -> str:
    parts = [
        f"请将以下现代文字改写为 {lines} 句粤剧唱词：",
        modern_text.strip(),
    ]
    if feedback:
        parts.append(
            "上一稿存在以下平仄/押韵问题，请针对性修正后重写：\n" + feedback
        )
    return "\n\n".join(parts)


def generate(
    modern_text: str,
    *,
    lines: int = 4,
    feedback: str | None = None,
    model: str | None = None,
) -> GenerationResult:
    """Generate verse from modern text. Returns availability + text."""
    if not llm_available():
        return GenerationResult(
            text="",
            available=False,
            note="未检测到 ANTHROPIC_API_KEY，已切换为「评估模式」。"
            "设置密钥后即可启用 Claude 驱动的生成。",
        )

    chosen = model or DEFAULT_MODEL
    try:
        import anthropic  # lazy import; optional dependency
    except Exception:
        return GenerationResult(
            text="",
            available=False,
            note="已设置密钥但未安装 anthropic SDK，请 `pip install anthropic`。",
        )

    client = anthropic.Anthropic()
    message = client.messages.create(
        model=chosen,
        max_tokens=1024,
        system=_SYSTEM,
        messages=[
            {"role": "user", "content": _build_user_prompt(modern_text, lines, feedback)}
        ],
    )
    text = "".join(
        block.text for block in message.content if getattr(block, "type", "") == "text"
    ).strip()
    return GenerationResult(text=text, available=True, model=chosen)
