/*
  CRYSTALS & CRYSTAL BOXES
  - Coins are exchanged for (blue) crystals at G.data.exchange.rate coins per crystal.
  - Crystal items (the one-click luck items, renamed from "potions") can NOT be bought with blue
    crystals directly. They only come out of crystal boxes: 1 box = 1 crystal item, and WHICH one
    you get is a dice roll (weights below, higher boxes lean to stronger items).
  - A crystal item is a ONE-CLICK luck bomb: drink it and your next manual click is rolled with `luck`
    added on top of your normal luck (auto-miner clicks never use it). Cap is .9 for that click.
    Several can be stacked, with diminishing returns (G.stats.armedLuck).
  - The three top crystals (`red`) are bought with RED crystals only, and only work on the 5th map
    and deeper (`minZone`) - they are for the 1억 ~ 999해 ladder there, not for farming maps 1-4.
*/
G.data.exchange = { rate: 1e6 };            // 1M coins = 1 crystal

G.data.potions = [
  { id: 'ember',   name: '불씨 크리스탈',   en: 'EMBER CRYSTAL',    hue: 18,  star: 1,  luck: 2.5e3 },
  { id: 'frost',   name: '서리 크리스탈',   en: 'FROST CRYSTAL',    hue: 196, star: 2,  luck: 8e3 },
  { id: 'dew',     name: '이슬 크리스탈',   en: 'DEW CRYSTAL',      hue: 140, star: 3,  luck: 2.5e4 },
  { id: 'moon',    name: '월광 크리스탈',   en: 'MOONLIT CRYSTAL',  hue: 212, star: 4,  luck: 1e5 },
  { id: 'thunder', name: '벼락 크리스탈',   en: 'THUNDER CRYSTAL',  hue: 58,  star: 5,  luck: 3e5 },
  { id: 'gold',    name: '황금 크리스탈',   en: 'GOLDEN CRYSTAL',   hue: 45,  star: 6,  luck: 8e5 },
  { id: 'dragon',  name: '용의 크리스탈',   en: 'DRAGON CRYSTAL',   hue: 4,   star: 7,  luck: 2.5e6 },
  { id: 'star',    name: '별의 크리스탈',   en: 'STARFALL CRYSTAL', hue: 280, star: 8,  luck: 6e6 },
  { id: 'comet',   name: '혜성 크리스탈',   en: 'COMET CRYSTAL',    hue: 172, star: 9,  luck: 1.5e7 },
  { id: 'abyss',   name: '심연의 크리스탈', en: 'ABYSSAL CRYSTAL',  hue: 186, star: 10, luck: 4e7 },
  { id: 'void',    name: '공허의 크리스탈', en: 'VOID CRYSTAL',     hue: 312, star: 11, luck: 1.2e8 },
  { id: 'genesis', name: '창세의 크리스탈', en: 'GENESIS CRYSTAL',  hue: 52,  secret: true, luck: 5e8 },
  /* the top three - red crystals only, 5th map and deeper only */
  { id: 'primordial', name: '태초의 크리스탈', en: 'PRIMORDIAL CRYSTAL', hue: 350, star: 12, luck: 1e14, red: 10,  minZone: 4 },
  { id: 'infinity',   name: '무한의 크리스탈', en: 'INFINITY CRYSTAL',   hue: 8,   star: 13, luck: 1e18, red: 40,  minZone: 4 },
  { id: 'absolute',   name: '절대의 크리스탈', en: 'ABSOLUTE CRYSTAL',   hue: 0,   star: 14, luck: 1e22, red: 150, minZone: 4 },
  /* tutorial-only: never drops from a box - granted once, on finishing the tutorial */
  { id: 'tutorial', name: '견습생의 크리스탈', en: "APPRENTICE'S CRYSTAL", hue: 160, star: 1, luck: 50 },
];
G.data.potionCap = 0.9;

/* weights are per crystal item, in the order above (the first twelve - boxes never give the red
   crystals or the tutorial one). Each box leans hard on its own 1-2 target tiers. */
/*                                                                 ember frost dew moon thund gold drag star comet abyss void gene */
G.data.boxes = [
  { id: 'common', name: '일반 상자',   en: 'COMMON BOX', color: '#9aa6c4', cost: 3000,    w: [60, 25, 13, 2, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'rare',   name: '레어 상자',   en: 'RARE BOX',   color: '#5aa8ff', cost: 12000,   w: [8, 20, 42, 22, 7, 1, 0, 0, 0, 0, 0, 0] },
  { id: 'epic',   name: '에픽 상자',   en: 'EPIC BOX',   color: '#b878ff', cost: 45000,   w: [0, 0, 10, 38, 30, 18, 4, 0, 0, 0, 0, 0] },
  { id: 'delta',  name: '델타 상자',   en: 'DELTA BOX',  color: '#4fe0c4', cost: 250000,  w: [0, 0, 0, 6, 24, 38, 26, 5, 1, 0, 0, 0] },
  { id: 'ultra',  name: '울트라 상자', en: 'ULTRA BOX',  color: '#ffb63d', cost: 3e7,     w: [0, 0, 0, 0, 0, 4, 30, 34, 18, 10, 3, 1] },
  { id: 'giga',   name: '기가 상자',   en: 'GIGA BOX',   color: '#ff5ad6', cost: 3e8,     w: [0, 0, 0, 0, 0, 0, 0, 0, 20, 34, 30, 16] },
];

/* RED crystals are crafted: YELLOW crystals (a 1% drop of 5 when you hit the amethyst by hand,
   from the 3rd map on) + blue crystals, 10 red at a time. The workshop opens with the 4th map. */
G.data.redRecipe = { yellow: 30, blue: 70000, out: 10 };
G.data.yellowDrop = { chance: 0.01, n: 5 };
