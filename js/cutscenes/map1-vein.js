/*
  MAP 1 - DEEP VEIN  (ores, metals and deep-earth minerals - a different material family from the Surface Quarry)
  10만대 x24 / 100만대 x18 / 1000만대 x22 / 1억대 x24  (1.2x the base map's counts) + 10억대 x4 + secret x1

  Rows only give the crafted part (id, name, hue, sometimes a hero/env/finale override); the rest of each
  mineral's recipe (env / hero shape / entry / finale / fx / camera) comes from combo(i), a deterministic
  cycle through the whole cine palette so 88 minerals never feel copy-pasted. Extra overrides layer on top.
*/
(() => {
  const ZONE = 1;
  const R = (odds, id, name, hue, cine, extra = {}) => {
    const t = G.tierIndex(odds);
    const dur = extra.duration || [0, 0, 0, 6800, 8200, 9600, 13000][t] + (id.length % 4) * 350;
    G.cutscenes.register(Object.assign({
      id, name, odds, zone: ZONE, template: 'cine', hue, colors: G.pal(hue, extra.hue2), cine, duration: dur,
    }, extra));
  };
  const B = (h, o = {}) => Object.assign({ k: 'brilliant', h, s: 88, trans: 0.7 }, o);

  /* ---------- hero factories, one per shape ---------- */
  const HK = {
    nugget: h => ({ k: 'nugget', h, s: 65, l: -8, shine: 40 }),
    cube: h => ({ k: 'cube', h, s: 78, l: -6, hatch: 4, shine: 34 }),
    shard: h => ({ k: 'shard', h, s: 55, l: -20, shine: 85 }),
    prism: h => ({ k: 'prism', h, s: 72, l: -8 }),
    octa: h => ({ k: 'octa', h, s: 82 }),
    rhomb: h => ({ k: 'rhomb', h, s: 68, trans: 0.55 }),
    cluster: h => ({ k: 'cluster', h, s: 55, l: -10, trans: 0.5 }),
    swirl: h => ({ k: 'orb', kind: 'swirl', h, s: 78 }),
    moon: h => ({ k: 'orb', kind: 'moon', h, s: 35, l: 10 }),
    planet: h => ({ k: 'orb', kind: 'planet', h, s: 68, l: -12 }),
    spire: h => ({ k: 'spire', h, s: 72, l: -8 }),
    plates: h => ({ k: 'plates', h, s: 58, l: -10 }),
    twin: h => ({ k: 'twin', h, s: 72, l: -6 }),
    star: h => ({ k: 'star', h, s: 82 }),
  };
  const HKEYS = Object.keys(HK);
  const ENVS = ['cave', 'forge', 'clockwork', 'cyber', 'void', 'ice', 'storm', 'mountain', 'arcane', 'abyss', 'space', 'desert', 'ocean', 'aurora', 'sanctum', 'temple', 'forest'];
  const ENTRIES = ['rise', 'drop', 'emerge', 'geode', 'orbit', 'unveil', 'forge', 'lightning', 'ignite', 'tide'];
  const FINALES = ['nova', 'pulse', 'beam', 'shatter', 'bloom', 'quake', 'sweep', 'implode'];
  const FXPOOL = [['sparks', 'dust'], ['embers', 'sparks'], ['arcs', 'dust'], ['snow', 'stars'], ['rain', 'arcs'], ['bubbles'], ['stars', 'sparks'], ['dust'], ['runes'], ['orbit', 'dust'], ['feathers', 'sparks'], ['leaves', 'fireflies'], ['sand', 'dust'], ['petals'], ['fireflies'], ['stars', 'orbit']];
  const CAMS = ['push', 'pull', 'drift'];

  /* deterministic pseudo-shuffle: same tier salt keeps neighbouring tiers from lining up the same way */
  const combo = (i, salt, hue) => {
    const hero = HK[HKEYS[(i * 3 + salt) % HKEYS.length]](hue);
    return {
      env: ENVS[(i * 7 + salt * 5 + 3) % ENVS.length],
      envHue: (hue + 40 + i * 13) % 360,
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

  /* ============ 10만대  EPIC  (x24) ============ */
  row([
    [100000, 'ironore', '철광석', 212],
    [140000, 'copperore', '구리광', 26],
    [175000, 'tinstone', '주석석', 198],
    [210000, 'silvervein', '은맥', 210, { hero: { s: 6, l: 82 } }],
    [245000, 'zincblende', '아연화석', 248],
    [280000, 'cobaltstone', '코발트석', 222],
    [315000, 'nickelnugget', '니켈괴', 92],
    [350000, 'chromite', '크롬석', 150],
    [385000, 'graphite', '흑연정', 0, { hero: { s: 0, l: 10 } }],
    [420000, 'sulfurcrystal', '유황결정', 54],
    [460000, 'galenaore', '방연석', 258],
    [500000, 'boraxstone', '붕사석', 188],
    [540000, 'mica', '운모편', 44],
    [580000, 'feldspar', '장석', 322],
    [620000, 'hematite', '적철석', 8],
    [660000, 'cinnabar', '진사', 355],
    [700000, 'platinumvein', '백금맥', 200, { hero: { s: 4, l: 86 } }],
    [740000, 'manganesenodule', '망간단괴', 282],
    [780000, 'antimonite', '휘안석', 214],
    [820000, 'bismuthcrystal', '비스무트결정', 280],
    [860000, 'wolframite', '텅스텐석', 22],
    [900000, 'steelcrystal', '강철결정', 206],
    [940000, 'quicksilverore', '수은석', 0, { hero: { k: 'orb', kind: 'swirl', h: 0, s: 4, l: 74 } } ],
    [999999, 'deepcore', '심층의 핵', 200, { hero: { k: 'orb', kind: 'planet', h: 200, s: 60 } }],
  ], 1);

  /* ============ 100만대  LEGENDARY  (x18) ============ */
  row([
    [1000000, 'titanshard', '티탄의 파편', 206],
    [1300000, 'obsidiancore', '흑요반', 272],
    [1600000, 'starmetal', '성철', 46],
    [1900000, 'voidiron', '공허철', 282],
    [2200000, 'magmaglass', '마그마유리', 14],
    [2500000, 'frostmetal', '서리금속', 196],
    [2800000, 'thunderore', '뇌광석', 54],
    [3200000, 'abyssalore', '심연광', 200],
    [3600000, 'runicalloy', '룬합금', 276],
    [4000000, 'crimsonsteel', '진홍강', 355],
    [4500000, 'emberore', '잉걸광', 20],
    [5000000, 'glacialcore', '빙하핵', 200],
    [5500000, 'spectralmetal', '유령금속', 252],
    [6000000, 'tidesteel', '조류강', 190],
    [6500000, 'stormcopper', '폭풍동', 222],
    [7000000, 'sunmetal', '태양금속', 46],
    [8000000, 'moonsilver', '월은', 220, { hero: { s: 20, l: 78 } }],
    [9999999, 'dragonsteel', '용강', 8],
  ], 2);

  /* ============ 1000만대  MYTHIC  (x22) ============ */
  row([
    [10000000, 'coreheart', '핵의 심장', 14],
    [12000000, 'veinlord', '광맥의 군주', 206],
    [14000000, 'deepforge', '심층 대장간석', 20],
    [16000000, 'mantlecrystal', '맨틀 결정', 8],
    [18500000, 'tectonicgem', '지각의 보석', 40],
    [21000000, 'oreheart', '광석의 심장', 210],
    [24000000, 'magmavein', '마그마맥', 15],
    [27000000, 'quakestone', '지진석', 26],
    [30000000, 'abyssironore', '심연철광', 282],
    [33000000, 'corerunite', '핵룬석', 276],
    [36000000, 'pressurecrystal', '압력결정', 200],
    [40000000, 'fissureore', '균열광', 192],
    [44000000, 'magnetheart', '자성의 심장', 230],
    [48000000, 'orichalcvein', '오리할쿰 광맥', 46],
    [52000000, 'mantleflame', '맨틀불꽃', 16, { hero: { k: 'orb', kind: 'swirl', h: 16, s: 100 }, extra: { fire: 16 } }],
    [56000000, 'veinofkings', '왕의 광맥', 46],
    [60000000, 'subterraneancore', '지저의 핵', 206],
    [65000000, 'boundlessore', '무한광', 262],
    [70000000, 'primevalironore', '태고철광', 210],
    [75000000, 'worldveinstone', '세계맥석', 150],
    [85000000, 'hollowearthgem', '공동지구석', 282],
    [99999999, 'coreofcreation', '창조의 핵', 46],
  ], 3);

  /* ============ 1억대  DIVINE - longer, grander (English names)  (x24) ============ */
  row([
    [100000000, 'coredrill', 'Coredrill', 8],
    [125000000, 'magmaheart', 'Magmaheart', 23],
    [150000000, 'ironsoul', 'Ironsoul', 205],
    [175000000, 'tectoniccrown', 'Tectonic Crown', 45],
    [200000000, 'abyssalforge', 'Abyssal Forge', 285],
    [225000000, 'mantlesovereign', 'Mantle Sovereign', 268],
    [250000000, 'deepveinmonarch', 'Deepvein Monarch', 195],
    [275000000, 'moltencore2', 'Molten Core', 14],
    [300000000, 'pressuretitan', 'Pressure Titan', 232],
    [325000000, 'voidmetal', 'Voidmetal', 300],
    [350000000, 'quakeheart', 'Quakeheart', 30],
    [375000000, 'seismiccrown', 'Seismic Crown', 58],
    [400000000, 'furnaceofages', 'Furnace of Ages', 18],
    [450000000, 'subterranthrone', 'Subterran Throne', 252],
    [500000000, 'thedeepforge', 'The Deep Forge', 12],
    [550000000, 'coreveil', 'Coreveil', 328],
    [600000000, 'magneticsovereign', 'Magnetic Sovereign', 218],
    [650000000, 'fissureking', 'Fissure King', 350],
    [700000000, 'bedrocketernal', 'Bedrock Eternal', 96],
    [750000000, 'hollowearthcrown', 'Hollow Earth Crown', 315],
    [800000000, 'gravitascore', 'Gravitas Core', 200],
    [850000000, 'theundermind', 'The Undermind', 275],
    [900000000, 'continentalheart', 'Continental Heart', 140],
    [999999999, 'terrasrequiem', "Terra's Requiem", 42],
  ], 5, 1.15);

  /* ============ 10억대  TRANSCENDENT - the deep vein's own colossal-scale films (x4)
     Heroes are bold geometric solids only (20-sided medallion spire / twin crystal cross / octahedron /
     tall spire) - never round "orb"/"eye"-like shapes at this tier. ============ */
  R(1300000000, 'planetarycore', 'Planetary Core', 205,
    { env: 'space', envHue: 205, hero: { k: 'prism', n: 20, h: 205, s: 70, l: -8, size: 1.3, shine: 70 }, entry: 'orbit', finale: 'nova', fx: ['stars', 'orbit', 'sparks'], cam: 'drift' },
    { duration: 16000, revealAt: 0.63, captions: [
      { a: 0.04, b: 0.24, en: '一个世界在黑暗中诞生', size: 26, pos: 'top', style: 'fly', from: 'top' },
      { a: 0.28, b: 0.5, en: '从未停止转动', size: 26, style: 'fly', from: 'left' },
      { a: 0.66, b: 1.4, en: '天核', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(3300000000, 'abyssalsovereign', 'Abyssal Sovereign', 12,
    { env: 'abyss', envHue: 8, hero: { k: 'twin', h: 12, s: 90, l: -6, size: 1.35, shine: 60 }, entry: 'tide', finale: 'quake', fx: ['embers', 'bubbles'], cam: 'push' },
    { duration: 17000, revealAt: 0.63, hue2: 40, captions: [
      { a: 0.04, b: 0.24, en: 'شيء قديم يتحرك في الأعماق', pos: 'top', size: 24, style: 'engrave' },
      { a: 0.28, b: 0.5, en: 'لطالما حكم الظلام', size: 24, style: 'engrave' },
      { a: 0.66, b: 0.92, en: 'الظلام الأبدي', pos: 'center', size: 26, style: 'engrave' },
    ] });
  R(6000000000, 'worldforge', 'World-Forge Eternal', 22,
    { env: 'forge', envHue: 20, hero: { k: 'octa', h: 22, s: 95, size: 1.4, shine: 70 }, entry: 'forge', finale: 'nova', fx: ['embers', 'sparks'], cam: 'push' },
    { duration: 18000, revealAt: 0.64, captions: [
      { a: 0.04, b: 0.25, en: 'THE FIRST FIRE NEVER DIED', pos: 'top', style: 'engrave', font: '"Segoe UI",system-ui,sans-serif' },
      { a: 0.29, b: 0.52, en: 'IT STILL SHAPES WHAT YOU HOLD', style: 'engrave', font: '"Segoe UI",system-ui,sans-serif' },
      { a: 0.68, b: 1.4, en: 'IT STILL BURNS BENEATH THE WORLD', style: 'engrave', font: '"Segoe UI",system-ui,sans-serif' },
    ] });
  R(9500000000, 'terminusofstone', 'Terminus of Stone', 280,
    { env: 'void', envHue: 280, hero: { k: 'spire', h: 280, s: 80, l: -10, size: 1.4, shine: 60 }, entry: 'unveil', finale: 'implode', fx: ['arcs', 'stars', 'runes'], cam: 'pull' },
    { duration: 19000, revealAt: 0.65, hue2: 320, captions: [
      { a: 0.04, b: 0.26, en: 'EVERY VEIN LEADS TO AN END', pos: 'top', style: 'engrave' },
      { a: 0.3, b: 0.54, en: 'THIS IS WHERE THE STONE STOPS', style: 'engrave' },
    ] });
})();
