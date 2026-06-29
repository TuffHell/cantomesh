"""Unit tests for Jyutping tone / 平仄 classification."""

from app.core.tones import (
    PING,
    ZE,
    is_checked,
    ping_ze,
    split_syllable,
    tone_name,
    tone_of,
)


def test_split_handles_digraph_initials():
    assert split_syllable("ngo5") == ("ng", "o", 5)
    assert split_syllable("gwong1") == ("gw", "ong", 1)
    assert split_syllable("kwaang1") == ("kw", "aang", 1)


def test_split_handles_syllabic_nasals():
    assert split_syllable("m4") == ("", "m", 4)
    assert split_syllable("ng5") == ("", "ng", 5)


def test_tone_of_reads_trailing_digit():
    assert tone_of("nei5") == 5
    assert tone_of("ho4") == 4
    assert tone_of("aa") == 0  # unmarked


def test_checked_syllables_detected():
    assert is_checked("jyut6") is True   # 月  -t coda
    assert is_checked("gwok3") is True   # 國  -k coda
    assert is_checked("kek6") is True    # 劇  -k coda
    assert is_checked("gaa1") is False   # 家


def test_level_tones_are_ping():
    assert ping_ze("ping4") == PING      # 平 (tone 4)
    assert ping_ze("gaa1") == PING       # 家 (tone 1)


def test_oblique_tones_are_ze():
    assert ping_ze("nei5") == ZE         # 你 (tone 5)
    assert ping_ze("oi3") == ZE          # 愛 (tone 3)


def test_checked_overrides_level_tone():
    # 月 is jyut6 -> tone 6 already 仄, but the override matters for tone-1 入聲.
    assert ping_ze("jyut6") == ZE
    assert ping_ze("sik1") == ZE         # 識 high 入聲, tone 1 but checked -> 仄


def test_tone_name_九聲():
    assert tone_name("si1") == "陰平"     # 詩
    assert tone_name("si4") == "陽平"     # 時
    assert tone_name("si6") == "陽去"     # 事
    assert tone_name("sik1") == "陰入"    # 識 (checked tone 1)
    assert tone_name("sik6") == "陽入"    # 食 (checked tone 6)
    assert tone_name("aa") is None        # unmarked
