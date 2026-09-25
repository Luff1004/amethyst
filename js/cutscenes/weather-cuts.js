/*
  WEATHER + BOSS minerals. Never part of the secret/divine counts.
    weather exclusives (1 in 100억, maps 1-2, only roll while their weather is up - and while that sky
    is up, the regular secrets can't drop at all, see C.roll):
      무지개 → 프리즘 아크 · THE SOLAR → 솔라 코로나 · THE MOONLIGHT → 월광석
    boss minerals (never rolled - the reward for beating a boss, js/boss.js):
      크롤러 → 사구의 심장 · 보이드 워처 → 워처의 눈
  Pure picture, no captions: each one a hand-built film on the TX kit, same engine as every other scene.
*/
(() => {
  const { E, seg, rng, lerp } = G;
  const TAU = Math.PI * 2;
  const fr = v => v - Math.floor(v);
  const bump = (p, a, b) => G.tx.bump(p, a, b);
  const ob = k => (k <= 0 ? 0 : E.outBack(k));          // outBack(0) isn't exactly 0 - keep hidden things hidden
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  const hex = (h, s, l) => { // hsl -> #hex (TX.glow wants hex)
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  const reg = o => G.cutscenes.register(Object.assign({ odds: 1e10, tier: 'secret', duration: 18000, revealAt: 0.68, captions: [] }, o));

  /* ---------------- shared brushes ---------------- */
  // light rays fanning out from a point
  function rays(g, x, y, n, len, col, a, rot = 0, width = 0.05) {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const ang = rot + i / n * TAU, w = width * (0.6 + 0.4 * Math.sin(i * 3.7)), l = len * (0.7 + 0.3 * Math.sin(i * 5.1));
      const gr = g.createLinearGradient(x, y, x + Math.cos(ang) * l, y + Math.sin(ang) * l);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a * (0.5 + 0.5 * Math.sin(i * 2.3 + rot * 3));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang - w) * l, y + Math.sin(ang - w) * l); g.lineTo(x + Math.cos(ang + w) * l, y + Math.sin(ang + w) * l); g.fill();
    }
    g.restore();
  }
  function shock(g, x, y, k, r, col, w) { if (k <= 0 || k >= 1) return; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.globalAlpha = 1 - k; g.lineWidth = w * (1 - k) + 1; g.beginPath(); g.arc(x, y, r * E.outCubic(k), 0, TAU); g.stroke(); g.restore(); }
  // a soft round puff (clouds, mist, dust)
  function puff(g, x, y, r, rgb, a) { if (a <= 0 || r <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.6, `rgba(${rgb},${a * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // four-point glint
  function glint(g, x, y, r, col, a) {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a); g.fillStyle = col;
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.12, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.12, y); g.fill();
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y + r * 0.12); g.lineTo(x + r, y); g.lineTo(x, y - r * 0.12); g.fill();
    g.restore();
  }
  // a letterbox-free camera push around a point
  function push(g, x, y, s) { g.translate(x, y); g.scale(s, s); g.translate(-x, -y); }

  /* ======================= 무지개 · 프리즘 아크 ======================= */
  {
    const DR = (r => Array.from({ length: 180 }, () => [r(), r(), r()]))(rng(11));
    const CL = (r => Array.from({ length: 16 }, () => ({ x: r(), y: r() * 0.34, s: 0.11 + r() * 0.12, n: 3 + Math.floor(r() * 3), sd: r() * 99 })))(rng(5));
    const GR = (r => Array.from({ length: 150 }, () => [r(), r(), r()]))(rng(19));
    reg({
      id: 'wx_rainbow', name: '프리즘 아크', weather: 'rainbow', zone: [0, 1],
      colors: ['#ff6a8a', '#6ae0ff', '#060812'],
      snd: 'rise:crystalline hit:celesta tail:chime amb:rain root:294 scale:major',
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const clear = E.inOut(seg(p, 0.1, 0.4)), hz = H * 0.72, t = time;
        g.save(); push(g, cx, cy, 1 + E.inOut(seg(p, 0, 0.66)) * 0.08);
        // sky: storm slate washing out to rinsed blue, warm at the horizon
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, `rgb(${lerp(20, 44, clear) | 0},${lerp(24, 96, clear) | 0},${lerp(34, 176, clear) | 0})`);
        sky.addColorStop(0.7, `rgb(${lerp(40, 150, clear) | 0},${lerp(46, 190, clear) | 0},${lerp(58, 226, clear) | 0})`);
        sky.addColorStop(1, `rgb(${lerp(52, 255, clear) | 0},${lerp(58, 226, clear) | 0},${lerp(68, 200, clear) | 0})`);
        g.fillStyle = sky; g.fillRect(-W, -H, W * 3, H * 3);
        // sun breaking through, god-rays combing down through the gaps
        const sx = W * 0.84, sy = H * 0.1;
        TX.glow(g, sx, sy, m * 0.9 * clear, '#fff2c8', 0.65 * clear);
        rays(g, sx, sy, 18, m * 1.6, 'rgba(255,244,210,0.3)', clear * 0.7, Math.PI * 0.55 + Math.sin(t * 0.0002) * 0.05, 0.022);
        // secondary + primary bow (outer one fainter, colours reversed, a darker band between them)
        const arcK = E.inOut(seg(p, 0.22, 0.5)), pull = E.inCubic(seg(p, 0.54, 0.68)), ax = cx, ay = hz + m * 0.14, AR = Math.max(W, H) * 0.56, bw = m * 0.026;
        if (arcK > 0) {
          const a0 = Math.PI, a1 = Math.PI + Math.PI * arcK;
          g.save();
          g.strokeStyle = `rgba(10,20,40,${0.12 * arcK})`; g.lineWidth = AR * 0.2; g.beginPath(); g.arc(ax, ay, AR * 1.14, a0, a1); g.stroke();
          g.globalCompositeOperation = 'lighter';
          for (let b = 0; b < 7; b++) {
            const hue = b / 6 * 275;
            g.strokeStyle = hsl(hue, 95, 62, 0.14 * arcK * (1 - pull)); g.lineWidth = bw * 1.1;
            g.beginPath(); g.arc(ax, ay, AR * 1.26 + b * bw, a0, a1); g.stroke();
          }
          const R0 = AR * (1 - pull * 0.92);
          g.strokeStyle = `rgba(255,255,255,${0.1 * arcK})`; g.lineWidth = AR * 0.18; g.beginPath(); g.arc(ax, ay, Math.max(1, R0 - 7 * bw - AR * 0.09), a0, a1); g.stroke();
          for (let b = 0; b < 7; b++) {
            const hue = b / 6 * 275, r = Math.max(1, R0 - b * bw * (1 - pull * 0.6));
            g.strokeStyle = hsl(hue, 100, 60, 0.5 * (1 - pull * 0.3)); g.lineWidth = bw * 1.15;
            g.beginPath(); g.arc(ax, ay, r, a0, a1); g.stroke();
          }
          g.restore();
        }
        // soft storm clouds, lit from the sun side as they part
        for (const c of CL) {
          const dir = c.x < 0.5 ? -1 : 1, x = c.x * W + dir * clear * W * 0.55 + Math.sin(t * 0.0002 + c.sd) * u * 2, y = c.y * H, r = c.s * m;
          const lit = clear * 0.8, col = `${lerp(46, 250, lit) | 0},${lerp(50, 246, lit) | 0},${lerp(62, 250, lit) | 0}`;
          for (let k = 0; k < c.n; k++) puff(g, x + (k - c.n / 2) * r * 0.55, y + Math.sin(k * 2.1 + c.sd) * r * 0.2, r * (0.8 + 0.3 * Math.sin(k + c.sd)), col, 0.9 - clear * 0.55);
        }
        // hills: far haze, near wet meadow
        const hill = (base, amp, f, ph, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(-W, H * 2); for (let k = 0; k <= 40; k++) { const x = -W * 0.2 + k / 40 * W * 1.4; g.lineTo(x, base - Math.sin(k * f + ph) * amp - Math.sin(k * f * 0.41 + ph) * amp * 0.7); } g.lineTo(W * 2, H * 2); g.fill(); };
        hill(hz - m * 0.03, m * 0.04, 0.35, 1, `rgb(${lerp(30, 110, clear) | 0},${lerp(38, 150, clear) | 0},${lerp(50, 170, clear) | 0})`);
        hill(hz + m * 0.02, m * 0.05, 0.25, 4, `rgb(${lerp(16, 46, clear) | 0},${lerp(26, 104, clear) | 0},${lerp(24, 70, clear) | 0})`);
        // grass blades in the foreground, each tip holding a drop that catches the colour
        g.lineCap = 'round';
        for (const [a, b, c] of GR) {
          const x = a * W * 1.2 - W * 0.1, base = H + m * 0.02, h = m * (0.05 + b * 0.09), sw = Math.sin(t * 0.0012 + a * 20) * u * 0.8;
          g.strokeStyle = `rgb(${lerp(8, 28, clear) | 0},${lerp(18, 70, clear) | 0},${lerp(14, 40, clear) | 0})`; g.lineWidth = u * (0.25 + c * 0.3);
          g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + sw * 0.3, base - h * 0.6, x + sw, base - h); g.stroke();
          if (c > 0.55) glint(g, x + sw, base - h, u * (0.6 + c), hsl((a * 900 + t * 0.05) % 360, 100, 80), clear * (0.4 + 0.6 * Math.sin(t * 0.004 + a * 30)));
        }
        // rain, thinning out - then the last drops falling as prismatic sparks
        const rainA = 1 - clear;
        if (rainA > 0.02) {
          g.strokeStyle = `rgba(200,220,255,${0.4 * rainA})`; g.lineWidth = Math.max(1, u * 0.12); g.beginPath();
          for (const [a, b, c] of DR) { const x = (a * W + t * 0.06) % W, y = (b * H + t * (0.9 + c)) % H; g.moveTo(x, y); g.lineTo(x - u * 0.6, y + u * 3.2); }
          g.stroke();
        }
        if (clear > 0.3) for (let i = 0; i < 40; i++) { const [a, b, c] = DR[i], x = a * W, y = (b * H + t * 0.08 * (0.4 + c)) % H; glint(g, x, y, u * 0.7, hsl((i * 47 + t * 0.1) % 360, 100, 75), (clear - 0.3) * 0.9 * (0.5 + 0.5 * Math.sin(t * 0.006 + i))); }
        // the bow pours down into one point: seven streaks spiralling inward
        if (pull > 0 && pull < 1) {
          g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
          for (let b = 0; b < 7; b++) {
            const a = -Math.PI / 2 + (b - 3) * 0.5 + pull * 5, r = m * 0.7 * (1 - pull);
            g.strokeStyle = hsl(b / 6 * 275, 100, 65, 0.8 * (1 - pull)); g.lineWidth = bw * (1 - pull * 0.5);
            g.beginPath(); g.arc(cx, cy, Math.max(1, r), a, a + 1.4 * (1 - pull)); g.stroke();
          }
          g.restore();
        }
        // the stone: white light in from the top-left, split into a spectrum fanning out the other side
        const grow = ob(seg(p, 0.6, 0.72)), rv = seg(p, 0.66, 1);
        if (grow > 0) {
          const hue = (t * 0.05) % 360, gr = m * 0.16 * grow;
          g.save(); g.globalCompositeOperation = 'lighter';
          const inG = g.createLinearGradient(cx - m, cy - m * 0.7, cx, cy); inG.addColorStop(0, 'rgba(255,255,255,0)'); inG.addColorStop(1, `rgba(255,255,255,${0.7 * grow})`);
          g.strokeStyle = inG; g.lineWidth = u * 0.8; g.beginPath(); g.moveTo(cx - m, cy - m * 0.7); g.lineTo(cx, cy); g.stroke();
          for (let b = 0; b < 7; b++) {
            const a = 0.35 + b * 0.075, L = m * 1.3 * grow, bg = g.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
            bg.addColorStop(0, hsl(b / 6 * 275, 100, 62, 0.75)); bg.addColorStop(1, hsl(b / 6 * 275, 100, 62, 0));
            g.fillStyle = bg; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.035) * L, cy + Math.sin(a - 0.035) * L); g.lineTo(cx + Math.cos(a + 0.035) * L, cy + Math.sin(a + 0.035) * L); g.fill();
          }
          g.restore();
          TX.glow(g, cx, cy, m * 0.6 * grow, hex(hue, 90, 60), 0.45);
          // seven prism shards orbiting on a tilted ring, each its own colour
          for (let b = 0; b < 7; b++) {
            const a = t * 0.0009 + b / 7 * TAU, rx = m * 0.3 * grow, ry = m * 0.08 * grow, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, front = Math.sin(a) > 0;
            if (front) continue;
            TX.gem(g, 'prism', x, y, m * 0.022 * grow, b / 7 * 300, t + b * 500, { glow: 0.6 });
          }
          TX.gem(g, 'brilliant', cx, cy, gr, hue, t, { glow: 1.25 });
          for (let b = 0; b < 7; b++) {
            const a = t * 0.0009 + b / 7 * TAU, x = cx + Math.cos(a) * m * 0.3 * grow, y = cy + Math.sin(a) * m * 0.08 * grow;
            if (Math.sin(a) <= 0) continue;
            TX.gem(g, 'prism', x, y, m * 0.026 * grow, b / 7 * 300, t + b * 500, { glow: 0.7 });
          }
          glint(g, cx - gr * 0.4, cy - gr * 0.5, gr * 0.9 * (0.6 + 0.4 * Math.sin(t * 0.004)), '#ffffff', 0.9 * grow);
          shock(g, cx, cy, seg(p, 0.66, 0.78), m * 0.9, '#ffffff', u * 2);
          shock(g, cx, cy, seg(p, 0.69, 0.84), m * 1.2, hex(hue + 120, 100, 70), u * 1.5);
        }
        g.restore();
        TX.flash(g, e, bump(p, 0.655, 0.71) * 0.85, '#ffe0ff');
        if (rv > 0) TX.dust(g, e, '#ffffff', 70, 7, 0.003);
        TX.vignette(g, e, 0.5);
      },
    });
  }

  /* ======================= THE SOLAR · 솔라 코로나 ======================= */
  {
    const ST = (r => Array.from({ length: 180 }, () => [r(), r(), r()]))(rng(3));
    const CS = (r => Array.from({ length: 140 }, () => [r(), r(), r()]))(rng(17));
    const MT = (r => Array.from({ length: 30 }, () => r()))(rng(23));
    reg({
      id: 'wx_solar', name: '솔라 코로나', weather: 'solar', zone: [0, 1],
      colors: ['#ffd25a', '#ff5a1a', '#050204'],
      snd: 'rise:chant hit:orchestra tail:choirpad amb:space root:220 scale:major',
      draw(g, e) {
        const { p, u, cx, W, H, time } = e, TX = G.tx, m = Math.min(W, H), t = time, cy = e.cy - m * 0.04;
        const moonK = E.inOut(seg(p, 0.03, 0.3)), leave = E.inCubic(seg(p, 0.6, 0.68)), dark = Math.max(0, E.inOut(seg(p, 0.04, 0.29)) - leave * 0.4);
        const SR = m * 0.15;
        // the sky: noon blue drained to an eerie 360-degree twilight, the horizon glowing all round
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, `rgb(${lerp(70, 3, dark) | 0},${lerp(130, 4, dark) | 0},${lerp(210, 14, dark) | 0})`);
        sky.addColorStop(0.72, `rgb(${lerp(140, 24, dark) | 0},${lerp(180, 16, dark) | 0},${lerp(230, 40, dark) | 0})`);
        sky.addColorStop(0.86, `rgb(${lerp(200, 190, dark) | 0},${lerp(220, 90, dark) | 0},${lerp(240, 50, dark) | 0})`);
        sky.addColorStop(1, `rgb(${lerp(120, 40, dark) | 0},${lerp(130, 20, dark) | 0},${lerp(140, 20, dark) | 0})`);
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        // stars and two planets come out in the daytime dark
        if (dark > 0.45) {
          const k = (dark - 0.45) / 0.55;
          for (const [a, b, c] of ST) { g.fillStyle = `rgba(255,255,255,${k * (0.2 + 0.7 * c) * (0.6 + 0.4 * Math.sin(t * 0.003 + a * 50))})`; g.fillRect(a * W, b * H * 0.8, u * 0.18, u * 0.18); }
          glint(g, cx - m * 0.42, cy + m * 0.3, u * 1.6, '#fff4d0', k); glint(g, cx + m * 0.36, cy - m * 0.38, u * 1.2, '#ffd0a0', k * 0.8);
        }
        // the corona: long pearly streamers plus hundreds of fine plume lines
        const cor = E.outCubic(seg(p, 0.27, 0.4)) * (1 - leave * 0.7);
        if (cor > 0) {
          g.save(); g.globalCompositeOperation = 'lighter';
          TX.glow(g, cx, cy, SR * 4.2 * cor, '#ffe8c0', 0.45);
          const cr = rng(17);
          for (let i = 0; i < 40; i++) {
            const a = i / 40 * TAU + cr() * 0.12, eq = 1 + 1.2 * Math.abs(Math.cos(a)), len = SR * (1.2 + cr() * 2.4 * eq + Math.sin(t * 0.0006 + i) * 0.25) * cor;
            const gr = g.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
            gr.addColorStop(0, 'rgba(255,252,236,0.45)'); gr.addColorStop(0.35, 'rgba(255,230,190,0.14)'); gr.addColorStop(1, 'rgba(255,210,150,0)');
            g.fillStyle = gr; const w = 0.04 + cr() * 0.07, bend = (cr() - 0.5) * 0.4;
            g.beginPath(); g.moveTo(cx + Math.cos(a - 0.18) * SR, cy + Math.sin(a - 0.18) * SR);
            g.quadraticCurveTo(cx + Math.cos(a + bend) * len * 0.55, cy + Math.sin(a + bend) * len * 0.55, cx + Math.cos(a + w + bend) * len, cy + Math.sin(a + w + bend) * len);
            g.lineTo(cx + Math.cos(a + 0.18) * SR, cy + Math.sin(a + 0.18) * SR); g.fill();
          }
          g.lineWidth = Math.max(1, u * 0.08);
          for (const [a0, b, c] of CS) {
            const a = a0 * TAU, l = SR * (0.15 + b * 0.9 * (1 + Math.abs(Math.cos(a)))) * cor, sw = (c - 0.5) * 0.2;
            g.strokeStyle = `rgba(255,245,225,${0.18 + c * 0.2})`;
            g.beginPath(); g.moveTo(cx + Math.cos(a) * SR, cy + Math.sin(a) * SR); g.quadraticCurveTo(cx + Math.cos(a + sw) * (SR + l * 0.6), cy + Math.sin(a + sw) * (SR + l * 0.6), cx + Math.cos(a + sw * 2) * (SR + l), cy + Math.sin(a + sw * 2) * (SR + l)); g.stroke();
          }
          // chromosphere: a razor-thin pink rim
          g.strokeStyle = `rgba(255,90,130,${0.8 * cor})`; g.lineWidth = u * 0.35; g.beginPath(); g.arc(cx, cy, SR * 1.01, 0, TAU); g.stroke();
          // prominences: red loops of plasma on the rim
          for (let i = 0; i < 6; i++) {
            const a = i * 1.13 + 0.4, pk = bump(p, 0.3 + i * 0.025, 0.63 + i * 0.01);
            if (pk <= 0) continue;
            const s = 0.08 + (i % 3) * 0.04, x0 = cx + Math.cos(a - s) * SR, y0 = cy + Math.sin(a - s) * SR, x1 = cx + Math.cos(a + s) * SR, y1 = cy + Math.sin(a + s) * SR;
            const hgt = SR * (0.2 + pk * 0.35 + (i % 2) * 0.15), hx = cx + Math.cos(a) * (SR + hgt), hy = cy + Math.sin(a) * (SR + hgt);
            const path = new Path2D(); path.moveTo(x0, y0); path.bezierCurveTo(hx + Math.cos(a - Math.PI / 2) * hgt * 0.8, hy + Math.sin(a - Math.PI / 2) * hgt * 0.8, hx + Math.cos(a + Math.PI / 2) * hgt * 0.8, hy + Math.sin(a + Math.PI / 2) * hgt * 0.8, x1, y1);
            TX.neon(g, path, '#ff3a4a', u * 0.55 * pk, 0.9, '#ffc0a0');
          }
          g.restore();
        }
        // the sun before and after totality, limb-darkened
        const sunA = Math.min(1, 1 - seg(p, 0.24, 0.3) + leave);
        if (sunA > 0) {
          TX.glow(g, cx, cy, SR * 5, '#fff0b0', 0.85 * sunA);
          const sg = g.createRadialGradient(cx, cy, 0, cx, cy, SR); sg.addColorStop(0, `rgba(255,255,250,${sunA})`); sg.addColorStop(0.8, `rgba(255,244,210,${sunA})`); sg.addColorStop(1, `rgba(255,200,120,${sunA})`);
          g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, SR, 0, TAU); g.fill();
        }
        // the moon crossing - a black disc with the faintest earthshine
        const mx = lerp(cx - SR * 2.3, cx, moonK) + leave * SR * 2.6;
        g.fillStyle = '#030204'; g.beginPath(); g.arc(mx, cy, SR * 1.012, 0, TAU); g.fill();
        g.fillStyle = `rgba(60,70,100,${0.08 * dark})`; g.beginPath(); g.arc(mx - SR * 0.2, cy - SR * 0.2, SR * 0.7, 0, TAU); g.fill();
        // Baily's beads right before and after totality: sunlight through the moon's valleys
        const beads = bump(p, 0.27, 0.31) + bump(p, 0.585, 0.62);
        if (beads > 0) for (let i = 0; i < 7; i++) { const a = (p < 0.5 ? 0.2 : Math.PI + 0.2) + (i - 3) * 0.1; glint(g, cx + Math.cos(a) * SR, cy + Math.sin(a) * SR, u * (1.5 + (i % 3)), '#ffffff', beads * (0.5 + 0.5 * Math.sin(i * 7 + t * 0.01))); }
        // diamond ring as the moon leaves
        const ring = bump(p, 0.6, 0.665);
        if (ring > 0) { const dx = cx + Math.cos(-2.3) * SR, dy = cy + Math.sin(-2.3) * SR; TX.glow(g, dx, dy, m * 0.55 * ring, '#ffffff', 1); rays(g, dx, dy, 10, m * 0.9 * ring, 'rgba(255,255,255,0.75)', ring, 0.2, 0.012); glint(g, dx, dy, m * 0.3 * ring, '#ffffff', ring); }
        // the land below: a mountain line, and the moon's shadow sweeping over it
        g.fillStyle = `rgb(${lerp(40, 6, dark) | 0},${lerp(50, 5, dark) | 0},${lerp(70, 12, dark) | 0})`;
        g.beginPath(); g.moveTo(0, H); MT.forEach((v, i) => g.lineTo(i / (MT.length - 1) * W, H * 0.86 - v * m * 0.07 - Math.sin(i * 0.7) * m * 0.02)); g.lineTo(W, H); g.fill();
        // reveal: the corona folds down into the stone
        const rv = ob(seg(p, 0.66, 0.78)), rvL = seg(p, 0.66, 1);
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 1.2, '#ffb030', 0.55 * rv);
          rays(g, cx, cy, 28, m * 1.5 * rv, 'rgba(255,214,130,0.42)', rv, t * 0.00012, 0.03);
          g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
          for (let ring2 = 0; ring2 < 2; ring2++) {
            const R = m * (0.23 + ring2 * 0.07) * rv, n = 24 + ring2 * 12, dir = ring2 ? -1 : 1;
            g.strokeStyle = ring2 ? 'rgba(255,150,60,0.55)' : 'rgba(255,220,120,0.75)'; g.lineWidth = u * (ring2 ? 0.2 : 0.3);
            for (let i = 0; i < n; i++) { const a = i / n * TAU + t * 0.0003 * dir, l = (i % 3 === 0 ? 0.05 : 0.025) * m; g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R + l), cy + Math.sin(a) * (R + l)); g.stroke(); }
          }
          g.restore();
          // embers rising off it
          for (let i = 0; i < 30; i++) { const k = fr(t * 0.0003 + i * 0.137), a = i * 2.39; TX.glow(g, cx + Math.cos(a) * m * (0.12 + k * 0.3), cy + Math.sin(a) * m * 0.1 - k * m * 0.35, u * 1.2, '#ffb040', rvL * (1 - k)); }
          TX.gem(g, 'star', cx, cy, m * 0.14 * rv, 42, t, { glow: 1.4 });
          glint(g, cx + m * 0.05, cy - m * 0.06, m * 0.1 * (0.7 + 0.3 * Math.sin(t * 0.005)), '#ffffff', rv);
        }
        shock(g, cx, cy, seg(p, 0.66, 0.76), m, '#fff0c0', u * 3);
        shock(g, cx, cy, seg(p, 0.7, 0.86), m * 1.4, '#ff9a40', u * 2);
        TX.flash(g, e, bump(p, 0.64, 0.7), '#ffd070');
        TX.vignette(g, e, 0.62);
      },
    });
  }

  /* ======================= THE MOONLIGHT · 월광석 ======================= */
  {
    const ST = (r => Array.from({ length: 200 }, () => [r(), r(), r()]))(rng(8));
    const FF = (r => Array.from({ length: 26 }, () => [r(), r(), r()]))(rng(44));
    const RD = (r => Array.from({ length: 40 }, () => [r(), r(), r()]))(rng(29));
    const TR = (r => Array.from({ length: 90 }, () => [r(), r()]))(rng(21));
    reg({
      id: 'wx_moonlight', name: '월광석', weather: 'moonlight', zone: [0, 1],
      colors: ['#cfe4ff', '#6a8aff', '#02040c'],
      snd: 'rise:glass hit:celesta tail:pad amb:water root:196 scale:minor',
      draw(g, e) {
        const { p, u, cx, W, H, time } = e, TX = G.tx, m = Math.min(W, H), hz = H * 0.58, t = time;
        g.save(); push(g, cx, hz, 1 + E.inOut(seg(p, 0, 0.66)) * 0.07);
        const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#01020a'); sky.addColorStop(0.7, '#08122c'); sky.addColorStop(1, '#122648');
        g.fillStyle = sky; g.fillRect(-W, -H, W * 3, hz + H);
        // stars (and their reflections, stretched)
        for (const [a, b, c] of ST) {
          const x = a * W, y = b * hz * 0.95, al = (0.2 + 0.8 * c) * (0.6 + 0.4 * Math.sin(t * 0.002 + a * 90));
          g.fillStyle = `rgba(220,230,255,${al})`; g.fillRect(x, y, u * 0.17, u * 0.17);
          if (c > 0.5) { g.fillStyle = `rgba(200,215,255,${al * 0.35})`; g.fillRect(x + Math.sin(t * 0.002 + b * 40) * u * 0.3, hz + (hz - y) * 0.85, u * 0.17, u * 0.5); }
        }
        // the moon rises, with a faint 22-degree halo and thin clouds sliding across its face
        const rise = E.outCubic(seg(p, 0.04, 0.4)), MR = m * 0.11, my = lerp(hz + MR, H * 0.19, rise);
        TX.glow(g, cx, my, m * 1.0, '#8aa8ff', 0.35 * rise);
        g.strokeStyle = `rgba(190,210,255,${0.12 * rise})`; g.lineWidth = u * 0.9; g.beginPath(); g.arc(cx, my, MR * 3.2, 0, TAU); g.stroke();
        TX.glow(g, cx, my, MR * 2.3, '#e8f0ff', 0.75);
        g.save(); g.beginPath(); g.rect(-W, -H, W * 3, hz + H); g.clip();
        const mg = g.createRadialGradient(cx - MR * 0.35, my - MR * 0.35, 0, cx, my, MR);
        mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.65, '#e4ecff'); mg.addColorStop(1, '#a0b2dc');
        g.fillStyle = mg; g.beginPath(); g.arc(cx, my, MR, 0, TAU); g.fill();
        const cr = rng(4); g.fillStyle = 'rgba(110,130,180,0.22)';
        for (let i = 0; i < 11; i++) { const a = cr() * TAU, d = cr() * MR * 0.75; g.beginPath(); g.arc(cx + Math.cos(a) * d, my + Math.sin(a) * d, MR * (0.05 + cr() * 0.16), 0, TAU); g.fill(); }
        for (let i = 0; i < 3; i++) { const x = fr(t * 0.00002 + i * 0.37) * W * 1.6 - W * 0.3, y = H * (0.12 + i * 0.07); puff(g, x, y, m * 0.18, '90,110,160', 0.35); puff(g, x + m * 0.12, y + m * 0.01, m * 0.13, '140,160,210', 0.25 * rise); }
        g.restore();
        // pine ridge
        g.fillStyle = '#02050e'; g.beginPath(); g.moveTo(-W, hz);
        for (const [a, b] of TR) { const x = a * W * 1.4 - W * 0.2, h = m * (0.03 + b * 0.08) * (Math.abs(x - cx) > W * 0.18 ? 1 : 0.35); g.lineTo(x - u * 1.2, hz); g.lineTo(x, hz - h); g.lineTo(x + u * 1.2, hz); }
        g.lineTo(W * 2, hz); g.lineTo(W * 2, hz + 2); g.lineTo(-W, hz + 2); g.fill();
        // the lake
        const wg = g.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, '#0c1834'); wg.addColorStop(1, '#010208');
        g.fillStyle = wg; g.fillRect(-W, hz, W * 3, H * 2);
        // moon path: broken, shimmering strokes that widen toward us
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 90; i++) {
          const k = (i / 90) ** 1.4, y = hz + k * (H - hz), w = (MR * 0.5 + (y - hz) * 0.4) * rise * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + t * 0.0025)));
          const off = Math.sin(t * 0.0018 + i * 0.9) * u * (1 + k * 3);
          g.fillStyle = `rgba(205,222,255,${0.55 * rise * (1 - k * 0.7)})`; g.fillRect(cx - w / 2 + off, y, w, Math.max(1, u * (0.15 + k * 0.3)));
        }
        g.restore();
        // mist drifting low over the water
        for (let i = 0; i < 7; i++) puff(g, fr(t * 0.00003 * (1 + i * 0.2) + i * 0.29) * W * 1.6 - W * 0.3, hz + m * (0.01 + (i % 3) * 0.02), m * 0.22, '150,170,220', 0.12);
        // the reflection peels off the water and rises - the stone itself
        const lift = E.inOut(seg(p, 0.42, 0.66)), rv = ob(seg(p, 0.64, 0.76)), gy = e.cy, ry = lerp(hz + m * 0.18, gy, lift);
        if (lift > 0) {
          // a column of water drawn up with it, breaking into drops
          g.save(); g.globalCompositeOperation = 'lighter';
          const col = g.createLinearGradient(0, ry, 0, hz); col.addColorStop(0, `rgba(190,215,255,${0.35 * (1 - rv)})`); col.addColorStop(1, 'rgba(190,215,255,0)');
          g.fillStyle = col; g.fillRect(cx - m * 0.02 * (1 - lift * 0.5), ry, m * 0.04 * (1 - lift * 0.5), Math.max(0, hz - ry));
          for (let i = 0; i < 26; i++) { const k = fr(t * 0.0005 + i / 26), x = cx + Math.sin(i * 5.3) * m * 0.05 * k; g.fillStyle = `rgba(210,230,255,${0.7 * (1 - k) * lift})`; g.beginPath(); g.arc(x, lerp(ry, hz, k * k), u * (0.25 + (i % 3) * 0.1), 0, TAU); g.fill(); }
          for (let i = 0; i < 4; i++) { const k = fr(t * 0.0004 + i / 4); g.strokeStyle = `rgba(190,215,255,${0.5 * (1 - k)})`; g.lineWidth = u * 0.2; g.beginPath(); g.ellipse(cx, hz + m * 0.03, m * 0.6 * k, m * 0.05 * k, 0, 0, TAU); g.stroke(); }
          g.restore();
          TX.glow(g, cx, ry, m * 0.45, '#b8d0ff', 0.7 * lift);
          if (rv <= 0) { g.fillStyle = `rgba(232,242,255,${lift})`; g.beginPath(); g.arc(cx, ry, MR * 0.45, 0, TAU); g.fill(); }
        }
        // reeds in the foreground, swaying
        g.strokeStyle = '#010308'; g.lineCap = 'round';
        for (const [a, b, c] of RD) {
          const side = a < 0.5 ? a * 0.5 : 0.75 + (a - 0.5) * 0.5, x = side * W, base = H + u, h = m * (0.12 + b * 0.22), sw = Math.sin(t * 0.0009 + a * 12) * u * 1.4;
          g.lineWidth = u * (0.3 + c * 0.3); g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + sw * 0.4, base - h * 0.6, x + sw, base - h); g.stroke();
          if (c > 0.6) { g.fillStyle = '#010308'; g.beginPath(); g.ellipse(x + sw, base - h - u * 1.4, u * 0.55, u * 1.8, sw * 0.02, 0, TAU); g.fill(); }
        }
        // fireflies
        for (const [a, b, c] of FF) {
          const x = (a * W + Math.sin(t * 0.0006 + c * 30) * m * 0.06), y = hz - m * 0.05 + b * (H - hz) * 0.9 + Math.cos(t * 0.0008 + a * 30) * m * 0.04, blink = Math.max(0, Math.sin(t * 0.002 + c * 40));
          TX.glow(g, x, y, u * 2.4, '#c8f0ff', blink * 0.8 * (0.4 + rise * 0.6));
        }
        g.restore();
        if (rv > 0) {
          rays(g, cx, gy, 18, m * 1.3 * rv, 'rgba(200,220,255,0.38)', rv, -t * 0.0001, 0.025);
          // crescent rings turning slowly around it
          g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
          for (let i = 0; i < 3; i++) {
            const R = m * (0.2 + i * 0.05) * rv, a = t * 0.0005 * (i % 2 ? -1 : 1) + i * 2;
            g.strokeStyle = `rgba(200,220,255,${0.55 - i * 0.12})`; g.lineWidth = u * (0.45 - i * 0.1);
            g.beginPath(); g.arc(cx, gy, R, a, a + Math.PI * 0.9); g.stroke();
          }
          g.restore();
          TX.gem(g, 'octa', cx, gy, m * 0.14 * rv, 222, t, { glow: 1.2 });
          glint(g, cx - m * 0.04, gy - m * 0.07, m * 0.09 * (0.7 + 0.3 * Math.sin(t * 0.004)), '#ffffff', rv);
        }
        shock(g, cx, gy, seg(p, 0.66, 0.78), m * 0.9, '#cfe0ff', u * 2);
        TX.flash(g, e, bump(p, 0.64, 0.7) * 0.75, '#b0c8ff');
        TX.dust(g, e, '#cfe0ff', 50, 12, 0.002);
        TX.vignette(g, e, 0.62);
      },
    });
  }

  /* ---------------- boss minerals ---------------- */
  const boss = o => reg(Object.assign({ boss: true, zone: -1, odds: 1e10, tier: 'secret' }, o));

  /* ======================= 크롤러 · 사구의 심장 ======================= */
  {
    const SD = (r => Array.from({ length: 240 }, () => [r(), r(), r()]))(rng(31));
    const ST = (r => Array.from({ length: 90 }, () => [r(), r()]))(rng(32));
    boss({
      id: 'boss_crawler', name: '사구의 심장', bossName: '크롤러',
      colors: ['#ffc05a', '#b8601a', '#0a0502'],
      snd: 'rise:granular hit:quake tail:echo amb:wind root:147 scale:minor',
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H), hz = H * 0.62, t = time;
        const calm = E.inOut(seg(p, 0.02, 0.3));
        const beatK = Math.pow(Math.max(0, Math.sin(t * 0.006)), 12), show = seg(p, 0.36, 0.6), rise = ob(seg(p, 0.62, 0.76));
        // dusk after the storm: violet overhead, a low bleeding sun on the horizon, first stars
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, `rgb(${lerp(70, 20, calm) | 0},${lerp(40, 12, calm) | 0},${lerp(18, 42, calm) | 0})`);
        sky.addColorStop(0.6, `rgb(${lerp(150, 110, calm) | 0},${lerp(90, 46, calm) | 0},${lerp(40, 66, calm) | 0})`);
        sky.addColorStop(1, `rgb(${lerp(200, 250, calm) | 0},${lerp(130, 120, calm) | 0},${lerp(60, 50, calm) | 0})`);
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        for (const [a, b] of ST) { g.fillStyle = `rgba(255,240,230,${calm * b * 0.8 * (0.6 + 0.4 * Math.sin(t * 0.003 + a * 70))})`; g.fillRect(a * W, b * hz * 0.5, u * 0.17, u * 0.17); }
        const sunX = W * 0.74, sunY = hz - m * 0.01;
        TX.glow(g, sunX, sunY, m * 0.95, '#ff7a2a', 0.55 * calm);
        for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(255,${200 - i * 20},${130 - i * 20},${0.9 * calm})`; g.fillRect(sunX - m * 0.075, sunY - m * 0.07 + i * m * 0.018, m * 0.15, m * 0.009); }   // the sun, sliced by heat haze
        g.save(); push(g, cx, hz, 1 + E.inOut(seg(p, 0.05, 0.62)) * 0.12);
        const dune = (base, amp, f, ph, top, bot) => {
          const gr = g.createLinearGradient(0, base - amp * 2, 0, base + m * 0.15); gr.addColorStop(0, top); gr.addColorStop(1, bot);
          g.fillStyle = gr; g.beginPath(); g.moveTo(-W * 0.2, H * 1.3);
          for (let k = 0; k <= 48; k++) { const x = -W * 0.2 + k / 48 * W * 1.4; g.lineTo(x, base - Math.sin(k * f + ph) * amp - Math.sin(k * f * 0.37 + ph * 2) * amp * 0.8); }
          g.lineTo(W * 1.2, H * 1.3); g.fill();
        };
        dune(hz - m * 0.02, m * 0.03, 0.3, 1, '#8a5430', '#5a321c');
        dune(hz + m * 0.03, m * 0.04, 0.22, 3, '#b87444', '#7a4422');
        // the heart's glow under the sand lights the carcass from beneath
        const hy = lerp(hz + m * 0.08, cy, rise), heat = (0.3 + show * 0.7) * (0.6 + beatK * 0.6);
        TX.glow(g, cx, hz + m * 0.08, m * 0.5 * heat, '#ff7a1a', 0.35 * heat * (1 - rise * 0.5));
        // the carcass: a colossal spine arching out of the sand, ribs curling up off every vertebra
        const bare = E.inOut(seg(p, 0.2, 0.58)), N = 24;
        const sp = i => { const k = i / (N - 1), a = Math.PI * (1 - k); return [cx + Math.cos(a) * m * 0.4, hz + m * 0.12 - Math.sin(a) * m * 0.46 * (0.3 + 0.7 * bare)]; };
        for (let i = 0; i < N; i++) {
          const [x, y] = sp(i), [nx, ny] = sp(Math.min(N - 1, i + 1)), a = Math.atan2(ny - y, nx - x), k = i / (N - 1), sz = m * 0.028 * (1 - Math.abs(k - 0.4) * 0.8);
          const lit = Math.max(0, 1 - Math.hypot(x - cx, y - hz) / (m * 0.5)) * heat;          // warm under-light near the heart
          const bone = `rgb(${lerp(120, 236, bare) + lit * 20 | 0},${lerp(90, 212, bare) - lit * 30 | 0},${lerp(60, 168, bare) - lit * 60 | 0})`;
          g.strokeStyle = bone; g.lineCap = 'round';
          for (const sd of [-1, 1]) {
            const rl = sz * 4.2 * (0.5 + 0.5 * bare);
            g.lineWidth = sz * 0.34; g.beginPath(); g.moveTo(x, y);
            g.quadraticCurveTo(x + Math.cos(a + sd * 1.2) * rl, y + Math.sin(a + sd * 1.2) * rl - rl * 0.6, x + Math.cos(a + sd * 2.2) * rl * 0.9, y + rl * 0.5);
            g.stroke();
            g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = sz * 0.12; g.stroke(); g.strokeStyle = bone;   // shadow line down each rib
          }
          g.save(); g.translate(x, y); g.rotate(a);
          g.fillStyle = bone; g.beginPath(); g.ellipse(0, 0, sz * 0.9, sz * 0.75, 0, 0, TAU); g.fill();
          g.fillStyle = 'rgba(60,30,10,.45)'; g.beginPath(); g.ellipse(0, sz * 0.2, sz * 0.9, sz * 0.4, 0, 0, Math.PI); g.fill();
          g.fillStyle = 'rgba(255,240,210,.25)'; g.beginPath(); g.ellipse(-sz * 0.2, -sz * 0.3, sz * 0.4, sz * 0.2, 0, 0, TAU); g.fill();
          g.beginPath(); g.moveTo(-sz * 0.3, -sz * 0.6); g.lineTo(0, -sz * 1.9); g.lineTo(sz * 0.3, -sz * 0.6); g.fillStyle = bone; g.fill();
          g.restore();
        }
        // the skull, half-buried at the left end, mandibles open
        { const [x, y] = sp(0), s2 = m * 0.1, bone = `rgb(${lerp(120, 230, bare) | 0},${lerp(90, 206, bare) | 0},${lerp(60, 160, bare) | 0})`;
          g.save(); g.translate(x - s2 * 0.3, y + s2 * 0.1); g.rotate(-0.35);
          g.fillStyle = bone;
          for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * s2 * 0.5, -s2 * 0.5); g.quadraticCurveTo(sd * s2 * 1.1, -s2 * 1.3, sd * s2 * 0.95, -s2 * 1.75); g.quadraticCurveTo(sd * s2 * 0.8, -s2 * 1.1, sd * s2 * 0.2, -s2 * 0.65); g.fill(); }
          g.beginPath(); g.ellipse(0, 0, s2, s2 * 0.75, 0, 0, TAU); g.fill();
          for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * s2 * 0.5, s2 * 0.4); g.quadraticCurveTo(sd * s2 * 1.4, s2 * 0.9, sd * s2 * 0.7, s2 * 1.5); g.quadraticCurveTo(sd * s2 * 0.9, s2 * 0.9, sd * s2 * 0.2, s2 * 0.6); g.fill(); }
          g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = u * 0.2; g.beginPath(); g.moveTo(0, -s2 * 0.75); g.lineTo(0, s2 * 0.5); g.stroke();
          g.fillStyle = '#1a0a04'; [[-0.4, -0.1, 0.18], [0.4, -0.1, 0.18], [-0.2, 0.25, 0.1], [0.2, 0.25, 0.1]].forEach(([ex, ey, er]) => { g.beginPath(); g.ellipse(ex * s2, ey * s2, er * s2, er * s2 * 0.75, 0, 0, TAU); g.fill(); });
          // a last ember in one socket, going out
          const ember = 1 - seg(p, 0.1, 0.5);
          if (ember > 0) TX.glow(g, -0.4 * s2, -0.1 * s2, s2 * 0.3, '#ff6a1a', ember * (0.6 + 0.4 * Math.sin(t * 0.01)));
          g.restore(); }
        // near dunes, burying the ends of the spine, with wind ripples
        dune(hz + m * 0.12, m * 0.05, 0.18, 5, '#d08c50', '#a0602e');
        dune(hz + m * 0.24, m * 0.05, 0.15, 7, '#e8aa6c', '#b87040');
        g.strokeStyle = 'rgba(120,60,20,.25)'; g.lineWidth = u * 0.2;
        for (let i = 0; i < 14; i++) { const y = hz + m * (0.2 + i * 0.022), off = Math.sin(i * 1.7) * W * 0.1; g.beginPath(); for (let k = 0; k <= 20; k++) { const x = -W * 0.1 + k / 20 * W * 1.2 + off; const yy = y + Math.sin(k * 0.8 + i) * u * 0.8; k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
        // light pooling on the sand under the heart
        TX.glow(g, cx, hz + m * 0.22, m * 0.35 * (show + rise), '#ffa040', 0.3 * (0.6 + beatK * 0.4));
        g.restore();
        // blowing sand
        for (const [a, b, c] of SD) {
          const s = 0.3 + c * 0.8, x = (a * W + t * s * (1.2 - calm * 0.75)) % W, y = b * H;
          g.fillStyle = `rgba(255,${210 + c * 30 | 0},${150 + c * 40 | 0},${(0.2 + 0.5 * c) * (1.1 - calm * 0.6)})`; g.fillRect(x, y, u * 0.6 * s, u * 0.1);
        }
        // the heart: a slow beat under the sand, then tearing free, pouring sand as it rises
        TX.glow(g, cx, hy, m * (0.2 + beatK * 0.2) * (0.3 + show), '#ff9a2a', 0.4 + beatK * 0.5);
        if (show > 0 && rise <= 0) { shock(g, cx, hy, fr(t * 0.001), m * 0.45, '#ffb050', u); shock(g, cx, hy, fr(t * 0.001 + 0.5), m * 0.45, '#ff8030', u * 0.6); }
        if (rise > 0) {
          const sl = seg(p, 0.62, 0.9);
          for (let i = 0; i < 60; i++) { const k = fr(t * 0.0008 + i / 60), x = cx + (fr(i * 0.618) - 0.5) * m * 0.16; g.fillStyle = `rgba(240,190,120,${0.7 * (1 - k) * (1 - sl)})`; g.fillRect(x, hy + m * 0.04 + k * k * (hz + m * 0.1 - hy), u * 0.3, u * 0.6); }
          // a slow dust devil around it
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 40; i++) { const a = t * 0.003 + i * 0.5, r = m * (0.08 + (i % 10) * 0.02), y = hy + m * 0.12 - (i % 10) * m * 0.03; g.fillStyle = `rgba(255,200,120,${0.35 * rise})`; g.fillRect(cx + Math.cos(a) * r, y + Math.sin(a) * r * 0.2, u * 0.4, u * 0.4); }
          g.restore();
          rays(g, cx, hy, 18, m * 1.3 * rise, 'rgba(255,190,90,0.3)', rise, t * 0.0001, 0.035);
          g.save(); g.translate(cx, hy); g.scale(1 + beatK * 0.06, 1 + beatK * 0.06);
          TX.gem(g, 'cluster', 0, 0, m * 0.14 * rise, 34, t, { glow: 1.3 });
          g.restore();
          for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + t * 0.0006, r = m * (0.2 + 0.03 * Math.sin(t * 0.003 + i)); TX.glow(g, cx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.35, m * 0.02, '#ffd08a', 0.9 * rise); }
          glint(g, cx + m * 0.03, hy - m * 0.09, m * 0.08 * (0.6 + 0.4 * beatK), '#fff2d0', rise);
        }
        shock(g, cx, cy, seg(p, 0.66, 0.78), m, '#ffc070', u * 3);
        TX.flash(g, e, bump(p, 0.64, 0.7) * 0.55, '#ffb050');
        TX.vignette(g, e, 0.6);
      },
    });
  }

  /* ======================= 보이드 워처 · 워처의 눈 ======================= */
  {
    const SV = (r => Array.from({ length: 280 }, () => [r(), r(), r(), r()]))(rng(61));
    const TN = (r => Array.from({ length: 12 }, () => [r(), r()]))(rng(62));
    const EY = (r => Array.from({ length: 9 }, () => [r(), r(), r()]))(rng(63));
    boss({
      id: 'boss_watcher', name: '워처의 눈', bossName: '보이드 워처',
      colors: ['#e0a0ff', '#7a1ad0', '#020004'],
      snd: 'rise:gravity hit:toll tail:choirpad amb:space root:98 scale:minor',
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H), t = time;
        g.fillStyle = '#020004'; g.fillRect(0, 0, W, H);
        const neb = g.createRadialGradient(cx, cy, 0, cx, cy, e.R); neb.addColorStop(0, 'rgba(70,10,110,.55)'); neb.addColorStop(0.5, 'rgba(30,4,50,.35)'); neb.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = neb; g.fillRect(0, 0, W, H);
        // stars spiralling in, leaving streaks as the pull grows
        const pull = E.inCubic(seg(p, 0.35, 0.63));
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        for (const [a0, rr, sp, c] of SV) {
          const w = (0.0002 + sp * 0.0004) * (1 + pull * 7), a = a0 * TAU + t * w, r = rr * e.R * (1 - pull * 0.9), trail = Math.min(0.6, w * 180);
          g.strokeStyle = hsl(265 + c * 70, 90, 72, 0.25 + 0.55 * c); g.lineWidth = u * (0.15 + c * 0.2);
          g.beginPath(); g.arc(cx, cy, Math.max(1, r), a - trail, a); g.stroke();
        }
        g.restore();
        // tendrils of the rift reaching out from behind the eye
        const open = E.inOut(seg(p, 0.12, 0.42)) * (1 - E.inCubic(seg(p, 0.55, 0.64))), ER = m * 0.28;
        for (const [a0, l] of TN) {
          let x = cx, y = cy, a = a0 * TAU; const path = new Path2D(); path.moveTo(x, y);
          for (let s = 0; s < 16; s++) { a += Math.sin(t * 0.0008 + a0 * 30 + s * 0.6) * 0.3; const st = m * (0.02 + l * 0.025) * (1 - pull * 0.8); x += Math.cos(a) * st; y += Math.sin(a) * st; path.lineTo(x, y); }
          TX.neon(g, path, '#9a3aff', u * 0.5, 0.35 + open * 0.4, '#e8b8ff');
        }
        TX.glow(g, cx, cy, m * 0.85, '#9a3aff', 0.28 + open * 0.3);
        // the great eye: veined sclera, a fibrous iris in layers, a slit pupil that dilates, a wet highlight
        const lidH = ER * Math.max(0.02, open);
        g.save(); g.beginPath(); g.ellipse(cx, cy, ER * 1.55, lidH, 0, 0, TAU); g.clip();
        const scl = g.createRadialGradient(cx, cy, ER * 0.3, cx, cy, ER * 1.6); scl.addColorStop(0, '#2a0a3e'); scl.addColorStop(1, '#07000e');
        g.fillStyle = scl; g.fillRect(cx - ER * 2, cy - ER, ER * 4, ER * 2);
        g.strokeStyle = 'rgba(200,60,160,.35)'; g.lineWidth = u * 0.15;
        for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1; let x = cx + sd * ER * 1.5, y = cy + (fr(i * 0.37) - 0.5) * ER; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x -= sd * ER * 0.12; y += Math.sin(i * 3 + s) * ER * 0.05; g.lineTo(x, y); } g.stroke(); }
        const look = Math.sin(t * 0.0007) * ER * 0.12, ix = cx + look, IR = ER * 0.88;
        const ig = g.createRadialGradient(ix, cy, 0, ix, cy, IR); ig.addColorStop(0, '#ffffff'); ig.addColorStop(0.18, '#f6c0ff'); ig.addColorStop(0.5, '#8a24e0'); ig.addColorStop(0.85, '#3a0870'); ig.addColorStop(1, '#0c0018');
        g.fillStyle = ig; g.beginPath(); g.arc(ix, cy, IR, 0, TAU); g.fill();
        g.lineWidth = 1;
        for (let i = 0; i < 110; i++) { const a = i / 110 * TAU + t * 0.00004, r0 = IR * (0.2 + fr(i * 0.618) * 0.1), r1 = IR * (0.7 + fr(i * 0.37) * 0.28); g.strokeStyle = hsl(275 + (i % 7) * 8, 90, 70 + (i % 3) * 8, 0.22); g.beginPath(); g.moveTo(ix + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(ix + Math.cos(a + 0.03) * r1, cy + Math.sin(a + 0.03) * r1); g.stroke(); }
        g.strokeStyle = 'rgba(255,200,255,.35)'; g.lineWidth = u * 0.3; g.beginPath(); g.arc(ix, cy, IR * 0.42, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(20,0,40,.8)'; g.lineWidth = u * 0.6; g.beginPath(); g.arc(ix, cy, IR * 0.98, 0, TAU); g.stroke();
        const dil = 0.08 + pull * 0.3;
        g.fillStyle = '#000'; g.beginPath(); g.ellipse(ix, cy, IR * dil, IR * 0.4, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(ix - IR * 0.38, cy - IR * 0.35, IR * 0.14, IR * 0.07, -0.6, 0, TAU); g.fill();
        g.restore();
        // lids: heavy, ridged
        const lid = new Path2D(); lid.ellipse(cx, cy, ER * 1.55, Math.max(1, lidH), 0, 0, TAU);
        TX.neon(g, lid, '#c05aff', u * 0.45, 0.6 + open * 0.4, '#ffd0ff');
        g.strokeStyle = `rgba(120,40,180,${0.5 * open})`; g.lineWidth = u * 0.25;
        for (let k = 1; k <= 3; k++) { g.beginPath(); g.ellipse(cx, cy, ER * (1.55 + k * 0.08), Math.max(1, lidH + ER * k * 0.07), 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.ellipse(cx, cy, ER * (1.55 + k * 0.08), Math.max(1, lidH + ER * k * 0.07), 0, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
        // approach rings closing in, like the fight
        for (let i = 0; i < 5; i++) { const k = fr(t * 0.0004 + i / 5); g.strokeStyle = `rgba(210,150,255,${0.45 * k * (1 - seg(p, 0.6, 0.66))})`; g.lineWidth = u * 0.3; g.beginPath(); g.arc(cx, cy, m * 0.95 * (1 - k) + m * 0.08, 0, TAU); g.stroke(); }
        // collapse: an accretion disc flares, the singularity, then the stone
        const disc = bump(p, 0.56, 0.7), rv = ob(seg(p, 0.64, 0.76));
        if (disc > 0) {
          g.save(); g.translate(cx, cy); g.scale(1, 0.28); g.globalCompositeOperation = 'lighter';
          const dg = g.createRadialGradient(0, 0, m * 0.05, 0, 0, m * 0.55); dg.addColorStop(0, 'rgba(255,230,255,0)'); dg.addColorStop(0.2, `rgba(255,200,255,${0.8 * disc})`); dg.addColorStop(0.5, `rgba(170,60,255,${0.45 * disc})`); dg.addColorStop(1, 'rgba(60,0,120,0)');
          g.fillStyle = dg; g.beginPath(); g.arc(0, 0, m * 0.55, 0, TAU); g.fill();
          g.restore();
          g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, m * 0.05 * disc * (1 - rv), 0, TAU); g.fill();
        }
        if (rv > 0) {
          rays(g, cx, cy, 30, m * 1.5 * rv, 'rgba(210,140,255,0.42)', rv, t * 0.00012, 0.025);
          // little eyes opening all around it, all watching the stone
          for (const [a0, r0, c] of EY) {
            const a = a0 * TAU + t * 0.00015, r = m * (0.3 + r0 * 0.25) * rv, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.75, s = m * (0.018 + c * 0.018), op = Math.max(0.05, Math.abs(Math.sin(t * 0.0012 + a0 * 20)));
            TX.glow(g, x, y, s * 3, '#b050ff', 0.5 * rv);
            g.save(); g.beginPath(); g.ellipse(x, y, s * 1.6, s * op, 0, 0, TAU); g.clip();
            g.fillStyle = '#e6b0ff'; g.fillRect(x - s * 2, y - s, s * 4, s * 2);
            const la = Math.atan2(cy - y, cx - x); g.fillStyle = '#000'; g.beginPath(); g.ellipse(x + Math.cos(la) * s * 0.4, y + Math.sin(la) * s * 0.3, s * 0.25, s * 0.7, 0, 0, TAU); g.fill();
            g.restore();
          }
          for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(230,190,255,${0.55 * rv})`; g.lineWidth = u * 0.2; g.beginPath(); g.ellipse(cx, cy, m * (0.22 + i * 0.06), m * (0.065 + i * 0.02), t * 0.0004 * (i % 2 ? -1 : 1) + i, 0, TAU); g.stroke(); }
          TX.gem(g, 'spire', cx, cy, m * 0.15 * rv, 280, t, { glow: 1.4 });
          glint(g, cx - m * 0.03, cy - m * 0.12, m * 0.09 * (0.7 + 0.3 * Math.sin(t * 0.005)), '#ffe8ff', rv);
        }
        shock(g, cx, cy, seg(p, 0.64, 0.76), m, '#e0a0ff', u * 3);
        shock(g, cx, cy, seg(p, 0.68, 0.84), m * 1.4, '#8a3aff', u * 2);
        TX.flash(g, e, bump(p, 0.62, 0.68), '#c060ff');
        TX.tear(g, e, bump(p, 0.57, 0.66) * 0.6, 12);
        TX.vignette(g, e, 0.72);
      },
    });
  }
})();
