/*
  UPGRADES (permanent)
  cost(lv)  : price of the next level
  value(lv) : the stat at that level
  show(v)   : how the stat is displayed
  max       : level cap
  Where each one is read: power/crit/critMul/auto/value/luck in js/core/state.js G.stats,
  shatter in js/game.js (shatter bonus), reward in js/cutscenes/engine.js C.reward, mutate in
  js/weather.js rollMutation, yellow in js/game.js (yellow crystal drop), potency in
  G.stats.armedLuck, offline in js/offline.js, discount in G.act.openBox / the box prices.
*/
const _geo = (base, grow) => lv => Math.floor(base * Math.pow(grow, lv));
const _pct = v => '+' + Math.round(v * 100) + '%';

G.data.upgrades = [
  { id: 'power', name: '곡괭이 강화', en: 'PICKAXE', desc: '클릭당 기본 코인 · Lv.45부터 용융 핵의 광석을 깰 수 있습니다',
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
  { id: 'shatter', name: '파쇄 보너스', en: 'SHATTER BONUS', desc: '크리스탈을 깨뜨렸을 때 받는 코인 배율',
    cost: _geo(500, 1.9), value: lv => 1 + 0.25 * lv, show: v => 'x' + v.toFixed(2), max: 40 },
  { id: 'offline', name: '야간 작업', en: 'NIGHT SHIFT', desc: '자리를 비운 동안 자동 채굴 효율 (기본 40%)',
    cost: _geo(2e4, 2.0), value: lv => 0.015 * lv, show: v => Math.round(40 + v * 100) + '%', max: 20 },
  { id: 'reward', name: '광물 감정', en: 'APPRAISAL', desc: '광물(컷신)을 발견했을 때 받는 코인',
    cost: _geo(5e3, 2.1), value: lv => 0.05 * lv, show: _pct, max: 40 },
  { id: 'discount', name: '상자 흥정', en: 'HAGGLING', desc: '크리스탈 상자 가격 할인',
    cost: _geo(5e5, 2.0), value: lv => 0.01 * lv, show: v => '-' + Math.round(v * 100) + '%', max: 25 },
  { id: 'mutate', name: '변이 촉매', en: 'MUTAGEN', desc: '1천만대 이상 광물에 날씨 변이가 붙을 확률',
    cost: _geo(1e6, 2.3), value: lv => 0.04 * lv, show: _pct, max: 25 },
  { id: 'yellow', name: '황금 채굴', en: 'YELLOW SEAM', desc: '직접 캘 때 옐로우 크리스탈이 나올 확률 (3번째 맵부터)',
    cost: _geo(1e7, 2.2), value: lv => 0.08 * lv, show: _pct, max: 25 },
  { id: 'potency', name: '크리스탈 증폭', en: 'AMPLIFIER', desc: '마신 크리스탈의 럭',
    cost: _geo(1e8, 2.25), value: lv => 0.03 * lv, show: _pct, max: 30 },
];
