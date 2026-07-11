// Guided pronunciation via on-device speech synthesis. Prefers a Cantonese
// (zh-HK) voice; falls back to any Chinese voice with an honest notice.
// Node-safe: every entry point guards on speechSynthesis existing.

let _voice = null, _fallback = false, _ready = false;

function pickVoice() {
  if (typeof speechSynthesis === "undefined") return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  _voice =
    voices.find((v) => /zh[-_]HK|yue/i.test(v.lang)) ||
    voices.find((v) => /Cantonese|粵|廣東/i.test(v.name)) || null;
  if (!_voice) {
    _voice = voices.find((v) => /^zh/i.test(v.lang)) || null;
    _fallback = !!_voice;
  }
  _ready = true;
}

export function speakStatus() {
  if (typeof speechSynthesis === "undefined") return "unsupported";
  if (!_ready) pickVoice();
  if (!_voice) return "novoice";
  return _fallback ? "fallback" : "ok";
}

export function speak(text, { rate = 0.9 } = {}) {
  if (typeof speechSynthesis === "undefined" || !text) return false;
  if (!_ready) pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (_voice) u.voice = _voice;
  u.lang = _voice?.lang || "zh-HK";
  u.rate = rate;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return true;
}

export const speakSlow = (text) => speak(text, { rate: 0.5 });

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
}
