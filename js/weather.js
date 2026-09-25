/* AMETHYST - weather. Rolls each region's sky from js/data/weather.js, applies its multipliers
   (read by G.stats in js/core/state.js and by js/game.js), paints it behind and in front of the
   crystal, announces the rare ones, and decides mutations. Bosses live in js/boss.js. */
(() => {
  const D = G.data, TAU = Math.PI * 2;
  const region = z => D.weatherRegions.find(r => r.zones.includes(z)) || D.weatherRegions[0];
  const isDay = () => { const h = new Date().getHours(); return h >= 6 && h < 18; };
  const store = () => (G.state.wx || (G.state.wx = {}));
  let prev = null, fadeT = 0;                 // for the crossfade between two weathers

  function roll(reg) {
    const table = (!isDay() && reg.night) ? reg.night : reg.day;
    const ids = Object.keys(table).filter(k => table[k] > 0), total = ids.reduce((a, k) => a + table[k], 0);
    let r = Math.random() * total;
    for (const k of ids) { r -= table[k]; if (r < 0) return k; }
    return ids[0];
  }
  function setWeather(regId, id, silent) {
    const w = D.weathers[id], s = store(), old = s[regId];
    if (old && old.id !== id) { prev = old.id; fadeT = performance.now(); }
    s[regId] = { id, until: Date.now() + w.min * 60000, t0: Date.now() };
    G.save();
    G.emit('weather', { region: regId, id, silent });
    if (!silent) announce(w);
  }
  function current() {
    const reg = region(G.state.zone), s = store()[reg.id];
    return D.weathers[s && s.id] || D.weathers[Object.keys(reg.day)[0]];
  }
  function tick() {
    if (!G.state || G.config.viewer) return;
    const reg = region(G.state.zone), s = store()[reg.id];
    if (!s || !D.weathers[s.id] || Date.now() >= s.until) setWeather(reg.id, roll(reg), !s);
  }

  /* ---------------- effects ---------------- */
  const mul = kind => { if (G.config.viewer || !G.state) return 1; const w = current(); return w[kind] || 1; };
  function rollMutation(def) {
    if (!def || def.odds < D.MUT_MIN_ODDS || def.special || def.boss) return null;
    const w = current(); if (!w.mut) return null;
    const m = D.mutations[w.mut];
    return Math.random() < m.chance ? m : null;
  }

  /* ---------------- announcement for rare skies ---------------- */
  const RARE = ['meteor', 'lightning', 'rainbow', 'solar', 'moonlight', 'sandstorm', 'eruption', 'voidstorm', 'starflux', 'rift', 'radio', 'acid'];
  function announce(w) {
    const el = document.getElementById('wxAnnounce');
    if (!el) return;
    if (!RARE.includes(w.id)) { G.emit('toast', `날씨가 바뀌었습니다 · ${w.name}`); return; }
    const big = ['solar', 'moonlight', 'rainbow', 'sandstorm', 'eruption', 'voidstorm'].includes(w.id);
    el.className = big ? 'big' : '';
    el.style.setProperty('--wc', w.color);
    el.innerHTML = `<small>${big ? 'RARE WEATHER' : 'WEATHER'}</small><b>${w.name}</b><span>${w.desc}</span>`;
    el.hidden = false; void el.offsetWidth; el.classList.add('show');
    clearTimeout(announce.t); announce.t = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 500); }, big ? 4200 : 2800);
    if (big) { G.audio.blast(5); G.buzz && G.buzz([40, 30, 80]); } else G.audio.potion();
  }

  /* ---------------- sky painting ---------------- */
  const fr = v => v - Math.floor(v);
  function glow(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function clouds(g, W, H, t, col, n, y0, alpha) {
    for (let i = 0; i < n; i++) {
      const sp = 6 + (i % 4) * 4, x = fr(i * 0.37 + t * sp / (W + 600)) * (W + 600) - 300, y = y0 + (i % 5) * H * 0.045, r = 90 + (i % 3) * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${col},${alpha})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.55, 0, 0, TAU); g.fill();
    }
  }
  function streaks(g, W, H, t, n, col, len, ang, speed, width) {
    g.strokeStyle = col; g.lineWidth = width; g.beginPath();
    const dx = Math.cos(ang), dy = Math.sin(ang);
    for (let i = 0; i < n; i++) {
      const k = fr(t * speed * (0.7 + (i % 5) * 0.12) + i * 0.618);
      const x = fr(i * 0.381) * (W + 200) - 100 + dx * k * (H + 200) * 0.3, y = -60 + k * (H + 120);
      g.moveTo(x, y); g.lineTo(x - dx * len, y - dy * len);
    }
    g.stroke();
  }
  const BACK = {
    cloudy(g, W, H, t) { g.fillStyle = 'rgba(20,18,32,.35)'; g.fillRect(0, 0, W, H); clouds(g, W, H, t, '150,140,180', 9, H * 0.12, 0.22); },
    rain(g, W, H) { g.fillStyle = 'rgba(10,30,60,.28)'; g.fillRect(0, 0, W, H); },
    lightning(g, W, H, t) { g.fillStyle = 'rgba(8,8,24,.45)'; g.fillRect(0, 0, W, H); clouds(g, W, H, t, '70,70,110', 10, H * 0.08, 0.35); },
    sunny(g, W, H, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(g, W * 0.92, -H * 0.02, Math.max(W, H) * 0.55, 'rgba(255,210,140,A)', 0.2);
      for (let i = 0; i < 6; i++) {
        const a = 1.95 + i * 0.12 + Math.sin(t * 0.2 + i) * 0.03, l = Math.hypot(W, H);
        g.fillStyle = 'rgba(255,220,160,.035)'; g.beginPath(); g.moveTo(W * 0.92, 0); g.lineTo(W * 0.92 + Math.cos(a - 0.03) * l, Math.sin(a - 0.03) * l); g.lineTo(W * 0.92 + Math.cos(a + 0.03) * l, Math.sin(a + 0.03) * l); g.fill();
      }
      g.restore();
    },
    meteor(g, W, H, t) {
      g.fillStyle = 'rgba(4,4,20,.35)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff';
      for (let i = 0; i < 70; i++) { g.globalAlpha = 0.25 + 0.5 * fr(Math.sin(i * 12.9) * 43758) * (0.6 + 0.4 * Math.sin(t * 2 + i)); g.fillRect(fr(i * 0.6180) * W, fr(i * 0.3819) * H * 0.8, 1.5, 1.5); }
      g.globalAlpha = 1;
    },
    rainbow(g, W, H, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const cx = W * 0.5, cy = H * 0.72, R = Math.max(W, H) * 0.62;
      ['255,60,60', '255,150,40', '255,235,60', '80,255,110', '60,200,255', '90,110,255', '190,80,255'].forEach((c, i) => {
        g.strokeStyle = `rgba(${c},${0.13 + 0.03 * Math.sin(t + i)})`; g.lineWidth = R * 0.028;
        g.beginPath(); g.arc(cx, cy, R - i * R * 0.028, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      });
      for (let i = 0; i < 26; i++) { const tw = Math.pow(Math.max(0, Math.sin(t * 2 + i * 1.7)), 6); g.fillStyle = `rgba(255,255,255,${0.7 * tw})`; g.fillRect(fr(i * 0.618) * W, fr(i * 0.381) * H, 2, 2); }
      g.restore();
    },
    solar(g, W, H, t) {
      const cx = W * 0.5, cy = H * 0.18, R = Math.min(W, H) * 0.2;
      g.fillStyle = 'rgba(60,30,0,.28)'; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(g, cx, cy, Math.max(W, H) * 0.8, 'rgba(255,170,60,A)', 0.35);
      g.translate(cx, cy); g.rotate(t * 0.05);
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * TAU, l = R * (2.6 + 0.8 * Math.sin(t * 1.3 + i * 2)), w = i % 2 ? 0.05 : 0.09;
        g.fillStyle = `rgba(255,${190 + (i % 3) * 20},90,.12)`;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * l, Math.sin(a - w) * l); g.lineTo(Math.cos(a + w) * l, Math.sin(a + w) * l); g.fill();
      }
      g.rotate(-t * 0.05);
      const sg = g.createRadialGradient(0, 0, 0, 0, 0, R);
      sg.addColorStop(0, 'rgba(255,255,230,.95)'); sg.addColorStop(0.6, 'rgba(255,200,90,.8)'); sg.addColorStop(1, 'rgba(255,120,20,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,230,160,${0.25 + 0.15 * Math.sin(t * 3)})`; g.lineWidth = 2;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(0, 0, R * (1.15 + k * 0.22 + fr(t * 0.3 + k / 3) * 0.3), 0, TAU); g.stroke(); }
      g.restore();
    },
    moonlight(g, W, H, t) {
      const cx = W * 0.26, cy = H * 0.17, R = Math.min(W, H) * 0.14;
      g.fillStyle = 'rgba(4,8,26,.45)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff';
      for (let i = 0; i < 90; i++) { g.globalAlpha = (0.2 + 0.6 * fr(i * 0.77)) * (0.5 + 0.5 * Math.sin(t * 1.5 + i)); g.fillRect(fr(i * 0.618) * W, fr(i * 0.3819) * H, 1.4, 1.4); }
      g.globalAlpha = 1;
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(g, cx, cy, R * 6, 'rgba(180,200,255,A)', 0.3);
      for (let i = 0; i < 7; i++) {
        const a = 0.55 + i * 0.12 + Math.sin(t * 0.3 + i) * 0.02, l = Math.hypot(W, H);
        g.fillStyle = 'rgba(200,215,255,.035)'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.025) * l, cy + Math.sin(a - 0.025) * l); g.lineTo(cx + Math.cos(a + 0.025) * l, cy + Math.sin(a + 0.025) * l); g.fill();
      }
      g.restore();
      const mg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
      mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.7, '#dfe6ff'); mg.addColorStop(1, '#a8b8e8');
      g.fillStyle = mg; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
      g.fillStyle = 'rgba(120,130,170,.25)';
      [[-0.3, -0.1, 0.22], [0.25, 0.2, 0.16], [0.05, -0.4, 0.1], [-0.1, 0.35, 0.12]].forEach(([x, y, r]) => { g.beginPath(); g.arc(cx + x * R, cy + y * R, r * R, 0, TAU); g.fill(); });
    },
    acid(g, W, H, t) { g.fillStyle = `rgba(40,80,10,${0.25 + 0.05 * Math.sin(t)})`; g.fillRect(0, 0, W, H); clouds(g, W, H, t, '120,200,40', 6, H * 0.1, 0.12); },
    radio(g, W, H, t) {
      const p = 0.5 + 0.5 * Math.sin(t * 2.4);
      g.fillStyle = `rgba(60,70,0,${0.22 + 0.08 * p})`; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, H * 0.55, Math.max(W, H) * 0.6, 'rgba(210,255,40,A)', 0.08 + 0.06 * p); g.restore();
    },
    sandstorm(g, W, H, t) {
      const hz = g.createLinearGradient(0, 0, 0, H);
      hz.addColorStop(0, 'rgba(150,100,40,.45)'); hz.addColorStop(1, 'rgba(90,60,20,.5)');
      g.fillStyle = hz; g.fillRect(0, 0, W, H);
      clouds(g, W * 3, H, t * 6, '200,150,80', 10, H * 0.2, 0.18);
    },
    eruption(g, W, H, t) {
      const hz = g.createLinearGradient(0, 0, 0, H);
      hz.addColorStop(0, 'rgba(30,6,0,.4)'); hz.addColorStop(1, `rgba(${140 + 40 * Math.sin(t * 1.3)},30,0,.5)`);
      g.fillStyle = hz; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, H * 1.05, Math.max(W, H) * 0.7, 'rgba(255,90,20,A)', 0.35); g.restore();
    },
    starflux(g, W, H, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const y = H * (0.15 + i * 0.17) + Math.sin(t * 0.5 + i) * 30; const gr = g.createLinearGradient(0, y - 40, 0, y + 40); gr.addColorStop(0, 'rgba(120,160,255,0)'); gr.addColorStop(0.5, `rgba(${120 + i * 20},170,255,.08)`); gr.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = gr; g.fillRect(0, y - 40, W, 80); }
      g.restore();
    },
    rift(g, W, H, t) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,80,220,${0.25 + 0.15 * Math.sin(t * 3)})`; g.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) { let x = fr(k * 0.31 + 0.1) * W, y = 0; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 14; s++) { x += Math.sin(k * 7 + s * 3.1) * 30; y += H / 14; g.lineTo(x, y); } g.stroke(); }
      g.restore();
    },
    voidstorm(g, W, H, t) {
      g.fillStyle = 'rgba(20,0,30,.4)'; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, H * 0.5);
      for (let k = 0; k < 5; k++) { g.rotate(t * 0.12 + k); g.strokeStyle = `rgba(190,90,255,${0.06 + k * 0.015})`; g.lineWidth = 30 - k * 4; g.beginPath(); g.arc(0, 0, Math.min(W, H) * (0.3 + k * 0.12), 0, Math.PI * 1.2); g.stroke(); }
      g.restore();
    },
  };
  let boltAt = 0, boltSeed = 0;
  const FRONT = {
    rain(g, W, H, t) { streaks(g, W, H, t, 90, 'rgba(170,215,255,.35)', 22, 1.75, 1.3, 1.2); },
    lightning(g, W, H, t) {
      streaks(g, W, H, t, 110, 'rgba(170,190,255,.3)', 26, 1.8, 1.6, 1.2);
      const now = performance.now();
      if (now > boltAt + 2600 + fr(boltSeed * 0.618) * 4000) { boltAt = now; boltSeed++; G.audio && G.audio.noise && G.audio.noise({ d: 0.9, v: 0.18, f: 700, q: 0.3 }); }
      const k = (now - boltAt) / 1000;
      if (k < 0.35) {
        const a = (1 - k / 0.35);
        g.fillStyle = `rgba(210,220,255,${0.35 * a * a * G.flashMul()})`; g.fillRect(0, 0, W, H);
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(230,240,255,${a})`; g.lineWidth = 2.5; g.shadowColor = '#bcd0ff'; g.shadowBlur = 16;
        let x = W * (0.15 + fr(boltSeed * 0.381) * 0.7), y = 0; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 16; s++) { x += (fr(Math.sin(boltSeed * 99 + s) * 999) - 0.5) * 50; y += H * 0.045; g.lineTo(x, y); }
        g.stroke(); g.restore();
      }
    },
    meteor(g, W, H, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const k = fr(t * (0.35 + (i % 3) * 0.1) + i * 0.29); if (k > 0.45) continue;
        const q = k / 0.45, x0 = W * (0.2 + fr(i * 0.7) * 0.9), y0 = -40, x = x0 - q * W * 0.7, y = y0 + q * H * 0.6;
        const gr = g.createLinearGradient(x, y, x + 120, y - 100); gr.addColorStop(0, `rgba(255,240,200,${1 - q})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
        g.strokeStyle = gr; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 120, y - 100); g.stroke();
        g.fillStyle = `rgba(255,255,230,${1 - q})`; g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill();
      }
      g.restore();
    },
    acid(g, W, H, t) { streaks(g, W, H, t, 80, 'rgba(160,255,60,.4)', 18, 1.72, 1.1, 1.5); },
    radio(g, W, H, t) {
      streaks(g, W, H, t, 60, 'rgba(220,255,60,.35)', 14, 1.75, 1.0, 1.4);
      for (let i = 0; i < 30; i++) { const tw = fr(t * 3 + i * 0.37) < 0.1; if (tw) { g.fillStyle = 'rgba(230,255,90,.8)'; g.fillRect(fr(i * 0.618 + t * 0.1) * W, fr(i * 0.381 + t * 0.07) * H, 2, 2); } }
    },
    sandstorm(g, W, H, t) {
      g.strokeStyle = 'rgba(240,200,130,.28)'; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i < 90; i++) { const y = fr(i * 0.381) * H, x = fr(t * (0.5 + (i % 5) * 0.12) + i * 0.618) * (W + 200) - 100, l = 30 + (i % 4) * 25; g.moveTo(x, y); g.lineTo(x - l, y + 4); }
      g.stroke();
    },
    eruption(g, W, H, t) {
      for (let i = 0; i < 60; i++) {
        const up = i % 2, k = fr(t * (0.08 + (i % 5) * 0.03) + i * 0.618), x = fr(i * 0.381) * W + Math.sin(t + i) * 10, y = up ? H - k * H : k * H;
        g.fillStyle = up ? `rgba(255,${120 + (i % 4) * 30},40,${0.7 * (1 - k)})` : 'rgba(80,70,70,.45)';
        g.fillRect(x, y, up ? 2 : 2.5, up ? 2 : 2.5);
      }
    },
    starflux(g, W, H, t) { g.fillStyle = '#dbe6ff'; for (let i = 0; i < 40; i++) { const k = fr(t * 0.6 + i * 0.618); g.globalAlpha = 1 - k; g.fillRect(fr(i * 0.381) * W + k * 80, fr(i * 0.77) * H - k * 40, 2, 2); } g.globalAlpha = 1; },
    voidstorm(g, W, H, t) {
      if (fr(t * 0.7) < 0.06) { g.fillStyle = 'rgba(200,90,255,.08)'; g.fillRect(0, fr(t * 13) * H, W, 20 + fr(t * 7) * 40); }
    },
  };
  function paint(which, g, W, H, t) {
    if (G.config.viewer || !G.state) return;
    const w = current(), tbl = which === 'back' ? BACK : FRONT;
    const k = prev ? Math.min(1, (performance.now() - fadeT) / 2500) : 1;
    if (prev && k < 1 && tbl[prev]) { g.save(); g.globalAlpha = 1 - k; tbl[prev](g, W, H, t); g.restore(); }
    if (k >= 1) prev = null;
    if (tbl[w.id]) { g.save(); g.globalAlpha = k; tbl[w.id](g, W, H, t); g.restore(); }
  }

  /* ---------------- mutation overlays on the cutscene ---------------- */
  function mutOverlay(g, e, m, time) {
    const { W, H, cx, cy, u } = e, t = time / 1000, k = Math.min(1, Math.max(0, time / 1200));
    g.save(); g.globalAlpha = k;
    switch (m.id) {
      case 'bolt': {
        g.globalCompositeOperation = 'lighter';
        const n = Math.floor(t * 3);
        for (let b = 0; b < 2; b++) {
          const ph = fr(t * 3) , a = (1 - ph);
          if (ph > 0.4) continue;
          g.strokeStyle = `rgba(255,240,120,${a})`; g.lineWidth = u * 0.5; g.shadowColor = '#ffe84a'; g.shadowBlur = u * 3;
          let x = W * fr((n + b) * 0.618), y = 0; g.beginPath(); g.moveTo(x, y);
          for (let s = 0; s < 14; s++) { x += (fr(Math.sin((n + b) * 91 + s) * 999) - 0.5) * u * 10; y += H / 14; g.lineTo(x, y); }
          g.stroke();
        }
        const eg = g.createRadialGradient(cx, H / 2, Math.min(W, H) * 0.35, cx, H / 2, e.R); eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(1, `rgba(255,230,60,${0.18 + 0.1 * Math.sin(t * 20)})`);
        g.shadowBlur = 0; g.fillStyle = eg; g.fillRect(0, 0, W, H);
        break;
      }
      case 'rainbow': {
        g.globalCompositeOperation = 'hue'; g.globalAlpha = 0.35 * k; g.fillStyle = `hsl(${(t * 90) % 360},100%,50%)`; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * k;
        for (let i = 0; i < 7; i++) { g.strokeStyle = `hsl(${(i * 51 + t * 60) % 360},100%,60%)`; g.lineWidth = u * 0.7; g.beginPath(); g.arc(cx, cy, Math.min(W, H) * (0.36 + i * 0.022), 0, TAU); g.stroke(); }
        break;
      }
      case 'meteor': FRONT.meteor(g, W, H, t * 1.6); break;
      case 'tide': {
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { const r = fr(t * 0.4 + i / 4) * e.R; g.strokeStyle = `rgba(90,200,255,${0.35 * (1 - r / e.R)})`; g.lineWidth = u * 0.5; g.beginPath(); g.ellipse(cx, cy, r, r * 0.8, 0, 0, TAU); g.stroke(); }
        break;
      }
      case 'shadow': {
        const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, e.R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(40,10,60,${0.7 + 0.1 * Math.sin(t * 2)})`);
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(150,120,210,.08)';
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.4, d = Math.min(W, H) * (0.3 + 0.06 * Math.sin(t + i)); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, u * 8, u * 3, a, 0, TAU); g.fill(); }
        break;
      }
      case 'giant': {
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { const r = fr(t * 0.35 + i / 3) * e.R * 1.2; g.strokeStyle = `rgba(255,180,90,${0.5 * (1 - r / (e.R * 1.2))})`; g.lineWidth = u * 1.2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
        break;
      }
      case 'solar': case 'lunar': {
        g.globalCompositeOperation = 'lighter'; g.translate(cx, cy); g.rotate(t * 0.15);
        const col = m.id === 'solar' ? '255,190,80' : '200,215,255';
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, l = e.R; g.fillStyle = `rgba(${col},.1)`; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - 0.04) * l, Math.sin(a - 0.04) * l); g.lineTo(Math.cos(a + 0.04) * l, Math.sin(a + 0.04) * l); g.fill(); }
        break;
      }
      case 'acid': case 'irradiated': case 'dune': {
        const f = { acid: FRONT.acid, irradiated: FRONT.radio, dune: FRONT.sandstorm }[m.id]; f(g, W, H, t * 1.4);
        const col = { acid: '120,255,40', irradiated: '220,255,40', dune: '230,180,100' }[m.id];
        const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.25, cx, cy, e.R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${col},.22)`);
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
        break;
      }
      case 'volcanic': FRONT.eruption(g, W, H, t * 2); { const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.25, cx, cy, e.R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(255,70,20,${0.25 + 0.08 * Math.sin(t * 4)})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); } break;
      case 'void': case 'rift': {
        g.globalCompositeOperation = 'lighter';
        const col = m.id === 'void' ? '190,90,255' : '255,80,220';
        g.strokeStyle = `rgba(${col},.55)`; g.lineWidth = u * 0.35;
        for (let c = 0; c < 5; c++) { let x = cx, y = cy, a = c / 5 * TAU + t * 0.2; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 10; s++) { a += Math.sin(c * 5 + s * 2.3) * 0.5; x += Math.cos(a) * u * 5; y += Math.sin(a) * u * 5; g.lineTo(x, y); } g.stroke(); }
        if (fr(t * 1.3) < 0.08) { g.fillStyle = `rgba(${col},.12)`; g.fillRect(0, fr(t * 7) * H, W, u * 3); }
        break;
      }
      case 'nebula': {
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) { const x = cx + Math.cos(t * 0.3 + i * 1.3) * W * 0.3, y = cy + Math.sin(t * 0.25 + i * 2) * H * 0.2; glow(g, x, y, Math.min(W, H) * 0.4, `rgba(${[120, 200, 255, 180, 90][i]},${[140, 110, 150, 220, 200][i]},255,A)`, 0.12); }
        break;
      }
    }
    g.restore();
  }
  // "거대한" draws the whole film bigger - applied as a transform around the scene
  const mutScale = m => (m && m.id === 'giant' ? 1.28 : 1);

  /* ---------------- HUD chip + info popover (with dev controls locally) ---------------- */
  let chip = null, pop = null;
  function paintChip() {
    if (G.config.viewer || !chip) return;
    const w = current(), reg = region(G.state.zone), s = store()[reg.id];
    const left = s ? Math.max(0, (s.until - Date.now()) / 1000) : 0;
    const bossUp = w.boss && G.boss && G.boss.available && G.boss.available();
    chip.hidden = false; chip.style.setProperty('--wc', w.color);
    chip.classList.toggle('boss', !!bossUp);
    chip.innerHTML = `${G.icon(w.icon, 14)}<b>${w.name}</b><em>${bossUp ? '보스 출현!' : G.fmtTime(left)}</em>`;
  }
  function openPop() {
    const w = current(), reg = region(G.state.zone), s = store()[reg.id], m = w.mut && D.mutations[w.mut];
    const left = s ? Math.max(0, (s.until - Date.now()) / 1000) : 0;
    const table = (!isDay() && reg.night) ? reg.night : reg.day, tot = Object.values(table).reduce((a, b) => a + b, 0);
    const bossUp = w.boss && G.boss && G.boss.available && G.boss.available();
    pop.style.setProperty('--wc', w.color);
    pop.innerHTML = `<div class="wxh">${G.icon(w.icon, 22)}<div><small>${reg.id === 'surface' ? (isDay() ? '낮' : '밤') + ' · 지상' : reg.id === 'deep' ? '지하 깊은 곳' : '공허'}</small><b>${w.name}</b></div><em>${G.fmtTime(left)}</em></div>
      <p>${w.desc}</p>
      ${m ? `<div class="wxm" style="--mc:${m.color}"><span>변이</span><b>${m.name}</b><i>1천만대 이상 · ${Math.round(m.chance * 100)}% · 보상 x${m.mul}</i></div>` : '<div class="wxm off"><span>변이</span><b>없음</b></div>'}
      ${bossUp ? '<button class="buy bevel wxboss" data-wxboss="1"><span>보스에 맞서기</span></button>' : ''}
      <div class="wxtable">${Object.keys(table).filter(k => table[k] > 0).map(k => `<span style="--c:${D.weathers[k].color}" class="${k === w.id ? 'on' : ''}">${D.weathers[k].name}<i>${(table[k] / tot * 100).toFixed(table[k] / tot < 0.01 ? 1 : 0)}%</i></span>`).join('')}</div>
      ${G.config.dev ? `<div class="wxdev"><small>DEV · 날씨 바꾸기</small>${Object.keys(table).map(k => `<button data-wxset="${k}">${D.weathers[k].name}</button>`).join('')}${reg.night ? Object.keys(reg.night).filter(k => !table[k]).map(k => `<button data-wxset="${k}">${D.weathers[k].name}</button>`).join('') : ''}</div>` : ''}`;
    pop.hidden = false; void pop.offsetWidth; pop.classList.add('show');
  }
  function closePop() { pop.classList.remove('show'); setTimeout(() => { if (!pop.classList.contains('show')) pop.hidden = true; }, 200); }

  G.weather = {
    current, region: () => region(G.state.zone), isDay, mul, rollMutation, mutOverlay, mutScale,
    drawBack: (g, W, H, t) => paint('back', g, W, H, t), drawFront: (g, W, H, t) => paint('front', g, W, H, t),
    left: () => { const s = store()[region(G.state.zone).id]; return s ? Math.max(0, (s.until - Date.now()) / 1000) : 0; },
    set: id => { const reg = region(G.state.zone); setWeather(reg.id, id); },
    instance: () => store()[region(G.state.zone).id],
  };

  G.on('ready', () => {
    if (G.config.viewer) return;
    chip = document.getElementById('wxChip'); pop = document.getElementById('wxPop');
    tick(); paintChip();
    setInterval(() => { tick(); paintChip(); }, 1000);
    chip.addEventListener('click', () => { G.audio.init(); G.audio.tab(); if (pop.classList.contains('show')) closePop(); else openPop(); });
    pop.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.wxset) { G.weather.set(b.dataset.wxset); closePop(); paintChip(); }
      else if (b.dataset.wxboss) { closePop(); G.boss && G.boss.prompt(true); }
    });
    document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && !chip.contains(e.target)) closePop(); });
  });
  G.on('zone', () => { tick(); paintChip(); });
  G.on('weather', paintChip);
})();
