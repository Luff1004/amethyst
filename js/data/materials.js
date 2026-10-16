/*
  RESOURCES & THE CAULDRON - js/inventory.js runs it (drops, the inventory, the cauldron)

  Resources: every 10 s, the weather overhead (or the rare biome, while one is up) has a chance to
  hand over one of its own resource - 20% (rare skies: 17.5%). They go to the inventory.
  Rarity follows how much of the time that sky is actually overhead (weight x duration in its map):
    COMMON     10%+ of the time          UNCOMMON  4-10%          RARE  1.5-4%
    EPIC       about 1% (storm skies)    LEGENDARY under 0.5% (rainbow, THE SOLAR / MOONLIGHT) and CUBER STAGE
    MYTHIC     the 1-in-1000 biomes (GLITCH, THE HEAVEN, NULL)

  Crystals: made in the cauldron from resources (no more boxes). Nine of them, one step per stage of
  the game; most recipes also take one of the crystal a step below, so the ladder is climbed.
  Crystal ids never share an id with a resource (a recipe's `need` mixes the two).
  Same effect as before: drink one and your next manual click rolls with `luck` added.
*/
G.data.rarities = {
  common:    { name: '일반',   en: 'COMMON',    color: '#b8bcc8' },
  uncommon:  { name: '고급',   en: 'UNCOMMON',  color: '#6adf8a' },
  rare:      { name: '희귀',   en: 'RARE',      color: '#5aa8ff' },
  epic:      { name: '영웅',   en: 'EPIC',      color: '#b878ff' },
  legendary: { name: '전설',   en: 'LEGENDARY', color: '#ffb63d' },
  mythic:    { name: '신화',   en: 'MYTHIC',    color: '#ff4a6a' },
};
G.data.dropRate = { normal: 0.2, rare: 0.175, every: 10 };      // per 10 s

