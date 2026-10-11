/*
  RESEARCH LAB (강화 탭 - 연구소, from the 2nd map on). One path, one research at a time: pay coins,
  wait real time (it keeps going while the game is closed), collect it, and the next cube opens.
  Blue crystals can finish the running research instantly.
    G.data.labTypes : what a research can boost (per = bonus each node of that type adds)
    G.data.lab      : the path, in order - node i costs cost and takes time minutes (before 연구 가속)
  G.stats.lab(type) sums every finished node of that type. Read in js/core/state.js
  (luck/coin/auto/reson), js/weather.js (mut), js/game.js (yellow), js/offline.js (offline),
  G.act.labStart (speed).
*/
(() => {
  const pct = v => '+' + Math.round(v * 100) + '%';
  const T = G.data.labTypes = {
    luck:    { name: '행운 이론',     en: 'LUCK THEORY',    icon: 'luck',    desc: '행운',                 per: 0.20, show: pct },
    coin:    { name: '코인 연금술',   en: 'COIN ALCHEMY',   icon: 'coin',    desc: '모든 코인',            per: 0.40, show: pct },
    auto:    { name: '자동화 공학',   en: 'AUTOMATION',     icon: 'play',    desc: '자동 채굴 속도',       per: 0.12, show: pct },
    offline: { name: '야간 감시',     en: 'NIGHT WATCH',    icon: 'moon',    desc: '오프라인 채굴 효율',   per: 0.04, show: pct },
    reson:   { name: '크리스탈 공명', en: 'RESONANCE',      icon: 'potion',  desc: '마신 크리스탈의 럭',   per: 0.09, show: pct },
    speed:   { name: '연구 가속',     en: 'ACCELERATION',   icon: 'bolt',    desc: '연구 시간',            per: 0.08, show: v => '-' + Math.round(v * 100) + '%' },
    mut:     { name: '변이 생물학',   en: 'MUTAGENICS',     icon: 'rainbow', desc: '변이가 붙을 확률',     per: 0.08, show: pct },
    yellow:  { name: '황금 지질학',   en: 'GOLDEN GEOLOGY', icon: 'crystal', desc: '옐로우 크리스탈 확률', per: 0.10, show: pct },
  };
  const ORDER = ['luck', 'coin', 'auto', 'offline', 'reson', 'speed', 'mut', 'yellow'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  // 5 rounds of the 8 kinds = 40 cubes; each one dearer and longer than the last (time caps at 8 hours)
  G.data.lab = [];
  for (let i = 0; i < ORDER.length * ROMAN.length; i++) {
    const type = ORDER[i % ORDER.length], t = T[type], round = Math.floor(i / ORDER.length);
    G.data.lab.push({ i, type, name: t.name + ' ' + ROMAN[round], en: t.en + ' ' + ROMAN[round], icon: t.icon,
      cost: Math.floor(5e6 * Math.pow(1.9, i)), time: Math.min(480, Math.round(10 * Math.pow(1.12, i))) });
  }
  G.data.labRush = { perMin: 40 };     // blue crystals per remaining minute to finish instantly
})();
