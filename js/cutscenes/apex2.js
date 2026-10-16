/*
  THE APEX, part two (see js/cutscenes/apex.js): 100조 THE LOOM · KALEIDOS, 1000조 YGGDRASIL ·
  TESSERACT, 1경 GENESIS · THE AUTHOR · COLOSSUS.
*/
(() => {
  const { E, seg, clamp } = G, K = G.n3.kit, A = G.apex;
  const { hudRing, glowStroke, light, fineGrid, circle, rnd } = K;
  const { TAU, fr, lerp, SERIF } = A;
  const COSMIC = '#c08aff', PRIM = '#ff8a5a';

  /* ================= 100조 · THE LOOM ================= the threads of every life strung on a loom;
     a shuttle of light runs back and forth and row by row a picture is woven - the crystal - then one
     clean cut, and the loose threads fall away */
  const inGem = (x, y) => { const ax = Math.abs(x); return y < -0.18 ? y > -0.52 && ax < 0.36 + (y + 0.52) * (0.42 / 0.34) : y < 0.82 && ax < 0.78 * (1 - (y + 0.18) / 1.0); };
  A.film({ id: 'theloom', name: 'The Loom', odds: 1.7e14, duration: 19000, revealAt: 0.72, colors: ['#e8d0ff', COSMIC, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), N = 72, ROWS = 64, x0 = W * 0.06, x1 = W * 0.94, y0 = H * 0.86, y1 = H * 0.1, rh = (y0 - y1) / ROWS;
    g.fillStyle = '#05030a'; g.fillRect(0, 0, W, H);
    const done = clamp(T / (RV - 2.4)) * ROWS, cut = E.inCubic(seg(T, RV - 1.2, RV + 0.6)), zoom = lerp(1.18, 1, E.inOut(clamp(T / RV)));
    g.save(); g.translate(W / 2, H / 2); g.scale(zoom, zoom); g.translate(-W / 2, -H / 2);
    // the warp
    g.beginPath(); for (let i = 0; i < N; i++) { const x = lerp(x0, x1, i / (N - 1)) + Math.sin(T * 3 + i) * 0.4; g.moveTo(x, y1 - H * 0.05); g.lineTo(x, y0 + H * 0.05); }
    g.strokeStyle = 'rgba(200,180,255,.22)'; g.lineWidth = 0.7; g.stroke();
    // the weft, row by row: a picture in it
    const cw = (x1 - x0) / (N - 1);
    for (let r = 0; r < Math.ceil(done); r++) {
      const y = y0 - (r + 0.5) * rh, frac = r < Math.floor(done) ? 1 : fr(done), dir = r % 2 ? -1 : 1, fall = cut * (y < H * 0.5 ? 0 : 1) * (H * 0.4) * cut;
      for (let i = 0; i < N - 1; i++) {
        const t = dir > 0 ? i / (N - 1) : 1 - i / (N - 1); if (t > frac) continue;
        const gx = (lerp(x0, x1, (i + 0.5) / (N - 1)) - W / 2) / (m * 0.42), gy = (y - H * 0.47) / (m * 0.42), on = inGem(gx, gy), over = (i + r) % 2;
        g.fillStyle = on ? (over ? 'rgba(235,215,255,.95)' : 'rgba(170,120,255,.8)') : (over ? 'rgba(90,80,130,.55)' : 'rgba(40,34,70,.55)');
        g.fillRect(lerp(x0, x1, i / (N - 1)) + 0.5, y - rh * 0.38 + fall, cw - 1, rh * 0.76);
      }
    }
    // the shuttle
    if (done < ROWS && T < RV - 1.2) {
      const r = Math.floor(done), dir = r % 2 ? -1 : 1, t = fr(done), x = dir > 0 ? lerp(x0, x1, t) : lerp(x1, x0, t), y = y0 - (r + 0.5) * rh;
      g.beginPath(); g.moveTo(x - dir * W * 0.12, y); g.lineTo(x, y); glowStroke(g, 1.2, 0.8, '220,200,255');
      light(g, x, y, m * 0.05, 0.9);
    }
    // the cut
    if (cut > 0) { const k = clamp(cut * 3); g.beginPath(); g.moveTo(0, H * 0.5 - W * 0.08); g.lineTo(W * k, H * 0.5 - W * 0.08 + W * 0.16 * k); glowStroke(g, 2.4, 1 - cut * 0.6, '255,255,255'); }
    g.restore();
    light(g, W / 2, H * 0.47, m * 0.5 * clamp(T / RV), 0.35 * clamp(T / RV));
    A.flash(g, W, H, T, RV - 0.05, 0.8, '240,230,255');
    if (T > RV - 0.2) {
      const k = E.outCubic(seg(T, RV - 0.2, RV + 0.8));
      g.fillStyle = `rgba(5,3,10,${0.6 * k})`; g.fillRect(0, 0, W, H);
      A.gem(g, W, H, T, COSMIC, k);
    }
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[1, 4.6, 'every thread is a life', 0.94], [5.2, 9.6, 'the loom has never stopped', 0.94], [10.2, RV - 1.4, 'this one was woven for you', 0.94, 0.044]]);
  });

  /* ================= 100조 · KALEIDOS ================= one truth, folded through twelve mirrors -
     shapes drifting in a single wedge, reflected into a mandala that tunnels forever inward; it spins
     up, and everything falls into the one point it was all reflecting */
  const SHAPES = Array.from({ length: 26 }, (_, i) => { const r = rnd(900 + i); return { r: 0.08 + r() * 0.9, a: r(), s: 0.02 + r() * 0.07, kind: Math.floor(r() * 4), hue: [270, 200, 320, 180][i % 4], sp: (r() - 0.5) * 0.6, ph: r() * TAU }; });
  function wedgeArt(g, R, t, hueShift) {
    for (const S of SHAPES) {
      const rr = R * (S.r + Math.sin(t * 0.5 + S.ph) * 0.06), a = (fr(S.a + t * S.sp * 0.05) * Math.PI) / 6, x = Math.cos(a) * rr, y = Math.sin(a) * rr, s = R * S.s;
      g.save(); g.translate(x, y); g.rotate(t * S.sp + S.ph);
      const col = `hsla(${S.hue + hueShift},90%,${S.kind === 3 ? 55 : 70}%,`;
      g.beginPath();
      if (S.kind === 0) { g.moveTo(0, -s); g.lineTo(s * 0.87, s * 0.5); g.lineTo(-s * 0.87, s * 0.5); g.closePath(); }
      else if (S.kind === 1) g.arc(0, 0, s, 0, TAU);
      else if (S.kind === 2) { g.moveTo(-s * 1.6, 0); g.lineTo(s * 1.6, 0); }
      else { g.moveTo(0, -s); g.lineTo(s * 0.6, 0); g.lineTo(0, s); g.lineTo(-s * 0.6, 0); g.closePath(); }
      if (S.kind === 3) { g.fillStyle = col + '.35)'; g.fill(); }
      g.strokeStyle = col + '.9)'; g.lineWidth = 1.3; g.stroke();
      g.restore();
    }
  }
  function mandala(g, x, y, R, rot, t, hueShift, alpha) {
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = alpha; g.globalCompositeOperation = 'lighter';
    for (let w = 0; w < 12; w++) {
      g.save(); g.rotate((w * Math.PI) / 6); if (w % 2) { g.rotate(Math.PI / 6); g.scale(1, -1); }
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, 0, Math.PI / 6); g.closePath(); g.clip();
      wedgeArt(g, R, t, hueShift);
      g.restore();
    }
    g.restore();
  }
  A.film({ id: 'kaleidos', name: 'Kaleidos', odds: 5.3e14, duration: 18000, revealAt: 0.72, colors: ['#f0d8ff', COSMIC, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.45 }, R = Math.hypot(W, H) * 0.55;
    g.fillStyle = '#04020a'; g.fillRect(0, 0, W, H);
    const spin = T * 0.08 + E.inCubic(seg(T, RV - 4, RV)) * 6, collapse = E.inCubic(seg(T, RV - 0.9, RV)), hue = T * 12;
    if (T < RV) {
      const sc = 1 - collapse;
      for (let L = 0; L < 3; L++) {                                    // the tunnel: the same mandala, smaller and smaller inside itself
        const z = fr(T * 0.06 + L / 3), s = Math.pow(0.42, L) * (1 + z * 0.5);
        mandala(g, c.x, c.y, R * s * sc, spin * (L % 2 ? -1 : 1) + L, T, hue + L * 40, (L === 0 ? 0.9 : 0.6) * (1 - collapse * 0.5));
      }
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + spin; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.cos(a) * R * sc, c.y + Math.sin(a) * R * sc); }
      g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 0.6; g.stroke();
      hudRing(g, c.x, c.y, m * 0.42 * sc, -spin * 0.3, 0.4, true);
      light(g, c.x, c.y, m * 0.3, 0.3 + collapse * 0.8);
    }
    A.flash(g, W, H, T, RV - 0.05, 0.8, '245,235,255');
    if (T > RV - 0.1) {
      const k = E.outCubic(seg(T, RV - 0.1, RV + 1));
      mandala(g, W / 2, H * 0.33, m * 0.45, T * 0.04, T, hue, 0.35 * k);
      A.gem(g, W, H, T, COSMIC, k);
    }
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[1, 4.4, 'one truth', 0.9, 0.05], [5, 8.8, 'reflected forever', 0.9, 0.046], [9.4, RV - 1.2, 'until the reflection was all that was left', 0.9]]);
  });

  /* ================= 1000조 · YGGDRASIL ================= a tree of light grows out of the dark, its
     roots drinking from the void below; light climbs the branches, a tiny galaxy opens at every tip,
     and the crown blooms around the crystal */
  const TREE = (() => {
    const segs = [], r = rnd(1717), tips = [];
    const grow = (x, y, a, len, d, parent) => {
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, id = segs.length; segs.push({ x, y, x1, y1, d, parent });
      if (d >= 8) { tips.push(id); return; }
      const n = d < 2 ? 2 : r() < 0.3 ? 3 : 2;
      for (let k = 0; k < n; k++) grow(x1, y1, a + (k - (n - 1) / 2) * (0.5 + r() * 0.25) + (r() - 0.5) * 0.25, len * (0.72 + r() * 0.1), d + 1, id);
    };
    grow(0, 0, -Math.PI / 2, 0.24, 0, -1);
    const path = id => { const p = []; while (id >= 0) { p.unshift(segs[id]); id = segs[id].parent; } return p; };
    return { segs, tips, paths: tips.filter((_, i) => i % 6 === 0).map(path) };
  })();
  A.film({ id: 'yggdrasil', name: 'Yggdrasil', odds: 1.6e15, duration: 19000, revealAt: 0.72, colors: ['#ffe8c0', COSMIC, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), base = { x: W / 2, y: H * 0.9 }, S = Math.min(H * 0.62, W * 0.95), GD = '255,226,170';
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#04020a'); bg.addColorStop(1, '#0a0614'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    A.stars(g, W, H, T, 130, 11, 0.8);
    const grow = clamp((T - 0.8) / (RV - 3.6)) * 9.2, sway = Math.sin(T * 0.4) * 0.015;
    const P = (x, y) => [base.x + (x + sway * -y) * S, base.y + y * S];
    // the roots, mirrored below the ground, faint
    g.beginPath();
    for (const s2 of TREE.segs) { if (s2.d > 4) continue; const k = clamp(grow - s2.d); if (k <= 0) continue; g.moveTo(base.x + s2.x * S * 0.8, base.y - s2.y * S * 0.35); g.lineTo(base.x + lerp(s2.x, s2.x1, k) * S * 0.8, base.y - lerp(s2.y, s2.y1, k) * S * 0.35); }
    glowStroke(g, 0.8, 0.35, '180,140,255');
    g.beginPath(); g.moveTo(0, base.y); g.lineTo(W, base.y); glowStroke(g, 1, 0.6, GD);
    // the tree: thick to thin
    for (let d = 0; d <= 8; d++) {
      g.beginPath();
      for (const s2 of TREE.segs) { if (s2.d !== d) continue; const k = clamp(grow - d); if (k <= 0) continue; const [ax, ay] = P(s2.x, s2.y), [bx, by] = P(lerp(s2.x, s2.x1, k), lerp(s2.y, s2.y1, k)); g.moveTo(ax, ay); g.lineTo(bx, by); }
      glowStroke(g, Math.max(0.6, (9 - d) * 0.75), 0.9 - d * 0.04, GD);
    }
    // light climbing to the tips
    if (grow > 4) for (let i = 0; i < TREE.paths.length; i++) {
      const p = TREE.paths[i], q = fr(T * 0.22 + i * 0.37) * p.length, s2 = p[Math.min(p.length - 1, Math.floor(q))], f = fr(q);
      if (s2.d > grow - 1) continue;
      const [x, y] = P(lerp(s2.x, s2.x1, f), lerp(s2.y, s2.y1, f)); light(g, x, y, 8, 0.8);
    }
    // a galaxy at every tip
    const gk = clamp((grow - 8.3) / 0.9);
    if (gk > 0) for (let i = 0; i < TREE.tips.length; i += 2) {
      const s2 = TREE.segs[TREE.tips[i]], [x, y] = P(s2.x1, s2.y1), rot = T * (0.6 + (i % 5) * 0.1);
      for (let j = 0; j < 8; j++) { const a = rot + j * 0.8, rr = j * 0.9; g.fillStyle = `hsla(${260 + (i % 4) * 25},80%,80%,${gk * (1 - j / 9)})`; g.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.4, 1.4); g.fillRect(x - Math.cos(a) * rr, y - Math.sin(a) * rr, 1.4, 1.4); }
    }
    const crown = { x: base.x, y: base.y - S * 0.95 };
    light(g, crown.x, crown.y, m * 0.5 * gk, 0.5 * gk);
    A.flash(g, W, H, T, RV - 0.05, 0.9, '255,245,225');
    if (T > RV - 0.2) A.gem(g, W, H, T, COSMIC, E.outCubic(seg(T, RV - 0.2, RV + 0.8)), W / 2, Math.min(H * 0.33, crown.y + m * 0.05));
    A.vignette(g, W, H, 0.55);
    A.say(g, W, H, T, [[1, 4.6, 'the roots drink from the void', 0.96], [5.2, 9.6, 'every branch holds a world', 0.96], [10.2, RV - 1.2, 'and at the crown, this', 0.96, 0.044]], SERIF);
  });

  /* ================= 1000조 · TESSERACT ================= a four-dimensional cube turning through a
     direction that does not exist, the grid of space bending round it; it unfolds, then folds down
     to nothing - and leaves the crystal */
  const HV = []; for (let i = 0; i < 16; i++) HV.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
  const HE = []; for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) { const d = i ^ j; if (d && !(d & (d - 1))) HE.push([i, j]); }
  function tesseract(g, x, y, s, t, unfold, alpha, col) {
    const a = t * 0.5, b = t * 0.37, cc = t * 0.23, r3 = t * 0.3;
    const P = HV.map(([X, Y, Z, Wd]) => {
      let x1 = X * Math.cos(a) - Wd * Math.sin(a), w1 = X * Math.sin(a) + Wd * Math.cos(a);
      let y1 = Y * Math.cos(b) - w1 * Math.sin(b); w1 = Y * Math.sin(b) + w1 * Math.cos(b);
      let z1 = Z * Math.cos(cc) - w1 * Math.sin(cc); w1 = Z * Math.sin(cc) + w1 * Math.cos(cc);
      const x2 = x1 * Math.cos(r3) - z1 * Math.sin(r3), z2 = x1 * Math.sin(r3) + z1 * Math.cos(r3);
      const k4 = (1.6 + unfold) / (2.6 - w1 * (1 - unfold * 0.5)), k3 = 3 / (4.2 - z2 * k4);
      return { x: x + x2 * k4 * k3 * s, y: y + y1 * k4 * k3 * s, w: w1 };
    });
    g.save(); g.globalAlpha = alpha;
    g.beginPath(); for (const [i, j] of HE) { if (P[i].w + P[j].w < 0) { g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); } } glowStroke(g, 0.8, 0.5, col);
    g.beginPath(); for (const [i, j] of HE) { if (P[i].w + P[j].w >= 0) { g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); } } glowStroke(g, 1.6, 1, col);
    for (const p of P) { g.fillStyle = '#fff'; g.fillRect(p.x - 2, p.y - 2, 4, 4); }
    g.restore();
  }
  A.film({ id: 'tesseract', name: 'Tesseract', odds: 6.1e15, duration: 18000, revealAt: 0.72, colors: ['#d8ccff', COSMIC, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.44 };
    g.fillStyle = '#030208'; g.fillRect(0, 0, W, H);
    const pull = 0.25 + 0.5 * E.inOut(clamp(T / RV)), unfold = E.inOut(seg(T, RV - 4, RV - 1.2)), fold = E.inCubic(seg(T, RV - 1.2, RV - 0.05));
    // space bending in toward it: a grid whose points are drawn to the centre
    const step = m / 12;
    g.beginPath();
    for (let gx = -6; gx <= 6; gx++) for (let k = 0; k <= 40; k++) {
      const x = W / 2 + gx * step, y = (k / 40) * H, dx = c.x - x, dy = c.y - y, d = Math.hypot(dx, dy) + 1, f = Math.min(0.85, (pull * m * m * 0.12) / (d * d + m * m * 0.04));
      k ? g.lineTo(x + dx * f, y + dy * f) : g.moveTo(x + dx * f, y + dy * f);
    }
    for (let gy = 0; gy <= Math.ceil(H / step); gy++) for (let k = 0; k <= 30; k++) {
      const x = (k / 30) * W, y = gy * step, dx = c.x - x, dy = c.y - y, d = Math.hypot(dx, dy) + 1, f = Math.min(0.85, (pull * m * m * 0.12) / (d * d + m * m * 0.04));
      k ? g.lineTo(x + dx * f, y + dy * f) : g.moveTo(x + dx * f, y + dy * f);
    }
    g.strokeStyle = 'rgba(170,150,255,.16)'; g.lineWidth = 0.7; g.stroke();
    if (T < RV) {
      const s = m * 0.19 * (1 + unfold * 0.6) * (1 - fold);
      tesseract(g, c.x, c.y, s * 1.7, T * 0.7 + 1, unfold, 0.3, '150,130,255');
      tesseract(g, c.x, c.y, s, T, unfold, 1, '200,180,255');
      tesseract(g, c.x, c.y, s * 0.45, -T * 1.3, unfold, 0.7, '255,200,255');
      light(g, c.x, c.y, m * 0.3, 0.25 + fold * 0.8);
    }
    A.flash(g, W, H, T, RV - 0.05, 0.8, '240,235,255');
    if (T > RV - 0.1) {
      const k = E.outCubic(seg(T, RV - 0.1, RV + 1));
      tesseract(g, W / 2, H * 0.33, m * 0.32, T * 0.4, 0, 0.3 * k, '170,150,255');
      A.gem(g, W, H, T, COSMIC, k);
    }
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[1, 4.6, 'a shape your eyes were not made for', 0.9], [5.2, 9.4, 'inside it, every room is the same room', 0.9], [RV - 3.6, RV - 1.2, 'it opens', 0.9, 0.05]]);
  });

  /* ================= 1경 · GENESIS ================= before the first second: one point of light.
     It breaks, and space pours out - matter running along filaments into a cosmic web, galaxies
     kindling at the knots - then all of it falls back into the single thing it came from */
  const WEB = (() => {
    const r = rnd(4040), nodes = Array.from({ length: 26 }, () => { const a = r() * TAU, d = Math.sqrt(r()) * 1; return [Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.5 + r()]; });
    const edges = []; nodes.forEach((n, i) => { const near = nodes.map((q, j) => [Math.hypot(q[0] - n[0], q[1] - n[1]), j]).filter(([, j]) => j !== i).sort((a, b) => a[0] - b[0]).slice(0, 2 + (i % 2)); near.forEach(([, j]) => { if (!edges.some(([a, b]) => (a === j && b === i))) edges.push([i, j]); }); });
    const parts = Array.from({ length: 520 }, () => { const [a, b] = edges[Math.floor(r() * edges.length)], t = r(), j = 0.03; return [lerp(nodes[a][0], nodes[b][0], t) + (r() - 0.5) * j, lerp(nodes[a][1], nodes[b][1], t) + (r() - 0.5) * j, r()]; });
    return { nodes, edges, parts };
  })();
  A.film({ id: 'genesis', name: 'Genesis', odds: 1.2e16, duration: 20000, revealAt: 0.72, colors: ['#ffd0b0', PRIM, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.44 }, BANG = 1.4;
    g.fillStyle = '#020104'; g.fillRect(0, 0, W, H);
    if (T < BANG) { const k = T / BANG; light(g, c.x, c.y, 6 + k * 30, 0.4 + 0.6 * k * (0.7 + 0.3 * Math.sin(T * 30))); circle(g, c.x, c.y, 1.5 + k * 2); g.fillStyle = '#fff'; g.fill(); }
    A.flash(g, W, H, T, BANG, 0.9, '255,235,215');
    if (T >= BANG && T < RV) {
      const inf = E.outCubic(clamp((T - BANG) / 5)), back = E.inCubic(seg(T, RV - 2.6, RV - 0.05)), U = m * lerp(0.62, 0.5, E.inOut(clamp((T - BANG) / (RV - BANG)))) * (1 - back), rot = T * 0.03;
      const P = (x, y) => [c.x + (x * Math.cos(rot) - y * Math.sin(rot)) * U, c.y + (x * Math.sin(rot) + y * Math.cos(rot)) * U];
      const fk = clamp((T - 4.5) / 3) * (1 - back);
      if (fk > 0) { g.beginPath(); for (const [a, b] of WEB.edges) { const [ax, ay] = P(WEB.nodes[a][0], WEB.nodes[a][1]), [bx, by] = P(WEB.nodes[b][0], WEB.nodes[b][1]); g.moveTo(ax, ay); g.lineTo(bx, by); } glowStroke(g, 0.8, 0.5 * fk, '255,160,120'); }
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < WEB.parts.length; i++) {
        const [px, py, q] = WEB.parts[i], k = inf * (0.6 + 0.4 * q), [x, y] = P(px * k, py * k);
        g.fillStyle = `hsla(${20 + q * 40},90%,${70 + q * 20}%,${0.5 + 0.4 * q})`; g.fillRect(x, y, 1.6, 1.6);
        if (back > 0) { const [sx, sy] = P(px * k * 1.15, py * k * 1.15); g.strokeStyle = `rgba(255,200,170,${0.3 * back})`; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(sx, sy); g.stroke(); }
      }
      g.restore();
      const gk = clamp((T - 6.5) / 2.5) * (1 - back);
      WEB.nodes.forEach(([nx, ny, ms], i) => {
        if (gk <= 0) return;
        const [x, y] = P(nx * inf, ny * inf), rr = m * 0.012 * ms, rotg = T * (0.8 + (i % 4) * 0.2);
        light(g, x, y, rr * 4, 0.5 * gk);
        for (let j = 0; j < 10; j++) { const a = rotg + j * 0.7, d = j * rr * 0.25; g.fillStyle = `rgba(255,230,210,${gk * (1 - j / 11)})`; g.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, 1.4, 1.4); g.fillRect(x - Math.cos(a) * d, y - Math.sin(a) * d * 0.6, 1.4, 1.4); }
      });
      light(g, c.x, c.y, m * 0.25 * (0.3 + back), 0.3 + back * 0.9);
    }
    A.flash(g, W, H, T, RV - 0.05, 1, '255,240,230');
    if (T > RV - 0.1) A.gem(g, W, H, T, PRIM, E.outCubic(seg(T, RV - 0.1, RV + 1)));
    A.vignette(g, W, H, 0.6);
    A.say(g, W, H, T, [[2.4, 6, 'before the first second', 0.9], [6.6, 10.4, 'there was a single thought', 0.9], [11, RV - 1.4, 'everything since is its echo', 0.9, 0.044]]);
  });

  /* ================= 1경 · THE AUTHOR ================= white paper. A line of ink writes itself,
     then another - the mountains, the seas, the stars set down in a hand no one can read; ink falls
     and blooms into the shape of the crystal, and the shape cracks with light */
  const LINES = Array.from({ length: 16 }, (_, i) => {
    const r = rnd(2200 + i), pts = []; let x = 0.08 + r() * 0.04;
    const end = 0.92 - r() * (i % 4 === 3 ? 0.35 : 0.06);
    while (x < end) {
      const w = 0.012 + r() * 0.018, h = 0.012 + r() * 0.012, tall = r() < 0.15 ? 2.2 : 1;
      for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([x + w * t + Math.sin(t * TAU) * w * 0.25, -Math.sin(t * Math.PI) * h * tall + Math.cos(t * TAU) * h * 0.25]); }
      x += w + (r() < 0.18 ? 0.025 : 0.004);
    }
    return pts;
  });
  const BLOBS = Array.from({ length: 14 }, (_, i) => { const r = rnd(3300 + i), a = r() * TAU, d = Math.sqrt(r()) * 0.6; return { x: Math.cos(a) * d * 0.7, y: Math.sin(a) * d - 0.1, t: r(), s: 0.18 + r() * 0.2, wob: Array.from({ length: 12 }, () => 0.8 + r() * 0.4) }; });
  const GEMPATH = [[-0.36, -0.52], [0.36, -0.52], [0.78, -0.18], [0, 0.82], [-0.78, -0.18]];
  A.film({ id: 'theauthor', name: 'The Author', odds: 3.3e16, duration: 20000, revealAt: 0.72, colors: ['#fff0d8', PRIM, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), INK = '#1c140c', paper = T > RV ? 1 - E.outCubic(seg(T, RV, RV + 1.4)) : 1;
    g.fillStyle = '#ebe2cf'; g.fillRect(0, 0, W, H);
    const pv = g.createRadialGradient(W / 2, H / 2, m * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6); pv.addColorStop(0, 'rgba(120,80,30,0)'); pv.addColorStop(1, 'rgba(120,80,30,.35)'); g.fillStyle = pv; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(90,60,30,${0.05 + 0.08 * fr(i * 0.71)})`; g.fillRect(fr(i * 0.618) * W, fr(i * 0.379) * H, 1, 1); }
    // the writing, a line at a time, the page creeping up
    const lh = H * 0.055, scroll = Math.max(0, (T - 4.5) * lh * 0.35), writeEnd = RV - 4;
    g.strokeStyle = INK; g.lineWidth = Math.max(1, m * 0.0026); g.lineJoin = 'round'; g.lineCap = 'round';
    let pen = null;
    LINES.forEach((L, i) => {
      const t0 = 0.4 + i * 0.62, k = clamp((T - t0) / 0.6); if (k <= 0 || t0 > writeEnd) return;
      const y = H * 0.14 + i * lh - scroll, n = Math.floor(L.length * k); if (y < -lh || n < 2) return;
      g.beginPath(); for (let j = 0; j < n; j++) { const px = L[j][0] * W, py = y + L[j][1] * W * 0.9; j ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
      if (k < 1) pen = [L[n - 1][0] * W, y + L[n - 1][1] * W * 0.9];
    });
    if (pen && T < writeEnd) { g.fillStyle = INK; g.save(); g.translate(pen[0], pen[1]); g.rotate(-0.6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-4, -16); g.lineTo(4, -16); g.closePath(); g.fill(); g.restore(); }
    // the ink falling and blooming into the shape of the crystal
    const c = { x: W / 2, y: H * 0.45 }, S = m * 0.38, ik = clamp((T - (RV - 5)) / 3.6);
    if (ik > 0) {
      g.save(); g.beginPath(); GEMPATH.forEach(([x, y], i) => (i ? g.lineTo(c.x + x * S, c.y + y * S) : g.moveTo(c.x + x * S, c.y + y * S))); g.closePath(); g.clip();
      g.fillStyle = INK;
      BLOBS.forEach(b => {
        const k = clamp((ik - b.t * 0.5) / 0.5); if (k <= 0) return;
        const r = S * b.s * E.outCubic(k) * 1.8; g.beginPath();
        b.wob.forEach((w, i) => { const a = (i / b.wob.length) * TAU, rr = r * (w + 0.05 * Math.sin(T * 2 + i)); i ? g.lineTo(c.x + b.x * S + Math.cos(a) * rr, c.y + b.y * S + Math.sin(a) * rr) : g.moveTo(c.x + b.x * S + Math.cos(a) * rr, c.y + b.y * S + Math.sin(a) * rr); });
        g.closePath(); g.fill();
      });
      g.restore();
      // falling drops
      for (let i = 0; i < 10; i++) { const d = clamp((ik - i * 0.07) * 2.5); if (d <= 0 || d >= 1) continue; const x = c.x + (BLOBS[i].x) * S, y = lerp(-20, c.y + BLOBS[i].y * S, E.inQuad(d)); circle(g, x, y, 3 + d * 2); g.fillStyle = INK; g.fill(); }
      // light cracking through the ink
      const ck = seg(T, RV - 1.3, RV - 0.05);
      if (ck > 0) { const r = rnd(9); g.beginPath(); for (let j = 0; j < 7; j++) { let a = r() * TAU, x = c.x, y = c.y; g.moveTo(x, y); for (let s2 = 0; s2 < 7 * ck; s2++) { a += (r() - 0.5) * 0.8; x += Math.cos(a) * S * 0.1; y += Math.sin(a) * S * 0.1; g.lineTo(x, y); } } glowStroke(g, 1.6, 1, '255,200,120'); }
    }
    if (paper < 1) { g.fillStyle = `rgba(10,7,4,${1 - paper})`; g.fillRect(0, 0, W, H); }
    A.flash(g, W, H, T, RV - 0.05, 1, '255,245,225');
    if (T > RV - 0.1) A.gem(g, W, H, T, PRIM, E.outCubic(seg(T, RV - 0.1, RV + 1)));
    A.say(g, W, H, T, [[1.2, 5, 'in the beginning, a single line', 0.93, 0.04, INK], [5.6, 9.6, 'it wrote the mountains, the seas, the stars', 0.93, 0.038, INK], [10.2, RV - 1.6, 'and last of all, it wrote you', 0.93, 0.042, INK]], SERIF);
  });

  /* ================= 1경 · COLOSSUS ================= looking straight up the side of something that
     was here before the mountains: a dark tower filling the middle of the sky, its storeys rushing
     down past us as we rise along it through three layers of cloud into black space - until its
     summit comes down into view and the crown at the top opens around the crystal */
  A.film({ id: 'colossus', name: 'Colossus', odds: 8.8e16, duration: 20000, revealAt: 0.72, colors: ['#ffd8c0', PRIM, '#000000'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), TOP = 40, OR = '255,190,150';
    const alt = E.inOut(clamp(T / (RV - 1.4))) * (TOP - 2.1), space = clamp((alt - 20) / 14);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${Math.round(lerp(18, 2, space))},${Math.round(lerp(24, 2, space))},${Math.round(lerp(44, 6, space))})`);
    sky.addColorStop(1, `rgb(${Math.round(lerp(58, 4, space))},${Math.round(lerp(44, 3, space))},${Math.round(lerp(60, 8, space))})`);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    A.stars(g, W, H, T, 140, 21, 0.2 + 0.8 * space);
    // a storey d above us: where its ring sits on screen and how wide the tower is there
    const vy = -H * 0.35, ring = d => { const p = 1 / (1 + Math.max(0, d) * 0.32); return { y: lerp(vy, H * 1.15, p), w: Math.min(W * 0.92, m * 1.1) * p }; };
    const sum = ring(TOP - alt), open = E.outCubic(seg(T, RV - 2.2, RV + 0.3));
    // the crown's spires, behind the top storey
    if (TOP - alt < 9) {
      for (let i = 0; i < 9; i++) {
        const f = i / 8 - 0.5, base = W / 2 + f * sum.w * 0.9, lean = f * (0.4 + open * 1.4), len = sum.w * (0.5 + (1 - Math.abs(f)) * 0.7) * (0.6 + open * 0.6);
        g.beginPath(); g.moveTo(base - sum.w * 0.03, sum.y); g.lineTo(base + Math.sin(lean) * len, sum.y - Math.cos(lean) * len); g.lineTo(base + sum.w * 0.03, sum.y); g.closePath();
        g.fillStyle = '#0c0907'; g.fill(); glowStroke(g, 1.2, 0.9, OR);
      }
      light(g, W / 2, sum.y - sum.w * 0.5, m * 0.45 * open, 0.9 * open);
    }
    // the tower, far storeys first
    for (let k = TOP - 1; k >= Math.floor(alt) - 1; k--) {
      const d0 = k - alt, d1 = k + 1 - alt; if (d1 < 0) continue;
      const a = ring(d0), b = ring(d1), fade = clamp(1.2 - d0 * 0.03);
      g.beginPath(); g.moveTo(W / 2 - a.w / 2, a.y); g.lineTo(W / 2 - b.w / 2, b.y); g.lineTo(W / 2 + b.w / 2, b.y); g.lineTo(W / 2 + a.w / 2, a.y); g.closePath();
      const fg = g.createLinearGradient(W / 2 - a.w / 2, 0, W / 2 + a.w / 2, 0); fg.addColorStop(0, '#1c1410'); fg.addColorStop(0.18, '#0b0807'); fg.addColorStop(0.8, '#060505'); fg.addColorStop(1, '#141010');
      g.fillStyle = fg; g.fill();
      g.beginPath(); for (const f of [-0.5, -0.3, -0.1, 0.1, 0.3, 0.5]) { g.moveTo(W / 2 + a.w * f, a.y); g.lineTo(W / 2 + b.w * f, b.y); }
      g.strokeStyle = `rgba(${OR},${0.22 * fade})`; g.lineWidth = 0.7; g.stroke();
      g.beginPath(); g.moveTo(W / 2 - b.w / 2, b.y); g.lineTo(W / 2 + b.w / 2, b.y); glowStroke(g, 0.5 + 1.6 / (1 + d1), 0.75 * fade, OR);
      for (let i = 0; i < 10; i++) { if (fr(Math.sin(k * 7.1 + i * 3.3) * 999) > 0.4) continue; const f = (i + 0.5) / 10 - 0.5, y = lerp(a.y, b.y, 0.5); g.fillStyle = `rgba(255,214,170,${0.75 * fade})`; g.fillRect(W / 2 + lerp(a.w, b.w, 0.5) * f - 1.5, y - 1, 3, 2); }
    }
    // the rim light down both edges of the tower
    g.beginPath(); for (const s of [-1, 1]) { g.moveTo(W / 2 + s * ring(0).w / 2, H * 1.15); g.lineTo(W / 2 + s * sum.w / 2, sum.y); } glowStroke(g, 1.2, 0.8, OR);
    // the clouds we rise through
    for (const L of [7, 16, 25]) {
      const d = L - alt; if (d < -1.4 || d > 7) continue;
      const y = d < 0 ? H * (0.9 - d * 0.6) : ring(d).y, thick = d < 0 ? 1 + d / 1.4 : clamp(1.2 - d * 0.15);
      for (let i = 0; i < 14; i++) { const x = fr(i * 0.31 + T * 0.012 * ((i % 3) + 1)) * W * 1.4 - W * 0.2, ry = H * (0.025 + 0.035 * fr(i * 0.7)) * (d < 0.5 ? 3 : 1); g.fillStyle = `rgba(225,215,235,${0.12 * thick})`; g.beginPath(); g.ellipse(x, y + (i % 3) * 10, W * 0.28, ry, 0, 0, TAU); g.fill(); }
    }
    A.flash(g, W, H, T, RV - 0.05, 1, '255,240,225');
    if (T > RV - 0.2) A.gem(g, W, H, T, PRIM, E.outCubic(seg(T, RV - 0.2, RV + 0.9)), W / 2, Math.min(H * 0.33, sum.y - m * 0.28));
    A.vignette(g, W, H, 0.55);
    A.say(g, W, H, T, [[1, 4.8, 'it was here before the mountains', 0.9], [5.4, 9.8, 'no one has ever seen the top', 0.9], [10.4, RV - 1.2, 'you are the first', 0.9, 0.046]], SERIF);
  });
})();