/* id, name, en, rarity, from (weathers / biome ids), where */
G.data.materials = [
  // ---- 1~2번째 맵 (the surface) ----
  { id: 'sunshard',  name: '햇살 조각',   en: 'SUNSHARD',        r: 'common',    from: ['sunny'],             map: '1~2' },
  { id: 'feather',   name: '바람 깃털',   en: 'WIND FEATHER',    r: 'common',    from: ['breeze'],            map: '1~2' },
  { id: 'mistdrop',  name: '안개 방울',   en: 'MIST DROP',       r: 'common',    from: ['fog', 'damp'],       map: '1~4' },
  { id: 'raindrop',  name: '빗방울',      en: 'RAINDROP',        r: 'common',    from: ['drizzle', 'rain'],   map: '1~2' },
  { id: 'cloudwisp', name: '구름 솜',     en: 'CLOUD WISP',      r: 'common',    from: ['cloudy'],            map: '1~2' },
  { id: 'petal',     name: '꽃잎',        en: 'PETAL',           r: 'uncommon',  from: ['petals'],            map: '1~2 낮' },
  { id: 'snowflake', name: '눈꽃 결정',   en: 'SNOWFLAKE',       r: 'uncommon',  from: ['snow'],              map: '1~2' },
  { id: 'starbit',   name: '별의 조각',   en: 'STAR FRAGMENT',   r: 'uncommon',  from: ['starry'],            map: '1~2 밤' },
  { id: 'glowdust',  name: '반딧불 가루', en: 'GLOW DUST',       r: 'uncommon',  from: ['fireflies', 'glowworms'], map: '1~4' },
  { id: 'meteorite', name: '유성 파편',   en: 'METEORITE',       r: 'rare',      from: ['meteor'],            map: '1~2' },
  { id: 'thunder',   name: '번개 정수',   en: 'THUNDER ESSENCE', r: 'rare',      from: ['lightning'],         map: '1~2' },
  { id: 'prism',     name: '무지개 조각', en: 'PRISM SHARD',     r: 'legendary', from: ['rainbow'],           map: '1~2', rareSky: true },
  { id: 'solarcore', name: '태양의 핵',   en: 'SOLAR CORE',      r: 'legendary', from: ['solar'],             map: '1~2 낮', rareSky: true },
  { id: 'moonstone', name: '월광석',      en: 'MOONSTONE',       r: 'legendary', from: ['moonlight'],         map: '1~2 밤', rareSky: true },
  // ---- 3~4번째 맵 (underground) ----
  { id: 'stonedust', name: '돌가루',      en: 'STONE DUST',      r: 'common',    from: ['stillair', 'rockfall'], map: '3~4' },
  { id: 'coal',      name: '지열 숯',     en: 'HEARTH COAL',     r: 'common',    from: ['geothermal'],        map: '3~4' },
  { id: 'quartz',    name: '공명 수정',   en: 'RESONANT QUARTZ', r: 'uncommon',  from: ['resonance'],         map: '3~4' },
  { id: 'slime',     name: '산성 점액',   en: 'ACID SLIME',      r: 'rare',      from: ['acid'],              map: '3~4' },
  { id: 'isotope',   name: '방사성 결정', en: 'ISOTOPE',         r: 'rare',      from: ['radio'],             map: '3~4' },
  { id: 'magma',     name: '용암석',      en: 'MAGMA STONE',     r: 'epic',      from: ['eruption'],          map: '3~4' },
  { id: 'dunglass',  name: '사막 유리',   en: 'DESERT GLASS',    r: 'epic',      from: ['sandstorm'],         map: '3~4', rareSky: true },
  // ---- 5~6번째 맵 (the void, the cosmos) ----
  { id: 'silence',   name: '정적의 먼지', en: 'SILENT DUST',     r: 'common',    from: ['stillness'],         map: '5~6' },
  { id: 'echo',      name: '메아리 조각', en: 'ECHO SHARD',      r: 'common',    from: ['echoes'],            map: '5~6' },
  { id: 'graviton',  name: '중력 구슬',   en: 'GRAVITON',        r: 'uncommon',  from: ['gravity'],           map: '5~6' },
  { id: 'timesand',  name: '시간의 모래', en: 'TIME SAND',       r: 'uncommon',  from: ['stasis'],            map: '5~6' },
  { id: 'stardust',  name: '성간 먼지',   en: 'STARDUST',        r: 'uncommon',  from: ['starwind'],          map: '5~6' },
  { id: 'nebula',    name: '성운 결정',   en: 'NEBULA CORE',     r: 'rare',      from: ['starflux'],          map: '5~6' },
  { id: 'riftshard', name: '균열 파편',   en: 'RIFT SHARD',      r: 'rare',      from: ['rift'],              map: '5~6' },
  { id: 'voidess',   name: '공허 정수',   en: 'VOID ESSENCE',    r: 'epic',      from: ['voidstorm'],         map: '5', rareSky: true },
  // ---- rare biomes ----
  { id: 'neoncube',  name: '네온 큐브',   en: 'NEON CUBE',       r: 'legendary', from: ['cuber'],  biome: true, map: '어디서나' },
  { id: 'brokencode',name: '깨진 코드',   en: 'BROKEN CODE',     r: 'mythic',    from: ['glitch'], biome: true, map: '어디서나' },
  { id: 'halo',      name: '천상의 깃털', en: 'HALO FEATHER',    r: 'mythic',    from: ['heaven'], biome: true, map: '1~6' },
  { id: 'nullshard', name: '무(無)의 파편', en: 'NULL SHARD',    r: 'mythic',    from: ['null'],   biome: true, map: '5~6' },
];

