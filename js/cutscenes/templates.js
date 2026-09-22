/*
  BUILT-IN SCENE TEMPLATES
  Use them from a cutscene with  template: 'burst' | 'rain' | 'meteor' | 'gate' | 'rings' | 'core' | 'pillar' | 'eclipse'
  and change the look with `colors: [bright, mid, dark]`.
  Register your own with  G.cutscenes.template('name', (g, e, def) => { ... })
*/
(() => {
  const { E, seg, rgba, rng, clamp } = G;
  const fx = G.fx, T = G.cutscenes.template;
  const TAU = Math.PI * 2;

  /* converging light -> detonation with rays and shock rings */
  T('burst', (g, e) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col;
    const conv = E.inCubic(seg(p, 0, 0.5)), b = E.outExpo(seg(p, 0.48, 0.75));
    fx.bg(g, e, 0.15 + 0.35 * seg(p, 0.3, 0.6));
    const r = rng(11);
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, d0 = (25 + r() * 80) * u, q = clamp(conv * 1.25 - r() * 0.25);
      const d = d0 * (1 - E.inCubic(q));
      if (q >= 1) continue;
      g.fillStyle = rgba(i % 3 ? A : '#ffffff', 0.35 + 0.6 * q);
      g.fillRect(cx + Math.cos(a) * d - u * 0.25, cy + Math.sin(a) * d - u * 0.25, u * 0.5, u * 0.5);
    }
    fx.glow(g, cx, cy, u * (6 + 55 * b) + u * 12 * conv, A, 0.5 + 0.5 * conv);
    fx.rays(g, cx, cy, u * 130 * b, 26, time * 0.0003, u * 1.1, A, 0.5 * (1 - 0.35 * b));
    fx.rays(g, cx, cy, u * 80 * b, 13, -time * 0.0004, u * 1.6, '#ffffff', 0.35);
    for (let i = 0; i < 3; i++) fx.ring(g, cx, cy, u * 110 * clamp(b - i * 0.16) , u * (1.6 - i * 0.4), i ? B : A, p > 0.48 ? 1 - clamp(b - i * 0.16) * 0.75 : 0);
    if (p > 0.45) fx.gem(g, cx, cy, u * 11 * E.outBack(seg(p, 0.45, 0.65)), [A, B], time * 0.0006);
  });

  /* light columns and a downpour of shards */
  T('rain', (g, e) => {
    const { p, u, W, H, cx, time } = e, [A, B] = e.col;
    fx.bg(g, e, 0.2);
    const cols = 7, r = rng(5);
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) / cols * W, k = E.outCubic(seg(p, 0.05 + i * 0.05, 0.5));
      const gr = g.createLinearGradient(x, 0, x, H);
      gr.addColorStop(0, rgba(A, 0.0)); gr.addColorStop(0.5, rgba(B, 0.22 * k)); gr.addColorStop(1, rgba(A, 0.0));
      g.fillStyle = gr; g.fillRect(x - u * 3, 0, u * 6, H);
    }
    for (let i = 0; i < 110; i++) {
      const x = r() * W, delay = r() * e.time * 0 + r() * 2200, sp = 0.35 + r() * 0.5, sz = u * (0.9 + r() * 2.2), ph = r() * 9;
      const t = time - delay; if (t < 0) continue;
      const y = ((t * sp) % (H * 1.15)) - H * 0.08;
      g.save(); g.translate(x, y); g.rotate(ph + t * 0.004);
      g.fillStyle = rgba(i % 2 ? A : B, 0.85);
      g.beginPath(); g.moveTo(0, -sz); g.lineTo(sz * 0.6, 0); g.lineTo(0, sz); g.lineTo(-sz * 0.6, 0); g.closePath(); g.fill();
      g.restore();
    }
    const k = E.outCubic(seg(p, 0.3, 0.7));
    fx.glow(g, cx, e.H, u * 90 * k, A, 0.55 * k);
  });

  /* a comet crashes into the centre */
  T('meteor', (g, e) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col;
    fx.bg(g, e, 0.1);
    const r = rng(3);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(255,255,255,${0.15 + 0.5 * ((Math.sin(time * 0.002 + i) + 1) / 2)})`;
      g.fillRect(r() * W, r() * H, u * 0.35, u * 0.35);
    }
    const q = E.inCubic(seg(p, 0.08, 0.6)), sx = -W * 0.1, sy = -H * 0.1;
    const hx = G.lerp(sx, cx, q), hy = G.lerp(sy, cy, q);
    if (p < 0.6) {
      for (let i = 30; i >= 0; i--) {
        const t = i / 30, x = hx - (cx - sx) * 0.35 * t * (1 - q * 0.3), y = hy - (cy - sy) * 0.35 * t * (1 - q * 0.3);
        g.fillStyle = rgba(t < 0.4 ? '#ffffff' : A, (1 - t) * 0.6);
        g.beginPath(); g.arc(x, y, u * (4.5 * (1 - t) + 0.5), 0, TAU); g.fill();
      }
      fx.glow(g, hx, hy, u * 16, A, 0.8);
      fx.gem(g, hx, hy, u * 4.5, [A, '#ffffff'], time * 0.01);
    }
    const im = seg(p, 0.6, 1);
    if (im > 0) {
      fx.flash(g, e, 0.85 * (1 - E.outCubic(seg(im, 0, 0.25))));
      fx.ring(g, cx, cy, u * 120 * E.outExpo(im), u * 2.4, A, 1 - im);
      fx.ring(g, cx, cy, u * 80 * E.outExpo(clamp(im * 1.2)), u * 1.2, '#ffffff', 0.8 * (1 - im));
      const rr = rng(8);
      for (let i = 0; i < 40; i++) {
        const an = rr() * TAU, d = u * (10 + rr() * 60) * E.outExpo(im), gy = im * im * u * 25;
        g.fillStyle = rgba(rr() > 0.5 ? A : B, 1 - im * 0.7);
        g.fillRect(cx + Math.cos(an) * d, cy + Math.sin(an) * d + gy, u * 0.9, u * 0.9);
      }
      fx.glow(g, cx, cy, u * 45, A, 0.6 * E.outCubic(im));
      fx.rays(g, cx, cy, u * 90 * E.outCubic(im), 16, time * 0.00025, u * 1.3, A, 0.3 * E.outCubic(im));
      fx.gem(g, cx, cy, u * 8 * E.outBack(seg(im, 0.1, 0.5)), [A, '#ffffff'], time * 0.0007);
      for (let i = 0; i < 18; i++) {
        const x = cx + (rng(i + 40)() - 0.5) * u * 60, sp = 0.02 + rng(i + 90)() * 0.04;
        g.fillStyle = rgba(A, 0.7 * E.outCubic(im)); g.fillRect(x, cy - ((time * sp + i * 37) % (u * 60)), u * 0.5, u * 0.5);
      }
    }
  });

  /* two sealed doors grind open onto blinding light */
  T('gate', (g, e) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B, C] = e.col;
    const open = E.inOut(seg(p, 0.28, 0.68));
    fx.bg(g, e, 0.05);
    const glowK = 0.15 + open;
    fx.glow(g, cx, cy, e.R * (0.3 + 0.8 * open), A, 0.9 * glowK);
    fx.rays(g, cx, cy, e.R * 1.1 * open, 22, time * 0.00025, u * 1.4, '#ffffff', 0.22 * open);
    g.fillStyle = rgba('#ffffff', 0.5 * open); g.fillRect(cx - u * 0.6 - u * 8 * open, 0, u * 1.2 + u * 16 * open, H);
    const dw = (W / 2) * (1 - open), shake = p > 0.28 && p < 0.68 ? Math.sin(time * 0.09) * u * 0.25 : 0;
    for (const side of [-1, 1]) {
      const x = side < 0 ? -W / 2 + dw - (W / 2) * 0 : W - dw;
      const px = side < 0 ? dw - W / 2 : W - dw;
      g.save(); g.translate(shake, 0);
      g.fillStyle = C; g.fillRect(px, 0, W / 2, H);
      g.fillStyle = rgba(B, 0.35);
      for (let i = 1; i < 6; i++) g.fillRect(px + (W / 2) * (i / 6) - 1, 0, 2, H);
      g.strokeStyle = rgba(A, 0.7); g.lineWidth = 2;
      g.strokeRect(px + (side < 0 ? 0 : 2), 2, W / 2 - 2, H - 4);
      g.restore();
    }
    // sigil on the doors, splits with them
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
    const sg = 1 - E.outCubic(seg(p, 0.45, 0.7));
    if (sg > 0) {
      g.strokeStyle = rgba(A, sg); g.lineWidth = 2;
      fx.polyPath(g, cx, cy, u * 22, 6, time * 0.0005); g.stroke();
      fx.polyPath(g, cx, cy, u * 14, 3, -time * 0.0008); g.stroke();
      fx.ring(g, cx, cy, u * 30, 1.5, A, sg);
    }
    g.restore();
    if (open > 0.6) fx.gem(g, cx, cy, u * 12 * E.outBack(seg(p, 0.62, 0.85)), [A, B], time * 0.0007);
  });

  /* rotating sigil rings snapping into place */
  T('rings', (g, e) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col;
    fx.bg(g, e, 0.18);
    const N = 6;
    for (let i = 0; i < N; i++) {
      const k = E.outBack(seg(p, 0.05 + i * 0.07, 0.4 + i * 0.07));
      const r = u * (12 + i * 9) * k, dir = i % 2 ? -1 : 1, sides = 3 + i;
      g.strokeStyle = rgba(i % 2 ? B : A, 0.35 + 0.65 * seg(p, 0.5, 0.7)); g.lineWidth = u * 0.35;
      fx.polyPath(g, cx, cy, r, sides, dir * time * (0.0004 + i * 0.00008)); g.stroke();
      if (i > 0) {
        g.fillStyle = rgba(A, 0.9);
        for (let v = 0; v < sides; v++) {
          const an = dir * time * (0.0004 + i * 0.00008) + (v / sides) * TAU;
          g.fillRect(cx + Math.cos(an) * r - u * 0.5, cy + Math.sin(an) * r - u * 0.5, u, u);
        }
      }
    }
    const b = seg(p, 0.55, 0.8);
    fx.glow(g, cx, cy, u * (10 + 70 * E.outExpo(b)), A, 0.3 + 0.6 * b);
    fx.ring(g, cx, cy, u * 100 * E.outExpo(b), u * 1.6, '#ffffff', b > 0 ? 1 - b : 0);
    if (b > 0) fx.gem(g, cx, cy, u * 9 * E.outBack(b), [A, B], time * 0.001);
  });

  /* a crystal heart cracks and detonates */
  T('core', (g, e) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col;
    fx.bg(g, e, 0.12);
    const beat = 1 + 0.06 * Math.sin(time * (0.008 + p * 0.02)) * (1 - seg(p, 0.55, 0.6));
    const shat = seg(p, 0.58, 1), crack = E.inOut(seg(p, 0.08, 0.56));
    if (shat === 0) {
      fx.glow(g, cx, cy, u * (28 + 20 * crack), A, 0.35 + 0.4 * crack);
      fx.gem(g, cx, cy, u * 20 * beat * E.outBack(seg(p, 0, 0.18)), [A, B], 0);
      const r = rng(21);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = u * 0.3;
      for (let i = 0; i < 9; i++) {
        const an = r() * TAU, len = u * 22 * crack * (0.6 + r() * 0.5);
        g.beginPath(); g.moveTo(cx, cy);
        for (let s = 1; s <= 4; s++) g.lineTo(cx + Math.cos(an + (r() - 0.5) * 0.5) * len * (s / 4), cy + Math.sin(an + (r() - 0.5) * 0.5) * len * (s / 4));
        g.stroke();
      }
    } else {
      fx.flash(g, e, 0.9 * (1 - E.outCubic(seg(shat, 0, 0.2))));
      fx.glow(g, cx, cy, u * 90 * E.outExpo(shat), A, 0.7 * (1 - shat * 0.4));
      fx.rays(g, cx, cy, u * 120 * E.outExpo(shat), 18, time * 0.0003, u * 1.2, A, 0.35);
      fx.ring(g, cx, cy, u * 130 * E.outExpo(shat), u * 2, '#ffffff', 1 - shat);
      const r = rng(9);
      for (let i = 0; i < 46; i++) {
        const an = r() * TAU, d = u * (8 + r() * 70) * E.outExpo(shat), sz = u * (0.8 + r() * 2.4);
        g.save(); g.translate(cx + Math.cos(an) * d, cy + Math.sin(an) * d + shat * u * 8); g.rotate(r() * TAU + time * 0.003);
        g.fillStyle = rgba(i % 2 ? A : B, 1 - shat * 0.5);
        g.beginPath(); g.moveTo(-sz, sz * 0.6); g.lineTo(0, -sz); g.lineTo(sz, sz * 0.6); g.closePath(); g.fill();
        g.restore();
      }
    }
  });

  /* a pillar of light lowers a gem */
  T('pillar', (g, e) => {
    const { p, u, W, H, cx, cy, time } = e, [A, B] = e.col;
    fx.bg(g, e, 0.05);
    const k = E.outCubic(seg(p, 0.05, 0.55)), w = u * (5 + 16 * k);
    const gr = g.createLinearGradient(cx - w, 0, cx + w, 0);
    gr.addColorStop(0, rgba(A, 0)); gr.addColorStop(0.5, rgba(A, 0.85 * k)); gr.addColorStop(1, rgba(A, 0));
    g.fillStyle = gr; g.fillRect(cx - w, 0, w * 2, H);
    g.fillStyle = rgba('#ffffff', 0.6 * k); g.fillRect(cx - w * 0.18, 0, w * 0.36, H);
    const r = rng(17);
    for (let i = 0; i < 60; i++) {
      const x = cx + (r() - 0.5) * w * 3, sp = 0.05 + r() * 0.12, ph = r() * H;
      const y = H - ((time * sp + ph) % H);
      g.fillStyle = rgba(i % 2 ? A : '#ffffff', 0.7 * k); g.fillRect(x, y, u * 0.5, u * (0.8 + r()));
    }
    const rise = E.outCubic(seg(p, 0.35, 0.75)), gy = cy + u * 30 * (1 - rise) + Math.sin(time * 0.003) * u * 1.2;
    fx.glow(g, cx, gy, u * 50 * rise, A, 0.7 * rise);
    fx.gem(g, cx, gy, u * 15 * E.outBack(seg(p, 0.35, 0.65)), [A, B], time * 0.0006);
    for (let i = 0; i < 3; i++) {
      const q = ((time * 0.0007 + i / 3) % 1);
      g.save(); g.translate(cx, cy + u * 34); g.scale(1, 0.28);
      fx.ring(g, 0, 0, u * 60 * q, u * 1.6, A, (1 - q) * 0.9 * k);
      g.restore();
    }
    fx.flash(g, e, 0.5 * (1 - E.outCubic(seg(p, 0.58, 0.68))) * (p > 0.58 ? 1 : 0));
  });

  /* the sun is swallowed, a corona flares */
  T('eclipse', (g, e) => {
    const { p, u, cx, cy, time } = e, [A, B] = e.col;
    const cover = E.inOut(seg(p, 0.12, 0.6)), sunR = u * 22;
    const dark = cover * 0.92;
    g.fillStyle = e.col[2]; g.fillRect(0, 0, e.W, e.H);
    fx.glow(g, cx, cy, e.R * (1.1 - 0.5 * cover), B, 0.55 * (1 - dark));
    const r = rng(2);
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${0.7 * dark * (0.4 + 0.6 * ((Math.sin(time * 0.003 + i) + 1) / 2))})`; g.fillRect(r() * e.W, r() * e.H, u * 0.35, u * 0.35); }
    fx.glow(g, cx, cy, sunR * 3.2, A, 0.55 * (1 - dark * 0.3));
    g.fillStyle = A; g.beginPath(); g.arc(cx, cy, sunR, 0, TAU); g.fill();
    // corona
    const c = seg(p, 0.5, 0.75);
    fx.rays(g, cx, cy, sunR * (1.6 + 2.6 * c) , 36, time * 0.0002, u * 0.9, '#ffffff', 0.5 * c);
    fx.glow(g, cx, cy, sunR * (1.5 + 3 * c), '#ffffff', 0.5 * c);
    fx.ring(g, cx, cy, sunR * 1.06, u * (0.4 + 0.6 * c), '#ffffff', 0.6 + 0.4 * c);
    // moon
    const mx = cx + (1 - cover) * -u * 50, my = cy + (1 - cover) * u * 10;
    g.fillStyle = '#000'; g.beginPath(); g.arc(mx, my, sunR * 1.02, 0, TAU); g.fill();
    if (p > 0.55) {
      fx.flash(g, e, 0.7 * (1 - E.outCubic(seg(p, 0.55, 0.66))));
      fx.ring(g, cx, cy, u * 120 * E.outExpo(seg(p, 0.55, 1)), u * 1.6, A, 1 - seg(p, 0.55, 1));
    }
  });
})();
