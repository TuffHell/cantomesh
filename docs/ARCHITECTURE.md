# CANTOMESH · Architecture (AIGC 平仄 Engine)

This repository is the **first vertical slice** of the CANTOMESH (粵脈·鏡)
ecosystem: the *Cross-Era Translation* engine from §4 of the project blueprint.
It is built so the rest of the ecosystem (on-device segmentation, AR face mesh,
acoustic engine) can be added as sibling services without re-architecting.

## The neuro-symbolic loop

```
modern text ──▶ [Claude draft]──▶ [symbolic 平仄/押韻 verifier]──┐
                     ▲                                            │ violations?
                     └──────────── feedback (re-prompt) ◀─────────┘
                                       │ valid / budget spent
                                       ▼
                                 best verse + report
```

The **neural** half (generation) is delegated to Claude. The **symbolic** half
(verification) is fully offline, deterministic, and unit-tested — it is what
makes the "the AI respects the heritage rules" claim *auditable* rather than a
matter of trust. This separation is the project's strongest answer to the
data-scarcity and authenticity critiques (§5 of the blueprint).

## Module map

| Module | Responsibility | Heavy deps |
|--------|----------------|------------|
| `app/core/tones.py` | Jyutping syllable splitting; 平/仄 classification; 九聲 tone names | none |
| `app/core/rhyme.py` | Rime extraction; rhyme-group equality | none |
| `app/core/prosody.py` | Stanza rules (上句/下句 endings, 押韻一致) + scoring | none |
| `app/core/jyutping.py` | Char→Jyutping (pycantonese if present, else bundled dict) | optional |
| `app/core/verifier.py` | Romanize + analyze a text block → JSON report | optional |
| `app/core/generator.py` | Claude-backed verse generation | optional (anthropic) |
| `app/core/pipeline.py` | generate → verify → repair orchestration | optional |
| `app/api/routes.py`, `app/main.py` | FastAPI surface + static web demo | fastapi |

The four `none`-dependency modules carry the defensible IP and are testable with
zero installs beyond pytest.

## 平仄 mapping (documented for auditability)

Cantonese Jyutping tones map to 平 / 仄 as follows:

| Tone | Category | 平/仄 |
|------|----------|-------|
| 1 (陰平) | level | **平** unless 入聲 |
| 4 (陽平) | level | **平** unless 入聲 |
| 2, 3, 5, 6 | oblique | **仄** |
| any 入聲 (-p/-t/-k coda) | checked | **仄** (override) |

The 入聲 override is musicologically required: 月 `jyut6`, 國 `gwok3`, 劇 `kek6`
are all 仄. A naive pitch-only mapping would misclassify high checked syllables
(e.g. 識 `sik1`).

## 九聲六調 tone names (for the verifier UI)

`tone_name()` resolves each syllable to its traditional Cantonese tone label so
the report can *teach*, not just gate. The system has six smooth contours plus
three entering (checked) tones:

| Jyutping tone | smooth (舒聲) | checked (入聲, -p/-t/-k) |
|---------------|--------------|--------------------------|
| 1 | 陰平 | 陰入 |
| 2 | 陰上 | — |
| 3 | 陰去 | 中入 |
| 4 | 陽平 | — |
| 5 | 陽上 | — |
| 6 | 陽去 | 陽入 |

Worked example (the classic 詩史試時市事 · 色錫食 minimal set) drives the legend on
the web demo. `verify_text` attaches `tone`, `tone_name`, and `pingze` to every
entry in `char_detail`; the field is additive, so existing consumers are
unaffected.

## Stanza rules (v1)

- **R1** 上句 (odd, 1-indexed) end on 仄.
- **R2** 下句 (even) end on 平.
- **R3** all 下句 share one rhyme group.

Each violation costs 15 points (floored at 0). Rules are intentionally
transparent and conservative; extend the rhyme groups in `rhyme.py` rather than
loosening equality.

## Roadmap (sibling slices)

1. **依字行腔 melody mapping** — derive a 梆黃 melodic skeleton from the verified
   tone contour, feeding a Singing-Voice-Synthesis guide track (§4.2).
2. **Pose / ink-wash canvas** service (§2.1) — MediaPipe BlazePose + style
   transfer, sharing this repo's FastAPI gateway.
3. **Vocal & tone assessment** (§3.2) — pitch + DTW tone-contour scoring.