/* the nine crystals of the cauldron: what goes in, what it does (luck on the next manual click) */
G.data.recipes = [
  { id: 'dawn',      name: '새벽 크리스탈',   en: 'DAWN CRYSTAL',      star: 1, hue: 40,  luck: 2e3,  map: '1~2',
    need: { sunshard: 10, raindrop: 10, feather: 5 } },
  { id: 'bloom',     name: '꽃안개 크리스탈', en: 'BLOOM CRYSTAL',     star: 2, hue: 330, luck: 1.5e4, map: '1~2',
    need: { petal: 8, mistdrop: 15, cloudwisp: 10, dawn: 1 } },
  { id: 'starlight', name: '별빛 크리스탈',   en: 'STARLIGHT CRYSTAL', star: 3, hue: 50,  luck: 1e5,  map: '1~2',
    need: { starbit: 12, glowdust: 10, snowflake: 8 } },
  { id: 'storm',     name: '뇌운 크리스탈',   en: 'STORM CRYSTAL',     star: 4, hue: 58,  luck: 8e5,  map: '1~2',
    need: { thunder: 5, meteorite: 5, raindrop: 30, starlight: 1 } },
  { id: 'lava',      name: '용암 크리스탈',   en: 'MAGMA CRYSTAL',     star: 5, hue: 12,  luck: 6e6,  map: '3~4',
    need: { coal: 25, stonedust: 30, quartz: 10, magma: 2, storm: 1 } },
  { id: 'spectrum',  name: '프리즘 크리스탈', en: 'PRISM CRYSTAL',     star: 6, hue: 300, luck: 5e7,  map: '3~4',
    need: { prism: 2, dunglass: 2, slime: 5, isotope: 5, lava: 1 } },
  { id: 'galaxy',    name: '성운 크리스탈',   en: 'NEBULA CRYSTAL',    star: 7, hue: 230, luck: 1e10, map: '5~6', minZone: 4,
    need: { stardust: 30, nebula: 6, riftshard: 6, timesand: 12, graviton: 12, spectrum: 1 } },
  { id: 'celestial', name: '천체 크리스탈',   en: 'CELESTIAL CRYSTAL', star: 8, hue: 200, luck: 5e12, map: '5~6', minZone: 4,
    need: { solarcore: 1, moonstone: 1, voidess: 3, neoncube: 2, galaxy: 1 } },
  { id: 'origin',    name: '근원 크리스탈',   en: 'ORIGIN CRYSTAL',    star: 9, hue: 0,   luck: 1e15, map: '5~6', minZone: 4,
    need: { halo: 1, nullshard: 1, brokencode: 1, celestial: 1 } },
];

/* the crafted crystals are ordinary crystal items once made (drunk from the 크리스탈 tab, stacking
   like the rest) - they only ever come out of the cauldron, never out of a box */
G.data.recipes.forEach(r => G.data.potions.push({ id: r.id, name: r.name, en: r.en, hue: r.hue, star: r.star, luck: r.luck, crafted: true, minZone: r.minZone }));
G.data.matById = Object.fromEntries(G.data.materials.map(m => [m.id, m]));

/* LUCK CHARMS - the other thing the 제조 tab makes. Not a one-click crystal: used from the inventory,
   a charm multiplies your luck for `min` minutes. Several running at once don't stack - the strongest
   counts; using one that's already running adds its time. Made from resources only. */
G.data.charms = [
  { id: 'clovercharm', name: '네잎 부적',       en: 'CLOVER CHARM',     glyph: 'clover', hue: 130, mul: 1.3, min: 5,  need: { petal: 5, feather: 5, sunshard: 8 } },
  { id: 'starcharm',   name: '별똥 부적',       en: 'SHOOTING STAR',    glyph: 'star',   hue: 48,  mul: 1.5, min: 5,  need: { starbit: 6, meteorite: 2, glowdust: 4 } },
  { id: 'frostward',   name: '서리 호부',       en: 'FROST WARD',       glyph: 'frost',  hue: 196, mul: 1.6, min: 10, need: { snowflake: 8, mistdrop: 10, cloudwisp: 10 } },
  { id: 'stormtotem',  name: '뇌운 토템',       en: 'STORM TOTEM',      glyph: 'bolt',   hue: 56,  mul: 2,   min: 5,  need: { thunder: 4, raindrop: 20, quartz: 6 } },
  { id: 'magmaheart',  name: '용암의 심장',     en: 'MAGMA HEART',      glyph: 'heart',  hue: 10,  mul: 2.5, min: 10, need: { magma: 2, coal: 20, slime: 4, isotope: 4 } },
  { id: 'hourglass',   name: '시간의 모래시계', en: 'HOURGLASS OF AGES', glyph: 'glass', hue: 172, mul: 3,   min: 15, need: { timesand: 10, graviton: 8, echo: 15, nebula: 2 } },
  { id: 'prismgrail',  name: '무지개 성배',     en: 'PRISM GRAIL',      glyph: 'grail',  hue: 300, mul: 5,   min: 10, need: { prism: 1, solarcore: 1, moonstone: 1, dunglass: 2, voidess: 1 } },
];

