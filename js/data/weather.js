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
  };
  G.data.MUT_MIN_ODDS = 1e7;          // mutations start at 1천만

  const W = (id, name, en, icon, color, min, fx, desc) => Object.assign({ id, name, en, icon, color, min, luck: 1, coin: 1, auto: 1 }, fx, { desc });
  G.data.weathers = {
    // ---- 1~2번째 맵 (the surface) ----
    meteor: W('meteor', '유성우', 'METEOR SHOWER', 'meteor', '#ffd76a', 3, { luck: 3, mut: 'meteor' }, '행운 x3'),
    rain: W('rain', '비', 'RAIN', 'rain', '#5ad0ff', 4, { auto: 1.5, mut: 'tide' }, '자동 채굴 속도 x1.5'),
    cloudy: W('cloudy', '흐림', 'OVERCAST', 'cloud', '#a8a0c8', 4, { coin: 2, mut: 'shadow' }, '코인 x2'),
    lightning: W('lightning', '번개', 'THUNDERSTORM', 'bolt', '#ffe84a', 3, { bolt: 0.25, boltMul: 100, mut: 'bolt' }, '25% 확률로 행운 x100'),
    rainbow: W('rainbow', '무지개', 'RAINBOW', 'rainbow', '#ff7ae0', 3, { coin: 4, starDrop: 0.15, mut: 'rainbow' }, '무지개 변이 35% · 코인 x4 · 캘 때 15% 확률로 별의 크리스탈 · 전용 100억대 광물'),
    sunny: W('sunny', '화창한', 'CLEAR SKY', 'sun', '#ffd27a', 5, { mut: 'giant' }, '평온한 날씨'),
    solar: W('solar', 'THE SOLAR', 'THE SOLAR', 'sun', '#ffae3a', 2.5, { luck: 2, mut: 'solar' }, '전용 100억대 광물 · 태양 변이 50%'),
    moonlight: W('moonlight', 'THE MOONLIGHT', 'THE MOONLIGHT', 'moon', '#cfe0ff', 2.5, { luck: 2, mut: 'lunar' }, '전용 100억대 광물 · 월광 변이 50%'),
    // ---- 3~4번째 맵 (underground) ----
    stillair: W('stillair', '고요', 'STILL AIR', 'cloud', '#9a8a7a', 5, {}, '평온한 지하'),
    acid: W('acid', '산성 비', 'ACID RAIN', 'rain', '#9aff3a', 4, { auto: 3, mut: 'acid' }, '자동 채굴 속도 x3'),
    radio: W('radio', '방사능 비', 'RADIOACTIVE RAIN', 'rain', '#d8ff2a', 4, { coin: 4, mut: 'irradiated' }, '코인 x4'),
    sandstorm: W('sandstorm', '모래폭풍', 'SANDSTORM', 'sand', '#e8b868', 5, { boss: 'crawler', mut: 'dune' }, '보스 크롤러 출현'),
    eruption: W('eruption', '화산 분화', 'ERUPTION', 'volcano', '#ff5a2a', 5, { luck: 2, mut: 'volcanic' }, '행운 x2 · 화산 변이'),
    // ---- 5번째 맵 (the void) ----
    stillness: W('stillness', '정적', 'STILLNESS', 'moon', '#8a7ab0', 5, {}, '아무 소리도 없다'),
    starflux: W('starflux', '별빛 폭주', 'STARFLUX', 'meteor', '#8ab4ff', 3, { luck: 5, mut: 'nebula' }, '행운 x5'),
    rift: W('rift', '차원 균열', 'RIFTQUAKE', 'bolt', '#ff4ad8', 3, { coin: 6, mut: 'rift' }, '코인 x6'),
    voidstorm: W('voidstorm', '공허 폭풍', 'VOID STORM', 'void', '#c05aff', 5, { boss: 'watcher', mut: 'void' }, '보스 보이드 워처 출현'),
  };

  /* which sky each map uses, and the odds of each weather (weights, day / night) */
  G.data.weatherRegions = [
    { id: 'surface', zones: [0, 1],
      day: { meteor: 1, rain: 20, cloudy: 9, lightning: 1, rainbow: 0.5, sunny: 60, solar: 0.1 },
      night: { meteor: 5, rain: 20, cloudy: 2, lightning: 5, rainbow: 0, sunny: 56, moonlight: 0.2 } },
    { id: 'deep', zones: [2, 3],
      day: { stillair: 55, acid: 15, radio: 12, sandstorm: 10, eruption: 8 } },
    { id: 'void', zones: [4],
      day: { stillness: 62, starflux: 14, rift: 12, voidstorm: 12 } },
  ];
})();
