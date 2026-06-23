"""Chinese character -> Jyutping romanization.

Coverage strategy (degrades gracefully, never hard-fails):
  1. If `pycantonese` is installed, use its dictionary for full coverage.
  2. Otherwise fall back to a small bundled map covering the offline demo set.
  3. Unknown characters return None so downstream code can report coverage gaps
     instead of guessing.

This keeps the symbolic core runnable and testable with zero heavy dependencies,
while letting a one-line `pip install pycantonese` unlock full-text coverage.
"""

from __future__ import annotations

from functools import lru_cache

# Curated, hand-verified fallback dictionary (common 粤剧/爱国 vocabulary).
# Each entry is a single most-common Jyutping reading.
_BUNDLED: dict[str, str] = {
    "我": "ngo5", "哋": "dei6", "你": "nei5", "佢": "keoi5",
    "唱": "coeng3", "粤": "jyut6", "劇": "kek6", "剧": "kek6",
    "撐": "caang1", "撑": "caang1", "起": "hei2", "心": "sam1",
    "月": "jyut6", "光": "gwong1", "愛": "oi3", "爱": "oi3",
    "國": "gwok3", "国": "gwok3", "家": "gaa1", "文": "man4",
    "化": "faa3", "自": "zi6", "信": "seon3", "大": "daai6",
    "灣": "waan1", "湾": "waan1", "區": "keoi1", "区": "keoi1",
    "青": "cing1", "年": "nin4", "戲": "hei3", "戏": "hei3",
    "臺": "toi4", "台": "toi4", "上": "soeng6", "下": "haa6",
    "句": "geoi3", "平": "ping4", "仄": "zak1", "韻": "wan6",
    "韵": "wan6", "聲": "sing1", "声": "sing1", "夢": "mung6",
    "梦": "mung6", "裏": "leoi5", "里": "leoi5", "花": "faa1",
    "開": "hoi1", "开": "hoi1", "江": "gong1", "河": "ho4",
    "千": "cin1", "川": "cyun1", "脈": "mak6", "脉": "mak6",
    "鏡": "geng3", "镜": "geng3", "一": "jat1", "齊": "cai4",
    "齐": "cai4",
}


@lru_cache(maxsize=1)
def _pycantonese_lookup():
    """Return a char->jyutping callable backed by pycantonese, or None."""
    try:
        import pycantonese  # type: ignore
    except Exception:
        return None

    def lookup(char: str) -> str | None:
        try:
            pairs = pycantonese.characters_to_jyutping(char)
        except Exception:
            return None
        if pairs and pairs[0][1]:
            jp = pairs[0][1]
            # pycantonese may return multiple syllables for a word; take the first.
            return jp[:_first_syllable_len(jp)] if len(char) == 1 else jp
        return None

    return lookup


def _first_syllable_len(jp: str) -> int:
    """Length of the first Jyutping syllable (up to and including its tone digit)."""
    for i, ch in enumerate(jp):
        if ch.isdigit():
            return i + 1
    return len(jp)


def romanize_char(char: str) -> str | None:
    """Return the Jyutping for a single character, or None if unknown."""
    lookup = _pycantonese_lookup()
    if lookup is not None:
        jp = lookup(char)
        if jp:
            return jp
    return _BUNDLED.get(char)


def romanize(text: str) -> list[tuple[str, str | None]]:
    """Romanize text, returning (char, jyutping|None) for each CJK character.

    Non-CJK characters (punctuation, spaces, latin) are skipped.
    """
    out: list[tuple[str, str | None]] = []
    for ch in text:
        if _is_cjk(ch):
            out.append((ch, romanize_char(ch)))
    return out


def _is_cjk(ch: str) -> bool:
    return "一" <= ch <= "鿿"
