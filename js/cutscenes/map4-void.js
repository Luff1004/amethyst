/*
  MAP 4 - VOID RIFT (공허의 균열) - the REAL 5th map, unlocked only after LEVEL 1 (js/level1.js).
  A fifth material family: reality itself cracking - glass-thin fractures, folded space, echoes and
  paradoxes, distinct from Quarry/Vein/Cavern/Core. Several names deliberately echo LEVEL 1's own
  imagery (the labyrinth, the eye, waking up) since this map IS the other side of that door.
  10만대 x24 / 100만대 x22 / 1000만대 x22 / 1억대 x24  = 92, + 10억대 x8 = 100

  Same machinery as the other maps: curated [odds,id,name,hue] rows + combo(i) cycling the whole
  cine palette so nothing feels copy-pasted, plus spread() for the odds ladder. TRANSCENDENT entries
  are hand-tuned per the lessons from every earlier map this session: exactly ONE language and ONE
  font per scene (never mixed), a deliberate entrance `style` (fly/engrave/type) instead of always
  the same fade, and the bold wireframe treatment is automatic (js/cutscenes/cine.js, tierIdx>=7).
*/
(() => {
  const ZONE = 4;
  const R = (odds, id, name, hue, cine, extra = {}) => {
    const t = G.tierIndex(odds);
    const dur = extra.duration || ([0, 0, 0, 6800, 8200, 9600, 13000][t] || 14000 + (t - 7) * 500) + (id.length % 4) * 350;
    G.cutscenes.register(Object.assign({
      id, name, odds, zone: ZONE, template: 'cine', hue, colors: G.pal(hue, extra.hue2), cine, duration: dur,
    }, extra));
  };
  const spread = (lo, hi, n) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), raw = lo * Math.pow(hi / lo, t);
      const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1), r = Math.round(raw / mag) * mag;
      out.push(Math.round(r));
    }
    out[0] = lo; out[n - 1] = hi;
    for (let i = 1; i < n; i++) if (out[i] <= out[i - 1]) out[i] = out[i - 1] + Math.max(1, Math.round(out[i - 1] * 0.03));
    return out;
  };

  /* ---------- hero factories: glassy, high-shine, thin - "reality" reads as fragile and see-through ---------- */
  const HK = {
    nugget: h => ({ k: 'nugget', h, s: 65, l: 6, shine: 70, trans: 0.55 }),
    cube: h => ({ k: 'cube', h, s: 70, l: 8, hatch: 2, shine: 75 }),
    shard: h => ({ k: 'shard', h, s: 60, l: 2, shine: 95, trans: 0.65 }),
    prism: h => ({ k: 'prism', h, s: 75, l: 6, trans: 0.7 }),
    octa: h => ({ k: 'octa', h, s: 82, trans: 0.6 }),
    rhomb: h => ({ k: 'rhomb', h, s: 68, trans: 0.75 }),
    cluster: h => ({ k: 'cluster', h, s: 55, l: 8, trans: 0.6 }),
    swirl: h => ({ k: 'orb', kind: 'swirl', h, s: 78 }),
    pearl: h => ({ k: 'orb', kind: 'pearl', h, s: 60, l: 12 }),
    opal: h => ({ k: 'orb', kind: 'opal', h, s: 72 }),
    spire: h => ({ k: 'spire', h, s: 75, l: 6, trans: 0.55 }),
    plates: h => ({ k: 'plates', h, s: 58, l: 6 }),
    twin: h => ({ k: 'twin', h, s: 75, l: 4, trans: 0.55 }),
    star: h => ({ k: 'star', h, s: 82 }),
  };
  const HKEYS = Object.keys(HK);
  const ENVS = ['void', 'space', 'arcane', 'cyber', 'clockwork', 'abyss', 'sanctum', 'mountain', 'desert', 'storm', 'forest', 'ocean', 'ice', 'aurora', 'temple', 'cave', 'forge'];
  const ENTRIES = ['unveil', 'drop', 'orbit', 'emerge', 'rise', 'geode', 'lightning', 'tide', 'ignite', 'forge'];
  const FINALES = ['implode', 'pulse', 'beam', 'shatter', 'nova', 'sweep', 'bloom', 'quake'];
  const FXPOOL = [['arcs', 'stars'], ['runes', 'dust'], ['stars', 'orbit'], ['dust', 'sparks'], ['arcs'], ['runes'], ['stars', 'sparks', 'dust'], ['orbit', 'dust'], ['arcs', 'runes'], ['stars'], ['dust'], ['sparks', 'arcs'], ['runes', 'stars'], ['orbit', 'sparks'], ['arcs', 'dust', 'stars'], ['fireflies', 'stars']];
  const CAMS = ['push', 'pull', 'drift'];

  const combo = (i, salt, hue) => {
    const hero = HK[HKEYS[(i * 3 + salt) % HKEYS.length]](hue);
    return {
      env: ENVS[(i * 7 + salt * 5 + 6) % ENVS.length],
      envHue: (hue + 36 + i * 13) % 360,
      hero,
      entry: ENTRIES[(i * 5 + salt * 3 + 2) % ENTRIES.length],
      finale: FINALES[(i * 3 + salt * 2 + 1) % FINALES.length],
      fx: FXPOOL[(i * 11 + salt * 7 + 8) % FXPOOL.length],
      cam: CAMS[(i + salt) % 3],
    };
  };
  const row = (list, salt, sizeK) => list.forEach(([odds, id, name, hue, over], i) => {
    const c = combo(i, salt, hue);
    if (over) Object.assign(c, over, over.hero ? { hero: Object.assign(c.hero, over.hero) } : {});
    if (sizeK) c.hero.size = sizeK;
    R(odds, id, name, hue, c, over && over.extra);
  });

  /* ============ 10만대  EPIC  (x24) ============ */
  const epicNames = [
    ['riftstone', '균열석', 322], ['voidfragment', '공허조각', 280], ['dimshard', '차원파편', 260],
    ['brokenglass', '유리결정', 200], ['echostone', '메아리석', 190], ['afterimage', '잔상수정', 300],
    ['distortstone', '왜곡석', 340], ['crevicecrystal', '틈새결정', 250], ['ghostfragment', '유령파편', 270],
    ['spacetimebit', '시공의조각', 210], ['reflector', '반사체', 180], ['refractstone', '굴절석', 230],
    ['vanishpoint', '소실점석', 310], ['paradoxlet', '역설수정', 350], ['mazecrystal', '미로결정', 290],
    ['abysspiece', '심연조각', 260], ['rifteye', '균열의눈', 0], ['absencestone', '부재석', 220],
    ['silencecrystal', '침묵결정', 240], ['remnantite', '잔재수정', 330], ['gapcrystal', '틈결정', 200],
    ['anamorphstone', '왜상석', 170], ['overlapfrag', '겹침조각', 300], ['unfocusstone', '초점상실석', 250],
  ];
  /* PATCH - the 5th map is the experts' ladder now: 58 minerals from 1억 up to 999해 (bands below).
     The old 10만대 row is retired; 100만대 keeps only its first four, which now open the ladder at 1억. */
  const BANDS = [[1e8, 9.9e8, 10], [1e9, 9.9e9, 8], [1e10, 9.9e11, 9], [1e12, 9.9e13, 8], [1e14, 9.9e15, 7], [1e16, 9.9e17, 6], [1e18, 9.9e19, 5], [1e20, 9.99e22, 5]];
  const LADDER = [].concat(...BANDS.map(([lo, hi, n]) => spread(lo, hi, n)));   // 58 odds, ascending

  /* ============ 100만대  LEGENDARY  (x22) ============ */
  const legendNames = [
    ['brokenreality', '깨어진현실', 300], ['mazecore', '미궁의핵', 260], ['paradoxgate', '역설의문', 340],
    ['riftheart', '균열의심장', 322], ['existgap', '존재의틈', 220], ['dimscar', '차원의상흔', 210],
    ['corridorstone', '무한회랑석', 190], ['resonancecrystal', '반향의결정', 250], ['twistmirror', '뒤틀린거울', 200],
    ['realityfrag', '실재의파편', 290], ['gapcore', '공백의핵', 240], ['afterimagegate', '잔영의문', 310],
    ['layeredeye', '겹눈결정', 0], ['mazewall', '미로의벽', 270], ['transboundary', '초월경계석', 330],
    ['meaninglessite', '무의미결정', 230], ['reversephase', '역위상석', 350], ['foldedspace', '접힌공간', 260],
    ['shakenaxis', '흔들린축', 200], ['vanisheddoor', '사라진문', 280], ['loopcrystal', '되돌이결정', 320],
    ['brokencompass', '깨진나침반', 190],
  ];
  row(LADDER.slice(0, 4).map((o, i) => [o, ...legendNames[i]]), 2);

  /* ============ 1000만대  MYTHIC  (x22) ============ */
  const mythicNames = [
    ['mazeruler', '미궁의지배자', 300], ['denialstone', '존재부정석', 260], ['transcorenucl', '실재초월핵', 220],
    ['riftqueen', '균열여왕', 322], ['loopeye', '무한반복의눈', 0], ['twistcrown', '뒤틀린왕관', 45],
    ['dimdevourer', '차원포식자', 270], ['mazeabyss', '미로의심연', 250], ['forgottensigil', '잊혀진문장', 200],
    ['voidthrone', '공허의왕좌', 280], ['rewoundtime', '되감긴시간', 190], ['awakenomen', '깨어남의전조', 340],
    ['mirrormaze', '거울미궁', 210], ['paradoxoracle', '역설의신탁', 330], ['focuscollapse', '초점의붕괴', 240],
    ['mazenucleus', '미로핵심', 260], ['brokenpupil', '깨진눈동자', 0], ['paradisefrag', '실낙원조각', 300],
    ['namelesswall', '무명의벽', 200], ['recurwaking', '반복되는깨어남', 290], ['erodedbound', '잠식된경계', 230],
    ['endlesshall', '끝없는복도', 250],
  ];
  row(LADDER.slice(4, 26).map((o, i) => [o, ...mythicNames[i]]), 3);

  /* ============ 1억대  DIVINE - longer, grander (English names)  (x24) ============ */
  const divineNames = [
    ['riftsovereign', 'Rift Sovereign', 322], ['nonexistcore', 'Core of Non-Existence', 260], ['mazeeternal', 'Labyrinth Eternal', 300],
    ['paradoxincarnate', 'Paradox Incarnate', 340], ['firstfractureecho', 'Echo of the First Fracture', 190], ['mirrorremembers', 'Mirror That Remembers', 210],
    ['dimunbound', 'Dimension Unbound', 250], ['wakingeye', 'The Waking Eye', 0], ['lastseam', "Reality's Last Seam", 280],
    ['loopsovereign', 'Sovereign of the Loop', 270], ['fractureabsolute', 'Fracture Absolute', 220], ['mazeends', 'Where the Maze Ends', 200],
    ['riftgenesis', 'Genesis of the Rift', 330], ['unwrittencorridor', 'Unwritten Corridor', 230], ['watchingvoid', 'The Watching Void', 260],
    ['collapsedhorizon', 'Collapsed Horizon', 240], ['beyondmaze', 'Beyond the Labyrinth', 290], ['echowithoutend', 'Echo Without End', 190],
    ['foldedthrone', 'The Folded Throne', 310], ['silenceincarnate', 'Silence Incarnate', 250], ['vanishsovereign', 'Vanishing Sovereign', 200],
    ['endlessreturn', 'The Endless Return', 320], ['realityoverwritten', 'Reality Overwritten', 350], ['corebeyondreach', 'Core Beyond Reach', 210],
  ];
  row(LADDER.slice(26, 50).map((o, i) => [o, ...divineNames[i]]), 5, 1.15);

  /* ============ 10억대  TRANSCENDENT - the deepest, final tier of the whole game (x8).
     Every line in a given scene is the SAME language (never mixed - English / Chinese / Arabic,
     one font each), a deliberate entrance style, and a few names deliberately echo LEVEL 1's own
     imagery (the labyrinth, the eye, waking up) since this map is the other side of that door. ============ */
  R(LADDER[50], 'labyrinthmaker', "The Labyrinth's Maker", 322,
    { env: 'void', envHue: 322, hero: { k: 'spire', h: 322, s: 70, l: 6, size: 1.4, shine: 85, trans: 0.5 }, entry: 'unveil', finale: 'implode', fx: ['arcs', 'stars'], cam: 'pull' },
    { duration: 17000, revealAt: 0.63, captions: [
      { a: 0.04, b: 0.24, en: 'SOMETHING BUILT THIS MAZE ON PURPOSE', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.28, b: 0.5, en: 'AND LEFT ONE DOOR UNLOCKED', style: 'fly', from: 'left' },
      { a: 0.7, b: 1.4, en: 'YOU WERE ALWAYS MEANT TO FIND IT', style: 'fly', from: 'bottom' },
    ] });
  R(LADDER[51], 'genesisecho', '创世的回声', 280,
    { env: 'arcane', envHue: 280, hero: { k: 'octa', h: 280, s: 78, trans: 0.55, size: 1.4, shine: 75 }, entry: 'drop', finale: 'pulse', fx: ['runes', 'dust'], cam: 'drift' },
    { duration: 17500, revealAt: 0.63, hue2: 250, captions: [
      { a: 0.04, b: 0.24, en: '第一道裂缝还在回响', size: 26, pos: 'top', style: 'engrave' },
      { a: 0.28, b: 0.5, en: '从创世那一刻就未曾停止', size: 26, style: 'engrave' },
      { a: 0.7, b: 1.4, en: '永劫回声', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(LADDER[52], 'riftsovereign2', 'Sovereign of the Rift', 260,
    { env: 'cyber', envHue: 260, hero: { k: 'cube', h: 260, s: 65, l: 10, size: 1.35, shine: 80, trans: 0.6 }, entry: 'lightning', finale: 'shatter', fx: ['arcs', 'sparks'], cam: 'push' },
    { duration: 18000, revealAt: 0.64, captions: [
      { a: 0.04, b: 0.25, en: 'IT DOES NOT RULE THE RIFT', pos: 'top', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.29, b: 0.52, en: 'IT IS THE RIFT, WEARING A CROWN', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.68, b: 1.4, en: 'EVERY FRACTURE ANSWERS TO IT', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
    ] });
  R(LADDER[53], 'existenceecho', 'صدى الوجود', 200,
    { env: 'abyss', envHue: 200, hero: { k: 'twin', h: 200, s: 72, l: 4, size: 1.4, shine: 78, trans: 0.55 }, entry: 'tide', finale: 'nova', fx: ['stars', 'orbit'], cam: 'drift' },
    { duration: 18500, revealAt: 0.64, hue2: 220, captions: [
      { a: 0.04, b: 0.25, en: 'صوت يتردد منذ أن كُسر الوجود', pos: 'top', size: 24, style: 'fly', from: 'left' },
      { a: 0.29, b: 0.52, en: 'ولم يتوقف منذ ذلك الحين', size: 24, style: 'fly', from: 'right' },
      { a: 0.68, b: 1.4, en: 'وما زال يتردد فيك الآن', size: 24, style: 'fly', from: 'top' },
    ] });
  R(LADDER[54], 'mazeend', '迷宫尽头', 340,
    { env: 'sanctum', envHue: 340, hero: { k: 'prism', n: 20, h: 340, s: 75, size: 1.45, shine: 82, trans: 0.5 }, entry: 'unveil', finale: 'bloom', fx: ['dust', 'stars'], cam: 'pull' },
    { duration: 19000, revealAt: 0.65, captions: [
      { a: 0.04, b: 0.26, en: '每一条走廊终将汇聚于此', size: 26, pos: 'top', style: 'engrave' },
      { a: 0.3, b: 0.54, en: '这里就是迷宫的尽头', size: 26, style: 'engrave' },
      { a: 0.69, b: 1.4, en: '終焉', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(LADDER[55], 'eyethatwaits', 'The Eye That Waits', 0,
    { env: 'void', envHue: 8, hero: { k: 'octa', h: 0, s: 70, l: 8, size: 1.45, shine: 85, trans: 0.45 }, entry: 'drop', finale: 'implode', fx: ['arcs', 'stars'], cam: 'push' },
    { duration: 18500, revealAt: 0.64, hue2: 30, captions: [
      { a: 0.04, b: 0.25, en: 'IT NEVER CLOSED, NOT ONCE', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.29, b: 0.52, en: 'NOT WHILE YOU MINED', style: 'fly', from: 'left' },
      { a: 0.68, b: 1.4, en: 'NOT WHILE YOU SLEPT', style: 'fly', from: 'right' },
    ] });
  R(LADDER[56], 'finaltruth', 'الحقيقة الأخيرة', 190,
    { env: 'temple', envHue: 190, hero: { k: 'star', h: 190, s: 85, size: 1.5, shine: 88, trans: 0.4 }, entry: 'lightning', finale: 'nova', fx: ['stars', 'sparks', 'arcs'], cam: 'push' },
    { duration: 19000, revealAt: 0.65, hue2: 210, captions: [
      { a: 0.04, b: 0.26, en: 'كل ما رأيته كان صحيحا', pos: 'top', size: 24, style: 'engrave' },
      { a: 0.3, b: 0.54, en: 'وكل ما ظننته وهما كان حقيقيا أيضا', size: 24, style: 'engrave' },
      { a: 0.69, b: 1.4, en: 'الحقيقة الأخيرة', pos: 'center', size: 26, style: 'engrave' },
    ] });
  R(LADDER[57], 'eternalreturn', '永恒回归', 300,
    { env: 'arcane', envHue: 300, hero: { k: 'star', h: 300, s: 88, size: 1.55, shine: 92, trans: 0.35 }, entry: 'lightning', finale: 'nova', fx: ['stars', 'sparks', 'arcs', 'runes'], cam: 'push' },
    { duration: 20000, revealAt: 0.65, hue2: 340, captions: [
      { a: 0.04, b: 0.26, en: '结束之处，也是开始之处', size: 26, pos: 'top', style: 'fly', from: 'top' },
      { a: 0.3, b: 0.54, en: '你挖出的每一颗，都会回到这里', size: 26, style: 'fly', from: 'bottom' },
      { a: 0.69, b: 1.4, en: '永恒回歸', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
})();
