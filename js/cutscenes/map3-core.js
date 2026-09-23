/*
  MAP 3 - MOLTEN CORE  (a fourth material family: things forged, compressed or melted into being -
  lava glass, obsidian, ember-metal, pressure-diamond - distinct from Quarry/Vein/Cavern)
  10만대 x20 / 100만대 x18 / 1000만대 x18 / 1억대 x20  = 76, + 10억대 x5 = 81, + secret x1 (js/cutscenes/ultra4.js)

  This zone also has its own gimmick (see js/game.js `isGated`): below 곡괭이 강화 lv.100 the gems are
  too hard to crack, so nothing here plays until the player upgrades their pickaxe.

  Same machinery as map1-vein.js / map2-cavern.js: curated [odds,id,name,hue] rows + combo(i) cycling
  the whole cine palette so nothing feels copy-pasted, plus spread() for the odds ladder.
*/
(() => {
  const ZONE = 3;
  const R = (odds, id, name, hue, cine, extra = {}) => {
    const t = G.tierIndex(odds);
    const dur = extra.duration || [0, 0, 0, 6800, 8200, 9600, 13000][t] + (id.length % 4) * 350;
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

  /* ---------- hero factories ---------- */
  const HK = {
    nugget: h => ({ k: 'nugget', h, s: 78, l: -4, shine: 55, trans: 0.25 }),
    cube: h => ({ k: 'cube', h, s: 82, l: -2, hatch: 3, shine: 60 }),
    shard: h => ({ k: 'shard', h, s: 75, l: -8, shine: 95, trans: 0.35 }),
    prism: h => ({ k: 'prism', h, s: 85, l: 0, trans: 0.4 }),
    octa: h => ({ k: 'octa', h, s: 88, trans: 0.3 }),
    rhomb: h => ({ k: 'rhomb', h, s: 80, trans: 0.55 }),
    cluster: h => ({ k: 'cluster', h, s: 70, l: -2, trans: 0.45 }),
    swirl: h => ({ k: 'orb', kind: 'swirl', h, s: 88 }),
    amber: h => ({ k: 'orb', kind: 'pearl', h, s: 75, l: 2 }),
    opal: h => ({ k: 'orb', kind: 'opal', h, s: 78 }),
    spire: h => ({ k: 'spire', h, s: 85, l: -2, trans: 0.3 }),
    plates: h => ({ k: 'plates', h, s: 72, l: -4 }),
    twin: h => ({ k: 'twin', h, s: 84, l: -2, trans: 0.3 }),
    star: h => ({ k: 'star', h, s: 90 }),
  };
  const HKEYS = Object.keys(HK);
  const ENVS = ['forge', 'lava', 'mountain', 'storm', 'desert', 'abyss', 'void', 'cave', 'clockwork', 'cyber', 'arcane', 'sanctum', 'space', 'temple', 'aurora', 'ocean', 'ice'];
  const ENTRIES = ['ignite', 'forge', 'rise', 'geode', 'drop', 'unveil', 'lightning', 'emerge', 'orbit', 'tide'];
  const FINALES = ['nova', 'shatter', 'quake', 'implode', 'beam', 'pulse', 'sweep', 'bloom'];
  const FXPOOL = [['embers', 'sparks'], ['dust', 'sparks'], ['arcs', 'dust'], ['sand', 'dust'], ['stars', 'sparks'], ['runes'], ['embers'], ['arcs'], ['sand'], ['stars', 'orbit'], ['dust'], ['embers', 'dust'], ['arcs', 'sparks'], ['stars', 'sparks', 'dust'], ['sand', 'arcs'], ['runes', 'dust']];
  const CAMS = ['push', 'pull', 'drift'];

  const combo = (i, salt, hue) => {
    const hero = HK[HKEYS[(i * 3 + salt) % HKEYS.length]](hue);
    return {
      env: ENVS[(i * 7 + salt * 5 + 2) % ENVS.length],
      envHue: (hue + 24 + i * 9) % 360,
      hero,
      entry: ENTRIES[(i * 5 + salt * 3 + 1) % ENTRIES.length],
      finale: FINALES[(i * 3 + salt * 2 + 2) % FINALES.length],
      fx: FXPOOL[(i * 11 + salt * 7 + 6) % FXPOOL.length],
      cam: CAMS[(i + salt) % 3],
    };
  };
  const row = (list, salt, sizeK) => list.forEach(([odds, id, name, hue, over], i) => {
    const c = combo(i, salt, hue);
    if (over) Object.assign(c, over, over.hero ? { hero: Object.assign(c.hero, over.hero) } : {});
    if (sizeK) c.hero.size = sizeK;
    R(odds, id, name, hue, c, over && over.extra);
  });

  /* ============ 10만대  EPIC  (x20) ============ */
  const epicNames = [
    ['moltenstone', '용암석', 15], ['obsidianshard', '흑요석 파편', 270, { hero: { s: 18, l: -10 } }],
    ['basaltcore', '현무암핵', 20], ['cindergem', '잉걸돌', 10], ['sulfurcrystal', '유황결정', 50],
    ['ashquartz', '재수정', 32, { hero: { s: 10, l: 55 } }], ['emberstone', '불씨석', 12], ['slagglass', '슬래그유리', 25],
    ['pressurediamond', '압력다이아', 195, { hero: { s: 5, l: 88 } }], ['moltenamber', '용암호박', 35],
    ['charcoalgem', '목탄석', 0, { hero: { s: 0, l: -20 } }], ['scoriastone', '다공암석', 18], ['pyroquartz', '열정석', 8],
    ['forgemetal', '제련석', 40], ['coalcore', '석탄핵', 0, { hero: { s: 0, l: -25 } }], ['magmaglass', '마그마유리', 20],
    ['hardenedash', '경화된 재', 35, { hero: { s: 8, l: 50 } }], ['brimstoneore', '유황석', 48], ['crucibleore', '도가니석', 42],
    ['searedcrystal', '불탄수정', 15],
  ];
  row(spread(100000, 999999, epicNames.length).map((o, i) => [o, ...epicNames[i]]), 1);

  /* ============ 100만대  LEGENDARY  (x18) ============ */
  const legendNames = [
    ['coreheart', '핵의 심장', 12], ['moltenveins', '용암맥석', 18], ['abyssalforge', '심연의 제련석', 15],
    ['pressurecore', '압력핵', 198], ['infernalgem', '업화석', 5], ['blazingobsidian', '작열흑요석', 265, { hero: { s: 22, l: -8 } }],
    ['solarcinder', '태양의 잉걸', 30], ['deepmagma', '심층 마그마', 20], ['crucibleheart', '도가니의 심장', 40],
    ['ironflame', '철염석', 15], ['scorchedcrown', '불탄 왕관석', 10], ['heatcore', '열핵', 8],
    ['crystalcoal', '결정화 석탄', 0, { hero: { s: 0, l: -22 } }], ['emberthrone', '불씨의 왕좌', 12], ['pressuregem', '압력보석', 195],
    ['molteniron', '용융철', 5], ['ashenrelic', '재의 유물', 35, { hero: { s: 8, l: 52 } }], ['volcanicheart', '화산의 심장', 15],
  ];
  row(spread(1000000, 9999999, legendNames.length).map((o, i) => [o, ...legendNames[i]]), 2);

  /* ============ 1000만대  MYTHIC  (x18) ============ */
  const mythicNames = [
    ['coreoffire', '불의 핵', 10], ['infernalcrown', '업화의 왕관', 5], ['obsidiansovereign', '흑요석 군주', 270, { hero: { s: 20, l: -9 } }],
    ['pressuresoul', '압력의 영혼', 195], ['moltenthrone', '용암 왕좌', 15], ['eternalflame', '영원의 불꽃', 12],
    ['deepcoreheart', '심핵의 심장', 18], ['blackdiamondcore', '흑다이아 핵', 0, { hero: { s: 5, l: -18 } }], ['crucibleofgods', '신들의 도가니', 40],
    ['ashfallcrown', '재비 왕관', 35], ['scorchedsoul', '불탄 영혼', 15], ['infernaltear', '업화의 눈물', 8],
    ['coalescedcore', '응축된 핵', 0, { hero: { s: 0, l: -24 } }], ['searingthrone', '작열의 왕좌', 12], ['pressurethrone', '압력의 왕좌', 195],
    ['magmaqueen', '마그마 여왕', 20], ['forgeborn', '제련의 탄생석', 42], ['heartofpressure', '압력의 심장', 190],
  ];
  row(spread(10000000, 99999999, mythicNames.length).map((o, i) => [o, ...mythicNames[i]]), 3);

  /* ============ 1억대  DIVINE - longer, grander (English names)  (x20) ============ */
  const divineNames = [
    ['coresovereign', 'Core Sovereign', 15], ['moltengenesis', 'Molten Genesis', 18], ['obsidianthrone', 'Obsidian Throne', 270, { hero: { s: 22, l: -10 } }],
    ['pressureeternal', 'Pressure Eternal', 198], ['infernalcrownjewel', 'Infernal Crown Jewel', 8], ['deepcoreheartd', 'Deep Core Heart', 20],
    ['crucibleofcreation', 'Crucible of Creation', 40], ['blazingsovereign', 'Blazing Sovereign', 12], ['ashenmonarch', 'Ashen Monarch', 35, { hero: { s: 8, l: 50 } }],
    ['scorchedgenesis', 'Scorched Genesis', 15], ['coreofeternity', 'Core of Eternity', 18], ['magmadominion', 'Magma Dominion', 20],
    ['blackdiamondcrown', 'Black Diamond Crown', 0, { hero: { s: 5, l: -20 } }], ['pressuresanctum', 'Pressure Sanctum', 195], ['infernorequiem', 'Inferno Requiem', 10],
    ['coalescedeternity', 'Coalesced Eternity', 0, { hero: { s: 0, l: -22 } }], ['searingdominion', 'Searing Dominion', 12], ['forgebornsovereign', 'Forgeborn Sovereign', 42],
    ['volcanicrequiem', 'Volcanic Requiem', 15], ['heartofthecore', 'Heart of the Core', 8],
  ];
  row(spread(100000000, 999999999, divineNames.length).map((o, i) => [o, ...divineNames[i]]), 5, 1.15);

  /* ============ 10억대  TRANSCENDENT - the deepest, hardest-hitting tier yet: bold geometric
     wireframe solids (auto-applied by the cine template for tierIdx>=7, see js/cutscenes/cine.js),
     colossal hero scale, and a full cinematic caption pass. (x5) ============ */
  R(1300000000, 'infernalcore', 'The Infernal Core', 8,
    { env: 'forge', envHue: 12, hero: { k: 'spire', h: 8, s: 90, l: 0, size: 1.4, shine: 85, trans: 0.35 }, entry: 'ignite', finale: 'nova', fx: ['embers', 'sparks'], cam: 'push' },
    { duration: 17000, revealAt: 0.63, captions: [
      { a: 0.04, b: 0.24, en: 'SOMETHING BURNS BENEATH EVERYTHING', pos: 'top', style: 'fly', from: 'bottom', font: '"Segoe UI",system-ui,sans-serif' },
      { a: 0.28, b: 0.5, en: 'AND IT HAS NEVER GONE OUT', style: 'fly', from: 'bottom', font: '"Segoe UI",system-ui,sans-serif' },
      { a: 0.66, b: 1.4, en: '業火', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(2700000000, 'obsidiansingularity', 'Obsidian Singularity', 268,
    { env: 'void', envHue: 270, hero: { k: 'octa', h: 268, s: 30, l: -14, size: 1.45, shine: 60, trans: 0.25 }, entry: 'drop', finale: 'implode', fx: ['stars', 'arcs'], cam: 'pull' },
    { duration: 17500, revealAt: 0.63, hue2: 250, captions: [
      { a: 0.04, b: 0.24, en: 'PRESSURE ENOUGH SWALLOWS LIGHT ITSELF', pos: 'top', style: 'fly', from: 'left', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.28, b: 0.5, en: 'THIS ONE LEARNED TO SWALLOW HEAT TOO', style: 'fly', from: 'right', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.66, b: 1.4, en: '黑穴', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
  R(4100000000, 'pressuremonarch', 'The Pressure Monarch', 195,
    { env: 'mountain', envHue: 195, hero: { k: 'cube', h: 195, s: 8, l: 90, size: 1.35, shine: 90, trans: 0.5 }, entry: 'geode', finale: 'shatter', fx: ['dust', 'sparks'], cam: 'push' },
    { duration: 18000, revealAt: 0.64, captions: [
      { a: 0.04, b: 0.25, en: 'A MOUNTAIN SPENT AN AGE CROWNING IT', pos: 'top', style: 'engrave' },
      { a: 0.29, b: 0.52, en: 'CARBON FORCED INTO SOMETHING ETERNAL', style: 'engrave' },
      { a: 0.68, b: 1.4, en: 'الضغط الأبدي', pos: 'center', size: 26 },
    ] });
  R(6300000000, 'ashenthrone', 'The Ashen Throne', 30,
    { env: 'desert', envHue: 30, hero: { k: 'cluster', h: 30, s: 65, l: -4, size: 1.4, shine: 55, trans: 0.4 }, entry: 'unveil', finale: 'quake', fx: ['sand', 'embers'], cam: 'drift' },
    { duration: 18500, revealAt: 0.64, captions: [
      { a: 0.04, b: 0.25, en: 'EVERYTHING THAT BURNS LEAVES A THRONE', pos: 'top', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.29, b: 0.52, en: '万物燃尽终成王座', size: 26, style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.68, b: 1.4, en: 'NOTHING HERE WAS EVER PUT OUT', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
    ] });
  R(9600000000, 'heartofcreation', 'The Heart of Creation', 12,
    { env: 'forge', envHue: 12, hero: { k: 'star', h: 12, s: 92, l: 2, size: 1.5, shine: 90, trans: 0.3 }, entry: 'lightning', finale: 'nova', fx: ['embers', 'sparks', 'arcs'], cam: 'push' },
    { duration: 19500, revealAt: 0.65, hue2: 45, captions: [
      { a: 0.04, b: 0.26, en: 'EVERY WORLD HAS ONE CENTER THAT NEVER COOLS', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.3, b: 0.54, en: 'YOU ARE HOLDING A PIECE OF IT', style: 'fly', from: 'left' },
      { a: 0.69, b: 1.4, en: '創世核心', v: true, size: 40, x: 0.82, y: 0.36 },
    ] });
})();
