/*
  AMETHYST - missions: achievements, daily missions, the login calendar, offline mining, stats.
  Data in js/data/missions.js. Listens to game events (mine / found / box / drink / food / exch /
  upgrade / pkg) to keep lifetime counters in G.state.ct and today's progress in G.state.daily.
  Renders the 미션 tab (js/ui.js calls G.missions.view / click / tick) and its own two overlays:
  the achievement banner (#achToast) and the "while you were away" card (#offlineModal).
  Locally (js/config.js dev) the tab also has a "하루 넘기기" button to test day rollover.
*/
(() => {
  if (G.config.viewer) { G.missions = { view: () => '', click: () => false, tick() {}, claimable: () => 0 }; return; }
  const D = G.data, $ = s => document.querySelector(s);
  const s = () => G.state;
  const inc = (k, n = 1) => { const c = s().ct; c[k] = (c[k] || 0) + n; };

  /* ---------------- dates (with a local-only day offset for testing rollovers) ---------------- */
  const DAY_KEY = 'amethyst_devday';
  const offset = () => (G.config.dev ? +(localStorage.getItem(DAY_KEY) || 0) : 0);
  const dayOf = shift => { const d = new Date(); d.setDate(d.getDate() + offset() + (shift || 0)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const today = () => dayOf(0);
  const msToMidnight = () => { const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0); return m - d; };

  /* ---------------- daily missions ---------------- */
  function ensureDaily() {
    const st = s();
    if (st.daily && st.daily.day === today()) return st.daily;
    const key = today(), r = G.rng(+key.replace(/-/g, ''));
    const pool = D.dailyPool.slice(), ids = [];
    while (ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
    const goals = {}; ids.forEach(id => { goals[id] = D.dailyPool.find(q => q.id === id).n(st); });
    st.daily = { day: key, ids, goals, p: {}, claimed: {}, bonus: false };
    return st.daily;
  }
  const dprog = (k, n = 1) => { const d = ensureDaily(); d.p[k] = (d.p[k] || 0) + n; };
  const dailyList = () => { const d = ensureDaily(); return d.ids.map(id => { const q = D.dailyPool.find(x => x.id === id), goal = d.goals[id], have = Math.min(goal, d.p[q.k] || 0); return { q, goal, have, done: have >= goal, claimed: !!d.claimed[id] }; }); };

  /* ---------------- login calendar ---------------- */
  function loginState() {
    const L = s().login, t = today(), y = dayOf(-1);
    const claimedToday = L.last === t, continuing = L.last === y || claimedToday;
    const streak = continuing ? L.streak : 0;
    const idx = claimedToday ? (streak - 1) % 7 : streak % 7;
    return { claimedToday, streak, idx, cycleStart: claimedToday ? streak - 1 - idx : streak - idx };
  }

  /* ---------------- rewards ---------------- */
  function grant(r) {
    const st = s(), parts = [];
    if (r.c) { st.crystals += r.c; parts.push(`크리스탈 ${G.fmtInt(r.c)}`); }
    for (const id in r.t || {}) { st.tickets[id] = (st.tickets[id] || 0) + r.t[id]; parts.push(`${D.boxes.find(b => b.id === id).name} 무료권 x${r.t[id]}`); }
    for (const id in r.p || {}) { st.potions[id] = (st.potions[id] || 0) + r.p[id]; parts.push(`${G.stats.potion(id).name} x${r.p[id]}`); }
    return parts;
  }
  const rewardText = r => { const t = []; if (r.c) t.push(`${G.fmtInt(r.c)}`); for (const id in r.t || {}) t.push(`${D.boxes.find(b => b.id === id).name.replace(' 상자', '')} 무료권${r.t[id] > 1 ? ' x' + r.t[id] : ''}`); for (const id in r.p || {}) t.push(`${G.stats.potion(id).name.replace(' 크리스탈', '')}${r.p[id] > 1 ? ' x' + r.p[id] : ''}`); return t; };
  function celebrate(title, parts, color = '#ffcf5a') {
    G.audio.buy(); setTimeout(() => G.audio.potion(), 120);
    if (G.ui && G.ui.fireWin) G.ui.fireWin(`<small>REWARD</small><b>${title}</b><em style="font-size:15px">${parts.join(' · ')}</em>`, color, 2400);
  }

  /* ---------------- achievements ---------------- */
  const queue = [];
  let banner = null, bannerT = 0;
  function checkAch() {
    const st = s(); let fresh = 0;
    for (const a of D.achievements) {
      if (st.ach[a.id]) continue;
      if (a.v(st) >= a.n) { st.ach[a.id] = { t: Date.now(), claimed: false }; queue.push(a); fresh++; }
    }
    if (fresh) { G.save(); showNext(); paintBadge(); }
  }
  function showNext() {
    if (banner || !queue.length) return;
    const el = $('#achToast');
    let html;
    if (queue.length > 3) {              // a flood (e.g. an old save catching up): one summary banner
      const n = queue.length; queue.length = 0;
      html = `<i class="medal">${G.icon('medal', 26)}</i><div><small>ACHIEVEMENTS</small><b>업적 ${n}개 달성!</b><span>미션 탭에서 보상을 받으세요</span></div>`;
    } else {
      const a = queue.shift();
      html = `<i class="medal">${G.icon('medal', 26)}</i><div><small>ACHIEVEMENT UNLOCKED</small><b>${a.name}</b><span>${a.desc} · 보상 ${G.fmtInt(a.c)} 크리스탈</span></div>`;
    }
    el.innerHTML = html; el.hidden = false; banner = el;
    void el.offsetWidth; el.classList.add('show');
    G.audio.win(5); setTimeout(() => G.audio.potion(), 200);
    clearTimeout(bannerT);
    bannerT = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; banner = null; showNext(); }, 380); }, 2800);
  }
  function claimAch(id) {
    const a = D.achievements.find(x => x.id === id), rec = s().ach[id];
    if (!a || !rec || rec.claimed) return false;
    rec.claimed = true;
    const parts = grant({ c: a.c }); parts.push(`행운 +${D.ACH_LUCK}`);
    G.save(); G.emit('change'); celebrate(a.name, parts);
    return true;
  }
  function claimAllAch() {
    const st = s(); let n = 0, c = 0;
    for (const a of D.achievements) { const rec = st.ach[a.id]; if (rec && !rec.claimed) { rec.claimed = true; n++; c += a.c; } }
    if (!n) return false;
    st.crystals += c; G.save(); G.emit('change');
    celebrate(`업적 ${n}개 보상`, [`크리스탈 ${G.fmtInt(c)}`, `행운 +${(n * D.ACH_LUCK).toFixed(2)}`]);
    return true;
  }

  /* ---------------- what's waiting to be claimed (tab badge) ---------------- */
  function claimable() {
    const st = s(); let n = 0;
    for (const id in st.ach) if (!st.ach[id].claimed) n++;
    dailyList().forEach(x => { if (x.done && !x.claimed) n++; });
    const d = ensureDaily(); if (!d.bonus && d.ids.every(id => d.claimed[id])) n++;
    if (!loginState().claimedToday) n++;
    return n;
  }
  let badgeEl = null;
  function paintBadge() {
    if (!badgeEl) { const tab = $('[data-tab=mission]'); if (!tab) return; tab.insertAdjacentHTML('beforeend', '<i class="badge"></i>'); badgeEl = tab.querySelector('.badge'); }
    badgeEl.classList.toggle('show', claimable() > 0);
  }

  /* ---------------- event tracking ---------------- */
  G.on('mine', e => {
    if (!e) return;
    dprog('mines');
    if (e.crit) { inc('crits'); dprog('crits'); }
    if (e.shatter) dprog('shatters');
    if (!e.auto) { if (e.combo > (s().ct.maxCombo || 0)) s().ct.maxCombo = e.combo; if (new Date().getHours() === 3) s().ct.owl = 1; }
  });
  G.on('found', ({ first }) => { inc('cuts'); dprog('cuts'); if (first) dprog('newFinds'); });
  G.on('box', ({ box }) => { inc('boxes'); dprog('boxes'); if (box.id === 'giga') inc('giga'); });
  G.on('drink', list => { inc('drinks', list.length); dprog('drinks', list.length); });
  G.on('food', () => { inc('foods'); dprog('foods'); });
  G.on('exch', n => { inc('exch', n); dprog('exch', n); });
  G.on('upgrade', () => dprog('upgrades'));
  G.on('pkg', pk => { inc('pkgs'); if (pk.tier === 'hyper') inc('hypers'); });

  // achievements are re-checked a few times a second rather than on every single click
  setInterval(() => { if (document.hidden || !G.state) return; ensureDaily(); checkAch(); paintBadge(); }, 700);
  setInterval(() => { if (!document.hidden) inc('playSec', 1); }, 1000);

  /* ---------------- offline mining ---------------- */
  let awayFrom = 0;
  const load0 = G.load;
  G.load = () => { load0(); awayFrom = G.state.lastSeen || 0; };
  function offlineCheck() {
    const O = D.offline, st = s();
    if (!awayFrom || !st.autoOn || st.level1.crystalGone) return;
    const sec = Math.min(O.capH * 3600, (Date.now() - awayFrom) / 1000);
    const rate = G.stats.autoRate();
    if (sec < O.minSec || rate <= 0) return;
    const perHit = G.stats.clickValue() * (1 + G.stats.critChance() * (G.stats.critMul() - 1));
    const coins = Math.floor(rate * perHit * sec * O.eff), hits = Math.floor(rate * sec * O.eff);
    if (coins <= 0) return;
    const m = $('#offlineModal'), h = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
    m.innerHTML = `<div class="scrim"></div><div class="ofcard bevel">
      <div class="ofspin">${G.icon('crystal', 34)}</div>
      <small>WHILE YOU WERE AWAY</small>
      <h3>자리를 비운 동안</h3>
      <p>자동 채굴기가 <b>${h ? h + '시간 ' : ''}${mm}분</b> 동안 쉬지 않고 일했습니다${sec >= O.capH * 3600 - 1 ? ` <i>(최대 ${O.capH}시간)</i>` : ''}</p>
      <div class="ofrow"><span>채굴</span><b>${G.fmtInt(hits)}회</b></div>
      <div class="ofcoins">${G.icon('coin', 26)}<b data-ofc>0</b></div>
      <em>효율 ${Math.round(O.eff * 100)}% · 자동 채굴기 Lv.${G.stats.level('auto')}</em>
      <button class="buy bevel" data-ofok><span>받기</span></button></div>`;
    m.hidden = false; void m.offsetWidth; m.classList.add('show');
    const el = m.querySelector('[data-ofc]'), t0 = performance.now();
    (function roll(now) { const k = Math.min(1, (now - t0) / 1400), v = coins * (1 - Math.pow(1 - k, 3)); el.textContent = G.fmt(v); if (k < 1 && !m.hidden) requestAnimationFrame(roll); })(t0);
    let taken = false;
    m.addEventListener('click', ev => {
      if (taken || !ev.target.closest('[data-ofok]')) return;
      taken = true; G.addCoins(coins); inc('offline', coins); G.save(); G.emit('change');
      G.audio.pour(14); G.audio.buy();
      m.classList.remove('show'); setTimeout(() => { m.hidden = true; m.innerHTML = ''; }, 350);
    });
  }
  G.on('ready', () => { ensureDaily(); setTimeout(offlineCheck, 400); setTimeout(() => { checkAch(); paintBadge(); }, 1500); });

  /* ---------------- the 미션 tab ---------------- */
  let sub = 'daily';
  const pct = (a, b) => Math.max(0, Math.min(100, a / b * 100));
  const fmtHMS = ms => { const t = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor(t % 3600 / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

  function dailyView() {
    const st = s(), L = loginState(), d = ensureDaily(), list = dailyList(), per = D.dailyReward(st), box = D.dailyBonusBox(st);
    const tiles = D.loginRewards.map((r, i) => {
      const got = i < L.idx || (L.claimedToday && i === L.idx), now = !L.claimedToday && i === L.idx;
      const label = rewardText(r);
      const ico = r.t ? 'ticket' : r.p ? 'potion' : 'crystal';
      return `<div class="lday ${got ? 'got' : ''} ${now ? 'now' : ''} ${r.big ? 'big' : ''}">
        <small>DAY ${i + 1}</small><i>${G.icon(got ? 'check' : ico, r.big ? 22 : 18)}</i><span>${label.join('<br>')}</span></div>`;
    }).join('');
    const quests = list.map(x => `<div class="card bevel dq ${x.done ? 'done' : ''} ${x.claimed ? 'claimed' : ''}">
        <div class="ico">${G.icon(x.claimed ? 'check' : 'luck', 22)}</div>
        <div class="meta"><b>${x.q.name}</b><span>${x.q.desc(x.goal)}</span>
          <i class="bar"><u style="width:${pct(x.have, x.goal)}%"></u></i><small>${G.fmtInt(x.have)} / ${G.fmtInt(x.goal)}</small></div>
        <div class="side"><em class="rw">${G.icon('crystal', 12)} ${G.fmtInt(per)}</em>
          ${x.claimed ? '<button class="buy bevel small max" disabled><span>완료</span></button>' : `<button class="buy bevel small ${x.done ? 'ready' : 'poor'}" data-dq="${x.q.id}"><span>${x.done ? '받기' : '진행 중'}</span></button>`}</div></div>`).join('');
    const allDone = d.ids.every(id => d.claimed[id]), bname = D.boxes.find(b => b.id === box).name;
    return `<div class="lcal bevel"><div class="lhead"><b>출석 보상</b><span>연속 <em>${L.claimedToday ? L.streak : L.streak}</em>일${L.claimedToday ? ' · 오늘 받음' : ''}</span></div>
        <div class="ldays">${tiles}</div>
        ${L.claimedToday ? '' : '<button class="buy bevel lclaim" data-login="1"><span>오늘의 출석 보상 받기</span></button>'}</div>
      <div class="dqhead"><b>일일 미션</b><span>초기화까지 <em data-reset>${fmtHMS(msToMidnight())}</em></span></div>
      <div class="list">${quests}</div>
      <div class="card bevel dq bonus ${allDone ? 'done' : ''} ${d.bonus ? 'claimed' : ''}">
        <div class="ico">${G.icon('gift', 22)}</div>
        <div class="meta"><b>올클리어 보너스</b><span>오늘의 미션 3개를 모두 완료하면</span><small>${d.ids.filter(id => d.claimed[id]).length} / 3</small></div>
        <div class="side"><em class="rw">${G.icon('ticket', 12)} ${bname} 무료권</em>
          ${d.bonus ? '<button class="buy bevel small max" disabled><span>완료</span></button>' : `<button class="buy bevel small ${allDone ? 'ready' : 'poor'}" data-dbonus="1"><span>${allDone ? '받기' : '잠김'}</span></button>`}</div></div>
      ${G.config.dev ? '<div class="devday"><span>DEV</span><button data-devday="1">하루 넘기기</button><button data-devday="0">날짜 되돌리기</button><button data-devoff="1">오프라인 보상 보기 (3시간)</button></div>' : ''}`;
  }

  function achView() {
    const st = s(), total = D.achievements.length;
    let got = 0, unclaimed = 0;
    for (const a of D.achievements) { const r = st.ach[a.id]; if (r) { got++; if (!r.claimed) unclaimed++; } }
    const cats = D.achCats.map(([cat, label]) => {
      const list = D.achievements.filter(a => a.cat === cat);
      const cards = list.map(a => {
        const r = st.ach[a.id], v = Math.min(a.n, a.v(st)), secret = a.hidden && !r;
        return `<div class="card bevel ach ${r ? (r.claimed ? 'claimed' : 'done') : ''} ${secret ? 'secret' : ''}">
          <div class="ico medal">${G.icon(secret ? 'lock' : 'medal', 22)}</div>
          <div class="meta"><b>${secret ? '???' : a.name}</b><span>${secret ? '숨겨진 업적' : a.desc}</span>
            ${secret || a.n <= 1 ? '' : `<i class="bar"><u style="width:${pct(v, a.n)}%"></u></i><small>${G.fmt(v)} / ${G.fmt(a.n)}</small>`}</div>
          <div class="side"><em class="rw">${G.icon('crystal', 12)} ${G.fmtInt(a.c)}</em>
            ${r ? (r.claimed ? '<button class="buy bevel small max" disabled><span>완료</span></button>' : `<button class="buy bevel small ready" data-ach="${a.id}"><span>받기</span></button>`) : ''}</div></div>`;
      }).join('');
      const n = list.filter(a => st.ach[a.id]).length;
      return `<div class="band" style="--tc:#ffcf5a"><i></i><b>${label}</b><span></span><em>${n}/${list.length}</em></div>${cards}`;
    }).join('');
    return `<div class="achsum bevel"><div><b>${got}</b><small>/ ${total}</small></div><span>업적 달성<br><em>업적 행운 +${G.stats.achLuck().toFixed(2)}</em></span>
        <i class="bar"><u style="width:${pct(got, total)}%"></u></i>
        ${unclaimed ? `<button class="buy bevel small ready" data-achall="1"><span>모두 받기 (${unclaimed})</span></button>` : ''}</div>
      <div class="list">${cats}</div>`;
  }

  function statsView() {
    const st = s(), c = st.ct;
    let found = 0; for (const id in st.codex) if (st.codex[id].n > 0) found++;
    let best = 0; for (const id in st.codex) best = Math.max(best, st.codex[id].best || 0);
    const tiers = G.tiers.map((t, i) => {
      const all = G.cutscenes.list.filter(d => d.tierIdx === i), have = all.filter(d => (st.codex[d.id] || {}).n > 0).length;
      return all.length ? `<div class="trow" style="--tc:${t.color}"><b>${t.en}</b><i class="bar"><u style="width:${pct(have, all.length)}%"></u></i><em>${have}/${all.length}</em></div>` : '';
    }).join('');
    const pt = c.playSec || 0;
    const tile = (label, val, sub2) => `<div class="stile bevel"><small>${label}</small><b>${val}</b>${sub2 ? `<span>${sub2}</span>` : ''}</div>`;
    return `<div class="stiles">
        ${tile('총 채굴', G.fmtInt(st.clicks))}${tile('치명타', G.fmtInt(c.crits || 0))}${tile('파쇄', G.fmtInt(st.shatters))}
        ${tile('누적 코인', G.fmt(st.total))}${tile('발견한 광물', `${found}`, `/ ${G.cutscenes.list.length}종`)}${tile('컷신 감상', G.fmtInt(c.cuts || 0))}
        ${tile('연 상자', G.fmtInt(c.boxes || 0))}${tile('마신 크리스탈', G.fmtInt(c.drinks || 0))}${tile('먹은 음식', G.fmtInt(c.foods || 0))}
        ${tile('최고 보상', G.fmt(best))}${tile('플레이 시간', `${Math.floor(pt / 3600)}h ${Math.floor(pt % 3600 / 60)}m`)}${tile('현재 행운', G.fmtLuck(G.stats.luck()))}
      </div>
      <div class="ph mini"><h2>COLLECTION <small>등급별 발견</small></h2></div>
      <div class="tiers bevel">${tiers}</div>`;
  }

  G.missions = {
    claimable,
    view() {
      const n = claimable();
      const chip = (id, label) => `<button class="chip bevel ${sub === id ? 'on' : ''}" data-msub="${id}"><b>${label}</b></button>`;
      return `<div class="ph"><h2>MISSION <small>미션</small></h2><span>${n ? `받을 수 있는 보상 <b>${n}</b>개` : '매일 새로운 미션이 열립니다'}</span></div>
        <div class="chips mchips">${chip('daily', '일일')}${chip('ach', '업적')}${chip('stats', '통계')}</div>
        ${sub === 'daily' ? dailyView() : sub === 'ach' ? achView() : statsView()}`;
    },
    click(el) {
      const st = s();
      if (el.dataset.msub) { sub = el.dataset.msub; G.audio.tab(); G.emit('change'); return true; }
      if (el.dataset.ach) { if (!claimAch(el.dataset.ach)) G.audio.deny(); return true; }
      if (el.dataset.achall) { if (!claimAllAch()) G.audio.deny(); return true; }
      if (el.dataset.dq) {
        const x = dailyList().find(q => q.q.id === el.dataset.dq);
        if (!x || !x.done || x.claimed) { G.audio.deny(); G.emit('toast', '아직 완료하지 않은 미션입니다'); return true; }
        ensureDaily().claimed[x.q.id] = true;
        const parts = grant({ c: D.dailyReward(st) }); G.save(); G.emit('change'); celebrate(x.q.name, parts, '#7ff3ff');
        return true;
      }
      if (el.dataset.dbonus) {
        const d = ensureDaily();
        if (d.bonus || !d.ids.every(id => d.claimed[id])) { G.audio.deny(); G.emit('toast', '미션 3개를 모두 완료해야 합니다'); return true; }
        d.bonus = true; inc('dailyAll');
        const parts = grant({ t: { [D.dailyBonusBox(st)]: 1 } }); G.save(); G.emit('change'); celebrate('올클리어 보너스', parts, '#ff6ad5');
        return true;
      }
      if (el.dataset.login) {
        const L = loginState();
        if (L.claimedToday) { G.audio.deny(); return true; }
        const r = D.loginRewards[L.idx], lg = st.login;
        lg.streak = L.streak + 1; lg.last = today(); lg.best = Math.max(lg.best || 0, lg.streak);
        const parts = grant(r); G.save(); G.emit('change'); celebrate(`출석 ${L.idx + 1}일차`, parts, r.big ? '#ffcf5a' : '#7ff3ff');
        if (r.big) G.audio.blast(6);
        return true;
      }
      if (el.dataset.devday != null) {
        if (el.dataset.devday === '1') localStorage.setItem(DAY_KEY, String(offset() + 1)); else localStorage.removeItem(DAY_KEY);
        ensureDaily(); G.audio.tab(); G.emit('change'); G.emit('toast', `DEV · 오늘 = ${today()}`); return true;
      }
      if (el.dataset.devoff) { awayFrom = Date.now() - 3 * 3600 * 1000; G.ui.closePanel(); offlineCheck(); return true; }
      return false;
    },
    tick(panel) {
      const r = panel.querySelector('[data-reset]'); if (r) r.textContent = fmtHMS(msToMidnight());
      if (r && s().daily && s().daily.day !== today()) G.emit('change');
    },
  };
})();
