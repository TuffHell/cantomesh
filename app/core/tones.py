"""Cantonese tone analysis on Jyutping syllables.

The 平仄 (level/oblique) system is the backbone of classical Cantonese opera
versification (粵劇梆黃體). This module operates purely on Jyutping syllables so
the logic is deterministic and testable without any dictionary dependency.

Mapping (conventional Cantonese platform, documented in docs/ARCHITECTURE.md):
  - 平 (level)   : tones 1 (陰平) and 4 (陽平), when the syllable is NOT checked.
  - 仄 (oblique) : tones 2, 3, 5, 6, AND every 入聲 (checked) syllable.

入聲 (checked syllables) end in an unreleased stop -p / -t / -k and are always
仄 regardless of pitch tone — a musicologically correct refinement that a naive
tone-number mapping would get wrong (e.g. 月 jyut6, 國 gwok3, 劇 kek6).
"""

from __future__ import annotations

PING = "平"
ZE = "仄"

# Level-tone pitch categories in Jyutping (before the checked-syllable override).
PING_TONES = frozenset({1, 4})

# Jyutping initials, longest first so digraphs (ng/gw/kw) match before singles.
INITIALS = (
    "ng", "gw", "kw",
    "b", "p", "m", "f",
    "d", "t", "n", "l",
    "g", "k", "h",
    "z", "c", "s", "j", "w",
)

# Syllabic nasals stand alone with no initial.
SYLLABIC_NASALS = frozenset({"ng", "m"})

CHECKED_CODAS = ("p", "t", "k")


def strip_tone(jyutping: str) -> tuple[str, int]:
    """Return (base_without_tone, tone_number). Tone 0 means unmarked."""
    jp = jyutping.strip().lower()
    if jp and jp[-1].isdigit():
        return jp[:-1], int(jp[-1])
    return jp, 0


def split_syllable(jyutping: str) -> tuple[str, str, int]:
    """Split a Jyutping syllable into (initial, final, tone).

    Examples:
        ngo5  -> ("ng", "o", 5)
        jyut6 -> ("j", "yut", 6)
        gwong1-> ("gw", "ong", 1)
        m4    -> ("", "m", 4)   # syllabic nasal
    """
    base, tone = strip_tone(jyutping)
    if base in SYLLABIC_NASALS:
        return "", base, tone
    for initial in INITIALS:
        if base.startswith(initial):
            return initial, base[len(initial):], tone
    return "", base, tone


def tone_of(jyutping: str) -> int:
    """Return the Jyutping tone number (0 if unmarked)."""
    return strip_tone(jyutping)[1]


def is_checked(jyutping: str) -> bool:
    """True for 入聲 syllables (final ends in -p/-t/-k)."""
    _, final, _ = split_syllable(jyutping)
    return final.endswith(CHECKED_CODAS)


def ping_ze(jyutping: str) -> str:
    """Classify a Jyutping syllable as 平 (PING) or 仄 (ZE)."""
    tone = tone_of(jyutping)
    if is_checked(jyutping):
        return ZE
    return PING if tone in PING_TONES else ZE


# The 九聲六調 (nine tones / six contours) system of Cantonese. The 平聲 (level)
# tones 1 and 4 are 平; everything else is 仄. 入聲 (checked) syllables carry only
# tones 1/3/6, named 陰入 / 中入 / 陽入 — the entering-tone counterparts of the
# 陰平 / 陰去 / 陽去 contours. Surfacing these names makes the verifier teach the
# tone system, not just gate it.
_SMOOTH_TONE_NAMES = {
    1: "陰平", 2: "陰上", 3: "陰去",
    4: "陽平", 5: "陽上", 6: "陽去",
}
_CHECKED_TONE_NAMES = {1: "陰入", 3: "中入", 6: "陽入"}


def tone_name(jyutping: str) -> str | None:
    """Return the traditional Cantonese tone name (九聲), or None if unmarked."""
    tone = tone_of(jyutping)
    if tone == 0:
        return None
    if is_checked(jyutping):
        return _CHECKED_TONE_NAMES.get(tone, "入聲")
    return _SMOOTH_TONE_NAMES.get(tone)
