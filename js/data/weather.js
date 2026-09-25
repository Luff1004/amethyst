/*
  WEATHER + MUTATIONS (js/weather.js runs it, js/boss.js runs the boss weathers).

  Every region has its own sky. A weather lasts `min` minutes, then the next one is rolled from the
  region's table - day (06-18 local time) and night can use different tables. Effects:
    luck / coin / auto : multipliers on luck, every coin gain, and the auto-miner's speed
    bolt               : chance per roll that this roll's luck is multiplied by boltMul (번개)
    starDrop           : chance per manual click to receive a 별의 크리스탈 (무지개)
    boss               : a boss appears during this weather (js/boss.js)
  mut: the MUTATION this weather can give. Minerals of 1천만 (MYTHIC) and up rolled in this weather
  become e.g. "황철석: 번개" with `chance`, paying `mul` times the reward.

  Balance (patch): effects are gentle nudges, common skies are long and plentiful, rare skies are
  short and genuinely rare - roughly one rainbow / boss storm in a long day of play, not four.
*/
(() => {
  const M = (id, name, en, color, mul, chance = 0.12) => ({ id, name, en, color, mul, chance });
  G.data.mutations = {
    meteor: M('meteor', '유성', 'METEOR', '#ffd76a', 3),
    tide: M('tide', '물결', 'TIDE', '#5ad0ff', 2),
    shadow: M('shadow', '그림자', 'SHADOW', '#9a82d8', 2),
    bolt: M('bolt', '번개', 'LIGHTNING', '#ffe84a', 5),
    rainbow: M('rainbow', '무지개', 'RAINBOW', '#ff7ae0', 6, 0.35),
    giant: M('giant', '거대한', 'GIANT', '#ffb05a', 2.5, 0.06),
    solar: M('solar', '태양', 'SOLAR', '#ffae3a', 10, 0.5),
    lunar: M('lunar', '월광', 'LUNAR', '#cfe0ff', 10, 0.5),
    acid: M('acid', '산성', 'ACIDIC', '#9aff3a', 3),
    irradiated: M('irradiated', '방사능', 'IRRADIATED', '#d8ff2a', 4),
    dune: M('dune', '모래', 'DUNE', '#e8b868', 3),
    volcanic: M('volcanic', '화산', 'VOLCANIC', '#ff5a2a', 4),
    void: M('void', '공허', 'VOID', '#c05aff', 5),
    nebula: M('nebula', '성운', 'NEBULA', '#8ab4ff', 4),
    rift: M('rift', '균열', 'RIFT', '#ff4ad8', 6),
    // new skies
    mist: M('mist', '안개', 'MISTY', '#c8d4e0', 2, 0.08),
    frost: M('frost', '서리', 'FROSTED', '#bfe8ff', 3, 0.1),
    bloom: M('bloom', '꽃', 'BLOSSOM', '#ffa8d0', 2.5, 0.1),
    ember: M('ember', '잔불', 'EMBER', '#ff9a4a', 2.5, 0.1),
    glow: M('glow', '반딧불', 'GLOWING', '#c8ff8a', 3, 0.1),
    starlit: M('starlit', '별빛', 'STARLIT', '#fff0b0', 3, 0.1),
    crystal: M('crystal', '수정', 'CRYSTALLINE', '#9af0ff', 3, 0.1),
    echo: M('echo', '메아리', 'ECHOING', '#b8a0ff', 3, 0.1),
    gravity: M('gravity', '중력', 'GRAVITIC', '#7a8aff', 4, 0.1),
    stasis: M('stasis', '정체', 'STASIS', '#a0fff0', 4, 0.1),
  };
  G.data.MUT_MIN_ODDS = 1e7;          // mutations start at 1천만

  const W = (id, name, en, icon, color, min, fx, desc) => Object.assign({ id, name, en, icon, color, min, luck: 1, coin: 1, auto: 1 }, fx, { desc });
  G.data.weathers = {
    // ---- 1~2번째 맵 (the surface) ----
    sunny: W('sunny', '화창한', 'CLEAR SKY', 'sun', '#ffd27a', 14, { mut: 'giant' }, '평온한 날씨'),
    breeze: W('breeze', '산들바람', 'BREEZE', 'cloud', '#b8f0d8', 12, { auto: 1.05, mut: 'bloom' }, '자동 채굴 속도 x1.05'),
    fog: W('fog', '안개', 'FOG', 'cloud', '#c8d4e0', 12, { mut: 'mist' }, '시야가 흐리다 · 안개 변이'),
    drizzle: W('drizzle', '이슬비', 'DRIZZLE', 'rain', '#8ad8ff', 12, { coin: 1.05, mut: 'tide' }, '코인 x1.05'),
    petals: W('petals', '꽃비', 'PETAL WIND', 'cloud', '#ffa8d0', 10, { luck: 1.05, mut: 'bloom' }, '행운 x1.05'),
    snow: W('snow', '눈', 'SNOWFALL', 'cloud', '#e8f4ff', 12, { coin: 1.1, mut: 'frost' }, '코인 x1.1 · 서리 변이'),
    starry: W('starry', '별밤', 'STARRY NIGHT', 'moon', '#fff0b0', 12, { luck: 1.1, mut: 'starlit' }, '행운 x1.1'),
    fireflies: W('fireflies', '반딧불이', 'FIREFLIES', 'moon', '#c8ff8a', 10, { coin: 1.1, mut: 'glow' }, '코인 x1.1'),
    rain: W('rain', '비', 'RAIN', 'rain', '#5ad0ff', 10, { auto: 1.15, mut: 'tide' }, '자동 채굴 속도 x1.15'),
    cloudy: W('cloudy', '흐림', 'OVERCAST', 'cloud', '#a8a0c8', 12, { coin: 1.2, mut: 'shadow' }, '코인 x1.2'),
    meteor: W('meteor', '유성우', 'METEOR SHOWER', 'meteor', '#ffd76a', 5, { luck: 1.5, mut: 'meteor' }, '행운 x1.5'),
    lightning: W('lightning', '번개', 'THUNDERSTORM', 'bolt', '#ffe84a', 5, { bolt: 0.04, boltMul: 10, mut: 'bolt' }, '4% 확률로 그 한 번의 행운 x10'),
    rainbow: W('rainbow', '무지개', 'RAINBOW', 'rainbow', '#ff7ae0', 4, { coin: 1.5, starDrop: 0.01, mut: 'rainbow' }, '무지개 변이 35% · 코인 x1.5 · 캘 때 1% 확률로 별의 크리스탈 · 전용 100억대 광물'),
    solar: W('solar', 'THE SOLAR', 'THE SOLAR', 'sun', '#ffae3a', 3, { luck: 1.3, mut: 'solar' }, '전용 100억대 광물 · 태양 변이 50%'),
    moonlight: W('moonlight', 'THE MOONLIGHT', 'THE MOONLIGHT', 'moon', '#cfe0ff', 3, { luck: 1.3, mut: 'lunar' }, '전용 100억대 광물 · 월광 변이 50%'),
    // ---- 3~4번째 맵 (underground) ----
    stillair: W('stillair', '고요', 'STILL AIR', 'cloud', '#9a8a7a', 14, {}, '평온한 지하'),
    damp: W('damp', '습기', 'DAMP AIR', 'rain', '#7ab0c0', 12, { mut: 'mist' }, '벽을 타고 물이 흐른다'),
    geothermal: W('geothermal', '지열', 'GEOTHERMAL', 'volcano', '#ff9a4a', 12, { coin: 1.1, mut: 'ember' }, '코인 x1.1'),
    resonance: W('resonance', '수정 공명', 'RESONANCE', 'sand', '#9af0ff', 10, { luck: 1.1, mut: 'crystal' }, '행운 x1.1'),
    rockfall: W('rockfall', '낙석', 'ROCKFALL', 'sand', '#b0a090', 10, { auto: 1.1, mut: 'dune' }, '자동 채굴 속도 x1.1'),
    glowworms: W('glowworms', '반딧벌레', 'GLOWWORMS', 'moon', '#8affd0', 10, { coin: 1.1, mut: 'glow' }, '코인 x1.1'),
    acid: W('acid', '산성 비', 'ACID RAIN', 'rain', '#9aff3a', 6, { auto: 1.2, mut: 'acid' }, '자동 채굴 속도 x1.2'),
    radio: W('radio', '방사능 비', 'RADIOACTIVE RAIN', 'rain', '#d8ff2a', 6, { coin: 1.3, mut: 'irradiated' }, '코인 x1.3'),
    eruption: W('eruption', '화산 분화', 'ERUPTION', 'volcano', '#ff5a2a', 5, { luck: 1.3, mut: 'volcanic' }, '행운 x1.3 · 화산 변이'),
    sandstorm: W('sandstorm', '모래폭풍', 'SANDSTORM', 'sand', '#e8b868', 5, { boss: 'crawler', mut: 'dune' }, '보스 크롤러 출현'),
    // ---- 5번째 맵 (the void) ----
    stillness: W('stillness', '정적', 'STILLNESS', 'moon', '#8a7ab0', 14, {}, '아무 소리도 없다'),
    echoes: W('echoes', '잔향', 'ECHOES', 'void', '#b8a0ff', 12, { mut: 'echo' }, '지나간 소리가 되돌아온다'),
    gravity: W('gravity', '중력 이상', 'GRAVITY WELL', 'void', '#7a8aff', 10, { coin: 1.1, mut: 'gravity' }, '코인 x1.1'),
    stasis: W('stasis', '시간 정체', 'TIME STASIS', 'moon', '#a0fff0', 10, { luck: 1.1, mut: 'stasis' }, '행운 x1.1'),
    starwind: W('starwind', '성간풍', 'STELLAR WIND', 'meteor', '#d0c0ff', 10, { auto: 1.1, mut: 'nebula' }, '자동 채굴 속도 x1.1'),
    starflux: W('starflux', '별빛 폭주', 'STARFLUX', 'meteor', '#8ab4ff', 5, { luck: 1.5, mut: 'nebula' }, '행운 x1.5'),
    rift: W('rift', '차원 균열', 'RIFTQUAKE', 'bolt', '#ff4ad8', 5, { coin: 1.5, mut: 'rift' }, '코인 x1.5'),
    voidstorm: W('voidstorm', '공허 폭풍', 'VOID STORM', 'void', '#c05aff', 5, { boss: 'watcher', mut: 'void' }, '보스 보이드 워처 출현'),
  };

  /* which sky each map uses, and the odds of each weather (weights, day / night) */
  G.data.weatherRegions = [
    { id: 'surface', zones: [0, 1],
      day: { sunny: 30, breeze: 14, fog: 9, drizzle: 10, petals: 7, snow: 5, rain: 10, cloudy: 11, meteor: 2.5, lightning: 2.5, rainbow: 1, solar: 0.25 },
      night: { starry: 22, fireflies: 12, fog: 12, drizzle: 9, snow: 6, breeze: 10, rain: 10, cloudy: 12, meteor: 3, lightning: 2.5, moonlight: 0.4 } },
    { id: 'deep', zones: [2, 3],
      day: { stillair: 30, damp: 15, geothermal: 13, resonance: 11, rockfall: 11, glowworms: 10, acid: 4, radio: 3.5, eruption: 2.5, sandstorm: 2.5 } },
    { id: 'void', zones: [4],
      day: { stillness: 30, echoes: 18, gravity: 14, stasis: 12, starwind: 14, starflux: 4, rift: 4, voidstorm: 2.5 } },
  ];
})();
