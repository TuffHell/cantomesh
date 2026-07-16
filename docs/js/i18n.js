// Lightweight bilingual toggle (繁體中文 ⇄ English).
//
// The Traditional-Chinese copy is authored INLINE in index.html — it is the
// authentic default and the page stays fully meaningful with JavaScript off.
// On load we snapshot each [data-i18n] element's Chinese innerHTML, and this file
// supplies only the English overrides. Toggling swaps innerHTML on the *same*
// element, so layout/display type never changes. Missing keys gracefully keep 中文.

const EN = {
  // — top bar / nav —
  "nav.vision": "Vision",
  "nav.verify": "Verify",
  "nav.ecosystem": "Ecosystem",
  "nav.tech": "Tech",
  "auth.signin": "Sign in with Google",
  "auth.signout": "Sign out",

  // — hero —
  "hero.tagline":
    'Let the youth of the Greater Bay Area become <span class="draw">active holders of cultural sovereignty</span>. A neuro-symbolic engine: Claude drafts, and a symbolic checker judges every line against the real 平仄 (tone) and 押韻 (rhyme) rules of Cantonese-opera 梆黃 versification.',
  "hero.cta1": "Verify a verse ↓",
  "hero.cta2": "Why it matters",
  "hero.stat1": "UNESCO Intangible Cultural Heritage of Humanity",
  "hero.stat1b": "Cantonese opera, inscribed 2009 — Hong Kong's first world heritage item",
  "hero.stat2": "60–80",
  "hero.stat2b": "reported average age of today's core audience — a generation from vanishing",
  "hero.stat3": "HK$200M",
  "hero.stat3b": "granted to 1,200+ projects — yet 'good scripts' remain the sector's #1 shortage",

  // — vision —
  "vision.eyebrow": "① Vision · The Problem",
  "vision.h": "A UNESCO art form, one generation from silence",
  "vision.lead":
    "Cantonese opera (粵劇) has been on UNESCO's Representative List of the Intangible Cultural Heritage of Humanity since 2009 — yet its audience is ageing and new librettos have all but dried up. CANTOMESH targets exactly the two gaps the Hong Kong Government itself names as most urgent: the creative pipeline, and young audiences.",
  "vision.c1.cap": "Hong Kong's first world heritage",
  "vision.c1.p":
    "Inscribed by UNESCO in 2009 (decision 4.COM 13.27), jointly nominated by Guangdong, Hong Kong and Macao — the first world intangible cultural heritage item Hong Kong ever held.",
  "vision.c2.cap": "An ageing audience",
  "vision.c2.p":
    "Sector advocates report the core audience is now 60 to 80 years old. Most of the younger generation see the art as 'old-fashioned' — a widening intergenerational gap.",
  "vision.c3.cap": "A scriptwriting drought",
  "vision.c3.p":
    "The industry's most-cited shortage is good scripts and new playwrights — a 'break in the lineage' (斷層) unbroken since master librettist Tong Dik Sang (唐滌生) died in 1959.",
  "vision.c4.cap": "Public money, unmet need",
  "vision.c4.p":
    "The Cantonese Opera Development Fund has granted about HK$200M to over 1,200 projects, and the Government's advisory committee names training playwrights and building young audiences as top priorities.",

  // — how it works —
  "how.eyebrow": "② How it works · The neuro-symbolic loop",
  "how.h": "Creative AI, judged by the genuine rules",
  "how.lead":
    "The neural half is creative; the symbolic half is deterministic, offline and unit-tested — so heritage rules are enforced, not approximated. Draft → verify → repair, until every line is provably singable.",
  "how.s1.t": "Draft",
  "how.s1.p": "Claude turns modern Chinese into candidate Cantonese-opera verse — the creative, generative half.",
  "how.s1.tag": "neural · generative",
  "how.s2.t": "Verify",
  "how.s2.p": "A transparent symbolic engine scores every line against 平仄 and 押韻 — offline, deterministic, auditable.",
  "how.s2.tag": "symbolic · deterministic",
  "how.s3.t": "Repair",
  "how.s3.p": "Violations are fed back for a rewrite, and the loop repeats until the verse passes — or reports honestly why it can't.",
  "how.s3.tag": "feedback loop",
  "how.note":
    "You can run the whole loop offline. Generation calls Claude when an <code>ANTHROPIC_API_KEY</code> is present; without one the engine degrades to a still-useful assess-only mode. The verifier below runs <strong>entirely in your browser</strong>.",

  // — verify —
  "verify.eyebrow": "③ Verify · 平仄 check",
  "verify.h": "Judge every character — tone and rhyme",
  "verify.hint":
    "Paste any Chinese verse. The engine annotates each character with its 平/仄, Jyutping and 九聲 tone, then scores it by the rules. It runs entirely offline — symbolic rules are auditable heritage integrity.",
  "verify.btn": "Check 平仄",
  "verify.ex": "Examples",
  "verify.legend.ping": "陰平 · 陽平 (non-checked)",
  "verify.legend.ze": "上 · 去 · 入 (checked)",
  "verify.tones.summary": "九聲六調 · the Cantonese tone system",
  "verify.tones.p":
    "Cantonese has 'nine tones, six contours': six smooth tones plus three checked (入聲) tones ending in -p/-t/-k. The 平/仄 split rests entirely on this.",
  "verify.save": "★ Save",
  "verify.copy": "Copy report",
  "verify.rule":
    "Rule of the couplet: the upper line (上句) ends oblique (仄), the lower line (下句) ends level (平), and rhyme is carried by the level-tone endings of the lower lines.",

  // — collection —
  "coll.h": "My verse collection · 我的唱詞集",
  "coll.hint.local": "Saved in this browser. Sign in with Google to sync across devices.",
  "coll.hint.cloud": "Synced to your Google account.",
  "coll.empty": "No saved verses yet — check a verse above and press ★ Save.",

  // — translate note —
  "translate.eyebrow": "Cross-era translation · 跨代翻譯",
  "translate.h": "Modern words → Cantonese-opera verse",
  "translate.p":
    "Turn modern speech or lyrics into idiomatic verse through the <strong>draft → verify → repair</strong> loop. Generation needs an API key and runs on the <a href=\"https://github.com/tuffhell/cantomesh\" target=\"_blank\" rel=\"noopener\">FastAPI backend</a>; this public page focuses on the offline 平仄 verifier.",
  "translate.run":
    "Run locally: <code>uvicorn app.main:app --reload</code> · set <code>ANTHROPIC_API_KEY</code> to enable generation. See the <a href=\"https://github.com/tuffhell/cantomesh#quickstart\" target=\"_blank\" rel=\"noopener\">repo</a>.",

  // — ecosystem —
  "eco.eyebrow": "④ Ecosystem · Roadmap",
  "eco.h": "One slice of a living-heritage ecosystem",
  "eco.lead":
    "This 平仄 engine is the first runnable slice of a wider Greater Bay Area platform for living transmission (活態傳承) — each future module plugs into the same gateway.",
  "eco.m1.phase": "SHIPPED · now",
  "eco.m1.t": "平仄 / 押韻 verification engine",
  "eco.m1.p": "Offline, unit-tested symbolic verifier with 九聲六調 annotation, plus a Claude-backed generate→verify→repair pipeline and this public site.",
  "eco.m2.phase": "NEXT",
  "eco.m2.t": "依字行腔 melody mapping → singing-voice synthesis",
  "eco.m2.p": "Derive a 梆黃 melodic skeleton from the verified tone contour, feeding a singing-voice guide track — turning verified verse into something you can hear.",
  "eco.m3.phase": "PLANNED",
  "eco.m3.t": "AR 尋面 face mesh + motion-tracked 水墨 canvas",
  "eco.m3.p": "On-device face mesh and pose-tracked ink-wash performance, bringing the stage craft (做打 · 亮相) into an interactive, phone-native experience.",
  "eco.m4.phase": "PLANNED",
  "eco.m4.t": "Vocal & tone-contour assessment",
  "eco.m4.p": "Pitch and DTW tone-contour scoring so learners get objective feedback on singing and Cantonese tones — closing the teaching loop.",

  // — tech —
  "tech.eyebrow": "⑤ Why it wins",
  "tech.h": "Auditable authenticity, not a black box",
  "tech.lead": "Six design choices that make CANTOMESH defensible to a technical judge and trustworthy to a tradition-bearer.",
  "tech.f1.t": "Neuro-symbolic & auditable",
  "tech.f1.p": "Rules live in ~200 lines of dependency-free, tested Python. A judge can read exactly why 月 jyut6 is classified 仄 — no black box.",
  "tech.f2.t": "Zero data, zero key",
  "tech.f2.p": "The symbolic verifier needs no training corpus and no network. A bundled Jyutping fallback means even romanization needs no heavy install.",
  "tech.f3.t": "It teaches the tones",
  "tech.f3.p": "Every glyph is annotated with its full 九聲六調 tone name (陰平…陽入) and Jyutping — the engine teaches the tone system, not just gates on it.",
  "tech.f4.t": "Traditional Chinese to the bone",
  "tech.f4.p": "The UI and corpus are Traditional Chinese — the script Cantonese opera is actually written in — with Simplified accepted on input.",
  "tech.f5.t": "Honest about the AI",
  "tech.f5.p": "Generation uses Claude only when a key is present; otherwise it degrades to assess-only. The claims are sourced and stake-able, softer figures flagged.",
  "tech.f6.t": "Built for the whole ecosystem",
  "tech.f6.p": "A FastAPI gateway the AR mesh, acoustic engine and assessment modules all attach to — a platform, not a one-off demo.",

  // — footer —
  "footer.tagline": "唱念做打 · 文場／武場 · 平仄 · 亮相 — living-heritage transmission · on-device multimodal AI ecosystem",
  "footer.sources": "Sources: UNESCO ICH file 00203 · HKSAR Government press release (2 Oct 2009) · LegCo reply (18 Dec 2024) · Wen Wei Po (2021) · Luo et al., Humanities & Social Sciences Communications (2024).",
};

const nodes = () => document.querySelectorAll("[data-i18n]");
const zhCache = new Map();
const STORE_KEY = "cantomesh:lang";

function snapshotZh() {
  nodes().forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!zhCache.has(key)) zhCache.set(key, el.innerHTML);
  });
}

export function setLang(lang) {
  const en = lang === "en";
  nodes().forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (en && EN[key] != null) el.innerHTML = EN[key];
    else if (!en && zhCache.has(key)) el.innerHTML = zhCache.get(key);
  });
  document.documentElement.lang = en ? "en" : "zh-Hant-HK";
  document.querySelectorAll(".lang-toggle button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
  );
  try {
    localStorage.setItem(STORE_KEY, lang);
  } catch {}
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

export function currentLang() {
  try {
    return localStorage.getItem(STORE_KEY) || "zh";
  } catch {
    return "zh";
  }
}

export function initI18n() {
  snapshotZh();
  document.querySelectorAll(".lang-toggle button").forEach((b) =>
    b.addEventListener("click", () => setLang(b.dataset.lang))
  );
  setLang(currentLang());
}
