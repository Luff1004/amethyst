/*
  FOODS (shop)
  Eating a food gives a timed LUCK bonus. Luck multiplies the chance of every cutscene.
  luck = 1 + permanent luck upgrade + sum of every active food bonus
  cost     : coins
  bonus    : added to luck while active
  duration : seconds (buying again while active adds time)
*/
G.data.foods = [
  { id: 'bread', name: '딱딱한 빵',   en: 'STALE BREAD',    icon: 'bread',  cost: 100,   bonus: 0.5, duration: 120 },
  { id: 'cake',  name: '꿀 케이크',   en: 'HONEY CAKE',     icon: 'cake',   cost: 1200,  bonus: 1.5, duration: 120 },
  { id: 'meat',  name: '훈제 고기',   en: 'SMOKED MEAT',    icon: 'meat',   cost: 15000, bonus: 4,   duration: 180 },
  { id: 'stew',  name: '황금 스튜',   en: 'GOLDEN STEW',    icon: 'stew',   cost: 2.5e5, bonus: 12,  duration: 180 },
  { id: 'dragon', name: '용의 만찬',  en: 'DRAGON FEAST',   icon: 'dragon', cost: 6e6,   bonus: 40,  duration: 240 },
  { id: 'gods',  name: '신들의 연회', en: 'BANQUET OF GODS', icon: 'feast', cost: 4e8,   bonus: 200, duration: 300 },
];
