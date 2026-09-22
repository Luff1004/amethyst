/*
  CINE ENVIRONMENTS - the world behind the mineral.
  Each is drawn in layers (far -> near) with fog between them for depth.
  env(g, e, c):  c.h = hue, c.k = 0..1 fade-in, c.cam = { x, y } parallax offset in px, c.o = recipe options
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const Cine = G.cine, TAU = Math.PI * 2;
  const hs = (h, s, l, a = 1) => Cine.hsl(h, s, l, a), hx = (h, s, l) => G.hsl(h, s, l);
  const sky = (g, e, top, bot, y1) => { const gr = g.createLinearGradient(0, 0, 0, y1 || e.H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, e.W, e.H); };
  const env = Cine.env = {};

  /* stars in three parallax depths */
  const starfield = (g, e, c, n = 110, a = 1) => {
    const r = rng(11), t = e.time / 1000;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const d = 0.2 + (i % 3) * 0.4, x = ((r() * e.W + c.cam.x * d * 0.15) % e.W + e.W) % e.W, y = r() * e.H, tw = 0.4 + 0.6 * Math.sin(t * (1 + d) + i);
      const s = e.u * (0.25 + r() * 0.5) * (0.6 + d);
      g.globalAlpha = a * c.k * Math.max(0.05, tw) * 0.9; g.fillStyle = i % 9 === 0 ? '#ffd9b0' : i % 7 === 0 ? '#b8d0ff' : '#ffffff';
      g.fillRect(x, y, s, s);
    }
    g.restore();
  };

  /* --- caves: crystal cavern, deep mine --- */
  env.cave = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e;
    sky(g, e, hs(h, 45, 4), hs(h, 40, 10));
    Cine.add(g, () => Cine.glow(g, cx, cy, e.R * 0.95, hx(h, 70, 42), 0.3 * k));
    Cine.ridge(g, e, { y: H * 0.18, amp: H * 0.1, seed: 3, col: hs(h, 40, 9), top: true, freq: 0.005, off: cam.x * 0.02 });
    Cine.fog(g, e, hx(h, 50, 32), { s: 2.2, vx: 5, a: 0.2 * k, comp: 'lighter' });
    Cine.ridge(g, e, { y: H * 0.1, amp: H * 0.09, seed: 9, col: hs(h, 40, 5), top: true, freq: 0.008, off: cam.x * 0.04, rim: hs(h, 70, 48, 0.35) });
    Cine.ridge(g, e, { y: H * 0.88, amp: H * 0.07, seed: 5, col: hs(h, 40, 7), freq: 0.007, off: cam.x * 0.03, rim: hs(h, 60, 40, 0.25) });
    Cine.shafts(g, e, { x: cx * 0.75 + cam.x * 0.3, y: -20, ang: 1.25, n: 5, len: H * 1.3, spread: u * 20, w: u * 3.5, col: hx(h, 60, 62), a: 0.1 * k, seed: 2 });
    Cine.motes(g, e, { n: 50, seed: 3, col: hx(h, 60, 78), size: 0.9, vy: -0.6, vx: 0.3, wobble: 2, a: 0.7 * k, twinkle: 1 });
    Cine.ridge(g, e, { y: H * 0.97, amp: H * 0.05, seed: 8, col: hs(h, 40, 3), freq: 0.01, off: cam.x * 0.06 });
  };

  /* --- mountains at dusk --- */
  env.mountain = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx } = e, hy = H * 0.58;
    sky(g, e, hs(h, 50, 5), hs(h + 20, 60, 30), hy + H * 0.1);
    starfield(g, e, c, 80, 0.7);
    Cine.add(g, () => { Cine.glow(g, cx + cam.x * 0.1, hy, e.R * 0.7, hx(h + 25, 80, 55), 0.5 * k); Cine.glow(g, cx, hy, u * 30, hx(h + 40, 90, 80), 0.6 * k); });
    Cine.fog(g, e, hx(h + 15, 40, 45), { s: 2.5, vx: 6, a: 0.25 * k, y0: 0, h: hy, comp: 'lighter' });
    for (let i = 0; i < 4; i++) {
      const d = i / 3, col = Cine.mixc(Cine.rgb(hx(h + 20, 45, 34)), Cine.rgb(hx(h, 40, 4)), d * 0.92);
      Cine.ridge(g, e, { y: hy - H * 0.06 + i * H * 0.07, amp: H * (0.13 - i * 0.02), seed: 20 + i, col: Cine.css(col), freq: 0.004 + i * 0.002, peaks: true, off: cam.x * (0.02 + i * 0.03) });
      Cine.fog(g, e, hx(h + 20, 35, 40), { s: 2, vx: 3 + i * 2, a: 0.1 * k, y0: hy - H * 0.14 + i * H * 0.07, h: H * 0.2, comp: 'lighter' });
    }
    Cine.motes(g, e, { n: 30, seed: 7, col: hx(h + 30, 70, 80), size: 0.7, vy: -0.3, wobble: 3, a: 0.5 * k, twinkle: 1 });
  };

  /* --- deep space --- */
  env.space = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e;
    g.fillStyle = hs(h, 60, 2); g.fillRect(0, 0, W, H);
    Cine.fog(g, e, hx(h, 80, 35), { s: 2.6, vx: 3, vy: 1, a: 0.5 * k, comp: 'lighter', ox: cam.x * 0.1 });
    Cine.fog(g, e, hx(h + 60, 80, 32), { s: 1.9, vx: -4, vy: 2, a: 0.34 * k, comp: 'lighter', ox: 90 });
    Cine.fog(g, e, hx(h - 50, 90, 28), { s: 3.4, vx: 2, vy: -1, a: 0.3 * k, comp: 'lighter', ox: 40 });
    starfield(g, e, c, 150);
    // far planet with terminator + ring
    const px = W * 0.82 + cam.x * 0.06, py = H * 0.22, pr = u * 15;
    g.save(); g.globalAlpha *= 0.85 * k;
    const pg = g.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
    pg.addColorStop(0, hs(h + 30, 50, 55)); pg.addColorStop(0.6, hs(h + 30, 50, 22)); pg.addColorStop(1, hs(h, 60, 4));
    g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
    g.strokeStyle = hs(h + 40, 40, 60, 0.4); g.lineWidth = u * 0.8; g.beginPath(); g.ellipse(px, py, pr * 1.9, pr * 0.4, -0.35, 0, TAU); g.stroke();
    g.restore();
    Cine.motes(g, e, { n: 24, seed: 4, col: hx(h, 40, 80), size: 0.5, vx: 0.6, wobble: 1, a: 0.5 * k, twinkle: 1 });
  };

  /* --- ocean at night --- */
  env.ocean = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx } = e, hy = H * 0.55, t = e.time / 1000;
    sky(g, e, hs(h, 60, 3), hs(h, 55, 26), hy);
    starfield(g, e, c, 90, 0.8);
    Cine.add(g, () => Cine.glow(g, cx, hy, e.R * 0.6, hx(h, 70, 60), 0.45 * k));
    Cine.fog(g, e, hx(h, 40, 50), { s: 2.4, vx: 6, a: 0.18 * k, y0: 0, h: hy, comp: 'lighter' });
    const wg = g.createLinearGradient(0, hy, 0, H); wg.addColorStop(0, hs(h, 60, 16)); wg.addColorStop(1, hs(h, 60, 3)); g.fillStyle = wg; g.fillRect(0, hy, W, H - hy);
    for (let i = 0; i < 22; i++) {
      const q = i / 22, y = hy + q * q * (H - hy), amp = u * (0.25 + q * 1.8);
      g.strokeStyle = hs(h, 70, 55 + q * 10, (0.12 + 0.35 * (1 - q)) * k); g.lineWidth = 0.8 + q * 2.5; g.beginPath();
      for (let x = 0; x <= W; x += 12) { const yy = y + Math.sin(x * 0.02 * (1 + q) + t * 1.5 + i * 1.7) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    }
    Cine.add(g, () => { const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, hs(h, 70, 70, 0.55 * k)); gr.addColorStop(1, hs(h, 70, 60, 0)); g.fillStyle = gr; g.fillRect(cx - u * 7, hy, u * 14, H - hy); });
    Cine.fog(g, e, hx(h, 50, 60), { s: 2, vx: 10, a: 0.14 * k, y0: hy - u * 6, h: u * 14, comp: 'lighter' });
    Cine.motes(g, e, { n: 26, seed: 5, col: hx(h, 60, 85), size: 0.5, vy: -0.5, wobble: 2, a: 0.6 * k, twinkle: 1, y0: hy, h: H - hy });
  };

  /* --- forge / volcano --- */
  env.forge = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e;
    sky(g, e, hs(h, 60, 3), hs(h, 70, 12));
    Cine.add(g, () => { Cine.glow(g, cx, H * 0.95, e.R * 1.1, hx(h, 100, 50), 0.55 * k); Cine.glow(g, cx, cy, e.R * 0.6, hx(h + 10, 100, 45), 0.22 * k); });
    Cine.fog(g, e, hx(h, 60, 22), { s: 2.4, vx: 8, vy: -6, a: 0.5 * k, y0: H * 0.3, h: H * 0.7 });
    Cine.fog(g, e, hx(h + 15, 100, 40), { s: 1.8, vx: 12, vy: -10, a: 0.22 * k, comp: 'lighter', y0: H * 0.45, h: H * 0.55 });
    Cine.ridge(g, e, { y: H * 0.82, amp: H * 0.09, seed: 4, col: hs(h, 50, 3), freq: 0.006, peaks: true, off: cam.x * 0.03, rim: hs(h + 10, 100, 55, 0.7), rimW: 2 });
    Cine.ridge(g, e, { y: H * 0.94, amp: H * 0.05, seed: 6, col: hs(h, 40, 2), freq: 0.01, off: cam.x * 0.06, rim: hs(h + 15, 100, 60, 0.6), rimW: 2 });
    Cine.motes(g, e, { n: 70, seed: 9, col: hx(h + 12, 100, 62), size: 0.9, vy: -5, vx: 0.8, wobble: 3, a: 0.9 * k, twinkle: 1, fade: y => clamp(y / e.H * 1.4) });
    Cine.motes(g, e, { n: 26, seed: 10, col: '#ffe0a0', size: 0.5, vy: -8, wobble: 2, a: 0.9 * k, twinkle: 1 });
  };

  /* --- frozen cavern --- */
  env.ice = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, r = rng(7);
    sky(g, e, hs(h, 50, 9), hs(h, 45, 26));
    Cine.add(g, () => Cine.glow(g, cx, cy, e.R * 0.9, hx(h, 60, 65), 0.32 * k));
    Cine.fog(g, e, hx(h, 40, 75), { s: 2.4, vx: 6, a: 0.22 * k, comp: 'lighter' });
    for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 6; i++) {          // ice spikes framing the scene
      const bx = side < 0 ? -u * 2 + i * u * 6 : W + u * 2 - i * u * 6, by = H * (0.95 - (i % 2) * 0.06), hh = H * (0.34 + r() * 0.22 - i * 0.03), ww = u * (5 + r() * 5);
      g.beginPath(); g.moveTo(bx - ww, by); g.lineTo(bx + (side < 0 ? 1 : -1) * ww * 0.6 + cam.x * 0.02, by - hh); g.lineTo(bx + ww, by); g.closePath();
      const gr = g.createLinearGradient(bx, by, bx, by - hh); gr.addColorStop(0, hs(h, 60, 14, 0.95)); gr.addColorStop(1, hs(h, 60, 45, 0.85)); g.fillStyle = gr; g.fill();
      g.strokeStyle = hs(h, 70, 85, 0.5); g.lineWidth = 1; g.stroke();
    }
    Cine.shafts(g, e, { x: cx, y: -20, ang: Math.PI / 2, n: 4, len: H * 1.3, spread: u * 26, w: u * 3, col: hx(h, 60, 85), a: 0.09 * k, seed: 12 });
    Cine.motes(g, e, { n: 90, seed: 8, col: '#eaf6ff', size: 0.55, vy: 2.4, vx: -0.6, wobble: 3, a: 0.85 * k });
    Cine.ridge(g, e, { y: H * 0.93, amp: H * 0.04, seed: 2, col: hs(h, 45, 12), freq: 0.01, rim: hs(h, 60, 80, 0.4) });
  };

  /* --- void --- */
  env.void = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, t = e.time / 1000;
    g.fillStyle = hs(h, 60, 1.5); g.fillRect(0, 0, W, H);
    Cine.fog(g, e, hx(h, 70, 20), { s: 3, vx: 2, vy: 1, a: 0.5 * k, comp: 'lighter' });
    for (let i = 0; i < 12; i++) {
      const q = ((t * 0.07 + i / 12) % 1), rr = e.R * (0.1 + q * 1.1);
      g.strokeStyle = hs(h, 80, 55, (1 - q) * 0.28 * k); g.lineWidth = u * (0.2 + q * 1.1);
      g.beginPath(); g.ellipse(cx, cy, rr, rr * (0.72 + 0.2 * Math.sin(t * 0.4 + i)), t * 0.03 * i, 0, TAU); g.stroke();
    }
    starfield(g, e, c, 70, 0.8);
    Cine.add(g, () => Cine.glow(g, cx, cy, u * 50, hx(h, 80, 40), 0.18 * k));
    Cine.motes(g, e, { n: 34, seed: 6, col: hx(h, 60, 70), size: 0.6, vy: -0.4, wobble: 4, a: 0.5 * k, twinkle: 1 });
  };

  /* --- bioluminescent forest --- */
  env.forest = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, t = e.time / 1000;
    sky(g, e, hs(h, 50, 3), hs(h, 45, 9));
    Cine.add(g, () => Cine.glow(g, cx, cy, e.R * 0.85, hx(h, 70, 35), 0.3 * k));
    for (let layer = 0; layer < 3; layer++) {
      const r = rng(30 + layer), d = layer / 2, col = hs(h, 35, 9 - layer * 3), n = 9 - layer * 2;
      Cine.fog(g, e, hx(h, 50, 28), { s: 2.2, vx: 4 + layer * 2, a: 0.12 * k, comp: 'lighter' });
      for (let i = 0; i < n; i++) {
        const x = r() * W + cam.x * (0.02 + d * 0.06), w = u * (2.2 + r() * 3.5) * (1 + d), sway = Math.sin(t * 0.4 + i) * u * 0.4;
        g.fillStyle = col; g.beginPath(); g.moveTo(x - w * 0.7, H + 10); g.quadraticCurveTo(x - w * 0.5 + sway, H * 0.5, x - w * 0.3 + sway * 2, -10); g.lineTo(x + w * 0.3 + sway * 2, -10); g.quadraticCurveTo(x + w * 0.5 + sway, H * 0.5, x + w * 0.7, H + 10); g.fill();
      }
    }
    Cine.shafts(g, e, { x: cx * 1.3, y: -20, ang: 1.9, n: 4, len: H * 1.3, spread: u * 20, w: u * 3, col: hx(h, 60, 65), a: 0.08 * k, seed: 6 });
    Cine.motes(g, e, { n: 46, seed: 2, col: hx(h + 20, 90, 65), size: 1.2, vy: -0.2, vx: 0.2, wobble: 5, a: 0.95 * k, twinkle: 1 });
    Cine.fog(g, e, hx(h, 40, 50), { s: 2.4, vx: 5, a: 0.2 * k, y0: H * 0.65, h: H * 0.35, comp: 'lighter' });
    Cine.ridge(g, e, { y: H * 0.96, amp: H * 0.05, seed: 1, col: hs(h, 40, 2), freq: 0.012 });
  };

  /* --- ruined temple --- */
  env.temple = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, hy = H * 0.52;
    sky(g, e, hs(h, 40, 4), hs(h, 45, 12));
    Cine.add(g, () => Cine.glow(g, cx, hy, e.R * 0.7, hx(h, 80, 50), 0.32 * k));
    // floor tiles in perspective
    const fg = g.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, hs(h, 40, 8)); fg.addColorStop(1, hs(h, 40, 3)); g.fillStyle = fg; g.fillRect(0, hy, W, H - hy);
    g.strokeStyle = hs(h, 50, 40, 0.22 * k); g.lineWidth = 1;
    for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(cx + i * u * 2, hy); g.lineTo(cx + i * u * 22 + cam.x * 0.2, H); g.stroke(); }
    for (let i = 1; i < 12; i++) { const y = hy + Math.pow(i / 12, 2) * (H - hy); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // pillars receding
    for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 4; i++) {
      const d = i / 3, x = cx + side * (u * (52 - d * 34)) + cam.x * (0.05 - d * 0.03), w = u * (9 - d * 6), top = hy - (H * 0.45) * (1 - d * 0.6), bot = hy + (H * 0.22) * (1 - d * 0.7);
      const col = Cine.css(Cine.mixc(Cine.rgb(hx(h, 40, 18)), Cine.rgb(hx(h, 40, 3)), d * 0.9));
      g.fillStyle = col; g.fillRect(x - w / 2, top, w, bot - top);
      g.fillStyle = hs(h, 60, 60, 0.18); g.fillRect(x - w / 2, top, w * 0.12, bot - top);
      g.fillStyle = col; g.fillRect(x - w * 0.7, top - u * 1.5, w * 1.4, u * 1.5); g.fillRect(x - w * 0.7, bot, w * 1.4, u);
    }
    Cine.fog(g, e, hx(h, 40, 40), { s: 2.2, vx: 4, a: 0.22 * k, comp: 'lighter', y0: hy - H * 0.2, h: H * 0.5 });
    Cine.shafts(g, e, { x: cx, y: -30, ang: Math.PI / 2, n: 3, len: H * 1.4, spread: u * 10, w: u * 7, col: hx(h, 70, 75), a: 0.13 * k, seed: 3 });
    Cine.motes(g, e, { n: 60, seed: 12, col: hx(h, 70, 82), size: 0.6, vy: 0.4, vx: 0.2, wobble: 3, a: 0.7 * k, twinkle: 1 });
  };

  /* --- thunderstorm --- */
  env.storm = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, t = e.time / 1000;
    sky(g, e, hs(h, 40, 3), hs(h, 40, 12));
    Cine.fog(g, e, hx(h, 40, 30), { s: 2.8, vx: 24, a: 0.6 * k, y0: 0, h: H * 0.7, comp: 'lighter' });
    Cine.fog(g, e, hx(h, 30, 8), { s: 2.2, vx: 34, a: 0.75 * k, y0: 0, h: H * 0.5 });
    const s = Math.floor(t * 3.2), f = rng(s + 77)();
    if (f > 0.86) { const bx = f * 977 % 1 * W; Cine.add(g, () => { Cine.glow(g, bx, H * 0.15, e.R * 0.8, hx(h, 60, 75), 0.35 * k); }); g.save(); g.globalCompositeOperation = 'lighter'; Cine.glow(g, bx, H * 0.2, 1, '#fff', 0); g.restore(); G.fx.bolt(g, bx, -10, bx + (f - 0.9) * W * 2, H * 0.62, s, u * 14, hx(h, 40, 90), u * 0.5, 0.9 * k); }
    g.strokeStyle = hs(h, 30, 80, 0.16 * k); g.lineWidth = 1; g.beginPath();
    for (let i = 0; i < 90; i++) { const x = ((i * 97 + t * 240) % (W + 80)) - 40, y = (i * 53 + t * 900) % H; g.moveTo(x, y); g.lineTo(x - 6, y + 22); }
    g.stroke();
    Cine.ridge(g, e, { y: H * 0.9, amp: H * 0.05, seed: 5, col: hs(h, 30, 2), freq: 0.008, off: cam.x * 0.03 });
  };

  /* --- desert at sundown --- */
  env.desert = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx } = e, hy = H * 0.56;
    sky(g, e, hs(h + 330, 50, 8), hs(h, 90, 45), hy + H * 0.05);
    Cine.add(g, () => { Cine.glow(g, cx + cam.x * 0.05, hy - u * 6, e.R * 0.75, hx(h, 100, 55), 0.5 * k); Cine.glow(g, cx, hy - u * 6, u * 26, hx(h + 10, 100, 82), 0.85 * k); });
    g.fillStyle = hs(h + 8, 100, 88, k); g.beginPath(); g.arc(cx + cam.x * 0.05, hy - u * 6, u * 9, 0, TAU); g.fill();
    Cine.fog(g, e, hx(h, 70, 50), { s: 2.4, vx: 12, a: 0.22 * k, comp: 'lighter', y0: hy - H * 0.2, h: H * 0.3 });
    for (let i = 0; i < 4; i++) {
      const d = i / 3, col = Cine.css(Cine.mixc(Cine.rgb(hx(h, 70, 30)), Cine.rgb(hx(h, 60, 4)), 0.3 + d * 0.65));
      Cine.ridge(g, e, { y: hy + i * H * 0.07, amp: H * (0.05 + i * 0.012), seed: 40 + i, col, freq: 0.004 + i * 0.001, off: cam.x * (0.03 + i * 0.03) + i * 30, rim: hs(h, 100, 65, 0.2) });
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = hs(h, 90, 75, 0.2 * k); g.lineWidth = 1.2; const r = rng(5), t = e.time / 1000;
    for (let i = 0; i < 40; i++) { const y = hy + r() * (H - hy), x = ((r() * W + t * u * (10 + r() * 14)) % (W + 80)) - 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + u * (3 + r() * 5), y - u * 0.2); g.stroke(); }
    g.restore();
    Cine.motes(g, e, { n: 30, seed: 3, col: hx(h, 80, 75), size: 0.45, vx: 8, wobble: 1, a: 0.6 * k });
  };

  /* --- polar aurora --- */
  env.aurora = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx } = e, t = e.time / 1000;
    sky(g, e, hs(h, 55, 3), hs(h, 45, 10)); starfield(g, e, c, 110);
    for (let i = 0; i < 5; i++) {
      const hh = h + i * 26 - 30, bx = W * (i + 0.5) / 5, amp = u * (10 + i * 3);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let s = 0; s < 3; s++) {
        g.beginPath();
        for (let y = 0; y <= H * 0.8; y += H * 0.04) { const x = bx + Math.sin(y * 0.011 + t * 0.6 + i * 1.7 + s * 0.4) * amp * (0.4 + y / H) + cam.x * 0.05; y ? g.lineTo(x - u * (5 - s), y) : g.moveTo(x - u * (5 - s), y); }
        for (let y = H * 0.8; y >= 0; y -= H * 0.04) { const x = bx + Math.sin(y * 0.011 + t * 0.6 + i * 1.7 + s * 0.4) * amp * (0.4 + y / H) + cam.x * 0.05; g.lineTo(x + u * (5 - s) * 1.6, y); }
        g.closePath(); const gr = g.createLinearGradient(0, 0, 0, H * 0.8); gr.addColorStop(0, hs(hh, 90, 60, 0)); gr.addColorStop(0.35, hs(hh, 90, 60, (0.16 - s * 0.04) * k)); gr.addColorStop(1, hs(hh, 90, 60, 0)); g.fillStyle = gr; g.fill();
      }
      g.restore();
    }
    Cine.fog(g, e, hx(h, 60, 40), { s: 2.6, vx: 5, a: 0.12 * k, comp: 'lighter', y0: 0, h: H * 0.6 });
    Cine.ridge(g, e, { y: H * 0.86, amp: H * 0.06, seed: 12, col: hs(h, 20, 6), freq: 0.006, off: cam.x * 0.04, rim: hs(h, 50, 80, 0.35) });
    Cine.ridge(g, e, { y: H * 0.96, amp: H * 0.03, seed: 3, col: hs(h, 20, 3), freq: 0.01, off: cam.x * 0.07 });
    Cine.motes(g, e, { n: 50, seed: 4, col: '#e8fbff', size: 0.5, vy: 1.6, vx: -0.4, wobble: 2, a: 0.7 * k });
  };

  /* --- deep underwater --- */
  env.abyss = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx } = e, t = e.time / 1000;
    sky(g, e, hs(h, 60, 22), hs(h, 60, 3));
    Cine.fog(g, e, hx(h, 60, 45), { s: 2.6, vx: 4, vy: -2, a: 0.28 * k, comp: 'lighter' });
    for (let i = 0; i < 7; i++) {                                             // caustic shafts, wavering
      const bx = ((i + 0.3) / 7) * W + Math.sin(t * 0.5 + i) * u * 3 + cam.x * 0.05;
      Cine.shafts(g, e, { x: bx, y: -20, ang: 1.45 + Math.sin(t * 0.3 + i) * 0.08, n: 1, len: H * 1.3, w: u * (3 + (i % 3) * 2), col: hx(h, 70, 70), a: 0.12 * k, seed: i });
    }
    Cine.ridge(g, e, { y: H * 0.9, amp: H * 0.06, seed: 3, col: hs(h, 50, 4), freq: 0.007, peaks: true, off: cam.x * 0.04 });
    const r = rng(9); g.fillStyle = hs(h, 40, 3, 0.7);
    for (let i = 0; i < 5; i++) { const x = ((r() * W + t * u * (2 + r() * 3) * (i % 2 ? 1 : -1)) % (W + 60) + W + 60) % (W + 60) - 30, y = H * (0.3 + r() * 0.4); g.beginPath(); g.ellipse(x, y, u * 2.4, u * 0.7, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - u * 2.2, y); g.lineTo(x - u * 3.6, y - u * 0.8); g.lineTo(x - u * 3.6, y + u * 0.8); g.fill(); }
    // bubbles
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = hs(h, 60, 85, 0.5 * k); g.lineWidth = 1;
    for (let i = 0; i < 34; i++) { const bx = r() * W, sp = 0.4 + r(), y = H - ((t * u * 4 * sp + r() * H) % (H + 20)), x = bx + Math.sin(t * sp + i) * u; g.beginPath(); g.arc(x, y, u * (0.3 + r() * 0.7), 0, TAU); g.stroke(); }
    g.restore();
    Cine.motes(g, e, { n: 40, seed: 2, col: hx(h, 50, 80), size: 0.4, vy: -0.6, wobble: 2, a: 0.5 * k });
  };

  /* --- heaven --- */
  env.sanctum = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, t = e.time / 1000;
    sky(g, e, hs(h + 10, 60, 30), hs(h, 80, 62));
    Cine.add(g, () => { Cine.glow(g, cx, H * 0.1, e.R * 1.0, hx(h, 90, 80), 0.55 * k); });
    for (let i = 0; i < 16; i++) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, -u * 6); g.rotate(-0.9 + (i / 15) * 1.8 + Math.sin(t * 0.2) * 0.03); const gr = g.createLinearGradient(0, 0, 0, H * 1.5); gr.addColorStop(0, hs(h, 90, 85, 0.16 * k)); gr.addColorStop(1, hs(h, 90, 85, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(-u * 0.6, 0); g.lineTo(u * 0.6, 0); g.lineTo(u * 7, H * 1.5); g.lineTo(-u * 7, H * 1.5); g.fill(); g.restore(); }
    Cine.fog(g, e, '#ffffff', { s: 2.4, vx: 6, a: 0.28 * k, y0: H * 0.45, h: H * 0.6 });
    Cine.fog(g, e, hx(h, 90, 78), { s: 1.8, vx: -8, a: 0.3 * k, y0: H * 0.6, h: H * 0.5 });
    Cine.fog(g, e, '#ffffff', { s: 3, vx: 3, a: 0.35 * k, y0: H * 0.78, h: H * 0.3 });
    const r = rng(6);
    for (let i = 0; i < 12; i++) { const x = r() * W, y = ((t * u * (1 + r()) + r() * H) % (H + 40)) - 20, s = u * (0.8 + r() * 1.5); g.save(); g.translate(x + Math.sin(t + i) * u * 2, y); g.rotate(Math.sin(t * 0.7 + i) * 0.6); g.fillStyle = `rgba(255,255,255,${0.55 * k})`; g.beginPath(); g.ellipse(0, 0, s * 0.35, s, 0, 0, TAU); g.fill(); g.restore(); }
    Cine.motes(g, e, { n: 50, seed: 9, col: hx(h, 90, 88), size: 0.6, vy: 0.5, wobble: 3, a: 0.8 * k, twinkle: 1 });
  };

  /* --- neon grid --- */
  env.cyber = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx } = e, hy = H * 0.5, t = e.time / 1000;
    sky(g, e, hs(h, 70, 3), hs(h, 70, 14), hy);
    starfield(g, e, c, 70, 0.7);
    const sr = u * 20; g.save(); g.beginPath(); g.arc(cx, hy - u * 6, sr, 0, TAU); g.clip();
    const sg = g.createLinearGradient(0, hy - sr, 0, hy + sr); sg.addColorStop(0, hs(h + 50, 100, 65, k)); sg.addColorStop(1, hs(h, 100, 45, k)); g.fillStyle = sg; g.fillRect(cx - sr, hy - sr, sr * 2, sr * 2);
    g.fillStyle = hs(h, 70, 5); for (let i = 0; i < 6; i++) g.fillRect(cx - sr, hy - u * 6 + i * u * 2.6 - u * 1, sr * 2, u * (0.3 + i * 0.28)); g.restore();
    Cine.add(g, () => Cine.glow(g, cx, hy - u * 6, e.R * 0.6, hx(h + 20, 100, 55), 0.4 * k));
    g.fillStyle = hs(h, 70, 4); g.fillRect(0, hy, W, H - hy);
    g.strokeStyle = hs(h + 20, 100, 62, 0.65 * k); g.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) { const q = ((i / 16 + t * 0.18) % 1), y = hy + q * q * (H - hy); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(cx + i * u * 1.6, hy); g.lineTo(cx + i * u * 16 + cam.x * 0.2, H); g.stroke(); }
    g.fillStyle = hs(h + 20, 100, 65, 0.9 * k); g.fillRect(0, hy, W, 1.5);
    Cine.fog(g, e, hx(h, 80, 40), { s: 2.4, vx: 8, a: 0.18 * k, comp: 'lighter', y0: hy - u * 10, h: u * 30 });
    Cine.motes(g, e, { n: 30, seed: 5, col: hx(h + 20, 100, 70), size: 0.5, vy: -1, wobble: 1, a: 0.7 * k, twinkle: 1 });
  };

  /* --- clockwork vault --- */
  env.clockwork = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, t = e.time / 1000;
    sky(g, e, hs(h, 50, 3), hs(h, 55, 10));
    Cine.add(g, () => Cine.glow(g, cx, cy, e.R * 0.8, hx(h, 90, 48), 0.3 * k));
    const gear = (x, y, r, teeth, rot, col, rim) => {
      g.beginPath();
      for (let i = 0; i < teeth * 2; i++) { const a = rot + (i / (teeth * 2)) * TAU, rr = i % 2 ? r * 0.9 : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = rim; g.lineWidth = 1.5; g.stroke();
      g.beginPath(); g.arc(x, y, r * 0.55, 0, TAU); g.strokeStyle = rim; g.stroke(); g.beginPath(); g.arc(x, y, r * 0.16, 0, TAU); g.fillStyle = hs(h, 50, 2); g.fill();
    };
    [[-0.85, -0.5, 30, 18, 1, 6], [0.9, -0.4, 22, 14, -1.3, 8], [-0.7, 0.75, 26, 16, -1.1, 4], [0.8, 0.7, 34, 20, 0.9, 2], [0.05, -0.95, 18, 12, 1.5, 12]].forEach(([dx, dy, r, n, sp, s2], i) => {
      gear(cx + dx * u * 55 + cam.x * 0.04 * (i % 2 ? 1 : -1), cy + dy * u * 50, u * r, n, t * 0.25 * sp + i, hs(h, 45, 5 + (i % 2) * 2), hs(h, 80, 45, 0.55));
    });
    Cine.fog(g, e, hx(h, 60, 30), { s: 2.2, vx: 6, a: 0.24 * k, comp: 'lighter' });
    Cine.motes(g, e, { n: 40, seed: 3, col: hx(h, 90, 62), size: 0.6, vy: -1.4, wobble: 2, a: 0.8 * k, twinkle: 1 });
    Cine.ridge(g, e, { y: H * 0.95, amp: H * 0.03, seed: 4, col: hs(h, 40, 2), freq: 0.01 });
  };

  /* --- arcane circle --- */
  env.arcane = (g, e, c) => {
    const { h, k, cam } = c, { W, H, u, cx, cy } = e, t = e.time / 1000, fy = H * 0.76;
    sky(g, e, hs(h, 55, 3), hs(h, 55, 10));
    Cine.fog(g, e, hx(h, 60, 30), { s: 2.4, vx: 5, a: 0.24 * k, comp: 'lighter' });
    Cine.add(g, () => Cine.glow(g, cx, fy, e.R * 0.6, hx(h, 90, 50), 0.35 * k));
    g.save(); g.translate(cx, fy); g.scale(1, 0.26);
    for (let ring = 0; ring < 4; ring++) {
      const rr = u * (18 + ring * 11), dir = ring % 2 ? -1 : 1;
      g.strokeStyle = hs(h + ring * 8, 90, 62, (0.75 - ring * 0.1) * k); g.lineWidth = u * (0.5 - ring * 0.07); g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
      for (let i = 0; i < 24 + ring * 6; i++) { const a = t * 0.15 * dir + (i / (24 + ring * 6)) * TAU, l = i % 3 ? u * 0.7 : u * 1.6; g.beginPath(); g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a) * (rr + l), Math.sin(a) * (rr + l)); g.stroke(); }
    }
    g.strokeStyle = hs(h + 30, 90, 70, 0.7 * k); g.lineWidth = u * 0.4;
    for (let s = 0; s < 2; s++) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = t * 0.1 + i * TAU / 3 + s * Math.PI / 3, px = Math.cos(a) * u * 20, py = Math.sin(a) * u * 20; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); }
    g.restore();
    Cine.shafts(g, e, { x: cx, y: fy, ang: -Math.PI / 2, n: 3, len: H * 0.8, spread: u * 14, w: u * 5, col: hx(h, 80, 65), a: 0.1 * k, seed: 8 });
    Cine.motes(g, e, { n: 60, seed: 5, col: hx(h + 20, 90, 75), size: 0.7, vy: -2, wobble: 2, a: 0.85 * k, twinkle: 1 });
  };

  env.default = env.cave;
})();
