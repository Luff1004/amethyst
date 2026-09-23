/*
  MAP 2 - CRYSTAL CAVERN  (light & luminescence - a third material family, distinct from Quarry's gems
  and Vein's ores: glow, ice, prism, cave-formation minerals)
  10만대 x29 / 100만대 x22 / 1000만대 x26 / 1억대 x29  (1.2x the Deep Vein's counts) + 10억대 x5 + secret x1

  Same machinery as map1-vein.js: curated [odds,id,name,hue] rows + combo(i) cycling the whole cine palette
  (env/hero/entry/finale/fx/cam) so nothing feels copy-pasted, plus a spread() helper so 100+ odds values
  don't have to be hand-typed one by one.
*/
(() => {
  const ZONE = 2;
  const R = (odds, id, name, hue, cine, extra = {}) => {
    const t = G.tierIndex(odds);
    const dur = extra.duration || [0, 0, 0, 6800, 8200, 9600, 13000][t] + (id.length % 4) * 350;
    G.cutscenes.register(Object.assign({
      id, name, odds, zone: ZONE, template: 'cine', hue, colors: G.pal(hue, extra.hue2), cine, duration: dur,
    }, extra));
  };
  const B = (h, o = {}) => Object.assign({ k: 'brilliant', h, s: 88, trans: 0.7 }, o);
  /* geometric spread of n "nice" odds values across [lo,hi], rounded to 2-3 significant figures */
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

  /* ---------- hero factories ---------- */
  const HK = {
    nugget: h => ({ k: 'nugget', h, s: 70, l: 0, shine: 45, trans: 0.3 }),
    cube: h => ({ k: 'cube', h, s: 75, l: 4, hatch: 3, shine: 50 }),
    shard: h => ({ k: 'shard', h, s: 65, l: -6, shine: 90, trans: 0.4 }),
    prism: h => ({ k: 'prism', h, s: 78, l: 2, trans: 0.5 }),
    octa: h => ({ k: 'octa', h, s: 85, trans: 0.35 }),
    rhomb: h => ({ k: 'rhomb', h, s: 72, trans: 0.65 }),
    cluster: h => ({ k: 'cluster', h, s: 60, l: 4, trans: 0.55 }),
    swirl: h => ({ k: 'orb', kind: 'swirl', h, s: 80 }),
    pearl: h => ({ k: 'orb', kind: 'pearl', h, s: 55, l: 10 }),
    opal: h => ({ k: 'orb', kind: 'opal', h, s: 70 }),
    spire: h => ({ k: 'spire', h, s: 78, l: 2, trans: 0.4 }),
    plates: h => ({ k: 'plates', h, s: 62, l: 2 }),
    twin: h => ({ k: 'twin', h, s: 78, l: 0, trans: 0.4 }),
    star: h => ({ k: 'star', h, s: 85 }),
  };
  const HKEYS = Object.keys(HK);
  const ENVS = ['cave', 'ice', 'aurora', 'space', 'void', 'sanctum', 'arcane', 'ocean', 'abyss', 'temple', 'clockwork', 'cyber', 'mountain', 'desert', 'storm', 'forest', 'forge'];
  const ENTRIES = ['rise', 'emerge', 'geode', 'orbit', 'unveil', 'drop', 'tide', 'lightning', 'ignite', 'forge'];
  const FINALES = ['bloom', 'sweep', 'beam', 'pulse', 'shatter', 'nova', 'implode', 'quake'];
  const FXPOOL = [['stars', 'sparks'], ['snow', 'stars'], ['dust', 'sparks'], ['bubbles'], ['stars', 'orbit'], ['runes'], ['fireflies'], ['petals'], ['feathers', 'sparks'], ['arcs', 'dust'], ['leaves', 'fireflies'], ['sand', 'dust'], ['orbit', 'dust'], ['stars', 'sparks', 'dust'], ['rain', 'arcs'], ['embers', 'sparks']];
  const CAMS = ['push', 'pull', 'drift'];

  const combo = (i, salt, hue) => {
    const hero = HK[HKEYS[(i * 3 + salt) % HKEYS.length]](hue);
    return {
      env: ENVS[(i * 7 + salt * 5 + 3) % ENVS.length],
      envHue: (hue + 30 + i * 11) % 360,
      hero,
      entry: ENTRIES[(i * 5 + salt * 3 + 1) % ENTRIES.length],
      finale: FINALES[(i * 3 + salt * 2 + 2) % FINALES.length],
      fx: FXPOOL[(i * 11 + salt * 7 + 4) % FXPOOL.length],
      cam: CAMS[(i + salt) % 3],
    };
  };
  const row = (list, salt, sizeK) => list.forEach(([odds, id, name, hue, over], i) => {
    const c = combo(i, salt, hue);
    if (over) Object.assign(c, over, over.hero ? { hero: Object.assign(c.hero, over.hero) } : {});
    if (sizeK) c.hero.size = sizeK;
    R(odds, id, name, hue, c, over && over.extra);
  });

  /* ============ 10만대  EPIC  (x29) ============ */
  const epicNames = [
    ['fluorquartz', '형광수정', 165], ['glowstone', '야광석', 140], ['icecrystal', '빙정', 195],
    ['frostquartz', '서리수정', 200], ['glassquartz', '유리수정', 185], ['prismstone', '프리즘석', 45],
    ['rainbowquartz', '무지개수정', 300, { hero: { s: 90 } }], ['moonlightstone', '달빛석', 220],
    ['starlightquartz', '별빛수정', 230], ['galaxyquartz', '은하수정', 265], ['aurorastone', '오로라석', 150],
    ['fireflyquartz', '반딧불수정', 90], ['abyssalglow', '심연발광석', 200], ['stalactite', '종유석 결정', 175],
    ['stalagmite', '석순수정', 178], ['cavepearl', '동굴진주', 42], ['phantomquartz', '유령수정', 250],
    ['clearcrystal', '투명결정', 0, { hero: { s: 4, l: 85 } }], ['chillcrystal', '냉기결정', 205],
    ['glacierite', '빙하결정', 198], ['crystalrose', '크리스탈로즈', 335], ['silvercave', '은빛동굴석', 210],
    ['tealquartz', '청록수정', 172], ['fluorprism', '형광각', 130], ['afterglow', '잔광석', 30],
    ['midnightquartz', '심야수정', 250], ['fossilcrystal', '결정화석', 40], ['cathedralquartz', '대성당수정', 190],
    ['dewquartz', '이슬수정', 155],
  ];
  row(spread(100000, 999999, epicNames.length).map((o, i) => [o, ...epicNames[i]]), 1);

  /* ============ 100만대  LEGENDARY  (x22) ============ */
  const legendNames = [
    ['lightcrystal', '빛의결정', 45], ['abyssallight', '심연의빛', 200], ['stardustquartz', '성진수정', 235],
    ['infiniteclarity', '무한투명석', 190], ['frostflame', '빙염결정', 15], ['luminousgem', '영롱석', 160],
    ['skycavestone', '천공동굴석', 205], ['deepseaglow', '심해발광체', 190], ['crystalnebula', '결정성운', 270],
    ['lightmaze', '빛의미로석', 50], ['millenniumice', '만년빙정', 195], ['glassheart', '유리심장', 0],
    ['radiancefrag', '광휘의파편', 40], ['glowpearl', '야광진주', 340], ['resonancestone', '공명석', 210],
    ['abyssalspire', '심연의결정탑', 260], ['crystalgarden', '크리스탈정원석', 130], ['glacierheart', '빙하의심장', 200],
    ['millenniumstal', '천년종유석', 25], ['auroracrystal', '오로라결정', 150], ['primalice', '태초의빙정', 195],
    ['veiledopal', '베일오팔석', 285, { hero: { k: 'orb', kind: 'opal', h: 285 } }],
  ];
  row(spread(1000000, 9999999, legendNames.length).map((o, i) => [o, ...legendNames[i]]), 2);

  /* ============ 1000만대  MYTHIC  (x26) ============ */
  const mythicNames = [
    ['infiniteradiance', '무한광휘석', 45], ['starcave', '별의동굴석', 230], ['abyssallantern', '심연의등불', 20],
    ['crystalgoddess', '크리스탈여신석', 300], ['sanctuaryoflight', '빛의성소', 48], ['eternalice', '영원빙정', 195],
    ['primevalcaveheart', '태고의동굴심장', 175], ['galaxyfragment', '은하의파편', 260], ['dreamquartz', '몽환수정', 280],
    ['glowingvoid', '빛나는공허석', 265], ['heavencavelight', '천상의동굴빛', 50], ['crystaldawn', '결정의여명', 30],
    ['abyssalstarlight', '심연의별빛', 220], ['eternalglacier', '영겁의빙하', 200], ['rainbowheart', '무지개의심장', 320],
    ['crystaltemple', '크리스탈신전석', 45], ['lightwave', '빛의파도석', 190], ['primalcore', '태초의결정핵', 40],
    ['ghostcavelight', '유령동굴의빛', 255], ['starclusterquartz', '별무리수정', 235], ['abyssalprism', '심연의프리즘', 200],
    ['fullmoonice', '만월빙정', 210], ['dragonscale2', '크리스탈용의비늘', 150], ['infinitereflect', '무한반사석', 190],
    ['lightlabyrinth', '빛의미궁핵', 55], ['primalradiance', '태고의광휘', 42],
  ];
  row(spread(10000000, 99999999, mythicNames.length).map((o, i) => [o, ...mythicNames[i]]), 3);

  /* ============ 1억대  DIVINE - longer, grander (English names)  (x29) ============ */
  const divineNames = [
    ['prismheart', 'Prism Heart', 45], ['cavernoflight', 'Cavern of Light', 48], ['luminoussov', 'Luminous Sovereign', 40],
    ['frostlightcrown', 'Frostlight Crown', 195], ['radianthollow', 'Radiant Hollow', 50], ['glasswingcore', 'Glasswing Core', 185],
    ['crystallinegenesis', 'Crystalline Genesis', 200], ['aurorasanctum', 'Aurora Sanctum', 150], ['hallofmirrors', 'Hall of Mirrors', 210],
    ['starlitgrotto', 'Starlit Grotto', 230], ['glacialcathedral', 'Glacial Cathedral', 198], ['prismmonarch', 'Prism Monarch', 300],
    ['everlightshard', 'Everlight Shard', 42], ['hollowofechoes', 'Hollow of Echoes', 260], ['spectralbloom', 'Spectral Bloom', 280],
    ['radianceeternal', 'Radiance Eternal', 46], ['crystalrequiem', 'Crystal Requiem', 270], ['dawnlightcore', 'Dawnlight Core', 30],
    ['mirrorsovereign', 'Mirror Sovereign', 205], ['frozenradiance', 'Frozen Radiance', 195], ['luminasveil', "Lumina's Veil", 320],
    ['glasslightthrone', 'Glasslight Throne', 190], ['cavefireprism', 'Cavefire Prism', 20], ['echoingcrystal', 'Echoing Crystal', 235],
    ['refractedsoul', 'Refracted Soul', 255], ['starcavemonarch', 'Starcave Monarch', 220], ['eternalglasswork', 'Eternal Glasswork', 175],
    ['twilightprism', 'Twilight Prism', 285], ['luminousrequiem', 'Luminous Requiem', 200],
  ];
  row(spread(100000000, 999999999, divineNames.length).map((o, i) => [o, ...divineNames[i]]), 5, 1.15);

  /* ============ 10억대  TRANSCENDENT - bold geometric solids + a vertical Hanja title-card (x5) ============ */
  R(1400000000, 'lighteternal', 'The Light Eternal', 48,
    { env: 'sanctum', envHue: 48, hero: { k: 'prism', n: 20, h: 48, s: 60, l: 10, size: 1.3, shine: 80, trans: 0.5 }, entry: 'unveil', finale: 'beam', fx: ['feathers', 'stars'], cam: 'drift' },
    { duration: 16000, revealAt: 0.63, captions: [
      { a: 0.04, b: 0.24, en: 'EVERY CAVE REMEMBERS THE SUN', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.28, b: 0.5, en: 'THIS ONE NEVER LET IT GO', style: 'fly', from: 'right' },
      { a: 0.66, b: 1.4, en: '永光', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(2800000000, 'cavernofinfinity', 'Cavern of Infinity', 210,
    { env: 'void', envHue: 250, hero: { k: 'spire', h: 210, s: 75, l: 4, size: 1.35, shine: 65, trans: 0.45 }, entry: 'drop', finale: 'implode', fx: ['stars', 'arcs'], cam: 'pull' },
    { duration: 17000, revealAt: 0.63, hue2: 260, captions: [
      { a: 0.04, b: 0.24, en: 'THE TUNNEL NEVER FOUND A WALL', pos: 'top', style: 'fly', from: 'top', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.28, b: 0.5, en: 'IT JUST KEPT GOING DOWN', style: 'fly', from: 'bottom', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.66, b: 1.4, en: '無限', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(4200000000, 'crystalbornmonarch', 'Crystalborn Monarch', 172,
    { env: 'arcane', envHue: 172, hero: { k: 'cluster', h: 172, s: 65, l: 6, size: 1.3, shine: 55, trans: 0.45 }, entry: 'geode', finale: 'shatter', fx: ['runes', 'dust'], cam: 'push' },
    { duration: 17500, revealAt: 0.64, captions: [
      { a: 0.04, b: 0.25, en: 'THE CAVE CHOSE ITS OWN KING', pos: 'top', style: 'engrave' },
      { a: 0.29, b: 0.52, en: 'AND GREW HIM FROM ITS WALLS', style: 'engrave' },
      { a: 0.68, b: 1.4, en: '晶王', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(6500000000, 'radiantabyss', 'Radiant Abyss', 190,
    { env: 'abyss', envHue: 195, hero: { k: 'octa', h: 190, s: 80, l: 2, size: 1.4, shine: 70, trans: 0.4 }, entry: 'tide', finale: 'pulse', fx: ['bubbles', 'sparks'], cam: 'push' },
    { duration: 18000, revealAt: 0.64, hue2: 220, captions: [
      { a: 0.04, b: 0.25, en: 'LIGHT SHOULD NOT REACH THIS DEEP', pos: 'top', style: 'fly', from: 'left' },
      { a: 0.29, b: 0.52, en: 'AND YET IT NEVER STOPPED', style: 'fly', from: 'right' },
      { a: 0.68, b: 1.4, en: '輝淵', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(9800000000, 'lastrefraction', 'The Last Refraction', 300,
    { env: 'aurora', envHue: 300, hero: { k: 'twin', h: 300, s: 80, l: 4, size: 1.4, shine: 75, trans: 0.4 }, entry: 'unveil', finale: 'nova', fx: ['snow', 'stars'], cam: 'drift' },
    { duration: 19000, revealAt: 0.65, hue2: 190, captions: [
      { a: 0.04, b: 0.26, en: 'ALL LIGHT ENDS SOMEWHERE', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.3, b: 0.54, en: 'THIS IS WHERE IT BENDS ONE LAST TIME', style: 'fly', from: 'left' },
      { a: 0.69, b: 0.95, en: 'الضوء الأخير', pos: 'center', size: 26 },
    ] });
})();
