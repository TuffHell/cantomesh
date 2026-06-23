"""Cantonese rhyme (押韻) analysis on Jyutping syllables.

In Cantonese opera the rhyme of the 下句 (consequent lines) must be consistent —
this is what a listener perceives as 押韻. We define the rhyming unit as the
*rime*: the Jyutping final (everything after the initial), ignoring tone.

v1 uses exact-final equality. The 韻轍 (rhyme-group) layer that merges
near-finals into the traditional classes is left as a documented extension point
(group_of) so the rule set stays transparent and auditable.
"""

from __future__ import annotations

from .tones import split_syllable

# Coarse 韻轍-style groups: finals that traditionally rhyme together in performance.
# v1 is intentionally conservative; extend these sets, do not loosen equality.
_RHYME_GROUPS: dict[str, frozenset[str]] = {
    "aa": frozenset({"aa", "a"}),
    "ang": frozenset({"ang", "aang"}),
    "oeng": frozenset({"oeng", "eng"}),
}


def rime(jyutping: str) -> str:
    """Return the rime (Jyutping final, tone stripped) used for rhyming."""
    _, final, _ = split_syllable(jyutping)
    return final


def group_of(jyutping: str) -> str:
    """Return a rhyme-group key for a syllable (falls back to the bare rime)."""
    r = rime(jyutping)
    for key, members in _RHYME_GROUPS.items():
        if r in members:
            return key
    return r


def rhymes(a: str, b: str) -> bool:
    """True if two Jyutping syllables rhyme (same rhyme group)."""
    return group_of(a) == group_of(b)
