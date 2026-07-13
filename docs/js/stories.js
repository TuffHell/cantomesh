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

// Full tales for story mode — 3 chapters each, bilingual, scroll-reader style.
// 唐滌生 (d. 1959) lyrics are public domain in HK (life + 50); 關漢卿 is ancient.
export const CHAPTERS = {
  prologue: [
    { t: "鳳台驚變", t_en: "The Palace Falls",
      p: ["明末崇禎年間，闖軍破城，江山傾覆。長平公主奉旨許婚太僕之子周世顯，鳳台初遇，兩心相許。", "誰知花燭未成，宮牆已陷。帝命公主自盡殉國，劍下未死的長平，流落尼庵，改名慧清。"],
      p_en: ["As the Ming dynasty collapses, Princess Changping is betrothed to Zhou Shixian — two hearts meet on the phoenix terrace.", "Before the wedding candles are lit, the palace falls. Ordered to die for the dynasty, the princess survives the sword and hides in a nunnery."] },
    { t: "庵遇重逢", t_en: "Reunion at the Nunnery",
      p: ["周世顯訪遍山河，終在庵中認出扮作尼姑的公主。長平恐累故人，堅拒相認；世顯以死明志，一句一淚。", "相認之夜，清室以厚祿誘降。二人將計就計，허諾還朝——只求清帝善葬先帝、釋放太子。"],
      p_en: ["Zhou searches the ruined land and finds her disguised as a nun. Fearing for him, she denies her name — until his tears break her silence.", "The new dynasty offers riches for their surrender. The lovers feign consent, trading their return for a proper burial of the old emperor."] },
    { t: "香夭殉國", t_en: "The Fragrant Sacrifice",
      p: ["含樟樹下，花燭高燒。二人拜堂成親，同飲砒霜於合卺酒中——以新婚之夜，殉故國之亡。", "「落花滿天蔽月光」——一曲香夭，自此傳唱七十年，成為粵劇的靈魂之聲。"],
      p_en: ["Beneath the fragrant tree, they wed by candlelight — and drink poison in the nuptial wine, giving their wedding night to their fallen nation.", "The aria they sing — 香夭 — has been sung for seventy years since: the very soul of Cantonese opera."] },
  ],
  sang: [
    { t: "燈市拾釵", t_en: "The Hairpin at the Lantern Fair",
      p: ["元宵燈市，霍小玉墮下紫玉釵；才子李益拾釵相還，一見傾心，以釵為聘。"],
      p_en: ["At the Lantern Festival, Huo Xiaoyu drops her purple jade hairpin; the scholar Li Yi returns it — and offers it back as a betrothal gift."] },
    { t: "強權拆散", t_en: "Torn Apart by Power",
      p: ["李益高中，卻遭太尉盧燕貞強招為婿，軟禁府中。小玉變賣紫釵尋夫，釵落盧府，音書斷絕。", "小玉病臥危樓，典盡釵環；一腔痴念，只換得長安月冷。"],
      p_en: ["Li Yi tops the imperial exams — and is imprisoned as a forced son-in-law by the powerful Lord Lu. Xiaoyu sells the hairpin to search for him.", "She falls ill in a crumbling tower, her keepsakes pawned, her devotion answered only by the cold moon over the capital."] },
    { t: "劍合釵圓", t_en: "Sword and Hairpin Reunited",
      p: ["黃衫客仗義，挾李益夜奔危樓。釵還人聚，真相大白；黃衫客原是四王爺，一紙賜婚，有情人終成眷屬。"],
      p_en: ["A mysterious knight in yellow spirits Li Yi to her tower by night. The hairpin returns, the truth outs — and the knight, a prince in disguise, decrees their marriage."] },
  ],
  daan: [
    { t: "紅梅驚艷", t_en: "Beauty at the Red Plum",
      p: ["書生裴禹遊湖，遇賈似道姬妾李慧娘。慧娘一句「美哉少年」，竟招殺身之禍——奸相沉她於西湖。"],
      p_en: ["The scholar Pei Yu is glimpsed by Li Huiniang, a concubine of the tyrant Jia Sidao. One murmured word of admiration costs her life."] },
    { t: "幽魂再世", t_en: "The Returning Spirit",
      p: ["慧娘冤魂不散，得判官憐憫，允她再世人間。她夜訪書齋，人鬼相隔一燈之光，情卻愈燃愈熾。", "奸相追殺裴禹，慧娘鬼魂顯聖，脫穽救裴，陰風滅燭，嚇退爪牙。"],
      p_en: ["Pitied by the underworld judge, Huiniang's spirit returns. She visits Pei's study by night — one lamp between the living and the dead.", "When assassins come for Pei, her ghost blows out their torches and spirits him away."] },
    { t: "梅開二度", t_en: "The Plum Blooms Twice",
      p: ["慧娘借新死的盧昭容之身還魂，紅梅樹下與裴禹重逢。前世今生，兩世紅梅，終成眷屬。"],
      p_en: ["Reborn in another's body, Huiniang meets Pei once more beneath the red plum — two lifetimes, one blossom, finally united."] },
  ],
  zing: [
    { t: "魯肅設宴", t_en: "The Banquet Trap",
      p: ["三國之時，東吳魯肅設宴江亭，名為修好，實欲索還荊州——請關雲長單刀赴會。"],
      p_en: ["Lu Su of Wu lays a banquet by the river — a courtesy in name, an ambush in truth — and invites Guan Yu to attend with a single blade."] },
    { t: "大江東去", t_en: "The Great River Flows East",
      p: ["關公攜周倉，一舟渡江。望大江東去，浪千疊，感英雄血、離人淚，盡付江流。", "「這也不是江水——二十年流不盡的英雄血！」一句唱詞，唱盡三國蒼涼。"],
      p_en: ["Crossing with only his standard-bearer, Guan Yu watches the great river roll east — twenty years of heroes' blood in its waves.", "'This is no river — it is twenty years of heroes' blood that will not stop flowing.'"] },
    { t: "單刀退敵", t_en: "One Blade Turns the Ambush",
      p: ["席間伏兵四起。關公談笑自若，一手按刀，一手挽住魯肅——「今日宴無好宴，某家去也。」揚長登舟，千軍不敢動。"],
      p_en: ["The hidden soldiers rise. Guan Yu laughs, one hand on his blade, the other on his host's arm — and walks to his boat untouched. No one dares move."] },
  ],
};

// One line to read aloud per tale — the 跟讀 finale of story mode.
export const FAMOUS_LINES = {
  prologue: { line: "落花滿天蔽月光", src: "〈香夭〉首句 · 唐滌生", src_en: "Opening of the aria 香夭" },
  sang: { line: "霧月夜抱泣落紅", src: "〈劍合釵圓〉 · 唐滌生", src_en: "From 劍合釵圓" },
  daan: { line: "梅開二度燕歸來", src: "劇旨句 · 本站撰", src_en: "The tale's motto (ours)" },
  zing: { line: "大江東去浪千疊", src: "〈駐馬聽〉 · 關漢卿", src_en: "From Guan Hanqing's aria" },
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
