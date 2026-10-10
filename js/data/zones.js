/*
  MAP ZONES
  cost     : coins to unlock (0 = open from the start). Ignored if `unlock` is set (see below).
  coinMul  : multiplies every coin gain (clicks AND cutscene rewards) while you are here
  hue      : colour of the crystal / world (0-360)
  hp       : clicks needed to shatter one crystal (bonus coins on shatter)
  snd      : cracking-sound profile: stone | ore | glass | lava | void   (see js/core/audio.js)
  unlock   : if present, this zone opens on a CODEX milestone instead of coins - { type: 'divine', n: 3 }
             means "3+ distinct 1억+ (DIVINE) cutscenes found anywhere", { type: 'secret', n: 1 } means
             "1+ distinct SECRET-tier cutscene found anywhere" (each map has exactly one SECRET).
             See G.stats.meetsUnlock() in js/core/state.js. A badge appears on the 지도 tab once it's met.
  Every cutscene belongs to one zone (its `zone` index) and only appears while you are in that zone.
*/
G.data.zones = [
  { id: 'quarry', name: '지표 채석장', en: 'SURFACE QUARRY', cost: 0,     coinMul: 1,   hue: 268, hp: 20, snd: 'stone' },
  { id: 'vein',   name: '심층 광맥',   en: 'DEEP VEIN',      cost: 1e8,   coinMul: 3,   hue: 212, hp: 24, snd: 'ore' },
  { id: 'cavern', name: '수정 동굴',   en: 'CRYSTAL CAVERN', cost: 1.5e5, coinMul: 10,  hue: 172, hp: 28, snd: 'glass',
    unlock: { type: 'divine', n: 3, label: '1억대 이상 컷신 3종 발견' } },   // coins alone won't open this one - see below
  { id: 'core',   name: '용융 핵',     en: 'MOLTEN CORE',    cost: 6e6,   coinMul: 40,  hue: 18,  hp: 32, snd: 'lava',
    unlock: { type: 'combo', divine: 20, coins: 5e12, crystals: 1e6, label: '억대 광물 20종 발견 + 5T 코인 + 100만 블루 크리스탈' } },
  { id: 'void',   name: '공허의 균열', en: 'VOID RIFT',      cost: 3e8,   coinMul: 200, hue: 322, hp: 36, snd: 'void',
    unlock: { type: 'level1', label: 'LEVEL 1 완료',      // see js/level1.js - not a normal zone unlock
      // the way IN to LEVEL 1: pay all of this once, find one 10억+ mineral, then answer the question
      gate: { red: 1e4, coins: 4.5e13, blue: 1e5, yellow: 3e4, findOdds: 1e9 } } },
  /* 6th map: hand-mining only - the auto-miner still earns coins here, but never rolls a mineral (noAutoRoll) */
  { id: 'cosmos', name: '우주의 끝',   en: 'EDGE OF THE COSMOS', cost: 1e20, coinMul: 1000, hue: 228, hp: 40, snd: 'void', noAutoRoll: true,
    unlock: { type: 'combo', coins: 1e20, label: '100Qi 코인' } },
];
