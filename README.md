<div align="center">

# 粵脈 · 鏡 · CANTOMESH

### Neuro-symbolic 平仄 engine for Cantonese Opera (粵劇) — the AIGC core of a living-heritage ecosystem

*Greater Bay Area (粵港澳大灣區) cultural-confidence project · 非物質文化遺產活態傳承*

### 🔗 Live demo → **https://tuffhell.github.io/cantomesh/**

<sub>Animated 水墨 ink-wash canvas · offline 平仄 verifier (runs entirely in your browser)</sub>

</div>

---

CANTOMESH turns modern Chinese into singable **Cantonese opera verse**, and
verifies any verse against the genuine rules of the form — **平仄 (level/oblique
tone)** and **押韻 (rhyme)** — using a transparent symbolic engine, not a black box.

This repository is the **first runnable vertical slice** of the larger CANTOMESH
mobile ecosystem (on-device segmentation, AR 尋面 face mesh, reactive 文場/武場
acoustic engine). It implements the **Cross-Era Translation** pipeline:

> **Claude drafts the verse → a symbolic 平仄/押韻 verifier judges it → violations
> are fed back for repair.** The neural half is creative; the symbolic half is
> deterministic, offline, and unit-tested — so the heritage rules are *enforced,
> not approximated.*

## Why this design wins the technical argument

- **Auditable authenticity.** The 平仄/rhyme rules live in ~200 lines of
  dependency-free, tested Python ([`app/core`](app/core)). A judge can read
  exactly how 月 `jyut6` is classified 仄. (See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).)
- **Runs with zero data and zero key.** No training corpus required; the symbolic
  verifier works offline. The bundled Jyutping fallback means even romanization
  needs no heavy install.
- **Cantonese to the bone.** The UI and bundled corpus are Traditional Chinese —
  the script Cantonese opera is actually written in — and every glyph is annotated
  with its full **九聲六調** tone name (陰平…陽入) and Jyutping, so the engine
  *teaches* the tone system instead of merely gating on it.
- **Honest about the LLM.** Generation uses Claude *when a key is present*; without
  one the engine degrades to a still-useful **assess-only** mode.

## Quickstart

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt        # core + test deps
pytest -q                                  # ✅ symbolic engine is verified offline

uvicorn app.main:app --reload              # then open http://127.0.0.1:8000/
```

Enable Claude-backed generation:

```bash
cp .env.example .env        # add ANTHROPIC_API_KEY=...
export ANTHROPIC_API_KEY=sk-ant-...
pip install anthropic pycantonese   # generation + full Jyutping coverage
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health` | status + whether the LLM is configured |
| `POST` | `/api/analyze` | `{ "text": "..." }` → 平仄/押韻 report (offline) |
| `POST` | `/api/translate` | `{ "modern_text": "...", "lines": 4 }` → generated verse + report |

Example:

```bash
curl -s localhost:8000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"大灣花開千川月\n粵韻聲聲愛國家"}' | python3 -m json.tool
```

## How the verifier reads a couplet

```
上句 L1  大(仄) 灣(平) 花(平) 開(平) 千(平) 川(平) 月(仄)   ← ends 仄 ✓
下句 L2  粵(仄) 韻(仄) 聲(平) 聲(平) 愛(仄) 國(仄) 家(平)   ← ends 平 ✓  韻腳 aa
                                                          score: 100 / 100
```

## Project structure

```
app/
  core/        symbolic engine (tones · rhyme · prosody) + neural generator + pipeline
  api/         FastAPI routes
  models/      pydantic schemas
  main.py      app entrypoint (serves the web demo)
web/index.html single-file ink-wash demo UI
tests/         deterministic unit + API tests
docs/          ARCHITECTURE.md
```

## Roadmap

- [x] 平仄 / 押韻 symbolic verifier (offline, tested)
- [x] Claude-backed generate→verify→repair pipeline
- [x] Web demo + REST API
- [x] Animated public site (GitHub Pages) — Traditional-Chinese / Cantonese UI, browser-side 平仄 verifier with 九聲六調 annotation
- [ ] 依字行腔 melody mapping → Singing-Voice-Synthesis guide track
- [ ] Pose-tracked 水墨 canvas service (MediaPipe BlazePose)
- [ ] Vocal & Cantonese tone-contour assessment

## Status & license

Early-stage competition prototype. **Not yet licensed** — all rights reserved
pending a deliberate license choice. Open an issue before reuse.

<sub>粵脈·鏡 CANTOMESH · 唱念做打 · 文場/武場 · 平仄 · 亮相 — 讓大灣區青年成為文化主權的主動持有者。</sub>
