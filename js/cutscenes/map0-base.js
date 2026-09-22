/*
  MAP 0 - SURFACE QUARRY  (the base map)
  10만대 x20  /  100만대 x15  /  1000만대 x18  /  1억대 x20   (+ 10억대 x3 and the secret in ultra.js)

  Every mineral is its own little film:  a real 3D stone (hero) in its own world (env), arriving its own way (entry),
  ending with its own impact (finale), with ambient effects (fx) - and a sound recipe derived from all of that.
  Row:  R(odds, id, name, hue, { env, hero, entry, finale, fx, cam, ... }, extra)
  For the next map: copy this file, change ZONE, write new rows.
*/
(() => {
  const ZONE = 0;
  const R = (odds, id, name, hue, cine, extra = {}) => {
    const t = G.tierIndex(odds);
    const dur = extra.duration || [0, 0, 0, 6800, 8200, 9600, 13000][t] + (id.length % 4) * 350;
    G.cutscenes.register(Object.assign({
      id, name, odds, zone: ZONE, template: 'cine', hue, colors: G.pal(hue, extra.hue2), cine, duration: dur,
    }, extra));
  };
  const B = (h, o = {}) => Object.assign({ k: 'brilliant', h, s: 88, trans: 0.75 }, o);   // faceted gem shorthand

  /* ============ 10만대  EPIC ============ */
  R(100000, 'quartz',     '석영',         205, { env: 'cave',   envHue: 215, hero: { k: 'cluster', h: 205, s: 35, l: 14, trans: 0.55 }, entry: 'rise',   finale: 'sweep',   fx: ['dust', 'sparks'], cam: 'push' });
  R(120000, 'pyrite',     '황철석',       46,  { env: 'cave',   envHue: 34,  hero: { k: 'cube', h: 46, s: 85, l: -4, hatch: 5, shine: 30 },  entry: 'drop',   finale: 'quake',   fx: ['sparks', 'dust'], cam: 'pull' });
  R(150000, 'fluorite',   '형석',         280, { env: 'aurora', envHue: 170, hero: { k: 'octa', h: 280, s: 70, trans: 0.6, faces: [280, 170, 300, 190] }, entry: 'emerge', finale: 'bloom', fx: ['fireflies', 'stars'], cam: 'drift' });
  R(180000, 'calcite',    '방해석',       36,  { env: 'temple', envHue: 38,  hero: { k: 'rhomb', h: 36, s: 80, trans: 0.7 },               entry: 'unveil', finale: 'pulse',   fx: ['dust'], cam: 'push' });
  R(220000, 'magnetite',  '자철석',       230, { env: 'storm',  envHue: 225, hero: { k: 'nugget', h: 230, s: 12, l: -18, shine: 20, amp: 0.34 }, entry: 'lightning', finale: 'implode', fx: ['rain', 'arcs'], cam: 'pull' });
  R(260000, 'garnet',     '석류석',       355, { env: 'forge',  envHue: 6,   hero: B(355, { l: -8 }),                                      entry: 'forge',  finale: 'nova',    fx: ['embers'], cam: 'push', });
  R(300000, 'peridot',    '감람석',       88,  { env: 'forest', envHue: 112, hero: B(88, { trans: 0.8 }),                                  entry: 'rise',   finale: 'bloom',   fx: ['fireflies', 'leaves'], cam: 'drift' });
  R(350000, 'lapis',      '청금석',       225, { env: 'space',  envHue: 235, hero: { k: 'orb', kind: 'lapis', h: 225, s: 75, l: -10 },      entry: 'orbit',  finale: 'sweep',   fx: ['stars', 'orbit'], cam: 'push' });
  R(400000, 'malachite',  '공작석',       150, { env: 'forest', envHue: 155, hero: { k: 'nugget', h: 150, s: 70, l: -14, faces: [150, 138, 162, 128, 166], shine: 26 }, entry: 'geode', finale: 'quake', fx: ['leaves', 'dust'], cam: 'pull' });
  R(450000, 'amber',      '호박',         36,  { env: 'desert', envHue: 30,  hero: { k: 'orb', kind: 'amber', h: 36, s: 95, l: -4 },        entry: 'unveil', finale: 'pulse',   fx: ['dust', 'sand'], cam: 'drift' });
  R(500000, 'obsidian',   '흑요석',       270, { env: 'forge',  envHue: 8,   hero: { k: 'shard', h: 270, s: 20, l: -30, shine: 90 },        entry: 'drop',   finale: 'shatter', fx: ['embers'], cam: 'push' });
  R(550000, 'moonstone',  '월장석',       215, { env: 'ocean',  envHue: 220, hero: { k: 'orb', kind: 'moon', h: 215, s: 40, l: 8 },         entry: 'rise',   finale: 'beam',    fx: ['fireflies', 'bubbles'], cam: 'pull' });
  R(600000, 'carnelian',  '홍옥수',       16,  { env: 'desert', envHue: 18,  hero: { k: 'nugget', h: 16, s: 90, trans: 0.5, amp: 0.22 },    entry: 'drop',   finale: 'nova',    fx: ['sand', 'sparks'], cam: 'push' });
  R(650000, 'citrine',    '황수정',       48,  { env: 'sanctum', envHue: 48, hero: { k: 'cluster', h: 48, s: 95, trans: 0.6 },              entry: 'emerge', finale: 'beam',    fx: ['feathers', 'sparks'], cam: 'pull' });
  R(700000, 'smoky',      '연수정',       28,  { env: 'cave',   envHue: 30,  hero: { k: 'cluster', h: 28, s: 30, l: -16, trans: 0.55 },     entry: 'geode',  finale: 'quake',   fx: ['dust'], cam: 'drift' });
  R(750000, 'rosequartz', '장미석영',     340, { env: 'sanctum', envHue: 335, hero: { k: 'nugget', h: 340, s: 60, l: 6, trans: 0.5, amp: 0.18 }, entry: 'emerge', finale: 'bloom', fx: ['petals'], cam: 'push' });
  R(800000, 'topaz',      '토파즈',       40,  { env: 'mountain', envHue: 30, hero: B(40, { s: 95, trans: 0.8 }),                          entry: 'drop',   finale: 'nova',    fx: ['sparks', 'stars'], cam: 'pull' });
  R(850000, 'tourmaline', '전기석',       330, { env: 'aurora', envHue: 320, hero: { k: 'spire', h: 330, s: 80, faces: [330, 120, 180, 300], trans: 0.5 }, entry: 'orbit', finale: 'pulse', fx: ['arcs', 'fireflies'], cam: 'drift' });
  R(900000, 'desertrose', '사막의 장미',  24,  { env: 'desert', envHue: 20,  hero: { k: 'plates', h: 24, s: 55, l: -6 },                    entry: 'rise',   finale: 'bloom',   fx: ['sand', 'dust'], cam: 'push' });
  R(999999, 'opal',       '오팔',         180, { env: 'void',   envHue: 280, hero: { k: 'orb', kind: 'opal', h: 180 },                      entry: 'unveil', finale: 'sweep',   fx: ['stars', 'sparks'], cam: 'pull' });

  /* ============ 100만대  LEGENDARY ============ */
  R(1000000, 'sapphire',     '사파이어',         222, { env: 'storm',   envHue: 222, hero: B(222, { s: 92 }),                                   entry: 'lightning', finale: 'nova',    fx: ['rain', 'sparks'], cam: 'push' });
  R(1200000, 'ruby',         '루비',             352, { env: 'forge',   envHue: 0,   hero: B(352, { s: 95 }),                                   entry: 'forge',   finale: 'implode', fx: ['embers', 'sparks'], cam: 'pull' });
  R(1500000, 'emerald',      '에메랄드',         148, { env: 'forest',  envHue: 140, hero: { k: 'spire', h: 148, s: 85, trans: 0.8 },            entry: 'rise',    finale: 'bloom',   fx: ['fireflies', 'leaves'], cam: 'drift' });
  R(1800000, 'alexandrite',  '알렉산드라이트',   350, { env: 'temple',  envHue: 200, hero: B(350, { shift: 150, s: 85 }),                        entry: 'unveil',  finale: 'sweep',   fx: ['dust', 'stars'], cam: 'push' });
  R(2000000, 'tanzanite',    '탄자나이트',       262, { env: 'aurora',  envHue: 250, hero: B(262, { s: 85 }),                                   entry: 'orbit',   finale: 'pulse',   fx: ['stars', 'snow'], cam: 'drift' });
  R(2500000, 'paraiba',      '파라이바',         176, { env: 'abyss',   envHue: 178, hero: B(176, { s: 95, trans: 0.85 }),                      entry: 'tide',    finale: 'beam',    fx: ['bubbles'], cam: 'pull' });
  R(3000000, 'redberyl',     '레드 베릴',        4,   { env: 'desert',  envHue: 8,   hero: { k: 'spire', h: 4, s: 85, trans: 0.7 },              entry: 'drop',    finale: 'quake',   fx: ['sand', 'embers'], cam: 'push' });
  R(3500000, 'blackopal',    '블랙 오팔',        200, { env: 'space',   envHue: 265, hero: { k: 'orb', kind: 'opal', h: 200, s: 60, l: -26 },   entry: 'emerge',  finale: 'sweep',   fx: ['stars', 'orbit'], cam: 'pull' });
  R(4000000, 'padparadscha', '파파라차',         14,  { env: 'ocean',   envHue: 15,  hero: B(14, { s: 95, l: 4 }),                               entry: 'rise',    finale: 'bloom',   fx: ['petals', 'sparks'], cam: 'drift' });
  R(4500000, 'spinel',       '스피넬',           348, { env: 'cave',    envHue: 345, hero: { k: 'octa', h: 348, s: 88, trans: 0.7 },             entry: 'geode',   finale: 'shatter', fx: ['dust', 'sparks'], cam: 'push' });
  R(5000000, 'demantoid',    '데만토이드',       100, { env: 'forest',  envHue: 100, hero: B(100, { s: 90 }), fire: 105,                         entry: 'ignite',  finale: 'nova',    fx: ['fireflies'], cam: 'pull' });
  R(6000000, 'grandidier',   '그랜디디어라이트', 168, { env: 'abyss',   envHue: 165, hero: { k: 'nugget', h: 168, s: 60, trans: 0.6, amp: 0.2 }, entry: 'tide',    finale: 'pulse',   fx: ['bubbles'], cam: 'drift' });
  R(7000000, 'musgravite',   '머스그레이바이트', 275, { env: 'arcane',  envHue: 275, hero: B(275, { s: 30, l: -6 }),                            entry: 'orbit',   finale: 'implode', fx: ['runes'], cam: 'push' });
  R(8000000, 'painite',      '페인나이트',       10,  { env: 'forge',   envHue: 10,  hero: { k: 'prism', h: 10, s: 60, l: -10, n: 6 },           entry: 'drop',    finale: 'quake',   fx: ['embers'], cam: 'pull' });
  R(9999999, 'bluediamond',  '블루 다이아몬드',  200, { env: 'ice',     envHue: 200, hero: B(200, { s: 60, l: 8, trans: 0.9, shine: 80 }),      entry: 'unveil',  finale: 'sweep',   fx: ['snow', 'stars'], cam: 'push' });

  /* ============ 1000만대  MYTHIC ============ */
  R(10000000, 'orichalcum',   '오리하르콘',     30,  { env: 'forge',   envHue: 30,  hero: { k: 'shard', h: 35, s: 95, l: -4, shine: 70 }, fire: 30, entry: 'forge',    finale: 'nova',    fx: ['sparks', 'embers'], cam: 'push' });
  R(12000000, 'mithril',      '미스릴',         205, { env: 'mountain', envHue: 205, hero: { k: 'shard', h: 205, s: 40, l: 10, shine: 100 },      entry: 'unveil',   finale: 'sweep',   fx: ['snow', 'stars'], cam: 'pull' });
  R(15000000, 'adamantite',   '아다만타이트',   285, { env: 'cave',    envHue: 285, hero: { k: 'nugget', h: 285, s: 45, l: -20, amp: 0.3, shine: 60 }, entry: 'drop', finale: 'quake',   fx: ['arcs', 'dust'], cam: 'push' });
  R(18000000, 'stardust',     '스타더스트',     45,  { env: 'space',   envHue: 40,  hero: { k: 'star', h: 45, s: 90 },                          entry: 'emerge',   finale: 'bloom',   fx: ['stars', 'sparks'], cam: 'drift' });
  R(20000000, 'chronostone',  '크로노스톤',     190, { env: 'clockwork', envHue: 190, hero: { k: 'orb', kind: 'swirl', h: 190, s: 85 },          entry: 'orbit',    finale: 'implode', fx: ['orbit', 'dust'], cam: 'pull' });
  R(25000000, 'skystone',     '천공석',         195, { env: 'sanctum', envHue: 200, hero: B(195, { s: 90, trans: 0.8 }),                         entry: 'rise',     finale: 'beam',    fx: ['feathers', 'stars'], cam: 'push' });
  R(30000000, 'nebulite',     '성운석',         300, { env: 'space',   envHue: 300, hero: { k: 'orb', kind: 'swirl', h: 300, s: 80 },            entry: 'emerge',   finale: 'pulse',   fx: ['stars', 'sparks'], cam: 'pull' });
  R(35000000, 'cometcore',    '혜성핵',         195, { env: 'space',   envHue: 195, hero: { k: 'nugget', h: 195, s: 60, trans: 0.6 },             entry: 'drop',     finale: 'shatter', fx: ['snow', 'sparks'], cam: 'push' });
  R(40000000, 'dragonblood',  '용혈석',         2,   { env: 'forge',   envHue: 5,   hero: { k: 'nugget', h: 2, s: 95, l: -12, trans: 0.3 }, fire: 4, entry: 'ignite',  finale: 'nova',    fx: ['embers'], cam: 'drift' });
  R(45000000, 'phoenixtear',  '불사조의 눈물',  22,  { env: 'sanctum', envHue: 20,  hero: { k: 'orb', kind: 'swirl', h: 22, s: 100 }, fire: 22,   entry: 'ignite',   finale: 'bloom',   fx: ['feathers', 'embers'], cam: 'push' });
  R(50000000, 'seakingstone', '해왕석',         185, { env: 'abyss',   envHue: 190, hero: B(185, { s: 90 }),                                     entry: 'tide',     finale: 'beam',    fx: ['bubbles'], cam: 'pull' });
  R(55000000, 'froststone',   '서리심장',       200, { env: 'ice',     envHue: 200, hero: { k: 'cluster', h: 200, s: 70, trans: 0.7 },            entry: 'rise',     finale: 'shatter', fx: ['snow'], cam: 'push' });
  R(60000000, 'soulstone',    '영혼석',         150, { env: 'forest',  envHue: 150, hero: { k: 'orb', kind: 'swirl', h: 150, s: 70, l: 8 },        entry: 'emerge',   finale: 'pulse',   fx: ['fireflies', 'runes'], cam: 'drift' });
  R(65000000, 'voidcrystal',  '공허수정',       285, { env: 'void',    envHue: 285, hero: { k: 'spire', h: 285, s: 80, l: -14 },                  entry: 'unveil',   finale: 'implode', fx: ['arcs', 'stars'], cam: 'pull' });
  R(70000000, 'sunstone',     '태양석',         42,  { env: 'desert',  envHue: 38,  hero: B(42, { s: 100, l: 4 }),                               entry: 'rise',     finale: 'nova',    fx: ['sparks', 'sand'], cam: 'push' });
  R(80000000, 'thunderstone', '뇌정석',         52,  { env: 'storm',   envHue: 55,  hero: { k: 'octa', h: 52, s: 95 },                            entry: 'lightning', finale: 'quake',  fx: ['rain', 'arcs'], cam: 'drift' });
  R(90000000, 'worldtree',    '세계수의 결정',  118, { env: 'forest',  envHue: 115, hero: { k: 'cluster', h: 118, s: 75, faces: [118, 50, 130, 60], trans: 0.6 }, entry: 'geode', finale: 'bloom', fx: ['leaves', 'fireflies'], cam: 'pull' });
  R(99999999, 'holycrystal',  '신성한 결정',    48,  { env: 'temple',  envHue: 48,  hero: { k: 'cluster', h: 48, s: 40, l: 14, trans: 0.8 },       entry: 'rise',     finale: 'beam',    fx: ['feathers', 'dust'], cam: 'push' });

  /* ============ 1억대  DIVINE - longer, grander (English names) ============ */
  R(100000000, 'aetherium',    'Aetherium',        200, { env: 'space',    envHue: 200, hero: B(200, { size: 1.15 }),                              entry: 'emerge',   finale: 'nova',    fx: ['stars', 'sparks'], cam: 'push' });
  R(125000000, 'solarisprism', 'Solaris Prism',    45,  { env: 'sanctum',  envHue: 45,  hero: { k: 'star', h: 45, s: 90, size: 1.1 },               entry: 'drop',     finale: 'sweep',   fx: ['sparks', 'feathers'], cam: 'pull' });
  R(150000000, 'nebulaheart',  'Nebula Heart',     300, { env: 'space',    envHue: 300, hero: { k: 'orb', kind: 'swirl', h: 300, s: 80, size: 1.15 }, entry: 'emerge', finale: 'pulse',   fx: ['stars'], cam: 'drift' }, { hue2: 200 });
  R(175000000, 'astralcrown',  'Astral Crown',     48,  { env: 'temple',   envHue: 48,  hero: { k: 'cluster', h: 48, s: 90, size: 1.1 },            entry: 'orbit',    finale: 'beam',    fx: ['feathers', 'dust'], cam: 'push' });
  R(200000000, 'voidmonarch',  'Void Monarch',     280, { env: 'void',     envHue: 280, hero: { k: 'spire', h: 280, s: 85, l: -8, size: 1.2 },      entry: 'rise',     finale: 'shatter', fx: ['arcs', 'stars'], cam: 'pull' });
  R(250000000, 'stormcaller',  'Stormcaller Gem',  215, { env: 'storm',    envHue: 215, hero: B(215, { s: 92, size: 1.15 }),                        entry: 'lightning', finale: 'sweep',  fx: ['rain', 'arcs'], cam: 'push' });
  R(300000000, 'celestine',    'Celestine Throne', 190, { env: 'aurora',   envHue: 190, hero: { k: 'spire', h: 190, s: 80, trans: 0.7, size: 1.2 }, entry: 'unveil',   finale: 'beam',    fx: ['snow', 'stars'], cam: 'drift' }, { hue2: 280 });
  R(350000000, 'abyssalhalo',  'Abyssal Halo',     205, { env: 'abyss',    envHue: 205, hero: { k: 'orb', kind: 'pearl', h: 205, s: 70, size: 1.15 }, entry: 'tide',   finale: 'pulse',   fx: ['bubbles'], cam: 'pull' });
  R(400000000, 'phoenixreq',   'Phoenix Requiem',  20,  { env: 'forge',    envHue: 20,  hero: { k: 'orb', kind: 'swirl', h: 20, s: 100, size: 1.2 }, fire: 20, entry: 'ignite', finale: 'nova', fx: ['embers', 'feathers'], cam: 'push' });
  R(450000000, 'chronoprism',  'Chrono Prism',     170, { env: 'clockwork', envHue: 170, hero: B(170, { size: 1.15 }),                              entry: 'orbit',    finale: 'implode', fx: ['orbit', 'dust'], cam: 'pull' });
  R(500000000, 'dragoneclipse', "Dragon's Eclipse", 8,  { env: 'forge',    envHue: 8,   hero: { k: 'orb', kind: 'planet', h: 8, s: 90, l: -10, size: 1.2 }, entry: 'drop', finale: 'shatter', fx: ['embers'], cam: 'push' });
  R(550000000, 'starforge',    'Starforge Core',   320, { env: 'cyber',    envHue: 320, hero: { k: 'octa', h: 320, s: 90, size: 1.15 },              entry: 'forge',    finale: 'nova',    fx: ['sparks'], cam: 'pull' }, { hue2: 200 });
  R(600000000, 'eternalfrost', 'Eternal Frost',    195, { env: 'ice',      envHue: 195, hero: { k: 'spire', h: 195, s: 70, trans: 0.7, size: 1.2 }, entry: 'rise',     finale: 'beam',    fx: ['snow', 'stars'], cam: 'push' });
  R(650000000, 'lunarsov',     'Lunar Sovereign',  225, { env: 'ocean',    envHue: 225, hero: { k: 'orb', kind: 'moon', h: 225, s: 40, l: 8, size: 1.2 }, entry: 'rise', finale: 'sweep',   fx: ['fireflies', 'bubbles'], cam: 'drift' });
  R(700000000, 'crimsonzenith', 'Crimson Zenith',  355, { env: 'storm',    envHue: 355, hero: { k: 'shard', h: 355, s: 90, size: 1.2 },             entry: 'drop',     finale: 'quake',   fx: ['rain', 'sparks'], cam: 'pull' });
  R(750000000, 'orionstear',   "Orion's Tear",     210, { env: 'space',    envHue: 210, hero: B(210, { trans: 0.9, size: 1.2 }),                      entry: 'orbit',    finale: 'beam',    fx: ['stars'], cam: 'push' });
  R(800000000, 'genesisbloom', 'Genesis Bloom',    150, { env: 'aurora',   envHue: 150, hero: { k: 'plates', h: 150, s: 70, size: 1.25 },            entry: 'emerge',   finale: 'bloom',   fx: ['petals', 'fireflies'], cam: 'drift' }, { hue2: 60 });
  R(850000000, 'wardenruin',   'Warden of Ruin',   340, { env: 'temple',   envHue: 340, hero: { k: 'nugget', h: 340, s: 60, l: -14, amp: 0.3, size: 1.2 }, entry: 'geode', finale: 'shatter', fx: ['arcs', 'dust'], cam: 'pull' });
  R(900000000, 'seraphengine', 'Seraph Engine',    50,  { env: 'cyber',    envHue: 50,  hero: B(50, { size: 1.2 }),                                   entry: 'unveil',   finale: 'pulse',   fx: ['feathers', 'sparks'], cam: 'push' });
  R(999999999, 'omegaprism',   'Omega Prism',      280, { env: 'arcane',   envHue: 280, hero: B(280, { shift: 40, size: 1.3 }),                     entry: 'emerge',   finale: 'implode', fx: ['runes', 'stars'], cam: 'drift' }, { hue2: 40 });
})();
