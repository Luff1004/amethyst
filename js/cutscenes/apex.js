/*
  THE APEX - the 5th map's new ladder above 1조 (the old 31 were taken out, js/cutscenes/engine.js).
  Thirteen minerals, each its own film - no templates, nothing shared with the 억대 scenes but the
  linework kit from NULLSCAPES (G.n3.kit: 3D meshes, measuring rings, light).
    1조   HOROLOGIUM · TIDEGLASS · ORRERY                    (this file)
    10조  ROSE OF THE NAVE · THE LONG WINTER · SEVENFOLD SEAL (this file)
    100조 THE LOOM · KALEIDOS                                (apex2.js)
    1000조 YGGDRASIL · TESSERACT                             (apex2.js)
    1경   GENESIS · THE AUTHOR · COLOSSUS                     (apex2.js)
  Every film builds for most of its length, breaks at revealAt, and then holds its crystal - the true
  form, tinted to its tier - up in the top third, clear of the name card below.
*/
(() => {
  const { E, seg, clamp } = G, K = G.n3.kit;
  const { drawMesh, BIPY, hudRing, glowStroke, light, fineGrid, floor, circle, brackets, rnd } = K;
  const TAU = Math.PI * 2, fr = v => v - Math.floor(v), lerp = (a, b, k) => a + (b - a) * k;
  const THIN = '"Helvetica Neue", "Segoe UI", Arial, sans-serif', SERIF = '"Cinzel", "Times New Roman", serif';
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

  /* ---- shared by every apex film ---- */
  const A = G.apex = { TAU, fr, lerp, THIN, SERIF, hexRgb };
  // captions: [t0, t1, text, pos (0..1 down the screen), size, ink]. They settle in as their spacing
  // closes up; with `ink` they are printed plainly (on paper), otherwise white with a soft shadow
  A.say = (g, W, H, T, lines, font = THIN) => {
    if (!G.opt('captions')) return;
    const m = Math.min(W, H);
    for (const [t0, t1, text, pos = 0.86, size = 0.04, ink] of lines) {
      if (T < t0 || T > t1) continue;
      const k = Math.min(E.outCubic(seg(T, t0, t0 + 0.7)), 1 - seg(T, t1 - 0.5, t1)), fs = m * size;
      g.save(); g.font = `300 ${fs}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = `${fs * (0.16 + (1 - k) * 0.3)}px`;
      g.globalAlpha = k;
      if (ink) g.fillStyle = ink; else { g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = fs * 0.6; g.fillStyle = '#f6f4ff'; }
      const w = g.measureText(text).width, sc = Math.min(1, (W * 0.9) / w);
      g.translate(W / 2, H * pos); g.scale(sc, sc); g.fillText(text, 0, 0);
      g.restore();
    }
  };
  // the crystal, held up after the break: the true form in the tier's colour, rays, a measuring ring
  A.gem = (g, W, H, t, hex, k = 1, x = W / 2, y = H * 0.33, s = Math.min(W, H) * 0.15) => {
    if (k <= 0) return;
    const c = hexRgb(hex);
    light(g, x, y, s * 3.4, 0.35 * k); light(g, x, y, s * 1.4, 0.4 * k);
    g.save(); g.translate(x, y); g.rotate(t * 0.05); g.beginPath();
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, l = s * (i % 4 === 0 ? 3.6 : i % 2 ? 2.2 : 2.8); g.moveTo(Math.cos(a) * s * 1.35, Math.sin(a) * s * 1.35); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); }
    g.restore(); glowStroke(g, 0.6, 0.3 * k, c.join(','));
    hudRing(g, x, y, s * 2.05, t * 0.04, 0.45 * k, true);
    drawMesh(g, BIPY, x, y, s, t * 0.7, { alpha: k, base: c.map(v => v * 0.07), span: c.map(v => v * 0.68 + 40), back: 0.3 });
    light(g, x, y - s * 1.2, s * 0.3, 0.7 * k);
  };
  A.vignette = (g, W, H, a = 0.7) => {
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
  };
  A.flash = (g, W, H, T, at, len = 0.6, col = '255,255,255') => {
    const k = T - at; if (k < -0.15 || k > len) return;
    const a = k < 0 ? 1 + k / 0.15 : 1 - k / len;
    g.fillStyle = `rgba(${col},${a * (G.flashMul ? G.flashMul() : 1)})`; g.fillRect(0, 0, W, H);
  };
  A.stars = (g, W, H, t, n = 120, seed = 1, a = 1) => {
    for (let i = 0; i < n; i++) {
      const r = fr(Math.sin((i + seed) * 91.7) * 43758.5), q = fr(Math.sin((i + seed) * 12.9) * 9631.1), tw = 0.5 + 0.5 * Math.sin(t * (0.8 + (i % 5) * 0.4) + i);
      g.fillStyle = `rgba(255,255,255,${a * (0.15 + 0.6 * fr(i * 0.71)) * (0.5 + 0.5 * tw)})`; const s = i % 9 === 0 ? 1.8 : 1.1; g.fillRect(r * W, q * H, s, s);
    }
  };
  // register a film: draws black through the blackout, hands the body seconds (T), duration and reveal
  A.film = (def, body) => G.cutscenes.register(Object.assign({ zone: 4, fullscreen: true, captions: [] }, def, {
    draw(g, e) {
      const { W, H } = e, T = e.time / 1000, D = def.duration / 1000, RV = D * def.revealAt;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (T < 0) return;
      body(g, W, H, T, RV, D, e);
      const end = seg(T, D - 1.6, D); if (end > 0) { g.fillStyle = `rgba(0,0,0,${end})`; g.fillRect(0, 0, W, H); }
    },
  }));

  /* ================= 1조 · HOROLOGIUM ================= time was the first prison: a clockwork of
     brass gears round a great dial, every hand racing - slowing - stopped dead; then the gears crack
     and fly apart and the crystal is what was ticking at the centre */
  const GEARS = [[0, 0, 0.44, 48, 1], [0.66, -0.4, 0.25, 28, -1.76], [-0.62, 0.44, 0.29, 32, -1.52], [0.56, 0.62, 0.19, 22, 2.3],
    [-0.52, -0.66, 0.21, 24, 2.1], [1.02, 0.16, 0.15, 18, -2.9], [-1.04, -0.06, 0.17, 20, 2.6], [0.12, -0.98, 0.16, 18, -2.7], [-0.1, 1.0, 0.18, 20, 2.4]];
  function gear(g, x, y, r, n, a, col, alpha) {
    g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = alpha;
    const ri = r * 0.86, th = TAU / n; g.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = i * th;
      g.lineTo(Math.cos(a0) * ri, Math.sin(a0) * ri); g.lineTo(Math.cos(a0 + th * 0.18) * r, Math.sin(a0 + th * 0.18) * r);
      g.lineTo(Math.cos(a0 + th * 0.5) * r, Math.sin(a0 + th * 0.5) * r); g.lineTo(Math.cos(a0 + th * 0.68) * ri, Math.sin(a0 + th * 0.68) * ri);
    }
    g.closePath(); g.fillStyle = 'rgba(10,9,8,.94)'; g.fill(); glowStroke(g, 1.1, 0.9, col);
    circle(g, 0, 0, r * 0.7); g.strokeStyle = `rgba(${col},.55)`; g.lineWidth = 0.8; g.stroke();
    g.beginPath(); for (let i = 0; i < 6; i++) { const s = (i / 6) * TAU; g.moveTo(Math.cos(s) * r * 0.18, Math.sin(s) * r * 0.18); g.lineTo(Math.cos(s) * r * 0.68, Math.sin(s) * r * 0.68); }
    g.lineWidth = Math.max(1, r * 0.04); g.stroke();
    g.beginPath(); for (let i = 0; i < n; i++) { const s = (i / n) * TAU; g.moveTo(Math.cos(s) * r * 0.74, Math.sin(s) * r * 0.74); g.lineTo(Math.cos(s) * r * 0.78, Math.sin(s) * r * 0.78); }
    g.lineWidth = 0.6; g.stroke();
    circle(g, 0, 0, r * 0.16); g.fillStyle = '#0a0908'; g.fill(); glowStroke(g, 1, 0.8, col);
    g.restore();
  }
  const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  A.film({ id: 'horologium', name: 'Horologium', odds: 1.3e12, duration: 18000, revealAt: 0.72, colors: ['#ffe0a0', '#7affc8', '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.42 }, BR = '255,214,150';
    const F0 = RV - 4.6, F1 = RV - 2.6, u = clamp((T - F0) / (F1 - F0));
    const tau = T < F0 ? T : F0 + (F1 - F0) * (u - (u * u) / 2);          // clock time: runs, slows, stops dead
    const fly = E.inCubic(seg(T, RV - 0.9, RV + 0.5)), zoom = 0.88 + 0.22 * E.inOut(clamp(T / RV)), U = m * 0.5 * zoom;
    if (T < RV + 0.6) {
      const bg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.hypot(W, H) * 0.6);
      bg.addColorStop(0, '#13110c'); bg.addColorStop(1, '#030303'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      fineGrid(g, W, H, m / 32, c.x, c.y, 0.35);
      light(g, c.x, c.y, U * 1.5, 0.3);
      GEARS.forEach(([gx, gy, r, n, ratio], i) => {
        if (i === 0) return;
        const dir = Math.atan2(gy, gx), out = fly * U * (1.5 + i * 0.2);
        gear(g, c.x + gx * U + Math.cos(dir) * out, c.y + gy * U + Math.sin(dir) * out, r * U, n, tau * 0.6 * ratio + fly * ratio * 3, BR, 1 - fly * 0.7);
      });
      // the great dial
      const R = GEARS[0][2] * U * (1 + fly * 1.4);
      g.save(); g.globalAlpha = 1 - fly;
      gear(g, c.x, c.y, R, 48, tau * 0.6, BR, 1);
      circle(g, c.x, c.y, R * 0.62); g.fillStyle = '#060605'; g.fill(); glowStroke(g, 1.2, 0.9, '122,255,200');
      g.save(); g.translate(c.x, c.y); g.beginPath();
      for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU - TAU / 4, L = i % 5 ? R * 0.03 : R * 0.07; g.moveTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6); g.lineTo(Math.cos(a) * (R * 0.6 - L), Math.sin(a) * (R * 0.6 - L)); }
      g.strokeStyle = 'rgba(122,255,200,.8)'; g.lineWidth = 0.8; g.stroke();
      g.font = `400 ${R * 0.075}px ${SERIF}`; g.fillStyle = 'rgba(230,255,240,.85)'; g.textAlign = 'center'; g.textBaseline = 'middle';
      ROMAN.forEach((s, i) => { const a = (i / 12) * TAU - TAU / 4; g.fillText(s, Math.cos(a) * R * 0.46, Math.sin(a) * R * 0.46); });
      // the hands race, slow, stop
      for (const [len, w, sp] of [[0.3, 0.035, 0.5], [0.5, 0.022, 6], [0.56, 0.008, 40]]) {
        const a = tau * sp - TAU / 4;
        g.save(); g.rotate(a); g.beginPath(); g.moveTo(-R * 0.06, -R * w); g.lineTo(R * len, 0); g.lineTo(-R * 0.06, R * w); g.closePath();
        g.fillStyle = '#e8fff4'; g.fill(); g.restore();
      }
      circle(g, 0, 0, R * 0.03); g.fillStyle = '#fff'; g.fill();
      g.restore(); g.restore();
      // the instant it stops: a ring of stillness
      const sk = T - F1; if (sk > 0 && sk < 1.4) { circle(g, c.x, c.y, R * 0.62 + sk * m * 0.6); glowStroke(g, 1.2, 0.7 * (1 - sk / 1.4), '122,255,200'); }
      // cracks across the dial just before it flies apart
      const ck = seg(T, RV - 1.6, RV - 0.9);
      if (ck > 0 && fly < 1) {
        const r = rnd(77); g.beginPath();
        for (let j = 0; j < 9; j++) { let a = r() * TAU, x = c.x, y = c.y; g.moveTo(x, y); for (let s2 = 0; s2 < 6 * ck; s2++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * R * 0.18; y += Math.sin(a) * R * 0.18; g.lineTo(x, y); } }
        glowStroke(g, 1.4, 1 - fly, '255,255,255');
      }
    }
    A.flash(g, W, H, T, RV - 0.05, 0.8);
    if (T > RV - 0.2) {
      const k = E.outCubic(seg(T, RV - 0.2, RV + 0.8)), lt = T - RV;
      // the calmer gears that keep turning behind it
      [[0, 0, 0.3, 40, 1], [0.42, 0.2, 0.14, 20, -2.1], [-0.42, 0.2, 0.15, 22, 1.9]].forEach(([gx, gy, r, n, ratio]) => gear(g, W / 2 + gx * m, H * 0.33 + gy * m, r * m, n, lt * 0.15 * ratio, BR, 0.35 * k));
      A.gem(g, W, H, T, '#7affc8', k);
    }
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[1, 4.6, 'time was the first prison'], [5.2, F0 + 0.6, 'every hand was turning toward you'], [F1 - 0.1, RV - 1.1, 'and then it stopped', 0.83, 0.046]]);
  });

  /* ================= 1조 · TIDEGLASS ================= a wireframe sea under a moon, swells rolling
     in; one swell keeps rising - a wall of water - and the crystal surfaces from its crest */
  A.film({ id: 'tideglass', name: 'Tideglass', odds: 2.6e12, duration: 18000, revealAt: 0.72, colors: ['#9af6ff', '#7affc8', '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), hy = H * 0.4, AQ = '130,240,235';
    const sky = g.createLinearGradient(0, 0, 0, hy); sky.addColorStop(0, '#01060a'); sky.addColorStop(1, '#06222a');
    g.fillStyle = sky; g.fillRect(0, 0, W, hy); g.fillStyle = '#010406'; g.fillRect(0, hy, W, H - hy);
    A.stars(g, W, hy, T, 70, 3, 0.8);
    const mx = W * 0.5, my = H * 0.17, mr = m * 0.06;
    light(g, mx, my, mr * 5, 0.35); circle(g, mx, my, mr); g.fillStyle = '#eafcff'; g.fill(); light(g, mx, my, mr * 1.6, 0.6);
    // the moon's road across the water
    g.fillStyle = 'rgba(220,250,255,.5)';
    for (let i = 0; i < 26; i++) { const d = i / 26, y = hy + (H - hy) * Math.pow(d, 1.7), w = m * (0.02 + d * 0.14) * (0.5 + 0.5 * Math.sin(T * 3 + i * 1.7)); g.globalAlpha = 0.5 * (1 - d * 0.6); g.fillRect(mx - w / 2, y, w, 1 + d * 2); }
    g.globalAlpha = 1;
    const swell = E.inOut(seg(T, 3, RV - 0.6)), calm = T > RV ? 1 - 0.6 * E.outCubic(seg(T, RV, RV + 2)) : 1, rows = 34;
    const crest = { x: W / 2, y: hy };
    for (let j = 0; j < rows; j++) {
      const d = j / (rows - 1), y0 = hy + (H * 1.08 - hy) * Math.pow(d, 1.8), spread = 0.55 + d * 1.4, amp = m * (0.008 + d * 0.05) * calm;
      g.beginPath();
      for (let i = 0; i <= 64; i++) {
        const X = i / 32 - 1, wave = Math.sin(X * 7 + T * 1.2 + j * 0.55) * 0.55 + Math.sin(X * 15 - T * 1.8 + j * 0.9) * 0.25 + Math.sin(X * 3 + T * 0.6) * 0.4;
        const bump = swell * Math.exp(-(X * X) / 0.05 - Math.pow(d - 0.3, 2) / 0.012) * H * 0.42 * (T > RV ? 1 - E.outCubic(seg(T, RV, RV + 1.4)) : 1);
        const x = W / 2 + X * W * spread, y = y0 - wave * amp - bump;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
        if (i === 32 && j === Math.round(0.3 * (rows - 1))) { crest.x = x; crest.y = y; }
      }
      g.strokeStyle = `rgba(${AQ},${0.12 + 0.55 * d})`; g.lineWidth = 0.5 + d * 1.3; g.stroke();
    }
    // spray off the crest
    if (swell > 0.3 && T < RV + 0.5) {
      for (let i = 0; i < 40; i++) { const life = fr(i * 0.618 + T * 0.7), a = -Math.PI / 2 + (fr(i * 0.37) - 0.5) * 2.2, d2 = life * m * 0.25; g.fillStyle = `rgba(220,255,255,${(1 - life) * swell})`; g.fillRect(crest.x + Math.cos(a) * d2, crest.y + Math.sin(a) * d2 + life * life * m * 0.1, 2, 2); }
      light(g, crest.x, crest.y, m * 0.2 * swell, 0.5 * swell);
    }
    A.flash(g, W, H, T, RV - 0.05, 0.7, '220,255,255');
    if (T > RV - 0.3) {
      const k = E.outCubic(seg(T, RV - 0.3, RV + 0.8)), y = lerp(crest.y, H * 0.33, E.outCubic(seg(T, RV - 0.3, RV + 1.2)));
      A.gem(g, W, H, T, '#7affc8', k, W / 2, y);
    }
    A.vignette(g, W, H, 0.55);
    A.say(g, W, H, T, [[1, 4.4, 'the sea remembers what the land forgot', 0.9], [5, 8.8, 'it kept this for a trillion tides', 0.9], [9.5, RV - 0.8, 'now it gives it back', 0.9, 0.046]]);
  });

  /* ================= 1조 · ORRERY ================= nine worlds on brass arms round a burning sun,
     seen from straight above; the camera lowers to their plane as they swing into one line, and a
     beam runs down the line */
  const PLANETS = Array.from({ length: 9 }, (_, i) => { const r = rnd(500 + i); return { R: 0.17 + i * 0.1, size: 0.018 + r() * 0.03 + (i === 5 ? 0.02 : 0), ph: r() * TAU, sp: 1.4 / Math.pow(1 + i, 0.8), hue: [30, 200, 15, 260, 45, 190, 340, 120, 220][i], ring: i === 5 || i === 7 }; });
  A.film({ id: 'orrery', name: 'Orrery', odds: 5.2e12, duration: 18000, revealAt: 0.72, colors: ['#ffd08a', '#7affc8', '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.45 }, U = m * 0.48, BR = '230,190,120';
    const pitch = lerp(1.3, 0.3, E.inOut(clamp(T / (RV - 2.5)))), sp = Math.sin(pitch), yaw = T * 0.05, align = E.inOut(seg(T, RV - 5, RV - 1.6)), AL = -0.35;
    const bg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.hypot(W, H) * 0.6); bg.addColorStop(0, '#0d0a06'); bg.addColorStop(1, '#020202');
    g.fillStyle = bg; g.fillRect(0, 0, W, H); A.stars(g, W, H, T, 110, 9, 0.7);
    if (T < RV + 0.5) {
      const fade = 1 - E.inCubic(seg(T, RV - 0.4, RV + 0.5));
      g.save(); g.globalAlpha = fade;
      // orbits, each with a scale of ticks
      PLANETS.forEach(p => {
        g.beginPath(); g.ellipse(c.x, c.y, p.R * U, p.R * U * sp, 0, 0, TAU); g.strokeStyle = `rgba(${BR},.32)`; g.lineWidth = 0.8; g.stroke();
        g.beginPath(); for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, x = Math.cos(a) * p.R * U, y = Math.sin(a) * p.R * U * sp; g.moveTo(c.x + x, c.y + y); g.lineTo(c.x + x * 1.015, c.y + y * 1.015); } g.strokeStyle = `rgba(${BR},.4)`; g.stroke();
      });
      const sunR = U * 0.09;
      const items = PLANETS.map(p => {
        const a = lerp(p.ph + T * p.sp, AL + Math.round((p.ph + T * p.sp - AL) / TAU) * TAU, align) + yaw, x = Math.cos(a) * p.R * U, z = Math.sin(a) * p.R * U;
        return { p, x: c.x + x, y: c.y + z * sp, depth: z };
      });
      // the far half first, then the sun, then the near half
      const draw = it => {
        g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(it.x, it.y); g.strokeStyle = `rgba(${BR},.7)`; g.lineWidth = 1.2; g.stroke();
        circle(g, it.x, it.y + it.p.size * U * 1.6, 1.5); g.fillStyle = `rgba(${BR},.8)`; g.fill();
        const s = it.p.size * U, dx = c.x - it.x, dy = c.y - it.y, dl = Math.hypot(dx, dy) || 1;
        const gr = g.createRadialGradient(it.x + (dx / dl) * s * 0.5, it.y + (dy / dl) * s * 0.5, s * 0.1, it.x, it.y, s);
        gr.addColorStop(0, `hsl(${it.p.hue},70%,75%)`); gr.addColorStop(0.6, `hsl(${it.p.hue},60%,35%)`); gr.addColorStop(1, `hsl(${it.p.hue},60%,8%)`);
        circle(g, it.x, it.y, s); g.fillStyle = gr; g.fill();
        if (it.p.ring) { g.beginPath(); g.ellipse(it.x, it.y, s * 2, s * 2 * Math.max(0.15, sp) * 0.5, -0.3, 0, TAU); g.strokeStyle = `hsla(${it.p.hue},60%,75%,.7)`; g.lineWidth = 1.4; g.stroke(); }
      };
      items.filter(it => it.depth < 0).sort((a, b) => a.depth - b.depth).forEach(draw);
      light(g, c.x, c.y, sunR * 6, 0.6); const sg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, sunR);
      sg.addColorStop(0, '#fffbe8'); sg.addColorStop(0.6, '#ffc860'); sg.addColorStop(1, '#ff7a20'); circle(g, c.x, c.y, sunR); g.fillStyle = sg; g.fill();
      items.filter(it => it.depth >= 0).sort((a, b) => a.depth - b.depth).forEach(draw);
      hudRing(g, c.x, c.y, U * 1.05, T * 0.02, 0.3, true);
      // the beam down the line
      if (align > 0.85) {
        const k = (align - 0.85) / 0.15, a = AL + yaw, ex = c.x + Math.cos(a) * U * 1.6, ey = c.y + Math.sin(a) * U * 1.6 * sp;
        g.beginPath(); g.moveTo(c.x - (ex - c.x), c.y - (ey - c.y)); g.lineTo(ex, ey); glowStroke(g, 2.5 * k, k, '255,240,200');
      }
      g.restore();
    }
    A.flash(g, W, H, T, RV - 0.05, 0.8, '255,245,220');
    if (T > RV - 0.2) {
      const k = E.outCubic(seg(T, RV - 0.2, RV + 0.8));
      PLANETS.slice(0, 5).forEach((p, i) => { g.beginPath(); g.ellipse(W / 2, H * 0.33, m * (0.24 + i * 0.05), m * (0.24 + i * 0.05) * 0.28, -0.15, 0, TAU); g.strokeStyle = `rgba(${BR},${0.25 * k})`; g.lineWidth = 0.8; g.stroke(); const a = T * p.sp * 0.4 + p.ph; circle(g, W / 2 + Math.cos(a) * m * (0.24 + i * 0.05), H * 0.33 + Math.sin(a) * m * (0.24 + i * 0.05) * 0.28, 3); g.fillStyle = `hsla(${p.hue},70%,70%,${k})`; g.fill(); });
      A.gem(g, W, H, T, '#7affc8', k);
    }
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[1, 4.6, 'nine worlds on brass arms', 0.9], [5.2, 8.6, 'turning since before the first light', 0.9], [RV - 4.6, RV - 1, 'for one moment, they align', 0.9, 0.046]]);
  });

  /* ================= 10조 · ROSE OF THE NAVE ================= down the nave of a cathedral built
     of light - pointed arches going by, shafts of light from high windows - toward a rose window
     that fills its stained glass pane by pane and grows to fill the sky */
  function arch(g, cx, base, w, h) {                                   // a pointed (gothic) arch
    const sp = base - h * 0.62, r = w * 0.85;
    g.moveTo(cx - w / 2, base); g.lineTo(cx - w / 2, sp);
    g.arc(cx - w / 2 + r, sp, r, Math.PI, Math.PI + Math.acos((r - w / 2) / r), false);
    g.moveTo(cx + w / 2, base); g.lineTo(cx + w / 2, sp);
    g.arc(cx + w / 2 - r, sp, r, 0, -Math.acos((r - w / 2) / r), true);
  }
  function rose(g, x, y, R, fill, t) {
    const n = 12;
    // the glass: twenty-four panes lit one by one
    for (let i = 0; i < 24; i++) {
      const k = clamp(fill * 24 - i); if (k <= 0) continue;
      const a0 = (i / 24) * TAU + t * 0.02, a1 = a0 + TAU / 24;
      g.beginPath(); g.arc(x, y, R * 0.95, a0, a1); g.arc(x, y, R * 0.38, a1, a0, true); g.closePath();
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `hsla(${[210, 340, 45, 160, 280, 10][i % 6]},80%,55%,${0.32 * k})`; g.fill(); g.restore();
    }
    g.save(); g.translate(x, y); g.rotate(t * 0.02); g.beginPath();
    for (const rr of [1, 0.95, 0.38, 0.33]) { g.moveTo(R * rr, 0); g.arc(0, 0, R * rr, 0, TAU); }
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * R * 0.66, py = Math.sin(a) * R * 0.66; g.moveTo(px + R * 0.28, py); g.arc(px, py, R * 0.28, 0, TAU); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + TAU / 12, px = Math.cos(a) * R * 0.2, py = Math.sin(a) * R * 0.2; g.moveTo(px + R * 0.13, py); g.arc(px, py, R * 0.13, 0, TAU); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; g.moveTo(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38); g.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); }
    g.restore(); glowStroke(g, 1.2, 0.95, '255,236,200');
    light(g, x, y, R * 0.5, 0.25 + 0.5 * fill);
  }
  A.film({ id: 'roseofthenave', name: 'Rose of the Nave', odds: 1.4e13, duration: 19000, revealAt: 0.72, colors: ['#ffe8c0', '#7affc8', '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), vp = { x: W / 2, y: H * 0.42 }, GD = '255,230,190';
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#07060a'); bg.addColorStop(1, '#020203'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const roseR = m * lerp(0.07, 0.62, E.inCubic(clamp(T / (RV - 0.5)))), fill = clamp((T - 3) / (RV - 4));
    if (T < RV + 0.4) {
      floor(g, W, H, vp.y + H * 0.08, T, 0.45, 0.25);
      // shafts of light from the high windows
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const x0 = W * (i < 2 ? -0.05 : 1.05), y0 = H * (0.05 + (i % 2) * 0.12), x1 = W * (0.3 + i * 0.13), y1 = H * 0.95, w = m * 0.06;
        const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(${GD},.16)`); gr.addColorStop(1, `rgba(${GD},0)`);
        g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - w, y0); g.lineTo(x0 + w, y0); g.lineTo(x1 + w * 3, y1); g.lineTo(x1 - w * 3, y1); g.closePath(); g.fill();
      }
      g.restore();
      for (let i = 0; i < 50; i++) { const life = fr(i * 0.618 + T * 0.03), x = fr(i * 0.37) * W, y = H * (0.1 + life * 0.85); g.fillStyle = `rgba(${GD},${0.4 * Math.sin(life * Math.PI)})`; g.fillRect(x + Math.sin(T + i) * 6, y, 1.4, 1.4); }
      rose(g, vp.x, vp.y, roseR, fill, T);
      // the arches going by
      const z0 = T * 0.75;
      for (let k = 14; k >= 0; k--) {
        const zz = k + 1 - fr(z0), a = clamp(1.6 - zz * 0.1) * clamp(zz * 1.4);
        if (a <= 0) continue;
        const w = (W * 1.2) / zz, base = vp.y + (H * 0.95) / zz, h = (H * 1.8) / zz;
        g.beginPath(); arch(g, vp.x, base, w, h); arch(g, vp.x, base, w * 0.86, h * 0.92);
        g.save(); g.globalAlpha = a * (1 - 0.8 * E.inCubic(seg(T, RV - 2, RV))); glowStroke(g, 0.6 + 2 / zz, 0.85, GD); g.restore();
      }
    }
    A.flash(g, W, H, T, RV - 0.05, 0.9, '255,245,225');
    if (T > RV - 0.2) {
      const k = E.outCubic(seg(T, RV - 0.2, RV + 0.8));
      g.save(); g.globalAlpha = 0.45 * k; rose(g, W / 2, H * 0.33, m * 0.36, 1, T); g.restore();
      A.gem(g, W, H, T, '#7affc8', k);
    }
    A.vignette(g, W, H, 0.65);
    A.say(g, W, H, T, [[1, 4.8, 'a cathedral no one built', 0.88], [5.4, 9.6, 'light came in through a window made of light', 0.88], [RV - 3, RV - 0.8, 'kneel', 0.88, 0.06]], SERIF);
  });

  /* ================= 10조 · THE LONG WINTER ================= snow in the dark, the aurora
     overhead; frost creeps in from the edges while a snowflake grows at the centre one branch per
     century - until a white-out, and the crystal sits in the heart of the flake */
  const FLAKE = (() => {                                               // one arm's branches, each with when it appears
    const segs = [], r = rnd(321);
    const grow = (x, y, a, len, depth, t0) => {
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; segs.push([x, y, x1, y1, t0, depth]);
      if (depth >= 4) return;
      for (const f of [0.35, 0.62, 0.85]) {
        if (depth > 1 && f === 0.85) continue;
        const bx = x + Math.cos(a) * len * f, by = y + Math.sin(a) * len * f, bl = len * (0.42 - depth * 0.05) * (0.8 + r() * 0.3);
        for (const s of [-1, 1]) grow(bx, by, a + s * (Math.PI / 3), bl, depth + 1, t0 + 0.18 + f * 0.25);
      }
    };
    grow(0, 0, 0, 1, 0, 0);
    return segs;
  })();
  const FROST = Array.from({ length: 10 }, (_, i) => { const r = rnd(640 + i), side = i % 4, pts = []; let x = side === 1 ? 1 : side === 3 ? 0 : r(), y = side === 0 ? 0 : side === 2 ? 1 : r(), a = Math.atan2(0.5 - y, 0.5 - x); for (let k = 0; k < 14; k++) { pts.push([x, y]); a += (r() - 0.5) * 0.9; x += Math.cos(a) * 0.025; y += Math.sin(a) * 0.025; } return pts; });
  A.film({ id: 'longwinter', name: 'The Long Winter', odds: 3.1e13, duration: 18000, revealAt: 0.72, colors: ['#dff6ff', '#7affc8', '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.45 }, IC = '205,240,255';
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#03101c'); bg.addColorStop(1, '#010306'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // the aurora
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const gr = g.createLinearGradient(0, H * 0.05, 0, H * 0.4); gr.addColorStop(0, 'rgba(120,255,190,0)'); gr.addColorStop(0.5, `rgba(${k === 1 ? '150,120,255' : '110,255,190'},.10)`); gr.addColorStop(1, 'rgba(120,255,190,0)');
      g.fillStyle = gr;
      for (let x = 0; x < W; x += 4) { const y = H * (0.14 + k * 0.05) + Math.sin(x * 0.006 + T * 0.4 + k * 2) * H * 0.05 + Math.sin(x * 0.017 - T * 0.7 + k) * H * 0.02, h = H * (0.12 + 0.06 * Math.sin(x * 0.01 + T + k)); g.fillRect(x, y, 3, h); }
    }
    g.restore();
    A.stars(g, W, H * 0.6, T, 60, 4, 0.6);
    const grow = clamp((T - 1.5) / (RV - 3)), S = m * 0.36 * (1 + 0.1 * E.inOut(clamp(T / RV)));
    // frost creeping in from the edges
    g.beginPath(); FROST.forEach(p => { const n = Math.floor(p.length * clamp(T / RV)); for (let i = 0; i < n; i++) { const x = p[i][0] * W, y = p[i][1] * H; i ? g.lineTo(x, y) : g.moveTo(x, y); } }); glowStroke(g, 0.8, 0.5, IC);
    // the snowflake: six arms, mirrored, every branch on its own clock
    if (T < RV + 0.6) {
      g.save(); g.translate(c.x, c.y); g.rotate(T * 0.03); g.beginPath();
      for (let arm = 0; arm < 6; arm++) {
        const a = (arm / 6) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        for (const [x0, y0, x1, y1, t0] of FLAKE) {
          const k = clamp((grow * 1.6 - t0) / 0.25); if (k <= 0) continue;
          const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
          for (const my of [1, -1]) { g.moveTo((x0 * ca - y0 * my * sa) * S, (x0 * sa + y0 * my * ca) * S); g.lineTo((ex * ca - ey * my * sa) * S, (ex * sa + ey * my * ca) * S); }
        }
      }
      g.restore(); glowStroke(g, 1.1, 0.95, IC);
      light(g, c.x, c.y, S * 0.5, 0.3 + 0.4 * grow);
    }
    // snow, three depths, the wind picking up
    const wind = 0.3 + 1.5 * E.inCubic(seg(T, RV - 4, RV));
    for (let i = 0; i < 160; i++) {
      const L = i % 3, sp = 0.05 + L * 0.04, y = fr(i * 0.37 + T * sp) * H, x = fr(i * 0.618 + T * sp * wind * 0.6 + Math.sin(T * 0.5 + i) * 0.01) * W;
      g.fillStyle = `rgba(240,250,255,${0.25 + L * 0.25})`; const s = 1 + L; g.fillRect(x, y, s, s);
    }
    const wo = E.inCubic(seg(T, RV - 1.8, RV)) * (1 - E.outCubic(seg(T, RV, RV + 1.6)));   // the white-out
    if (wo > 0) { g.fillStyle = `rgba(235,248,255,${wo * 0.92 * (G.flashMul ? G.flashMul() : 1)})`; g.fillRect(0, 0, W, H); }
    if (T > RV - 0.1) {
      const k = E.outCubic(seg(T, RV - 0.1, RV + 1));
      g.save(); g.translate(W / 2, H * 0.33); g.rotate(T * 0.03); g.beginPath();
      for (let arm = 0; arm < 6; arm++) { const a = (arm / 6) * TAU; for (const [x0, y0, x1, y1] of FLAKE) for (const my of [1, -1]) { const ca = Math.cos(a), sa = Math.sin(a), s = m * 0.3; g.moveTo((x0 * ca - y0 * my * sa) * s, (x0 * sa + y0 * my * ca) * s); g.lineTo((x1 * ca - y1 * my * sa) * s, (x1 * sa + y1 * my * ca) * s); } }
      g.restore(); glowStroke(g, 0.8, 0.35 * k, IC);
      A.gem(g, W, H, T, '#7affc8', k);
    }
    A.vignette(g, W, H, 0.55);
    A.say(g, W, H, T, [[1, 4.6, 'the cold came first', 0.88], [5.2, 9, 'it grew one branch every hundred years', 0.88], [9.6, RV - 1.6, 'a winter longer than the world', 0.88, 0.044]]);
  });

  /* ================= 10조 · SEVENFOLD SEAL ================= seven rings of glyphs no one may read,
     turning against each other round a seven-pointed star drawn in light; the seals break from the
     outside in, one by one, and the eye at the centre opens */
  const glyph = r => { const P = [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [0.5, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]], s = []; let p = Math.floor(r() * 9); for (let k = 0; k < 3 + Math.floor(r() * 2); k++) { const q = Math.floor(r() * 9); if (q !== p) s.push([P[p], P[q]]); p = q; } return s; };
  const SEALS = Array.from({ length: 7 }, (_, i) => { const r = rnd(70 + i * 13), n = 14 + i * 4; return { n, glyphs: Array.from({ length: n }, () => glyph(r)), dir: i % 2 ? -1 : 1, sp: 0.06 + (6 - i) * 0.012 }; });
  A.film({ id: 'sevenfoldseal', name: 'Sevenfold Seal', odds: 6.6e13, duration: 19000, revealAt: 0.72, colors: ['#ffd090', '#7affc8', '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.43 }, GO = '255,206,130';
    const bg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.hypot(W, H) * 0.6); bg.addColorStop(0, '#1e0608'); bg.addColorStop(0.6, '#080203'); bg.addColorStop(1, '#020101');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const breakAt = i => 3 + (6 - i) * 1.42;                          // outermost first; the last at RV-2.2
    if (T < RV + 0.5) {
      SEALS.forEach((S, i) => {
        const r = m * (0.17 + i * 0.062), bt = T - breakAt(i), broken = bt > 0, rot = S.dir * T * S.sp;
        if (bt > 1.6) return;
        const fly = broken ? E.outCubic(clamp(bt / 1.4)) : 0, a = broken ? 1 - clamp(bt / 1.5) : 1;
        if (!broken) { g.beginPath(); g.arc(c.x, c.y, r - m * 0.016, 0, TAU); g.moveTo(c.x + r + m * 0.016, c.y); g.arc(c.x, c.y, r + m * 0.016, 0, TAU); glowStroke(g, 0.7, 0.55, GO); }
        g.save(); g.translate(c.x, c.y); g.beginPath();
        S.glyphs.forEach((gl, j) => {
          const an = rot + (j / S.n) * TAU, gs = m * 0.026, rr = r + fly * m * (0.3 + (j % 3) * 0.12), ca = Math.cos(an), sa = Math.sin(an);
          for (const [[x0, y0], [x1, y1]] of gl) {
            const px = (u, v) => [ca * rr - sa * (u - 0.5) * gs + ca * (v - 0.5) * gs, sa * rr + ca * (u - 0.5) * gs + sa * (v - 0.5) * gs];
            const [ax, ay] = px(x0, y0), [bx, by] = px(x1, y1); g.moveTo(ax, ay); g.lineTo(bx, by);
          }
        });
        g.restore(); glowStroke(g, 1, a, broken ? '255,255,255' : GO);
        if (broken && bt < 0.4) { circle(g, c.x, c.y, r); glowStroke(g, 3, 1 - bt / 0.4, '255,255,255'); }
      });
      // the seven-pointed star, drawn in light
      const sk = clamp((T - 1.5) / 6), R7 = m * 0.15;
      g.beginPath(); for (let i = 0; i <= 7 * sk; i++) { const a = ((i * 3) / 7) * TAU - TAU / 4, x = c.x + Math.cos(a) * R7, y = c.y + Math.sin(a) * R7; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      glowStroke(g, 1.4, 0.9, '255,240,210');
      // the eye opening
      const ek = E.inOut(seg(T, RV - 2, RV)), ew = R7 * 0.9, eh = ew * 0.6 * ek;
      if (ek > 0) { g.beginPath(); g.moveTo(c.x - ew, c.y); g.quadraticCurveTo(c.x, c.y - eh * 2, c.x + ew, c.y); g.quadraticCurveTo(c.x, c.y + eh * 2, c.x - ew, c.y); g.fillStyle = `rgba(255,250,235,${ek})`; g.fill(); glowStroke(g, 1.5, 1, GO); light(g, c.x, c.y, ew * 2.5, ek); }
    }
    A.flash(g, W, H, T, RV - 0.05, 0.9, '255,250,235');
    if (T > RV - 0.2) {
      const k = E.outCubic(seg(T, RV - 0.2, RV + 0.8)), R7 = m * 0.36;
      g.beginPath(); for (let i = 0; i <= 7; i++) { const a = ((i * 3) / 7) * TAU - TAU / 4 + T * 0.02; i ? g.lineTo(W / 2 + Math.cos(a) * R7, H * 0.33 + Math.sin(a) * R7) : g.moveTo(W / 2 + Math.cos(a) * R7, H * 0.33 + Math.sin(a) * R7); }
      glowStroke(g, 1, 0.35 * k, GO);
      A.gem(g, W, H, T, '#7affc8', k);
    }
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[1, 4.2, 'seven seals', 0.88, 0.046], [4.8, 9.4, 'seven names no one may speak', 0.88], [breakAt(0) - 0.2, RV - 1, 'the last one breaks', 0.88, 0.046]], SERIF);
  });
})();
