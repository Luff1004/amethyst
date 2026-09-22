/*
  MORE SCENE TEMPLATES  (used by the 10만~1000만대 minerals)
  vortex | lightning | orbit | crossbeam | ripple | prism | aurora | runes | slash | tunnel | bloom | constellation
  Params go in the cutscene as  p: { n, dir, seed }  - every template reads what it needs.
*/
(() => {
  const { E, seg, rgba, rng, clamp } = G;
  const fx = G.fx, T = G.cutscenes.template;
  const TAU = Math.PI * 2;

  /* spiral arms of light collapse into the centre, then a galaxy blooms */
  T('vortex', (g, e, def) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col, o = def.p, arms = o.n || 4, dir = o.dir || 1;
    fx.bg(g, e, 0.12 + 0.35 * seg(p, 0.3, 0.6));
    const conv = seg(p, 0, 0.55), b = E.outExpo(seg(p, 0.55, 0.8)), r = rng(o.seed || 7), N = arms * 34;
    for (let i = 0; i < N; i++) {
      const arm = i % arms, a0 = (arm / arms) * TAU + (r() - 0.5) * 0.5, r0 = (18 + r() * 80) * u;
      const q = clamp(conv * 1.35 - r() * 0.35);
      if (q >= 1) continue;
      const ang = a0 + dir * (1 - q) * 7, rad = r0 * (1 - q * q);
      const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
      g.strokeStyle = rgba(i % 3 ? A : '#ffffff', 0.25 + 0.7 * q); g.lineWidth = u * 0.4;
      const q2 = Math.max(0, q - 0.05), ang2 = a0 + dir * (1 - q2) * 7, rad2 = r0 * (1 - q2 * q2);
      g.beginPath(); g.moveTo(cx + Math.cos(ang2) * rad2, cy + Math.sin(ang2) * rad2); g.lineTo(x, y); g.stroke();
    }
    fx.glow(g, cx, cy, u * (10 + 60 * b) + u * 14 * conv, A, 0.4 + 0.5 * conv);
    fx.ring(g, cx, cy, u * 120 * b, u * 1.8, '#ffffff', p > 0.55 ? 1 - b : 0);
    if (p > 0.55) {
      const rr = rng(33);
      for (let i = 0; i < 160; i++) {
        const arm = i % arms, t = rr(), ang = (arm / arms) * TAU + dir * (t * 5.5 + time * 0.0004), rad = u * (6 + t * 44) * b;
        g.fillStyle = rgba(i % 2 ? A : B, 0.85 * (1 - t * 0.5));
        g.fillRect(cx + Math.cos(ang) * rad + (rr() - 0.5) * u * 3, cy + Math.sin(ang) * rad * 0.9 + (rr() - 0.5) * u * 3, u * 0.55, u * 0.55);
      }
      fx.gem3(g, cx, cy, u * 10 * E.outBack(seg(p, 0.55, 0.75)), [A, B], time * 0.0009, 1, 6);
    }
  });

  /* storm bolts hammer the centre until it cracks open */
  T('lightning', (g, e, def) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col, o = def.p, r = rng(o.seed || 5), n = o.n || 7;
    fx.bg(g, e, 0.06);
    const cl = rng(2);
    for (let i = 0; i < 9; i++) fx.glow(g, cl() * W, cl() * H * 0.5, u * (30 + cl() * 30), B, 0.1 + 0.05 * Math.sin(time * 0.001 + i));
    let lit = 0;
    for (let i = 0; i < n; i++) {
      const t0 = 0.08 + (i / n) * 0.5, k = (p - t0) / 0.05;
      if (k < 0 || k > 1) continue;
      const x0 = cx + (r() - 0.5) * W * 0.7;
      fx.bolt(g, x0, -10, cx + (r() - 0.5) * u * 8, cy, i * 91 + 3, u * 14, A, u * (0.6 + i * 0.12), 1 - k);
      fx.bolt(g, x0, -10, cx, cy, i * 91 + 3, u * 14, '#ffffff', u * 0.25, 1 - k);
      lit = Math.max(lit, 1 - k);
    }
    if (lit > 0) fx.flash(g, e, lit * 0.16);
    const b = seg(p, 0.58, 1);
    fx.glow(g, cx, cy, u * (12 + 50 * E.outCubic(b)), A, 0.3 + 0.6 * E.outCubic(b));
    if (b > 0) {
      fx.bolt(g, cx, -10, cx, cy, 777, u * 6, '#ffffff', u * 4, 1 - E.outCubic(seg(b, 0, 0.3)));
      fx.flash(g, e, 0.9 * (1 - E.outCubic(seg(b, 0, 0.18))));
      fx.gem3(g, cx, cy, u * 11 * E.outBack(seg(b, 0.05, 0.3)), [A, B], time * 0.0007, 1, 5);
      const s = Math.floor(time / 90), rr = rng(s);
      for (let i = 0; i < 4; i++) {
        const an = rr() * TAU;
        fx.bolt(g, cx, cy, cx + Math.cos(an) * u * (16 + rr() * 22), cy + Math.sin(an) * u * (16 + rr() * 22), s * 7 + i, u * 5, A, u * 0.3, 0.8);
      }
    }
  });

  /* gems orbit faster and faster, then fall into the centre */
  T('orbit', (g, e, def) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 6, dir = o.dir || 1;
    fx.bg(g, e, 0.14);
    const fall = E.inCubic(seg(p, 0.15, 0.58)), spin = 0.0006 + fall * 0.01;
    const hold = p > 0.58;
    for (let i = 0; i < n; i++) {
      const tilt = (i / n) * Math.PI, base = u * (52 - 4 * i * 0.3) * (1 - fall) + (hold ? u * 22 : 0);
      const ang = (i / n) * TAU + dir * (time * spin + fall * 12);
      const x0 = Math.cos(ang) * base, y0 = Math.sin(ang) * base * 0.34;
      const x = cx + x0 * Math.cos(tilt) - y0 * Math.sin(tilt), y = cy + x0 * Math.sin(tilt) + y0 * Math.cos(tilt);
      if (!hold) { g.strokeStyle = rgba(B, 0.14); g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, u * 52, u * 52 * 0.34, tilt, 0, TAU); g.stroke(); }
      fx.glow(g, x, y, u * 7, A, 0.5);
      fx.gem3(g, x, y, u * (hold ? 2.4 : 3.2) * (1 - fall * 0.5), [A, B], time * 0.004 + i, 1, 4);
    }
    const b = seg(p, 0.58, 1);
    fx.glow(g, cx, cy, u * (10 + 26 * fall + 46 * E.outCubic(b)), A, 0.35 + 0.55 * Math.max(fall, b));
    if (hold) {
      fx.flash(g, e, 0.85 * (1 - E.outCubic(seg(b, 0, 0.15))));
      fx.ring(g, cx, cy, u * 110 * E.outExpo(b), u * 1.8, '#ffffff', 1 - b);
      fx.gem3(g, cx, cy, u * 11 * E.outBack(seg(b, 0.05, 0.3)), [A, B], time * 0.0006, 1, 8, 1.4);
    }
  });

  /* two or three beams sweep across and cross into a star flare */
  T('crossbeam', (g, e, def) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 3;
    fx.bg(g, e, 0.1);
    const L = e.R * 2.2;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI + (o.rot || 0.3), k = E.outCubic(seg(p, 0.06 + i * 0.08, 0.5));
      g.save(); g.translate(cx, cy); g.rotate(ang);
      const gr = g.createLinearGradient(-L * k, 0, L * k, 0);
      gr.addColorStop(0, rgba(A, 0)); gr.addColorStop(0.5, rgba('#ffffff', 0.9)); gr.addColorStop(1, rgba(A, 0));
      g.fillStyle = gr; g.fillRect(-L * k, -u * 0.35, L * 2 * k, u * 0.7);
      g.fillStyle = rgba(B, 0.18 * k); g.fillRect(-L * k, -u * 2.2, L * 2 * k, u * 4.4);
      g.restore();
    }
    const c = E.outCubic(seg(p, 0.45, 0.62));
    fx.glow(g, cx, cy, u * (10 + 50 * c), A, 0.7 * c);
    fx.rays(g, cx, cy, u * 90 * c, n * 4, time * 0.0002, u * 0.8, '#ffffff', 0.5 * c);
    if (p > 0.58) {
      const b = seg(p, 0.58, 1);
      fx.flash(g, e, 0.8 * (1 - E.outCubic(seg(b, 0, 0.14))));
      g.fillStyle = rgba('#ffffff', 0.9 * (1 - b * 0.4)); g.fillRect(0, cy - u * 0.35, W, u * 0.7);
      fx.gem3(g, cx, cy, u * 11 * E.outBack(seg(b, 0.05, 0.3)), [A, B], time * 0.0006, 1, 6);
    }
  });

  /* rippling water of light, orbs rise, a gem surfaces */
  T('ripple', (g, e, def) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col, o = def.p, r = rng(o.seed || 9);
    fx.bg(g, e, 0.16);
    const oy = cy + u * 26, k = E.outCubic(seg(p, 0, 0.35));
    for (let i = 0; i < 7; i++) {
      const q = ((time * 0.00045 + i / 7) % 1), rad = u * 78 * q * k;
      g.save(); g.translate(cx, oy); g.scale(1, 0.3); fx.ring(g, 0, 0, rad, u * (1.6 - q), i % 2 ? B : A, (1 - q) * 0.85 * k); g.restore();
    }
    for (let i = 0; i < 60; i++) {
      const x = cx + (r() - 0.5) * u * 70, sp = 0.02 + r() * 0.05, ph = r() * 100, hgt = u * 60;
      const t = ((time * sp * 0.02 + ph) % 1), y = oy - t * hgt - u * 4;
      g.fillStyle = rgba(i % 2 ? A : '#ffffff', (1 - t) * 0.8 * k); g.fillRect(x, y, u * 0.5, u * 0.5);
    }
    const rise = E.outCubic(seg(p, 0.35, 0.65)), gy = oy - u * 26 * rise + Math.sin(time * 0.003) * u;
    fx.glow(g, cx, gy, u * 55 * rise, A, 0.6 * rise);
    if (rise > 0) fx.gem3(g, cx, gy, u * 12 * rise, [A, B], time * 0.0006, 1, 6);
    if (p > 0.6) fx.flash(g, e, 0.5 * (1 - E.outCubic(seg(p, 0.6, 0.7))));
  });

  /* white light splits into a spectrum */
  T('prism', (g, e, def) => {
    const { p, u, W, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 8, hue0 = o.hue || 0;
    fx.bg(g, e, 0.08);
    const beam = E.outCubic(seg(p, 0.05, 0.42)), fan = E.outCubic(seg(p, 0.42, 0.68));
    g.fillStyle = rgba('#ffffff', 0.9); g.fillRect(0, cy - u * 0.5, (cx - u * 8) * beam, u);
    fx.glow(g, (cx - u * 8) * beam, cy, u * 8, '#ffffff', 0.6 * beam);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), ang = (t - 0.5) * 1.5 * fan + Math.sin(time * 0.0007 + i) * 0.02 * fan, col = G.hsl(hue0 + t * 300, 95, 62);
      g.save(); g.translate(cx + u * 6, cy); g.rotate(ang);
      const L = e.R * 1.3 * fan, gr = g.createLinearGradient(0, 0, L, 0);
      gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, -u * 0.6); g.lineTo(L, -u * (0.6 + 3 * fan)); g.lineTo(L, u * (0.6 + 3 * fan)); g.lineTo(0, u * 0.6); g.closePath(); g.fill();
      g.restore();
    }
    const pk = E.outBack(seg(p, 0.02, 0.22));
    g.fillStyle = rgba(A, 0.15 + 0.2 * beam); g.strokeStyle = rgba('#ffffff', 0.9); g.lineWidth = u * 0.4;
    fx.polyPath(g, cx, cy, u * 12 * pk, 3, 0); g.fill(); g.stroke();
    if (p > 0.6) fx.flash(g, e, 0.7 * (1 - E.outCubic(seg(p, 0.6, 0.7))));
  });

  /* curtains of aurora, a gem rises through them */
  T('aurora', (g, e, def) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 5;
    fx.bg(g, e, 0.04);
    fx.stars(g, e, o.seed || 4, 70);
    const k = E.outCubic(seg(p, 0, 0.45));
    for (let i = 0; i < n; i++) {
      const baseX = ((i + 0.5) / n) * W, col = i % 2 ? B : A, amp = u * (8 + i * 2);
      g.beginPath();
      const steps = 22;
      for (let s = 0; s <= steps; s++) {
        const y = (s / steps) * H * 0.85, x = baseX + Math.sin(y * 0.012 + time * 0.0009 + i * 1.7) * amp * (0.5 + s / steps);
        s ? g.lineTo(x - u * 3, y) : g.moveTo(x - u * 3, y);
      }
      for (let s = steps; s >= 0; s--) {
        const y = (s / steps) * H * 0.85, x = baseX + Math.sin(y * 0.012 + time * 0.0009 + i * 1.7) * amp * (0.5 + s / steps);
        g.lineTo(x + u * 4 + Math.sin(time * 0.001 + i) * u, y);
      }
      g.closePath();
      const gr = g.createLinearGradient(0, 0, 0, H * 0.85);
      gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.4, rgba(col, 0.42 * k)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fill();
    }
    const rise = E.outCubic(seg(p, 0.35, 0.7)), gy = cy + u * 30 * (1 - rise) + Math.sin(time * 0.0025) * u;
    fx.glow(g, cx, gy, u * 50 * rise, A, 0.6 * rise);
    if (rise > 0) fx.gem3(g, cx, gy, u * 12 * rise, [A, B], time * 0.0005, 1, 7);
    if (p > 0.62) fx.flash(g, e, 0.55 * (1 - E.outCubic(seg(p, 0.62, 0.72))));
  });

  /* falling runic script collapses into a sigil */
  T('runes', (g, e, def) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col, o = def.p, r = rng(o.seed || 12);
    fx.bg(g, e, 0.08);
    const cols = 13, cw = W / cols, fade = 1 - 0.55 * seg(p, 0.55, 0.7);
    for (let c = 0; c < cols; c++) {
      const sp = 0.05 + r() * 0.1, off = r() * 1000, x = (c + 0.5) * cw, gs = cw * 0.55;
      const k = E.outCubic(seg(p, c * 0.01, 0.3 + c * 0.01));
      for (let j = 0; j < 14; j++) {
        const y = ((time * sp + off + j * gs * 1.6) % (H + gs * 4)) - gs * 2, head = j === 0;
        const gr = rng(c * 131 + j * 17 + Math.floor(time / 700 * (j % 3)));
        g.strokeStyle = rgba(head ? '#ffffff' : (j % 2 ? A : B), (head ? 0.95 : 0.55 * (1 - j / 14)) * k * fade); g.lineWidth = u * 0.3;
        g.beginPath();
        for (let s = 0; s < 3; s++) {
          const x0 = x + (gr() - 0.5) * gs, y0 = y + (gr() - 0.5) * gs, x1 = x + (gr() - 0.5) * gs, y1 = y + (gr() - 0.5) * gs;
          g.moveTo(x0, y0); g.lineTo(x1, y1);
        }
        g.stroke();
      }
    }
    const s1 = E.outBack(seg(p, 0.4, 0.62)), rot = time * 0.0005;
    if (s1 > 0) {
      fx.glow(g, cx, cy, u * 60 * s1, A, 0.5 * s1);
      g.strokeStyle = rgba(A, 0.95); g.lineWidth = u * 0.5;
      fx.polyPath(g, cx, cy, u * 30 * s1, 6, rot); g.stroke();
      fx.polyPath(g, cx, cy, u * 30 * s1, 3, -rot); g.stroke();
      fx.polyPath(g, cx, cy, u * 30 * s1, 3, -rot + Math.PI / 3); g.stroke();
      fx.ring(g, cx, cy, u * 36 * s1, u * 0.4, B, 0.9); fx.ring(g, cx, cy, u * 24 * s1, u * 0.3, A, 0.8);
      fx.gem3(g, cx, cy, u * 8 * s1, [A, B], time * 0.001, 1, 5);
    }
    if (p > 0.6) fx.flash(g, e, 0.6 * (1 - E.outCubic(seg(p, 0.6, 0.7))));
  });

  /* blade slashes cut the dark and let the light through */
  T('slash', (g, e, def) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 5, r = rng(o.seed || 21);
    fx.bg(g, e, 0.04);
    const L = e.R * 2.3;
    for (let i = 0; i < n; i++) {
      const t0 = 0.08 + (i / n) * 0.42, k = seg(p, t0, t0 + 0.07);
      if (k <= 0) continue;
      const ang = (i / n) * Math.PI + (r() - 0.5) * 0.5 + 0.25, fadeK = 1 - 0.55 * seg(p, t0 + 0.07, 0.7);
      g.save(); g.translate(cx + (r() - 0.5) * u * 14, cy + (r() - 0.5) * u * 14); g.rotate(ang);
      const head = -L + L * 2 * E.outCubic(k), tail = Math.max(-L, head - L * 0.9);
      const gr = g.createLinearGradient(tail, 0, head, 0);
      gr.addColorStop(0, rgba(A, 0)); gr.addColorStop(1, rgba('#ffffff', 0.95 * fadeK));
      g.fillStyle = gr; g.fillRect(tail, -u * 0.35, head - tail, u * 0.7);
      g.fillStyle = rgba(B, 0.22 * fadeK); g.fillRect(-L, -u * 1.6, L * 2, u * 3.2 * k);
      g.restore();
    }
    const b = E.outCubic(seg(p, 0.55, 0.85));
    fx.glow(g, cx, cy, e.R * 0.9 * b, A, 0.55 * b);
    fx.rays(g, cx, cy, e.R * b, 20, time * 0.0002, u * 1.2, '#ffffff', 0.25 * b);
    if (p > 0.56) {
      fx.flash(g, e, 0.85 * (1 - E.outCubic(seg(p, 0.56, 0.68))));
      fx.gem3(g, cx, cy, u * 12 * E.outBack(seg(p, 0.58, 0.78)), [A, B], time * 0.0006, 1, 4, 1.5);
    }
  });

  /* warp tunnel of frames rushing at the viewer */
  T('tunnel', (g, e, def) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col, o = def.p, sides = o.n || 6;
    fx.bg(g, e, 0.1);
    const warp = 0.00012 + 0.0007 * E.inCubic(seg(p, 0, 0.6)) * (p < 0.6 ? 1 : 0.15);
    const K = 16;
    g.lineJoin = 'miter';
    for (let i = 0; i < K; i++) {
      const t = ((time * warp + i / K) % 1), s = Math.pow(t, 2.4);
      g.strokeStyle = rgba(i % 2 ? A : B, Math.min(1, t * 3) * (1 - t * 0.3) * 0.9); g.lineWidth = u * (0.2 + s * 1.3);
      fx.polyPath(g, cx, cy, e.R * 1.2 * s + u * 1.5, sides, (o.dir || 1) * (i * 0.13 + time * 0.0002)); g.stroke();
    }
    for (let i = 0; i < sides * 3; i++) {
      const an = (i / (sides * 3)) * TAU + time * 0.0001;
      g.strokeStyle = rgba(A, 0.1); g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx + Math.cos(an) * u * 2, cy + Math.sin(an) * u * 2); g.lineTo(cx + Math.cos(an) * e.R * 1.2, cy + Math.sin(an) * e.R * 1.2); g.stroke();
    }
    const b = seg(p, 0.55, 1);
    fx.glow(g, cx, cy, u * (12 + 45 * E.outCubic(b)), '#ffffff', 0.35 + 0.5 * seg(p, 0.3, 0.6));
    if (p > 0.58) {
      fx.flash(g, e, 0.95 * (1 - E.outCubic(seg(b, 0, 0.15))));
      fx.gem3(g, cx, cy, u * 11 * E.outBack(seg(b, 0.05, 0.3)), [A, B], time * 0.0008, 1, sides);
    }
  });

  /* layered petals of crystal unfold */
  T('bloom', (g, e, def) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 8, dir = o.dir || 1;
    fx.bg(g, e, 0.12 + 0.25 * seg(p, 0.3, 0.7));
    fx.glow(g, cx, cy, u * 70 * E.outCubic(seg(p, 0.1, 0.6)), A, 0.4);
    for (let layer = 3; layer >= 0; layer--) {
      const k = E.outBack(seg(p, 0.08 + (3 - layer) * 0.1, 0.55 + (3 - layer) * 0.05)), len = u * (14 + layer * 10) * k;
      const rot = dir * (time * 0.0002 * (layer % 2 ? 1 : -1)) + layer * 0.2;
      for (let i = 0; i < n; i++) {
        const an = rot + (i / n) * TAU, wd = len * 0.32;
        g.save(); g.translate(cx, cy); g.rotate(an);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.5, -wd); g.lineTo(len, 0); g.lineTo(len * 0.5, wd); g.closePath();
        g.fillStyle = rgba(layer % 2 ? B : A, 0.22 + 0.16 * (3 - layer)); g.fill();
        g.strokeStyle = rgba('#ffffff', 0.55); g.lineWidth = u * 0.2; g.stroke();
        g.restore();
      }
    }
    if (p > 0.55) {
      const b = seg(p, 0.55, 1);
      fx.flash(g, e, 0.7 * (1 - E.outCubic(seg(b, 0, 0.15))));
      fx.gem3(g, cx, cy, u * 9 * E.outBack(seg(b, 0.05, 0.3)), [A, B], time * 0.0007, 1, 6);
      const rr = rng(6);
      for (let i = 0; i < 26; i++) {
        const an = rr() * TAU, d = u * (14 + rr() * 30), fy = ((time * 0.02 * (0.4 + rr()) + rr() * 100) % 30);
        g.fillStyle = rgba(A, 0.7 * b); g.fillRect(cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.8 - fy, u * 0.5, u * 0.5);
      }
    }
  });

  /* stars appear one by one and join into a figure */
  T('constellation', (g, e, def) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col, o = def.p, n = o.n || 9, r = rng(o.seed || 31);
    fx.bg(g, e, 0.06);
    fx.stars(g, e, 8, 60, 0.3);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + (o.rot || 0), rad = u * (26 + (i % 2) * 12 + r() * 6);
      pts.push([cx + Math.cos(an) * rad, cy + Math.sin(an) * rad * 0.9]);
    }
    const prog = seg(p, 0.05, 0.55) * n;
    g.strokeStyle = rgba(A, 0.7); g.lineWidth = u * 0.3;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= n; i++) {
      const seg1 = clamp(prog - (i - 1));
      if (seg1 <= 0) break;
      const a = pts[i - 1], b = pts[i % n];
      g.lineTo(G.lerp(a[0], b[0], seg1), G.lerp(a[1], b[1], seg1));
    }
    g.stroke();
    const fl = E.outCubic(seg(p, 0.55, 0.75));
    for (let i = 0; i < n; i++) {
      const k = clamp(prog - i + 1);
      if (k <= 0) continue;
      const [x, y] = pts[i], tw = 0.7 + 0.3 * Math.sin(time * 0.006 + i);
      fx.glow(g, x, y, u * (4 + 5 * fl) * k, A, 0.7 * tw);
      fx.rays(g, x, y, u * (3 + 6 * fl) * k, 4, Math.PI / 4, u * 0.25, '#ffffff', 0.9);
    }
    fx.glow(g, cx, cy, u * (10 + 50 * fl), A, 0.6 * fl);
    if (p > 0.58) {
      fx.flash(g, e, 0.7 * (1 - E.outCubic(seg(p, 0.58, 0.68))));
      fx.gem3(g, cx, cy, u * 10 * E.outBack(seg(p, 0.6, 0.8)), [A, B], time * 0.0007, 1, 6);
    }
  });
})();
