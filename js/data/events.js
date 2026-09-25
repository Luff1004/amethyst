/*
  MONTHLY EVENTS - one limited package event per calendar month (js/event.js renders the banner
  + popup). The active one follows the device's month; on localhost the popup has a month switcher
  so every month can be checked (js/config.js dev).

  Every event sells the same four packages (에픽 / 델타 / 메가 / 하이퍼) for crystals, built from the
  month's own limited items:
    potion   : '<name> 한정 포션'        one-click luck crystal (LUCK +4M). Only shown/usable in the
                                          crystal shop while its month's event is running.
    mineral  : '<name> 기념 한정 광물 포션' guarantees that month's SPECIAL mineral on the next click
                                          (the cutscene lives in js/cutscenes/special/*.js). Same
                                          month-only rule as the potion.
    food     : a limited food (LUCK +1000 for 5 min), eaten from the 상점 tab inventory
    perm     : a permanent food (LUCK +1300 and coins x1.2, forever - eating a second does nothing)
  Box tickets open that box once for free (크리스탈 상점).
*/
(() => {
  const EV = [
    { m: 1,  id: 'seollal',   name: '설날',     set: '선물세트', hue: 0,   en: 'LUNAR NEW YEAR',
      food: ['떡국', 'RICE CAKE SOUP', 'bowl'], perm: ['천년 인삼', 'MILLENNIUM GINSENG', 'leaf'],
      mineral: ['복(福)의 결정', 'CRYSTAL OF FORTUNE'] },
    { m: 2,  id: 'valentine', name: '발렌타인', set: '패키지',   hue: 345, en: "VALENTINE'S",
      food: ['수제 초콜릿', 'HANDMADE CHOCOLATE', 'heart'], perm: ['영원의 퐁듀', 'ETERNAL FONDUE', 'goblet'],
      mineral: ['하트 루비', 'HEART RUBY'] },
    { m: 3,  id: 'whiteday',  name: '화이트데이', set: '패키지', hue: 195, en: 'WHITE DAY',
      food: ['왕 막대사탕', 'GIANT LOLLIPOP', 'candy'], perm: ['무지개 사탕병', 'RAINBOW CANDY JAR', 'candy'],
      mineral: ['별사탕 결정', 'STARDROP CANDY'] },
    { m: 4,  id: 'sakura',    name: '벚꽃',     set: '패키지',   hue: 330, en: 'CHERRY BLOSSOM',
      food: ['벚꽃 도시락', 'BLOSSOM LUNCHBOX', 'bread'], perm: ['벚꽃잎 차', 'PETAL TEA', 'goblet'],
      mineral: ['벚꽃석', 'SAKURA STONE'] },
    { m: 5,  id: 'childrens', name: '어린이날', set: '선물세트', hue: 48,  en: "CHILDREN'S DAY",
      food: ['무지개 솜사탕', 'RAINBOW COTTON CANDY', 'candy'], perm: ['요술 종합과자', 'MAGIC SNACK BOX', 'gift'],
      mineral: ['바람개비 수정', 'PINWHEEL CRYSTAL'] },
    { m: 6,  id: 'monsoon',   name: '장마',     set: '패키지',   hue: 205, en: 'MONSOON',
      food: ['해물파전', 'SEAFOOD PANCAKE', 'bread'], perm: ['천년 약수', 'SPRING OF AGES', 'bottle'],
      mineral: ['빗방울 수정', 'RAINDROP CRYSTAL'] },
    { m: 7,  id: 'summer',    name: '여름 바다', set: '패키지',  hue: 185, en: 'SUMMER SEA',
      food: ['수박화채', 'WATERMELON PUNCH', 'bowl'], perm: ['만년설 빙수', 'EVERFROST BINGSU', 'bowl'],
      mineral: ['파도진주', 'TIDE PEARL'] },
    { m: 8,  id: 'fireworks', name: '불꽃축제', set: '패키지',   hue: 280, en: 'FIREWORKS FESTIVAL',
      food: ['버터 구운 옥수수', 'BUTTER CORN', 'meat'], perm: ['별빛 사이다', 'STARLIGHT SODA', 'bottle'],
      mineral: ['불꽃놀이석', 'FIREWORK GEM'] },
    { m: 9,  id: 'chuseok',   name: '추석',     set: '선물세트', hue: 40,  en: 'CHUSEOK',
      food: ['스팸', 'SPAM', 'can'], perm: ['올리브유', 'OLIVE OIL', 'bottle'],
      mineral: ['보름달 월석', 'HARVEST MOONSTONE'] },
    { m: 10, id: 'halloween', name: '할로윈',   set: '패키지',   hue: 28,  en: 'HALLOWEEN',
      food: ['호박 파이', 'PUMPKIN PIE', 'cake'], perm: ['마녀의 수프', "WITCH'S BREW", 'stew'],
      mineral: ['잭오랜턴 호박석', "JACK-O'-AMBER"] },
    { m: 11, id: 'autumn',    name: '단풍',     set: '패키지',   hue: 14,  en: 'AUTUMN LEAVES',
      food: ['군고구마', 'ROASTED SWEET POTATO', 'meat'], perm: ['단풍 꿀', 'MAPLE HONEY', 'bottle'],
      mineral: ['홍엽석', 'CRIMSON LEAF'] },
    { m: 12, id: 'christmas', name: '크리스마스', set: '선물세트', hue: 140, en: 'CHRISTMAS',
      food: ['진저브레드 쿠키', 'GINGERBREAD COOKIE', 'cake'], perm: ['산타의 코코아', "SANTA'S COCOA", 'goblet'],
      mineral: ['스노우글로브 수정', 'SNOWGLOBE CRYSTAL'] },
  ];

  const TIERS = [
    { key: 'epic',  label: '에픽',   color: '#b878ff', price: 63000,  sale: 51000 },
    { key: 'delta', label: '델타',   color: '#4fe0c4', price: 96000,  sale: 87000 },
    { key: 'mega',  label: '메가',   color: '#ff5ad6', price: 195000, sale: 183000 },
    { key: 'hyper', label: '하이퍼', color: '#ffb63d', price: 560000, sale: 545000 },
  ];

  G.data.events = EV.map(e => {
    const potion = { id: 'evp_' + e.id, name: `${e.name} 한정 포션`, en: `${e.en} POTION`, hue: e.hue, star: 6, luck: 4e6, event: e.id };
    const mineral = { id: 'evm_' + e.id, name: `${e.name} 기념 특별 한정 광물 포션`, en: `${e.en} MINERAL`, hue: e.hue, star: 7, event: e.id, grantCut: 'sp_' + e.id };
    const food = { id: 'evf_' + e.id, name: e.food[0], en: e.food[1], icon: e.food[2], bonus: 1000, duration: 300, inv: true, event: e.id };
    const perm = { id: 'evq_' + e.id, name: e.perm[0], en: e.perm[1], icon: e.perm[2], bonus: 1300, coinMul: 1.2, perm: true, inv: true, event: e.id };
    const P = (id, n) => ({ k: 'potion', id, n }), T = (id, n) => ({ k: 'ticket', id, n }), F = (id, n) => ({ k: 'food', id, n });
    const contents = {
      epic:  [P(potion.id, 1), P('gold', 4), P('ember', 7), T('common', 2)],
      delta: [P(potion.id, 4), P('gold', 6), P('ember', 10), T('rare', 2), F(food.id, 5)],
      mega:  [P('ember', 15), P('dew', 10), P('moon', 5), P('gold', 4), P(potion.id, 8), P(mineral.id, 1)],
      hyper: [P(potion.id, 10), P('ember', 20), P('dew', 15), P('gold', 8), P('star', 2), T('ultra', 2), F(perm.id, 1), P(mineral.id, 1)],
    };
    const packages = TIERS.map(t => ({ id: `${e.id}_${t.key}`, tier: t.key, name: `${t.label} ${e.name} ${e.set}`, color: t.color, price: t.price, sale: t.sale, items: contents[t.key] }));
    G.data.potions.push(potion, mineral);
    G.data.foods.push(food, perm);
    return Object.assign({}, e, { title: `${e.name} 한정 패키지`, potion, mineralPotion: mineral, food, permFood: perm, cut: 'sp_' + e.id, packages });
  });

  /* which month is "now": the device's month, or (locally) the developer's pick from the popup */
  const DEV_KEY = 'amethyst_devmonth';
  G.event = {
    month() {
      if (G.config.dev) { const v = +(localStorage.getItem(DEV_KEY) || 0); if (v >= 1 && v <= 12) return v; }
      return new Date().getMonth() + 1;
    },
    setDevMonth(m) { if (G.config.dev) { localStorage.setItem(DEV_KEY, String(m)); G.emit('change'); G.emit('event:month'); } },
    current() { return G.data.events.find(e => e.m === this.month()) || null; },
    isActive(eventId) { const c = this.current(); return !!c && c.id === eventId; },
    daysLeft() {
      const d = new Date(), m = this.month(), y = d.getFullYear();
      if (m !== d.getMonth() + 1) return new Date(y, m, 0).getDate();       // dev preview: show the full month
      return new Date(y, m, 0).getDate() - d.getDate() + 1;
    },
    byId: id => G.data.events.find(e => e.id === id),
  };
})();
