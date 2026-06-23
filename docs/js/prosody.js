// Client-side port of the CANTOMESH symbolic engine (app/core/{tones,rhyme,prosody,verifier}.py).
// Deterministic, dependency-free, and kept output-identical to the Python core so the
// static GitHub Pages demo matches the FastAPI backend exactly.
import { BUNDLED } from "./jyutping-data.js";

export const PING = "平";
export const ZE = "仄";

const INITIALS = ["ng", "gw", "kw", "b", "p", "m", "f", "d", "t", "n", "l",
                  "g", "k", "h", "z", "c", "s", "j", "w"];
const SYLLABIC = new Set(["ng", "m"]);
const PING_TONES = new Set([1, 4]);
const CHECKED = ["p", "t", "k"];

const RHYME_GROUPS = { aa: ["aa", "a"], ang: ["ang", "aang"], oeng: ["oeng", "eng"] };
const LINE_SPLIT = /[\n，,。；;！!？?]+/;

// --- tones ---
function stripTone(jp) {
  const s = jp.trim().toLowerCase();
  const last = s.slice(-1);
  if (last >= "0" && last <= "9") return [s.slice(0, -1), parseInt(last, 10)];
  return [s, 0];
}

export function splitSyllable(jp) {
  const [base, tone] = stripTone(jp);
  if (SYLLABIC.has(base)) return ["", base, tone];
  for (const ini of INITIALS) if (base.startsWith(ini)) return [ini, base.slice(ini.length), tone];
  return ["", base, tone];
}

export function toneOf(jp) { return stripTone(jp)[1]; }

export function isChecked(jp) {
  const final = splitSyllable(jp)[1];
  return CHECKED.some((c) => final.endsWith(c));
}

export function pingZe(jp) {
  if (isChecked(jp)) return ZE;
  return PING_TONES.has(toneOf(jp)) ? PING : ZE;
}

// --- rhyme ---
export function rime(jp) { return splitSyllable(jp)[1]; }

export function groupOf(jp) {
  const r = rime(jp);
  for (const [key, members] of Object.entries(RHYME_GROUPS)) if (members.includes(r)) return key;
  return r;
}

// --- romanization ---
function isCJK(ch) { return ch >= "一" && ch <= "鿿"; }

function romanize(line) {
  const out = [];
  for (const ch of line) if (isCJK(ch)) out.push([ch, BUNDLED[ch] || null]);
  return out;
}

// --- prosody / stanza rules ---
function lineRole(i) { return i % 2 === 1 ? "上句" : "下句"; }

function analyzeLines(linesSyllables) {
  const lines = [];
  const violations = [];
  const xiaRimes = [];

  linesSyllables.forEach((raw, idx) => {
    const i = idx + 1;
    const syl = raw.filter(Boolean);
    const coverage = raw.length ? syl.length / raw.length : 0;
    const pingze = syl.map(pingZe);
    const end = syl.length ? syl[syl.length - 1] : null;
    const endPz = end ? pingZe(end) : null;
    const role = lineRole(i);

    lines.push({ index: i, role, pingze, end_pingze: endPz, end_rime: end ? rime(end) : null, coverage });

    if (endPz === null) { violations.push(`L${i} (${role}): 无法标音，无法判定句末平仄`); return; }
    if (role === "上句" && endPz !== ZE) violations.push(`L${i} (上句): 句末应为仄，实为${PING}`);
    if (role === "下句") {
      if (endPz !== PING) violations.push(`L${i} (下句): 句末应为平，实为${ZE}`);
      xiaRimes.push([i, groupOf(end)]);
    }
  });

  if (xiaRimes.length >= 2) {
    const anchor = xiaRimes[0][1];
    for (const [idx, grp] of xiaRimes.slice(1))
      if (grp !== anchor) violations.push(`L${idx} (下句): 韵脚 '${grp}' 与首个下句韵脚 '${anchor}' 不押韵`);
  }

  return { lines, violations, score: Math.max(0, 100 - 15 * violations.length) };
}

// --- public verifier (matches verify_text in Python) ---
export function splitLines(text) {
  return text.split(LINE_SPLIT).map((s) => s.trim()).filter(Boolean);
}

export function verifyText(text) {
  const lines = splitLines(text);
  const perLine = [];
  const charDetail = [];
  for (const line of lines) {
    const pairs = romanize(line);
    perLine.push(pairs.map(([, jp]) => jp));
    charDetail.push(pairs.map(([c, jp]) => ({ char: c, jyutping: jp })));
  }
  const report = analyzeLines(perLine);
  return {
    lines: report.lines,
    char_detail: charDetail,
    violations: report.violations,
    score: report.score,
    ok: report.violations.length === 0,
  };
}
