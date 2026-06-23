"""Integration tests for the text verifier (romanize -> analyze)."""

from app.core.verifier import split_lines, verify_text


def test_split_lines_on_newline_and_punctuation():
    assert split_lines("大灣花開千川月\n粵韻聲聲愛國家") == [
        "大灣花開千川月",
        "粵韻聲聲愛國家",
    ]
    assert split_lines("月光，花開。") == ["月光", "花開"]


def test_valid_couplet_scores_full():
    report = verify_text("大灣花開千川月\n粵韻聲聲愛國家")
    assert report["ok"] is True
    assert report["score"] == 100
    assert len(report["lines"]) == 2
    # every character in the demo couplet is covered by the bundled dictionary
    for line in report["char_detail"]:
        assert all(c["jyutping"] for c in line)


def test_char_detail_carries_tone_metadata():
    # The 九聲 tone name and 平/仄 ride along with each romanized character.
    report = verify_text("大灣")
    first = report["char_detail"][0][0]
    assert first["char"] == "大"
    assert first["jyutping"] == "daai6"
    assert first["tone"] == 6
    assert first["tone_name"] == "陽去"
    assert first["pingze"] == "仄"


def test_report_is_json_serializable():
    import json

    report = verify_text("月光花開")
    json.dumps(report)  # must not raise