/* GAUNTLETS - the long road. Worn (one at a time, from the inventory) they multiply your luck for
   good. Each takes crystals, charms and a mountain of resources - and from RAGE on, a pile of the
   lesser gauntlets too (up to 15 LUCK GLOVEs or 15 RAGEs) - then, once every
   slot is full, hours on the forge (real time; it keeps going while the game is closed).
   Paced for about 4 hours of play a day: LUCK GLOVE an evening, STRIKER about three and a half weeks,
   ILLUSIONARY about two months (the rare-biome and THE SOLAR / MOONLIGHT drops are the wall), DREAM MAKER
   about four: twenty of every rare-biome resource - the dream ones only fall between midnight and 3 am. */
G.data.gauntlets = [
  { id: 'luckglove',       name: '럭 글러브',          en: 'LUCK GLOVE',      style: 'luck',    hue: 130, mul: 1.25, forge: 10,
    need: { sunshard: 40, feather: 20, petal: 10, clovercharm: 1, dawn: 1 } },
  { id: 'ragegauntlet',    name: '분노 건틀렛',        en: 'RAGE GAUNTLET',   style: 'rage',    hue: 4,   mul: 1.5,  forge: 30,
    need: { coal: 120, magma: 3, thunder: 6, stormtotem: 2, storm: 1, luckglove: 5 } },
  { id: 'nanogauntlet',    name: '나노 건틀렛',        en: 'NANO GAUNTLET',   style: 'nano',    hue: 205, mul: 1.8,  forge: 120,
    need: { quartz: 120, isotope: 15, slime: 15, magmaheart: 1, lava: 2, luckglove: 10 } },
  { id: 'virtualgauntlet', name: '버츄얼 건틀렛',      en: 'VIRTUAL',         style: 'virtual', hue: 180, mul: 2.2,  forge: 360,
    need: { echo: 200, neoncube: 8, brokencode: 2, frostward: 4, spectrum: 1, luckglove: 15, ragegauntlet: 2 } },
  { id: 'strikergauntlet', name: '스트라이커',         en: 'STRIKER',         style: 'striker', hue: 48,  mul: 3,    forge: 720,
    need: { thunder: 50, meteorite: 50, prism: 5, dunglass: 6, stormtotem: 6, starcharm: 6, ragegauntlet: 3, nanogauntlet: 1 } },
  { id: 'cybergauntlet',   name: '사이버스페이스',     en: 'CYBERSPACE',      style: 'cyber',   hue: 300, mul: 4,    forge: 1440,
    need: { riftshard: 50, neoncube: 16, brokencode: 5, nullshard: 3, hourglass: 3, celestial: 1, luckglove: 15, nanogauntlet: 2 } },
  { id: 'illusionary',     name: '일루셔너리',         en: 'ILLUSIONARY',     style: 'illusion', hue: 270, mul: 6,   forge: 2880,
    need: { halo: 6, nullshard: 6, solarcore: 4, moonstone: 4, prismgrail: 3, origin: 1, dreamshard: 40, twistedshard: 3, ragegauntlet: 15, strikergauntlet: 1 } },
  { id: 'dreamgauntlet',   name: 'DREAM MAKER',        en: 'DREAM MAKER',     style: 'dream',   hue: 315, mul: 9,    forge: 5760,
    need: { neoncube: 20, brokencode: 20, halo: 20, nullshard: 20, dreamshard: 20, twistedshard: 20, nightmareshard: 20, prismgrail: 5, origin: 2, illusionary: 1 } },
];

/* the dream biomes' own resources (js/biome.js DREAM / LUCID DREAM / NIGHTMARE) */
G.data.materials.push(
  { id: 'dreamshard',    name: '꿈 조각',          en: 'DREAM SHARD',     r: 'legendary', from: ['dream'],     biome: true, map: '어디서나 · 밤' },
  { id: 'twistedshard',  name: '뒤틀린 꿈의 조각', en: 'TWISTED DREAM',   r: 'mythic',    from: ['lucid'],     biome: true, map: '어디서나 · 밤' },
  { id: 'nightmareshard', name: '악몽 조각',       en: 'NIGHTMARE SHARD', r: 'mythic',    from: ['nightmare'], biome: true, map: '어디서나 · 밤' },
);
G.data.materials.forEach(m => { G.data.matById[m.id] = m; });
