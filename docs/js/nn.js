// A from-scratch micro neural-network library (no frameworks): one shared ReLU
// trunk + independent softmax heads, trained with mini-batch Adam. Pure math on
// Float32Arrays so it runs identically in the browser and in Node tests.

// Deterministic RNG (mulberry32) — reproducible training runs.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const zeros = (n) => new Float32Array(n);

function heInit(nOut, nIn, rand) {
  const w = new Float32Array(nOut * nIn);
  const s = Math.sqrt(2 / nIn);
  for (let i = 0; i < w.length; i++) w[i] = (rand() * 2 - 1) * s;
  return w;
}

function softmax(z) {
  let m = -Infinity;
  for (const v of z) m = Math.max(m, v);
  let s = 0;
  const p = new Float32Array(z.length);
  for (let i = 0; i < z.length; i++) { p[i] = Math.exp(z[i] - m); s += p[i]; }
  for (let i = 0; i < z.length; i++) p[i] /= s;
  return p;
}

// Adam state for one tensor.
class Adam {
  constructor(n) { this.m = zeros(n); this.v = zeros(n); }
  step(w, g, lr, t) {
    const b1 = 0.9, b2 = 0.999, eps = 1e-8;
    const c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
    for (let i = 0; i < w.length; i++) {
      this.m[i] = b1 * this.m[i] + (1 - b1) * g[i];
      this.v[i] = b2 * this.v[i] + (1 - b2) * g[i] * g[i];
      w[i] -= lr * (this.m[i] / c1) / (Math.sqrt(this.v[i] / c2) + eps);
    }
  }
}

export class ToneNet {
  constructor({ inDim, hidden, heads, seed = 42 }) {
    const rand = rng(seed);
    this.inDim = inDim; this.hidden = hidden;
    this.headNames = Object.keys(heads); this.headSizes = { ...heads };
    this.W1 = heInit(hidden, inDim, rand); this.b1 = zeros(hidden);
    this.W2 = {}; this.b2 = {};
    for (const h of this.headNames) {
      this.W2[h] = heInit(heads[h], hidden, rand);
      this.b2[h] = zeros(heads[h]);
    }
    this._adam = null; this._t = 0;
  }

  _forwardTrunk(x) {
    const { hidden, inDim } = this;
    const z1 = zeros(hidden), h = zeros(hidden);
    for (let j = 0; j < hidden; j++) {
      let s = this.b1[j];
      const off = j * inDim;
      for (let i = 0; i < inDim; i++) s += this.W1[off + i] * x[i];
      z1[j] = s; h[j] = s > 0 ? s : 0;
    }
    return { z1, h };
  }

  predict(x) {
    const { h } = this._forwardTrunk(x);
    const out = {};
    for (const name of this.headNames) {
      const k = this.headSizes[name], W = this.W2[name], b = this.b2[name];
      const z = zeros(k);
      for (let j = 0; j < k; j++) {
        let s = b[j];
        const off = j * this.hidden;
        for (let i = 0; i < this.hidden; i++) s += W[off + i] * h[i];
        z[j] = s;
      }
      const probs = softmax(z);
      let arg = 0;
      for (let i = 1; i < k; i++) if (probs[i] > probs[arg]) arg = i;
      out[name] = { probs, argmax: arg };
    }
    return out;
  }

