"""Verify a block of Chinese verse against Cantonese 平仄 + 押韻 rules.

This is the symbolic half of the neuro-symbolic pipeline: deterministic, offline,
and the component that makes the "AI respects heritage" claim auditable.
"""

from __future__ import annotations

import re
from dataclasses import asdict

from .jyutping import romanize
from .prosody import StanzaReport, analyze_lines
from .tones import ping_ze, tone_name, tone_of

# Split on hard newlines and CJK line punctuation.
_LINE_SPLIT = re.compile(r"[\n，,。；;！!？?]+")


def split_lines(text: str) -> list[str]:
    return [ln.strip() for ln in _LINE_SPLIT.split(text) if ln.strip()]


def _char_entry(char: str, jp: str | None) -> dict:
    """Per-character report row: romanization, 平/仄, and the 九聲 tone name."""
    if not jp:
        return {"char": char, "jyutping": None, "tone": None,
                "tone_name": None, "pingze": None}
    return {
        "char": char,
        "jyutping": jp,
        "tone": tone_of(jp),
        "tone_name": tone_name(jp),
        "pingze": ping_ze(jp),
    }


def verify_text(text: str) -> dict:
    """Romanize, run prosody analysis, and return a JSON-serializable report."""
    lines = split_lines(text)
    per_line_syllables: list[list[str | None]] = []
    char_detail: list[list[dict]] = []

    for line in lines:
        pairs = romanize(line)
        per_line_syllables.append([jp for _, jp in pairs])
        char_detail.append([_char_entry(c, jp) for c, jp in pairs])

    report: StanzaReport = analyze_lines(per_line_syllables)

    return {
        "lines": [asdict(ln) for ln in report.lines],
        "char_detail": char_detail,
        "violations": report.violations,
        "score": report.score,
        "ok": report.ok(),
    }
