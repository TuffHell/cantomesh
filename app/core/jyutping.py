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

# Curated, hand-verified fallback dictionary. Single most-common reading per
# character. Traditional-first (粵劇 is written in Traditional Chinese), with
# Simplified aliases kept so the offline path also accepts Simplified input.
# Mirrors docs/js/jyutping-data.js exactly — keep the two in sync.
_BUNDLED: dict[str, str] = {
    # 口語人稱 colloquial Cantonese pronouns & particles
    "我": "ngo5", "你": "nei5", "佢": "keoi5", "哋": "dei6",
    "嘅": "ge3", "唔": "m4", "心": "sam1", "自": "zi6", "信": "seon3",
    "知": "zi1", "思": "si1",
    # 粵劇行當/術語 opera craft & terms
    "唱": "coeng3", "念": "nim6", "做": "zou6", "打": "daa2",
    "戲": "hei3", "戏": "hei3", "劇": "kek6", "剧": "kek6",
    "曲": "kuk1", "歌": "go1", "詩": "si1", "诗": "si1", "詞": "ci4", "词": "ci4",
    "韻": "wan6", "韵": "wan6", "平": "ping4", "仄": "zak1",
    "聲": "sing1", "声": "sing1", "律": "leot6", "腔": "hong1", "板": "baan2",
    "梆": "bong1", "黃": "wong4", "黄": "wong4", "體": "tai2", "体": "tai2",
    "場": "coeng4", "场": "coeng4", "文": "man4", "武": "mou5",
    "藝": "ngai6", "艺": "ngai6", "術": "seot6", "术": "seot6",
    "色": "sik1", "音": "jam1", "字": "zi6", "句": "geoi3",
    # 九聲六調 worked example characters (詩史試時市事 · 色錫食)
    "史": "si2", "試": "si3", "试": "si3", "時": "si4", "时": "si4",
    "市": "si5", "事": "si6", "錫": "sek3", "锡": "sek3",
    "食": "sik6", "識": "sik1", "识": "sik1",
    # 大灣區/家國 Greater Bay Area & nation
    "大": "daai6", "灣": "waan1", "湾": "waan1", "區": "keoi1", "区": "keoi1",
    "港": "gong2", "澳": "ou3", "廣": "gwong2", "广": "gwong2",
    "東": "dung1", "东": "dung1", "深": "sam1",
    "中": "zung1", "華": "waa4", "华": "waa4", "國": "gwok3", "国": "gwok3",
    "家": "gaa1", "民": "man4", "族": "zuk6", "邦": "bong1",
    "興": "hing1", "兴": "hing1", "傳": "cyun4", "传": "cyun4", "承": "sing4",
    "統": "tung2", "统": "tung2", "愛": "oi3", "爱": "oi3", "化": "faa3",
    "粵": "jyut6", "粤": "jyut6", "脈": "mak6", "脉": "mak6",
    "鏡": "geng3", "镜": "geng3",
    # 山水風月 nature & imagery
    "月": "jyut6", "光": "gwong1", "花": "faa1", "開": "hoi1", "开": "hoi1",
    "江": "gong1", "河": "ho4", "山": "saan1", "水": "seoi2", "墨": "mak6",
    "風": "fung1", "风": "fung1", "雲": "wan4", "云": "wan4",
    "天": "tin1", "地": "dei6", "海": "hoi2", "春": "ceon1", "秋": "cau1",
    "雨": "jyu5", "雪": "syut3", "星": "sing1", "日": "jat6", "夜": "je6",
    "紅": "hung4", "红": "hung4", "白": "baak6", "金": "gam1", "玉": "juk6",
    "千": "cin1", "川": "cyun1", "萬": "maan6", "万": "maan6", "年": "nin4",
    "明": "ming4", "寒": "hon4", "暖": "nyun5",
    "來": "loi4", "来": "loi4", "去": "heoi3", "歸": "gwai1", "归": "gwai1",
    "回": "wui4", "望": "mong6", "鄉": "hoeng1", "乡": "hoeng1",
    "夢": "mung6", "梦": "mung6", "情": "cing4", "淚": "leoi6", "泪": "leoi6",
    "笑": "siu3", "醉": "zeoi3",
    "城": "sing4", "樓": "lau4", "楼": "lau4", "橋": "kiu4", "桥": "kiu4",
    "路": "lou6", "門": "mun4", "门": "mun4",
    "龍": "lung4", "龙": "lung4", "鳳": "fung6", "凤": "fung6",
    "梅": "mui4", "蓮": "lin4", "莲": "lin4", "桃": "tou4", "柳": "lau5", "松": "cung4",
    "滿": "mun5", "满": "mun5", "照": "ziu3", "故": "gu3", "人": "jan4",
    "代": "doi6", "復": "fuk6", "复": "fuk6", "笙": "saang1", "詠": "wing6", "咏": "wing6",
    # 戲文常用 stage & courtly vocabulary
    "上": "soeng6", "下": "haa6", "起": "hei2", "撐": "caang1", "撑": "caang1",
    "臺": "toi4", "台": "toi4", "齊": "cai4", "齐": "cai4", "裏": "leoi5", "里": "leoi5",
    "一": "jat1", "青": "cing1", "君": "gwan1", "王": "wong4",
    "帝": "dai3", "女": "neoi5",
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