  // One mini-batch of {x, y:{head:classIdx}} → mean loss over batch & heads.
  trainBatch(batch, lr = 2e-3) {
    const { hidden, inDim } = this;
    if (!this._adam) {
      this._adam = { W1: new Adam(this.W1.length), b1: new Adam(hidden), W2: {}, b2: {} };
      for (const n of this.headNames) {
        this._adam.W2[n] = new Adam(this.W2[n].length);
        this._adam.b2[n] = new Adam(this.b2[n].length);
      }
    }
    const gW1 = zeros(this.W1.length), gb1 = zeros(hidden);
    const gW2 = {}, gb2 = {};
    for (const n of this.headNames) { gW2[n] = zeros(this.W2[n].length); gb2[n] = zeros(this.b2[n].length); }
    let loss = 0, terms = 0;

    for (const { x, y } of batch) {
      const { z1, h } = this._forwardTrunk(x);
      const dh = zeros(hidden);
      for (const name of this.headNames) {
        if (y[name] == null) continue;
        const k = this.headSizes[name], W = this.W2[name], b = this.b2[name];
        const z = zeros(k);
        for (let j = 0; j < k; j++) {
          let s = b[j];
          const off = j * hidden;
          for (let i = 0; i < hidden; i++) s += W[off + i] * h[i];
          z[j] = s;
        }
        const p = softmax(z);
        loss += -Math.log(Math.max(p[y[name]], 1e-9)); terms++;
        for (let j = 0; j < k; j++) {
          const dz = p[j] - (j === y[name] ? 1 : 0);
          const off = j * hidden;
          gb2[name][j] += dz;
          for (let i = 0; i < hidden; i++) {
            gW2[name][off + i] += dz * h[i];
            dh[i] += dz * W[off + i];
          }
        }
      }
      for (let j = 0; j < hidden; j++) {
        if (z1[j] <= 0) continue;
        const dz1 = dh[j], off = j * inDim;
        gb1[j] += dz1;
        for (let i = 0; i < inDim; i++) gW1[off + i] += dz1 * x[i];
      }
    }

    const inv = 1 / batch.length;
    for (const g of [gW1, gb1]) for (let i = 0; i < g.length; i++) g[i] *= inv;
    for (const n of this.headNames) {
      for (let i = 0; i < gW2[n].length; i++) gW2[n][i] *= inv;
      for (let i = 0; i < gb2[n].length; i++) gb2[n][i] *= inv;
    }
    this._t++;
    this._adam.W1.step(this.W1, gW1, lr, this._t);
    this._adam.b1.step(this.b1, gb1, lr, this._t);
    for (const n of this.headNames) {
      this._adam.W2[n].step(this.W2[n], gW2[n], lr, this._t);
      this._adam.b2[n].step(this.b2[n], gb2[n], lr, this._t);
    }
    return terms ? loss / terms : 0;
  }

  toJSON() {
    const arr = (a) => Array.from(a);
    return {
      inDim: this.inDim, hidden: this.hidden, heads: this.headSizes,
      W1: arr(this.W1), b1: arr(this.b1),
      W2: Object.fromEntries(this.headNames.map((n) => [n, arr(this.W2[n])])),
      b2: Object.fromEntries(this.headNames.map((n) => [n, arr(this.b2[n])])),
    };
  }
  static fromJSON(j) {
    const net = new ToneNet({ inDim: j.inDim, hidden: j.hidden, heads: j.heads });
    net.W1.set(j.W1); net.b1.set(j.b1);
    for (const n of net.headNames) { net.W2[n].set(j.W2[n]); net.b2[n].set(j.b2[n]); }
    return net;
  }
}

// ===========================================================================
// GlyphCNN — conv(F filters, K×K) → ReLU → 2×2 maxpool → dense → softmax head.
// Shared filters give translation tolerance: a phonetic component is found
// wherever it sits in the glyph — the thing a raw-pixel MLP provably missed.
// ===========================================================================
export class GlyphCNN {
  constructor({ size, filters = 10, kernel = 5, hidden = 96, classes, seed = 42 }) {
    const rand = rng(seed);
    this.S = size; this.F = filters; this.K = kernel; this.classes = classes;
    this.C = size - kernel + 1;              // conv output side
    this.P = this.C >> 1;                    // pooled side (2×2, stride 2)
    this.flat = this.F * this.P * this.P;
    this.hidden = hidden;
    this.Wc = heInit(filters, kernel * kernel, rand); this.bc = zeros(filters);
    this.W1 = heInit(hidden, this.flat, rand); this.b1 = zeros(hidden);
    this.W2 = heInit(classes, hidden, rand); this.b2 = zeros(classes);
    this._adam = null; this._t = 0;
  }

