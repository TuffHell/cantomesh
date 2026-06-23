"""Smoke tests for the HTTP API."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "llm_available" in body


def test_analyze_endpoint():
    r = client.post("/api/analyze", json={"text": "大灣花開千川月\n粵韻聲聲愛國家"})
    assert r.status_code == 200
    assert r.json()["score"] == 100


def test_translate_assess_only(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    r = client.post("/api/translate", json={"modern_text": "月光花開"})
    assert r.status_code == 200
    assert r.json()["mode"] in {"assess_only", "generate"}
