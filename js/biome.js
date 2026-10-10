/* AMETHYST - RARE BIOMES. Far rarer than weather and they cover every map at once.
     CUBER STAGE : two 1억+ finds in a row. 15 min. luck x7, yellow drop +50%, every 10s a 3% shot
                   at a 창세의 크리스탈, and the limited aura "Luff1004" - 1 in 1,000,000 per mining
                   action, rolled with luck fixed at 1 (js/game.js roll).
     GLITCH      : 1 in 1000 whenever a weather changes. 9 min. luck x10, coins x14, no auto-mining,
                   every 19s a 3.12% shot at an 에러 크리스탈, and the 19 error minerals can drop.
   Biome minerals never appear in the codex. State: G.state.biome = { id, until, t0 } (null = none).
   Multipliers are read by G.stats (js/core/state.js); painting is called from js/game.js render. */
(() => {
  const TAU = Math.PI * 2, fr = v => v - Math.floor(v);
  const D = G.data.biomes = {
    cuber: { id: 'cuber', name: 'CUBER STAGE', ko: '큐버 스테이지', color: '#3af0ff', color2: '#ff3ad8', min: 15, luck: 7, coin: 1, yellow: 1.5,
      gift: { every: 10, chance: 0.03, potion: 'genesis' },
      how: '억대(1억 이상) 광물을 2연속으로 뽑으면 열립니다', fx: '럭 x7 · 옐로우 크리스탈 확률 +50% · 10초마다 3% 확률로 창세의 크리스탈',
      extra: '한정 아우라 Luff1004 · 럭과 상관없이 100만분의 1' },
    glitch: { id: 'glitch', name: 'GLITCH', ko: '글리치', color: '#ff2a6a', color2: '#2affd0', min: 9, luck: 10, coin: 14, noAuto: true, chance: 0.001,
      gift: { every: 19, chance: 0.0312, potion: 'errorc' },
      how: '날씨가 바뀔 때마다 1000분의 1', fx: '럭 x10 · 코인 x14 · 자동 클릭 불가 · 19초마다 3.12% 확률로 에러 크리스탈',
      extra: '에러 광물 19종 (3분의 2가 억대)' },
  };
  const now = () => Date.now();
  const current = () => { const b = G.state && G.state.biome; return b && D[b.id] && now() < b.until ? D[b.id] : null; };
  const left = () => { const b = current(); return b ? (G.state.biome.until - now()) / 1000 : 0; };
  let streak = 0, giftAt = 0, pendingIntro = null;

  function start(id) {
    if (!D[id] || current() || G.config.viewer) return false;
    G.state.biome = { id, until: now() + D[id].min * 60000, t0: now() };
    giftAt = now(); G.save();
    paintBody();
    // the trigger usually fires just as a cutscene starts - the title card waits until it's over
    setTimeout(() => { if (G.cutscenes.active) pendingIntro = D[id]; else intro(D[id]); }, 60);
    if (D[id].noAuto) G.emit('toast', `${D[id].name} - 이 동안에는 자동 채굴이 멈춥니다. 직접 캐세요!`);
    G.emit('biome', id); G.emit('change');
    return true;
  }
  function end() {
    const b = G.state.biome; G.state.biome = null; G.save(); paintBody();
    if (b && D[b.id]) G.emit('toast', `${D[b.id].name}이(가) 끝났습니다`);
    G.emit('change');
  }

  /* triggers */
  function onFind(def) {                       // every real find (js/game.js startCut)
    if (!def || def.special || def.boss || def.biome) return;
    if (def.odds >= 1e8) { streak++; if (streak >= 2) { streak = 0; start('cuber'); } }
    else streak = 0;
  }
  function onWeather(silent) {                 // every weather change (js/weather.js setWeather)
    if (silent || current()) return;
    if (Math.random() < D.glitch.chance) start('glitch');
  }
  // CUBER STAGE's aura: its own roll per mining action, luck ignored
  function auraRoll() {
    const b = current();
    if (!b || b.id !== 'cuber') return null;
    return Math.random() < 1 / 1e6 ? G.cutscenes.byId.aura_luff1004 || null : null;
  }

  /* gifts + expiry, once a second */
  function tick() {
    if (!G.state || G.config.viewer) return;
    const s = G.state;
    if (s.biome && !current()) { end(); return; }
    const b = current(); if (!b) return;
    // the gift clock starts fresh after a reload (or a long sleep) - never a burst of catch-up rolls
    if (!giftAt || now() - giftAt > b.gift.every * 3000) giftAt = now();
    if (now() - giftAt >= b.gift.every * 1000) {
      giftAt += b.gift.every * 1000;
      if (Math.random() < b.gift.chance) {
        const pt = G.stats.potion(b.gift.potion);
        s.potions[pt.id] = (s.potions[pt.id] || 0) + 1; G.save();
        G.emit('toast', `${b.name} 선물 · ${pt.name} +1`); G.audio.potion(); G.audio.blast(6); G.emit('change');
      }
    }
  }

  /* the arrival: a full-screen title card */
  let introEl = null;
  function intro(b) {
    if (!introEl) { introEl = document.createElement('div'); introEl.id = 'biomeIntro'; introEl.hidden = true; document.body.appendChild(introEl); }
    introEl.className = 'bi-' + b.id;
    introEl.innerHTML = `<div class="bibg"></div><div class="bibox"><small>RARE BIOME</small><b data-t="${b.name}">${b.name}</b><em>${b.ko} · ${b.min}분</em><span>${b.fx}</span></div>`;
    introEl.hidden = false; void introEl.offsetWidth; introEl.classList.add('show');
    G.audio.blackout && G.audio.blackout(7); setTimeout(() => G.audio.blast(8), 500); G.buzz && G.buzz([60, 40, 120, 40, 200]);
    clearTimeout(intro.t); intro.t = setTimeout(() => { introEl.classList.remove('show'); setTimeout(() => { introEl.hidden = true; }, 700); }, 4800);
  }
  const paintBody = () => { const b = current(); document.body.classList.toggle('biome-cuber', !!b && b.id === 'cuber'); document.body.classList.toggle('biome-glitch', !!b && b.id === 'glitch'); };

  /* ---------------- the world itself ---------------- */
  function cube(g, x, y, s, ax, ay, col, a) {
    const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([px, py, pz]) => {
      let X = px, Y = py * Math.cos(ax) - pz * Math.sin(ax), Z = py * Math.sin(ax) + pz * Math.cos(ax);
      const X2 = X * Math.cos(ay) + Z * Math.sin(ay), Z2 = -X * Math.sin(ay) + Z * Math.cos(ay), k = 1 / (1 + Z2 * 0.18);
      return [x + X2 * s * k, y + Y * s * k];
    });
    g.strokeStyle = col; g.globalAlpha = a; g.beginPath();
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => { g.moveTo(V[i][0], V[i][1]); g.lineTo(V[j][0], V[j][1]); });
    g.stroke(); g.globalAlpha = 1;
  }
  function drawBack(g, W, H, t) {
    const b = current(); if (!b || G.config.viewer) return;
    const fx = G.opt('fx');
    if (b.id === 'cuber') {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, 'rgba(4,2,20,.82)'); sky.addColorStop(0.62, 'rgba(30,6,50,.75)'); sky.addColorStop(1, 'rgba(2,10,24,.85)');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      if (fx === 'low') return;
      const hz = H * 0.62, vx = W / 2;
      g.save(); g.globalCompositeOperation = 'lighter';
      // neon sun on the horizon, sliced
      const sr = Math.min(W, H) * 0.16, sg = g.createLinearGradient(0, hz - sr, 0, hz);
      sg.addColorStop(0, 'rgba(255,90,220,.55)'); sg.addColorStop(1, 'rgba(255,200,90,.35)');
      g.fillStyle = sg; g.beginPath(); g.arc(vx, hz, sr, Math.PI, TAU); g.fill();
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 6; i++) g.fillRect(vx - sr, hz - sr * (0.1 + i * 0.13), sr * 2, sr * 0.03 * (1 + i * 0.4));
      g.globalCompositeOperation = 'lighter';
      // the grid floor rushing toward you
      g.lineWidth = 1.2;
      for (let i = 0; i < 18; i++) { const k = fr(i / 18 + t * 0.25), y = hz + (H - hz) * k * k; g.strokeStyle = `rgba(58,240,255,${0.08 + k * 0.45})`; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      for (let i = -14; i <= 14; i++) { g.strokeStyle = `rgba(255,58,216,${0.25 - Math.abs(i) * 0.012})`; g.beginPath(); g.moveTo(vx + i * W * 0.02, hz); g.lineTo(vx + i * W * 0.22, H); g.stroke(); }
      // wireframe cubes drifting on both sides
      g.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, x = vx + sd * W * (0.3 + (i % 3) * 0.08), y = H * (0.18 + (i % 3) * 0.13) + Math.sin(t * 0.8 + i) * 12; cube(g, x, y, Math.min(W, H) * (0.03 + (i % 3) * 0.012), t * (0.5 + i * 0.1), t * (0.7 + i * 0.13), i % 2 ? '#3af0ff' : '#ff3ad8', 0.7); }
      g.restore();
    } else {
      g.fillStyle = 'rgba(6,0,10,.6)'; g.fillRect(0, 0, W, H);
      if (fx === 'low') return;
      const r = (n) => fr(Math.sin(n * 91.7 + Math.floor(t * 9) * 13.1) * 43758.5);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) { if (r(i) < 0.5) continue; const x = r(i + 1) * W, y = r(i + 2) * H, w = 20 + r(i + 3) * W * 0.4, h = 2 + r(i + 4) * 26; g.fillStyle = ['rgba(255,42,106,.25)', 'rgba(42,255,208,.22)', 'rgba(120,80,255,.22)'][i % 3]; g.fillRect(x, y, w, h); }
      g.restore();
    }
  }
  function drawFront(g, W, H, t) {
    const b = current(); if (!b || G.config.viewer || G.opt('fx') === 'low') return;
    if (b.id === 'cuber') {
      g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      return;
    }
    // GLITCH: torn slices of the frame, RGB fringes, the odd frozen burst of noise
    const step = Math.floor(t * 12), rnd = n => fr(Math.sin(n * 12.9898 + step * 78.233) * 43758.5453);
    if (rnd(1) < 0.35) {
      const cv = g.canvas, dpr = cv.width / W;
      for (let i = 0; i < 3; i++) {
        const y = rnd(i + 2) * H, h = 6 + rnd(i + 5) * 40, dx = (rnd(i + 8) - 0.5) * 60;
        try { g.drawImage(cv, 0, y * dpr, cv.width, h * dpr, dx, y, W, h); } catch (e) {}
      }
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    if (rnd(3) < 0.2) { g.fillStyle = 'rgba(255,0,80,.07)'; g.fillRect(4, 0, W, H); g.fillStyle = 'rgba(0,255,220,.06)'; g.fillRect(-4, 0, W, H); }
    g.restore();
    if (rnd(4) < 0.06) {
      g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '700 12px ui-monospace,Consolas,monospace';
      const msg = ['ERR_CRYSTAL_NOT_FOUND', '0xC0000005', 'NaN', 'undefined is not a function', 'SEGMENTATION FAULT', '■■■■■■■■', 'stack overflow', 'null'][Math.floor(rnd(5) * 8)];
      g.fillText(msg, rnd(6) * (W - 200), 40 + rnd(7) * (H - 80));
    }
  }

  /* the rare-biome explainer in the weather popover (the (i) button there) */
  function infoHTML() {
    const b = current();
    return `<div class="bioinfo">
      <b>희귀 바이옴</b><p>날씨보다 훨씬 드물게 나타나 모든 맵을 덮는 특별한 세계입니다. 바이옴 한정 광물은 도감에 기록되지 않습니다.</p>
      ${Object.values(D).map(x => `<div class="biorow ${b && b.id === x.id ? 'on' : ''}" style="--bc:${x.color}">
        <div><b>${x.name}</b><small>${x.ko} · ${x.min}분</small></div>
        <span>등장: ${x.how}</span><span>효과: ${x.fx}</span><span>${x.extra}</span></div>`).join('')}
    </div>`;
  }

  G.biome = { current, left, start, end, onFind, onWeather, auraRoll, drawBack, drawFront, infoHTML, list: D,
    mul: kind => { const b = current(); return b ? (b[kind] || 1) : 1; },
    noAuto: () => { const b = current(); return !!(b && b.noAuto); } };
  G.on('ready', () => { paintBody(); setInterval(tick, 1000); });
  G.on('cut:end', () => { if (pendingIntro) { const b = pendingIntro; pendingIntro = null; setTimeout(() => intro(b), 400); } });
})();
