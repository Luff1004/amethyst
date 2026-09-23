/*
  CRYSTALS & CRYSTAL BOXES
  - Coins are exchanged for crystals at G.data.exchange.rate coins per crystal.
  - Crystals (the one-click luck items, renamed from "potions") can NOT be bought directly. They only
    come out of crystal boxes (crystal shop): 1 box = 1 crystal item, and WHICH one you get is a dice
    roll (weights below, higher boxes lean to stronger items).
  - A crystal item is a ONE-CLICK luck bomb: drink it and your next manual click is rolled with `luck`
    added on top of your normal luck (auto-miner clicks never use it). Cap is .9 for that click.
*/
G.data.exchange = { rate: 1e6 };            // 1M coins = 1 crystal

G.data.potions = [
  { id: 'ember',   name: '불씨 크리스탈',   en: 'EMBER CRYSTAL',    hue: 18,  star: 1, luck: 2.5e3 },
  { id: 'dew',     name: '이슬 크리스탈',   en: 'DEW CRYSTAL',      hue: 140, star: 2, luck: 2.5e4 },
  { id: 'moon',    name: '월광 크리스탈',   en: 'MOONLIT CRYSTAL',  hue: 212, star: 3, luck: 2.5e5 },
  { id: 'gold',    name: '황금 크리스탈',   en: 'GOLDEN CRYSTAL',   hue: 45,  star: 4, luck: 2.5e6 },
  { id: 'dragon',  name: '용의 크리스탈',   en: 'DRAGON CRYSTAL',   hue: 4,   star: 5, luck: 2.5e7 },
  { id: 'star',    name: '별의 크리스탈',   en: 'STARFALL CRYSTAL', hue: 280, star: 6, luck: 1e8 },
  { id: 'abyss',   name: '심연의 크리스탈', en: 'ABYSSAL CRYSTAL',  hue: 186, star: 7, luck: 1e9 },
  { id: 'genesis', name: '창세의 크리스탈', en: 'GENESIS CRYSTAL',  hue: 52,  secret: true, luck: 5e10 },
  /* tutorial-only: never drops from a box - granted once, on finishing the tutorial */
  { id: 'tutorial', name: '견습생의 크리스탈', en: "APPRENTICE'S CRYSTAL", hue: 160, star: 1, luck: 50 },
];
G.data.potionCap = 0.9;

/* weights are per crystal item, in the order above (excluding the tutorial-only one) */
G.data.boxes = [
  { id: 'common', name: '일반 상자',   en: 'COMMON BOX', color: '#9aa6c4', cost: 3000,    w: [60, 28, 9, 2.5, 0.5, 0, 0, 0] },
  { id: 'rare',   name: '레어 상자',   en: 'RARE BOX',   color: '#5aa8ff', cost: 12000,   w: [30, 34, 22, 10, 3.5, 0.5, 0, 0] },
  { id: 'epic',   name: '에픽 상자',   en: 'EPIC BOX',   color: '#b878ff', cost: 45000,   w: [8, 20, 30, 26, 12, 3.5, 0.5, 0] },
  { id: 'delta',  name: '델타 상자',   en: 'DELTA BOX',  color: '#4fe0c4', cost: 200000,  w: [0, 2, 12, 26, 30, 22, 7, 1] },
  { id: 'ultra',  name: '울트라 상자', en: 'ULTRA BOX',  color: '#ffb63d', cost: 1000000, w: [0, 0, 2, 12, 24, 32, 24, 6] },
];
