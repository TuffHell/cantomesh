// 戲文誌 — real Cantonese-opera stories that theme each quest world (the Ytong
// pattern: content immersed in myth), plus LORE: curated hard-word entries
// surfaced by the tap-a-character popover (meaning + historical context).

export const WORLD_STORIES = {
  prologue: {
    title: "帝女花", en: "Princess Changping",
    era: "唐滌生 · 1957 香港首演",
    zh: "明亡之際，長平公主與駙馬周世顯於含樟樹下訣別家國。一曲〈香夭〉，唱盡忠貞與離亂——粵劇最負盛名的絕唱。",
    en_syn: "As the Ming dynasty falls, Princess Changping and her consort bid farewell to their nation beneath the fragrant tree. Its final duet 香夭 is the most celebrated aria in all Cantonese opera.",
    tie: "由此啟蒙——先辨平仄，方能唱出〈香夭〉的抑揚。",
    tie_en: "Begin here: master 平仄 and the rise-and-fall of 香夭 opens to you.",
  },
  sang: {
    title: "紫釵記", en: "The Purple Hairpin",
    era: "湯顯祖原著 · 唐滌生改編",
    zh: "才子李益與霍小玉以紫玉釵定情，歷盡權貴阻撓，黃衫客仗義相助，有情人終成眷屬。",
    en_syn: "Scholar Li Yi and Huo Xiaoyu pledge love with a purple jade hairpin; a mysterious knight in yellow helps them defeat a scheming lord.",
    tie: "文武生之戲——對句如對劍，句句相扣。",
    tie_en: "The 文武生's opera — couplets cross like swords, line answering line.",
  },
  daan: {
    title: "再世紅梅記", en: "Red Plum, Twice Blossomed",
    era: "唐滌生絕筆 · 1959",
    zh: "書生裴禹遇美於紅梅樹下；李慧娘含冤而逝，魂魄再世，人鬼相戀，紅梅再度花開。",
    en_syn: "A wronged beauty returns from beyond to love again beneath the red plum — Tong Tik-sang's final masterpiece.",
    tie: "旦角之魂——細辨九聲，如魂魄辨舊路。",
    tie_en: "The 旦's soul: distinguish the nine tones as a spirit retraces its path.",
  },
  zing: {
    title: "單刀會", en: "Lone Blade to the Feast",
    era: "關漢卿原著 · 淨角名劇",
    zh: "關雲長單刀赴會，於千軍萬馬中談笑自若。大花面之威，盡在一聲亮相。",
    en_syn: "Guan Yu attends his enemy's banquet armed with a single blade — the painted-face role at its most thunderous.",
    tie: "淨角之膽——律法嚴明，一步不讓。",
    tie_en: "The 淨's nerve: metre as iron discipline, yielding nothing.",
  },
};

// Curated hard words: tap → meaning + historical context (beyond dictionary).
export const LORE = {
  "香": { word: "香夭", jp: "hoeng1 jiu1", zh: "《帝女花》終曲。「夭」謂早逝——花燭之夜同殉家國，是粵劇最著名的唱段。", en: "The final duet of Princess Changping — wedding and death in one night; the most famous aria in the repertoire." },
  "夭": { word: "香夭", jp: "hoeng1 jiu1", zh: "夭：早逝。〈香夭〉以花燭之夜殉國，哀而不傷。", en: "夭 means an early death — the aria mourns a nation with wedding candles lit." },
  "釵": { word: "紫釵", jp: "zi2 caai1", zh: "釵：古代婦女髮飾，常作定情信物。《紫釵記》以一支紫玉釵貫穿悲歡。", en: "A hairpin — a classic love token; the purple jade hairpin binds the whole opera." },
  "袖": { word: "水袖", jp: "seoi2 zau6", zh: "戲服延長的白綢袖。甩、抖、揚、抓，皆是功夫——「水袖功」是身段的靈魂。", en: "The long white 'water sleeves' — flicked, tossed and caught; sleeve-work is the soul of stage movement." },
  "翎": { word: "翎子", jp: "ling4 zi2", zh: "盔頭上的雉雞尾翎，長逾六尺。武將轉頭甩翎，是威風也是絕技。", en: "Six-foot pheasant plumes on the helmet; whipping them with a head-turn is both menace and mastery." },
  "亮": { word: "亮相", jp: "loeng6 soeng3", zh: "動作至高潮處驟然定格，配鑼鼓一擊。源自武術收勢，攝住全場呼吸。", en: "The sudden freeze at a climax, nailed by a gong-stroke — borrowed from martial forms." },
  "蟒": { word: "蟒袍", jp: "mong5 pou4", zh: "帝王將相的禮服，繡蟒（四爪龍）紋。顏色分等：黃者至尊。", en: "The python robe of emperors and generals — four-clawed dragons; yellow marks the highest rank." },
  "靠": { word: "大靠", jp: "daai6 kaau3", zh: "武將鎧甲戲服，背插四面靠旗。旗越多，將越猛。", en: "Stage armour with four banner flags on the back — more flags, fiercer general." },
  "胡": { word: "高胡", jp: "gou1 wu4", zh: "粵劇頭架樂器，兩弦高音胡琴，1920 年代由呂文成改良，音色清亮如珠江晨光。", en: "The lead two-string fiddle of Cantonese music, refined by Lui Man-shing in the 1920s." },
  "鑼": { word: "大鑼", jp: "daai6 lo4", zh: "武場之王。一鑼定音——亮相、開打、升堂，全憑鑼聲斷句。", en: "King of the percussion pit — one stroke punctuates a freeze, a fight, a verdict." },
  "梆": { word: "梆黃", jp: "bong1 wong4", zh: "梆子與二黃兩大聲腔的合稱，粵劇唱腔的骨架。", en: "The twin melodic systems (bongzi + yiwong) that form the skeleton of Cantonese opera singing." },
  "喉": { word: "子喉", jp: "zi2 hau4", zh: "旦角假音唱法，高八度而圓潤。與平喉（本嗓）、大喉（武嗓）鼎足而三。", en: "The falsetto register of the female role — one of the three voice types with 平喉 and 大喉." },
};
