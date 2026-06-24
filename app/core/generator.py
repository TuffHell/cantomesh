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
    "你是一位粵劇撰曲名家，精通梆黃體、依字行腔、平仄與押韻。"
    "你將現代白話或流行歌詞改寫為地道的粵劇唱詞。"
    "規則：上句（單數句）句末用仄聲；下句（雙數句）句末用平聲，且全部下句押同一韻。"
    "一律以繁體中文書寫；只輸出唱詞，每句一行，不要解釋、不要標點以外的內容。"
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
        f"請將以下現代文字改寫為 {lines} 句粵劇唱詞：",
        modern_text.strip(),
    ]
    if feedback:
        parts.append(
            "上一稿存在以下平仄／押韻問題，請針對性修正後重寫：\n" + feedback
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
            note="未偵測到 ANTHROPIC_API_KEY，已切換為「評估模式」。"
            "設置密鑰後即可啟用 Claude 驅動的生成。",
        )

    chosen = model or DEFAULT_MODEL
    try:
        import anthropic  # lazy import; optional dependency
    except Exception:
        return GenerationResult(
            text="",
            available=False,
            note="已設置密鑰但未安裝 anthropic SDK，請 `pip install anthropic`。",
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
