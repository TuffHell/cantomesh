# 梨園闖關 · Design Specification
### A Digital-Dunhuang-style experience system for CANTOMESH (粤脉·镜)

> **North-star principle (after Digital Dunhuang):**
> *Replace the catalogue with a narrative. Don't present an archive — stage an
> emotionally resonant experience the visitor walks into.*
>
> Digital Dunhuang opens on the Mogao Caves "bathed in desert light" and invites
> you to *walk in*. Our equivalent: you don't read *about* 粤剧 — you are called by
> a master to **carry the art forward**, and you learn it by performing.

---

## 1. Design philosophy

| Principle | What it means here | Source lesson |
|-----------|--------------------|---------------|
| **Narrative over catalogue** | Every screen is a beat in a story (序 → 拜師 → 闖關 → 成師), not a list of features. | Digital Dunhuang; HKICT "Wind Goes On" (won on cultural narrative) |
| **Emotional staging** | Warm paper, ink atmosphere, a living opera figure — the room *feels* like a 戏台, not a database. | Digital Dunhuang ("staged, emotionally resonant exhibition") |
| **Measured mastery** | Learning is visible: 已習字 / 答對率 / 星. Progress is the reward loop. | OperAR, *Sci Reports* VR-opera study, HKICT "Medisafe" |
| **Depth as the moat** | The symbolic 平仄/九聲 engine is foregrounded — our edge over vocabulary-card apps. | ASIA "CantoMore" (cards won; we go deeper) |
| **Access for all** | Free, offline, no hardware. Frame it as social mission. | ASIA / Social Ventures HK |
| **Authenticity in the loop** | 传承人/master endorsement; rules are auditable, not approximated. | Heritage-gamification "cultural sensitivity" finding |

---

## 2. The experience journey (information architecture)

```
序 (Intro)          拜師 — a master 老倌 appears; 3 narrative beats; "拜師學藝"
  │                  (story-first onboarding; shown once, replayable)
  ▼
地圖 (Map / Home)    Hero (title + living opera figure) · 學藝成效 (outcomes)
  │                  · 使命 (mission) · worlds & stages (序章/生/旦/淨)
  ▼
闖關 (Play)          One challenge at a time — 辨平仄 / 對句押韻 / 判合律
  │                  Engine grades live; every answer teaches (九聲, 韻, 律).
  ▼
成就 (Result)        Stars + the celebrating figure; world-clear → 寻面 mask unlock
  │
  └─► 練功房 (Toolkit, tools.html) — the 4 power tools for serious 撰曲 work
```

**Rule:** the user is never more than one tap from *doing*. No dead "about" pages.

---

## 3. Visual design system

### 3.1 Palette (rice-paper / ink / opera pigments)
```
--bg        #ece3d2   warm rice paper      --vermilion  #b23a2e  seal / accent
--card      #faf6ec   raised paper         --gold       #a9802f  trim / stars
--ink       #221d18   text / brush         --jade       #3a6a5a  平 / correct
--line      #ddd2bd   hairlines            --ze (=verm) #b23a2e  仄 / error
```
Color is **semantic**: 平 always jade, 仄 always vermilion — across game, tools, and figures.

### 3.2 Typography
- **Display / UI:** 楷体 (`Kaiti SC`) — brush-calligraphic, ceremonial.
- **Body / verse:** 宋体 (`Songti SC` / `Noto Serif SC`) — readable, classical.
- **Romanization / data:** monospace, muted, small.
- Vertical rhythm and generous line-height (1.7–1.9) for legibility of large 汉字.

### 3.3 Motion language
- **Atmosphere:** a contained 水墨 ink canvas (drifting ribbons + cursor trails), crisp (no muddy fade), `prefers-reduced-motion` safe.
- **Reveal:** content rises + ink-blurs in (`rise`, `ink-in`).
- **The living figure:** idle breathing + blink + sleeve sway; cursor-reactive; a **亮相** (frozen pose) on tap and on win.
- **Discipline:** animate only `transform`/`opacity`/path `d`; everything degrades to static under reduced-motion.

