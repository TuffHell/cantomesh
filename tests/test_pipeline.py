"""Tests for the translation pipeline in assess-only (no API key) mode."""

from app.core.pipeline import translate


def test_assess_only_without_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    result = translate("大灣花開千川月\n粵韻聲聲愛國家")
    assert result["mode"] == "assess_only"
    assert result["available"] is False
    assert result["report"]["score"] == 100
    assert result["iterations"] == 0
