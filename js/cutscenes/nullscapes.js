/*
  NULLSCAPES - the NULL biome's own mineral (js/biome.js), 1 in 555,555,555,555. Nowhere else.
  A motion-graphics film to Flow (Creo): black and white with one cold violet, fine instrument-like
  linework (scales, ticks, brackets, dimension lines), slow grand camera moves on the 128 BPM grid.
  Laid out like BREAKTHROUGH's own film (38 s of Flow, the i - iv lines over the build, "get out of
  my head" in the break, the rest over the drop). The song comes in at 33.9 s, at the start of the
  phrase eight bars before the drop (49.02 s); bars below count from the drop.
    blackout (2 s)    : a hairline draws itself across the dark, and goes
    bars -8..-6  i    : an eclipse - a black disc in a corona, ringed by measuring scales
    bars -6..-4  ii   : an endless floor running to a horizon, a monolith rising out of it
    bars -4..-2  iii  : a long corridor of frames, light at the end
    bars -2..    iv   : stripes sliding across; over the rising run of eight notes (45.03 - 46.67 s)
                        "how much do you believe in this world?" stacks up, a word a note
    the break (46.95) : nothing on screen but "get out of my head", in on the piano "da" (47.86 s)
    bars 0-2   WHITE  : a white world, small black fragments hanging in it
    bars 2-4   FIVE   : five shards standing in the light from a crack in the ground
    bars 4-6   ODDS   : 1 in 555,555,555,555, counted up
    bars 6-8   FORM   : the crystal drawn like a blueprint - guides, edges, dimensions - then filled
    bars 8-10  RISE   : the light swells until the screen is white
    bar 10            : NULLSCAPES - its true form, an obsidian bipyramid, turns above the floor
  Words snap in whole on a beat, drawn with 'difference' so they read on black and on white alike.
  G.n3 also carries the NULL theme (js/game.js ambient 'null') and the NULL biome's look (js/biome.js).
*/
(() => {
  const { E, seg, clamp } = G;
  const TAU = Math.PI * 2, fr = v => v - Math.floor(v);
  const BEAT = 60 / 128, BAR = BEAT * 4;
  const DA = 33.9;                                                      // the song starts here (s)
  const BREAK = 46.95 - DA, HIT1 = 47.86 - DA, DAN = 49.02 - DA;        // the break, the piano "da", the drop
  const RUN = [45.03, 45.27, 45.51, 45.74, 45.97, 46.2, 46.44, 46.67].map(t => t - DA);   // the rising run
  const barAt = n => DAN + n * BAR, beatAt = n => DAN + n * BEAT;      // downbeat of bar n / beat n of the drop
  const WIDE = 'Syncopate, "Arial Black", sans-serif';
  const THIN = '"Helvetica Neue", "Segoe UI", Arial, sans-serif';
  const MONO = 'Consolas, "Courier New", monospace';
  const ACC = '#8c8cff';
  // seeded random (Lehmer); the seed is scrambled first so neighbouring seeds don't start out in step
  const rnd = s => { s = ((s * 2654435761) % 2147483646) + 1; const f = () => (s = (s * 16807) % 2147483647) / 2147483647; f(); f(); return f; };
  const N3 = G.n3 = {};

  /* ---------------- light: one soft bloom sprite ---------------- */
  let bloomSpr = null;
  const bloom = () => {
    if (bloomSpr) return bloomSpr;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,.75)'); gr.addColorStop(0.35, 'rgba(225,230,255,.22)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return (bloomSpr = c);
  };
  const glowAt = (g, x, y, r, a) => { if (a <= 0 || r <= 0) return; g.globalAlpha = Math.min(1, a); g.drawImage(bloom(), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
  const light = (g, x, y, r, a) => { g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, x, y, r, a); g.restore(); };

  /* ---------------- the linework kit ---------------- */
  // stroke the current path as light: a wide faint halo, a softer core, then the crisp line
  function glowStroke(g, w, a, col = '255,255,255') {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.lineWidth = w * 7; g.strokeStyle = `rgba(${col},${0.05 * a})`; g.stroke();
    g.lineWidth = w * 2.6; g.strokeStyle = `rgba(${col},${0.16 * a})`; g.stroke();
    g.restore();
    g.lineWidth = w; g.strokeStyle = `rgba(${col},${a})`; g.stroke();
  }
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); }
  function square(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.rect(-s / 2, -s / 2, s, s); g.restore(); }
  // a measuring ring: double line, a dotted outer track, a 3-degree scale with 15/90-degree majors,
  // four heavy arc brackets, optional bearing labels
  function hudRing(g, x, y, r, rot, a, labels) {
    if (a <= 0 || r <= 2) return;
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = Math.min(1, a); g.strokeStyle = '#fff';
    circle(g, 0, 0, r); g.lineWidth = 1.3; g.stroke();
    circle(g, 0, 0, r * 0.955); g.lineWidth = 0.6; g.stroke();
    g.setLineDash([1.5, 5]); circle(g, 0, 0, r * 1.05); g.lineWidth = 1; g.stroke(); g.setLineDash([]);
    g.beginPath();
    for (let i = 0; i < 120; i++) {
      const an = (i / 120) * TAU, L = i % 30 === 0 ? r * 0.09 : i % 5 === 0 ? r * 0.045 : r * 0.018, c = Math.cos(an), s = Math.sin(an);
      g.moveTo(c * r * 0.955, s * r * 0.955); g.lineTo(c * (r * 0.955 - L), s * (r * 0.955 - L));
    }
    g.lineWidth = 0.8; g.stroke();
    g.lineWidth = 3; for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(0, 0, r * 1.1, (q * TAU) / 4 - 0.1, (q * TAU) / 4 + 0.1); g.stroke(); }
    if (labels) {
      g.font = `400 ${Math.max(8, r * 0.05)}px ${MONO}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['000', '090', '180', '270'].forEach((s, q) => { const an = (q * TAU) / 4 - TAU / 4 + 0.22; g.fillText(s, Math.cos(an) * r * 1.19, Math.sin(an) * r * 1.19); });
    }
    g.restore();
  }
  // corner brackets round a box
  function brackets(g, x, y, w, h, L) {
    g.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = x + (sx * w) / 2, cy = y + (sy * h) / 2;
      g.moveTo(cx - sx * L, cy); g.lineTo(cx, cy); g.lineTo(cx, cy - sy * L);
    }
  }
  // a dimension line: end ticks, arrowheads, the figure in the middle
  function dimension(g, x0, y0, x1, y1, label, a, k = 1) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux, e = len * k;
    if (e < 2) return;
    g.save(); g.globalAlpha = a; g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + ux * e, y0 + uy * e);
    g.moveTo(x0 + nx * 6, y0 + ny * 6); g.lineTo(x0 - nx * 6, y0 - ny * 6);
    if (k >= 1) { g.moveTo(x1 + nx * 6, y1 + ny * 6); g.lineTo(x1 - nx * 6, y1 - ny * 6); }
    g.stroke();
    if (k >= 1) {
      for (const [px, py, s] of [[x0, y0, 1], [x1, y1, -1]]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + (ux * 7 + nx * 2.5) * s, py + (uy * 7 + ny * 2.5) * s); g.lineTo(px + (ux * 7 - nx * 2.5) * s, py + (uy * 7 - ny * 2.5) * s); g.closePath(); g.fill(); }
      g.font = `400 10px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const mx = (x0 + x1) / 2 + nx * 10, my = (y0 + y1) / 2 + ny * 10;
      g.save(); g.translate(mx, my); g.rotate(Math.atan2(dy, dx)); g.fillText(label, 0, 0); g.restore();
    }
    g.restore();
  }
  // a fine drafting grid: minor and major lines
  function fineGrid(g, W, H, step, ox, oy, a) {
    for (const [mul, al] of [[1, 0.06], [5, 0.14]]) {
      const s = step * mul; g.beginPath();
      for (let x = ((ox % s) + s) % s; x < W; x += s) { g.moveTo(x, 0); g.lineTo(x, H); }
      for (let y = ((oy % s) + s) % s; y < H; y += s) { g.moveTo(0, y); g.lineTo(W, y); }
      g.strokeStyle = `rgba(255,255,255,${al * a})`; g.lineWidth = mul > 1 ? 0.8 : 0.5; g.stroke();
    }
  }
  // a floor of lines running to a horizon at hy (and, faint, its mirror above), moving toward you
  function floor(g, W, H, hy, t, a, speed = 0.5) {
    const vx = W / 2;
    g.save(); g.strokeStyle = '#fff'; g.lineWidth = 0.8;
    g.beginPath(); for (let i = -16; i <= 16; i++) { g.moveTo(vx + i * W * 0.004, hy); g.lineTo(vx + i * W * 0.13, H * 1.02); }
    g.globalAlpha = a * 0.3; g.stroke();
    const ph = fr(t * speed);
    for (let j = 0; j < 22; j++) {
      const zz = j + 1 - ph, y = hy + ((H - hy) * 1.15) / zz;
      if (y > H + 2) continue;
      g.globalAlpha = a * Math.min(0.75, 1.4 / zz); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      const yc = hy - ((hy) * 0.9) / zz; g.globalAlpha = a * Math.min(0.2, 0.4 / zz); g.beginPath(); g.moveTo(0, yc); g.lineTo(W, yc); g.stroke();
    }
    g.restore();
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); glowStroke(g, 1.2, a);
    light(g, vx, hy, Math.min(W, H) * 0.35, 0.3 * a);
  }
  /* ---------------- a small 3D kit: meshes turned round their upright axis, seen from a little above ----------------
     A mesh is { v: [[x, y, z], ...], f: [[i, j, k, ...], ...] } in model units, y pointing down. drawMesh
     shades the faces that face you (painter's order), draws the hidden edges faint and dashed as if seen
     through glass, and burns the visible edges white. */
  const VIEW = [0, -0.21, 0.98];
  function meshEdges(M) {
    const seen = {}, out = [];
    M.f.forEach((f, fi) => f.forEach((a, i) => {
      const b = f[(i + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a;
      if (seen[k]) seen[k].faces.push(fi); else out.push(seen[k] = { a, b, faces: [fi] });
    }));
    return out;
  }
  function drawMesh(g, M, x, y, s, turn, o = {}) {
    const A = o.alpha != null ? o.alpha : 1;
    g.save(); g.globalAlpha = A;
    const tilt = o.tilt != null ? o.tilt : 0.22, c = Math.cos(turn), sn = Math.sin(turn);
    const R = M.v.map(([X, Y, Z]) => [X * c + Z * sn, Y, -X * sn + Z * c]);
    const P = R.map(([X, Y, Z]) => ({ x: x + X * s, y: y + (Y + Z * tilt) * s, z: Z }));
    const cen = R.reduce((a, p) => [a[0] + p[0] / R.length, a[1] + p[1] / R.length, a[2] + p[2] / R.length], [0, 0, 0]);
    const L = o.light || [-0.45, -0.65, 0.6], Ll = Math.hypot(...L);
    const F = M.f.map(f => {
      const [a, b, d] = [R[f[0]], R[f[1]], R[f[2]]], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const fc = f.reduce((acc, i) => [acc[0] + R[i][0] / f.length, acc[1] + R[i][1] / f.length, acc[2] + R[i][2] / f.length], [0, 0, 0]);
      if (n[0] * (fc[0] - cen[0]) + n[1] * (fc[1] - cen[1]) + n[2] * (fc[2] - cen[2]) < 0) n = n.map(q => -q);
      const nl = Math.hypot(...n) || 1;
      return { f, vis: (n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2]) / nl > 0, depth: fc[2], lit: Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl / Ll) };
    });
    const ED = M.edges || (M.edges = meshEdges(M)), fill = o.fill != null ? o.fill : 1, ek = o.edges != null ? o.edges : 1, n = ED.length;
    const seg2 = (e, i) => { const k = clamp(ek * n - i); if (k <= 0) return false; const A = P[e.a], B = P[e.b]; g.moveTo(A.x, A.y); g.lineTo(A.x + (B.x - A.x) * k, A.y + (B.y - A.y) * k); return true; };
    // hidden edges, through the glass
    g.save(); g.setLineDash([2, 4]); g.beginPath();
    ED.forEach((e, i) => { if (!e.faces.some(fi => F[fi].vis)) seg2(e, i); });
    g.strokeStyle = `rgba(255,255,255,${o.back != null ? o.back : 0.25})`; g.lineWidth = 0.8; g.stroke(); g.restore();
    // the faces that face you
    if (fill > 0) {
      const base = o.base || [10, 10, 16], span = o.span || [120, 120, 150];
      F.filter(q => q.vis).sort((p, q) => p.depth - q.depth).forEach(q => {
        g.beginPath(); q.f.forEach((i, j) => (j ? g.lineTo(P[i].x, P[i].y) : g.moveTo(P[i].x, P[i].y))); g.closePath();
        const k = q.lit * q.lit, col = j => Math.round(base[j] + span[j] * k);
        g.globalAlpha = fill * A; g.fillStyle = `rgb(${col(0)},${col(1)},${col(2)})`; g.fill(); g.globalAlpha = A;
      });
    }
    if (o.inner) o.inner(P);                                            // anything seen inside the glass
    // the visible edges burn
    g.beginPath(); let any = false;
    ED.forEach((e, i) => { if (e.faces.some(fi => F[fi].vis)) any = seg2(e, i) || any; });
    if (any) { g.lineJoin = 'round'; glowStroke(g, o.lw || 1.4, o.ea != null ? o.ea : 1); }
    g.restore();
    return P;
  }
  // the crystal: a hexagonal bipyramid (vertices: 0 top, 1 bottom, 2-7 the girdle)
  const BIPY = (() => {
    const v = [[0, -1.2, 0], [0, 1.05, 0]], f = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; v.push([Math.sin(a) * 0.62, -0.08, Math.cos(a) * 0.62]); }
    for (let i = 0; i < 6; i++) { const a = 2 + i, b = 2 + ((i + 1) % 6); f.push([0, a, b], [1, b, a]); }
    return { v, f };
  })();
  // a hard diagonal wipe: a white band sweeping across (k 0..1)
  function wipe(g, W, H, k, dir) {
    if (k <= 0 || k >= 1) return;
    const e = E.inOut(k), x = -W * 0.7 + e * W * 2.4, w = W * 0.55, sk = H * 0.35;
    g.save(); if (dir < 0) { g.translate(W, 0); g.scale(-1, 1); }
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w - sk, H); g.lineTo(x - sk, H); g.closePath(); g.fill();
    g.fillStyle = ACC;                                                  // a thin violet edge on its leading side
    g.beginPath(); g.moveTo(x + w, 0); g.lineTo(x + w + W * 0.02, 0); g.lineTo(x + w + W * 0.02 - sk, H); g.lineTo(x + w - sk, H); g.closePath(); g.fill();
    g.restore();
  }

  // the five fragments: each a real broken crystal column (a ragged five-sided prism with a point and a
  // snapped-off foot). Shared by the film (scene FIVE), the theme and the biome.
  const FIVE = [[0, 1.0, 0.3], [-0.62, 0.74, 0.22], [0.62, 0.76, 0.22], [-1.12, 0.52, 0.17], [1.12, 0.55, 0.17]].map(([x, h, w], i) => {
    const r = rnd(70 + i), n = 5, v = [], f = [];
    for (let j = 0; j < n; j++) { const a = (j / n) * TAU + r() * 0.5, rr = w * (0.7 + r() * 0.3); v.push([Math.sin(a) * rr, h * r() * 0.06, Math.cos(a) * rr]); }   // the foot
    for (let j = 0; j < n; j++) { const [X, , Z] = v[j], k = 0.72 + r() * 0.2; v.push([X * k, -h * (0.62 + r() * 0.16), Z * k]); }                               // the shoulder
    v.push([(r() - 0.5) * w * 0.3, -h * (1.08 + r() * 0.1), (r() - 0.5) * w * 0.3]);                                                                        // the point
    v.push([(r() - 0.5) * w * 0.2, h * 0.17, (r() - 0.5) * w * 0.2]);                                                                                       // a snapped-off spur below
    const tip = 2 * n, spur = 2 * n + 1;
    for (let j = 0; j < n; j++) { const a = j, b = (j + 1) % n; f.push([a, b, n + b, n + a], [n + a, n + b, tip], [b, a, spur]); }
    return { x, h, M: { v, f }, ph: r() * TAU, spin: (r() < 0.5 ? -1 : 1) * (0.18 + r() * 0.2) };
  });
  const FIVE_LIGHT = [0.2, 0.8, 0.55], OBSIDIAN = { base: [5, 5, 9], span: [165, 165, 190] };
  // a crack of light along the ground, glowing
  function groundCrack(g, cx, gy, half, U, seed, a = 1) {
    const r = rnd(seed); g.beginPath(); let x = cx - half; g.moveTo(x, gy);
    while (x < cx + half) { x += U * (0.05 + r() * 0.08); g.lineTo(x, gy + (r() - 0.5) * U * 0.03); }
    glowStroke(g, 1.6, a);
  }
  // glass shards rising off the ground and fading
  function risingGlass(g, cx, gy, U, t, n, a = 1) {
    g.save(); g.strokeStyle = '#fff'; g.lineWidth = 0.8;
    for (let i = 0; i < n; i++) {
      const life = fr(i * 0.618 + t * (0.06 + (i % 4) * 0.02)), sx = cx + (fr(i * 0.37) - 0.5) * U * 3.6, sy = gy - life * U * 2.4, s = U * (0.015 + (i % 3) * 0.01);
      g.save(); g.translate(sx + Math.sin(t * 0.7 + i) * U * 0.04, sy); g.rotate(t * (0.4 + (i % 3) * 0.5) + i); g.globalAlpha = Math.sin(life * Math.PI) * 0.85 * a;
      g.beginPath(); g.moveTo(0, -s * 1.4); g.lineTo(s * 0.8, s * 0.6); g.lineTo(-s * 0.7, s * 0.9); g.closePath(); g.stroke();
      g.restore();
    }
    g.restore();
  }

  /* ================= the NULL theme: BREAKTHROUGH's aura round the crystal =================
     The five fragments stand in an arc behind the crystal, the great one straight behind it, turning
     slowly on a floor that runs off to the dark; light pours up out of a crack in the ground beneath,
     glass rises off it, a measuring ring turns round the crystal. Calm - it breathes on the beat. */
  N3.auraTheme = (g, W, H, t, c, R) => {
    const m = Math.min(W, H), bp = fr(t / BEAT), beat = Math.exp(-bp * 5);
    const gy = c.y + R * 1.25, U = R * 1.95, spread = Math.min(1.15, (W * 0.45) / (1.12 * U));
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, Math.max(14, m / 34), W / 2, gy, 0.55);
    floor(g, W, H, gy, t, 0.5, 0.12);
    // the light pouring up out of the crack, behind everything
    const lg = g.createLinearGradient(0, gy, 0, 0); lg.addColorStop(0, 'rgba(255,255,255,.3)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(c.x - U * 0.35, 0, U * 0.7, gy); g.restore();
    light(g, c.x, gy, U * 1.2, 0.4 + 0.15 * beat);
    // a slow shockwave along the floor every eight bars
    const sw = fr(t / (BAR * 8)) * 8 * BAR;
    if (sw < 1.8) { g.save(); g.translate(c.x, gy); g.scale(1, 0.22); circle(g, 0, 0, U * 0.3 + E.outCubic(sw / 1.8) * W); g.restore(); glowStroke(g, 1.2, 0.6 * (1 - sw / 1.8)); }
    for (const idx of [3, 4, 1, 2, 0]) {                                // outer ones first, the great one last
      const f = FIVE[idx], x = c.x + f.x * U * spread, y = gy - U * 0.1 + Math.sin(t * 0.6 + f.ph) * U * 0.02;
      light(g, x, y - U * f.h * 0.5, U * 0.4, 0.18);
      drawMesh(g, f.M, x, y, U * (idx ? 0.9 : 1), f.ph + t * f.spin * 0.6, { light: FIVE_LIGHT, base: [4, 4, 8], span: [95, 95, 120], back: 0.14, lw: 1.1 });
    }
    groundCrack(g, c.x, gy, U * 1.5, U, 4242, 0.9);
    risingGlass(g, c.x, gy, U * 0.8, t, 18, 0.8);
    hudRing(g, c.x, c.y, R * 1.75, t * 0.04, 0.45, true);
    circle(g, c.x, c.y, R * 1.32 * (1 + 0.03 * beat)); glowStroke(g, 1.2, 0.35 + 0.3 * beat, '140,140,255');
    light(g, c.x, c.y, R * 2, 0.1 + 0.1 * beat);
    const v = g.createRadialGradient(c.x, c.y, m * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.65);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  };

  /* ================= the NULL biome: no ground, no sky =================
     Black void, alive: searchlight beams sweep up out of the dark, two great measuring rings turn round
     the middle, a dead eclipse hangs off to the side, broken crystal (the five fragments' kin and small
     true forms) drifts past at three depths, meteors streak through, now and then a crack of light tears
     across the void - and every twenty seconds the whole void inverts for a beat, white with black
     glass, like the moment the film breaks through. Every so often a line of the picture tears too
     (biomeFront). About a millisecond a frame. */
  const DRIFT = Array.from({ length: 16 }, (_, i) => {
    const r = rnd(900 + i), depth = [0.3, 0.55, 0.8, 1.05][i % 4];
    return { mesh: i % 4 === 3 ? BIPY : FIVE[i % 5].M, depth, y: 0.06 + r() * 0.88, x: r(), sp: 0.025 + r() * 0.02, spin: (r() - 0.5) * 0.8, ph: r() * TAU, size: (0.05 + r() * 0.05) * (0.5 + depth), tilt: (r() - 0.5) * 0.6 };
  }).sort((a, b) => a.depth - b.depth);
  const TEARS = Array.from({ length: 6 }, (_, i) => {                  // jagged lines of light, edge to edge
    const r = rnd(1300 + i), pts = [], a = (r() - 0.5) * 1.2; let x = -0.1, y = 0.15 + r() * 0.7;
    while (x < 1.1) { pts.push([x, y]); x += 0.04 + r() * 0.06; y += Math.tan(a) * 0.05 + (r() - 0.5) * 0.06; }
    return pts;
  });
  N3.biomeBack = (g, W, H, t) => {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.45 }, D = Math.hypot(W, H), pulse = Math.exp(-fr(t / BEAT) * 5);
    g.fillStyle = 'rgba(0,0,3,.95)'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, Math.max(16, m / 26), t * 3, H / 2, 0.45);
    // stars in three layers, twinkling
    for (let i = 0; i < 90; i++) {
      const L = i % 3, x = fr(i * 0.618 + t * 0.003 * (1 + L * 1.5)) * W, y = fr(i * 0.37) * H, tw = 0.5 + 0.5 * Math.sin(t * (1 + (i % 5)) + i);
      g.fillStyle = `rgba(255,255,255,${(0.12 + 0.3 * L) * (0.4 + 0.6 * tw)})`; const s = 0.8 + L * 0.6; g.fillRect(x, y, s, s);
    }
    // searchlights sweeping up out of the dark
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ang = Math.sin(t * (0.13 + i * 0.05) + i * 2.1) * 0.55 + (i - 1) * 0.35, bx = W * (0.2 + i * 0.3), by = H * 1.05;
      g.save(); g.translate(bx, by); g.rotate(ang);
      const bw = m * 0.12, gr = g.createLinearGradient(-bw, 0, bw, 0);
      gr.addColorStop(0, 'rgba(220,226,255,0)'); gr.addColorStop(0.5, `rgba(220,226,255,${0.07 + 0.03 * pulse})`); gr.addColorStop(1, 'rgba(220,226,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-bw * 0.15, 0); g.lineTo(bw * 0.15, 0); g.lineTo(bw, -D * 1.2); g.lineTo(-bw, -D * 1.2); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();
    // two great rings round the middle
    hudRing(g, c.x, c.y, m * 0.55, t * 0.02, 0.2, true);
    hudRing(g, c.x, c.y, m * 0.78, -t * 0.012, 0.1, false);
    circle(g, c.x, c.y, m * 0.42 * (1 + 0.02 * pulse)); glowStroke(g, 1, 0.18 + 0.12 * pulse, '140,140,255');
    // the dead eclipse, off to the side
    const ex = W * 0.74, ey = H * 0.27, er = m * 0.07;
    light(g, ex, ey, er * 3.4, 0.4 + 0.1 * pulse); light(g, ex, ey, er * 1.5, 0.75);
    g.save(); g.translate(ex, ey); g.rotate(t * 0.04); g.beginPath();
    for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, l = er * (1.2 + (i % 4 === 0 ? 0.8 : 0.35)); g.moveTo(Math.cos(a) * er * 1.08, Math.sin(a) * er * 1.08); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.6; g.stroke(); g.restore();
    circle(g, ex, ey, er); g.fillStyle = '#000'; g.fill(); glowStroke(g, 1.4, 0.95);
    hudRing(g, ex, ey, er * 2.1, t * 0.03, 0.4, false);
    // the drifting crystal, far ones first
    for (const d of DRIFT) {
      const s = m * d.size, span = W + s * 6, x = fr(d.x + t * d.sp * d.depth) * span - s * 3, y = H * d.y + Math.sin(t * 0.3 + d.ph) * s * 0.3;
      if (d.depth > 0.7) light(g, x, y, s * 1.4, 0.12);
      g.save(); g.translate(x, y); g.rotate(d.tilt);
      drawMesh(g, d.mesh, 0, 0, s, d.ph + t * d.spin, { alpha: Math.min(1, 0.3 + 0.7 * d.depth), light: [-0.5, -0.7, 0.3], base: [4, 4, 8], span: [90, 90, 115], back: 0.15, lw: 0.6 + d.depth * 0.8 });
      g.restore();
    }
    // meteors: a streak every couple of seconds, each on its own slot
    for (let k = 0; k < 2; k++) {
      const slot = Math.floor(t / 2.3 + k * 0.5), p = fr(t / 2.3 + k * 0.5), r = rnd(slot * 7 + k);
      if (r() < 0.45 || p > 0.35) continue;
      const q = p / 0.35, x0 = r() * W, y0 = r() * H * 0.5, ang = 0.5 + r() * 0.5, len = m * (0.25 + r() * 0.2), x = x0 + Math.cos(ang) * q * m, y = y0 + Math.sin(ang) * q * m;
      const gr = g.createLinearGradient(x, y, x - Math.cos(ang) * len, y - Math.sin(ang) * len);
      gr.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - q)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = gr; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len); g.stroke();
      light(g, x, y, 10, 0.7 * (1 - q));
    }
    // a crack of light tearing across the void every six seconds, drawn in fast, fading slow
    const tp = t / 6, ti = Math.floor(tp), tk = fr(tp) * 6;
    if (tk < 1.6) {
      const pts = TEARS[ti % TEARS.length], n = Math.max(2, Math.floor(pts.length * clamp(tk / 0.25))), a = 1 - clamp((tk - 0.3) / 1.3);
      g.beginPath(); for (let i = 0; i < n; i++) { const px = pts[i][0] * W, py = pts[i][1] * H; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.lineJoin = 'round'; glowStroke(g, 1.6, a);
    }
    // the edges of the void glow faintly
    for (const sd of [0, 1]) {
      const fg = g.createLinearGradient(sd ? W : 0, 0, sd ? W * 0.82 : W * 0.18, 0);
      fg.addColorStop(0, `rgba(235,238,255,${0.14 + 0.05 * pulse})`); fg.addColorStop(1, 'rgba(235,238,255,0)');
      g.fillStyle = fg; g.fillRect(0, 0, W, H);
    }
    // every twenty seconds the void inverts for a beat - white, the glass black
    const iv = fr(t / 20) * 20;
    if (iv < 0.9) {
      const a = (iv < 0.08 ? iv / 0.08 : 1 - E.inQuad((iv - 0.08) / 0.82)) * (G.flashMul ? G.flashMul() : 1);
      g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(0, 0, W, H); g.restore();
    }
  };
  N3.biomeFront = (g, W, H, t) => {
    const step = Math.floor(t * 8);
    if (fr(Math.sin(step * 12.9898) * 43758.5453) < 0.04) {
      const r = rnd(step + 1), cv = g.canvas, dpr = cv.width / W;
      for (let i = 0; i < 3; i++) { const y = r() * H, h = 4 + r() * 30; try { g.drawImage(cv, 0, y * dpr, cv.width, h * dpr, (r() - 0.5) * 60, y, W, h); } catch (e) {} }
    }
  };

  /* ================= the cutscene ================= */
  const DUR = 38;                                                       // as long as BREAKTHROUGH's: 33.9 -> 71.9 s of the song
  const REVEAL = barAt(10);                                             // 67.77 s in the song
  const FL = () => (G.flashMul ? G.flashMul() : 1);                     // 설정 - 번쩍임 줄이기
  // each line snaps in whole on its beat; a `stack` piles its words up one under another, each on its
  // own note (`times`), the way BREAKTHROUGH stands its last question on end
  const SAY = [
    { at: barAt(-8) + BEAT, until: barAt(-6) - 0.2, text: 'i  —  it started with few', pos: 0.87, size: 0.038 },
    { at: barAt(-6) + BEAT, until: barAt(-4) - 0.2, text: 'ii  —  only less it gets', pos: 0.13, size: 0.038 },
    { at: barAt(-4) + BEAT, until: barAt(-2) - 0.2, text: 'iii  —  time by time, now empty', pos: 0.87, size: 0.038 },
    { at: barAt(-2) - 0.3, until: BREAK - 0.05, text: 'iv', pos: 0.09, size: 0.034 },
    { at: RUN[0], stack: ['how', 'much', 'do', 'you', 'believe', 'in', 'this', 'world?'], times: RUN, until: BREAK - 0.05, pos: 0.5, size: 0.05 },
    { at: HIT1, until: DAN - 0.03, text: 'get out of my head', pos: 0.5, size: 0.05 },
    { at: beatAt(1), until: barAt(2) - 0.2, text: "it wasn't gone", pos: 0.5, size: 0.046 },
    { at: barAt(2) + BEAT, until: barAt(4) - 0.2, text: 'with only five fragments left', pos: 0.13, size: 0.04 },
    { at: barAt(6) + BEAT, until: barAt(8) - 0.2, text: 'piece by piece, it returns', pos: 0.87, size: 0.04 },
    { at: barAt(8) + BEAT, until: REVEAL - 0.3, text: 'and there was nothing left', pos: 0.1, size: 0.04 },
  ];
  function say(g, W, H, T) {
    if (!G.opt('captions')) return;
    const m = Math.min(W, H);
    for (const s of SAY) {
      if (T < s.at || T > s.until) continue;
      if (s.stack) {
        const fs = m * s.size, lh = fs * 1.35, y0 = H * s.pos - ((s.stack.length - 1) * lh) / 2;
        g.save(); g.font = `300 ${fs}px ${THIN}`; g.textAlign = 'left'; g.textBaseline = 'middle';
        if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.2}px`;
        g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff';
        g.globalAlpha = 1 - seg(T, s.until - 0.12, s.until);
        const x = W / 2 - m * 0.16;
        s.stack.forEach((w, i) => {
          const age = T - s.times[i]; if (age < 0) return;
          g.save(); g.translate(x - (1 - E.outCubic(clamp(age / 0.12))) * fs * 0.6, y0 + i * lh); g.fillText(w, 0, 0); g.restore();
        });
        g.restore();
        continue;
      }
      const text = s.text, age = T - s.at, fs = m * s.size, pop = 1 + 0.06 * (1 - E.outCubic(clamp(age / 0.15)));
      g.save(); g.font = `300 ${fs}px ${THIN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.2}px`;
      g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff';  // reads on black and on white
      const k = Math.min(1, (W * 0.88) / g.measureText(text).width);
      g.translate(W / 2, H * s.pos); g.scale(k * pop, k * pop);
      g.globalAlpha = 1 - seg(T, s.until - 0.12, s.until);
      g.fillText(text, fs * 0.1, 0);
      g.restore();
    }
  }

  /* ---- the scenes. lt = seconds into the scene, bn = its beat, bp = phase in the beat ---- */
  // WHITE: a white world, small black fragments hanging in it
  const FRAGS = Array.from({ length: 90 }, (_, i) => {
    const r = rnd(300 + i), n = 3 + Math.floor(r() * 3);
    const pts = Array.from({ length: n }, (_, j) => { const a = (j / n) * TAU + r() * 0.8, d = 0.5 + r() * 0.6; return [Math.cos(a) * d, Math.sin(a) * d]; });
    return { x: r(), y: r(), s: 0.003 + Math.pow(r(), 4) * 0.034, rot: r() * TAU, spin: (r() - 0.5) * 0.5, z: 0.4 + r() * 0.8, pts };
  });
  function white(g, W, H, lt) {
    const m = Math.min(W, H), c = { x: W / 2, y: H / 2 };
    g.fillStyle = '#f3f3f1'; g.fillRect(0, 0, W, H);
    const v = g.createRadialGradient(c.x, c.y, m * 0.2, c.x, c.y, Math.hypot(W, H) * 0.6);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.13)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    const push = lt * 0.03 + 0.012 * Math.floor(lt / BAR) + 0.012 * E.outCubic(clamp(fr(lt / BAR) * 3));   // a nudge on each downbeat
    g.fillStyle = '#050505';
    for (const f of FRAGS) {
      const ex = 1 + push * f.z, x = c.x + (f.x - 0.5) * W * 1.1 * ex, y = c.y + (f.y - 0.5) * H * 1.1 * ex + Math.sin(lt * 0.6 + f.rot) * m * 0.004, s = f.s * m * (1 + push * f.z * 2);
      // the caption's band across the middle is kept clear: fragments drifting into it fade away
      const clear = clamp((Math.hypot((x - c.x) / (W * 0.46), (y - c.y) / (m * 0.1)) - 1) / 0.6); if (clear <= 0) continue;
      g.save(); g.translate(x, y); g.rotate(f.rot + lt * f.spin); g.globalAlpha = clear;
      g.beginPath(); f.pts.forEach((p, i) => (i ? g.lineTo(p[0] * s, p[1] * s) : g.moveTo(p[0] * s, p[1] * s))); g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,.55)'; g.font = `400 ${Math.max(9, m * 0.018)}px ${MONO}`;
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('NULL // 0x00', m * 0.06, m * 0.06);
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('1 : 555,555,555,555', W - m * 0.06, H - m * 0.06);
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.5; brackets(g, W / 2, H / 2, W - m * 0.07, H - m * 0.07, m * 0.05); g.stroke();
  }
  // i: an eclipse - a black disc in its corona, ringed by measuring scales
  function eclipse(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.44 }, z = 1 + 0.12 * E.inOut(clamp(lt / (BAR * 2))), r = m * 0.2 * z;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, m / 30, c.x, c.y, 0.5);
    light(g, c.x, c.y, r * 3.2, 0.5 + 0.15 * beat); light(g, c.x, c.y, r * 1.6, 0.9);
    g.save(); g.translate(c.x, c.y); g.rotate(lt * 0.05); g.beginPath();
    for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU, l = r * (1.15 + (i % 6 === 0 ? 0.9 : i % 2 ? 0.25 : 0.45)); g.moveTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.7; g.stroke(); g.restore();
    circle(g, c.x, c.y, r); g.fillStyle = '#000'; g.fill(); glowStroke(g, 2, 1);
    hudRing(g, c.x, c.y, r * 2.3, lt * 0.06, 0.7, true);
    hudRing(g, c.x, c.y, r * 3.1, -lt * 0.035, 0.3, false);
    const k = clamp((fr(lt / BAR) * BAR) / (BAR * 0.9));               // a slow ring rolling out on each downbeat
    circle(g, c.x, c.y, r * 1.1 + E.outCubic(k) * Math.hypot(W, H) * 0.5); glowStroke(g, 1, 0.6 * (1 - k));
    const an = lt * 0.8, px = c.x + Math.cos(an) * r * 2.3, py = c.y + Math.sin(an) * r * 2.3;
    square(g, px, py, 8, TAU / 8); g.fillStyle = ACC; g.fill(); light(g, px, py, 16, 0.5);
  }
  // ii: an endless floor to a horizon, a monolith rising out of it in a beam of light
  function plain(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), hy = H * 0.58, rise = E.outCubic(clamp(lt / (BAR * 1.6)));
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + 0.5 * fr(i * 0.71)})`; g.fillRect(fr(i * 0.618) * W, fr(i * 0.37) * hy * 0.92, 1.2, 1.2); }
    const bw = m * 0.07 * rise, bg = g.createLinearGradient(0, 0, 0, hy);
    bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(1, 'rgba(255,255,255,.3)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = bg; g.fillRect(W / 2 - bw, 0, bw * 2, hy); g.restore();
    floor(g, W, H, hy, lt, 1, 0.35);
    const mw = m * 0.11, mh = m * 0.5 * rise, x = W / 2 - mw / 2, y = hy - mh;
    if (mh > 1) {
      g.save(); g.globalAlpha = 0.16; const rg = g.createLinearGradient(0, hy, 0, hy + mh * 0.6);
      rg.addColorStop(0, '#fff'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x, hy, mw, mh * 0.6); g.restore();
      g.fillStyle = '#000'; g.fillRect(x, y, mw, mh);
      g.beginPath(); g.rect(x, y, mw, mh); glowStroke(g, 1.2, 0.9);
      g.beginPath(); for (let i = 1; i < 6; i++) { const yy = hy - (mh * i) / 6; g.moveTo(x + 3, yy); g.lineTo(x + mw - 3, yy); }
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 0.6; g.stroke();
      dimension(g, x + mw + m * 0.06, hy, x + mw + m * 0.06, y, `${Math.round(rise * 555)}`, 0.75, clamp((rise - 0.2) / 0.3));
      light(g, W / 2, y, m * 0.14, 0.45 * rise + 0.2 * beat);
    }
  }
  // iii: a long corridor of frames, the light at its end
  function corridor(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.45 };
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    light(g, c.x, c.y, m * 0.55, 0.5 + 0.2 * beat); light(g, c.x, c.y, m * 0.14, 1);
    g.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.moveTo(c.x, c.y); g.lineTo(c.x + sx * W * 1.2, c.y + sy * H * 1.2); }
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 0.8; g.stroke();
    const ph = fr(lt * 0.45), tw = lt * 0.04;
    for (let j = 16; j >= 0; j--) {
      const zz = j + 1 - ph, sc = 1.1 / zz, w = W * sc, h = H * sc * 0.9, a = clamp(1.4 - zz * 0.09) * clamp(zz * 1.2);
      if (a <= 0) continue;
      g.save(); g.translate(c.x, c.y); g.rotate(tw + zz * 0.01);
      g.beginPath(); g.rect(-w / 2, -h / 2, w, h); glowStroke(g, 0.6 + 2.4 / zz, a * 0.9);
      g.beginPath(); g.rect(-w * 0.46, -h * 0.46, w * 0.92, h * 0.92); g.strokeStyle = `rgba(255,255,255,${a * 0.3})`; g.lineWidth = 0.5; g.stroke();
      brackets(g, 0, 0, w * 0.92, h * 0.92, Math.min(w, h) * 0.08); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = Math.max(1, 6 / zz); g.stroke();
      g.beginPath(); for (let i = 0; i <= 20; i++) { const x = -w * 0.46 + (w * 0.92 * i) / 20; g.moveTo(x, -h * 0.46); g.lineTo(x, -h * 0.46 + ((i % 5 ? 3 : 7) * 3) / zz); }
      g.strokeStyle = `rgba(255,255,255,${a * 0.5})`; g.lineWidth = 0.6; g.stroke();
      g.restore();
    }
  }
  // iv: stripes slide across on the bar and the half bar, the word inverting against them
  function nul(g, W, H, lt) {
    const half = Math.floor(lt / (BAR / 2)), hp = fr(lt / (BAR / 2)) * (BAR / 2), nb = 7, bh = H / nb, col = n => (n % 2 ? '#000' : '#fff');
    g.fillStyle = col(half + 1); g.fillRect(0, 0, W, H);
    g.fillStyle = col(half);
    for (let i = 0; i < nb; i++) { const d = E.outCubic(clamp((hp - i * 0.03) / 0.42)), dir = i % 2 ? 1 : -1; g.fillRect(dir * (1 - d) * W, i * bh - 0.5, W, bh + 1); }
    const m = Math.min(W, H), fs = Math.min(W * 0.19, H * 0.2);
    g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    g.beginPath(); for (let i = 1; i < nb; i++) { g.moveTo(0, i * bh); g.lineTo(W, i * bh); } g.lineWidth = 0.5; g.stroke();
    g.font = `400 ${Math.max(9, m * 0.016)}px ${MONO}`; g.textBaseline = 'middle';
    for (let i = 0; i < nb; i++) { g.textAlign = 'left'; g.fillText(`0${i}`, m * 0.04, i * bh + bh / 2); g.textAlign = 'right'; g.fillText('VOID', W - m * 0.04, i * bh + bh / 2); }
    g.fillRect(W / 2 - m * 0.2, 0, 1, H * E.outCubic(clamp(lt / 0.6)));   // the rule the question stands against
    g.restore();
  }
  // FIVE: the five fragments (above) stand in the light from a crack in the ground, one landing on each beat,
  // turning slowly, lit from the crack beneath
  function five(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), U = m * 0.36, gy = H * 0.72;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, m / 30, W / 2, gy, 0.5);
    // the light pouring up out of the crack
    const lg = g.createLinearGradient(0, gy, 0, 0); lg.addColorStop(0, 'rgba(255,255,255,.4)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(W / 2 - U * 0.5, 0, U, gy); g.restore();
    light(g, W / 2, gy, U * 1.6, 0.55 + 0.2 * beat);
    for (const idx of [3, 4, 1, 2, 0]) {                                // outer ones first, the great one in front
      const f = FIVE[idx], on = E.outBack(clamp((lt - idx * BEAT) / 0.3)); if (on <= 0) continue;
      const x = W / 2 + f.x * U, y = gy - U * 0.2 + Math.sin(lt * 0.8 + f.ph) * U * 0.02 - (1 - on) * U * 0.35;
      light(g, x, y - U * 0.3, U * 0.45, 0.25 * on);
      drawMesh(g, f.M, x, y, U, f.ph + lt * f.spin, { alpha: Math.min(1, on), light: [0.2, 0.8, 0.55], base: [5, 5, 9], span: [165, 165, 190], back: 0.2, lw: 1.2 });
    }
    // the crack itself
    const r = rnd(4242); g.beginPath(); let x = W / 2 - U * 1.6; g.moveTo(x, gy);
    while (x < W / 2 + U * 1.6) { x += U * (0.05 + r() * 0.08); g.lineTo(x, gy + (r() - 0.5) * U * 0.03); }
    glowStroke(g, 1.6, 1);
    // glass shards rising
    for (let i = 0; i < 22; i++) {
      const life = fr(i * 0.618 + lt * (0.12 + (i % 4) * 0.03)), sx = W / 2 + (fr(i * 0.37) - 0.5) * U * 3.4, sy = gy - life * U * 2.2, s = U * (0.015 + (i % 3) * 0.01);
      g.save(); g.translate(sx, sy); g.rotate(lt * (0.6 + (i % 3)) + i); g.globalAlpha = Math.sin(life * Math.PI) * 0.9;
      g.beginPath(); g.moveTo(0, -s * 1.4); g.lineTo(s * 0.8, s * 0.6); g.lineTo(-s * 0.7, s * 0.9); g.closePath(); g.strokeStyle = '#fff'; g.lineWidth = 0.8; g.stroke();
      g.restore();
    }
  }
  // ODDS: 1 in 555,555,555,555, counted up inside three orbits
  function odds(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.45 };
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, m / 30, c.x, c.y, 0.45);
    for (let j = 0; j < 3; j++) {
      const rx = W * 0.46, ry = m * 0.1 * (1 + j * 0.5), an = lt * (1.2 + j * 0.4);
      g.save(); g.translate(c.x, c.y); g.rotate((j * TAU) / 3 + lt * 0.2);
      g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 0.8; g.stroke();
      g.setLineDash([1.5, 6]); g.beginPath(); g.ellipse(0, 0, rx * 1.03, ry * 1.12, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke(); g.setLineDash([]);
      g.fillStyle = j ? '#fff' : ACC; g.fillRect(Math.cos(an) * rx - 3, Math.sin(an) * ry - 3, 6, 6);
      g.restore();
    }
    const k = E.inOut(clamp(lt / (BAR * 1.5))), done = k >= 1, full = '555,555,555,555', str = Math.floor(555555555555 * k).toLocaleString('en-US');
    const fs = Math.min(W / 10.5, H * 0.09);
    if (done) light(g, c.x, c.y, W * 0.5, 0.35 * beat);
    g.save(); g.font = `200 ${fs}px ${THIN}`; g.textBaseline = 'middle'; g.textAlign = 'center';
    const cw = g.measureText('0').width * 1.08, wOf = ch => (ch === ',' ? cw * 0.45 : cw);
    const fullW = [...full].reduce((s, ch) => s + wOf(ch), 0), x0 = c.x - fullW / 2;
    g.fillStyle = '#fff';
    let x = x0 + fullW;
    [...str].reverse().forEach((ch, j) => {                             // right-aligned, the low digits still spinning
      const w = wOf(ch), jit = !done && ch !== ',' && j < 5 ? (fr(Math.sin(lt * 60 + j) * 999) - 0.5) * fs * 0.12 : 0;
      x -= w; g.fillText(ch, x + w / 2, c.y + jit);
    });
    g.fillRect(x0, c.y + fs * 0.75, fullW * k, 1.5);
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; brackets(g, c.x, c.y, fullW + fs * 0.8, fs * 2.4, fs * 0.3); g.stroke();
    g.font = `400 ${fs * 0.3}px ${MONO}`; if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.12}px`;
    g.fillStyle = ACC; g.fillText('1  IN', c.x, c.y - fs * 1.0);
    g.restore();
  }
  // FORM: the true form drawn like a blueprint as it turns - guides, then every edge (the hidden ones
  // dashed), the vertices named, the dimensions - and at last the obsidian filling it in
  function form(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.43 }, s = m * 0.24, k = clamp(lt / (BAR * 2)), turn = 0.35 + lt * 0.2;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, m / 30, c.x, c.y, 1);
    const gk = E.outCubic(clamp(k / 0.25));
    g.save(); g.setLineDash([4, 4]); g.strokeStyle = 'rgba(140,140,255,.75)'; g.lineWidth = 0.8;
    g.beginPath(); g.arc(c.x, c.y, s * 1.4, -Math.PI / 2, -Math.PI / 2 + TAU * gk); g.stroke();
    g.beginPath(); g.moveTo(c.x - W * 0.45 * gk, c.y - s * 0.08); g.lineTo(c.x + W * 0.45 * gk, c.y - s * 0.08);
    g.moveTo(c.x, c.y - s * 1.45 * gk); g.lineTo(c.x, c.y + s * 1.35 * gk); g.stroke();
    g.restore();
    const fillK = E.inOut(clamp((k - 0.72) / 0.25));
    light(g, c.x, c.y, s * 1.8, 0.1 + 0.45 * fillK + 0.12 * beat);
    const P = drawMesh(g, BIPY, c.x, c.y, s, turn, { fill: fillK, edges: E.inOut(clamp((k - 0.1) / 0.5)), back: 0.5, lw: 1, base: [8, 8, 14], span: [140, 140, 175], inner: P => fillK > 0 && core(g, P, s, fillK) });
    const vk = clamp((k - 0.45) / 0.2);
    if (vk > 0) {
      g.save(); g.globalAlpha = vk; g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 1; g.font = `400 9px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'bottom';
      P.forEach((p, i) => { g.strokeRect(p.x - 3, p.y - 3, 6, 6); g.fillText(i === 0 ? 'APEX' : i === 1 ? 'BASE' : 'G' + (i - 1), p.x + 6, p.y - 4); });
      g.restore();
    }
    const dk = clamp((k - 0.5) / 0.3);
    dimension(g, c.x - 0.62 * s, c.y + s * 1.3, c.x + 0.62 * s, c.y + s * 1.3, '1.24', 0.8, dk);
    dimension(g, c.x + s * 1.15, c.y - 1.2 * s, c.x + s * 1.15, c.y + 1.05 * s, '2.25', 0.8, dk);
  }
  // the violet core seen through the glass, from point to point
  function core(g, P, s, a = 1) {
    const t = P[0], b = P[1];
    g.save(); g.globalCompositeOperation = 'lighter';
    const cg = g.createLinearGradient(t.x, t.y, b.x, b.y);
    cg.addColorStop(0, 'rgba(140,140,255,0)'); cg.addColorStop(0.45, `rgba(165,165,255,${0.6 * a})`); cg.addColorStop(1, 'rgba(140,140,255,0)');
    g.fillStyle = cg; g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(b.x + s * 0.035, b.y); g.lineTo(b.x - s * 0.035, b.y); g.closePath(); g.fill();
    glowAt(g, (t.x + b.x) / 2, t.y + (b.y - t.y) * 0.45, s * 0.35, 0.3 * a);
    g.restore();
  }
  // the true form: the obsidian bipyramid, edges burning white, the violet core, small shards orbiting
  function voidGem(g, x, y, s, turn, t) {
    const tilt = 0.22;
    const orbit = back => {                                             // shards on a tilted ring, behind or in front
      for (let i = 0; i < 7; i++) {
        const a = t * 0.5 + (i / 7) * TAU, Z = Math.cos(a); if ((Z < 0) !== back) continue;
        const px = x + Math.sin(a) * 1.25 * s, py = y + (0.15 + Math.sin(a * 2 + i) * 0.08 + Z * 1.25 * tilt) * s, ss = s * (0.05 + (i % 3) * 0.02) * (1 + Z * 0.2);
        g.save(); g.translate(px, py); g.rotate(t * (0.8 + i * 0.1) + i);
        g.beginPath(); g.moveTo(0, -ss * 1.5); g.lineTo(ss * 0.7, ss * 0.5); g.lineTo(-ss * 0.6, ss * 0.8); g.closePath();
        g.fillStyle = '#050508'; g.fill(); g.strokeStyle = `rgba(255,255,255,${back ? 0.35 : 0.9})`; g.lineWidth = 1; g.stroke();
        g.restore();
      }
    };
    orbit(true);
    light(g, x, y, s * 0.9, 0.35);
    const P = drawMesh(g, BIPY, x, y, s, turn, { tilt, base: [8, 8, 14], span: [140, 140, 175], inner: P => core(g, P, s) });
    light(g, P[0].x, P[0].y, s * 0.25, 0.8); light(g, P[1].x, P[1].y, s * 0.15, 0.5);
    orbit(false);
  }
  // RISE: the true form lights up and the light swells until the screen is white
  function rise(g, W, H, lt, bn, bp, beat) {
    const m = Math.min(W, H), c = { x: W / 2, y: H * 0.47 }, k = clamp(lt / (BAR * 2)), s = m * 0.2 * (1 + 0.15 * E.inCubic(k));
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    fineGrid(g, W, H, m / 30, c.x, c.y, 0.6);
    g.save(); g.translate(c.x, c.y); g.rotate(lt * 0.1); g.beginPath();
    for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU, l = Math.hypot(W, H) * (i % 2 ? 0.5 : 0.8); g.moveTo(Math.cos(a) * s * 1.6, Math.sin(a) * s * 1.6); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); }
    g.restore(); glowStroke(g, 0.6, 0.15 + 0.4 * k);
    hudRing(g, c.x, c.y, s * 1.9 * (1 + k * 0.25), lt * 0.1, 0.65, true);
    light(g, c.x, c.y, m * (0.45 + k * 1.3), 0.3 + 0.6 * k);
    voidGem(g, c.x, c.y, s, lt * 0.8 * (1 + k * 2), lt);
    const wk = clamp((lt - BAR * 1.4) / (BAR * 0.6));                   // the last beats go white
    g.fillStyle = `rgba(255,255,255,${E.inCubic(wk) * 0.95})`; g.fillRect(0, 0, W, H);
  }
  // when each scene starts (bar of the drop; before it, i - iv)
  const SCENES = [[-8, eclipse], [-6, plain], [-4, corridor], [-2, nul], [0, white], [2, five], [4, odds], [6, form], [8, rise]];
  // after the reveal: the true form turns above the floor, inside its scales
  function after(g, W, H, T, bn, bp, beat) {
    const m = Math.min(W, H), lt = T - REVEAL, c = { x: W / 2, y: H * 0.31 };
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    floor(g, W, H, H * 0.5, lt, 0.5, 0.15);
    hudRing(g, c.x, c.y, m * 0.32, lt * 0.04, 0.6, true);
    hudRing(g, c.x, c.y, m * 0.44, -lt * 0.03, 0.2, false);
    light(g, c.x, c.y, m * 0.5, 0.25 + 0.15 * beat);
    voidGem(g, c.x, c.y, m * 0.16, lt * 0.6, lt);
  }

  G.cutscenes.register({
    id: 'nullscapes', name: 'NULLSCAPES', odds: 555555555555, tier: 'null', biome: 'null', zone: -1,
    music: 'audio/flow.mp3', musicAt: DA, pre: 2000, fullscreen: true,
    duration: DUR * 1000, revealAt: REVEAL / DUR, colors: ['#ffffff', '#8c8cff', '#000000'],
    captions: [],                                                       // drawn by say(), on the beat
    draw(g, e) {
      const { W, H, time } = e, T = time / 1000;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      // ---- the blackout: a hairline draws itself across the dark, then goes ----
      if (T < 0) {
        const k = E.inOut(1 + T / 2), w = W * 0.8 * k, a = 1 - seg(T, -0.5, -0.05);
        g.fillStyle = `rgba(255,255,255,${0.85 * a})`; g.fillRect(W / 2 - w / 2, H / 2 - 0.5, w, 1);
        light(g, W / 2 - w / 2, H / 2, 8, 0.6 * k * a); light(g, W / 2 + w / 2, H / 2, 8, 0.6 * k * a);
        return;
      }
      // ---- the break and the two piano notes: nothing but the words ----
      if (T >= BREAK && T < DAN) { say(g, W, H, T); return; }
      const lt0 = T - DAN, bn0 = Math.floor(lt0 / BEAT), bp = fr(lt0 / BEAT), beat = Math.exp(-bp * 5);
      if (T < REVEAL) {
        if (lt0 >= SCENES[0][0] * BAR) {
          let i = SCENES.length - 1; while (i > 0 && lt0 < SCENES[i][0] * BAR) i--;
          const [b0, scene] = SCENES[i];
          scene(g, W, H, lt0 - b0 * BAR, bn0 - b0 * 4, bp, beat);
          const fin = seg(T, barAt(-8), barAt(-8) + 1.2);                 // the first scene fades up out of the dark
          if (fin < 1) { g.fillStyle = `rgba(0,0,0,${1 - fin})`; g.fillRect(0, 0, W, H); }
        }
      } else {
        after(g, W, H, T, bn0, bp, beat);
        const k = T - REVEAL; if (k < 0.8) { g.fillStyle = `rgba(255,255,255,${1 - k / 0.8})`; g.fillRect(0, 0, W, H); }   // out of RISE's white
      }
      // ---- a hard diagonal wipe through each scene change ----
      for (const [b] of SCENES) if (b !== -8 && b !== 0 && b < 8) { const k = (T - barAt(b) + 0.22) / 0.44; if (k > 0 && k < 1) wipe(g, W, H, k, b % 4 ? -1 : 1); }
      // ---- the drop: one flash as the black gives way to white ----
      const dk = T - DAN; if (dk >= 0 && dk < 0.3) { g.fillStyle = `rgba(255,255,255,${(1 - dk / 0.3) * FL()})`; g.fillRect(0, 0, W, H); }
      const end = seg(T, DUR - 2.5, DUR);
      if (end > 0) { g.fillStyle = `rgba(0,0,0,${end})`; g.fillRect(0, 0, W, H); }
      say(g, W, H, T);
    },
  });
})();
