"""Unit tests for rhyme (押韵) analysis."""

from app.core.rhyme import group_of, rhymes, rime


def test_rime_strips_initial_and_tone():
    assert rime("gaa1") == "aa"
    assert rime("faa3") == "aa"
    assert rime("gwong1") == "ong"


def test_same_final_rhymes():
    assert rhymes("gaa1", "faa1") is True   # 家 / 花
    assert rhymes("gaa1", "haa6") is True    # 家 / 下


def test_different_final_does_not_rhyme():
    assert rhymes("gaa1", "gwong1") is False  # 家 / 光


def test_group_falls_back_to_bare_rime():
    assert group_of("seon3") == "eon"
