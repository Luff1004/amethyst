/* AMETHYST - main loop: world rendering, mining, particles, cutscene flow */
(() => {
  const { E, seg, clamp, rgba, rng } = G;
  const cv = document.getElementById('game'), g = cv.getContext('2d');
  const coinIco = document.getElementById('coinIco');
  const TAU = Math.PI * 2;
  let W = 0, H = 0, DPR = 1;

  function resize() {
    const capQ = { high: 2, mid: 1.5, low: 1 }[G.opt('quality')] || 2;     // 설정 - 그래픽 품질
    DPR = Math.min(capQ, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  window.addEventListener('resize', resize);
  G.on('settings', k => { if (k === 'quality' || k === '*') resize(); });
  resize();

  /* ---------------- state of the world ---------------- */
  const fxs = [];                    // particles
  let pulse = 0, shake = 0, combo = 0, lastClick = 0, autoAcc = 0, flashA = 0;
  const kick = { x: 0, y: 0 };
  let crystal = null, hits = 0;
  let target = { x: 40, y: 40 };
  const unit = () => Math.min(W, H);

  function makeCrystal(seed) {
    const r = rng(seed), n = 7 + Math.floor(r() * 3), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (r() - 0.5) * 0.35 - Math.PI / 2, rad = 0.78 + r() * 0.22;
      pts.push([Math.cos(a) * rad * 0.86, Math.sin(a) * rad]);
    }
    const apex = [(r() - 0.5) * 0.25, (r() - 0.5) * 0.25 - 0.05];
    const facets = pts.map((p, i) => {
      const q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, mid = Math.atan2(my, mx);
      return { l: 20 + 38 * (0.5 + 0.5 * Math.cos(mid + 2.2)) + r() * 8, ang: mid, mx, my, var: r() };
    });
    cracks.length = 0; crackDirty = true;
    return { pts, apex, facets, born: performance.now(), glintPhase: r() * 9 };
  }

  /* ---- cracks: every hit splits the stone where you hit it. Branching, tapering, glowing from within.
         Drawn into a cached layer (crystal space, local radius 1 = CS px) and re-drawn only while growing. ---- */
  const cracks = [];                 // { segs:[{x0,y0,x1,y1,w,d}], born, max }
  const CR = 512, CS = CR / 2.6;
  const crackCv = document.createElement('canvas'); crackCv.width = crackCv.height = CR;
  const cg = crackCv.getContext('2d');
  let crackDirty = true;

  function growCrack(lx, ly) {
    const segs = [], rnd = Math.random, step = 0.05;
    const walk = (x, y, ang, len, w, depth, d0) => {
      const n = Math.max(3, Math.round(len / step));
      let cx = x, cy = y, a = ang;
      for (let i = 0; i < n; i++) {
        const na = a + (rnd() - 0.5) * 0.75, sl = step * (0.7 + rnd() * 0.6);
        const nx = cx + Math.cos(na) * sl, ny = cy + Math.sin(na) * sl, d = d0 + i * step;
        segs.push({ x0: cx, y0: cy, x1: nx, y1: ny, w: w * (1 - (i / n) * 0.82), d });
        const rest = (len - i * step) * 0.62;
        if (depth < 2 && rest > 0.12 && rnd() < 0.17) walk(nx, ny, na + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.7), rest, w * 0.62, depth + 1, d);
        cx = nx; cy = ny; a = na;
      }
    };
    const a0 = rnd() * TAU;
    walk(lx, ly, a0, 0.45 + rnd() * 0.45, 0.034, 0, 0);
    walk(lx, ly, a0 + Math.PI + (rnd() - 0.5) * 0.8, 0.25 + rnd() * 0.3, 0.026, 0, 0);
    let max = 0; for (const s of segs) max = Math.max(max, s.d);
    cracks.push({ segs, born: performance.now(), max });
    if (cracks.length > 44) cracks.shift();
    crackDirty = true;
  }

  function paintCracks(now) {
    const h = hue(), speed = 4.5;                  // units per second the split travels
    cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, CR, CR);
    cg.setTransform(CS, 0, 0, CS, CR / 2, CR / 2);
    cg.lineCap = 'round';
    let growing = false;
    const passes = [
      ['source-over', 'rgba(0,0,0,.78)', 1.9], ['lighter', `hsla(${h},100%,62%,.55)`, 1.15], ['source-over', 'rgba(255,255,255,.92)', 0.42],
    ];
    for (const [op, col, wm] of passes) {
      cg.globalCompositeOperation = op; cg.strokeStyle = col;
      for (const c of cracks) {
        const reach = (now - c.born) / 1000 * speed;
        if (reach < c.max) growing = true;
        for (const s of c.segs) {
          if (s.d > reach) continue;
          cg.lineWidth = s.w * wm;
          cg.beginPath(); cg.moveTo(s.x0, s.y0); cg.lineTo(s.x1, s.y1); cg.stroke();
        }
      }
    }
    cg.globalCompositeOperation = 'source-over';
    crackDirty = growing;
  }
  crystal = makeCrystal(1);

  const crystalR = () => Math.min(W * 0.3, H * 0.2);
  const center = () => ({ x: W / 2, y: H * 0.56 });

  /* ---------------- particles ---------------- */
  function cap() { if (fxs.length > 260) fxs.splice(0, fxs.length - 260); }
  const fewer = () => Math.random() > G.opt('particles');          // 설정 - 파티클 양
  function shard(x, y, hue, sp = 1) {
    if (fewer()) return;
    const a = Math.random() * TAU, v = (120 + Math.random() * 380) * sp;
    fxs.push({ k: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14,
      s: 3 + Math.random() * 6, life: 0, max: 0.6 + Math.random() * 0.6, hue, l: 45 + Math.random() * 30 });
  }
  function spark(x, y, col, sp = 1) {
    if (fewer()) return;
    const a = Math.random() * TAU, v = (180 + Math.random() * 420) * sp;
    fxs.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.25 + Math.random() * 0.25, col });
  }
  function ring(x, y, col, r1 = 90, w = 2, max = 0.45) { fxs.push({ k: 'ring', x, y, life: 0, max, r1, col, w }); }
  function text(x, y, str, col, size = 16, max = 0.9) { if (!G.opt('floatText')) return; let n = 0; for (const p of fxs) if (p.k === 'text') n++; if (n > 8) return; fxs.push({ k: 'text', x, y, vy: -60, life: 0, max, str, col, size }); }
  /* single small coins (capped hard - hundreds of sprites is what made it laggy) */
  function coins(x, y, n, spread = 1) {
    n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (90 + Math.random() * 260) * spread;
      fxs.push({ k: "coin", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140 * spread, life: 0, t0: 0.28 + Math.random() * 0.3, fly: 0.5 + Math.random() * 0.2, ph: Math.random() * 6, sx: 0, sy: 0, s: 5 + Math.random() * 3 });
    }
    cap();
  }
  /* big rewards: a few fat coins, each carrying its share as a K / M / B label, flying to the wallet */
  function bundle(x, y, amount, n, spread = 1) {
    n = Math.max(1, Math.min(n, 8)); const each = amount / n;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n - 0.5) * 2.4 + (Math.random() - 0.5) * 0.4, v = (160 + Math.random() * 160) * spread;
      fxs.push({ k: "coin", x: x + (i - n / 2) * 6, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: -i * 0.07, t0: 0.5 + Math.random() * 0.15, fly: 0.7, ph: Math.random() * 6, sx: 0, sy: 0, s: 12, label: "+" + G.fmt(each) });
    }
    cap();
  }

  /* ---------------- mining ---------------- */
  const zone = () => G.data.zones[G.state.zone];
  const hue = () => zone().hue;

  /* 용융 핵 (zone 3) - the gems have hardened under the pressure, and won't crack open for a weak
     pickaxe: below 곡괭이 강화 lv.45 you barely dent them (no shatter, no cutscene roll). */
  const HARD_ZONE = 3, HARD_LV = 45;
  const isGated = () => G.state.zone === HARD_ZONE && G.stats.level('power') < HARD_LV;
  let lastGateWarn = 0;

  function mine(x, y, auto) {
    if (G.cutscenes.active || G.state.level1.crystalGone || G.config.viewer || (G.boss && G.boss.active)) return;
    const s = G.state, now = performance.now();
    const gated = isGated();
    if (gated && !auto && now - lastGateWarn > 1500) {
      lastGateWarn = now;
      G.emit('toast', `곡괭이가 너무 약해 튕겨나옵니다! 곡괭이 강화 Lv.${HARD_LV} 필요 (현재 Lv.${G.stats.level('power')})`);
    }
    if (!auto) {
      combo = now - lastClick < 700 ? Math.min(combo + 1, 10) : 0;
      lastClick = now;
    }
    const crit = !gated && Math.random() < G.stats.critChance();
    const gain = G.stats.clickValue() * (crit ? G.stats.critMul() : 1) * (gated ? 0.05 : 1);
    G.addCoins(gain); s.clicks++;
    let armed = null;
    if (!gated && !auto && G.stats.armedCount() > 0) { armed = G.stats.armedList(); s.armed = {}; G.save(); G.emit("change"); }
    G.audio.coin(auto ? 0 : combo, auto, zone().snd);
    G.audio.crack(zone().snd, hits / zone().hp, auto);
    if (crit) G.audio.crit();

    const c = center(), R = crystalR();
    pulse = 1; shake = Math.min(1, shake + (crit ? 0.7 : 0.25));
    let dx = x - c.x, dy = y - c.y; const dl = Math.hypot(dx, dy) || 1;
    kick.x = -dx / dl * R * 0.06; kick.y = -dy / dl * R * 0.06;
    const px = dl < R ? x : c.x + dx / dl * R, py = dl < R ? y : c.y + dy / dl * R;
    const h = hue();
    if (!auto || crit) for (let i = 0; i < (crit ? 8 : auto ? 0 : 4); i++) shard(px, py, h);
    if (!auto || crit) for (let i = 0; i < (crit ? 10 : 5); i++) spark(x, y, crit ? "#ffffff" : `hsl(${h},90%,75%)`);
    if (!auto || crit) ring(x, y, crit ? '#ffffff' : `hsl(${h},90%,70%)`, crit ? 120 : 60, crit ? 3 : 1.5, crit ? 0.6 : 0.35);
    coins(x, y, auto ? (Math.random() < 0.25 ? 1 : 0) : crit ? 3 : 1 + (Math.random() < 0.35 ? 1 : 0));
    if (!auto || crit) text(x + (Math.random() - 0.5) * 30, y - 14, (crit ? 'CRIT +' : '+') + G.fmt(gain), crit ? '#ffffff' : '#ffe08a', crit ? 22 : 15, crit ? 1.1 : 0.8);
    if (crit) { flashA = Math.max(flashA, 0.18); if (!auto) G.buzz(12); }

    // crystal HP - each hit opens a new crack where it landed (a gated hard-zone gem barely dents)
    if (!gated) hits++;
    if (!gated && (!auto || Math.random() < 0.34)) growCrack(clamp((px - c.x) / R, -0.95, 0.95) * 0.9, clamp((py - c.y) / R, -0.95, 0.95) * 0.9);
    let shatterLuck = false;
    if (!gated && hits >= zone().hp) {
      hits = 0; s.shatters++;
      const bonus = G.stats.clickValue() * 10 * G.stats.val('shatter');     // 강화 - 파쇄 보너스
      G.addCoins(bonus); G.audio.shatter(zone().snd);
      for (let i = 0; i < 26; i++) shard(c.x, c.y, h, 1.6);
      for (let i = 0; i < 14; i++) spark(c.x, c.y, `hsl(${h},95%,80%)`, 1.5);
      ring(c.x, c.y, '#ffffff', R * 2.2, 3, 0.7); ring(c.x, c.y, `hsl(${h},90%,65%)`, R * 3, 2, 0.9);
      bundle(c.x, c.y, bonus, 3, 1.1);
      text(c.x, c.y - R * 0.3, 'SHATTER +' + G.fmt(bonus), '#ffffff', 22, 1.3);
      text(c.x, c.y + R * 0.05, 'LUCK x5', `hsl(${h},95%,80%)`, 17, 1.1);
      shake = 1; flashA = 0.35; G.buzz(40);
      shatterLuck = true;
      crystal = makeCrystal((Math.random() * 1e9) | 0);
    }
    cap();
    G.emit('mine');
    // 무지개: each hand-swung click has a chance to shake loose a 별의 크리스탈
    const wx = G.weather.current();
    if (!auto && wx.starDrop && Math.random() < wx.starDrop) {
      s.potions.star = (s.potions.star || 0) + 1;
      text(x, y - 40, '+ 별의 크리스탈', '#d8a0ff', 16, 1.2);
      for (let i = 0; i < 12; i++) spark(x, y, `hsl(${280 + i * 8},100%,75%)`, 1.2);
      G.audio.potion(); G.emit('change');
    }
    // YELLOW crystals (from the 3rd map on): a hand-swung hit sometimes knocks loose a handful
    if (!auto && G.stats.yellowOpen() && Math.random() < G.data.yellowDrop.chance * (1 + G.stats.val('yellow'))) {
      const n = G.data.yellowDrop.n;
      s.yellow = (s.yellow || 0) + n;
      text(x, y - 56, `+${n} 옐로우 크리스탈`, '#ffd84a', 16, 1.3);
      ring(x, y, '#ffd84a', 70, 2, 0.5);
      for (let i = 0; i < 12; i++) spark(x, y, i % 2 ? '#ffe98a' : '#ffc21a', 1.3);
      G.audio.potion(); G.emit('change');
    }
    if (armed) potionBurst(armed, x, y);
    if (!gated) roll(armed, shatterLuck ? 5 : 1);
  }

  /* one-click luck bomb: everything flashes, the roll uses luck + all armed crystals' luck stacked, with a higher cap */
  function potionBurst(list, x, y) {
    const c = center(), R = crystalR();
    const grantItem = list.find(p => p.grantCut), guaranteeItem = list.find(p => p.guarantee);
    const top = grantItem || guaranteeItem || list.slice().sort((a, b) => (b.luck || 0) - (a.luck || 0))[0], col = `hsl(${top.hue},100%,68%)`;
    const totalLuck = G.stats.luckOf(list);
    G.audio.blast(top.event ? 7 : G.data.potions.indexOf(top));
    for (let i = 0; i < 4; i++) ring(c.x, c.y, i % 2 ? "#ffffff" : col, R * (2.4 + i), 3 - i * 0.4, 0.7 + i * 0.15);
    for (let i = 0; i < 22; i++) spark(c.x, c.y, i % 3 ? col : "#ffffff", 1.8);
    coins(c.x, c.y, 3, 1.5);
    const label = grantItem ? 'SPECIAL MINERAL CONFIRMED' : guaranteeItem ? top.en + '  ' + G.tiers[guaranteeItem.guarantee].en + '+ CONFIRMED'
      : list.length > 1 ? list.length + ' CRYSTALS  LUCK +' + G.fmt(totalLuck) : top.en + '  LUCK +' + G.fmt(totalLuck);
    text(c.x, c.y - R * 0.9, label, col, 20, 1.6);
    flashA = 0.5; shake = 1;
  }
  function roll(armed, luckMul = 1) {
    // a "guarantee" crystal (event rewards etc.) skips the normal odds roll entirely and hands
    // back a random mineral of at least that tier from the current zone - a real guarantee, not
    // just a very high luck number that could still theoretically miss
    // a limited mineral crystal hands over its one specific SPECIAL mineral, wherever you are
    const grant = armed && armed.find(p => p.grantCut && G.cutscenes.byId[p.grantCut]);
    if (grant) { startCut(G.cutscenes.byId[grant.grantCut], false); return; }
    const guarantee = armed ? armed.reduce((m, p) => p.guarantee ? Math.max(m, p.guarantee) : m, 0) : 0;
    if (guarantee) {
      const pool = G.cutscenes.inZone(G.state.zone).filter(c => c.tierIdx >= guarantee);
      if (pool.length) { startCut(pool[Math.floor(Math.random() * pool.length)], false); return; }
    }
    const potionLuck = armed ? G.stats.luckOf(armed) : 0;     // stacked with diminishing returns + 크리스탈 증폭
    // 번개: some rolls get struck - luck x100 for this one roll
    const wx = G.weather.current();
    if (wx.bolt && Math.random() < wx.bolt) {
      luckMul *= wx.boltMul;
      const c = center();
      text(c.x, c.y - crystalR() * 1.15, 'LIGHTNING  LUCK x' + wx.boltMul, '#ffe84a', 18, 1.1);
      ring(c.x, c.y, '#ffe84a', crystalR() * 2.4, 3, 0.5); flashA = Math.max(flashA, 0.3);
    }
    const def = G.cutscenes.roll(G.state.zone, G.stats.luck() * luckMul + potionLuck, armed ? G.data.potionCap : 0.5);
    if (def) startCut(def, false, G.weather.rollMutation(def));
  }

  /* ---------------- cutscene flow ---------------- */
  function startCut(def, replay, mut = null) {
    const s = G.state, reward = replay ? 0 : Math.floor(G.cutscenes.reward(def) * (mut ? mut.mul : 1));
    let first = false;
    if (!replay) {
      G.addCoins(reward);
      const cx = s.codex[def.id] || (s.codex[def.id] = { n: 0, t: Date.now(), best: 0 });
      first = cx.n === 0; cx.n++; cx.best = Math.max(cx.best, reward);
      if (mut) { cx.mut = cx.mut || {}; cx.mut[mut.id] = (cx.mut[mut.id] || 0) + 1; }     // mutations found, per mineral
      G.save();
    }
    // decide whether to actually play the film, or just hand over the reward
    const rec = s.codex[def.id], st = s.settings;
    const belowFloor = !replay && def.odds < (st.minOdds || 0);          // "설정 - 이 확률 미만은 표시 안 함"
    const autoSkip = !replay && st.autoSkipSeen && !first;               // "설정 - 이미 본 컷신은 항상 건너뛰기"
    // "컷신 잠깐 안 나오게 하기": for a while every find just pays out, no film at all
    const paused = !replay && !def.boss && performance.now() < G.cutPauseUntil;
    // a mutation is always worth seeing, even for a mineral you've switched off
    if (!replay && (paused || (!mut && (belowFloor || autoSkip || (rec && rec.skip && !first))))) { quickWin(def, reward, mut); return; }
    G.hold = !replay;               // freeze the wallet counter until the reveal is collected
    document.body.classList.add('cut');
    if (!replay && G.ui) G.ui.closePanel();   // replays from the codex keep the panel open for browsing
    G.cutscenes.start(def, { reward, first, replay, mut });
  }

  function quickWin(def, reward, mut = null) {
    const c = center(), t = G.tiers[def.tierIdx];
    const n = 2 + Math.ceil(Math.min(def.tierIdx, 9) / 2);
    bundle(c.x, c.y + 20, reward, n, 1.2);
    ring(c.x, c.y, t.color, crystalR() * 3, 3, 0.8);
    flashA = Math.max(flashA, 0.25); shake = Math.max(shake, 0.6);
    G.audio.win(def.tierIdx, def.snd);
    G.emit('win', { def, reward, tier: t, mut });
    G.emit('change');
  }
  /* 컷신 잠깐 안 나오게 하기 (the little button bottom-right): 30s of no films - and the one playing
     right now ends on the spot (its reward is already in the wallet) */
  G.cutPauseUntil = 0;
  G.pauseCuts = (sec = 30) => {
    G.cutPauseUntil = performance.now() + sec * 1000;
    if (G.cutscenes.active && !G.cutscenes.active.replay) G.cutscenes.end();
    G.emit('cutpause');
  };
  G.on('cut:reveal', a => { shake = 1; });
  G.on('cut:end', a => {
    document.body.classList.remove('cut');
    G.hold = false;
    if (!a.replay) {
      const n = 3 + Math.ceil(a.def.tierIdx / 2);
      bundle(W / 2, H * 0.62, a.reward, n, 1.4);
      G.audio.pour(12);
    }
    G.emit('change');
  });

  /* ---------------- input ---------------- */
  const hint = document.getElementById('hint');
  cv.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    G.audio.init();
    if (G.cutscenes.active) { if (G.cutscenes.tap()) return; }
    if (G.boss && G.boss.active) { G.boss.tap(ev.clientX, ev.clientY); return; }
    if (hint && !hint.classList.contains('gone')) hint.classList.add('gone');
    mine(ev.clientX, ev.clientY, false);
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', ev => {
    if (ev.repeat || ev.target.tagName === 'INPUT') return;
    if (G.boss && G.boss.active && !G.cutscenes.active) return;      // js/boss.js takes the keyboard during a fight
    if (ev.code === 'Space' || ev.code === 'Enter') {
      ev.preventDefault(); G.audio.init();
      if (G.cutscenes.active) { G.cutscenes.tap(); return; }
      const c = center(), a = Math.random() * TAU, r = Math.random() * crystalR() * 0.6;
      mine(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, false);
    }
  });

  /* ---------------- update ---------------- */
  let last = performance.now();
  function update(dt, now) {
    pulse = Math.max(0, pulse - dt * 5);
    shake = Math.max(0, shake - dt * 3.2);
    flashA = Math.max(0, flashA - dt * 1.4);
    kick.x *= Math.pow(0.02, dt); kick.y *= Math.pow(0.02, dt);
    if (now - lastClick > 800) combo = 0;

    const r = coinIco.getBoundingClientRect();
    target.x = r.left + r.width / 2; target.y = r.top + r.height / 2;

    if (!G.cutscenes.active && G.state.autoOn && !(G.boss && G.boss.active)) {
      const rate = G.stats.autoRate();
      if (rate > 0) {
        autoAcc += dt * rate;
        let n = 0;
        while (autoAcc >= 1 && n < 4) {
          autoAcc -= 1; n++;
          const c = center(), a = Math.random() * TAU, rr = Math.random() * crystalR() * 0.7;
          mine(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr, true);
          if (G.cutscenes.active) break;
        }
        if (autoAcc > 4) autoAcc = 0;
      }
    }
    G.cutscenes.update(now);

    for (let i = fxs.length - 1; i >= 0; i--) {
      const p = fxs[i]; p.life += dt;
      if (p.k === 'coin') {
        if (p.life < p.t0) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.vx *= Math.pow(0.15, dt); }
        else {
          if (!p.sx) { p.sx = p.x; p.sy = p.y; }
          const q = (p.life - p.t0) / p.fly;
          if (q >= 1) { fxs.splice(i, 1); G.emit('coinArrive'); continue; }
          const e2 = q * q;
          p.x = G.lerp(p.sx, target.x, e2); p.y = G.lerp(p.sy, target.y, e2);
        }
        continue;
      }
      if (p.life >= p.max) { fxs.splice(i, 1); continue; }
      if (p.k === 'coin' && p.life < 0) continue;
      if (p.k === 'shard') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.rot += p.vr * dt; }
      else if (p.k === 'spark') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.04, dt); p.vy *= Math.pow(0.04, dt); }
      else if (p.k === 'text') { p.y += p.vy * dt; p.vy *= Math.pow(0.3, dt); }
    }
  }

  /* ---------------- render ---------------- */
  /* the drifting effect behind the crystal, one per theme (js/data/themes.js). Positions are pure
     functions of time + index, so there's no particle state to keep. */
  function ambient(kind, t, h) {
    const fr = (v) => v - Math.floor(v);
    if (kind === 'bubbles') {
      g.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const sx = fr(i * 0.618), spd = 18 + (i % 6) * 9, r = 2 + (i % 5) * 1.6;
        const y = H + 20 - fr(t * spd / (H + 40) + i * 0.137) * (H + 40), x = sx * W + Math.sin(t * 1.3 + i) * 8;
        g.strokeStyle = `hsla(195,90%,80%,${0.18 + 0.12 * (i % 3)})`;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(220,250,255,.35)'; g.fillRect(x - r * 0.4, y - r * 0.5, 1.5, 1.5);
      }
    } else if (kind === 'petals') {
      for (let i = 0; i < 34; i++) {
        const sx = fr(i * 0.618), spd = 14 + (i % 5) * 7;
        const y = fr(t * spd / (H + 40) + i * 0.29) * (H + 40) - 20, x = fr(sx + t * 0.012 * (1 + i % 3)) * W + Math.sin(t * 0.9 + i) * 18;
        const flip = Math.cos(t * (1.2 + (i % 4) * 0.3) + i);
        g.save(); g.translate(x, y); g.rotate(t * 0.6 + i); g.scale(Math.max(0.2, Math.abs(flip)), 1);
        g.fillStyle = `hsla(${335 + (i % 3) * 8},85%,${72 + (i % 2) * 8}%,.55)`;
        g.beginPath(); g.ellipse(0, 0, 4.5, 3, 0, 0, TAU); g.fill(); g.restore();
      }
    } else if (kind === 'embers') {
      for (let i = 0; i < 40; i++) {
        const sx = fr(i * 0.618), spd = 20 + (i % 7) * 8;
        const y = H + 10 - fr(t * spd / (H + 20) + i * 0.173) * (H + 20), x = sx * W + Math.sin(t * 1.7 + i * 2) * 12;
        const fl = 0.5 + 0.5 * Math.sin(t * 9 + i * 3);
        g.fillStyle = `hsla(${22 + (i % 4) * 8},100%,${55 + fl * 20}%,${0.25 + 0.45 * fl * (y / H)})`;
        g.fillRect(x, y, 2 + (i % 2), 2 + (i % 2));
      }
    } else if (kind === 'fireflies') {
      for (let i = 0; i < 22; i++) {
        const x = fr(i * 0.618) * W + Math.sin(t * 0.35 + i * 1.7) * 40 + Math.sin(t * 0.9 + i) * 10;
        const y = fr(i * 0.382 + 0.1) * H + Math.cos(t * 0.3 + i * 2.1) * 34;
        const glow = Math.pow(Math.max(0, Math.sin(t * (0.8 + (i % 5) * 0.2) + i * 1.3)), 3);
        if (glow < 0.02) continue;
        const r = 10 * glow + 2, gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(210,255,140,${0.8 * glow})`); gr.addColorStop(1, 'rgba(120,255,120,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    } else if (kind === 'gold') {
      for (let i = 0; i < 46; i++) {
        const sx = fr(i * 0.618), spd = 4 + (i % 6) * 2;
        const x = sx * W + Math.sin(t * 0.4 + i) * 6, y = fr(t * spd / H + i * 0.231) * H;
        const tw = Math.pow(Math.max(0, Math.sin(t * (1.5 + (i % 4) * 0.4) + i * 2.3)), 4);
        g.fillStyle = `rgba(255,${210 + (i % 3) * 15},120,${0.12 + 0.6 * tw})`;
        const s = 1.5 + tw * 1.8; g.fillRect(x - s / 2, y - s / 2, s, s);
        if (tw > 0.7) { g.fillStyle = `rgba(255,240,190,${tw * 0.5})`; g.fillRect(x - 5, y - 0.5, 10, 1); g.fillRect(x - 0.5, y - 5, 1, 10); }
      }
    } else {
      for (let i = 0; i < 46; i++) {
        const sx = (i * 137.5) % 1, sy = (i * 61.8) % 1, spd = 6 + (i % 7) * 3;
        const x = sx * W, y = ((sy * H - t * spd) % H + H) % H;
        g.fillStyle = `hsla(${h},80%,80%,${0.12 + 0.2 * ((i % 5) / 5)})`;
        g.fillRect(x, y, 2, 2);
      }
    }
  }

  function drawBackground(t) {
    // 설정 - 테마: the backdrop tone + ambient effect come from the theme; the crystal glow keeps the map hue
    const th = G.activeTheme ? G.activeTheme() : null, tb = th ? th.bg : { hue: null, s: 45, l: 7 };
    const h = hue(), bh = tb.hue == null ? h : tb.hue;
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `hsl(${bh},${tb.s}%,${tb.l}%)`); bg.addColorStop(1, `hsl(${bh},${tb.s + 10}%,${Math.max(2, tb.l - 4)}%)`);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const c = center(), R = crystalR();
    const gl = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 3.2);
    gl.addColorStop(0, `hsla(${h},80%,50%,${0.22 + pulse * 0.2})`); gl.addColorStop(1, `hsla(${h},80%,50%,0)`);
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    // moving diagonal lattice
    g.strokeStyle = `hsla(${bh},70%,70%,0.045)`; g.lineWidth = 1;
    const sp = 64, off = (t * 8) % sp;
    g.beginPath();
    for (let x = -H; x < W + H; x += sp) { g.moveTo(x + off, 0); g.lineTo(x + off - H, H); g.moveTo(x - off, 0); g.lineTo(x - off + H, H); }
    g.stroke();
    ambient(th ? th.ambient : 'dust', t, bh);
    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  /* LEVEL 1's ending took the main crystal - an empty, faintly pulsing socket until it's restored */
  function drawVoidWhereCrystalWas(t) {
    const c = center(), R = crystalR();
    const pul = 0.5 + 0.5 * Math.sin(t * 0.8);
    g.save();
    g.strokeStyle = `rgba(255,255,255,${0.06 + 0.05 * pul})`; g.lineWidth = 1.4; g.setLineDash([3, 9]);
    g.beginPath(); g.arc(c.x, c.y, R * 0.95, 0, TAU); g.stroke(); g.setLineDash([]);
    const vg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 1.1);
    vg.addColorStop(0, `rgba(0,0,0,${0.5 + 0.1 * pul})`); vg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = vg; g.beginPath(); g.arc(c.x, c.y, R * 1.1, 0, TAU); g.fill();
    g.restore();
  }

  function drawCrystal(t, now) {
    const h = hue(), c = center(), R = crystalR();
    const age = (now - crystal.born) / 1000, spawn = E.outBack(clamp(age / 0.5));
    const bob = Math.sin(t * 1.6) * R * 0.015;
    const sc = R * (1 + pulse * 0.07) * (0.3 + 0.7 * spawn);

    // reticle
    g.save(); g.translate(c.x, c.y);
    g.rotate(t * 0.15);
    g.strokeStyle = `hsla(${h},80%,70%,0.3)`; g.lineWidth = 1; g.setLineDash([4, 10]);
    g.beginPath(); g.arc(0, 0, R * 1.32, 0, TAU); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(R * 1.25, 0); g.lineTo(R * 1.42, 0); g.stroke(); }
    g.restore();
    // drunk potions charge the crystal: pulsing halo + orbiting sparks (one ring of sparks per armed crystal) until the next click fires them
    const ap = G.stats.armedTop(), armedN = G.stats.armedCount();
    if (ap) {
      const pc = `hsl(${ap.hue},100%,68%)`, pk = 0.55 + 0.35 * Math.sin(t * 6);
      const gl = g.createRadialGradient(c.x, c.y, R * 0.5, c.x, c.y, R * 2.1);
      gl.addColorStop(0, `hsla(${ap.hue},100%,60%,${(0.24 + 0.08 * Math.min(3, armedN)) * pk})`); gl.addColorStop(1, `hsla(${ap.hue},100%,60%,0)`);
      g.fillStyle = gl; g.fillRect(c.x - R * 2.2, c.y - R * 2.2, R * 4.4, R * 4.4);
      g.strokeStyle = pc; g.globalAlpha = pk; g.lineWidth = 2.5; g.beginPath(); g.arc(c.x, c.y, R * (1.5 + 0.05 * Math.sin(t * 8)), 0, TAU); g.stroke(); g.globalAlpha = 1;
      const sparkN = Math.min(24, 10 * armedN);
      for (let i = 0; i < sparkN; i++) { const a = t * 1.8 + (i / sparkN) * TAU, rr = R * (1.5 + 0.12 * Math.sin(t * 3 + i)); g.fillStyle = i % 2 ? pc : '#ffffff'; g.fillRect(c.x + Math.cos(a) * rr - 2, c.y + Math.sin(a) * rr - 2, 4, 4); }
    }
    // HP arc (progress to shatter) - a hard-zone gem under level shows a locked red ring instead
    const prog = hits / zone().hp;
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.08)';
    g.beginPath(); g.arc(c.x, c.y, R * 1.2, 0, TAU); g.stroke();
    if (isGated()) {
      const bl = 0.5 + 0.5 * Math.sin(t * 5);
      g.strokeStyle = `rgba(255,70,70,${0.4 + 0.35 * bl})`; g.lineWidth = 3; g.setLineDash([6, 8]);
      g.beginPath(); g.arc(c.x, c.y, R * 1.2, 0, TAU); g.stroke(); g.setLineDash([]);
      g.textAlign = 'center'; g.font = `800 ${R * 0.09}px ui-monospace, monospace`;
      g.fillStyle = `rgba(255,120,120,${0.75 + 0.25 * bl})`;
      g.fillText(`곡괭이 강화 Lv.${HARD_LV} 필요`, c.x, c.y - R * 1.42);
    } else if (prog > 0) {
      g.strokeStyle = `hsl(${h},90%,70%)`; g.lineWidth = 3;
      g.beginPath(); g.arc(c.x, c.y, R * 1.2, -Math.PI / 2, -Math.PI / 2 + TAU * prog); g.stroke();
    }

    g.save();
    g.translate(c.x + kick.x, c.y + bob + kick.y);
    g.scale(sc, sc);
    const { pts, apex, facets } = crystal, n = pts.length;
    // a point light slowly orbits the gem - each facet catches it in turn, like a real cut stone turning in the light
    const lightAng = t * 0.22, ambient = 0.35 + pulse * 0.18;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], f = facets[i];
      const diff = Math.max(0, Math.cos(f.ang - lightAng));
      const boost = Math.pow(diff, 4) * 34, baseL = clamp(f.l + pulse * 14 + boost, 6, 97);
      const hue = h + f.var * 16 - 8, sat = 55 + pulse * 18 + boost * 0.3;
      g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.closePath();
      const grad = g.createLinearGradient(apex[0], apex[1], f.mx, f.my);
      grad.addColorStop(0, `hsl(${hue},${sat * 0.7}%,${Math.max(8, baseL * ambient - 4)}%)`);
      grad.addColorStop(0.55, `hsl(${hue},${sat}%,${baseL * 0.72}%)`);
      grad.addColorStop(1, `hsl(${hue},${sat}%,${baseL}%)`);
      g.fillStyle = grad; g.fill();
    }
    // outline + inner edges
    const lw = 1.4 / sc;
    g.lineWidth = lw; g.strokeStyle = `hsla(${h},90%,88%,0.55)`;
    g.beginPath();
    for (let i = 0; i < n; i++) { g.moveTo(apex[0], apex[1]); g.lineTo(pts[i][0], pts[i][1]); }
    g.stroke();
    g.lineWidth = lw * 1.6; g.strokeStyle = `hsla(${h},95%,92%,0.9)`;
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
    // cracks (cached layer, clipped to the crystal) + light leaking out as it nears breaking
    if (crackDirty) paintCracks(now);
    g.save();
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip();
    if (prog > 0.4) {
      const lk = g.createRadialGradient(0, 0, 0, 0, 0, 1.1);
      lk.addColorStop(0, `hsla(${h},100%,80%,${(prog - 0.4) * 0.5 * (0.7 + 0.3 * Math.sin(t * 14))})`); lk.addColorStop(1, `hsla(${h},100%,70%,0)`);
      g.fillStyle = lk; g.fillRect(-1.2, -1.2, 2.4, 2.4);
    }
    g.drawImage(crackCv, -CR / 2 / CS, -CR / 2 / CS, CR / CS, CR / CS);
    g.restore();
    g.restore();
  }

  function drawParticles() {
    for (const p of fxs) {
      const q = p.life / p.max;
      if (p.k === 'coin' && p.life < 0) continue;
      if (p.k === 'shard') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.fillStyle = `hsla(${p.hue},80%,${p.l}%,${1 - q * q})`;
        g.beginPath(); g.moveTo(-p.s, p.s * 0.6); g.lineTo(0, -p.s); g.lineTo(p.s, p.s * 0.6); g.closePath(); g.fill();
        g.restore();
      } else if (p.k === 'spark') {
        g.strokeStyle = p.col; g.globalAlpha = 1 - q; g.lineWidth = 2;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.stroke(); g.globalAlpha = 1;
      } else if (p.k === 'ring') {
        g.strokeStyle = p.col; g.globalAlpha = 1 - q; g.lineWidth = p.w * (1 - q * 0.6);
        g.beginPath(); g.arc(p.x, p.y, p.r1 * E.outCubic(q), 0, TAU); g.stroke(); g.globalAlpha = 1;
      } else if (p.k === 'coin') {
        const flip = Math.abs(Math.cos(p.life * 11 + p.ph)), s = p.s;
        g.save(); g.translate(p.x, p.y); g.scale(0.25 + 0.75 * flip, 1);
        g.beginPath();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; i ? g.lineTo(Math.cos(a) * s, Math.sin(a) * s) : g.moveTo(Math.cos(a) * s, Math.sin(a) * s); }
        g.closePath(); g.fillStyle = '#ffcf4a'; g.fill();
        g.lineWidth = 1; g.strokeStyle = '#fff3b0'; g.stroke();
        g.fillStyle = '#c98a12'; g.fillRect(-s * 0.18, -s * 0.5, s * 0.36, s);
        g.restore();
        if (p.label) {
          g.font = '800 12px ui-monospace,Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(p.label, p.x, p.y - s - 8);
          g.fillStyle = '#ffe9a0'; g.fillText(p.label, p.x, p.y - s - 8);
        }
      } else if (p.k === 'text') {
        g.globalAlpha = 1 - q * q; g.font = `800 ${p.size}px ui-monospace,Consolas,monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText(p.str, p.x, p.y);
        g.fillStyle = p.col; g.fillText(p.str, p.x, p.y); g.globalAlpha = 1;
      }
    }
  }

  function render(now) {
    const t = now / 1000;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    g.save();
    const sk = shake * G.opt('shake');                                // 설정 - 화면 흔들림
    if (sk > 0) g.translate((Math.random() - 0.5) * sk * 10, (Math.random() - 0.5) * sk * 10);
    drawBackground(t);
    G.weather.drawBack(g, W, H, t);
    if (G.boss && G.boss.active) G.boss.draw(g, W, H, now);          // a boss fight replaces the crystal
    else if (G.state.level1.crystalGone) drawVoidWhereCrystalWas(t); else drawCrystal(t, now);
    drawParticles();
    G.weather.drawFront(g, W, H, t);
    if (flashA > 0) { g.fillStyle = `rgba(255,255,255,${flashA * G.flashMul()})`; g.fillRect(-20, -20, W + 40, H + 40); }
    g.restore();
    G.cutscenes.draw(g, W, H);
    if (G.cutscenes.active) drawParticles();   // coins from a finished cutscene still fly above it
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt, now); render(now);
    requestAnimationFrame(frame);
  }

  /* ---------------- boot ---------------- */
  G.load();
  G.on('zone', () => { hits = 0; crystal = makeCrystal((Math.random() * 1e9) | 0); ring(center().x, center().y, '#ffffff', crystalR() * 3, 3, 0.8); });
  G.game = {
    center, crystalR, mine,
    /* a real find handed over by something other than a roll (boss rewards) */
    grantCut: def => startCut(def, false),
    reward: (x, y, amount, n) => bundle(x, y, amount, n, 1.3),
    shake: v => { shake = Math.max(shake, v); },
    flash: v => { flashA = Math.max(flashA, v); },
  };
  G.debug = {
    play: id => { const d = G.cutscenes.byId[id]; if (d) startCut(d, true); },
    /* park a cutscene on progress p (0..1) for inspection:  G.debug.seek('genesis', 0.8) */
    seek: (id, p) => {
      const d = G.cutscenes.byId[id]; if (!d) return;
      G.cutscenes.end(); startCut(d, true); G.audio.stopCut();
      G.cutscenes.active.frozen = d.duration * p; G.cutscenes.active.guard = 0; G.cutscenes.active.audioOn = true;
    },
    trigger: id => { const d = G.cutscenes.byId[id]; if (d) startCut(d, false); },
    coins: n => { G.addCoins(n); G.emit('change'); },
  };
  G.replay = id => { const d = G.cutscenes.byId[id]; if (d) startCut(d, true); };
  requestAnimationFrame(frame);
  G.emit('ready');
})();
