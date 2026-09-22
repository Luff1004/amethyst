/*
  CRYSTALS, POTION BOXES & POTIONS
  - Coins are exchanged for crystals at G.data.exchange.rate coins per crystal.
  - Potions can NOT be bought directly. They only come out of potion boxes (crystal shop): 1 box = 1 potion,
    and WHICH potion you get is a dice roll (weights below, higher boxes lean to stronger potions).
  - A potion is a ONE-CLICK luck bomb: drink it and your next manual click is rolled with `luck` added on top of your
    normal luck (auto-miner clicks never use it). Chance per mineral = min(cap, luck / odds), cap is .9 for a potion click.
*/
G.data.exchange = { rate: 1e6 };            // 1M coins = 1 crystal

G.data.potions = [
  { id: 'ember',   name: '불씨 물약',     en: 'EMBER VIAL',       hue: 18,  luck: 2.5e3 },
  { id: 'dew',     name: '행운의 이슬',   en: 'LUCKY DEW',        hue: 140, luck: 2.5e4 },
  { id: 'moon',    name: '월광 영약',     en: 'MOONLIT ELIXIR',   hue: 212, luck: 2.5e5 },
  { id: 'gold',    name: '황금 비약',     en: 'GOLDEN DRAUGHT',   hue: 45,  luck: 2.5e6 },
  { id: 'dragon',  name: '용의 정수',     en: 'DRAGON ESSENCE',   hue: 4,   luck: 2.5e7 },
  { id: 'star',    name: '별의 눈물',     en: 'STARFALL TEAR',    hue: 280, luck: 1e8 },
  { id: 'abyss',   name: '심연의 성수',   en: 'ABYSSAL NECTAR',   hue: 186, luck: 1e9 },
  { id: 'god',     name: '신들의 혈청',   en: 'GODSBLOOD SERUM',  hue: 338, luck: 5e9 },
  { id: 'genesis', name: '창세의 물약',   en: 'GENESIS PHILTER',  hue: 52,  luck: 5e10 },
  /* tutorial-only: never drops from a box (no box's weight table reaches this index) - granted once, on finishing the tutorial */
  { id: 'tutorial', name: '견습생의 물약', en: "APPRENTICE'S VIAL", hue: 160, luck: 50 },
];
G.data.potionCap = 0.9;

/* weights are per potion, in the order above */
G.data.boxes = [
  { id: 'common', name: '일반 상자',   en: 'COMMON BOX', color: '#9aa6c4', cost: 3000,    w: [60, 28, 9, 2.5, 0.5, 0, 0, 0, 0] },
  { id: 'rare',   name: '레어 상자',   en: 'RARE BOX',   color: '#5aa8ff', cost: 12000,   w: [30, 34, 22, 10, 3.5, 0.5, 0, 0, 0] },
  { id: 'epic',   name: '에픽 상자',   en: 'EPIC BOX',   color: '#b878ff', cost: 45000,   w: [8, 20, 30, 24, 12, 5, 1, 0, 0] },
  { id: 'delta',  name: '델타 상자',   en: 'DELTA BOX',  color: '#4fe0c4', cost: 200000,  w: [0, 2, 10, 24, 28, 20, 12, 3.5, 0.5] },
  { id: 'ultra',  name: '울트라 상자', en: 'ULTRA BOX',  color: '#ffb63d', cost: 1000000, w: [0, 0, 2, 10, 22, 30, 22, 11, 3] },
];