  _forward(x) {
    const { S, F, K, C, P } = this;
    const conv = new Float32Array(F * C * C);
    for (let f = 0; f < F; f++) {
      const wOff = f * K * K, b = this.bc[f];
      for (let r = 0; r < C; r++) for (let c = 0; c < C; c++) {
        let s = b;
        for (let kr = 0; kr < K; kr++) {
          const xRow = (r + kr) * S + c, wRow = wOff + kr * K;
          for (let kc = 0; kc < K; kc++) s += this.Wc[wRow + kc] * x[xRow + kc];
        }
        conv[(f * C + r) * C + c] = s;
      }
    }
    const pool = new Float32Array(this.flat);
    const argmax = new Int32Array(this.flat);
    for (let f = 0; f < F; f++) for (let r = 0; r < P; r++) for (let c = 0; c < P; c++) {
      let best = -Infinity, bi = -1;
      for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) {
        const i = (f * C + r * 2 + dr) * C + c * 2 + dc;
        if (conv[i] > best) { best = conv[i]; bi = i; }
      }
      const o = (f * P + r) * P + c;
      pool[o] = best > 0 ? best : 0;         // ReLU folded into pool output
      argmax[o] = bi;
    }
    const h = zeros(this.hidden), z1 = zeros(this.hidden);
    for (let j = 0; j < this.hidden; j++) {
      let s = this.b1[j];
      const off = j * this.flat;
      for (let i = 0; i < this.flat; i++) s += this.W1[off + i] * pool[i];
      z1[j] = s; h[j] = s > 0 ? s : 0;
    }
    const z2 = zeros(this.classes);
    for (let j = 0; j < this.classes; j++) {
      let s = this.b2[j];
      const off = j * this.hidden;
      for (let i = 0; i < this.hidden; i++) s += this.W2[off + i] * h[i];
      z2[j] = s;
    }
    return { conv, pool, argmax, z1, h, z2 };
  }

  predict(x) {
    const { z2 } = this._forward(x);
    const probs = softmax(z2);
    let arg = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[arg]) arg = i;
    return { probs, argmax: arg };
  }

  trainBatch(batch, lr = 2e-3) {
    if (!this._adam) {
      this._adam = {
        Wc: new Adam(this.Wc.length), bc: new Adam(this.F),
        W1: new Adam(this.W1.length), b1: new Adam(this.hidden),
        W2: new Adam(this.W2.length), b2: new Adam(this.classes),
      };
    }
    const gWc = zeros(this.Wc.length), gbc = zeros(this.F);
    const gW1 = zeros(this.W1.length), gb1 = zeros(this.hidden);
    const gW2 = zeros(this.W2.length), gb2 = zeros(this.classes);
    let loss = 0;
    const { S, F, K, C, P } = this;

    for (const { x, y } of batch) {
      const { pool, argmax, z1, h, z2 } = this._forward(x);
      const p = softmax(z2);
      loss += -Math.log(Math.max(p[y], 1e-9));
      const dh = zeros(this.hidden);
      for (let j = 0; j < this.classes; j++) {
        const dz = p[j] - (j === y ? 1 : 0);
        const off = j * this.hidden;
        gb2[j] += dz;
        for (let i = 0; i < this.hidden; i++) { gW2[off + i] += dz * h[i]; dh[i] += dz * this.W2[off + i]; }
      }
      const dpool = zeros(this.flat);
      for (let j = 0; j < this.hidden; j++) {
        if (z1[j] <= 0) continue;
        const dz1 = dh[j], off = j * this.flat;
        gb1[j] += dz1;
        for (let i = 0; i < this.flat; i++) { gW1[off + i] += dz1 * pool[i]; dpool[i] += dz1 * this.W1[off + i]; }
      }
      for (let o = 0; o < this.flat; o++) {
        if (pool[o] <= 0 || dpool[o] === 0) continue;   // ReLU + routed through pool argmax
        const ci = argmax[o];
        const f = Math.floor(ci / (C * C)), rc = ci % (C * C);
        const r = Math.floor(rc / C), c = rc % C;
        const d = dpool[o], wOff = f * K * K;
        gbc[f] += d;
        for (let kr = 0; kr < K; kr++) {
          const xRow = (r + kr) * S + c, wRow = wOff + kr * K;
          for (let kc = 0; kc < K; kc++) gWc[wRow + kc] += d * x[xRow + kc];
        }
      }
    }
    const inv = 1 / batch.length;
    for (const g of [gWc, gbc, gW1, gb1, gW2, gb2]) for (let i = 0; i < g.length; i++) g[i] *= inv;
    this._t++;
    this._adam.Wc.step(this.Wc, gWc, lr, this._t); this._adam.bc.step(this.bc, gbc, lr, this._t);
    this._adam.W1.step(this.W1, gW1, lr, this._t); this._adam.b1.step(this.b1, gb1, lr, this._t);
    this._adam.W2.step(this.W2, gW2, lr, this._t); this._adam.b2.step(this.b2, gb2, lr, this._t);
    return loss / batch.length;
  }

  toJSON() {
    const arr = (a) => Array.from(a);
    return { size: this.S, filters: this.F, kernel: this.K, hidden: this.hidden, classes: this.classes,
      Wc: arr(this.Wc), bc: arr(this.bc), W1: arr(this.W1), b1: arr(this.b1), W2: arr(this.W2), b2: arr(this.b2) };
  }
  static fromJSON(j) {
    const net = new GlyphCNN(j);
    net.Wc.set(j.Wc); net.bc.set(j.bc); net.W1.set(j.W1); net.b1.set(j.b1); net.W2.set(j.W2); net.b2.set(j.b2);
    return net;
  }
}
