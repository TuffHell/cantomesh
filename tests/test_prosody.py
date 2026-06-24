"""Unit tests for stanza-level 平仄 + 押韻 rules (operates on Jyutping directly)."""

from app.core.prosody import analyze_lines


def test_valid_couplet_passes():
    lines = [
        ["daai6", "waan1", "faa1", "hoi1", "cin1", "cyun1", "jyut6"],  # 上句 ends 仄
        ["jyut6", "wan6", "sing1", "sing1", "oi3", "gwok3", "gaa1"],   # 下句 ends 平 (aa)
        ["mung6", "leoi5"],                                            # 上句 ends 仄
        ["faa1"],                                                      # 下句 ends 平, rhymes aa
    ]
    report = analyze_lines(lines)
    assert report.ok()
    assert report.score == 100
    assert report.lines[0].role == "上句"
    assert report.lines[1].role == "下句"


def test_wrong_line_endings_flagged():
    lines = [
        ["gaa1"],   # 上句 ends 平 -> should be 仄
        ["nei5"],   # 下句 ends 仄 -> should be 平
    ]
    report = analyze_lines(lines)
    assert not report.ok()
    assert len(report.violations) == 2
    assert report.score == 70


def test_rhyme_mismatch_flagged():
    lines = [
        ["jyut6"],   # 上句 仄 ok
        ["gaa1"],    # 下句 平, rime aa
        ["jyut6"],   # 上句 仄 ok
        ["gwong1"],  # 下句 平 ok, but rime ong != aa
    ]
    report = analyze_lines(lines)
    assert len(report.violations) == 1
    assert "不押韻" in report.violations[0]


def test_unromanized_syllables_reported():
    lines = [["gaa1", None, None]]
    report = analyze_lines(lines)
    assert report.lines[0].coverage < 1.0
