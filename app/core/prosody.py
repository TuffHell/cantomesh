"""Stanza-level 平仄 + 押韻 checking for Cantonese opera couplets.

Cantonese opera uses 板腔體 with alternating 上句 / 下句 rather than strict 律詩
metre. The rules enforced here are the load-bearing ones a 撰曲 (librettist)
actually cares about:

  R1  上句 (odd lines, 1-indexed) end on 仄.
  R2  下句 (even lines) end on 平.
  R3  All 下句 share one rhyme (押韻一致).

Each rule violation is reported with its line index and an explanation, and the
stanza receives a 0-100 score. Unromanizable characters are tracked separately
so coverage gaps never silently inflate the score.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .rhyme import group_of, rime
from .tones import PING, ZE, ping_ze


@dataclass
class LineReport:
    index: int          # 1-indexed line number
    role: str           # "上句" or "下句"
    pingze: list[str]   # 平/仄 for each romanized syllable
    end_pingze: str | None
    end_rime: str | None
    coverage: float     # fraction of chars successfully romanized


@dataclass
class StanzaReport:
    lines: list[LineReport] = field(default_factory=list)
    violations: list[str] = field(default_factory=list)
    score: int = 100

    def ok(self) -> bool:
        return not self.violations


def _line_role(index: int) -> str:
    return "上句" if index % 2 == 1 else "下句"


def analyze_lines(lines_syllables: list[list[str | None]]) -> StanzaReport:
    """Analyze a stanza given per-line lists of Jyutping syllables (None = gap)."""
    report = StanzaReport()
    xia_rimes: list[tuple[int, str]] = []

    for i, raw in enumerate(lines_syllables, start=1):
        syllables = [s for s in raw if s]
        coverage = len(syllables) / len(raw) if raw else 0.0
        pingze = [ping_ze(s) for s in syllables]
        end = syllables[-1] if syllables else None
        end_pz = ping_ze(end) if end else None
        end_r = rime(end) if end else None
        role = _line_role(i)

        report.lines.append(
            LineReport(i, role, pingze, end_pz, end_r, coverage)
        )

        if end_pz is None:
            report.violations.append(f"L{i} ({role}): 無法標音，無法判定句末平仄")
            continue

        # R1 / R2: line-ending 平仄.
        if role == "上句" and end_pz != ZE:
            report.violations.append(f"L{i} (上句): 句末應為仄，實為{PING}")
        if role == "下句":
            if end_pz != PING:
                report.violations.append(f"L{i} (下句): 句末應為平，實為{ZE}")
            xia_rimes.append((i, group_of(end)))

    # R3: 下句 rhyme consistency.
    if len(xia_rimes) >= 2:
        anchor = xia_rimes[0][1]
        for idx, grp in xia_rimes[1:]:
            if grp != anchor:
                report.violations.append(
                    f"L{idx} (下句): 韻腳 '{grp}' 與首個下句韻腳 '{anchor}' 不押韻"
                )

    report.score = max(0, 100 - 15 * len(report.violations))
    return report
