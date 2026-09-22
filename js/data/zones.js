/*
  MAP ZONES
  cost     : coins to unlock (0 = open from the start). Ignored if `unlock` is set (see below).
  coinMul  : multiplies every coin gain (clicks AND cutscene rewards) while you are here
  hue      : colour of the crystal / world (0-360)
  hp       : clicks needed to shatter one crystal (bonus coins on shatter)
  snd      : cracking-sound profile: stone | ore | glass | lava | void   (see js/core/audio.js)
  unlock   : if present, this zone opens on a CODEX milestone instead of coins - e.g. { type: 'divine', n: 3 }
             means "have discovered at least 3 distinct 1억+ (DIVINE tier) cutscenes, from any map".
             See G.stats.meetsUnlock() in js/core/state.js. A badge appears on the 지도 tab once it's met.
  Every cutscene belongs to one zone (its `zone` index) and only appears while you are in that zone.
*/
G.data.zones = [
  { id: 'quarry', name: '지표 채석장', en: 'SURFACE QUARRY', cost: 0,     coinMul: 1,   hue: 268, hp: 20, snd: 'stone' },
  { id: 'vein',   name: '심층 광맥',   en: 'DEEP VEIN',      cost: 5e3,   coinMul: 3,   hue: 212, hp: 24, snd: 'ore' },
  { id: 'cavern', name: '수정 동굴',   en: 'CRYSTAL CAVERN', cost: 1.5e5, coinMul: 10,  hue: 172, hp: 28, snd: 'glass',
    unlock: { type: 'divine', n: 3, label: '1억대 이상 컷신 3종 발견' } },   // coins alone won't open this one - see below
  { id: 'core',   name: '용융 핵',     en: 'MOLTEN CORE',    cost: 6e6,   coinMul: 40,  hue: 18,  hp: 32, snd: 'lava' },
  { id: 'void',   name: '공허의 균열', en: 'VOID RIFT',      cost: 3e8,   coinMul: 200, hue: 322, hp: 36, snd: 'void' },
];
