/* AMETHYST - main loop: world rendering, mining, particles, cutscene flow */
(() => {
  const { E, seg, clamp, rgba, rng } = G;
  const cv = document.getElementById('game'), g = cv.getContext('2d');
  const coinIco = document.getElementById('coinIco');
  const TAU = Math.PI * 2;
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  window.addEventListener('resize', resize);
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
  function shard(x, y, hue, sp = 1) {
    const a = Math.random() * TAU, v = (120 + Math.random() * 380) * sp;
    fxs.push({ k: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14,
      s: 3 + Math.random() * 6, life: 0, max: 0.6 + Math.random() * 0.6, hue, l: 45 + Math.random() * 30 });
  }
  function spark(x, y, col, sp = 1) {
    const a = Math.random() * TAU, v = (180 + Math.random() * 420) * sp;
    fxs.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.25 + Math.random() * 0.25, col });
  }
  function ring(x, y, col, r1 = 90, w = 2, max = 0.45) { fxs.push({ k: 'ring', x, y, life: 0, max, r1, col, w }); }
  function text(x, y, str, col, size = 16, max = 0.9) { let n = 0; for (const p of fxs) if (p.k === 'text') n++; if (n > 8) return; fxs.push({ k: 'text', x, y, vy: -60, life: 0, max, str, col, size }); }
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

  function mine(x, y, auto) {
    if (G.cutscenes.active) return;
    const s = G.state, now = performance.now();
    if (!auto) {
      combo = now - lastClick < 700 ? Math.min(combo + 1, 10) : 0;
      lastClick = now;
    }
    const crit = Math.random() < G.stats.critChance();
    const gain = G.stats.clickValue() * (crit ? G.stats.critMul() : 1);
    G.addCoins(gain); s.clicks++;
    let potion = null;
    if (!auto && s.armed) { potion = G.stats.armedPotion(); s.armed = null; G.save(); G.emit("change"); }
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
    if (crit) flashA = Math.max(flashA, 0.18);

    // crystal HP - each hit opens a new crack where it landed
    hits++;
    if (!auto || Math.random() < 0.34) growCrack(clamp((px - c.x) / R, -0.95, 0.95) * 0.9, clamp((py - c.y) / R, -0.95, 0.95) * 0.9);
    let shatterLuck = false;
    if (hits >= zone().hp) {
      hits = 0; s.shatters++;
      const bonus = G.stats.clickValue() * 10;
      G.addCoins(bonus); G.audio.shatter(zone().snd);
      for (let i = 0; i < 26; i++) shard(c.x, c.y, h, 1.6);
      for (let i = 0; i < 14; i++) spark(c.x, c.y, `hsl(${h},95%,80%)`, 1.5);
      ring(c.x, c.y, '#ffffff', R * 2.2, 3, 0.7); ring(c.x, c.y, `hsl(${h},90%,65%)`, R * 3, 2, 0.9);
      bundle(c.x, c.y, bonus, 3, 1.1);
      text(c.x, c.y - R * 0.3, 'SHATTER +' + G.fmt(bonus), '#ffffff', 22, 1.3);
      text(c.x, c.y + R * 0.05, 'LUCK x5', `hsl(${h},95%,80%)`, 17, 1.1);
      shake = 1; flashA = 0.35;
      shatterLuck = true;
      crystal = makeCrystal((Math.random() * 1e9) | 0);
    }
    cap();
    G.emit('mine');
    if (potion) potionBurst(potion, x, y);
    roll(potion, shatterLuck ? 5 : 1);
  }

  /* one-click luck bomb: everything flashes, the roll uses luck + potion luck with a higher cap */
  function potionBurst(pt, x, y) {
    const c = center(), R = crystalR(), col = `hsl(${pt.hue},100%,68%)`;
    G.audio.blast(G.data.potions.indexOf(pt));
    for (let i = 0; i < 4; i++) ring(c.x, c.y, i % 2 ? "#ffffff" : col, R * (2.4 + i), 3 - i * 0.4, 0.7 + i * 0.15);
    for (let i = 0; i < 22; i++) spark(c.x, c.y, i % 3 ? col : "#ffffff", 1.8);
    coins(c.x, c.y, 3, 1.5);
    text(c.x, c.y - R * 0.9, pt.en + "  LUCK +" + G.fmt(pt.luck), col, 20, 1.6);
    flashA = 0.5; shake = 1;
  }
  function roll(potion, luckMul = 1) {
    const def = G.cutscenes.roll(G.state.zone, G.stats.luck() * luckMul + (potion ? potion.luck : 0), potion ? G.data.potionCap : 0.5);
    if (def) startCut(def, false);
  }

  /* ---------------- cutscene flow ---------------- */
  function startCut(def, replay) {
    const s = G.state, reward = replay ? 0 : G.cutscenes.reward(def);
    let first = false;
    if (!replay) {
      G.addCoins(reward);
      const cx = s.codex[def.id] || (s.codex[def.id] = { n: 0, t: Date.now(), best: 0 });
      first = cx.n === 0; cx.n++; cx.best = Math.max(cx.best, reward);
      G.save();
    }
    // decide whether to actually play the film, or just hand over the reward
    const rec = s.codex[def.id], st = s.settings;
    const belowFloor = !replay && def.odds < (st.minOdds || 0);          // "설정 - 이 확률 미만은 표시 안 함"
    const autoSkip = !replay && st.autoSkipSeen && !first;               // "설정 - 이미 본 컷신은 항상 건너뛰기"
    if (!replay && (belowFloor || autoSkip || (rec && rec.skip && !first))) { quickWin(def, reward); return; }
    G.hold = !replay;               // freeze the wallet counter until the reveal is collected
    document.body.classList.add('cut');
    if (!replay && G.ui) G.ui.closePanel();   // replays from the codex keep the panel open for browsing
    G.cutscenes.start(def, { reward, first, replay });
  }

  function quickWin(def, reward) {
    const c = center(), t = G.tiers[def.tierIdx];
    const n = 2 + Math.ceil(def.tierIdx / 2);
    bundle(c.x, c.y + 20, reward, n, 1.2);
    ring(c.x, c.y, t.color, crystalR() * 3, 3, 0.8);
    flashA = Math.max(flashA, 0.25); shake = Math.max(shake, 0.6);
    G.audio.win(def.tierIdx, def.snd);
    G.emit('win', { def, reward, tier: t });
    G.emit('change');
  }
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
    if (hint && !hint.classList.contains('gone')) hint.classList.add('gone');
    mine(ev.clientX, ev.clientY, false);
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', ev => {
    if (ev.repeat || ev.target.tagName === 'INPUT') return;
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

    if (!G.cutscenes.active && G.state.autoOn) {
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
  function drawBackground(t) {
    const h = hue();
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `hsl(${h},45%,7%)`); bg.addColorStop(1, `hsl(${h},55%,3%)`);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const c = center(), R = crystalR();
    const gl = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R * 3.2);
    gl.addColorStop(0, `hsla(${h},80%,50%,${0.22 + pulse * 0.2})`); gl.addColorStop(1, `hsla(${h},80%,50%,0)`);
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    // moving diagonal lattice
    g.strokeStyle = `hsla(${h},70%,70%,0.045)`; g.lineWidth = 1;
    const sp = 64, off = (t * 8) % sp;
    g.beginPath();
    for (let x = -H; x < W + H; x += sp) { g.moveTo(x + off, 0); g.lineTo(x + off - H, H); g.moveTo(x - off, 0); g.lineTo(x - off + H, H); }
    g.stroke();
    // dust
    for (let i = 0; i < 46; i++) {
      const sx = (i * 137.5) % 1, sy = (i * 61.8) % 1, spd = 6 + (i % 7) * 3;
      const x = sx * W, y = ((sy * H - t * spd) % H + H) % H;
      g.fillStyle = `hsla(${h},80%,80%,${0.12 + 0.2 * ((i % 5) / 5)})`;
      g.fillRect(x, y, 2, 2);
    }
    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
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
    // a drunk potion charges the crystal: pulsing halo + orbiting sparks until the next click fires it
    const ap = G.stats.armedPotion();
    if (ap) {
      const pc = `hsl(${ap.hue},100%,68%)`, pk = 0.55 + 0.35 * Math.sin(t * 6);
      const gl = g.createRadialGradient(c.x, c.y, R * 0.5, c.x, c.y, R * 2.1);
      gl.addColorStop(0, `hsla(${ap.hue},100%,60%,${0.32 * pk})`); gl.addColorStop(1, `hsla(${ap.hue},100%,60%,0)`);
      g.fillStyle = gl; g.fillRect(c.x - R * 2.2, c.y - R * 2.2, R * 4.4, R * 4.4);
      g.strokeStyle = pc; g.globalAlpha = pk; g.lineWidth = 2.5; g.beginPath(); g.arc(c.x, c.y, R * (1.5 + 0.05 * Math.sin(t * 8)), 0, TAU); g.stroke(); g.globalAlpha = 1;
      for (let i = 0; i < 10; i++) { const a = t * 1.8 + (i / 10) * TAU, rr = R * (1.5 + 0.12 * Math.sin(t * 3 + i)); g.fillStyle = i % 2 ? pc : '#ffffff'; g.fillRect(c.x + Math.cos(a) * rr - 2, c.y + Math.sin(a) * rr - 2, 4, 4); }
    }
    // HP arc (progress to shatter)
    const prog = hits / zone().hp;
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.08)';
    g.beginPath(); g.arc(c.x, c.y, R * 1.2, 0, TAU); g.stroke();
    if (prog > 0) {
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
    if (shake > 0) g.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 10);
    drawBackground(t);
    drawCrystal(t, now);
    drawParticles();
    if (flashA > 0) { g.fillStyle = `rgba(255,255,255,${flashA})`; g.fillRect(-20, -20, W + 40, H + 40); }
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
  G.game = { center, crystalR, mine };
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
