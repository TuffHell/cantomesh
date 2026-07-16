<!--
  CANTOMESH · 粵脈·鏡 — competition submission copy.
  Character counts below are verified with scripts/count_chars.mjs.
  Chinese counts = every non-whitespace character (Han + punctuation + Latin letters),
  which is the convention most HK/GBA entry forms use for 字數. A "Han-only" count is
  also given in brackets for transparency.
-->

# CANTOMESH · 粵脈·鏡 — Submission Copy

Neuro-symbolic AIGC engine for Cantonese opera (粵劇): it drafts singable verse and
verifies it against the art form's genuine 平仄 / 押韻 rules with a transparent,
offline symbolic engine — the first slice of a Greater Bay Area living-heritage
ecosystem. Live demo: <https://tuffhell.github.io/cantomesh/>

---

## 1 · English introduction

Cantonese opera (粵劇) — Hong Kong's first UNESCO Intangible Cultural Heritage of
Humanity, inscribed in 2009 on the joint nomination of Guangdong, Hong Kong and
Macao — faces a quiet extinction: a core audience reported at 60 to 80 years old,
and a scriptwriting drought unbroken since master librettist Tong Dik Sang died in
1959. **CANTOMESH** is a neuro-symbolic AIGC engine that turns modern Chinese into
singable Cantonese-opera verse and then verifies it against the tradition's real
rules — 平仄 tone placement (the upper line 上句 ends oblique, the lower line 下句
ends level) and 押韻 rhyme — using a transparent, offline symbolic engine rather than
a black box. Because it operationalises the craft's own principle of **依字行腔**
("the melody follows the word"), every accepted line is provably singable and every
rule-check is auditable, so the technology honours the heritage instead of
flattening it. It is the first runnable slice of a living-heritage platform whose
later modules add melody-to-voice synthesis, AR face-mesh performance, and
tone-contour assessment for the 88-million-person Greater Bay Area.

---

## 2 · Chinese introduction (中文簡介)

### 2a · 200 characters (exactly)

> 粵劇是香港首項世界級非物質文化遺產，二〇〇九年獲聯合國教科文組織列入人類非遺；惟核心觀眾平均年齡已達六十至八十歲，好劇本與新編劇更自唐滌生以後斷層至今。CANTOMESH 神經符號引擎以人工智能起草，把現代中文化成可唱粵劇唱詞，再由透明離線符號校驗器，按梆黃體「上句收仄、下句收平」平仄與押韻逐字裁定，合律方成。它把「依字行腔」化為可驗證規則，讓科技承傳而非稀釋非遺，是大灣區活態傳承生態的第一塊拼圖。

`字數：200（含標點計；其中純漢字 174）`

### 2b · 250 characters (exactly)

> 粵劇是香港首項世界級非物質文化遺產，二〇〇九年由粵港澳三地聯合申報，經聯合國教科文組織列入人類非遺；而核心觀眾平均年齡已達六十至八十歲，年輕人多視之老套，全行最欠缺的正是好劇本與新編劇，更自唐滌生以後斷層至今。CANTOMESH 是一套神經—符號 AIGC 引擎：以人工智能把現代白話起草成可唱唱詞，再由透明離線符號校驗器，按梆黃體「上句收仄、下句收平」的平仄與押韻，逐字標註九聲六調即時評分，違律重寫，合律方成。它把「依字行腔」化為可驗證規則，讓科技承傳而非稀釋非遺，成為大灣區活態傳承生態的第一塊拼圖。

`字數：250（含標點計；其中純漢字 214）`

---

## 3 · Features by judging criterion (English)

*Each description is written to a ~200-character limit; the exact count follows each
entry.*

### Innovation and creativity in ICT
Neuro-symbolic: AI drafts, but a transparent, offline symbolic engine checks each
line against opera's real 梆黃 rules — 上句 oblique, 下句 level, level-tone rhyme.
Correct by construction, not by trust. `(chars: 197)`

### Functionality
Turns modern Chinese into singable Cantonese-opera verse, then scores each
character's 平仄, Jyutping and 九聲 tone against the real rules — deterministic,
reproducible, fully offline in the browser. `(chars: 195)`

### Market Potential / Performance
Cantonese opera is UNESCO heritage shared by the 88-million Greater Bay Area; Hong
Kong's own committee names training playwrights and young audiences as top
priorities, backed by a HK$200M fund. `(chars: 195)`

### Internal User Buy-in / public acceptance
Three governments co-nominated the art to UNESCO; practitioners say the sector most
lacks new scripts and writers — the gap this fills. Rule-based, not a black box, it
earns tradition-bearers' trust. `(chars: 199)`

### Benefits and impact
Attacks both sides of the crisis: it lowers the barrier to structurally valid new
librettos and gives a phone-native generation a way in. Enforcing real rules
preserves rather than dilutes heritage. `(chars: 198)`

### Quality
Every claim is checked against primary sources — UNESCO's ICH record, HKSAR and
LegCo releases, a peer-reviewed 2024 study — softer figures flagged 'reported'. The
core is ~200 lines of tested code. `(chars: 198)`

---

## Sources
- UNESCO ICH — *Yueju (Cantonese opera)*, file 00203, inscribed 2009 (decision 4.COM 13.27): <https://ich.unesco.org/en/RL/yueju-opera-00203>
- HKSAR Government press release, 2 Oct 2009 (first world ICH item): <https://www.info.gov.hk/gia/general/200910/02/P200910020281.htm>
- Legislative Council reply, 18 Dec 2024 (Development Fund ~HK$200M / 1,200+ projects; sector priorities): <https://www.info.gov.hk/gia/general/202412/18/P2024121800305.htm>
- Wen Wei Po, 5 Nov 2021 (audience age 60–80; scripts the #1 shortage): <https://www.wenweipo.com/a/202111/05/AP618444a0e4b0c0f6bc938da5.html>
- Luo et al., *Humanities & Social Sciences Communications*, 2024 (1,916 Bilibili videos): <https://www.nature.com/articles/s41599-024-03537-w>
- Greater Bay Area overview (11 cities, ~88M): <https://www.bayarea.gov.hk/en/about/overview.html>
