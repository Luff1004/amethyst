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
  // particle budget follows 설정 - 이펙트 (high 260 / mid 110 / low 45 live particles)
  function cap() { const m = G.opt('fx') === 'low' ? 45 : G.opt('fx') === 'mid' ? 110 : 260; if (fxs.length > m) fxs.splice(0, fxs.length - m); }
  const fewer = () => Math.random() > G.opt('particles') * G.fxK();   // 설정 - 파티클 양 x 이펙트
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
  function ring(x, y, col, r1 = 90, w = 2, max = 0.45) {
    if (G.opt('fx') !== 'high') { let n = 0; for (const p of fxs) if (p.k === 'ring') n++; if (n >= (G.opt('fx') === 'low' ? 2 : 6)) return; }
    fxs.push({ k: 'ring', x, y, life: 0, max, r1, col, w });
  }
  function text(x, y, str, col, size = 16, max = 0.9) { if (!G.opt('floatText')) return; let n = 0; for (const p of fxs) if (p.k === 'text') n++; if (n > (G.opt('fx') === 'low' ? 2 : G.opt('fx') === 'mid' ? 5 : 8)) return; fxs.push({ k: 'text', x, y, vy: -60, life: 0, max, str, col, size }); }
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
    if (!auto && G.stats.yellowOpen() && Math.random() < G.data.yellowDrop.chance * (1 + G.stats.val('yellow')) * G.biome.mul('yellow') * (1 + G.stats.lab('yellow'))) {
      const n = G.data.yellowDrop.n;
      s.yellow = (s.yellow || 0) + n;
      text(x, y - 56, `+${n} 옐로우 크리스탈`, '#ffd84a', 16, 1.3);
      ring(x, y, '#ffd84a', 70, 2, 0.5);
      for (let i = 0; i < 12; i++) spark(x, y, i % 2 ? '#ffe98a' : '#ffc21a', 1.3);
      G.audio.potion(); G.emit('change');
    }
    if (armed) potionBurst(armed, x, y);
    if (!gated && !(auto && zone().noAutoRoll)) roll(armed, shatterLuck ? 5 : 1);   // 6th map: only hand-swung hits can find minerals
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
    // CUBER STAGE: the limited aura gets its own 1-in-a-million shot every swing, whatever your luck
    const aura = G.biome.auraRoll();
    if (aura) { startCut(aura, false); return; }
    const potionLuck = armed ? G.stats.luckOf(armed) : 0;     // stacked with diminishing returns + 크리스탈 증폭
    // 에러 크리스탈: this click rolls the error minerals instead of the map's own
    if (armed && armed.some(p => p.errorPool)) {
      const pool = G.cutscenes.list.filter(c => c.biome === 'glitch');
      const err = G.cutscenes.rollFrom(pool, G.stats.luck() * luckMul + potionLuck, G.data.potionCap);
      if (err) startCut(err, false);
      return;
    }
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
      G.biome.onFind(def);                                    // two 1억+ in a row opens CUBER STAGE
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
    lookAt = { x: ev.clientX, y: ev.clientY, at: performance.now() };     // THE UNSEEN's eyes turn to the last tap
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
    if (G.state.stats) G.state.stats.playMs += dt * 1000;      // 설정 - 통계: time actually spent on the screen
    pulse = Math.max(0, pulse - dt * 5);
    shake = Math.max(0, shake - dt * 3.2);
    flashA = Math.max(0, flashA - dt * 1.4);
    kick.x *= Math.pow(0.02, dt); kick.y *= Math.pow(0.02, dt);
    if (now - lastClick > 800) combo = 0;

    const r = coinIco.getBoundingClientRect();
    target.x = r.left + r.width / 2; target.y = r.top + r.height / 2;

    if (!G.cutscenes.active && G.state.autoOn && !(G.boss && G.boss.active) && !G.biome.noAuto()) {   // GLITCH: hands only
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
  /* the imperial backdrop shared by THE SOVEREIGN (gold + ruby) and THE EMPYREAN (platinum + sapphire):
     a diagonal weave with a band of light sliding over it, an art-deco sunburst behind the crystal
     between two studded rings, a laurel wreath, a crown on top, dust drifting down with glints.
     Colours are "r,g,b" strings so each layer can set its own alpha. */
  const RGBA = (c, a) => `rgba(${c},${a})`;
  const ROYAL = {
    sovereign: { weave: '230,180,70', glow: '240,190,80', ray0: '255,220,130', ray1: '255,200,90', ring: '243,198,78', stud: '255,225,150', gem: '220,30,50',
      leaf0: '255,236,170', leaf1: '190,130,30', leafLine: '214,160,50', ribbon: '200,20,44', crown: ['255,244,200', '243,198,78', '150,100,20'], band: '90,50,8',
      pearl: '255,248,220', crownGem: '220,24,48', tips: [[-1, 0.65], [0, 1], [1, 0.65]], dust: i => `255,${205 + (i % 3) * 15},120`, glint: '255,246,210' },
    empyrean: { weave: '90,150,255', glow: '60,130,255', ray0: '180,220,255', ray1: '80,150,255', ring: '150,195,255', stud: '225,240,255', gem: '40,170,255',
      leaf0: '240,248,255', leaf1: '80,120,200', leafLine: '150,190,240', ribbon: '30,90,230', crown: ['252,253,255', '170,200,245', '50,80,150'], band: '14,30,80',
      pearl: '235,246,255', crownGem: '40,160,255', tips: [[-1, 0.6], [-0.5, 0.82], [0, 1.08], [0.5, 0.82], [1, 0.6]], dust: i => `${170 + (i % 3) * 25},${215 + (i % 2) * 20},255`, glint: '235,248,255' },
    verdant: { weave: '80,220,140', glow: '30,200,100', ray0: '190,255,200', ray1: '40,190,100', ring: '150,235,150', stud: '240,240,170', gem: '0,255,140',
      leaf0: '250,240,170', leaf1: '30,130,60', leafLine: '140,210,120', ribbon: '220,180,50', crown: ['255,252,215', '215,205,110', '40,100,40'], band: '6,40,16',
      pearl: '240,255,230', crownGem: '0,255,140', tips: [[-1, 0.6], [-0.66, 0.78], [-0.33, 0.9], [0, 1.15], [0.33, 0.9], [0.66, 0.78], [1, 0.6]],
      dust: i => `${150 + (i % 3) * 30},255,${170 + (i % 2) * 40}`, glint: '235,255,230' },
    crimson: { weave: '230,50,60', glow: '230,20,40', ray0: '255,170,130', ray1: '200,10,30', ring: '255,110,90', stud: '255,215,160', gem: '255,30,50',
      leaf0: '255,215,150', leaf1: '110,10,10', leafLine: '220,70,50', ribbon: '30,0,4', crown: ['255,232,190', '230,70,50', '50,0,0'], band: '20,0,0',
      pearl: '255,236,205', crownGem: '255,20,40', tips: [[-1, 0.7], [-0.66, 0.95], [-0.33, 0.85], [0, 1.35], [0.33, 0.85], [0.66, 0.95], [1, 0.7]],
      dust: i => `255,${90 + (i % 3) * 50},${40 + (i % 2) * 30}`, glint: '255,225,190', rise: true, beat: true },
  };
  /* THE VERDANT: an ouroboros of jade scales coiling round the crystal (head chasing its tail), an
     emerald shockwave every few seconds, and rune motes rising */
  function verdantFront(t, o, fr) {
    const { c, R, br } = o, k = G.fxK();
    g.save(); g.translate(c.x, c.y);
    // shockwave
    const wv = (t % 4) / 4;
    g.strokeStyle = `rgba(60,255,150,${0.5 * (1 - wv)})`; g.lineWidth = 3 * (1 - wv) + 0.5;
    g.beginPath(); g.arc(0, 0, R * (1.5 + wv * 1.9), 0, TAU); g.stroke();
    // the serpent: a real tube of a body following the circle, slithering (a travelling radial wave),
    // shaded round by a radial gradient (pale jade belly inside, dark emerald back outside), scaled,
    // spined along its back with emeralds set in the spine, swelling from a thin tail to the neck
    const sr = Math.min(R * 2.12, W * 0.45), a0 = t * 0.1, gap = 0.44, span = TAU - gap, N = 170;
    const wmax = Math.max(12, sr * 0.085), amp = sr * 0.022;
    const radAt = f => sr + Math.sin(f * TAU * 6 - t * 2.4) * amp * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, f * 1.15)));
    const widAt = f => 2 + (wmax - 2) * Math.pow(Math.min(1, f / 0.85), 0.65) * (f > 0.93 ? 1 - (f - 0.93) * 2.2 : 1);
    const pts = [];
    for (let i = 0; i <= N; i++) { const f = i / N, a = a0 + span * f; pts.push({ f, a, r: radAt(f), w: widAt(f) }); }
    const bodyPath = (pad = 0) => {
      g.beginPath();
      pts.forEach((p, i) => { const r = p.r + p.w / 2 + pad; i ? g.lineTo(Math.cos(p.a) * r, Math.sin(p.a) * r) : g.moveTo(Math.cos(p.a) * r, Math.sin(p.a) * r); });
      for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i], r = p.r - p.w / 2 - pad; g.lineTo(Math.cos(p.a) * r, Math.sin(p.a) * r); }
      g.closePath();
    };
    // glow + dark outline
    g.save(); g.shadowColor = `rgba(40,255,140,${0.55 * br})`; g.shadowBlur = 18;
    g.fillStyle = '#021208'; bodyPath(1.6); g.fill(); g.restore();
    // round shading across the body
    const sh = g.createRadialGradient(0, 0, sr - wmax - amp, 0, 0, sr + wmax + amp);
    sh.addColorStop(0, '#e8f0a8'); sh.addColorStop(0.28, '#7fd38a'); sh.addColorStop(0.5, '#1f9a52'); sh.addColorStop(0.62, '#3fe08a'); sh.addColorStop(0.72, '#178046'); sh.addColorStop(1, '#03301a');
    g.fillStyle = sh; bodyPath(); g.fill();
    g.save(); bodyPath(); g.clip();
    // scales: three staggered rows of little arcs opening toward the tail, dark rims with a lit edge
    const dark = new Path2D(), lit = new Path2D();
    for (let i = 2; i < pts.length; i += 2) {
      const p = pts[i], s = p.w * 0.3, back = p.a - Math.PI / 2 * 0;     // tangent points toward increasing angle
      for (const row of [-0.28, 0, 0.28]) {
        const aa = p.a + (row === 0 ? 0 : 0.004 * (i % 4 ? 1 : -1)), rr = p.r + row * p.w, x = Math.cos(aa) * rr, y = Math.sin(aa) * rr;
        const tang = aa + Math.PI / 2;
        dark.moveTo(x + Math.cos(tang + Math.PI / 2) * s, y + Math.sin(tang + Math.PI / 2) * s);
        dark.arc(x, y, s, tang + Math.PI / 2, tang + Math.PI * 1.5);
        lit.moveTo(x + Math.cos(tang + Math.PI * 0.75) * s * 0.8, y + Math.sin(tang + Math.PI * 0.75) * s * 0.8);
        lit.arc(x, y, s * 0.8, tang + Math.PI * 0.75, tang + Math.PI * 1.15);
      }
    }
    g.lineWidth = 0.9; g.strokeStyle = 'rgba(0,40,18,.55)'; g.stroke(dark);
    g.lineWidth = 0.7; g.strokeStyle = `rgba(210,255,200,${0.35 * br})`; g.stroke(lit);
    // belly plates on the inner side
    g.strokeStyle = 'rgba(120,110,40,.35)'; g.lineWidth = 0.8; g.beginPath();
    for (let i = 1; i < pts.length; i += 3) { const p = pts[i], r0 = p.r - p.w * 0.5, r1 = p.r - p.w * 0.22; g.moveTo(Math.cos(p.a) * r0, Math.sin(p.a) * r0); g.lineTo(Math.cos(p.a + 0.006) * r1, Math.sin(p.a + 0.006) * r1); }
    g.stroke();
    // a moving sheen along the back
    const sw = (t * 0.25) % 1.4 - 0.2;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pts.length; i += 1) { const p = pts[i], d = Math.abs(p.f - sw); if (d > 0.08) continue; const a = (1 - d / 0.08) * 0.35, r = p.r + p.w * 0.18; g.fillStyle = `rgba(190,255,210,${a})`; g.beginPath(); g.arc(Math.cos(p.a) * r, Math.sin(p.a) * r, p.w * 0.22, 0, TAU); g.fill(); }
    g.restore();
    // dorsal spines on the outer edge, gold-tipped, and emeralds set along the spine
    for (let i = 6; i < pts.length - 8; i += 5) {
      const p = pts[i], r = p.r + p.w / 2, L = p.w * 0.55, wd = 0.012;
      g.fillStyle = '#0a4a24';
      g.beginPath(); g.moveTo(Math.cos(p.a - wd) * r, Math.sin(p.a - wd) * r); g.lineTo(Math.cos(p.a - wd * 2.5) * (r + L), Math.sin(p.a - wd * 2.5) * (r + L)); g.lineTo(Math.cos(p.a + wd) * r, Math.sin(p.a + wd) * r); g.closePath(); g.fill();
      g.fillStyle = `rgba(240,220,120,${0.85 * br})`; g.beginPath(); g.arc(Math.cos(p.a - wd * 2.5) * (r + L), Math.sin(p.a - wd * 2.5) * (r + L), 0.9, 0, TAU); g.fill();
    }
    for (let j = 1; j <= 7; j++) {
      const p = pts[Math.round(j / 8 * N)], s = p.w * 0.26, x = Math.cos(p.a) * (p.r + p.w * 0.1), y = Math.sin(p.a) * (p.r + p.w * 0.1);
      g.save(); g.translate(x, y); g.rotate(p.a); g.shadowColor = '#3fff9a'; g.shadowBlur = 8 * br;
      g.fillStyle = '#e8d66a'; g.beginPath(); g.moveTo(0, -s * 1.35); g.lineTo(s * 1.35, 0); g.lineTo(0, s * 1.35); g.lineTo(-s * 1.35, 0); g.closePath(); g.fill();
      g.fillStyle = '#18e07a'; g.beginPath(); g.moveTo(0, -s); g.lineTo(s, 0); g.lineTo(0, s); g.lineTo(-s, 0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(230,255,240,.9)'; g.fillRect(-s * 0.35, -s * 0.45, s * 0.3, s * 0.3);
      g.restore();
    }
    // the head: a horned viper seen from above, jaws closed on its own tail
    const ph = pts[pts.length - 1], ah = ph.a, hx = Math.cos(ah) * ph.r, hy = Math.sin(ah) * ph.r;
    const Lh = sr * gap * 0.92, Wh = wmax * 2.15;
    g.save(); g.translate(hx, hy); g.rotate(ah + Math.PI / 2);
    const aura = g.createRadialGradient(Lh * 0.4, 0, 0, Lh * 0.4, 0, Lh);
    aura.addColorStop(0, `rgba(60,255,150,${0.3 * br})`); aura.addColorStop(1, 'rgba(60,255,150,0)');
    g.fillStyle = aura; g.beginPath(); g.arc(Lh * 0.4, 0, Lh, 0, TAU); g.fill();
    const head = new Path2D();
    head.moveTo(-4, -ph.w / 2);
    head.bezierCurveTo(Lh * 0.15, -Wh * 0.62, Lh * 0.38, -Wh * 0.6, Lh * 0.55, -Wh * 0.44);
    head.quadraticCurveTo(Lh * 0.9, -Wh * 0.3, Lh, 0);
    head.quadraticCurveTo(Lh * 0.9, Wh * 0.3, Lh * 0.55, Wh * 0.44);
    head.bezierCurveTo(Lh * 0.38, Wh * 0.6, Lh * 0.15, Wh * 0.62, -4, ph.w / 2);
    head.closePath();
    g.save(); g.shadowColor = 'rgba(40,255,140,.7)'; g.shadowBlur = 14; g.fillStyle = '#021208'; g.lineWidth = 3; g.strokeStyle = '#021208'; g.stroke(head); g.restore();
    const hg = g.createLinearGradient(0, -Wh * 0.6, 0, Wh * 0.6);
    hg.addColorStop(0, '#0a5a2c'); hg.addColorStop(0.35, '#2fd07a'); hg.addColorStop(0.5, '#b8f5a8'); hg.addColorStop(0.65, '#2fd07a'); hg.addColorStop(1, '#0a5a2c');
    g.fillStyle = hg; g.fill(head);
    g.save(); g.clip(head);
    g.strokeStyle = 'rgba(0,40,18,.5)'; g.lineWidth = 0.9;      // head plates
    g.beginPath(); g.moveTo(Lh * 0.12, 0); g.lineTo(Lh * 0.85, 0);
    for (const s of [-1, 1]) { g.moveTo(Lh * 0.2, s * Wh * 0.18); g.quadraticCurveTo(Lh * 0.5, s * Wh * 0.3, Lh * 0.8, s * Wh * 0.1); g.moveTo(Lh * 0.32, s * Wh * 0.05); g.lineTo(Lh * 0.32, s * Wh * 0.5); g.moveTo(Lh * 0.62, s * Wh * 0.05); g.lineTo(Lh * 0.6, s * Wh * 0.38); }
    g.stroke();
    g.restore();
    // brow horns sweeping back, gold at the tips
    for (const s of [-1, 1]) {
      const hgr = g.createLinearGradient(Lh * 0.45, s * Wh * 0.4, -Lh * 0.15, s * Wh * 1.05);
      hgr.addColorStop(0, '#0a4a24'); hgr.addColorStop(0.6, '#5a8a3a'); hgr.addColorStop(1, '#ffe9a0');
      g.fillStyle = hgr; g.beginPath(); g.moveTo(Lh * 0.5, s * Wh * 0.36); g.quadraticCurveTo(Lh * 0.2, s * Wh * 0.85, -Lh * 0.15, s * Wh * 1.05); g.quadraticCurveTo(Lh * 0.15, s * Wh * 0.62, Lh * 0.32, s * Wh * 0.4); g.closePath(); g.fill();
    }
    // eyes: burning gold with a slit pupil
    for (const s of [-1, 1]) {
      g.save(); g.translate(Lh * 0.46, s * Wh * 0.34); g.shadowColor = '#ffd84a'; g.shadowBlur = 10 * br;
      g.fillStyle = '#ffd84a'; g.beginPath(); g.ellipse(0, 0, Wh * 0.17, Wh * 0.11, s * 0.25, 0, TAU); g.fill();
      g.shadowBlur = 0; g.fillStyle = '#ff8a1a'; g.beginPath(); g.ellipse(0, 0, Wh * 0.1, Wh * 0.07, s * 0.25, 0, TAU); g.fill();
      g.fillStyle = '#020a04'; g.beginPath(); g.ellipse(0, 0, Wh * 0.022, Wh * 0.09, 0, 0, TAU); g.fill();
      g.restore();
    }
    // nostrils, and fangs sinking into the tail at the snout
    g.fillStyle = '#021208';
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(Lh * 0.86, s * Wh * 0.1, 1.6, 0.9, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#f4fff0';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(Lh * 0.78, s * Wh * 0.2); g.lineTo(Lh * 0.95, s * Wh * 0.05); g.lineTo(Lh * 0.8, s * Wh * 0.1); g.closePath(); g.fill(); }
    g.restore();
    g.restore();
    // rune motes: small turning diamonds of light rising from below
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0, n = Math.round(18 * k); i < n; i++) {
      const x = fr(i * 0.618 + 0.3) * W, y = H + 20 - fr(t * (10 + (i % 5) * 4) / (H + 40) + i * 0.29) * (H + 40), s = 3 + (i % 3) * 1.5;
      g.save(); g.translate(x, y); g.rotate(t * (0.6 + (i % 3) * 0.3) + i);
      g.strokeStyle = `rgba(90,255,160,${0.5 + 0.3 * Math.sin(t * 3 + i)})`; g.lineWidth = 1;
      g.strokeRect(-s / 2, -s / 2, s, s); g.fillStyle = 'rgba(200,255,220,.8)'; g.fillRect(-0.8, -0.8, 1.6, 1.6);
      g.restore();
    }
    g.restore();
  }
  /* THE CRIMSON: a blood moon rising behind the crown, flames licking up the bottom of the screen;
     in front, a turning ring of thorns that throws red lightning, everything pulsing to a heartbeat */
  /* the blood moon's surface, rendered once per size into an offscreen canvas: a lit sphere (light from the
     upper left), value-noise highlands and dark maria, craters with a lit rim and a shadowed bowl, a deep
     eclipse red with the limb burning brighter */
  let moonTex = null, moonKey = '';
  function moonTexture(px) {
    const key = String(px);
    if (moonTex && moonKey === key) return moonTex;
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    const cx = cv.getContext('2d'), img = cx.createImageData(px, px), d = img.data;
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c2 = hash(xi, yi + 1), e = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + e) * u * v;
    };
    const fbm = (x, y) => { let s = 0, amp = 0.5, f = 1; for (let o = 0; o < 5; o++) { s += amp * noise(x * f, y * f); f *= 2.03; amp *= 0.5; } return s; };
    // craters: fixed set (same moon every time)
    const craters = [];
    for (let i = 0; i < 70; i++) { const a = hash(i, 1) * TAU, r = Math.sqrt(hash(i, 2)) * 0.9; craters.push([Math.cos(a) * r, Math.sin(a) * r, 0.012 + Math.pow(hash(i, 3), 3) * 0.13]); }
    const L = [-0.55, -0.6, 0.58], L2 = Math.hypot(L[0], L[1]), lx = L[0] / L2, ly = L[1] / L2;
    for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
      const nx = (x + 0.5) / px * 2 - 1, ny = (y + 0.5) / px * 2 - 1, dd = nx * nx + ny * ny, o = (y * px + x) * 4;
      if (dd > 1) { d[o + 3] = 0; continue; }
      const nz = Math.sqrt(1 - dd), lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const u = nx / (nz + 0.6) * 2.2, v = ny / (nz + 0.6) * 2.2;
      let alb = 0.6 + 0.42 * (fbm(u * 3 + 7, v * 3 + 3) - 0.5) + 0.12 * (fbm(u * 14 + 2, v * 14 + 9) - 0.5);
      const mare = fbm(u * 1.2 + 11, v * 1.2 + 5), mk = Math.min(1, Math.max(0, (mare - 0.47) / 0.12)); alb -= 0.3 * mk * mk * (3 - 2 * mk);
      let sh = 0;
      for (const [ccx, ccy, cr] of craters) {
        const dx = nx - ccx, dy = ny - ccy, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > cr * 1.3) continue;
        const dirx = dx / (dist || 1), diry = dy / (dist || 1), facing = dirx * lx + diry * ly;   // >0: points toward the light side
        const q = dist / cr; if (q < 1) sh += facing * -0.3 * Math.sin(q * Math.PI / 2) * (1 - q * q * 0.3) - 0.05 * (1 - q * q);   // bowl: soft shadow on the lit wall, light on the far wall
        else { const e = (q - 1) / 0.3; sh += facing * 0.2 * Math.exp(-e * e * 4); }                                   // raised rim
      }
      const light = Math.min(1.25, 0.12 + lam * 1.05);
      const val = Math.max(0, Math.min(1.2, (alb + sh) * light));
      const limb = Math.pow(1 - nz, 3);                     // the eclipsed rim burns brighter
      const ramp = [[0, 18, 0, 3], [0.3, 110, 8, 10], [0.6, 205, 40, 24], [0.85, 255, 120, 60], [1.2, 255, 205, 160]]; let k0 = 0; while (k0 < ramp.length - 2 && val > ramp[k0 + 1][0]) k0++; const A = ramp[k0], B = ramp[k0 + 1], m = Math.min(1, Math.max(0, (val - A[0]) / (B[0] - A[0])));
      d[o] = Math.min(255, A[1] + (B[1] - A[1]) * m + 140 * limb);
      d[o + 1] = Math.min(255, A[2] + (B[2] - A[2]) * m + 40 * limb);
      d[o + 2] = Math.min(255, A[3] + (B[3] - A[3]) * m + 20 * limb);
      d[o + 3] = 255 * Math.min(1, (1 - Math.sqrt(dd)) * px * 0.5);   // antialiased edge
    }
    cx.putImageData(img, 0, 0);
    moonTex = cv; moonKey = key; return cv;
  }
  function crimsonBack(t, fr) {
    const c = center(), R = crystalR(), lr = Math.min(R * 1.8, W * 0.43);
    const mr = Math.min(W * 0.3, R * 1.15), mx = c.x, my = c.y - lr - mr * 0.22;
    const hb = q => Math.exp(-Math.pow((q % 1.4) / 0.07, 2)) + 0.6 * Math.exp(-Math.pow(((q % 1.4) - 0.26) / 0.07, 2)), beat = hb(t);
    g.save();
    // corona: layered red haze, throbbing with the heartbeat
    const co = g.createRadialGradient(mx, my, mr * 0.95, mx, my, mr * 2.6);
    co.addColorStop(0, `rgba(255,40,30,${0.38 + 0.2 * beat})`); co.addColorStop(0.3, `rgba(200,10,20,${0.16 + 0.08 * beat})`); co.addColorStop(1, 'rgba(120,0,0,0)');
    g.fillStyle = co; g.beginPath(); g.arc(mx, my, mr * 2.6, 0, TAU); g.fill();
    // the moon itself
    const tex = moonTexture(Math.round(mr * 2 * DPR)), s = 1 + 0.008 * beat;
    g.save(); g.translate(mx, my); g.scale(s, s);
    g.drawImage(tex, -mr, -mr, mr * 2, mr * 2);
    // a thin burning ring on the limb
    g.globalCompositeOperation = 'lighter';
    const rim = g.createRadialGradient(0, 0, mr * 0.86, 0, 0, mr * 1.04);
    rim.addColorStop(0, 'rgba(255,60,30,0)'); rim.addColorStop(0.85, `rgba(255,90,50,${0.35 + 0.25 * beat})`); rim.addColorStop(1, 'rgba(255,60,30,0)');
    g.fillStyle = rim; g.beginPath(); g.arc(0, 0, mr * 1.04, 0, TAU); g.fill();
    g.restore();
    // blood mist drifting across the face: chains of soft dark-red blobs sliding sideways
    for (let b = 0; b < 2; b++) {
      const yb = my + (b - 1.5) * mr * 0.42 + Math.sin(t * 0.3 + b) * mr * 0.05, spd = 10 + b * 6, dir = b % 2 ? 1 : -1;
      for (let j = 0; j < 6; j++) {
        const span = mr * 4.2, xo = ((t * spd * dir + j * span / 6 + b * 97) % span + span) % span - span / 2;
        const rx = mr * (0.42 + 0.18 * fr(j * 0.37 + b * 0.61)), ry = rx * 0.32;
        const gm = g.createRadialGradient(mx + xo, yb, 0, mx + xo, yb, rx);
        gm.addColorStop(0, `rgba(${b ? 90 : 150},${b ? 6 : 14},${b ? 8 : 12},.32)`); gm.addColorStop(1, 'rgba(40,0,0,0)');
        g.save(); g.translate(mx + xo, yb); g.scale(1, ry / rx); g.translate(-(mx + xo), -yb);
        g.fillStyle = gm; g.beginPath(); g.arc(mx + xo, yb, rx, 0, TAU); g.fill(); g.restore();
      }
    }
    // bats crossing the moon every few seconds
    const cyc = t % 9;
    if (cyc < 4.5) {
      const p = cyc / 4.5, seed = Math.floor(t / 9);
      for (let i = 0; i < 6; i++) {
        const ox = (fr(seed * 0.71 + i * 0.37) - 0.5) * mr * 0.9, oy = (fr(seed * 0.43 + i * 0.59) - 0.5) * mr * 1.1;
        const x = mx - mr * 2.2 + p * mr * 4.4 + ox + Math.sin(t * 2 + i) * 6, y = my + oy + Math.sin(t * 3 + i * 2) * 8, sz = 5 + (i % 3) * 2.5;
        const flap = Math.sin(t * 16 + i * 1.3);
        g.save(); g.translate(x, y); g.scale(sz / 10, sz / 10 * (0.55 + 0.45 * Math.abs(flap)));
        g.fillStyle = '#0a0002';
        g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(6, -9 * Math.sign(flap || 1), 16, -4 * Math.sign(flap || 1)); g.lineTo(13, 0); g.lineTo(10, -1); g.lineTo(7, 2); g.lineTo(3, 1); g.lineTo(0, 4);
        g.lineTo(-3, 1); g.lineTo(-7, 2); g.lineTo(-10, -1); g.lineTo(-13, 0); g.lineTo(-16, -4 * Math.sign(flap || 1)); g.quadraticCurveTo(-6, -9 * Math.sign(flap || 1), 0, -2); g.fill();
        g.beginPath(); g.ellipse(0, 1, 2.2, 3.4, 0, 0, TAU); g.fill();
        g.restore();
      }
    }
    g.restore();
    // flames along the bottom
    g.save(); g.globalCompositeOperation = 'lighter';
    const n = Math.round(26 * Math.max(0.5, G.fxK())), fh = H * 0.16;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n * W + Math.sin(t * 1.3 + i) * 6, h = fh * (0.5 + 0.5 * Math.abs(Math.sin(t * (2 + (i % 5) * 0.4) + i * 1.7))), w = W / n * 1.4;
      const gr = g.createLinearGradient(x, H, x, H - h);
      gr.addColorStop(0, 'rgba(255,60,20,.4)'); gr.addColorStop(0.5, 'rgba(255,120,30,.16)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, H);
      g.quadraticCurveTo(x - w * 0.3, H - h * 0.5, x + Math.sin(t * 3 + i) * w * 0.3, H - h); g.quadraticCurveTo(x + w * 0.3, H - h * 0.5, x + w / 2, H); g.fill();
    }
    g.restore();
  }
  function crimsonFront(t, o, fr) {
    const { c, R, br } = o, rr = Math.min(R * 2.14, W * 0.47);
    g.save(); g.translate(c.x, c.y);
    // thorn ring
    g.save(); g.rotate(t * 0.05);
    g.strokeStyle = `rgba(255,90,70,${0.55 * br})`; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * TAU, L = i % 3 === 0 ? 18 : 9, wd = 0.035;
      g.fillStyle = i % 3 === 0 ? `rgba(255,70,60,${0.85 * br})` : `rgba(160,20,24,${0.8 * br})`;
      g.beginPath(); g.moveTo(Math.cos(a - wd) * rr, Math.sin(a - wd) * rr); g.lineTo(Math.cos(a) * (rr + L), Math.sin(a) * (rr + L)); g.lineTo(Math.cos(a + wd) * rr, Math.sin(a + wd) * rr); g.closePath(); g.fill();
    }
    g.restore();
    // red lightning: every 2.6s a forked bolt leaps off the ring
    const cyc = t % 2.6;
    if (cyc < 0.28) {
      const seed = Math.floor(t / 2.6), rnd = j => fr(Math.sin(seed * 12.9898 + j * 78.233) * 43758.5453);
      const a = rnd(0) * TAU, len = Math.min(W, H) * 0.32, fl = 1 - cyc / 0.28;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const [wdt, col] of [[6, `rgba(255,40,40,${0.35 * fl})`], [2, `rgba(255,220,210,${0.95 * fl})`]]) {
        g.strokeStyle = col; g.lineWidth = wdt; g.beginPath();
        let x = Math.cos(a) * rr, y = Math.sin(a) * rr; g.moveTo(x, y);
        for (let s = 1; s <= 7; s++) { const d = rr + len * s / 7, j = (rnd(s) - 0.5) * 0.35; x = Math.cos(a + j) * d; y = Math.sin(a + j) * d; g.lineTo(x, y); }
        g.stroke();
      }
      g.restore();
      g.fillStyle = `rgba(255,30,30,${0.12 * fl})`; g.fillRect(-c.x, -c.y, W, H);
    }
    g.restore();
  }
  function royal(t, P, fr) {
    // P.beat: a heartbeat instead of a slow breath (lub-dub, rest)
    const hb = q => Math.exp(-Math.pow((q % 1.4) / 0.07, 2)) + 0.6 * Math.exp(-Math.pow(((q % 1.4) - 0.26) / 0.07, 2));
    const c = center(), R = crystalR(), k = G.fxK(), br = P.beat ? 0.7 + 0.35 * hb(t) : 0.8 + 0.2 * Math.sin(t * 0.9);
    g.save();
    // the weave: a diagonal diamond lattice, a band of light sliding across it now and then
    const sp = 46, band = ((t * 0.08) % 1.6 - 0.3) * (W + H);
    g.lineWidth = 1;
    for (let d = -H; d < W + H; d += sp) {
      const lit = Math.max(0, 1 - Math.abs(d - band) / 260);
      g.strokeStyle = RGBA(P.weave, 0.035 + 0.11 * lit);
      g.beginPath(); g.moveTo(d, 0); g.lineTo(d + H, H); g.moveTo(d + H, 0); g.lineTo(d, H); g.stroke();
    }
    // art-deco sunburst: long and short rays stepping out from behind the crystal, between two deco rings
    g.translate(c.x, c.y);
    const glow = g.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 3.4);
    glow.addColorStop(0, RGBA(P.glow, 0.16 * br)); glow.addColorStop(1, RGBA(P.glow, 0));
    g.fillStyle = glow; g.beginPath(); g.arc(0, 0, R * 3.4, 0, TAU); g.fill();
    g.save(); g.rotate(t * 0.02);
    const rays = 64;
    for (let i = 0; i < rays; i++) {
      const a = i / rays * TAU, long = i % 4 === 0, mid = i % 2 === 0;
      const r0 = R * 1.62, r1 = Math.min(W * 0.62, R * (long ? 3 : mid ? 2.4 : 2));
      const gr = g.createLinearGradient(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1);
      gr.addColorStop(0, RGBA(P.ray0, (long ? 0.42 : 0.24) * br)); gr.addColorStop(1, RGBA(P.ray1, 0));
      g.strokeStyle = gr; g.lineWidth = long ? 1.6 : 0.8;
      g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke();
    }
    g.restore();
    g.strokeStyle = RGBA(P.ring, 0.55 * br); g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, 0, R * 1.52, 0, TAU); g.stroke();
    g.strokeStyle = RGBA(P.ring, 0.3 * br); g.lineWidth = 0.7;
    g.beginPath(); g.arc(0, 0, R * 1.6, 0, TAU); g.stroke();
    g.save(); g.rotate(-t * 0.04);       // little studs riding the ring, every fourth a gem
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.fillStyle = i % 4 ? RGBA(P.stud, 0.6 * br) : RGBA(P.gem, 0.85 * br); g.beginPath(); g.arc(Math.cos(a) * R * 1.56, Math.sin(a) * R * 1.56, i % 4 ? 1.6 : 2.6, 0, TAU); g.fill(); }
    g.restore();
    // laurel wreath: two branches climbing up the sides, leaves alternating out and in
    const lr = Math.min(R * 1.8, W * 0.43), leaf = Math.min(R * 0.14, lr * 0.08);
    const lg = g.createLinearGradient(0, -lr, 0, lr);
    lg.addColorStop(0, RGBA(P.leaf0, 0.75 * br)); lg.addColorStop(1, RGBA(P.leaf1, 0.75 * br));
    g.fillStyle = lg; g.strokeStyle = RGBA(P.leafLine, 0.6 * br); g.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      const a0 = Math.PI / 2 + side * 0.32, a1 = Math.PI / 2 + side * 2.55;
      g.beginPath(); g.arc(0, 0, lr, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
      const n = 13;
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1), a = a0 + (a1 - a0) * f, x = Math.cos(a) * lr, y = Math.sin(a) * lr;
        const tang = a + side * Math.PI / 2, out = i % 2 ? 1 : -1, sz = leaf * (1.05 - f * 0.4);
        g.save(); g.translate(x, y); g.rotate(tang + out * 0.6 * side);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sz * 0.55, -sz * 0.32, sz * 1.25, 0); g.quadraticCurveTo(sz * 0.55, sz * 0.32, 0, 0); g.fill();
        g.restore();
      }
    }
    // ribbon knot where the branches meet
    g.fillStyle = RGBA(P.ribbon, 0.8 * br);
    g.beginPath(); g.moveTo(0, lr - 6); g.lineTo(-14, lr + 10); g.lineTo(-6, lr + 4); g.lineTo(0, lr + 14); g.lineTo(6, lr + 4); g.lineTo(14, lr + 10); g.closePath(); g.fill();
    // the crown above the wreath: spikes from P.tips ([x -1..1, height 0..1]), pearls on the tips, a gem in the middle
    const cw = lr * 0.15, ch = lr * 0.13, cy = -lr - ch * 0.2;
    g.save(); g.translate(0, cy);
    const cg = g.createLinearGradient(0, -ch, 0, ch * 0.3);
    cg.addColorStop(0, RGBA(P.crown[0], 0.9 * br)); cg.addColorStop(0.5, RGBA(P.crown[1], 0.9 * br)); cg.addColorStop(1, RGBA(P.crown[2], 0.9 * br));
    g.fillStyle = cg;
    g.beginPath(); g.moveTo(-cw, ch * 0.25);
    P.tips.forEach(([x, h], j) => {
      if (j) { const px = P.tips[j - 1][0]; g.lineTo((px + x) / 2 * cw, -ch * 0.2); }
      g.lineTo(x * cw, -ch * h);
    });
    g.lineTo(cw, ch * 0.25); g.closePath(); g.fill();
    g.fillStyle = RGBA(P.band, 0.7 * br); g.fillRect(-cw, ch * 0.02, cw * 2, ch * 0.08);
    P.tips.forEach(([x, h]) => { const mid = x === 0; g.fillStyle = mid ? RGBA(P.crownGem, br) : RGBA(P.pearl, br); g.beginPath(); g.arc(x * cw, -ch * h, mid ? 3.6 : 2.8, 0, TAU); g.fill(); });
    for (const [x, r, gem] of [[0, 3.2, 1], [-0.55, 2, 0], [0.55, 2, 0]]) { g.fillStyle = gem ? RGBA(P.crownGem, br) : RGBA(P.pearl, br); g.beginPath(); g.arc(x * cw, ch * 0.12, r, 0, TAU); g.fill(); }
    g.restore();
    g.restore();
    // dust drifting down, a few catching the light as four-point glints
    const n = Math.round(50 * k);
    for (let i = 0; i < n; i++) {
      const x = fr(i * 0.618) * W + Math.sin(t * 0.5 + i) * 10, y0 = fr(t * (5 + (i % 6) * 2.5) * (P.rise ? 4 : 1) / H + i * 0.231) * H, y = P.rise ? H - y0 : y0;
      const tw = Math.pow(Math.max(0, Math.sin(t * (1.3 + (i % 4) * 0.35) + i * 2.3)), 6);
      g.fillStyle = RGBA(P.dust(i), 0.15 + 0.55 * tw);
      const s = 1.2 + tw * 1.6; g.fillRect(x - s / 2, y - s / 2, s, s);
      if (tw > 0.6) { g.fillStyle = RGBA(P.glint, tw * 0.7); const L = 4 + tw * 6; g.fillRect(x - L, y - 0.5, L * 2, 1); g.fillRect(x - 0.5, y - L, 1, L * 2); }
    }
    return { c, R, lr, cw, ch, cy, br };
  }
  /* THE EMPYREAN's extras around the royal backdrop: aurora curtains behind everything, then a turning
     outer ring of runes, a halo burning behind the crown, and a shooting star every few seconds */
  function empyreanBack(t, fr) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const cols = [[60, 140, 255], [40, 220, 255], [130, 100, 255]];
    for (let b = 0; b < 3; b++) {
      const [r, gg, bb] = cols[b], base = H * (0.14 + b * 0.09), amp = H * 0.05, thick = H * (0.07 + b * 0.02);
      const gr = g.createLinearGradient(0, base - amp - thick, 0, base + amp + thick);
      gr.addColorStop(0, `rgba(${r},${gg},${bb},0)`); gr.addColorStop(0.5, `rgba(${r},${gg},${bb},${0.07 + 0.04 * Math.sin(t * 0.6 + b * 2)})`); gr.addColorStop(1, `rgba(${r},${gg},${bb},0)`);
      g.fillStyle = gr; g.beginPath();
      const yAt = (x, s) => base + Math.sin(x / W * (3 + b) + t * (0.25 + b * 0.08) + b) * amp + Math.sin(x / W * 7 - t * 0.4) * amp * 0.3 + s * thick * (0.6 + 0.4 * Math.sin(x / W * 5 + t * 0.3 + b));
      g.moveTo(0, yAt(0, -1));
      for (let x = 0; x <= W; x += 24) g.lineTo(x, yAt(x, -1));
      for (let x = W; x >= 0; x -= 24) g.lineTo(x, yAt(x, 1));
      g.closePath(); g.fill();
    }
    g.restore();
  }
  function empyreanFront(t, o) {
    const { c, R, lr, cw, ch, cy, br } = o;
    g.save(); g.translate(c.x, c.y);
    // outer rune ring, turning against the sunburst
    const rr = Math.min(R * 2.12, W * 0.47);
    g.save(); g.rotate(-t * 0.03);
    g.strokeStyle = `rgba(160,205,255,${0.3 * br})`; g.lineWidth = 1;
    g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * TAU, len = i % 9 === 0 ? 10 : i % 3 === 0 ? 5 : 2.5;
      g.beginPath(); g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a) * (rr + len), Math.sin(a) * (rr + len)); g.stroke();
      if (i % 9 === 0) { g.fillStyle = `rgba(60,180,255,${0.9 * br})`; g.beginPath(); g.moveTo(Math.cos(a) * (rr + 14), Math.sin(a) * (rr + 14)); g.lineTo(Math.cos(a + 0.02) * (rr + 18), Math.sin(a + 0.02) * (rr + 18)); g.lineTo(Math.cos(a) * (rr + 22), Math.sin(a) * (rr + 22)); g.lineTo(Math.cos(a - 0.02) * (rr + 18), Math.sin(a - 0.02) * (rr + 18)); g.closePath(); g.fill(); }
    }
    g.restore();
    // halo behind the crown: a slow eight-point star of light
    g.save(); g.translate(0, cy - ch * 0.4); g.rotate(t * 0.15); g.globalCompositeOperation = 'lighter';
    const hr = cw * 2.6;
    const hg = g.createRadialGradient(0, 0, 0, 0, 0, hr);
    hg.addColorStop(0, `rgba(150,210,255,${0.35 * br})`); hg.addColorStop(1, 'rgba(60,140,255,0)');
    g.fillStyle = hg;
    g.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? hr * 0.28 : (i % 4 ? hr * 0.7 : hr); i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fill();
    g.restore();
    g.restore();
    // a shooting star crossing the top every 7 seconds
    const cyc = t % 7;
    if (cyc < 1.1) {
      const p = cyc / 1.1, seed = Math.floor(t / 7), sx = W * (0.15 + 0.6 * ((seed * 0.618) % 1)), sy = H * (0.06 + 0.12 * ((seed * 0.382) % 1));
      const x = sx + p * W * 0.35, y = sy + p * H * 0.12, a = Math.sin(p * Math.PI);
      const gr = g.createLinearGradient(x, y, x - W * 0.12, y - H * 0.04);
      gr.addColorStop(0, `rgba(235,248,255,${a})`); gr.addColorStop(1, 'rgba(80,160,255,0)');
      g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - W * 0.12, y - H * 0.04); g.stroke();
      g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill();
    }
  }
  /* THE INFINITE: deep space with three drifting layers of stars and slow nebulae; the crystal sits as the
     singularity of a black hole - a tilted accretion disk, its far side lensed up over the top, a photon
     ring - inside a turning astrolabe (roman hours, a geared ring, a sweeping hand), with a prismatic
     infinity sign in place of a crown and an anamorphic flare crossing now and then */
  const PRISM = ['#ff5a7a', '#ffb85a', '#fff36a', '#6aff9a', '#5ad8ff', '#8a7aff', '#ff5ad8'];
  function infiniteBack(t, fr) {
    const k = G.fxK();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [hx, hy, col, sz, sp] of [[0.2, 0.25, '140,60,255', 0.55, 0.013], [0.8, 0.6, '40,200,255', 0.5, -0.011], [0.45, 0.85, '255,60,200', 0.45, 0.009]]) {
      const x = (hx + Math.sin(t * sp * 3) * 0.06) * W, y = (hy + Math.cos(t * sp * 2) * 0.04) * H, r = Math.max(W, H) * sz;
      const ng = g.createRadialGradient(x, y, 0, x, y, r);
      ng.addColorStop(0, `rgba(${col},.11)`); ng.addColorStop(0.5, `rgba(${col},.04)`); ng.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = ng; g.fillRect(0, 0, W, H);
    }
    for (let layer = 0; layer < 3; layer++) {
      const n = Math.round((60 - layer * 15) * Math.max(0.4, k)), spd = 3 + layer * 6, sz = 0.7 + layer * 0.55;
      for (let i = 0; i < n; i++) {
        const x = fr(i * 0.618 + layer * 0.31 + t * spd * 0.0015) * W, y = fr(i * 0.382 + layer * 0.17 + t * spd * 0.0008) * H;
        const tw = 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * (1 + (i % 5) * 0.5) + i * 3.1), 3);
        g.fillStyle = i % 9 === 0 ? `rgba(170,210,255,${tw})` : i % 13 === 0 ? `rgba(255,200,230,${tw})` : `rgba(255,255,255,${tw * (0.5 + layer * 0.2)})`;
        g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        if (layer === 2 && i % 7 === 0 && tw > 0.85) { g.fillStyle = `rgba(255,255,255,${(tw - 0.85) * 4})`; g.fillRect(x - 5, y - 0.4, 10, 0.8); g.fillRect(x - 0.4, y - 5, 0.8, 10); }
      }
    }
    g.restore();
  }
  function infiniteFront(t, fr) {
    const c = center(), R = crystalR(), br = 0.85 + 0.15 * Math.sin(t * 0.8);
    g.save(); g.translate(c.x, c.y);
    // ---- black hole ----
    const tilt = -0.1, A = Math.min(R * 2.35, W * 0.48), B = A * 0.2, hr = R * 1.12;
    const disk = (from, to) => {
      g.save(); g.rotate(tilt); g.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 16; j++) {
        const s = j / 15, a = hr * 1.05 + (A - hr * 1.05) * s, b = a * (B / A), sp = 1.4 / (0.4 + s);
        const dop = g.createLinearGradient(-a, 0, a, 0);     // the side turning toward us burns brighter
        const hot = s < 0.25 ? '255,250,235' : s < 0.6 ? '255,190,110' : '200,120,255';
        dop.addColorStop(0, `rgba(${hot},${(0.95 - s * 0.55) * br})`); dop.addColorStop(0.5, `rgba(${hot},${(0.5 - s * 0.3) * br})`); dop.addColorStop(1, `rgba(${hot},${(0.25 - s * 0.15) * br})`);
        g.strokeStyle = dop; g.lineWidth = 2 + (1 - s) * 3.2;
        g.setLineDash([a * 0.35, a * 0.12, a * 0.08, a * 0.2]); g.lineDashOffset = -t * sp * 40 - j * 13;
        g.beginPath(); g.ellipse(0, 0, a, b, 0, from, to); g.stroke();
      }
      g.setLineDash([]); g.restore();
    };
    disk(Math.PI, TAU);                                       // far half, behind the hole
    // lensed light: the disk's far side bent up and over the hole, and a fainter ring beneath
    g.save(); g.globalCompositeOperation = 'lighter';
    g.shadowColor = 'rgba(255,170,90,.9)'; g.shadowBlur = 16;
    for (const [ry, a0, a1, al] of [[1.42, Math.PI, TAU, 0.95], [1.22, 0, Math.PI, 0.45]]) {
      for (let j = 0; j < 6; j++) {
        const rx = hr * (1.12 + j * 0.05), rrY = hr * (ry - 0.18 + j * 0.05) * (a0 === 0 ? 0.92 : 1);
        g.strokeStyle = `rgba(255,${235 - j * 18},${200 - j * 22},${al * (1 - j / 7) * br})`; g.lineWidth = 3.4 - j * 0.4;
        g.beginPath(); g.ellipse(0, 0, rx, rrY, tilt, a0, a1); g.stroke();
      }
    }
    g.restore();
    // event horizon + photon ring
    const eh = g.createRadialGradient(0, 0, hr * 0.6, 0, 0, hr * 1.02);
    eh.addColorStop(0, 'rgba(0,0,0,1)'); eh.addColorStop(0.9, 'rgba(0,0,0,.95)'); eh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eh; g.beginPath(); g.arc(0, 0, hr * 1.02, 0, TAU); g.fill();
    g.save(); g.shadowColor = '#fff'; g.shadowBlur = 14 * br; g.strokeStyle = `rgba(255,248,235,${0.9 * br})`; g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, 0, hr * 1.03, 0, TAU); g.stroke(); g.restore();
    disk(0, Math.PI);                                         // near half, in front of the hole
    // ---- astrolabe ----
    const rr = Math.min(R * 2.2, W * 0.46);
    g.save(); g.rotate(t * 0.012);
    g.strokeStyle = 'rgba(235,235,255,.55)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(235,235,255,.25)'; g.lineWidth = 0.7; g.beginPath(); g.arc(0, 0, rr - 16, 0, TAU); g.stroke();
    g.beginPath();
    for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, l = i % 10 === 0 ? 9 : i % 5 === 0 ? 6 : 3; g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a) * (rr - l), Math.sin(a) * (rr - l)); }
    g.strokeStyle = 'rgba(235,235,255,.45)'; g.lineWidth = 0.8; g.stroke();
    const ROM = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    g.font = `700 ${Math.max(9, rr * 0.05)}px Cinzel, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    ROM.forEach((s, i) => {
      const a = i / 12 * TAU - Math.PI / 2;
      g.save(); g.translate(Math.cos(a) * (rr + 13), Math.sin(a) * (rr + 13)); g.rotate(a + Math.PI / 2);
      g.fillStyle = PRISM[i % PRISM.length]; g.globalAlpha = 0.85; g.fillText(s, 0, 0); g.restore();
    });
    g.restore();
    // geared ring turning the other way
    const gr = R * 1.62;
    g.save(); g.rotate(-t * 0.05);
    g.strokeStyle = 'rgba(200,200,240,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, gr, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(200,200,240,.3)';
    for (let i = 0; i < 48; i++) { g.save(); g.rotate(i / 48 * TAU); g.fillRect(gr, -2.2, 5, 4.4); g.restore(); }
    g.restore();
    // the sweeping hand, a prismatic comet riding its tip
    const ha = t * 0.35 - Math.PI / 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.cos(ha) * hr * 1.1, Math.sin(ha) * hr * 1.1); g.lineTo(Math.cos(ha) * (rr - 18), Math.sin(ha) * (rr - 18)); g.stroke();
    for (let j = 0; j < 14; j++) { const a = ha - j * 0.035; g.fillStyle = PRISM[j % PRISM.length]; g.globalAlpha = (1 - j / 14) * 0.9; g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 3 - j * 0.15, 0, TAU); g.fill(); }
    g.restore();
    // ---- the infinity sign above ----
    const iy = -rr - 30 - rr * 0.06, ia = rr * 0.17;          // above the XII
    const lem = th => { const s = Math.sin(th), d = 1 + s * s; return [ia * Math.cos(th) / d, ia * s * Math.cos(th) / d * 1.2]; };
    g.save(); g.translate(0, iy);
    const lg = g.createLinearGradient(-ia, 0, ia, 0); PRISM.forEach((p, i) => lg.addColorStop(i / (PRISM.length - 1), p));
    g.shadowColor = 'rgba(255,255,255,.8)'; g.shadowBlur = 12;
    g.strokeStyle = '#05050a'; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 80; i++) { const [x, y] = lem(i / 80 * TAU); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.shadowBlur = 0; g.strokeStyle = lg; g.lineWidth = 3; g.stroke();
    g.globalCompositeOperation = 'lighter';
    for (let p = 0; p < 3; p++) for (let j = 0; j < 10; j++) {
      const [x, y] = lem(t * 1.6 + p * TAU / 3 - j * 0.06);
      g.fillStyle = `rgba(255,255,255,${(1 - j / 10) * 0.9})`; g.beginPath(); g.arc(x, y, 2.4 - j * 0.18, 0, TAU); g.fill();
    }
    g.restore();
    g.restore();
    // ---- anamorphic prism flare across the screen every 6s ----
    const cyc = t % 6;
    if (cyc < 0.9) {
      const p = cyc / 0.9, a = Math.sin(p * Math.PI), y = c.y + (p - 0.5) * 6;
      g.save(); g.globalCompositeOperation = 'lighter';
      const fl = g.createLinearGradient(0, 0, W, 0);
      PRISM.forEach((col, i) => fl.addColorStop(i / (PRISM.length - 1), col));
      g.globalAlpha = 0.35 * a; g.fillStyle = fl; g.fillRect(0, y - 1.5, W, 3);
      g.globalAlpha = 0.6 * a; g.fillStyle = '#fff'; g.fillRect(W * 0.2, y - 0.5, W * 0.6, 1);
      g.restore();
    }
  }
  /* ---------------- THE UNSEEN (secret discovery theme) ----------------
     near-black, the eyes.webp photograph breathing faintly out of the dark at the edges of a light pool
     around the crystal; the crystal sits as the pupil of one giant eye that blinks every so often;
     smaller eyes open in the darkness, look at the crystal (or at your last tap), blink and close;
     film grain, and once in a while the photo flashes up for a heartbeat */
  let lookAt = null, eyesImg = null;
  // the 27 eyes of eyes.webp (310x310), found by their whites: [x, y, w, h]
  const EYES = [[15, 20, 87, 60], [172, 45, 64, 45], [115, 57, 44, 31], [18, 87, 35, 28], [67, 90, 66, 43], [144, 91, 38, 27], [198, 93, 51, 37], [24, 124, 50, 34], [151, 125, 67, 47],
    [226, 131, 34, 22], [86, 141, 49, 33], [237, 160, 40, 30], [13, 165, 50, 37], [128, 172, 33, 23], [166, 180, 85, 61], [78, 181, 37, 27], [46, 200, 32, 22], [122, 203, 31, 24],
    [86, 215, 22, 16], [137, 231, 27, 19], [54, 236, 88, 61], [236, 240, 38, 28], [203, 246, 26, 18], [158, 248, 41, 28], [252, 268, 44, 31], [196, 272, 49, 34], [149, 280, 31, 21]];
  /* one eye cut out of the photograph: an almond clip that opens like a lid (open 0..1), the photo
     sliding inside it toward where the eye is looking, the edges sinking into black */
  function photoEye(e, x, y, w, open, tx, ty, alpha = 1) {
    if (open < 0.03 || !eyesImg || !eyesImg.naturalWidth) return;
    const [sx, sy, sw, sh] = e, h = w * sh / sw, cw = w * 0.47, ch = h * 0.5 * open;
    const d = Math.hypot(tx - x, ty - y) || 1, gx = (tx - x) / d * w * 0.06, gy = (ty - y) / d * h * 0.06;
    g.save(); g.translate(x, y); g.globalAlpha = alpha;
    g.beginPath(); g.moveTo(-cw, 0); g.quadraticCurveTo(0, -ch * 2, cw, 0); g.quadraticCurveTo(0, ch * 2, -cw, 0); g.closePath();
    g.save(); g.clip();
    g.drawImage(eyesImg, sx - 2, sy - 2, sw + 4, sh + 4, -w / 2 + gx, -h / 2 + gy, w, h);
    const sh2 = g.createRadialGradient(0, 0, Math.min(cw, h * 0.5) * 0.55, 0, 0, cw);
    sh2.addColorStop(0, 'rgba(0,0,0,0)'); sh2.addColorStop(1, 'rgba(0,0,0,.85)');
    g.fillStyle = sh2; g.fillRect(-cw, -h, cw * 2, h * 2);
    g.restore();
    g.strokeStyle = '#000'; g.lineWidth = Math.max(2, w * 0.035); g.stroke();
    g.restore();
  }
  function unseen(t, fr) {
    const c = center(), R = crystalR(), k = G.fxK();
    if (!eyesImg) { eyesImg = new Image(); eyesImg.src = 'eyes.webp'; }
    const ready = eyesImg.complete && eyesImg.naturalWidth;
    // the whole photograph in the dark: tiled, breathing, held back by a pool of black around the crystal
    if (ready) {
      const tw = Math.max(W, H) * 0.55, a = 0.2 + 0.1 * Math.sin(t * 0.7) + (t % 11 < 0.12 ? 0.55 : 0);   // the rare flash-up
      g.save(); g.globalAlpha = Math.min(0.8, a);
      const ox = (t * 4) % tw, oy = (t * 2) % tw;
      for (let y = -tw + oy; y < H; y += tw) for (let x = -tw + ox; x < W; x += tw) g.drawImage(eyesImg, x, y, tw, tw);
      g.restore();
    }
    const pool = g.createRadialGradient(c.x, c.y, R * 1.2, c.x, c.y, Math.max(W, H) * 0.62);
    pool.addColorStop(0, 'rgba(0,0,0,.97)'); pool.addColorStop(0.5, 'rgba(0,0,0,.6)'); pool.addColorStop(1, 'rgba(0,0,0,.05)');
    g.fillStyle = pool; g.fillRect(0, 0, W, H);
    // where the eyes look: your last tap for a moment, otherwise the crystal
    const now = performance.now(), tap = lookAt && now - lookAt.at < 1800;
    const tx = tap ? lookAt.x : c.x + Math.sin(t * 0.4) * 20, ty = tap ? lookAt.y : c.y + Math.cos(t * 0.3) * 14;
    // a blink every 7s that dims the whole screen for a moment
    const cyc = t % 7, bl = cyc < 0.35 ? Math.abs(Math.cos(cyc / 0.35 * Math.PI)) : 1;
    // the screen as a grid: each cell holds at most one eye, so none of them ever overlap. Three big
    // eyes keep their own blocks of cells (top left, right, bottom left); cells over the crystal stay dark.
    const cols = W > 700 ? 6 : 4, rows = Math.max(5, Math.round(H / (W / cols))), cw = W / cols, chh = H / rows;
    const used = new Set();
    const cellOf = (x, y) => Math.min(rows - 1, Math.max(0, Math.floor(y / chh))) * cols + Math.min(cols - 1, Math.max(0, Math.floor(x / cw)));
    const claim = (x, y, w, h) => { for (let yy = y - h / 2; yy <= y + h / 2; yy += chh * 0.5) for (let xx = x - w / 2; xx <= x + w / 2; xx += cw * 0.5) used.add(cellOf(xx, yy)); };
    // keep the crystal clear
    claim(c.x, c.y, R * 2.4, R * 2.4);
    if (ready) {
      const BIG = [[0, 0.24, 0.3, 0], [20, 0.8, 0.52, 2.3], [14, 0.24, 0.8, 4.6]];
      for (const [ei, fx, fy, off] of BIG) {
        const e = EYES[ei], w = Math.min(W * 0.42, 230), h = w * e[3] / e[2];
        const x = W * fx + Math.sin(t * 0.21 + off) * 8, y = H * fy + Math.cos(t * 0.17 + off) * 6;
        const bc = (t + off) % 9, open = bc < 0.4 ? Math.abs(Math.cos(bc / 0.4 * Math.PI)) : 1;
        photoEye(e, x, y, w, open * Math.min(1, t / 1.5), tx, ty, 0.9);
        claim(x, y, w * 1.1, h * 1.3);
      }
    }
    // the small eyes, one per free cell, each on its own clock (open, stare, blink, close, rest)
    const free = [];
    for (let i = 0; i < cols * rows; i++) if (!used.has(i)) free.push(i);
    const n = Math.min(free.length, Math.round(free.length * Math.max(0.5, k)));
    for (let j = 0; j < n; j++) {
      const cell = free[j], cx0 = (cell % cols + 0.5) * cw, cy0 = (Math.floor(cell / cols) + 0.5) * chh;
      const per = 8 + (j % 5) * 2.3, ph = fr(t / per + j * 0.618), round = Math.floor(t / per + j * 0.618);
      const life = ph < 0.1 ? ph / 0.1 : ph < 0.55 ? 1 : ph < 0.63 ? 1 - (ph - 0.55) / 0.08 : 0;
      if (life <= 0) continue;
      const blink = Math.abs(fr(t * 0.21 + j * 0.37) - 0.5) < 0.014 ? 0.08 : 1;
      const e = EYES[(j * 7 + round * 5) % EYES.length], w = cw * (0.5 + 0.3 * fr(j * 0.29 + round * 0.61));
      const x = cx0 + (fr(j * 0.13 + round * 0.71) - 0.5) * (cw - w) * 0.8, y = cy0 + (fr(j * 0.47 + round * 0.23) - 0.5) * (chh - w * e[3] / e[2]) * 0.6;
      photoEye(e, x, y, w, life * blink, tx, ty, Math.min(1, life * 1.4));
    }
    // the blink closes over the whole screen
    if (bl < 0.6) { g.fillStyle = `rgba(0,0,0,${(0.6 - bl) * 1.4})`; g.fillRect(0, 0, W, H); }
    // film grain
    g.save(); g.globalAlpha = 0.08;
    for (let i = 0, m = Math.round(160 * k); i < m; i++) { g.fillStyle = i % 2 ? '#fff' : '#000'; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
    g.restore();
  }

  /* ---------------- THE ORIGIN (1경) ----------------
     creation: a flower of life drawn faintly over everything, nested sacred solids turning in real 3D
     (an icosahedron, and two tetrahedra counter-spinning as a star - the merkaba), golden spirals of
     light pouring INTO the crystal, a big bang every 8s, and the seed of life above */
  const ICO = (() => {
    const p = (1 + Math.sqrt(5)) / 2, v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]];
    const e = [];
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) { const d = Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]); if (Math.abs(d - 2) < 0.01) e.push([i, j]); }
    const n = Math.hypot(1, p); return { v: v.map(q => q.map(x => x / n)), e };
  })();
  const TET = { v: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(q => q.map(x => x / Math.sqrt(3))), e: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] };
  function solid(S, r, ax, ay, az, col, lw) {
    const ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay), cc = Math.cos(az), sc = Math.sin(az);
    const P = S.v.map(([x, y, z]) => {
      let y1 = y * ca - z * sa, z1 = y * sa + z * ca;
      let x2 = x * cb + z1 * sb, z2 = -x * sb + z1 * cb;
      let x3 = x2 * cc - y1 * sc, y3 = x2 * sc + y1 * cc;
      const f = 3.2 / (3.2 + z2); return [x3 * r * f, y3 * r * f, z2];
    });
    for (const [i, j] of S.e) {
      const depth = (P[i][2] + P[j][2]) / 2, a = 0.25 + 0.6 * (0.5 - depth * 0.5);
      g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = lw * (0.6 + 0.6 * (0.5 - depth * 0.5));
      g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke();
    }
    for (const [x, y, z] of P) { const a = 0.4 + 0.6 * (0.5 - z * 0.5); g.fillStyle = `rgba(255,250,230,${a})`; g.beginPath(); g.arc(x, y, 1.6 + a * 1.6, 0, TAU); g.fill(); }
  }
  function origin(t, fr) {
    const c = center(), R = crystalR(), k = G.fxK();
    g.save();
    // flower of life, faint and slowly turning
    const fr0 = Math.min(W, H) * 0.09;
    g.save(); g.translate(c.x, c.y); g.rotate(t * 0.01);
    g.strokeStyle = 'rgba(255,230,170,.07)'; g.lineWidth = 1;
    for (let q = -6; q <= 6; q++) for (let rr = -8; rr <= 8; rr++) {
      const x = (q + rr * 0.5) * fr0, y = rr * fr0 * Math.sqrt(3) / 2;
      if (Math.hypot(x, y) > Math.max(W, H) * 0.75) continue;
      g.beginPath(); g.arc(x, y, fr0, 0, TAU); g.stroke();
    }
    g.restore();
    g.translate(c.x, c.y);
    // halo of rays
    g.save(); g.rotate(-t * 0.03); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU, L = R * (i % 2 ? 2.4 : 3.2), gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
      gr.addColorStop(0.35, 'rgba(255,240,200,.14)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      g.strokeStyle = gr; g.lineWidth = i % 2 ? 1 : 2; g.beginPath(); g.moveTo(Math.cos(a) * R * 1.1, Math.sin(a) * R * 1.1); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke();
    }
    g.restore();
    // golden spirals of light pouring inward
    g.save(); g.globalCompositeOperation = 'lighter';
    const arms = 3, per = Math.round(26 * Math.max(0.5, k)), maxR = Math.max(W, H) * 0.6;
    for (let arm = 0; arm < arms; arm++) for (let i = 0; i < per; i++) {
      const f = fr(i / per - t * 0.06), r = R * 1.05 + Math.pow(f, 1.6) * maxR, a = arm / arms * TAU + Math.log(r / R) * 2.1 + t * 0.15;
      const al = Math.min(1, (1 - f) * 2) * 0.8;
      g.fillStyle = `rgba(255,${230 + (i % 2) * 20},${170 + (i % 3) * 30},${al})`;
      g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 1 + (1 - f) * 2.2, 0, TAU); g.fill();
    }
    g.restore();
    // the solids
    const sr = Math.min(R * 2.05, W * 0.44);
    g.save(); g.globalCompositeOperation = 'lighter';
    solid(ICO, sr, t * 0.21, t * 0.17, 0.3, '255,235,180', 1.3);
    solid(TET, sr * 0.82, t * 0.33, t * 0.27, 0, '150,220,255', 1.1);
    solid(TET, sr * 0.82, -t * 0.33 + Math.PI / 2, -t * 0.27, Math.PI / 2, '255,200,230', 1.1);
    g.restore();
    // big bang every 8 seconds
    const bb = t % 8;
    if (bb < 1.4) {
      const p = bb / 1.4, a = 1 - p;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = `rgba(255,250,235,${a * 0.9})`; g.lineWidth = 3 * a + 0.5; g.beginPath(); g.arc(0, 0, R * (1.1 + p * 3.5), 0, TAU); g.stroke();
      g.strokeStyle = `rgba(160,220,255,${a * 0.5})`; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, R * (1.1 + p * 2.6), 0, TAU); g.stroke();
      if (p < 0.15) { g.fillStyle = `rgba(255,252,240,${(0.15 - p) * 3})`; g.fillRect(-c.x, -c.y, W, H); }
      g.restore();
    }
    // the seed of life above
    const sy = -sr - 26 - sr * 0.08, s0 = sr * 0.08;
    g.save(); g.translate(0, sy); g.rotate(t * 0.2); g.shadowColor = 'rgba(255,240,200,.9)'; g.shadowBlur = 10;
    g.strokeStyle = 'rgba(255,240,200,.9)'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(0, 0, s0, 0, TAU); g.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.arc(Math.cos(a) * s0, Math.sin(a) * s0, s0, 0, TAU); g.stroke(); }
    g.beginPath(); g.arc(0, 0, s0 * 2, 0, TAU); g.stroke();
    g.restore();
    g.restore();
  }
  /* the drifting effect behind the crystal, one per theme (js/data/themes.js). Positions are pure
     functions of time + index, so there's no particle state to keep. */
  function ambient(kind, t, h) {
    const fr = (v) => v - Math.floor(v);
    if (kind === 'sovereign') {
      royal(t, ROYAL.sovereign, fr);
    } else if (kind === 'empyrean') {
      empyreanBack(t, fr);
      empyreanFront(t, royal(t, ROYAL.empyrean, fr));
    } else if (kind === 'verdant') {
      verdantFront(t, royal(t, ROYAL.verdant, fr), fr);
    } else if (kind === 'unseen') {
      unseen(t, fr);
    } else if (kind === 'origin') {
      origin(t, fr);
    } else if (kind === 'infinite') {
      infiniteBack(t, fr); infiniteFront(t, fr);
    } else if (kind === 'crimson') {
      crimsonBack(t, fr);
      crimsonFront(t, royal(t, ROYAL.crimson, fr), fr);
    } else if (kind === 'divine') {
      // THE DIVINE: a sun above the mine pouring light down, a burning halo turning behind the crystal, embers of light rising
      const c = center(), R = crystalR(), k = G.fxK(), sx = W / 2, sy = -H * 0.08;
      g.save(); g.globalCompositeOperation = 'lighter';
      const sun = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.8);
      sun.addColorStop(0, 'rgba(255,170,60,.34)'); sun.addColorStop(0.35, 'rgba(255,110,20,.12)'); sun.addColorStop(1, 'rgba(255,80,0,0)');
      g.fillStyle = sun; g.fillRect(0, 0, W, H);
      // god rays: long wedges fanning down from the sun, each swaying and breathing on its own
      const rays = Math.round(11 * Math.max(0.5, k)), L = Math.hypot(W, H) * 1.1;
      for (let i = 0; i < rays; i++) {
        const a = Math.PI / 2 + (i / (rays - 1) - 0.5) * 1.25 + Math.sin(t * 0.17 + i * 1.9) * 0.05;
        const wdt = 0.025 + 0.02 * fr(i * 0.618), al = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 2.3));
        const gr = g.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L);
        gr.addColorStop(0, `rgba(255,190,90,${al * 2})`); gr.addColorStop(0.55, `rgba(255,120,30,${al})`); gr.addColorStop(1, 'rgba(255,90,0,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy);
        g.lineTo(sx + Math.cos(a - wdt) * L, sy + Math.sin(a - wdt) * L); g.lineTo(sx + Math.cos(a + wdt) * L, sy + Math.sin(a + wdt) * L);
        g.closePath(); g.fill();
      }
      // the halo: a ticked outer ring, a counter-turning inner ring with diamond nodes, a faint hexagram between
      const br = 0.75 + 0.25 * Math.sin(t * 1.1);
      g.translate(c.x, c.y);
      const halo = g.createRadialGradient(0, 0, R * 1.4, 0, 0, R * 2.7);
      halo.addColorStop(0, 'rgba(255,120,20,0)'); halo.addColorStop(0.55, `rgba(255,130,30,${0.1 * br})`); halo.addColorStop(1, 'rgba(255,120,20,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(0, 0, R * 2.7, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,150,50,${0.35 * br})`; g.lineWidth = 1.2;
      g.save(); g.rotate(t * 0.05);
      g.beginPath(); g.arc(0, 0, R * 2.3, 0, TAU); g.stroke();
      for (let i = 0; i < 60; i++) {
        const a = i / 60 * TAU, long = i % 5 === 0, r0 = R * 2.3, r1 = r0 + (long ? R * 0.14 : R * 0.06);
        g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke();
      }
      g.restore();
      g.save(); g.rotate(-t * 0.09);
      g.strokeStyle = `rgba(255,190,90,${0.28 * br})`; g.setLineDash([R * 0.3, R * 0.1]);
      g.beginPath(); g.arc(0, 0, R * 1.85, 0, TAU); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU, x = Math.cos(a) * R * 1.85, y = Math.sin(a) * R * 1.85, d = R * 0.07;
        g.fillStyle = `rgba(255,220,150,${0.6 * br})`;
        g.beginPath(); g.moveTo(x, y - d); g.lineTo(x + d * 0.6, y); g.lineTo(x, y + d); g.lineTo(x - d * 0.6, y); g.closePath(); g.fill();
      }
      g.strokeStyle = `rgba(255,140,40,${0.12 * br})`;
      for (let s = 0; s < 2; s++) {
        g.beginPath();
        for (let i = 0; i <= 3; i++) { const a = s * Math.PI / 3 + i / 3 * TAU - Math.PI / 2, x = Math.cos(a) * R * 1.7, y = Math.sin(a) * R * 1.7; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
      g.restore();
      g.restore();                    // back out of the halo's translate and the 'lighter' blend
      // rising motes of light, each trailing a short streak
      g.save(); g.globalCompositeOperation = 'lighter';
      const n = Math.round(40 * k);
      for (let i = 0; i < n; i++) {
        const spd = 16 + (i % 7) * 7, x = fr(i * 0.618) * W + Math.sin(t * 0.8 + i * 1.7) * 14;
        const y = H + 20 - fr(t * spd / (H + 40) + i * 0.173) * (H + 40);
        const fl = 0.5 + 0.5 * Math.sin(t * 6 + i * 2.1), a = (0.25 + 0.6 * fl) * Math.min(1, (H - y) / (H * 0.25) + 0.2);
        const len = 6 + (i % 4) * 4;
        g.fillStyle = `rgba(255,${200 + (i % 3) * 20},140,${a})`; g.fillRect(x - 1, y, 2, len * 0.4);
        g.fillStyle = `rgba(255,120,30,${a * 0.35})`; g.fillRect(x - 1, y + len * 0.4, 2, len * 0.6);
        if (i % 6 === 0) { g.fillStyle = `rgba(255,240,200,${a})`; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
      }
      g.restore();
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
    // moving diagonal lattice + theme ambience - the first things 설정 - 이펙트 drops
    const fxL = G.opt('fx');
    if (fxL === 'high') {
      g.strokeStyle = `hsla(${bh},70%,70%,0.045)`; g.lineWidth = 1;
      const sp = 64, off = (t * 8) % sp;
      g.beginPath();
      for (let x = -H; x < W + H; x += sp) { g.moveTo(x + off, 0); g.lineTo(x + off - H, H); g.moveTo(x - off, 0); g.lineTo(x - off + H, H); }
      g.stroke();
    }
    if (fxL !== 'low') ambient(th ? th.ambient : 'dust', t, bh);
    // vignette (THE UNSEEN brings its own darkness - its eyes live out at the edges)
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, th && th.ambient === 'unseen' ? 'rgba(0,0,0,.15)' : 'rgba(0,0,0,.65)');
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
    const quietSky = G.activeTheme && G.activeTheme().ambient === 'unseen';     // THE UNSEEN keeps its dark: no weather painted over it (the weather itself still runs)
    if (!quietSky) G.weather.drawBack(g, W, H, t);
    G.biome.drawBack(g, W, H, t);                                    // a rare biome paints over the sky
    if (G.boss && G.boss.active) G.boss.draw(g, W, H, now);          // a boss fight replaces the crystal
    else if (G.state.level1.crystalGone) drawVoidWhereCrystalWas(t); else drawCrystal(t, now);
    drawParticles();
    if (!quietSky) G.weather.drawFront(g, W, H, t);
    G.biome.drawFront(g, W, H, t);
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
