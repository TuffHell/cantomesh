// Shared mistake deck — wrong answers from the game AND the co-learning loop
// feed one 錯題重練 practice deck, closing the learning loop across the app.
const KEY = "cantomesh.mistakes.v1";
const CAP = 30;

export function getMistakes() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function recordMistake(ch) {
  if (!ch) return;
  const list = getMistakes().filter((c) => c !== ch);
  list.unshift(ch);
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP))); } catch { /* ignore */ }
}

export function clearMistakes(chars) {
  const drop = new Set(chars);
  try { localStorage.setItem(KEY, JSON.stringify(getMistakes().filter((c) => !drop.has(c)))); } catch { /* ignore */ }
}
