"""Tests for the translation pipeline in assess-only (no API key) mode."""

from app.core.pipeline import translate


def test_assess_only_without_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    result = translate("大湾花开千川月\n粤韵声声爱国家")
    assert result["mode"] == "assess_only"
    assert result["available"] is False
    assert result["report"]["score"] == 100
    assert result["iterations"] == 0
