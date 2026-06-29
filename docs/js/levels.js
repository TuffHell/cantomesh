// Curriculum for 梨園闖關 (Pear Garden Quest).
// Each stage holds rounds whose CORRECT answer is computed live by the engine —
// level data only supplies the characters / couplets / word-banks, never the key.
// This keeps the game honest: the engine is always the source of truth.

// Round kinds:
//   tone   — "「字」平定仄？"   correct = pingZe(char)；reveal 九聲 name.
//   rhyme  — fill the 下句 末字 so it is 平收 and rhymes; bank-based.
//   verify — judge whether a couplet is 合律 (上句仄收/下句平收 etc.).

export const WORLDS = [
  {
    id: "prologue",
    name: "序章 · 啟蒙",
    subtitle: "辨平仄，識九聲",
    mask: "tongsang",
    stages: [
      {
        id: "p1", type: "tone", title: "第一關 · 平仄初辨",
        rounds: [
          { kind: "tone", char: "花" },
          { kind: "tone", char: "月" },
          { kind: "tone", char: "家" },
          { kind: "tone", char: "國" },
          { kind: "tone", char: "光" },
        ],
      },
      {
        id: "p2", type: "tone", title: "第二關 · 山水風月",
        rounds: [
          { kind: "tone", char: "山" },
          { kind: "tone", char: "水" },
          { kind: "tone", char: "風" },
          { kind: "tone", char: "雨" },
          { kind: "tone", char: "雪" },
        ],
      },
      {
        id: "p3", type: "verify", title: "第三關 · 一聯定律",
        rounds: [
          { kind: "verify", couplet: "大灣花開千川月\n粵韻聲聲愛國家" }, // 合律
          { kind: "verify", couplet: "千山香\n萬里月" },                  // 失律：上句香(平)應仄
          { kind: "verify", couplet: "月落千山靜\n花開萬里香" },          // 合律
        ],
      },
    ],
  },
  {
    id: "sang",
    name: "生 · 文武生",
    subtitle: "對下句，押其韻",
    mask: "hungsang",
    stages: [
      {
        id: "s1", type: "rhyme", title: "第四關 · 對句押韻",
        rounds: [
          { kind: "rhyme", shang: "大灣花開千川月", xiaPrefix: "粵韻聲聲愛國",
            rhymeWith: "家", bank: ["家", "月", "光", "山"] },
          { kind: "rhyme", shang: "江山如畫千年月", xiaPrefix: "粵調悠揚醉萬",
            rhymeWith: "家", bank: ["家", "葉", "水", "夜"] },
        ],
      },
      {
        id: "s2", type: "rhyme", title: "第五關 · 韻腳須平",
        rounds: [
          { kind: "rhyme", shang: "梨園燈火映青夜", xiaPrefix: "唱念做打傳千",
            rhymeWith: "家", bank: ["家", "月", "葉", "夜"] },
          { kind: "rhyme", shang: "紅船舊夢隨流水", xiaPrefix: "粵海新聲耀中",
            rhymeWith: "華", bank: ["華", "月", "夜", "雪"] },
        ],
      },
      {
        id: "s3", type: "verify", title: "第六關 · 文武合律",
        rounds: [
          { kind: "verify", couplet: "紅船舊夢\n粵韻新雪" },              // 失律：下句雪(仄)應平
          { kind: "verify", couplet: "紅船載夢渡滄海\n粵韻傳薪續百家" }, // 合律
          { kind: "verify", couplet: "花開山\n月落水" },                  // 失律：上句山(平)應仄
        ],
      },
    ],
  },
  {
    id: "daan",
    name: "旦 · 花旦",
    subtitle: "細聽聲調，分陰陽",
    mask: "huadaan",
    stages: [
      {
        id: "d1", type: "tone", title: "第七關 · 九聲入門",
        rounds: [
          { kind: "tone", char: "詩" },
          { kind: "tone", char: "時" },
          { kind: "tone", char: "市" },
          { kind: "tone", char: "識" },
          { kind: "tone", char: "食" },
        ],
      },
      {
        id: "d2", type: "rhyme", title: "第八關 · 巧對佳句",
        rounds: [
          { kind: "rhyme", shang: "桃花扇底春風暖", xiaPrefix: "粵曲聲中歲月",
            rhymeWith: "華", bank: ["華", "月", "雪", "葉"] },
          { kind: "rhyme", shang: "水袖輕揚雲外月", xiaPrefix: "氍毹一夢醉芳",
            rhymeWith: "華", bank: ["華", "夜", "雪", "山"] },
        ],
      },
      {
        id: "d3", type: "verify", title: "第九關 · 旦角試煉",
        rounds: [
          { kind: "verify", couplet: "春風夜\n秋雨花" },                  // 合律
          { kind: "verify", couplet: "月明花\n夜靜山" },                  // 失律：上句花(平)應仄
          { kind: "verify", couplet: "桃花一夢三更月\n粵韻千秋四海家" }, // 合律
        ],
      },
    ],
  },
  {
    id: "zing",
    name: "淨 · 大花面",
    subtitle: "綜合闖關，律無瑕",
    mask: "daafaa",
    stages: [
      {
        id: "z1", type: "tone", title: "第十關 · 入聲辨難",
        rounds: [
          { kind: "tone", char: "葉" },
          { kind: "tone", char: "雪" },
          { kind: "tone", char: "竹" },
          { kind: "tone", char: "綠" },
          { kind: "tone", char: "白" },
        ],
      },
      {
        id: "z2", type: "rhyme", title: "第十一關 · 家國同韻",
        rounds: [
          { kind: "rhyme", shang: "灣區一脈連山海", xiaPrefix: "粵韻千年耀國",
            rhymeWith: "家", bank: ["家", "月", "葉", "海"] },
          { kind: "rhyme", shang: "獅山珠水同明月", xiaPrefix: "港澳穗深共一",
            rhymeWith: "家", bank: ["家", "夜", "雪", "月"] },
        ],
      },
      {
        id: "z3", type: "verify", title: "終關 · 梨園宗師",
        rounds: [
          { kind: "verify", couplet: "獅山月\n珠水花" },                  // 合律
          { kind: "verify", couplet: "灣區共月連山海\n粵韻同薪續萬雪" }, // 失律：下句雪(仄)應平
          { kind: "verify", couplet: "千川月落聲聲慢\n萬里花開字字平" }, // 合律
          { kind: "verify", couplet: "家山月\n國水雪" },                  // 失律：下句雪(仄)應平
        ],
      },
    ],
  },
];

// Ordered flat list of stages for sequential unlocking.
export const STAGES = WORLDS.flatMap((w) =>
  w.stages.map((s) => ({ ...s, worldId: w.id, worldName: w.name, mask: w.mask }))
);

export const STAGE_IDS = STAGES.map((s) => s.id);

// Mask awarded when every stage of a world is cleared.
export const MASKS = {
  tongsang: { name: "童生", role: "序章", line: "啟蒙之面 · 初識平仄" },
  hungsang: { name: "紅生", role: "文武生", line: "忠勇之面 · 對句成章" },
  huadaan: { name: "花旦", role: "旦角", line: "俏麗之面 · 細辨九聲" },
  daafaa: { name: "大花面", role: "淨角", line: "剛烈之面 · 律藝大成" },
};
