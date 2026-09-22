/*
  UPGRADES (permanent)
  cost(lv)  : price of the next level
  value(lv) : the stat at that level
  show(v)   : how the stat is displayed
  max       : level cap
*/
const _geo = (base, grow) => lv => Math.floor(base * Math.pow(grow, lv));

G.data.upgrades = [
  { id: 'power', name: '곡괭이 강화', en: 'PICKAXE', desc: '클릭당 기본 코인',
    cost: _geo(20, 1.45), value: lv => 1 + Math.floor(lv * (1 + lv / 10)), show: v => '+' + G.fmt(v), max: 200 },
  { id: 'crit', name: '치명타 확률', en: 'CRIT RATE', desc: '클릭이 치명타가 될 확률',
    cost: _geo(60, 1.7), value: lv => 0.03 + 0.02 * lv, show: v => Math.round(v * 100) + '%', max: 24 },
  { id: 'critMul', name: '치명타 배율', en: 'CRIT POWER', desc: '치명타 코인 배율',
    cost: _geo(120, 1.8), value: lv => 5 + 0.5 * lv, show: v => 'x' + v.toFixed(1), max: 40 },
  { id: 'auto', name: '자동 채굴기', en: 'AUTO MINER', desc: '초당 자동 채굴 횟수',
    cost: _geo(900, 1.85), value: lv => 0.4 * lv, show: v => v.toFixed(1) + '/s', max: 60 },
  { id: 'value', name: '코인 가치', en: 'COIN VALUE', desc: '모든 코인 획득량 배율',
    cost: _geo(300, 2.4), value: lv => Math.pow(1.2, lv), show: v => 'x' + (v >= 100 ? v.toFixed(0) : v.toFixed(2)), max: 40 },
  { id: 'luck', name: '행운의 핵', en: 'LUCK CORE', desc: '영구 행운 보너스',
    cost: _geo(1000, 2.2), value: lv => 0.05 * lv, show: v => '+' + v.toFixed(2), max: 60 },
];
