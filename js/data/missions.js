/*
  MISSIONS - achievements, daily missions, the 7-day login calendar (js/missions.js runs them).

  Achievements: `v(s)` returns the current value from the save, `n` the goal. Rewards are claimed
  from the 미션 tab: crystals `c`, and every claimed achievement also adds +ACH_LUCK permanent luck.
  `hidden` ones show as ??? until earned. Lifetime counters live in G.state.ct (js/core/state.js).

  Daily missions: 3 a day, picked from DAILY by a seed of the date, so everyone gets the same set
  on the same day. `n(s)` may scale with progress. Claim each, then the all-clear bonus.
*/
(() => {
  const ct = (s, k) => (s.ct && s.ct[k]) || 0;
  const found = s => { let n = 0; for (const id in s.codex) if (s.codex[id].n > 0) n++; return n; };
  const tierFound = (s, t) => { for (const id in s.codex) { const d = G.cutscenes.byId[id]; if (s.codex[id].n > 0 && d && d.tierIdx === t) return 1; } return 0; };
  const maxUpg = s => { let m = 0; for (const u of G.data.upgrades) if ((s.upg[u.id] || 0) >= u.max) m++; return m; };

  G.data.ACH_LUCK = 0.25;
  const A = (id, cat, name, desc, n, v, c, extra = {}) => Object.assign({ id, cat, name, desc, n, v, c }, extra);

  G.data.achievements = [
    // 채굴
    A('mine1', 'mine', '첫 곡괭이질', '크리스탈을 100번 채굴', 100, s => s.clicks, 200),
    A('mine2', 'mine', '손에 굳은살', '크리스탈을 1,000번 채굴', 1e3, s => s.clicks, 600),
    A('mine3', 'mine', '광부의 하루', '크리스탈을 10,000번 채굴', 1e4, s => s.clicks, 2500),
    A('mine4', 'mine', '산을 옮기는 자', '크리스탈을 100,000번 채굴', 1e5, s => s.clicks, 12000),
    A('mine5', 'mine', '끝없는 채굴', '크리스탈을 1,000,000번 채굴', 1e6, s => s.clicks, 60000),
    A('crit1', 'mine', '급소를 찾다', '치명타 100번', 100, s => ct(s, 'crits'), 400),
    A('crit2', 'mine', '치명적인 손길', '치명타 5,000번', 5e3, s => ct(s, 'crits'), 5000),
    A('shat1', 'mine', '산산조각', '크리스탈 파쇄 10번', 10, s => s.shatters, 300),
    A('shat2', 'mine', '파쇄 전문가', '크리스탈 파쇄 500번', 500, s => s.shatters, 4000),
    A('shat3', 'mine', '부서지지 않는 것은 없다', '크리스탈 파쇄 10,000번', 1e4, s => s.shatters, 30000),
    // 코인
    A('coin1', 'coin', '첫 저금', '누적 코인 1만', 1e4, s => s.total, 200),
    A('coin2', 'coin', '작은 부자', '누적 코인 1천만', 1e7, s => s.total, 1000),
    A('coin3', 'coin', '광산 재벌', '누적 코인 100억', 1e10, s => s.total, 5000),
    A('coin4', 'coin', '국가 예산', '누적 코인 10조', 1e13, s => s.total, 20000),
    A('coin5', 'coin', '행성 경제', '누적 코인 1경', 1e16, s => s.total, 80000),
    A('coin6', 'coin', '셀 수 없는 부', '누적 코인 1해', 1e20, s => s.total, 300000),
    // 도감
    A('dex1', 'dex', '수집의 시작', '광물 10종 발견', 10, found, 500),
    A('dex2', 'dex', '초보 수집가', '광물 50종 발견', 50, found, 3000),
    A('dex3', 'dex', '광물학자', '광물 100종 발견', 100, found, 10000),
    A('dex4', 'dex', '살아있는 도감', '광물 200종 발견', 200, found, 40000),
    A('dex5', 'dex', '모든 것을 본 자', '광물 400종 발견', 400, found, 200000),
    A('tier3', 'dex', '영웅의 증표', 'EPIC 광물 첫 발견', 1, s => tierFound(s, 3), 800),
    A('tier4', 'dex', '전설과의 조우', 'LEGENDARY 광물 첫 발견', 1, s => tierFound(s, 4), 2000),
    A('tier5', 'dex', '신화를 캐다', 'MYTHIC 광물 첫 발견', 1, s => tierFound(s, 5), 6000),
    A('tier6', 'dex', '신성한 빛', 'DIVINE 광물 첫 발견', 1, s => tierFound(s, 6), 20000),
    A('tier7', 'dex', '초월', 'TRANSCENDENT 광물 첫 발견', 1, s => tierFound(s, 7), 100000),
    A('tier8', 'dex', '비밀을 아는 자', 'SECRET 광물 첫 발견', 1, s => tierFound(s, 8), 300000),
    A('tier9', 'dex', '한정판', 'SPECIAL 광물 첫 발견', 1, s => tierFound(s, 9), 50000),
    A('cuts1', 'dex', '관객', '컷신 100번 감상', 100, s => ct(s, 'cuts'), 1500),
    A('cuts2', 'dex', '단골 관객', '컷신 1,000번 감상', 1e3, s => ct(s, 'cuts'), 12000),
    // 탐험
    A('zone2', 'map', '깊은 곳으로', '2번째 지도 해금', 1, s => s.maxZone >= 1 ? 1 : 0, 1000),
    A('zone3', 'map', '빛나는 동굴', '3번째 지도 해금', 1, s => s.maxZone >= 2 ? 1 : 0, 5000),
    A('zone4', 'map', '용암의 심장', '4번째 지도 해금', 1, s => s.maxZone >= 3 ? 1 : 0, 25000),
    A('zone5', 'map', '공허를 건너다', '5번째 지도 해금', 1, s => s.maxZone >= 4 ? 1 : 0, 150000),
    A('ending1', 'map', 'WAKE UP', 'LEVEL 1의 끝을 본다', 1, s => s.level1 && s.level1.endingSeen ? 1 : 0, 100000, { hidden: true }),
    // 강화
    A('upg1', 'upg', '장인의 손', '곡괭이 강화 Lv.50', 50, s => s.upg.power || 0, 3000),
    A('upg2', 'upg', '전설의 곡괭이', '곡괭이 강화 Lv.150', 150, s => s.upg.power || 0, 40000),
    A('upg3', 'upg', '공장장', '자동 채굴기 Lv.30', 30, s => s.upg.auto || 0, 15000),
    A('upg4', 'upg', '한계 돌파', '강화 하나를 최대 레벨로', 1, maxUpg, 20000),
    A('upg5', 'upg', '완성형', '모든 강화를 최대 레벨로', 6, maxUpg, 250000),
    // 크리스탈
    A('exch1', 'crys', '환전소 단골', '크리스탈 누적 1,000개 교환', 1e3, s => ct(s, 'exch'), 300),
    A('exch2', 'crys', '크리스탈 은행', '크리스탈 누적 100,000개 교환', 1e5, s => ct(s, 'exch'), 10000),
    A('box1', 'crys', '두근두근', '크리스탈 상자 10개 열기', 10, s => ct(s, 'boxes'), 1000),
    A('box2', 'crys', '상자 중독', '크리스탈 상자 100개 열기', 100, s => ct(s, 'boxes'), 8000),
    A('box3', 'crys', '상자의 제왕', '크리스탈 상자 1,000개 열기', 1e3, s => ct(s, 'boxes'), 60000),
    A('giga', 'crys', '기가 오픈', '기가 상자를 열다', 1, s => ct(s, 'giga'), 100000),
    A('drink1', 'crys', '한 모금', '크리스탈 10개 마시기', 10, s => ct(s, 'drinks'), 800),
    A('drink2', 'crys', '크리스탈 소믈리에', '크리스탈 100개 마시기', 100, s => ct(s, 'drinks'), 8000),
    A('food1', 'crys', '미식가', '음식 50번 먹기', 50, s => ct(s, 'foods'), 1500),
    A('pkg1', 'crys', '첫 선물세트', '이벤트 패키지 첫 구매', 1, s => ct(s, 'pkgs'), 5000),
    A('pkg2', 'crys', '큰손', '하이퍼 패키지 구매', 1, s => ct(s, 'hypers'), 30000),
    // 숨겨진 업적
    A('owl', 'secret', '잠 못 드는 밤', '새벽 3시에 채굴한다', 1, s => ct(s, 'owl'), 3000, { hidden: true }),
    A('combo', 'secret', '연타의 신', '연타 콤보를 최대로 채운다', 1, s => ct(s, 'maxCombo') >= 10 ? 1 : 0, 1500, { hidden: true }),
    A('play1', 'secret', '시간 가는 줄 모르고', '총 1시간 플레이', 3600, s => ct(s, 'playSec'), 5000, { hidden: true }),
    A('play2', 'secret', '광산에 산다', '총 10시간 플레이', 36000, s => ct(s, 'playSec'), 50000, { hidden: true }),
    A('login7', 'secret', '개근상', '7일 연속 출석', 7, s => (s.login && s.login.best) || 0, 20000, { hidden: true }),
    A('daily30', 'secret', '성실한 광부', '일일 미션 올클리어 30번', 30, s => ct(s, 'dailyAll'), 60000, { hidden: true }),
  ];
  G.data.achCats = [['mine', '채굴'], ['coin', '코인'], ['dex', '도감'], ['map', '탐험'], ['upg', '강화'], ['crys', '크리스탈'], ['secret', '숨겨진 업적']];

  /* daily missions - `k` is the counter they watch (G.state.daily.p[k], counted from today's start) */
  const Z = s => 1 + s.maxZone;
  G.data.dailyPool = [
    { id: 'd_mine', k: 'mines', name: '오늘의 채굴', desc: n => `크리스탈을 ${G.fmtInt(n)}번 채굴`, n: s => 300 * Z(s) },
    { id: 'd_crit', k: 'crits', name: '급소 찌르기', desc: n => `치명타 ${n}번`, n: s => 20 + 10 * Z(s) },
    { id: 'd_shat', k: 'shatters', name: '부수기', desc: n => `크리스탈 파쇄 ${n}번`, n: s => 4 + 2 * Z(s) },
    { id: 'd_cuts', k: 'cuts', name: '광물 사냥', desc: n => `컷신 ${n}번 만나기`, n: s => 3 + Z(s) },
    { id: 'd_new', k: 'newFinds', name: '새로운 발견', desc: () => '새 광물 1종 발견', n: () => 1 },
    { id: 'd_box', k: 'boxes', name: '상자 열기', desc: n => `크리스탈 상자 ${n}개 열기`, n: () => 3 },
    { id: 'd_drink', k: 'drinks', name: '한 잔 하실래요', desc: n => `크리스탈 ${n}개 마시기`, n: () => 2 },
    { id: 'd_food', k: 'foods', name: '든든하게', desc: n => `음식 ${n}번 먹기`, n: () => 2 },
    { id: 'd_exch', k: 'exch', name: '환전', desc: n => `크리스탈 ${n}개 교환`, n: s => 5 * Z(s) },
    { id: 'd_upg', k: 'upgrades', name: '업그레이드', desc: n => `강화 ${n}번`, n: () => 3 },
  ];
  G.data.dailyReward = s => 600 * Math.pow(3, s.maxZone);         // crystals per mission, grows with depth
  G.data.dailyBonusBox = s => ['common', 'rare', 'epic', 'delta', 'ultra'][Math.min(4, s.maxZone)];

  /* 7-day login calendar - consecutive days; missing one starts the week over */
  G.data.loginRewards = [
    { c: 500 },
    { t: { common: 2 } },
    { c: 2000 },
    { t: { rare: 1 } },
    { c: 5000, p: { gold: 1 } },
    { t: { epic: 1 } },
    { t: { ultra: 1 }, p: { gold: 3, star: 1 }, big: true },
  ];

  /* offline mining: the auto-miner keeps working while you're away, at reduced efficiency */
  G.data.offline = { eff: 0.5, capH: 8, minSec: 60 };
})();
