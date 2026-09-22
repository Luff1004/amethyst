/*
  CINE - the cinematic scene director (template: 'cine').
  A cutscene recipe:
    cine: {
      env:    'cave' | 'mountain' | 'space' | 'ocean' | 'forge' | 'ice' | 'void' | 'forest' | 'temple' | 'storm' | 'desert'
              | 'aurora' | 'abyss' | 'sanctum' | 'cyber' | 'clockwork' | 'arcane',   envHue: 260 (optional)
      hero:   { k: 'prism|spire|cluster|brilliant|cube|octa|rhomb|nugget|shard|plates|twin|star|orb', h: hue, s: sat, size: 1,
                trans: 0..1 (glass), kind: 'opal|moon|amber|planet|swirl|pearl|lapis' (orb), n: sides, hatch, shift: hue2 ... }
      entry:  'rise' | 'drop' | 'emerge' | 'geode' | 'orbit' | 'unveil' | 'forge' | 'lightning' | 'ignite' | 'tide'
      finale: 'nova' | 'pulse' | 'beam' | 'shatter' | 'bloom' | 'quake' | 'sweep' | 'implode'
      fx:     ['sparks','embers','snow','fireflies','petals','rain','bubbles','dust','sand','feathers','runes','orbit','arcs','leaves','stars']
      cam:    'push' | 'pull' | 'drift'
    }
  Timeline: 0-.26 atmosphere  ->  .26-.58 entrance  ->  .58 reveal (impact)  ->  hold.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const Cine = G.cine, M = Cine.mesh, TAU = Math.PI * 2;
  const hs = (h, s, l, a = 1) => Cine.hsl(h, s, l, a), hx = (h, s, l) => G.hsl(h, s, l);
  const strike = (k, times, w = 0.12) => { let v = 0; times.forEach(t => { if (k >= t) v = Math.max(v, 1 - (k - t) / w); }); return Math.max(0, v); };

  /* ---------------- hero meshes ---------------- */
  function heroMesh(hr, seed) {
    const P = M.prism;
    switch (hr.k) {
      case 'prism': return P(hr.n || 6, 0.42, 1.5, 0.55, { taper: 0.94, tipB: hr.tipB, jit: 0.05, seed });
      case 'spire': return P(hr.n || 6, 0.3, 2.5, 0.7, { taper: 0.98, tipB: 0.7, seed });
      case 'shard': return P(4, 0.2, 2.3, 0.95, { tipB: 0.95, rot: 0.4 });
      case 'cluster': {
        const parts = [{ m: P(6, 0.34, 1.6, 0.6, { seed }), pos: [0, 0.05, 0], s: 1.15 }], r = rng(seed);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + r() * 0.4; parts.push({ m: P(6, 0.2 + r() * 0.08, 0.9 + r() * 0.5, 0.4, { seed: seed + i }), pos: [Math.cos(a) * 0.52, -0.32 + r() * 0.1, Math.sin(a) * 0.52], rz: -Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5, s: 1 }); }
        return M.cluster(parts);
      }
      case 'brilliant': return M.brilliant(hr.n || 8, hr.o || {});
      case 'octa': return M.octa(hr.oh || 1.35, hr.w || 0.9);
      case 'rhomb': return M.cube(0.72, 0.36);
      case 'cube': return M.cluster([{ m: M.cube(0.62), pos: [-0.12, -0.08, 0], ry: 0.5, rx: 0.2 }, { m: M.cube(0.42), pos: [0.55, 0.3, 0.2], ry: 0.9, rz: 0.3 }, { m: M.cube(0.3), pos: [-0.5, 0.45, 0.35], ry: -0.4 }]);
      case 'nugget': return M.nugget(seed, hr.amp || 0.3, hr.sq || [1, 0.85, 0.9]);
      case 'plates': { const r = rng(seed), parts = []; for (let i = 0; i < 8; i++) parts.push({ m: P(10, 0.75, 0.07, 0, { seed: i }), pos: [(r() - 0.5) * 0.5, (r() - 0.5) * 0.5, (r() - 0.5) * 0.5], rx: r() * TAU, ry: r() * TAU, rz: r() * TAU, s: 0.7 + r() * 0.5 }); return M.cluster(parts); }
      case 'twin': return M.cluster([{ m: P(6, 0.24, 1.7, 0.4), rz: 0.62 }, { m: P(6, 0.24, 1.7, 0.4), rz: -0.62 }]);
      case 'star': return M.cluster([{ m: M.octa(1.9, 0.34) }, { m: M.octa(1.9, 0.34), rz: 1.2 }, { m: M.octa(1.9, 0.34), rx: 1.2, ry: 0.6 }, { m: M.octa(1.4, 0.3), rz: -0.6, ry: 1 }]);
      default: return P(6, 0.42, 1.5, 0.55, { seed });
    }
  }
  const heroCol = (hr, shiftK = 0) => {
    if (hr.col) return hr.col;
    const h = hr.h == null ? 260 : hr.h, s = hr.s == null ? 80 : hr.s, l = hr.l || 0;
    const h2 = hr.shift != null ? lerp(h, hr.shift, shiftK) : h;
    return [hx(h2, s, clamp(72 + l, 0, 96)), hx(h2, s, clamp(48 + l, 0, 90)), hx(h2, s - 10, clamp(12 + l * 0.3, 2, 60))];
  };

  /* ---------------- entries ---------------- */
  const spinBase = (c, hr) => c.time * (hr.spin == null ? 0.00055 : hr.spin) * (hr.dir || 1);
  const entries = {
    rise: {
      pose: (k, c) => ({ oy: c.H * 0.5 * (1 - E.outCubic(k)), sc: 0.8 + 0.2 * E.outCubic(k), a: seg(k, 0, 0.2), ry: 5 * (1 - E.outCubic(k)) }),
      back(c, k) {
        const { g, e, s, cx, cy } = c;
        Cine.add(g, () => Cine.glow(g, cx, cy + s * 1.25, s * 2.2, c.pal.B, 0.5 * k));
        Cine.fog(g, e, c.pal.A, { s: 2, vx: 10, a: 0.16 * k, y0: cy + s * 0.6, h: s * 1.6, comp: 'lighter' });
        Cine.motes(g, e, { n: 34, seed: 5, col: c.pal.A, size: 0.7, vy: -6, wobble: 1, a: 0.9 * k, x0: cx - s * 1.3, w: s * 2.6, y0: cy - s * 1.5, h: s * 3.4 });
      },
    },
    drop: {
      pose: (k, c) => ({ oy: -c.H * 0.85 * (1 - Math.pow(k, 2.2)), sc: 1, a: seg(k, 0, 0.05), rz: 5 * (1 - k), ry: 8 * (1 - k) }),
      front(c, k) {
        const { g, s, cx, cy } = c, y = cy - c.H * 0.85 * (1 - Math.pow(k, 2.2));
        if (k >= 1) return;
        Cine.add(g, () => { const gr = g.createLinearGradient(0, y, 0, Math.max(-20, y - c.H * 0.9)); gr.addColorStop(0, Cine.css(Cine.rgb(c.pal.A), 0.55 * k)); gr.addColorStop(1, Cine.css(Cine.rgb(c.pal.A), 0)); g.fillStyle = gr; g.fillRect(cx - s * 0.32, y - c.H * 0.9, s * 0.64, c.H * 0.9); Cine.glow(g, cx, y, s * 1.8, c.pal.A, 0.5 * k); });
      },
      shake: (k, b) => (k > 0.85 ? 0.3 : 0),
      after(c, b) {
        const { g, e, s, cx, cy, u } = c, gy = cy + s * 1.25, r = rng(14);
        g.save(); g.translate(cx, gy); g.scale(1, 0.3);
        for (let i = 0; i < 3; i++) { const q = clamp(b * 1.6 - i * 0.14); Cine.add(g, () => Cine.fx_ring(g, 0, 0, s * (1 + 4 * E.outCubic(q)), u * (1.6 - i * 0.4), c.pal.A, (1 - q) * 0.9)); }
        g.restore();
        Cine.fog(g, e, '#b0a090', { s: 2.4, vx: 6, a: 0.35 * (1 - b), y0: gy - s * 1.2, h: s * 1.8 });
        for (let i = 0; i < 26; i++) { const an = -Math.PI / 2 + (r() - 0.5) * 2.4, v = s * (2.4 + r() * 3.5), bt = b * 1.2, x = cx + Math.cos(an) * v * bt, y = gy + Math.sin(an) * v * bt + 900 * bt * bt * (s / 90) * 0.5, z = s * (0.05 + r() * 0.1); if (b > 0.95) continue; g.save(); g.translate(x, y); g.rotate(r() * TAU + bt * 4); g.fillStyle = hs(30, 15, 10, 1 - b); g.fillRect(-z, -z, z * 2, z * 1.6); g.strokeStyle = Cine.css(Cine.rgb(c.pal.A), 0.6 * (1 - b)); g.lineWidth = 1; g.strokeRect(-z, -z, z * 2, z * 1.6); g.restore(); }
      },
    },
    emerge: {
      pose: (k, c) => ({ a: E.outCubic(seg(k, 0.15, 0.9)), sc: 0.85 + 0.15 * E.outCubic(k), ry: 3 * (1 - k) }),
      back(c, k) {
        const { g, s, cx, cy } = c, r = rng(3);
        Cine.add(g, () => {
          for (let i = 0; i < 80; i++) {
            const an = r() * TAU, r0 = s * (2.6 + r() * 4.5), q = clamp(k * 1.3 - r() * 0.32); if (q >= 1) continue;
            const d = r0 * (1 - q * q), d2 = r0 * (1 - Math.pow(Math.max(0, q - 0.05), 2));
            g.strokeStyle = Cine.css(Cine.rgb(i % 3 ? c.pal.A : '#ffffff'), 0.15 + 0.6 * q); g.lineWidth = 1.4;
            g.beginPath(); g.moveTo(cx + Math.cos(an) * d2, cy + Math.sin(an) * d2 * 0.85); g.lineTo(cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.85); g.stroke();
            Cine.glow(g, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.85, s * 0.09, c.pal.A, 0.7 * q);
          }
          Cine.glow(g, cx, cy, s * (0.4 + 1.6 * k), c.pal.A, 0.25 + 0.5 * k);
        });
      },
    },
    geode: {
      pose: (k, c) => ({ a: 0, sc: 1 }),
      post: b => ({ a: 1, sc: 0.55 + 0.45 * E.outBack(seg(b, 0, 0.35)) }),
      back(c, k) { Cine.add(c.g, () => Cine.glow(c.g, c.cx, c.cy, c.s * (1 + 1.2 * k), c.pal.A, 0.6 * k)); },
      front(c, k, b) {
        const { g, s, cx, cy, u } = c, rock = c.rock;
        const col = [hx(28, 10, 30), hx(28, 10, 16), hx(28, 10, 5)];
        const shake = b <= 0 ? (Math.random() - 0.5) * u * 0.5 * k : 0;
        if (b <= 0) {
          Cine.drawMesh(g, rock, { x: cx + shake, y: cy + shake, s: s * 1.05, rx: -0.2, ry: 0.6, col, glow: 0, sparkle: 0, edge: 0.6, shine: 12 });
          Cine.add(g, () => { const r = rng(21); for (let i = 0; i < 9; i++) { const an = r() * TAU, L = s * 1.1 * k * (0.5 + r() * 0.7); let x = cx, y = cy, a2 = an; g.strokeStyle = Cine.css(Cine.rgb(c.pal.A), 0.9); g.lineWidth = 1.5 + k * 2; g.beginPath(); g.moveTo(x, y); for (let q = 1; q <= 6; q++) { a2 += (r() - 0.5) * 0.7; x += Math.cos(a2) * L / 6; y += Math.sin(a2) * L / 6; g.lineTo(x, y); } g.stroke(); } Cine.glow(g, cx, cy, s * 0.8 * k, c.pal.A, 0.7 * k); });
        } else if (b < 0.7) {
          const q = E.outCubic(seg(b, 0, 0.6)), fade = 1 - seg(b, 0.3, 0.7);
          [-1, 1].forEach(side => {
            g.save(); g.beginPath(); g.rect(side < 0 ? -1000 : cx, -1000, 2000 + (side < 0 ? cx + 1000 : 0), 4000); g.clip();
            g.globalAlpha *= fade;
            Cine.drawMesh(g, rock, { x: cx + side * s * 1.6 * q, y: cy + s * 0.9 * q * q, s: s * 1.05, rx: -0.2 + side * q * 0.5, ry: 0.6, rz: side * q * 0.8, col, glow: 0, sparkle: 0, edge: 0.6, shine: 12 });
            g.restore();
          });
        }
      },
    },
    orbit: {
      pose: (k, c) => ({ oy: -c.H * 0.24 * (1 - E.outCubic(k)), sc: 0.22 + 0.78 * E.outCubic(k), a: seg(k, 0, 0.12), ry: 14 * (1 - E.outCubic(k)), rx: 0.5 * (1 - k) }),
      back(c, k) { const { g, s, cx, cy, e } = c, y = cy - e.H * 0.24 * (1 - E.outCubic(k)); Cine.add(g, () => { for (let i = 0; i < 16; i++) Cine.glow(g, cx + (i - 8) * s * 0.02, y - i * s * 0.28 * (1 - k * 0.7), s * (0.5 - i * 0.025), c.pal.A, 0.22 * (1 - i / 16)); }); },
    },
    unveil: {
      pose: (k, c) => ({ a: 1, sc: 1, dim: 1 - E.outCubic(seg(k, 0.55, 1)) }),
      front(c, k, b) {
        const { g, e, s, cx, cy } = c, open = E.inOut(seg(k, 0.15, 0.85)) + (b > 0 ? 1 : 0);
        if (open < 1.98) {
          [-1, 1].forEach(side => { g.save(); g.beginPath(); g.rect(side < 0 ? 0 : cx, 0, side < 0 ? cx : e.W - cx, e.H); g.clip(); g.globalAlpha *= 0.94 * (1 - clamp(open - 1)); Cine.fog(g, e, c.pal.D, { s: 2, vx: 0, a: 1, ox: side * open * e.W * 0.5 }); g.fillStyle = Cine.css(Cine.rgb(c.pal.D), 0.55); g.fillRect(0, 0, e.W, e.H); g.restore(); });
        }
        Cine.shafts(g, e, { x: -e.W * 0.1 + k * e.W * 1.2, y: -20, ang: 1.35 - k * 0.5, n: 3, len: e.H * 1.4, spread: c.u * 8, w: c.u * 5, col: c.pal.A, a: 0.2 * Math.sin(Math.PI * clamp(k)), seed: 4 });
      },
    },
    forge: {
      pose: (k, c) => { const sd = strike(k, [0.2, 0.44, 0.68, 0.9]); return { a: seg(k, 0, 0.08), sc: 1 - 0.06 * sd, heat: E.outCubic(k) * 0.85, oy: sd * c.s * 0.04 }; },
      shake: (k) => strike(k, [0.2, 0.44, 0.68, 0.9], 0.08) * 1.1,
      front(c, k) {
        const { g, s, cx, cy, u } = c;
        [0.2, 0.44, 0.68, 0.9].forEach((tt, ti) => {
          const q = (k - tt) / 0.16; if (q < 0 || q > 1) return; const r = rng(ti * 9 + 2);
          Cine.add(g, () => {
            for (let i = 0; i < 34; i++) { const an = -Math.PI / 2 + (r() - 0.5) * 3.1, v = s * (1.5 + r() * 3.2), x = cx + Math.cos(an) * v * q, y = cy + Math.sin(an) * v * q + q * q * s * 2.2; g.strokeStyle = Cine.css(Cine.rgb(i % 3 ? '#ffb040' : '#ffffff'), 1 - q); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(an) * s * 0.18, y - Math.sin(an) * s * 0.18 - q * s * 0.1); g.stroke(); }
            Cine.glow(g, cx, cy, s * (1.2 + q), '#ffd080', 0.8 * (1 - q));
            Cine.fx_ring(g, cx, cy, s * (0.6 + 2.6 * E.outCubic(q)), u * 1.3, '#ffe0a0', 0.8 * (1 - q));
          });
        });
      },
    },
    lightning: {
      pose(k, c) { const sd = strike(k, [0.16, 0.42, 0.72], 0.07); return { a: seg(k, 0, 0.08), ox: (Math.random() - 0.5) * c.s * 0.05 * sd, heat: 0.3 * k }; },
      shake: k => strike(k, [0.16, 0.42, 0.72], 0.07) * 0.85,
      front(c, k) {
        const { g, e, s, cx, cy, u } = c;
        [0.16, 0.42, 0.72].forEach((tt, i) => {
          const q = (k - tt) / 0.07; if (q < 0 || q > 1) return;
          Cine.add(g, () => {
            G.fx.bolt(g, cx + (i - 1) * u * 10, -10, cx, cy, i * 31 + 7, u * 14, c.pal.A, u * (1.6 + i * 0.3), 1 - q);
            Cine.glow(g, cx, cy, s * 2.4, c.pal.A, 0.85 * (1 - q));
          });
        });
        // a single clean flash on the whole screen at the strike instant, not a lingering top glow
        const flashK = strike(k, [0.16, 0.42, 0.72], 0.05);
        if (flashK > 0.01) Cine.add(g, () => Cine.glow(g, cx, 0, e.R * 1.3, '#ffffff', 0.16 * flashK));
      },
    },
    ignite: {
      pose: (k, c) => ({ a: seg(k, 0, 0.1), heat: E.outCubic(k) * 0.7 }),
      front(c, k) { fireFx(c, k, 0.4 + k * 1.1); },
    },
    tide: {
      pose: (k, c) => ({ oy: c.H * 0.13 * (1 - E.outCubic(k)), a: 1, sc: 1 }),
      front(c, k, b) {
        const { g, e, s, cx, cy, W, H, u, time } = c, lv = b > 0 ? 0 : Math.sin(Math.PI * k), y0 = lerp(H * 1.08, cy + s * 0.9, Math.pow(lv, 0.8));
        if (lv <= 0.001) return;
        const wave = x => y0 + Math.sin(x * 0.02 + time * 0.003) * u * 1.6 + Math.sin(x * 0.045 - time * 0.004) * u * 0.8;
        g.save(); g.beginPath(); g.moveTo(0, H + 20); for (let x = 0; x <= W; x += 10) g.lineTo(x, wave(x)); g.lineTo(W, H + 20); g.closePath();
        const gr = g.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, Cine.css(Cine.rgb(c.pal.B), 0.78)); gr.addColorStop(1, Cine.css(Cine.rgb(c.pal.D), 0.95)); g.fillStyle = gr; g.fill(); g.restore();
        Cine.add(g, () => { g.strokeStyle = Cine.css(Cine.rgb('#ffffff'), 0.7); g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 10) x ? g.lineTo(x, wave(x)) : g.moveTo(x, wave(x)); g.stroke(); const r = rng(8); for (let i = 0; i < 40; i++) Cine.glow(g, r() * W, wave(r() * W) - r() * s * 0.6 * lv, u * (0.4 + r() * 0.7), '#dff6ff', 0.6); });
      },
    },
  };

  const fireFx = (c, k, amt) => {
    const { g, s, cx, cy, time } = c, r = rng(4), hue = c.R.fire == null ? 22 : c.R.fire;
    Cine.add(g, () => {
      for (let i = 0; i < 60; i++) {
        const ph = r(), sp = 0.5 + r() * 0.6, q = ((time * 0.0012 * sp + ph) % 1), x = cx + (r() - 0.5) * s * 1.7 * (1 - q * 0.5), y = cy + s * 1.0 - q * s * 2.6;
        if (i / 60 > amt) continue;
        Cine.glow(g, x, y, s * (0.34 - q * 0.24), q < 0.5 ? hx(hue + 18, 100, 62) : hx(hue, 100, 45), 0.75 * (1 - q));
      }
      Cine.glow(g, cx, cy + s * 0.4, s * 2.1 * (0.5 + amt * 0.4), hx(hue, 100, 50), 0.32 * Math.min(1, amt));
    });
  };

  /* ---------------- ambient fx ---------------- */
  const fxs = {
    sparks: (c, k) => Cine.motes(c.g, c.e, { n: 44, seed: 3, col: c.pal.A, size: 0.6, vy: -5, wobble: 2, a: 0.9 * k, twinkle: 1, x0: c.cx - c.s * 1.6, w: c.s * 3.2, y0: c.cy - c.s * 2, h: c.s * 4 }),
    embers: (c, k) => Cine.motes(c.g, c.e, { n: 60, seed: 6, col: '#ff9a40', size: 0.9, vy: -4.5, vx: 0.8, wobble: 3, a: 0.9 * k, twinkle: 1 }),
    snow: (c, k) => Cine.motes(c.g, c.e, { n: 100, seed: 8, col: '#eef8ff', size: 0.5, vy: 2.6, vx: -0.6, wobble: 3, a: 0.85 * k }),
    fireflies: (c, k) => Cine.motes(c.g, c.e, { n: 36, seed: 2, col: c.pal.A, size: 1.3, vy: -0.2, wobble: 6, a: 0.95 * k, twinkle: 1 }),
    dust: (c, k) => Cine.motes(c.g, c.e, { n: 70, seed: 5, col: '#ffe4a8', size: 0.5, vy: 0.3, vx: 0.3, wobble: 3, a: 0.75 * k, twinkle: 1 }),
    sand: (c, k) => { const { g, e, u, time } = c, r = rng(3); Cine.add(g, () => { g.strokeStyle = Cine.css(Cine.rgb('#ffd090'), 0.3 * k); g.lineWidth = 1.2; for (let i = 0; i < 50; i++) { const y = r() * e.H, x = ((r() * e.W + time * u * 0.02 * (8 + r() * 12)) % (e.W + 80)) - 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x + u * (3 + r() * 6), y - u * 0.3); g.stroke(); } }); },
    rain: (c, k) => { const { g, e, time } = c, r = rng(9); Cine.add(g, () => { g.strokeStyle = Cine.css(Cine.rgb(c.pal.A), 0.25 * k); g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 110; i++) { const x = ((r() * e.W + time * 0.25) % (e.W + 40)) - 20, y = (r() * e.H + time * 1.0 * (0.6 + r() * 0.6)) % e.H; g.moveTo(x, y); g.lineTo(x - 5, y + 20); } g.stroke(); }); },
    bubbles: (c, k) => { const { g, e, u, time } = c, r = rng(4); Cine.add(g, () => { g.strokeStyle = Cine.css(Cine.rgb('#dff6ff'), 0.55 * k); g.lineWidth = 1; for (let i = 0; i < 30; i++) { const sp = 0.4 + r(), x = r() * e.W + Math.sin(time * 0.001 * sp + i) * u, y = e.H - ((time * 0.001 * u * 5 * sp + r() * e.H) % (e.H + 20)); g.beginPath(); g.arc(x, y, u * (0.3 + r() * 0.8), 0, TAU); g.stroke(); } }); },
    petals: (c, k) => { const { g, e, u, time } = c, r = rng(7), t = time / 1000; for (let i = 0; i < 28; i++) { const sp = 0.4 + r(), x = r() * e.W + Math.sin(t * sp + i) * u * 4, y = ((t * u * 4 * sp + r() * e.H) % (e.H + 40)) - 20, s = u * (0.7 + r() * 1.1); g.save(); g.translate(x, y); g.rotate(t * sp + i); g.scale(1, 0.55 + 0.45 * Math.sin(t * 2 * sp + i)); g.fillStyle = Cine.css(Cine.rgb(i % 2 ? c.pal.A : c.pal.B), 0.85 * k); g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.8, 0, 0, s); g.quadraticCurveTo(-s * 0.8, 0, 0, -s); g.fill(); g.restore(); } },
    leaves: (c, k) => { const { g, e, u, time } = c, r = rng(11), t = time / 1000; for (let i = 0; i < 20; i++) { const sp = 0.5 + r(), x = r() * e.W + Math.sin(t * sp + i) * u * 5, y = ((t * u * 3.5 * sp + r() * e.H) % (e.H + 40)) - 20, s = u * (1 + r()); g.save(); g.translate(x, y); g.rotate(Math.sin(t * sp + i) * 1.2); g.fillStyle = hs(110 + r() * 40, 60, 30 + r() * 20, 0.85 * k); g.beginPath(); g.ellipse(0, 0, s * 0.35, s, 0, 0, TAU); g.fill(); g.restore(); } },
    feathers: (c, k) => { const { g, e, u, time } = c, r = rng(13), t = time / 1000; for (let i = 0; i < 14; i++) { const sp = 0.4 + r() * 0.6, x = r() * e.W + Math.sin(t * sp + i) * u * 6, y = ((t * u * 3 * sp + r() * e.H) % (e.H + 40)) - 20, s = u * (1.4 + r() * 1.4); g.save(); g.translate(x, y); g.rotate(Math.sin(t * sp * 1.3 + i) * 0.8); g.fillStyle = `rgba(255,255,255,${0.7 * k})`; g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.45, -s * 0.1, 0, s); g.quadraticCurveTo(-s * 0.45, -s * 0.1, 0, -s); g.fill(); g.strokeStyle = `rgba(255,240,200,${0.6 * k})`; g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s); g.stroke(); g.restore(); } },
    runes: (c, k) => { const { g, s, cx, cy, time } = c; Cine.add(g, () => { for (let ring = 0; ring < 2; ring++) { const rx = s * (1.7 + ring * 0.5), ry = rx * 0.32, dir = ring ? -1 : 1; for (let i = 0; i < 18; i++) { const a = time * 0.0004 * dir + (i / 18) * TAU, x = cx + Math.cos(a) * rx, y = cy + s * 0.55 + Math.sin(a) * ry, back = Math.sin(a) < 0; g.strokeStyle = Cine.css(Cine.rgb(c.pal.A), (back ? 0.3 : 0.85) * k); g.lineWidth = 1.5; const r = rng(i * 7 + ring); g.beginPath(); for (let q = 0; q < 2; q++) { g.moveTo(x + (r() - 0.5) * s * 0.16, y + (r() - 0.5) * s * 0.16); g.lineTo(x + (r() - 0.5) * s * 0.16, y + (r() - 0.5) * s * 0.16); } g.stroke(); } } }); },
    orbit: (c, k) => { const { g, s, cx, cy, time } = c; Cine.add(g, () => { for (let i = 0; i < 9; i++) { const a = time * 0.0007 * (i % 2 ? 1 : -1) + (i / 9) * TAU, rx = s * (1.7 + (i % 3) * 0.3), x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * rx * 0.36; Cine.star(g, x, y, s * 0.16, c.pal.A, 0.9 * k, a); } }); },
    arcs: (c, k) => {
      const { g, s, cx, cy, time, u } = c, period = 420, sd = Math.floor(time / period), ph = (time % period) / period;
      const r = rng(sd), pop = Math.sin(Math.PI * clamp(ph * 3));                    // one quick crackle, then quiet
      if (pop <= 0.02) return;
      Cine.add(g, () => { for (let i = 0; i < 2; i++) { const an = r() * TAU; G.fx.bolt(g, cx + Math.cos(an) * s * 0.65, cy + Math.sin(an) * s * 0.65, cx + Math.cos(an) * s * (1.3 + r() * 0.6), cy + Math.sin(an) * s * (1.3 + r() * 0.6), sd * 7 + i, u * 3, c.pal.A, u * 0.5, 0.8 * k * pop, false); } });
    },
    stars: (c, k) => { const { g, s, cx, cy, time } = c, r = rng(5); Cine.add(g, () => { for (let i = 0; i < 12; i++) { const an = r() * TAU, d = s * (1.1 + r() * 1.6), tw = 0.4 + 0.6 * Math.sin(time * 0.004 * (0.6 + r()) + i); Cine.star(g, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.8, s * (0.08 + r() * 0.16), '#ffffff', tw * k); } }); },
  };

  Cine.fx_ring = (g, x, y, r, w, hex, a) => { if (r <= 0 || a <= 0) return; g.strokeStyle = Cine.css(Cine.rgb(hex), a); g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); };

  /* ---------------- GRAND tier (1억대 DIVINE and above): a premium presentation layer on top of everything else ---------------- */
  const DEBRIS = M.octa(1, 0.7);
  /* buildup: power visibly gathering toward the hero, independent of which entry style is playing */
  function grandBuildup(c, k) {
    if (k <= 0.015) return;
    const { g, s, cx, cy, u, time, pal } = c, r = rng(Math.floor(time / 900));
    Cine.add(g, () => {
      for (let i = 0; i < 30; i++) {
        const an = (i / 30) * TAU + time * 0.00015 * (i % 2 ? 1 : -1), r0 = s * (3.4 + (i % 4) * 0.7);
        const q = clamp(k * 1.35 - ((i * 53) % 100) / 100 * 0.5); if (q >= 1) continue;
        const d = r0 * (1 - E.inCubic(q)), d2 = r0 * (1 - E.inCubic(Math.max(0, q - 0.04)));
        g.strokeStyle = Cine.css(Cine.rgb(i % 3 ? pal.A : '#ffffff'), (0.08 + 0.4 * q) * k); g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(cx + Math.cos(an) * d2, cy + Math.sin(an) * d2 * 0.86); g.lineTo(cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.86); g.stroke();
      }
      // a dais of light rising under the hero's feet
      const dr = s * 1.55 * E.outCubic(k);
      g.save(); g.translate(cx, cy + s * 0.86); g.scale(1, 0.3);
      Cine.fx_ring(g, 0, 0, dr, u * 0.5, pal.A, 0.4 * k);
      Cine.fx_ring(g, 0, 0, dr * 0.7, u * 0.3, '#ffffff', 0.25 * k);
      const rr = rng(9);
      for (let i = 0; i < 16; i++) { const a = time * 0.0004 + (i / 16) * TAU; g.strokeStyle = Cine.css(Cine.rgb(pal.A), 0.5 * k); g.lineWidth = u * 0.3; g.beginPath(); g.moveTo(Math.cos(a) * dr, Math.sin(a) * dr); g.lineTo(Math.cos(a) * dr * 1.14, Math.sin(a) * dr * 1.14); g.stroke(); }
      g.restore();
    });
  }
  /* reveal + hold: twin counter-rotating rings, an orbiting debris field, a light pillar and ground pool, colour grade */
  function grandReveal(c, b) {
    const { g, e, s, cx, cy, u, time, pal, W, H } = c, k = E.outCubic(seg(b, 0.08, 0.5)), open = E.outCubic(seg(b, 0.1, 0.55));
    Cine.add(g, () => {
      // light pillar through the hero
      const pw = s * (0.14 + 0.1 * k); const gr = g.createLinearGradient(cx - pw, 0, cx + pw, 0);
      gr.addColorStop(0, Cine.css(Cine.rgb(pal.A), 0)); gr.addColorStop(0.5, Cine.css(Cine.rgb('#ffffff'), 0.22 * k)); gr.addColorStop(1, Cine.css(Cine.rgb(pal.A), 0));
      g.fillStyle = gr; g.fillRect(cx - pw, 0, pw * 2, H);
      // ground pool + reflection
      g.save(); g.translate(cx, cy + s * 0.92); g.scale(1, 0.26);
      Cine.glow(g, 0, 0, s * 2.1 * open, pal.A, 0.4 * open);
      Cine.fx_ring(g, 0, 0, s * 1.5 * open, u * 0.6, pal.A, 0.55 * open);
      g.restore();
      const refl = g.createLinearGradient(cx, cy + s * 0.3, cx, cy + s * 1.4);
      refl.addColorStop(0, Cine.css(Cine.rgb(pal.A), 0.16 * open)); refl.addColorStop(1, Cine.css(Cine.rgb(pal.A), 0));
      g.fillStyle = refl; g.fillRect(cx - s * 0.5, cy + s * 0.3, s, s * 1.1);
      // outer slow armillary ring, tilted opposite the inner one
      const r1 = s * 2.9 * open, rot1 = time * 0.00022;
      g.save(); g.translate(cx, cy); g.rotate(0.3);
      Cine.fx_ring(g, 0, 0, r1, u * 0.35, pal.B, 0.5 * open);
      for (let i = 0; i < 5; i++) { const a = rot1 + (i / 5) * TAU; g.fillStyle = Cine.css(Cine.rgb('#ffffff'), 0.85 * open); g.beginPath(); g.arc(Math.cos(a) * r1, Math.sin(a) * r1 * 0.92, u * 0.35, 0, TAU); g.fill(); }
      g.restore();
      // inner runic ring (existing look, kept)
      const r0 = s * 2.4 * (0.7 + 0.3 * open), rot = time * 0.00035;
      for (let i = 0; i < 44; i++) { const a = rot + (i / 44) * TAU, l = i % 4 ? s * 0.07 : s * 0.16; g.strokeStyle = Cine.css(Cine.rgb('#ffffff'), 0.7 * open); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.9); g.lineTo(cx + Math.cos(a) * (r0 + l), cy + Math.sin(a) * (r0 + l) * 0.9); g.stroke(); }
      Cine.fx_ring(g, cx, cy, r0 * 0.985, u * 0.5, pal.A, 0.8 * open);
      const q = seg(b, 0.3, 1); if (q > 0 && q < 1) Cine.fx_ring(g, cx, cy, e.R * 1.1 * E.outExpo(q), u * 2, '#ffffff', (1 - q) * 0.7);
      // orbiting fragments - small faceted debris circling the hero forever after
      for (let i = 0; i < 6; i++) {
        const sp = 0.00042 + (i % 3) * 0.00011, a = time * sp * (i % 2 ? 1 : -1) + (i / 6) * TAU, rr = s * (1.55 + (i % 3) * 0.28);
        const dx = cx + Math.cos(a) * rr, dy = cy + Math.sin(a) * rr * 0.42, dep = Math.sin(a);
        g.globalAlpha = open * (0.55 + 0.45 * ((dep + 1) / 2));
        Cine.drawMesh(g, DEBRIS, { x: dx, y: dy, s: s * (0.1 + 0.03 * (i % 3)), rx: time * 0.001 + i, ry: time * 0.0013, col: [pal.A, pal.B, pal.D], glow: 0.3, shine: 60, t: time, sparkle: 0.6 });
        g.globalAlpha = 1;
      }
    });
    Cine.flare(g, e, cx, cy, 0.45 * E.outCubic(seg(b, 0.05, 0.4)), pal.A);
    // cinematic colour grade wash, unifies the whole frame around the mineral's own palette
    g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.4 * open;
    const cg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
    cg.addColorStop(0, Cine.css(Cine.rgb(pal.A), 0.5)); cg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = cg; g.fillRect(0, 0, W, H);
    g.restore();
  }

  /* ---------------- finales ---------------- */
  const finales = {
    nova(c, b) {
      const { g, e, s, cx, cy, u, time } = c;
      Cine.add(g, () => {
        Cine.glow(g, cx, cy, s * (2.4 + 3 * E.outCubic(b)), c.pal.A, 0.5 * (1 - b * 0.4));
        for (let i = 0; i < 3; i++) { const q = clamp(b * 1.5 - i * 0.14); Cine.fx_ring(g, cx, cy, e.R * 1.1 * E.outExpo(q), u * (2.6 - i * 0.6), i % 2 ? c.pal.B : '#ffffff', (1 - q) * 0.9); }
        G.fx.rays(g, cx, cy, e.R * 0.9 * E.outExpo(b), 26, time * 0.0002, u * 1.2, c.pal.A, 0.2);
      });
    },
    pulse(c, b) {
      const { g, s, cx, cy, u, time } = c;
      Cine.add(g, () => { for (let i = 0; i < 5; i++) { const q = ((time * 0.00045 + i / 5) % 1); Cine.fx_ring(g, cx, cy, s * (0.8 + 6 * q), u * (1.6 - q), i % 2 ? c.pal.B : c.pal.A, (1 - q) * 0.75 * seg(b, 0, 0.1)); } Cine.glow(g, cx, cy, s * (2.4 + 0.3 * Math.sin(time * 0.004)), c.pal.A, 0.4); });
    },
    beam(c, b) {
      const { g, e, s, cx, cy, u, time } = c, w = s * (0.25 + 0.45 * E.outCubic(b));
      Cine.add(g, () => {
        const gr = g.createLinearGradient(cx - w, 0, cx + w, 0); gr.addColorStop(0, Cine.css(Cine.rgb(c.pal.A), 0)); gr.addColorStop(0.5, Cine.css(Cine.rgb('#ffffff'), 0.5 * E.outCubic(seg(b, 0, 0.3)))); gr.addColorStop(1, Cine.css(Cine.rgb(c.pal.A), 0));
        g.fillStyle = gr; g.fillRect(cx - w, 0, w * 2, cy + s);
        Cine.glow(g, cx, cy, s * 3.2, c.pal.A, 0.45);
        for (let i = 0; i < 3; i++) { const q = ((time * 0.0006 + i / 3) % 1); g.save(); g.translate(cx, cy + s * 1.3); g.scale(1, 0.28); Cine.fx_ring(g, 0, 0, s * (1 + 4 * q), u * 1.4, c.pal.A, (1 - q) * 0.8); g.restore(); }
      });
      Cine.motes(g, e, { n: 40, seed: 3, col: '#ffffff', size: 0.6, vy: -8, wobble: 1, a: 0.8, x0: cx - w * 1.4, w: w * 2.8, y0: 0, h: cy + s });
    },
    shatter(c, b) {
      const { g, e, s, cx, cy, u, time } = c, r = rng(60), k = E.outExpo(b);
      Cine.add(g, () => {
        g.strokeStyle = Cine.css(Cine.rgb('#ffffff'), 0.85 * (1 - b * 0.4)); g.lineWidth = 1.3;
        for (let i = 0; i < 12; i++) { const an = r() * TAU, len = e.R * (0.5 + r() * 0.7) * k; let x = cx, y = cy, a2 = an; g.beginPath(); g.moveTo(x, y); for (let q = 1; q <= 7; q++) { a2 += (r() - 0.5) * 0.6; x += Math.cos(a2) * len / 7; y += Math.sin(a2) * len / 7; g.lineTo(x, y); } g.stroke(); }
        Cine.glow(g, cx, cy, s * 3 * k, c.pal.A, 0.4);
      });
      for (let i = 0; i < 40; i++) {
        const an = r() * TAU, d = s * (0.8 + r() * 5) * k, sz = s * (0.06 + r() * 0.18), drift = Math.sin(time * 0.0007 + i) * u * 1.5;
        g.save(); g.translate(cx + Math.cos(an) * d, cy + Math.sin(an) * d + drift); g.rotate(r() * TAU + time * 0.0006);
        const gr = g.createLinearGradient(-sz, -sz, sz, sz); gr.addColorStop(0, Cine.css(Cine.rgb('#ffffff'), 0.9)); gr.addColorStop(1, Cine.css(Cine.rgb(c.pal.A), 0.45));
        g.fillStyle = gr; g.beginPath(); g.moveTo(-sz, sz * 0.7); g.lineTo(0, -sz); g.lineTo(sz, sz * 0.5); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.stroke(); g.restore();
      }
    },
    bloom(c, b) {
      const { g, s, cx, cy, u, time } = c;
      Cine.add(g, () => {
        for (let layer = 3; layer >= 0; layer--) {
          const k = E.outBack(clamp(b * 1.5 - (3 - layer) * 0.08)), len = s * (1.6 + layer * 1.0) * k, n = 8 + layer * 2, rot = time * 0.00018 * (layer % 2 ? 1 : -1) + layer * 0.2;
          for (let i = 0; i < n; i++) { const an = rot + (i / n) * TAU; g.save(); g.translate(cx, cy); g.rotate(an); const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, Cine.css(Cine.rgb('#ffffff'), 0.13)); gr.addColorStop(1, Cine.css(Cine.rgb(layer % 2 ? c.pal.B : c.pal.A), 0.035)); g.fillStyle = gr; g.beginPath(); g.moveTo(s * 0.3, 0); g.quadraticCurveTo(len * 0.5, -len * 0.3, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.3, s * 0.3, 0); g.fill(); g.restore(); }
        }
        Cine.glow(g, cx, cy, s * 2.8, c.pal.A, 0.16);
      });
      Cine.motes(g, c.e, { n: 36, seed: 8, col: c.pal.A, size: 0.6, vy: -3, wobble: 4, a: 0.8, x0: cx - s * 4, w: s * 8, y0: cy - s * 4, h: s * 8, twinkle: 1 });
    },
    quake(c, b) {
      const { g, e, s, cx, cy, u } = c, gy = cy + s * 1.3, r = rng(70), k = E.outExpo(clamp(b * 1.3));
      Cine.add(g, () => {
        for (let i = 0; i < 13; i++) {
          const an = (r() - 0.5) * 3.0 + (i % 2 ? Math.PI : 0), L = e.W * (0.18 + r() * 0.5) * k; let x = cx, y = gy, a2 = an;
          g.strokeStyle = Cine.css(Cine.rgb(c.pal.A), 0.5 * (1 - b * 0.3)); g.lineWidth = u * (0.6 + r() * 0.6); g.beginPath(); g.moveTo(x, y);
          for (let q = 1; q <= 8; q++) { a2 += (r() - 0.5) * 0.7; x += Math.cos(a2) * L / 8; y += Math.sin(a2) * L / 8 * 0.32; g.lineTo(x, y); } g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; g.stroke();
        }
        Cine.glow(g, cx, gy, s * 3 * k, c.pal.A, 0.45);
      });
      for (let i = 0; i < 22; i++) { const bx = cx + (r() - 0.5) * e.W * 0.8, up = (b * 0.5 + 0.02) * s * (1 + r() * 3) + Math.sin(c.time * 0.0009 + i) * u, z = s * (0.05 + r() * 0.1), y = gy - up; g.save(); g.translate(bx, y); g.rotate(r() * TAU + c.time * 0.0004); g.fillStyle = hs(30, 10, 9, 0.95); g.fillRect(-z, -z * 0.7, z * 2, z * 1.4); g.strokeStyle = Cine.css(Cine.rgb(c.pal.A), 0.6); g.lineWidth = 1; g.strokeRect(-z, -z * 0.7, z * 2, z * 1.4); g.restore(); }
      Cine.fog(g, e, '#a89880', { s: 2.4, vx: 8, a: 0.25 * (1 - b * 0.5), y0: gy - s, h: s * 2.4 });
    },
    sweep(c, b) {
      const { g, e, s, cx, cy, u, time } = c, x = lerp(-e.W * 0.3, e.W * 1.3, E.inOut(clamp(b * 1.6)));
      Cine.add(g, () => {
        g.save(); g.translate(x, cy); g.rotate(-0.5); const w = u * 16; const gr = g.createLinearGradient(-w, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, Cine.css(Cine.rgb(c.pal.A), 0.55 * (1 - seg(b, 0.5, 1)))); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-w, -e.H, w * 2, e.H * 2); g.restore();
        Cine.glow(g, cx, cy, s * 3, c.pal.A, 0.4);
      });
      Cine.flare(g, e, cx, cy, 0.7 * (0.5 + 0.5 * Math.sin(time * 0.002)) * seg(b, 0.05, 0.3) + 0.2, c.pal.A);
    },
    implode(c, b) {
      const { g, e, s, cx, cy, u } = c, pre = b < 0.16;
      Cine.add(g, () => {
        if (pre) { const q = b / 0.16; for (let i = 0; i < 5; i++) Cine.fx_ring(g, cx, cy, s * (6 - 5.4 * E.inCubic(clamp(q * 1.2 - i * 0.05))), u * 1.5, i % 2 ? c.pal.B : c.pal.A, 0.9 * q); Cine.glow(g, cx, cy, s * (1 + 1.4 * q), '#ffffff', 0.8 * q); }
        else { const q = seg(b, 0.16, 1); Cine.glow(g, cx, cy, s * (2 + 4 * E.outCubic(q)), c.pal.A, 0.55 * (1 - q * 0.5)); for (let i = 0; i < 3; i++) { const qq = clamp(q * 1.5 - i * 0.14); Cine.fx_ring(g, cx, cy, e.R * 1.1 * E.outExpo(qq), u * 2.4, i % 2 ? c.pal.B : '#ffffff', (1 - qq) * 0.9); } }
      });
    },
  };

  /* ---------------- CELESTIAL tier (10억대 TRANSCENDENT and above): bold geometric wireframe solids ---------------- */
  function celestialBuildup(c, k) {
    if (k <= 0.1) return;
    const { g, s, cx, cy, time, pal, def } = c, key = Cine.polyKeys[def.id.length % Cine.polyKeys.length];
    const open = E.outCubic(seg(k, 0.1, 0.7));
    Cine.wireframe(g, key, { x: cx, y: cy, s: s * 1.7 * open, rx: 0.4 + time * 0.0003, ry: time * 0.00045, col: pal.A, alpha: 0.4 * open, glow: 0.35, lineW: 1.1 });
    Cine.add(g, () => Cine.mandala(g, cx, cy, s * 2.3 * open, time * 0.00025, 0.3 * open, pal.A, pal.B));
  }
  function celestialFX(c, b) {
    const { g, s, cx, cy, time, pal, def } = c, key = Cine.polyKeys[def.id.length % Cine.polyKeys.length];
    const open = E.outBack(seg(b, 0.05, 0.5)), fade = 0.7 + 0.3 * Math.sin(time * 0.0009);
    Cine.add(g, () => Cine.mandala(g, cx, cy, s * 2.8 * open, time * 0.00032, 0.7 * open * fade, pal.A, pal.B));
    Cine.wireframe(g, key, { x: cx, y: cy, s: s * 2 * open, rx: 0.5 + time * 0.00025, ry: time * 0.0004, col: pal.A, alpha: 0.9 * open, glow: 0.55, lineW: 1.5 });
    Cine.wireframe(g, key, { x: cx, y: cy, s: s * 1.35 * open, rx: -0.3 - time * 0.0003, ry: -time * 0.00055, rz: time * 0.0002, col: '#ffffff', alpha: 0.65 * open, glow: 0.3, lineW: 1 });
  }

  /* ---------------- the scene ---------------- */
  G.cutscenes.template('cine', (gm, e, def) => {
    const R = def.cine, { p, u, W, H, cx, time } = e, hr = R.hero, grand = def.tierIdx >= G.GRAND;
    const S = Cine.stage(e), g = S.g;
    g.clearRect(0, 0, W, H);
    const cy = e.cy - (grand ? 0 : 0);
    const intro = E.outCubic(seg(p, 0, 0.26)), k = seg(p, 0.26, 0.58), b = seg(p, 0.58, 1), post = p >= 0.58;
    const ent = entries[R.entry] || entries.rise, fin = finales[R.finale] || finales.nova;
    const pal = { A: def.colors[0], B: def.colors[1], D: def.colors[2] };
    if (!def._mesh) { def._mesh = heroMesh(hr, def.id.length * 7 + 3); if (R.entry === 'geode') def._rock = M.nugget(9, 0.28, [1.05, 0.9, 0.95]); }
    const s = Math.min(W, H) * (grand ? 0.2 : 0.175) * (hr.size || 1);
    const c = { g, e, W, H, u, cx, cy, time, t: time / 1000, p, def, R, pal, s, k: intro, rock: def._rock, cam: { x: 0, y: 0 } };

    // camera
    const camK = R.cam || 'push', pre = seg(p, 0, 0.58);
    let z = camK === 'pull' ? 1.14 - 0.1 * pre : camK === 'drift' ? 1.06 : 1 + 0.09 * E.outCubic(pre);
    if (post) z += (def.tierIdx >= 7 ? 0.09 : 0.055) * (1 - E.outCubic(seg(b, 0, 0.35))) - (grand ? 0.05 * E.outCubic(seg(b, 0, 0.7)) : 0);
    c.cam.x = camK === 'drift' ? Math.sin(time * 0.0004) * u * 6 : (p - 0.5) * u * 6;
    const shk = (ent.shake ? ent.shake(k, b) : 0) * (post ? 0 : 1) + (post ? (1 - E.outCubic(seg(b, 0, 0.5))) * 1.3 : 0);
    g.save();
    g.translate(cx + c.cam.x * 0.5 + (Math.random() - 0.5) * u * 1.6 * shk, cy + (Math.random() - 0.5) * u * 1.6 * shk);
    g.scale(z, z); g.translate(-cx, -cy);

    // world
    (Cine.env[R.env] || Cine.env.cave)(g, e, { h: R.envHue == null ? def.hue : R.envHue, k: intro, cam: c.cam, o: R });
    if (post) Cine.add(g, () => Cine.glow(g, cx, cy, s * (2.5 + 2 * E.outCubic(b)), pal.A, 0.16 * E.outCubic(seg(b, 0, 0.3))));
    else Cine.add(g, () => Cine.glow(g, cx, cy, s * (1.2 + 1.6 * k), pal.A, (grand ? 0.28 : 0.16) * (0.4 + k)));
    if (ent.back) ent.back(c, k, b);
    if (grand && !post) grandBuildup(c, k);     // DIVINE+: power visibly gathering, on top of whatever the entry is doing
    if (def.tierIdx >= 7 && !post) celestialBuildup(c, k);  // TRANSCENDENT+: a wireframe solid spins up early
    if (post && ent.after) ent.after(c, b);
    if (post) fin(c, b);                       // impact effects sit BEHIND the mineral so it never washes out

    // hero
    let pose = ent.pose(k, c), hold = { ox: 0, oy: Math.sin(time * 0.0012) * u * 0.7, sc: 1, a: 1, rx: 0, rz: 0, ry: 0, dim: 0, heat: 0 };
    if (post) { pose = Object.assign({}, hold, ent.post ? ent.post(b) : { sc: 1 + 0.14 * E.outBack(seg(b, 0, 0.25)) * (1 - seg(b, 0.25, 0.7)) }); if (R.entry === 'forge' || R.entry === 'ignite') pose.heat = 0.5 * (1 - seg(b, 0, 0.8)); }
    else pose = Object.assign({ ox: 0, oy: 0, sc: 1, a: 1, rx: 0, rz: 0, ry: 0, dim: 0, heat: 0 }, pose);
    const spin = spinBase(c, hr) + (pose.ry || 0);
    const shiftK = hr.shift != null ? 0.5 + 0.5 * Math.sin(time * 0.0012) : 0;
    const hx0 = cx + (pose.ox || 0), hy0 = cy + (pose.oy || 0), hs0 = s * pose.sc;
    if (pose.a > 0.001) {
      if (post) Cine.add(g, () => Cine.glow(g, hx0, hy0, hs0 * 2.2, pal.A, 0.1));
      g.save(); g.globalAlpha = pose.a;
      if (hr.k === 'orb') Cine.orb(g, hx0, hy0, hs0 * 0.95, { col: heroCol(hr, shiftK), kind: hr.kind || 'opal', t: time, hue: hr.h, glow: hr.glow == null ? 0.5 : hr.glow, dim: pose.dim });
      else Cine.drawMesh(g, def._mesh, { x: hx0, y: hy0, s: hs0, rx: hr.rx == null ? -0.28 + (pose.rx || 0) : hr.rx + (pose.rx || 0), ry: spin, rz: (hr.rz || 0) + (pose.rz || 0), col: heroCol(hr, shiftK), trans: hr.trans || 0, glow: hr.glow == null ? 0.5 : hr.glow, shine: hr.shine || 46, t: time, hatch: hr.hatch || 0, faceCols: hr.faces && hr.faces.map(f => (typeof f === 'number' ? hx(f, hr.s || 80, 46) : f)), dim: pose.dim, sparkle: 1 });
      if (pose.heat > 0.01) Cine.add(g, () => Cine.glow(g, hx0, hy0, hs0 * 1.5, hx(R.fire == null ? 18 : R.fire, 100, 55), pose.heat * 0.7));
      g.restore();
    }
    if (ent.front) ent.front(c, k, b);

    // ambient fx + finale
    const fxk = intro * (post ? 1 : 0.6 + 0.4 * k);
    (R.fx || []).forEach(n => fxs[n] && fxs[n](c, fxk));
    if (post && grand) grandReveal(c, b);
    if (post && def.tierIdx >= 7) celestialFX(c, b);   // TRANSCENDENT+: bold geometric wireframe solids, sacred-geometry mandala
    g.restore();

    // post
    const spike = post ? 1 - E.outCubic(seg(b, 0, 0.3)) : 0;
    const rayFin = { nova: 0.5, beam: 0.6, sweep: 0.4, bloom: 0.4, implode: 0.5, pulse: 0.25, quake: 0.2, shatter: 0.3 }[R.finale] || 0.3;
    Cine.compose(gm, e, {
      bloom: 0.5 + 0.55 * spike + (post ? 0.1 : 0.15 * k) + (grand ? 0.2 : 0),
      rays: post ? Math.min(0.95, rayFin * (0.45 + 0.9 * spike) + (grand ? 0.25 : 0)) : 0.18 * k * (grand ? 1.6 : 1),
      rx: cx, ry: cy, grain: grand ? 0.07 : 0.09, vig: grand ? 0.66 : 0.6,
      flash: post ? 0.85 * (1 - E.outCubic(seg(b, 0, 0.16))) : 0,
    });
  });
})();
