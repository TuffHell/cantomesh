"""Integration tests for the text verifier (romanize -> analyze)."""

from app.core.verifier import split_lines, verify_text


def test_split_lines_on_newline_and_punctuation():
    assert split_lines("大湾花开千川月\n粤韵声声爱国家") == [
        "大湾花开千川月",
        "粤韵声声爱国家",
    ]
    assert split_lines("月光，花开。") == ["月光", "花开"]


def test_valid_couplet_scores_full():
    report = verify_text("大湾花开千川月\n粤韵声声爱国家")
    assert report["ok"] is True
    assert report["score"] == 100
    assert len(report["lines"]) == 2
    # every character in the demo couplet is covered by the bundled dictionary
    for line in report["char_detail"]:
        assert all(c["jyutping"] for c in line)


def test_report_is_json_serializable():
    import json

    report = verify_text("月光花开")
    json.dumps(report)  # must not raise