### 3.4 Signature moments
1. **The call (序):** master figure + three fading narrative beats.
2. **Per-character 平仄 reveal:** every verse renders each 字 with its 平/仄 mark + 粤拼 + 九聲 name — the teaching *is* the visual.
3. **寻面 mask unlock:** an SVG 臉譜 materialises on world-clear (the mastery-threshold reward).
4. **The interactive performer:** poke the opera figure → it strikes a 亮相.

---

## 4. Interactive opera figures (cartoon 粤剧 performers)

- **Build:** pure SVG chibi performer (`docs/js/opera-figure.js`), role-themed (旦/生).
- **Anatomy:** painted 旦/生 face, 凤冠 headdress with swaying 翎子, robe with gold 蟒/帔 trim, and animated **水袖 (water sleeves)** as the hero element.
- **Behaviour:** idle sway + blink; **sleeves drift toward the cursor**; **亮相** flick on `pointerdown`; celebratory pose on stage-clear; auto-welcome pose from the master in the intro.
- **Performance:** one `requestAnimationFrame` loop per figure, torn down on every screen change (`clearFigures()`); reduced-motion renders a calm static pose.
- **Placement:** intro (mentor), map hero (interactive; hidden < 620px to keep mobile nav clear), result (celebration).

---

## 5. Accessibility & performance budget

- **A11y:** semantic landmarks; `aria-live` on result regions; keyboard-operable options; `noscript` fallback linking to source/tools; reduced-motion across all animation; AA contrast on the paper palette.
- **Perf (microsite budget):** JS < 80 kB excl. dictionary; the 20k-char Jyutping dict (~270 kB) is the one heavy asset and is cache-stable. No blocking fonts (system 楷/宋 stack). Targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
- **Offline:** the entire game + engine run client-side; zero backend, zero network at play time.

---

## 6. Component inventory

| Component | File | Notes |
|-----------|------|-------|
| Engine (平仄/押韵/九聲) | `js/prosody.js` | offline, parity-tested vs Python core |
| Jyutping dictionary | `js/jyutping-data.js` | 20,865 chars (pycantonese + simplified) |
| Curriculum | `js/levels.js` | worlds → stages → engine-graded rounds |
| Game state machine | `js/game.js` | screens, scoring, localStorage, stats |
| Opera figures | `js/opera-figure.js` | animated interactive performers |
| Pose scoring core | `js/pose-coach.js` | pure biomechanical 身段 rubric (unit-tested) |
| Pose trainer (AI) | `js/pose-trainer.js` | webcam → MediaPipe Pose → live scoring + silhouette ghost |
| Open data (gov) | `js/open-data.js` + `data/hk-opera-open-data.json` | data.gov.hk / LCSD venues + HK ICH inventory |
| 臉譜 masks | `js/masks.js` | SVG unlock rewards |
| Heritage scene | `js/ornaments.js` | static 山水 hero scene + 祥云 + mountain footer |
| AR face mask | `js/face-ar.js` | MediaPipe FaceLandmarker 臉譜 overlay |
| Toolkit | `tools.html` + `js/app.js` | 4 power tools (練功房) |

---

## 7. Roadmap toward a full Dunhuang-grade experience

1. **身段訓練 (movement training, ✅ v1 shipped)** — on-device MediaPipe Pose scores 山膀/順風旗/亮相 by joint-angle rubric with 亮相 hold-detection. Next: 手眼身法步 expansion, AR 脸谱 face-mesh overlay (§2.2), and reference-silhouette ghosting.
2. **Scrollytelling 序章** — replace the static intro with scroll-revealed chapters (story → why it matters → play), IntersectionObserver-driven.
2. **依字行腔 audio** — sing-back guide track so the user *hears* their verse; reactive 文场/武场 stingers on 亮相.
3. **Zoomable artifact mode** — a "walk into the 戏台" hero with explorable 行当 / 脸谱 lore (Dunhuang's zoomable-cave analogue).
4. **Measured-outcomes study** — instrument a pre/post assessment (mirroring the *Sci Reports* VR-opera RCT) to produce citable learning evidence for the pitch.
5. **传承人 credibility band** — partner endorsement + named master annotators.

---

*This spec is the design contract for the live site at
https://tuffhell.github.io/cantomesh/ — every new surface should be checkable
against §1 (narrative over catalogue) and §3 (one semantic palette, two typefaces).*
