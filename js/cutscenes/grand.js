/*
  GRAND TEMPLATE  (1억대 minerals - the cinematic tier)
  A staged, long-form scene:  atmosphere  ->  hero entrance + energy build  ->  detonation  ->  majestic hold.
  Mix and match with  p: { bg, hero, entry, finale, seed, hue2 }
    bg     : stars | nebula | aurora | storm | void | embers | ocean | grid | snow | runes
    hero   : gem | orb | spire | ring | star | blade | crown | flame | cube | moon
    entry  : descend | rise | converge | emerge
    finale : nova | pillars | halo | shatter
  Also exposes G.grand (helpers) so bespoke scenes (ultra.js) can reuse the parts.
*/
(() => {
  const { E, seg, rgba, rng, clamp, lerp } = G;
  const fx = G.fx, TAU = Math.PI * 2;

  /* ---------------- backgrounds ---------------- */
  const bgs = {
    stars(g, e, o, k) {
      fx.bg(g, e, 0.14 * k); fx.stars(g, e, o.seed || 3, 150, 0.4);
      fx.glow(g, e.cx + Math.sin(e.time * 0.0003) * e.u * 8, e.cy, e.R * 0.7, e.col[1], 0.12 * k);
    },
    nebula(g, e, o, k) {
      const { u, W, H, time } = e, r = rng(o.seed || 5), cols = [e.col[0], e.col[1], G.hsl(o.hue2 || 300, 80, 55)];
      g.fillStyle = e.col[2]; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        const x = r() * W + Math.sin(time * 0.0002 + i * 2) * u * 10, y = r() * H + Math.cos(time * 0.00017 + i) * u * 10;
        fx.glow(g, x, y, u * (40 + r() * 40), cols[i % 3], 0.2 * k);
      }
      fx.stars(g, e, 9, 90, 0.35);
    },
    aurora(g, e, o, k) {
      const { u, W, H, time } = e;
      fx.bg(g, e, 0.03); fx.stars(g, e, 4, 80);
      for (let i = 0; i < 6; i++) {
        const bx = ((i + 0.5) / 6) * W, col = i % 2 ? e.col[1] : e.col[0], amp = u * (8 + i * 2);
        g.beginPath();
        for (let s = 0; s <= 20; s++) { const y = (s / 20) * H * 0.8, x = bx + Math.sin(y * 0.012 + time * 0.0009 + i * 1.7) * amp * (0.5 + s / 20); s ? g.lineTo(x - u * 3, y) : g.moveTo(x - u * 3, y); }
        for (let s = 20; s >= 0; s--) { const y = (s / 20) * H * 0.8, x = bx + Math.sin(y * 0.012 + time * 0.0009 + i * 1.7) * amp * (0.5 + s / 20); g.lineTo(x + u * 4, y); }
        g.closePath();
        const gr = g.createLinearGradient(0, 0, 0, H * 0.8);
        gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.4, rgba(col, 0.4 * k)); gr.addColorStop(1, rgba(col, 0));
        g.fillStyle = gr; g.fill();
      }
    },
    storm(g, e, o, k) {
      const { u, W, H, time } = e, cl = rng(o.seed || 2);
      fx.bg(g, e, 0.05);
      for (let i = 0; i < 9; i++) fx.glow(g, cl() * W, cl() * H * 0.55, u * (34 + cl() * 30), e.col[1], (0.13 + 0.05 * Math.sin(time * 0.0008 + i)) * k);
      const s = Math.floor(time / 240), f = rng(s + (o.seed || 2))();
      if (f > 0.9) { const x = f * 40 % 1 * W; fx.bolt(g, x, -5, x + (f - 0.95) * W, H * 0.6, s, u * 12, e.col[0], u * 0.5, 0.8); fx.flash(g, e, 0.07); }
      g.strokeStyle = rgba(e.col[0], 0.16); g.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const x = (i * 97 + time * 0.2) % (W + 60) - 30, y = (i * 53 + time * 0.9) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 16); g.stroke(); }
    },
    void(g, e, o, k) {
      const { u, cx, cy, time } = e;
      fx.bg(g, e, 0.02);
      for (let i = 0; i < 10; i++) {
        const q = ((time * 0.00008 + i / 10) % 1), r = e.R * (0.15 + q * 1.0);
        g.strokeStyle = rgba(e.col[1], (1 - q) * 0.25 * k); g.lineWidth = u * (0.25 + q);
        g.beginPath(); g.ellipse(cx, cy, r, r * (0.8 + 0.2 * Math.sin(time * 0.0004 + i)), time * 0.00005 * i, 0, TAU); g.stroke();
      }
      fx.stars(g, e, 6, 60, 0.3);
      fx.glow(g, cx, cy, u * 30, e.col[1], 0.16 * k);
    },
    embers(g, e, o, k) {
      const { u, W, H, time } = e, r = rng(o.seed || 8);
      fx.bg(g, e, 0);
      const gr = g.createLinearGradient(0, H, 0, H * 0.3);
      gr.addColorStop(0, rgba(e.col[1], 0.5 * k)); gr.addColorStop(1, rgba(e.col[1], 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 100; i++) {
        const x = r() * W + Math.sin(time * 0.001 + i) * u * 2, sp = 0.03 + r() * 0.08, y = H - ((time * sp + r() * H) % (H * 1.1));
        g.fillStyle = rgba(i % 3 ? e.col[0] : '#ffffff', (0.4 + 0.5 * r()) * k * (y / H)); g.fillRect(x, y, u * 0.5, u * 0.5);
      }
    },
    ocean(g, e, o, k) {
      const { u, W, H, cx, time } = e, hy = H * 0.56;
      fx.bg(g, e, 0);
      const sky = g.createLinearGradient(0, 0, 0, hy); sky.addColorStop(0, e.col[2]); sky.addColorStop(1, rgba(e.col[1], 0.4 * k));
      g.fillStyle = sky; g.fillRect(0, 0, W, hy);
      fx.stars(g, e, 5, 60);
      fx.glow(g, cx, hy, u * 50, e.col[0], 0.4 * k);
      g.fillStyle = e.col[2]; g.fillRect(0, hy, W, H - hy);
      for (let i = 0; i < 16; i++) {
        const t = i / 16, y = hy + t * t * (H - hy), amp = u * (0.3 + t * 1.6);
        g.strokeStyle = rgba(i % 2 ? e.col[0] : e.col[1], (0.15 + 0.4 * (1 - t)) * k); g.lineWidth = 1 + t * 2;
        g.beginPath();
        for (let x = 0; x <= W; x += 16) { const yy = y + Math.sin(x * 0.02 * (1 + t) + time * 0.0015 + i) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
      }
      g.fillStyle = rgba(e.col[0], 0.16 * k); g.fillRect(cx - u * 3, hy, u * 6, H - hy);
    },
    grid(g, e, o, k) {
      const { u, W, H, cx, time } = e, hy = H * 0.5;
      fx.bg(g, e, 0); fx.stars(g, e, 7, 70);
      fx.glow(g, cx, hy, u * 60, e.col[1], 0.4 * k);
      g.strokeStyle = rgba(e.col[0], 0.5 * k); g.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const t = ((i / 14 + time * 0.0002) % 1), y = hy + t * t * (H - hy); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(cx + i * u * 1.5, hy); g.lineTo(cx + i * u * 14, H); g.stroke(); }
      g.fillStyle = rgba(e.col[0], 0.6 * k); g.fillRect(0, hy, W, 1);
    },
    snow(g, e, o, k) {
      const { u, W, H, time } = e, r = rng(o.seed || 13);
      fx.bg(g, e, 0.12 * k);
      for (let i = 0; i < 130; i++) {
        const x = r() * W + Math.sin(time * 0.0008 + i) * u * 3, sp = 0.02 + r() * 0.06, y = ((time * sp + r() * H) % (H + 20)) - 10, s = u * (0.25 + r() * 0.6);
        g.fillStyle = rgba(i % 4 ? '#ffffff' : e.col[0], (0.3 + 0.5 * r()) * k); g.fillRect(x, y, s, s);
      }
    },
    runes(g, e, o, k) {
      const { u, W, H, time } = e, r = rng(o.seed || 12), cols = 10, cw = W / cols;
      fx.bg(g, e, 0.05);
      for (let c = 0; c < cols; c++) {
        const sp = 0.04 + r() * 0.08, off = r() * 1000, x = (c + 0.5) * cw, gs = cw * 0.5;
        for (let j = 0; j < 10; j++) {
          const y = ((time * sp + off + j * gs * 1.7) % (H + gs * 4)) - gs * 2, gr = rng(c * 131 + j * 17 + Math.floor(time / 800 * (j % 3)));
          g.strokeStyle = rgba(j === 0 ? '#ffffff' : (j % 2 ? e.col[0] : e.col[1]), (j === 0 ? 0.9 : 0.4 * (1 - j / 10)) * k); g.lineWidth = u * 0.25;
          g.beginPath();
          for (let s = 0; s < 3; s++) { g.moveTo(x + (gr() - 0.5) * gs, y + (gr() - 0.5) * gs); g.lineTo(x + (gr() - 0.5) * gs, y + (gr() - 0.5) * gs); }
          g.stroke();
        }
      }
    },
  };

  /* ---------------- heroes ---------------- */
  const shardKite = (g, x, y, ang, h, w, cA, cB, a) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.beginPath(); g.moveTo(0, -h); g.lineTo(w, -h * 0.2); g.lineTo(0, h * 0.5); g.closePath(); g.fillStyle = rgba(cA, a); g.fill();
    g.beginPath(); g.moveTo(0, -h); g.lineTo(-w, -h * 0.2); g.lineTo(0, h * 0.5); g.closePath(); g.fillStyle = rgba(cB, a); g.fill();
    g.strokeStyle = rgba('#ffffff', 0.7 * a); g.lineWidth = Math.max(1, w * 0.06);
    g.beginPath(); g.moveTo(0, -h); g.lineTo(w, -h * 0.2); g.lineTo(0, h * 0.5); g.lineTo(-w, -h * 0.2); g.closePath(); g.moveTo(0, -h); g.lineTo(0, h * 0.5); g.stroke();
    g.restore();
  };

  const heroes = {
    gem(g, e, x, y, r, t) { fx.glow(g, x, y, r * 3, e.col[0], 0.5); fx.gem3(g, x, y, r, e.col, t * 0.0007, 1, 8, 1.4); },
    orb(g, e, x, y, r, t) {
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, e.col[0]); gr.addColorStop(1, e.col[1]);
      fx.glow(g, x, y, r * 3.2, e.col[0], 0.5);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
      for (let i = 0; i < 6; i++) { g.strokeStyle = rgba('#ffffff', 0.22); g.lineWidth = r * 0.06; g.beginPath(); g.ellipse(x, y, r * 1.1, r * (0.2 + i * 0.13), t * 0.0004 * (i % 2 ? 1 : -1) + i, 0, TAU); g.stroke(); }
      g.restore();
      fx.ring(g, x, y, r * 1.35, Math.max(1, r * 0.03), '#ffffff', 0.7);
    },
    spire(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3, e.col[0], 0.45);
      const sw = Math.sin(t * 0.001) * 0.03;
      [[-0.55, 0.62, -0.45], [0.55, 0.62, 0.45], [-0.3, 0.8, -0.2], [0.3, 0.8, 0.2]].forEach(([dx, hh, an]) => shardKite(g, x + dx * r, y + r * 0.35, an + sw, r * hh * 1.4, r * 0.3, e.col[0], e.col[1], 0.92));
      shardKite(g, x, y + r * 0.4, sw, r * 1.7, r * 0.42, e.col[0], e.col[1], 1);
    },
    ring(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 2.6, e.col[0], 0.4);
      for (let i = 0; i < 3; i++) {
        g.save(); g.translate(x, y); g.rotate(t * 0.0004 * (i % 2 ? 1 : -1) + (i * TAU) / 3);
        g.strokeStyle = rgba(i % 2 ? e.col[1] : e.col[0], 0.95); g.lineWidth = Math.max(2, r * 0.07);
        g.beginPath(); g.ellipse(0, 0, r * 1.4, r * (0.35 + 0.12 * Math.sin(t * 0.001 + i)), 0, 0, TAU); g.stroke();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(r * 1.4, 0, r * 0.08, 0, TAU); g.fill();
        g.restore();
      }
      fx.gem3(g, x, y, r * 0.5, e.col, t * 0.001, 1, 5);
    },
    star(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3, e.col[0], 0.5);
      const n = 8, rot = t * 0.0004;
      for (let i = 0; i < n; i++) {
        const a0 = rot + (i / n) * TAU, a1 = a0 + TAU / n / 2, a2 = a0 + TAU / n;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a0) * r * 1.3, y + Math.sin(a0) * r * 1.3); g.lineTo(x + Math.cos(a1) * r * 0.42, y + Math.sin(a1) * r * 0.42); g.closePath();
        g.fillStyle = rgba(e.col[0], 0.95); g.fill();
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a1) * r * 0.42, y + Math.sin(a1) * r * 0.42); g.lineTo(x + Math.cos(a2) * r * 1.3, y + Math.sin(a2) * r * 1.3); g.closePath();
        g.fillStyle = rgba(e.col[1], 0.95); g.fill();
      }
      g.strokeStyle = rgba('#ffffff', 0.8); g.lineWidth = Math.max(1, r * 0.03); fx.starPath(g, x, y, r * 1.3, r * 0.42, n, rot); g.stroke();
      fx.glow(g, x, y, r * 0.5, '#ffffff', 0.9);
    },
    blade(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3, e.col[0], 0.4);
      const bob = Math.sin(t * 0.0014) * 0.03;
      shardKite(g, x, y, 0.5 + bob, r * 2.3, r * 0.26, e.col[0], e.col[1], 1);
      shardKite(g, x, y, -0.5 - bob, r * 2.3, r * 0.26, e.col[1], e.col[0], 1);
      fx.gem3(g, x, y, r * 0.36, e.col, t * 0.001, 1, 4);
    },
    crown(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3, e.col[0], 0.45);
      const n = 7, fl = Math.sin(t * 0.002) * r * 0.03;
      g.strokeStyle = rgba(e.col[0], 1); g.lineWidth = Math.max(2, r * 0.06);
      g.beginPath(); g.ellipse(x, y + r * 0.6 + fl, r * 1.2, r * 0.3, 0, 0, TAU); g.stroke();
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU + Math.PI / 2, px = x + Math.cos(an) * r * 1.2, py = y + r * 0.6 + fl + Math.sin(an) * r * 0.3;
        if (Math.sin(an) < 0 && false) continue;
        const hh = r * (i % 2 ? 1.0 : 1.45);
        g.beginPath(); g.moveTo(px - r * 0.17, py); g.lineTo(px, py - hh); g.lineTo(px + r * 0.17, py); g.closePath();
        g.fillStyle = rgba(i % 2 ? e.col[1] : e.col[0], 0.95); g.fill();
        g.strokeStyle = rgba('#ffffff', 0.6); g.lineWidth = 1; g.stroke();
        fx.glow(g, px, py - hh, r * 0.25, '#ffffff', 0.7);
      }
      fx.gem3(g, x, y - r * 0.1 + fl, r * 0.5, e.col, t * 0.0009, 1, 6);
    },
    flame(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3, e.col[1], 0.55);
      for (let i = 0; i < 3; i++) {
        const s = 1 - i * 0.28, fl = 1 + 0.06 * Math.sin(t * 0.008 + i * 2);
        const gr = g.createLinearGradient(x, y - r * 1.5 * s, x, y + r * 0.9);
        gr.addColorStop(0, i === 2 ? '#ffffff' : e.col[0]); gr.addColorStop(1, rgba(e.col[1], i === 2 ? 0.95 : 0.85));
        g.fillStyle = gr; g.beginPath();
        g.moveTo(x, y - r * 1.5 * s * fl);
        g.bezierCurveTo(x + r * 0.9 * s, y - r * 0.4, x + r * 0.8 * s, y + r * 0.9 * s, x, y + r * 0.9 * s);
        g.bezierCurveTo(x - r * 0.8 * s, y + r * 0.9 * s, x - r * 0.9 * s, y - r * 0.4, x, y - r * 1.5 * s * fl);
        g.fill();
      }
    },
    cube(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3, e.col[0], 0.45);
      const proj = (vx, vy, vz, ax, ay) => {
        const cy1 = Math.cos(ay), sy = Math.sin(ay), cx1 = Math.cos(ax), sx = Math.sin(ax);
        const x1 = vx * cy1 + vz * sy, z1 = -vx * sy + vz * cy1, y1 = vy * cx1 - z1 * sx;
        return [x + x1, y + y1];
      };
      const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const Ed = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      [[1, 1, 0.9], [0.55, -1.4, 1]].forEach(([s, sp, a]) => {
        const P = V.map(v => proj(v[0] * r * s, v[1] * r * s, v[2] * r * s, 0.6 + t * 0.0003 * sp, t * 0.0007 * sp));
        g.strokeStyle = rgba(s === 1 ? e.col[0] : '#ffffff', a); g.lineWidth = Math.max(1.5, r * 0.05);
        g.beginPath(); Ed.forEach(([m, n]) => { g.moveTo(P[m][0], P[m][1]); g.lineTo(P[n][0], P[n][1]); }); g.stroke();
        g.fillStyle = rgba(e.col[1], 0.12); g.beginPath(); [0, 1, 2, 3].forEach((i, k) => (k ? g.lineTo(P[i][0], P[i][1]) : g.moveTo(P[i][0], P[i][1]))); g.fill();
      });
      fx.glow(g, x, y, r * 0.45, '#ffffff', 0.9);
    },
    moon(g, e, x, y, r, t) {
      fx.glow(g, x, y, r * 3.2, e.col[0], 0.4);
      const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, e.col[0]); gr.addColorStop(1, e.col[1]);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      const cr = rng(19);
      g.fillStyle = rgba(e.col[1], 0.3);
      for (let i = 0; i < 9; i++) { const an = cr() * TAU, d = cr() * r * 0.75; g.beginPath(); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, r * (0.06 + cr() * 0.13), 0, TAU); g.fill(); }
      g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
      g.fillStyle = rgba(e.col[2], 0.82); g.beginPath(); g.arc(x + r * (0.55 + 0.25 * Math.sin(t * 0.0004)), y - r * 0.1, r * 1.05, 0, TAU); g.fill();
      g.restore();
      fx.ring(g, x, y, r * 1.06, Math.max(1, r * 0.03), '#ffffff', 0.85);
      fx.ring(g, x, y, r * 1.5, Math.max(1, r * 0.02), e.col[0], 0.5);
    },
  };

  /* ---------------- finales ---------------- */
  const finales = {
    nova(g, e, b) {
      const { u, cx, cy, time } = e, [A, B] = e.col;
      fx.glow(g, cx, cy, u * (40 + 80 * E.outCubic(b)), A, 0.55);
      fx.rays(g, cx, cy, e.R * 1.1 * E.outExpo(b), 32, time * 0.00025, u * 1.4, A, 0.3);
      fx.rays(g, cx, cy, e.R * 0.8 * E.outExpo(b), 16, -time * 0.0003, u * 2.2, '#ffffff', 0.22);
      for (let i = 0; i < 4; i++) { const q = clamp(b * 1.4 - i * 0.12); fx.ring(g, cx, cy, e.R * 1.1 * E.outExpo(q), u * (2.4 - i * 0.4), i % 2 ? B : '#ffffff', (1 - q) * 0.9); }
    },
    pillars(g, e, b) {
      const { u, W, H, cx, time } = e, [A, B] = e.col, r = rng(50);
      const hy = H * 0.9;
      fx.glow(g, cx, hy, W * 0.9, A, 0.35 * E.outCubic(b));
      for (let i = 0; i < 9; i++) {
        const x = cx + (r() - 0.5) * W * 0.95, w = u * (2 + r() * 5) * (1 + 0.1 * Math.sin(time * 0.002 + i)), k = E.outCubic(clamp(b * 1.5 - r() * 0.4));
        const gr = g.createLinearGradient(0, hy, 0, hy - H * 1.1 * k);
        gr.addColorStop(0, rgba(i % 2 ? B : A, 0.85)); gr.addColorStop(1, rgba(A, 0));
        g.fillStyle = gr; g.fillRect(x - w, hy - H * 1.1 * k, w * 2, H * 1.1 * k);
        g.fillStyle = rgba('#ffffff', 0.7 * k); g.fillRect(x - w * 0.2, hy - H * 1.1 * k, w * 0.4, H * 1.1 * k);
      }
    },
    halo(g, e, b) {
      const { u, W, cx, cy, time } = e, [A, B] = e.col, k = E.outBack(clamp(b * 1.4));
      const R0 = u * 46 * k, rot = time * 0.00035;
      g.strokeStyle = rgba(A, 0.95); g.lineWidth = u * 0.8; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.stroke();
      g.strokeStyle = rgba(B, 0.7); g.lineWidth = u * 0.3; g.beginPath(); g.arc(cx, cy, R0 * 1.12, 0, TAU); g.stroke();
      for (let i = 0; i < 48; i++) { const an = rot + (i / 48) * TAU, l = i % 4 ? u * 1.2 : u * 3; g.strokeStyle = rgba('#ffffff', 0.75); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + Math.cos(an) * R0 * 1.14, cy + Math.sin(an) * R0 * 1.14); g.lineTo(cx + Math.cos(an) * (R0 * 1.14 + l), cy + Math.sin(an) * (R0 * 1.14 + l)); g.stroke(); }
      const sx = E.outCubic(clamp(b * 1.6));
      const gr = g.createLinearGradient(cx - W * sx, 0, cx + W * sx, 0);
      gr.addColorStop(0, rgba(A, 0)); gr.addColorStop(0.5, rgba('#ffffff', 0.95)); gr.addColorStop(1, rgba(A, 0));
      g.fillStyle = gr; g.fillRect(cx - W * sx, cy - u * 0.4, W * 2 * sx, u * 0.8);
      fx.glow(g, cx, cy, u * 40, A, 0.35);
    },
    shatter(g, e, b) {
      const { u, cx, cy, time } = e, [A, B] = e.col, r = rng(60);
      const k = E.outExpo(b);
      g.strokeStyle = rgba('#ffffff', 0.85 * (1 - b * 0.4)); g.lineWidth = u * 0.3;
      for (let i = 0; i < 14; i++) {
        const an = r() * TAU, len = e.R * (0.5 + r() * 0.7) * k; let x = cx, y = cy, a2 = an;
        g.beginPath(); g.moveTo(x, y);
        for (let s = 1; s <= 7; s++) { a2 += (r() - 0.5) * 0.6; x += Math.cos(a2) * len / 7; y += Math.sin(a2) * len / 7; g.lineTo(x, y); }
        g.stroke();
      }
      for (let i = 0; i < 44; i++) {
        const an = r() * TAU, d = u * (12 + r() * 90) * k, sz = u * (0.8 + r() * 2.6), drift = Math.sin(time * 0.0007 + i) * u * 1.5;
        g.save(); g.translate(cx + Math.cos(an) * d, cy + Math.sin(an) * d + drift); g.rotate(r() * TAU + time * 0.0006);
        g.fillStyle = rgba(i % 2 ? A : B, 0.85 * (1 - b * 0.3));
        g.beginPath(); g.moveTo(-sz, sz * 0.6); g.lineTo(0, -sz); g.lineTo(sz, sz * 0.6); g.closePath(); g.fill(); g.restore();
      }
      fx.glow(g, cx, cy, u * 70 * k, A, 0.4);
      fx.ring(g, cx, cy, e.R * 1.1 * k, u * 2, '#ffffff', (1 - b) * 0.9);
    },
  };

  /* ---------------- build-up streams by entry type ---------------- */
  const buildups = {
    converge(g, e, k, o) {
      const { u, cx, cy } = e, r = rng((o.seed || 1) + 100);
      for (let i = 0; i < 90; i++) {
        const an = r() * TAU, d0 = (30 + r() * 90) * u, q = clamp(k * 1.3 - r() * 0.3); if (q >= 1) continue;
        const d = d0 * (1 - E.inCubic(q)), d2 = d0 * (1 - E.inCubic(Math.max(0, q - 0.06)));
        g.strokeStyle = rgba(i % 3 ? e.col[0] : '#ffffff', 0.2 + 0.7 * q); g.lineWidth = u * 0.35;
        g.beginPath(); g.moveTo(cx + Math.cos(an) * d2, cy + Math.sin(an) * d2); g.lineTo(cx + Math.cos(an) * d, cy + Math.sin(an) * d); g.stroke();
      }
    },
    descend(g, e, k, o) {
      const { u, W, cx } = e, r = rng((o.seed || 1) + 200);
      for (let i = 0; i < 50; i++) {
        const x = cx + (r() - 0.5) * u * 30, y = ((e.time * (0.2 + r() * 0.4) + r() * 800) % (e.H)) , l = u * (6 + r() * 20);
        g.strokeStyle = rgba(e.col[0], 0.5 * k * (1 - Math.abs(x - cx) / (u * 15))); g.lineWidth = u * 0.3;
        g.beginPath(); g.moveTo(x, y - l); g.lineTo(x, y); g.stroke();
      }
    },
    rise(g, e, k, o) {
      const { u, H, cx } = e, r = rng((o.seed || 1) + 300);
      for (let i = 0; i < 60; i++) {
        const x = cx + (r() - 0.5) * u * 60, y = H - ((e.time * (0.1 + r() * 0.3) + r() * 900) % H);
        g.fillStyle = rgba(i % 2 ? e.col[0] : '#ffffff', 0.6 * k); g.fillRect(x, y, u * 0.5, u * (0.6 + r() * 1.6));
      }
    },
    emerge(g, e, k) {
      const { u, cx, cy } = e;
      for (let i = 0; i < 6; i++) { const q = ((e.time * 0.0009 + i / 6) % 1); fx.ring(g, cx, cy, u * 70 * (1 - q), u * 1.2, e.col[i % 2], q * 0.8 * k); }
    },
  };

  /* small facets orbiting the hero once revealed */
  const orbiters = (g, e, r0, a) => {
    const { cx, cy, u, time } = e, n = 10;
    for (let i = 0; i < n; i++) {
      const an = time * 0.0006 * (i % 2 ? 1 : -1) + (i / n) * TAU, rad = r0 * (1.7 + 0.35 * (i % 3)), x = cx + Math.cos(an) * rad, y = cy + Math.sin(an) * rad * 0.42;
      fx.gem3(g, x, y, u * 1.1, e.col, time * 0.003 + i, a, 4, 1.4);
    }
  };

  /* shared shake + zoom camera. */
  const camera = (g, e, amp = 1) => {
    const { p, u } = e, sh = seg(p, 0.48, 0.6) * (1 - seg(p, 0.6, 0.66)) + (1 - seg(p, 0.6, 0.75)) * (p > 0.6 ? 1 : 0) * 0.8;
    fx.zoom(g, e, 1 + 0.1 * E.outCubic(seg(p, 0, 0.6)) - 0.06 * E.outCubic(seg(p, 0.6, 0.8)),
      (Math.random() - 0.5) * u * 1.6 * sh * amp, (Math.random() - 0.5) * u * 1.6 * sh * amp);
  };

  G.grand = { bgs, heroes, finales, buildups, orbiters, camera, shardKite };

  G.cutscenes.template('grand', (g, e, def) => {
    const o = def.p, { p, u, cx, cy, time } = e;
    const bgF = bgs[o.bg] || bgs.stars, hero = heroes[o.hero] || heroes.gem, fin = finales[o.finale] || finales.nova, en = o.entry || 'emerge';
    const intro = E.outCubic(seg(p, 0, 0.25)), act2 = seg(p, 0.28, 0.58), b = seg(p, 0.58, 1);
    g.save();
    camera(g, e);
    bgF(g, e, o, 0.35 + 0.65 * intro);
    // energy building
    const build = seg(p, 0.18, 0.58);
    if (p < 0.6) (buildups[en] || buildups.emerge)(g, e, build, o);
    fx.glow(g, cx, cy, u * (6 + 34 * E.inCubic(build)), e.col[0], 0.25 + 0.6 * build);
    // hero
    const R = u * 16, ease = E.outCubic(act2);
    let hx = cx, hy = cy, hs = 0;
    if (en === 'descend') { hy = cy - e.H * 0.6 * (1 - ease); hs = act2 > 0 ? 1 : 0; }
    else if (en === 'rise') { hy = cy + e.H * 0.6 * (1 - ease); hs = act2 > 0 ? 1 : 0; }
    else { hs = E.outBack(seg(act2, 0.25, 1)); }
    if (p < 0.58 && act2 > 0 && hs > 0) { g.globalAlpha = Math.min(1, act2 * 2); hero(g, e, hx, hy + Math.sin(time * 0.003) * u * 0.6, R * hs, time); g.globalAlpha = 1; }
    // detonation
    if (p >= 0.58) {
      fin(g, e, b);
      fx.flash(g, e, 0.95 * (1 - E.outCubic(seg(b, 0, 0.12))));
      const hr = R * (1 + 0.25 * E.outBack(seg(b, 0, 0.3))) * (1 + 0.03 * Math.sin(time * 0.003));
      hero(g, e, cx, cy + Math.sin(time * 0.0025) * u * 0.9, hr, time);
      orbiters(g, e, R, E.outCubic(seg(b, 0.1, 0.4)));
    }
    g.restore();
    fx.vignette(g, e, 0.55);
  });
})();
