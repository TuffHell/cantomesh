<div align="center">

# 粤脉 · 镜 · CANTOMESH

### Neuro-symbolic 平仄 engine for Cantonese Opera (粤剧) — the AIGC core of a living-heritage ecosystem

*Greater Bay Area (粤港澳大湾区) cultural-confidence project · 非物质文化遗产活态传承*

### 🔗 Live demo → **https://tuffhell.github.io/cantomesh/**

<sub>Animated 水墨 ink-wash canvas · offline 平仄 verifier (runs entirely in your browser)</sub>

</div>

---

CANTOMESH turns modern Chinese into singable **Cantonese opera verse**, and
verifies any verse against the genuine rules of the form — **平仄 (level/oblique
tone)** and **押韵 (rhyme)** — using a transparent symbolic engine, not a black box.

This repository is the **first runnable vertical slice** of the larger CANTOMESH
mobile ecosystem (on-device segmentation, AR 寻面 face mesh, reactive 文场/武场
acoustic engine). It implements the **Cross-Era Translation** pipeline:

> **Claude drafts the verse → a symbolic 平仄/押韵 verifier judges it → violations
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
| `POST` | `/api/analyze` | `{ "text": "..." }` → 平仄/押韵 report (offline) |
| `POST` | `/api/translate` | `{ "modern_text": "...", "lines": 4 }` → generated verse + report |

Example:

```bash
curl -s localhost:8000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"text":"大湾花开千川月\n粤韵声声爱国家"}' | python3 -m json.tool
```

## How the verifier reads a couplet

```
上句 L1  大(仄) 湾(平) 花(平) 开(平) 千(平) 川(平) 月(仄)   ← ends 仄 ✓
下句 L2  粤(仄) 韵(仄) 声(平) 声(平) 爱(仄) 国(仄) 家(平)   ← ends 平 ✓  韵脚 aa
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

- [x] 平仄 / 押韵 symbolic verifier (offline, tested)
- [x] Claude-backed generate→verify→repair pipeline
- [x] Web demo + REST API
- [x] Animated public site (GitHub Pages) with browser-side 平仄 verifier
- [ ] 依字行腔 melody mapping → Singing-Voice-Synthesis guide track
- [ ] Pose-tracked 水墨 canvas service (MediaPipe BlazePose)
- [ ] Vocal & Cantonese tone-contour assessment

## Status & license

Early-stage competition prototype. **Not yet licensed** — all rights reserved
pending a deliberate license choice. Open an issue before reuse.

<sub>粤脉·镜 CANTOMESH · 唱念做打 · 文场/武场 · 平仄 · 亮相 — 让大湾区青年成为文化主权的主动持有者。</sub>
