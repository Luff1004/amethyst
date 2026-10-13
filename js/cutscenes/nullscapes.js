/*
  NULLSCAPES - the NULL biome's own mineral (js/biome.js), 1 in 555,500,000,000. Nowhere else.
  Modelled on Sol's RNG's BREAKTHROUGH and Geometry Dash's Nullscapes (Kiba; song "Flow" by Creo).
  All 2D, all light: everything that glows is drawn with soft bloom sprites, flares and additive light,
  not strokes.
  The score is Flow from its biggest drop: silence at 93.44 s, "da" at 93.55, "DAN" at 93.78, then the
  heaviest stretch of the song until ~126.4 s. 128 BPM. Everything below is timed to that grid:
    blackout (2 s): motes of light pull into a star, its flare growing
    "da"  (T 0)    : the star flashes and white cracks of light burst across the screen
    "DAN" (T 0.23) : the screen shatters outward into light
    bars 1-8       : the crown of shattered black monoliths stands in the light; a pillar of light through
                     the split in the great one, pulsing on every beat, a shockwave on every bar
    bars 9-12      : the split tears wider, the monoliths drift apart, a storm of white motes
    bars 13-16     : the cracks come back across the screen, everything climbs
    T 30.23        : the flash - NULLSCAPES - and the light settles as the song calms
  Captions land on downbeats, top and lower third in turn, never across the middle of the picture.
  G.n3 also carries the NULL theme (js/game.js ambient 'null') and the NULL biome's look (js/biome.js).
*/
(() => {
  const { E, seg, clamp } = G;
  const TAU = Math.PI * 2, fr = v => v - Math.floor(v);
  const BEAT = 60 / 128, BAR = BEAT * 4, DA = 46.15, DAN = 2.49;      // play from 46.15 s; DAN = the drop (48.64 s)
  const HIT1 = 0.05, HIT2 = 0.5;                                      // "da" (46.20 s) and "dan" (46.65 s)
  const barAt = n => DAN + n * BAR;                                     // the downbeat of bar n of the drop
  const WIDE = 'Syncopate, "Arial Black", sans-serif';
  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const DPRx = () => Math.min(2, window.devicePixelRatio || 1);
  const N3 = G.n3 = {};

  /* ---------------- light: one soft bloom sprite, reused everywhere ---------------- */
  let bloomSpr = null;
  const bloom = () => {
    if (bloomSpr) return bloomSpr;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,.75)'); gr.addColorStop(0.35, 'rgba(225,230,255,.22)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return (bloomSpr = c);
  };
  // a beam of light, pointing up: brightest at the bottom (the source), fading along its length, and
  // feathered softly across its width so it has no edge
  let raySpr = null;
  const raySprite = () => {
    if (raySpr) return raySpr;
    const c = document.createElement('canvas'); c.width = 64; c.height = 512;
    const x = c.getContext('2d'), along = x.createLinearGradient(0, 512, 0, 0);
    along.addColorStop(0, 'rgba(255,255,255,.55)'); along.addColorStop(0.35, 'rgba(240,242,255,.22)'); along.addColorStop(1, 'rgba(230,234,255,0)');
    x.fillStyle = along; x.fillRect(0, 0, 64, 512);
    x.globalCompositeOperation = 'destination-in';
    const across = x.createLinearGradient(0, 0, 64, 0);
    [[0, 0], [0.2, 0.25], [0.4, 0.85], [0.5, 1], [0.6, 0.85], [0.8, 0.25], [1, 0]].forEach(([p, v]) => across.addColorStop(p, `rgba(0,0,0,${v})`));
    x.fillStyle = across; x.fillRect(0, 0, 64, 512);
    return (raySpr = c);
  };
  const glowAt = (g, x, y, r, a) => { if (a <= 0 || r <= 0) return; g.globalAlpha = Math.min(1, a); g.drawImage(bloom(), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
  // a lens flare: core bloom, an anamorphic streak, a few ghosts along the axis through the centre
  function flare(g, W, H, x, y, s, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    glowAt(g, x, y, s * 3, a); glowAt(g, x, y, s * 1.2, a);
    const st = g.createLinearGradient(x - W, 0, x + W, 0);
    st.addColorStop(0, 'rgba(180,190,255,0)'); st.addColorStop(0.5, `rgba(235,240,255,${0.8 * a})`); st.addColorStop(1, 'rgba(180,190,255,0)');
    g.fillStyle = st; g.fillRect(x - W, y - s * 0.06, W * 2, s * 0.12);
    g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x - s * 0.04, y - s * 1.6, s * 0.08, s * 3.2);
    const cx = W / 2, cy = H / 2;
    [[-0.4, 0.5, 0.25], [-0.8, 0.25, 0.18], [0.5, 0.35, 0.14], [1.3, 0.6, 0.1]].forEach(([k, r, al]) => glowAt(g, cx + (cx - x) * k, cy + (cy - y) * k, s * r, a * al));
    g.restore();
  }

  /* ---------------- cracks of light ---------------- */
  const CRACK = (() => {
    const r = rnd(1442), rays = 14, ang = Array.from({ length: rays }, (_, i) => (i + r() * 0.7) / rays * TAU);
    const lines = ang.map(a => { const l = [[0, 0]]; let x = 0, y = 0, aa = a; for (let s = 1; s <= 12; s++) { aa += (r() - 0.5) * 0.35; const st = 0.06 + r() * 0.07; x += Math.cos(aa) * st; y += Math.sin(aa) * st; l.push([x, y]); } return l; });
    const br = []; lines.forEach(l => { for (let b = 0; b < 2; b++) { const i = 3 + Math.floor(r() * 7), [x0, y0] = l[i], a = Math.atan2(y0, x0) + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6); const s = [[x0, y0]]; let x = x0, y = y0; for (let k = 0; k < 4; k++) { x += Math.cos(a) * 0.05; y += Math.sin(a) * 0.05; s.push([x, y]); } br.push(s); } });
    const shards = [], rings = [0, 0.16, 0.36, 0.66, 1.3];
    for (let ri = 0; ri < rings.length - 1; ri++) for (let ai = 0; ai < rays; ai++) {
      const a0 = ang[ai], a1 = ang[(ai + 1) % rays] + (ai === rays - 1 ? TAU : 0), poly = [[a0, rings[ri]], [a1, rings[ri]], [a1, rings[ri + 1]], [a0, rings[ri + 1]]].map(([a, rr]) => [Math.cos(a) * rr, Math.sin(a) * rr]);
      const cx = poly.reduce((s, p) => s + p[0], 0) / 4, cy = poly.reduce((s, p) => s + p[1], 0) / 4;
      shards.push({ poly, cx, cy, spin: (r() - 0.5) * 2.5, push: 0.7 + r() * 0.8 });
    }
    return { lines, br, shards };
  })();
  // glowing cracks: a wide soft glow, then a hot white core - light coming through, not a line
  function cracks(g, W, H, k, a, cx = W / 2, cy = H / 2) {
    if (a <= 0) return;
    const s = Math.hypot(W, H) * 0.62, draw = (l, n) => { g.beginPath(); for (let i = 0; i < n; i++) i ? g.lineTo(cx + l[i][0] * s, cy + l[i][1] * s) : g.moveTo(cx + l[i][0] * s, cy + l[i][1] * s); g.stroke(); };
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, col] of [[16, `rgba(170,180,255,${0.12 * a})`], [7, `rgba(220,226,255,${0.35 * a})`], [2.2, `rgba(255,255,255,${a})`]]) {
      g.lineWidth = lw; g.strokeStyle = col;
      for (const l of CRACK.lines) draw(l, Math.max(1, Math.floor(l.length * k)));
      if (k > 0.5) for (const b of CRACK.br) draw(b, Math.max(1, Math.floor(b.length * (k - 0.5) * 2)));
    }
    glowAt(g, cx, cy, Math.min(W, H) * 0.35, a * 0.8);
    g.restore();
  }

  /* ---------------- the monoliths (painted once per size) ---------------- */
  function paintMonolith(x, cx, base, w, h, seed, front) {
    const r = rnd(seed), nseg = 3 + Math.floor(r() * 3), segH = h / nseg;
    let y = base;
    for (let s = 0; s < nseg; s++) {
      const sh = segH * (0.8 + r() * 0.4), dx = (r() - 0.5) * w * 0.14 + (s >= nseg - 2 ? (r() - 0.5) * w * 0.25 : 0), rot = (r() - 0.5) * (s >= nseg - 2 ? 0.12 : 0.03);
      const bx = cx + dx, top = y - sh;
      x.save(); x.translate(bx, y - sh / 2); x.rotate(rot);
      const bg = x.createLinearGradient(-w / 2, 0, w / 2, 0);
      bg.addColorStop(0, front ? '#2a2a34' : '#1a1a22'); bg.addColorStop(0.12, front ? '#0c0c12' : '#08080c'); bg.addColorStop(0.85, '#040406'); bg.addColorStop(1, front ? '#1e1e28' : '#121218');
      // the lowest block doesn't stop flat: the same stone runs on down and breaks off in ragged points
      x.beginPath(); x.moveTo(-w / 2, -sh / 2); x.lineTo(w / 2, -sh / 2);
      if (s === 0) {
        const fr2 = rnd(seed * 3 + 1), n = 5 + Math.floor(fr2() * 3);
        x.lineTo(w / 2, sh / 2);
        for (let i = n - 1; i >= 1; i--) {
          const k = i / n, pt = i % 2 ? h * (0.08 + fr2() * 0.2) * (1 - Math.abs(k - 0.5)) : h * (0.01 + fr2() * 0.04);
          x.lineTo(-w / 2 + w * k + (fr2() - 0.5) * w * 0.08, sh / 2 + pt);
        }
        x.lineTo(-w / 2, sh / 2);
      } else { x.lineTo(w / 2, sh / 2); x.lineTo(-w / 2, sh / 2); }
      x.closePath(); x.fillStyle = bg; x.fill();
      x.save(); x.clip();
      const rim = x.createLinearGradient(-w / 2, 0, -w / 2 + w * 0.12, 0); rim.addColorStop(0, `rgba(235,238,255,${front ? 0.55 : 0.32})`); rim.addColorStop(1, 'rgba(235,238,255,0)');
      x.fillStyle = rim; x.fillRect(-w / 2, -sh / 2, w * 0.12, sh + h * 0.4);
      x.restore();
      x.fillStyle = '#000';
      for (let c = 0; c < 2; c++) { const cxp = (r() < 0.5 ? -1 : 1) * w / 2, cyp = (r() - 0.5) * sh, cs = w * (0.08 + r() * 0.14); x.beginPath(); x.moveTo(cxp, cyp - cs); x.lineTo(cxp - Math.sign(cxp) * cs, cyp); x.lineTo(cxp, cyp + cs * 0.7); x.fill(); }
      x.save(); x.shadowColor = '#fff'; x.shadowBlur = 10;
      for (let gl = 0, n = r() < 0.65 ? 1 + Math.floor(r() * 3) : 0; gl < n; gl++) { x.fillStyle = `rgba(255,255,255,${0.75 + r() * 0.25})`; x.fillRect((r() - 0.5) * w * 0.7, (r() - 0.5) * sh * 0.6, Math.max(1.5, w * 0.04), sh * (0.12 + r() * 0.3)); }
      x.restore(); x.restore();
      y = top;
      if (s < nseg - 1) { x.save(); x.shadowColor = '#fff'; x.shadowBlur = 16; x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(bx - w * 0.46, y - 2.5, w * 0.92, 2.2); x.restore(); y -= 5; }
    }
    x.fillStyle = front ? '#0c0c12' : '#08080c';
    for (let c = 0, n = 4 + Math.floor(r() * 4); c < n; c++) {
      const tx = cx + (r() - 0.5) * w * 0.9, tw = w * (0.08 + r() * 0.18), th = h * (0.05 + r() * 0.16) * (r() < 0.3 ? 1.8 : 1), lean = (r() - 0.5) * tw * 2;
      x.beginPath(); x.moveTo(tx - tw / 2, y + 2); x.lineTo(tx + lean, y - th); x.lineTo(tx + tw / 2, y + 2); x.closePath(); x.fill();
    }
  }
  const auraCache = {};
  function auraLayers(slot, W, H, c, R) {
    const DPR = Math.min(3, DPRx() * (slot === 'cut' ? 1.6 : 1)), key = [W, H, Math.round(c.x), Math.round(c.y), Math.round(R), DPR].join(',');   // the cutscene zooms in: paint it sharper
    if (auraCache[slot] && auraCache[slot].key === key) return auraCache[slot];
    const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); const x = cv.getContext('2d'); x.scale(DPR, DPR); return [cv, x]; };
    const [back, bx] = mk(), [front, fx] = mk();
    const base = c.y + R * 1.55, U = Math.min(R, W * 0.16);
    [[-2.9, 2.1], [-2.25, 3.0], [-1.6, 3.8], [1.6, 3.7], [2.3, 2.9], [2.95, 2.2], [-3.5, 1.5], [3.5, 1.6]].forEach(([dx, hh], i) => paintMonolith(bx, c.x + dx * U, base - U * 0.4, U * 0.55, U * hh, 101 + i, false));
    const halves = [-1, 1].map(sd => { const [cv, x] = mk(); paintMonolith(x, c.x + sd * U * 0.62, base, U * 0.8, U * 4.6, 300 + sd, true); return cv; });
    [[-2.6, 1.6], [-1.75, 1.15], [1.8, 1.25], [2.65, 1.7]].forEach(([dx, hh], i) => paintMonolith(fx, c.x + dx * U, base + U * 0.9, U * 0.85, U * hh, 501 + i, true));
    // the ground they stand in: a dark floor, and rubble heaped along the foot of the crown
    const gy = base + U * 0.75, fl = fx.createLinearGradient(0, gy, 0, H);
    fl.addColorStop(0, 'rgba(6,6,9,0)'); fl.addColorStop(0.12, '#07070a'); fl.addColorStop(1, '#010102');
    fx.fillStyle = fl; fx.fillRect(0, gy, W, H - gy);
    const rr = rnd(777);
    for (let row = 0; row < 6; row++) for (let i = 0; i < 40; i++) {
      const ry = (row / 5) * (row / 5), x = rr() * W, y = gy + ry * (H - gy) * 1.05 + (rr() - 0.3) * U * 0.25, s = U * (0.08 + rr() * 0.22) * (1 + row * 0.45);   // rows spread toward the viewer, bigger as they come
      fx.save(); fx.translate(x, y); fx.rotate(rr() * TAU);
      fx.fillStyle = row > 2 ? "#020203" : row ? "#050507" : "#0a0a0e";
      fx.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + rr() * 0.5, d = s * (0.6 + rr() * 0.5); k ? fx.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.6) : fx.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.6); } fx.closePath(); fx.fill();
      fx.strokeStyle = `rgba(235,238,255,${Math.max(0.06, 0.25 - row * 0.04)})`; fx.lineWidth = 1; fx.beginPath(); fx.moveTo(-s * 0.5, -s * 0.3); fx.lineTo(s * 0.3, -s * 0.4); fx.stroke();
      fx.restore();
    }
    return (auraCache[slot] = { key, back, front, halves, U, base });
  }
  // the crown in light: glow, rays, back row, the split's pillar, the two halves (spread by `open`), front row
  function crown(g, W, H, c, R, t, beat, open, slot) {
    const L = auraLayers(slot, W, H, c, R), U = L.U, bob = Math.sin(t * 0.6) * U * 0.03;
    const gl = g.createRadialGradient(c.x, c.y - U * 0.4, 0, c.x, c.y - U * 0.4, Math.hypot(W, H) * 0.62);
    gl.addColorStop(0, 'rgba(250,250,255,.9)'); gl.addColorStop(0.16, `rgba(200,204,238,${0.55 + 0.15 * beat})`); gl.addColorStop(0.45, 'rgba(40,42,66,.45)'); gl.addColorStop(1, 'rgba(0,0,0,.65)');
    g.fillStyle = gl; g.fillRect(-W, -H, W * 3, H * 3);   // oversized: the cutscene frames this zoomed and tilted
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(c.x, L.base - U * 2);
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + (i - 5) * 0.19 + Math.sin(t * 0.2 + i) * 0.03, len = Math.hypot(W, H), wd = (0.07 + 0.04 * Math.sin(t * 0.7 + i)) * len;
      // a soft beam: the ray sprite (bright at the source, feathered at both edges), rotated into place
      g.save(); g.rotate(a + Math.PI / 2); g.globalAlpha = 0.5 + 0.4 * beat;
      g.drawImage(raySprite(), -wd / 2, -len, wd, len); g.restore();
    }
    g.restore();
    g.drawImage(L.back, 0, bob, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gw = U * (0.42 + 0.35 * open + 0.08 * beat), top = L.base - U * 4.9, sg = g.createLinearGradient(c.x - gw, 0, c.x + gw, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(255,255,255,${0.8 + 0.2 * beat})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.fillRect(c.x - gw, top + bob, gw * 2, L.base - top + U);
    glowAt(g, c.x, top + bob + U * 0.3, U * (1.2 + beat), 0.7);
    g.restore();
    L.halves.forEach((h, i) => g.drawImage(h, (i ? 1 : -1) * open * U * 0.9, bob * 0.8, W, H));
    g.drawImage(L.front, 0, -bob * 0.6, W, H);
    // mist lying along the foot of the crown, and the pillar's light pooled on the ground
    const gy = L.base + U * 0.75, mist = g.createLinearGradient(0, gy - U * 1.2, 0, gy + U * 0.8);
    mist.addColorStop(0, 'rgba(225,228,255,0)'); mist.addColorStop(0.55, `rgba(225,228,255,${0.2 + 0.06 * beat})`); mist.addColorStop(1, 'rgba(225,228,255,0)');
    g.fillStyle = mist; g.fillRect(-W, gy - U * 1.2, W * 3, U * 2);
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(c.x, gy + U * 0.15); g.scale(3.2, 0.45);
    glowAt(g, 0, 0, U * (1.1 + 0.6 * open + 0.2 * beat), 0.55); g.restore();
    // the pillar mirrored in the glossy floor: a long soft streak of light running down toward you
    g.save(); g.globalCompositeOperation = 'lighter';
    const rf = g.createLinearGradient(0, gy, 0, H), rw = U * (0.35 + 0.3 * open);
    rf.addColorStop(0, `rgba(235,238,255,${0.35 + 0.15 * beat})`); rf.addColorStop(1, 'rgba(235,238,255,0)');
    g.fillStyle = rf; g.beginPath(); g.moveTo(c.x - rw, gy); g.lineTo(c.x + rw, gy); g.lineTo(c.x + rw * 2.2, H); g.lineTo(c.x - rw * 2.2, H); g.closePath(); g.fill();
    g.restore();
    return L;
  }

  /* ---------------- motes and shards ---------------- */
  const MOTES = Array.from({ length: 140 }, (_, i) => { const r = rnd(70 + i); return [r(), r(), r(), r()]; });
  const SHARDS = Array.from({ length: 34 }, (_, i) => { const r = rnd(900 + i); return { a: r() * TAU, rx: 1.4 + r() * 2.4, ry: 0.5 + r() * 1.6, sp: 0.06 + r() * 0.16, s: 0.06 + r() * 0.14, spin: (r() - 0.5) * 2, ph: r() }; });
  function motes(g, base, c, U, t, H, amount, speed) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const n = Math.round(MOTES.length * amount);
    for (let i = 0; i < n; i++) {
      const [a, b, s, ph] = MOTES[i], life = fr(ph + t * (0.05 + a * 0.04) * speed), x = c.x + (b - 0.5) * U * (0.4 + life * 5) + Math.sin(t + i) * U * 0.1, y = base - life * H * 0.95;
      glowAt(g, x, y, (2 + s * 5) * (1 + (1 - life)), (1 - life) * 0.9);
    }
    g.restore();
  }
  function shards(g, c, U, t, n, speed) {
    g.fillStyle = '#050507';
    for (let i = 0; i < n; i++) {
      const S = SHARDS[i], a = S.a + t * S.sp * speed, x = c.x + Math.cos(a) * S.rx * U, y = c.y - U * 0.6 + Math.sin(a) * S.ry * U, s = S.s * U;
      g.save(); g.translate(x, y); g.rotate(t * S.spin + S.ph * 6);
      g.beginPath(); g.moveTo(0, -s * 1.4); g.lineTo(s * 0.7, s * 0.5); g.lineTo(-s * 0.6, s * 0.8); g.closePath(); g.fill();
      const eg = g.createLinearGradient(-s, -s, s, s); eg.addColorStop(0, 'rgba(240,242,255,.75)'); eg.addColorStop(1, 'rgba(240,242,255,0)');
      g.strokeStyle = eg; g.lineWidth = 1.2; g.stroke();
      g.restore();
    }
  }

  /* ================= the five fragments (the aura itself) =================
     After Sol's RNG's BREAKTHROUGH: five shattered pieces float behind the bearer, the middle one the
     largest; the bearer hangs over a light pouring up through a crack in the ground; glass shards rise
     off the ground and fade; faint black smoke drifts up. Each fragment is painted once into its own
     sprite, with a pre-blurred white silhouette of it drawn behind as the bright crack of light round it. */
  const fragCache = {};
  function fragment(id, w, h, seed, front) {
    const DPR = DPRx(), key = id + ':' + Math.round(w) + ':' + DPR;
    if (fragCache[key]) return fragCache[key];
    const cw = Math.ceil(w * 2.2), ch = Math.ceil(h * 1.75 + w), mk = () => { const c = document.createElement('canvas'); c.width = Math.ceil(cw * DPR); c.height = Math.ceil(ch * DPR); const x = c.getContext('2d'); x.scale(DPR, DPR); return [c, x]; };
    const [cv, x] = mk(), base = ch - h * 0.3, cx = cw / 2;          // room below for the broken foot
    paintMonolith(x, cx, base, w, h, seed, front);
    // a crack of light running down from the top through the stone
    const r = rnd(seed * 7 + 3);
    x.save(); x.shadowColor = '#fff'; x.shadowBlur = 12; x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = Math.max(1.5, w * 0.025); x.lineJoin = 'round';
    x.beginPath(); let px = cx + (r() - 0.5) * w * 0.3, py = base - h * 1.05; x.moveTo(px, py);
    for (let i = 0; i < 7; i++) { px += (r() - 0.5) * w * 0.25; py += h * (0.06 + r() * 0.08); x.lineTo(px, py); }
    x.stroke(); x.restore();
    // its glow: the silhouette, white, blurred (drawn far off-canvas so only the shadow lands)
    const [gv, gx] = mk();
    gx.shadowColor = 'rgba(235,238,255,1)'; gx.shadowBlur = w * 0.35; gx.shadowOffsetX = 10000;
    gx.drawImage(cv, -10000, 0, cw, ch); gx.drawImage(cv, -10000, 0, cw, ch);
    return (fragCache[key] = { cv, gv, cw, ch, bx: cx, by: base });
  }
  // draw a fragment with its foot at (x, y), scaled s, tilted r; glow = how bright the light round it is
  function drawFrag(g, F, x, y, s, r, glow, alpha = 1) {
    g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s);
    if (glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, glow) * alpha; g.drawImage(F.gv, -F.bx, -F.by, F.cw, F.ch); g.restore(); }
    g.globalAlpha = alpha; g.drawImage(F.cv, -F.bx, -F.by, F.cw, F.ch);
    g.restore();
  }
  const FIVE = [[-2.35, 2.1, 0.62, 11], [-1.25, 3.0, 0.78, 12], [0, 4.6, 1.05, 13], [1.25, 3.1, 0.78, 14], [2.35, 2.2, 0.62, 15]];
  let puffSpr = null;
  const puff = () => {
    if (puffSpr) return puffSpr;
    const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), gr = x.createRadialGradient(48, 48, 0, 48, 48, 48);
    gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 96, 96);
    return (puffSpr = c);
  };
  /* the whole aura around a centre c (the bearer), size unit U. gather 0..1 brings the five in from far
     apart; light = how strongly the ground crack burns */
  function fiveAura(g, W, H, c, U, t, beat, gather = 1, light = 1) {
    const ground = c.y + U * 2.1;
    // the void, lit from below
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#000'); sky.addColorStop(0.55, '#07070b'); sky.addColorStop(1, '#16161e');
    g.fillStyle = sky; g.fillRect(-W, -H, W * 3, H * 3);
    g.save(); g.globalCompositeOperation = 'lighter';
    glowAt(g, c.x, ground, U * (4 + beat * 0.6), 0.45 * light);
    // the light pouring up out of the crack
    const bw = U * (0.9 + 0.15 * beat);
    g.globalAlpha = 0.9 * light; g.drawImage(raySprite(), c.x - bw, ground - H * 1.1, bw * 2, H * 1.1);
    g.globalAlpha = 0.5 * light; g.drawImage(raySprite(), c.x - bw * 2.4, ground - H * 0.9, bw * 4.8, H * 0.9);
    g.globalAlpha = 1; g.restore();
    // the five, floating, the middle one tallest; each lit round its edge
    FIVE.forEach(([dx, hh, ww, seed], i) => {
      const F = fragment('five' + i, U * ww, U * hh, seed, true);
      const spread = 1 + (1 - gather) * 2.2, x = c.x + dx * U * spread, bob = Math.sin(t * 0.7 + i * 1.3) * U * 0.08;
      const y = ground - U * (1.35 + (i === 2 ? 0.45 : 0) + Math.abs(dx) * 0.12) + bob - (1 - gather) * U * (i % 2 ? 1.5 : -1.2);   // floating clear of the crack
      drawFrag(g, F, x, y, 1, Math.sin(t * 0.3 + i) * 0.03 + dx * 0.02, (0.55 + 0.35 * beat) * light, Math.min(1, gather * 1.5));
    });
    // the ground and its crack
    const gg = g.createLinearGradient(0, ground, 0, H);
    gg.addColorStop(0, '#0a0a0e'); gg.addColorStop(1, '#020203');
    g.fillStyle = gg; g.fillRect(-W, ground, W * 3, H * 2);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    // the crack: an opening in the ground, widest under the bearer and pinching out to nothing at both
    // ends, ragged along its lips - filled with white, haloed by soft blooms (no stroked line)
    const r = rnd(4242), top = [], bot = [], half = U * 3.2;
    for (let x = c.x - half; x <= c.x + half; x += U * (0.1 + r() * 0.12)) {
      const k = 1 - Math.abs(x - c.x) / half, w = U * 0.16 * Math.pow(Math.max(0, k), 1.3) * (0.6 + r() * 0.7);
      const jy = (r() - 0.5) * U * 0.06; top.push([x, ground + jy - w]); bot.push([x, ground + jy + w * 0.45]);
    }
    for (let i = 0; i < 7; i++) glowAt(g, c.x + (i - 3) * U * 0.7, ground, U * (1.4 - Math.abs(i - 3) * 0.25), (0.35 - Math.abs(i - 3) * 0.06) * light);
    g.fillStyle = `rgba(255,255,255,${light})`; g.beginPath();
    top.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]);
    g.closePath(); g.fill();
    g.restore();
    // glass shards rising off the ground and fading
    for (let i = 0; i < 26; i++) {
      const life = fr(i * 0.618 + t * (0.08 + (i % 4) * 0.02)), sx = c.x + (fr(i * 0.37) - 0.5) * U * 6, sy = ground - life * U * 5, s = U * (0.05 + (i % 3) * 0.03);
      g.save(); g.translate(sx + Math.sin(t + i) * U * 0.1, sy); g.rotate(t * (0.6 + i % 3) + i);
      g.globalAlpha = Math.sin(life * Math.PI) * 0.9;
      g.fillStyle = 'rgba(220,224,255,.12)'; g.strokeStyle = 'rgba(245,247,255,.9)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, -s * 1.4); g.lineTo(s * 0.8, s * 0.6); g.lineTo(-s * 0.7, s * 0.9); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    // faint black smoke drifting up
    for (let i = 0; i < 12; i++) {
      const life = fr(i * 0.29 + t * 0.03), px = c.x + (fr(i * 0.61) - 0.5) * U * 7 + Math.sin(t * 0.3 + i) * U * 0.4, py = ground - life * U * 6, s = U * (1 + life * 1.6);
      g.globalAlpha = Math.sin(life * Math.PI) * 0.7; g.drawImage(puff(), px - s, py - s, s * 2, s * 2);
    }
    g.globalAlpha = 1;
    return ground;
  }

  /* ================= the NULL theme: the aura behind the crystal ================= */
  N3.auraTheme = (g, W, H, t, c, R, k) => {
    const beat = Math.exp(-fr(t / BEAT) * 5), U = Math.min(R * 0.95, W * 0.15);
    fiveAura(g, W, H, { x: c.x, y: c.y - R * 0.2 }, U, t, beat, 1, 0.9);
    const cyc = t % (BAR * 8);
    if (cyc < BEAT * 1.4) { const kk = cyc / (BEAT * 1.4); cracks(g, W, H, Math.min(1, kk * 3), (1 - kk) * 0.4); }
  };

  /* ================= the NULL biome: a void of spiked slabs drifting past ================= */
  let slabSpr = null;
  function slabs() {
    if (slabSpr) return slabSpr;
    slabSpr = Array.from({ length: 6 }, (_, i) => {
      const r = rnd(40 + i), w = 160 + r() * 140, c = document.createElement('canvas'); c.width = w + 40; c.height = 220;
      const x = c.getContext('2d'), y0 = 130, th = 16 + r() * 10;
      const bg = x.createLinearGradient(0, y0, 0, y0 + th); bg.addColorStop(0, '#2a2a34'); bg.addColorStop(0.2, '#0a0a10'); bg.addColorStop(1, '#030305');
      x.fillStyle = bg; x.fillRect(20, y0, w, th);
      x.fillStyle = 'rgba(240,242,255,.8)'; x.fillRect(20, y0, w, 1.5);
      for (let k = 0; k < 4 + Math.floor(r() * 7); k++) {
        const tx = 24 + r() * (w - 8), tw = 3 + r() * 7, h = (r() < 0.3 ? 70 : 20) + r() * 45, lean = (r() - 0.5) * 18;
        const tg = x.createLinearGradient(tx, y0, tx + lean, y0 - h); tg.addColorStop(0, '#08080c'); tg.addColorStop(1, '#2a2a36');
        x.fillStyle = tg; x.beginPath(); x.moveTo(tx - tw, y0); x.lineTo(tx + lean, y0 - h); x.lineTo(tx + tw, y0); x.closePath(); x.fill();
      }
      for (let k = 0; k < 2 + Math.floor(r() * 4); k++) {
        const tx = 30 + r() * (w - 20), tw = 4 + r() * 8, h = 15 + r() * 55;
        x.fillStyle = '#050508'; x.beginPath(); x.moveTo(tx - tw, y0 + th); x.lineTo(tx + (r() - 0.5) * 6, y0 + th + h); x.lineTo(tx + tw, y0 + th); x.closePath(); x.fill();
      }
      return c;
    });
    return slabSpr;
  }
  N3.biomeBack = (g, W, H, t) => {
    g.fillStyle = 'rgba(0,0,3,.9)'; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, W / 2, H * 0.45, Math.max(W, H) * 0.5, 0.18); g.restore();
    const S = slabs();
    for (let i = 0; i < 9; i++) {
      const spr = S[i % S.length], depth = 0.45 + (i % 3) * 0.3, sp = 14 * depth, w = spr.width * depth, h = spr.height * depth;
      const x = ((fr(i * 0.618) * (W + w) - t * sp) % (W + w) + W + w) % (W + w) - w, y = H * (0.15 + fr(i * 0.37) * 0.75) + Math.sin(t * 0.5 + i) * 8;
      g.globalAlpha = 0.45 + depth * 0.45; g.drawImage(spr, x, y - h / 2, w, h); g.globalAlpha = 1;
    }
    for (const sd of [0, 1]) {
      const fg = g.createLinearGradient(sd ? W : 0, 0, sd ? W * 0.8 : W * 0.2, 0);
      fg.addColorStop(0, 'rgba(235,238,255,.28)'); fg.addColorStop(1, 'rgba(235,238,255,0)');
      g.fillStyle = fg; g.fillRect(0, 0, W, H);
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
  const DUR = 32.5;                                                     // seconds of song: 46.15 -> 78.65
  const REVEAL = barAt(14);                                             // 28.74 s, the last bars of the drop
  const beatAt = n => DAN + n * BEAT;                                   // beat n of the drop
  const THIN = '"Helvetica Neue", "Segoe UI", Arial, sans-serif';
  // the words, light and wide-set; a group's words land one per listed beat and stay until it ends
  const SAY = [
    { at: HIT1, words: ['get out'], until: HIT2, pos: 0.5, size: 0.06 },
    { at: HIT2, words: ['of my head'], until: DAN - BEAT * 0.4, pos: 0.5, size: 0.06 },
    { at: beatAt(1), beats: [0, 1, 2], words: ['i  —', 'it began', 'with five'], until: barAt(2) - 0.1, pos: 0.93, size: 0.042 },
    { at: barAt(2) + BEAT, beats: [0, 1, 2], words: ['ii  —', 'fewer', 'every time'], until: barAt(4) - 0.1, pos: 0.93, size: 0.042 },
    { at: barAt(4) + BEAT, beats: [0, 1, 2], words: ['iii  —', 'the light', 'thinned out'], until: barAt(6) - 0.1, pos: 0.93, size: 0.042 },
    { at: barAt(6) + BEAT, beats: [0, 1, 2], words: ['iv  —', 'until nothing', 'stayed'], until: barAt(8) - 0.1, pos: 0.93, size: 0.042, ink: '#000' },
    { at: barAt(8) + BEAT, beats: [0, 2], words: ['it never', 'left'], until: barAt(10) - 0.1, pos: 0.16, size: 0.046 },
    { at: barAt(10) + BEAT, beats: [0, 2], words: ['five fragments', 'remain'], until: barAt(12) - 0.1, pos: 0.16, size: 0.046 },
    { at: barAt(12), beats: [0, 2, 4], words: ['how much of', 'this world', 'is real?'], until: REVEAL - 0.15, pos: 0.16, size: 0.046 },
  ];
  function say(g, W, H, T) {
    const m = Math.min(W, H);
    for (const s of SAY) {
      if (T < s.at || T > s.until) continue;
      const fade = 1 - seg(T, s.until - 0.2, s.until), fs = m * s.size;
      const shown = s.words.map((w, i) => ({ w, t0: s.at + (s.beats ? s.beats[i] * BEAT : 0) })).filter(x => T >= x.t0);
      g.save(); g.font = `300 ${fs}px ${THIN}`; g.textBaseline = 'middle'; g.textAlign = 'center';
      if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.22}px`;
      const gap = fs * 0.55, widths = shown.map(x => g.measureText(x.w).width);
      let full = widths.reduce((a, b) => a + b, 0) + gap * (shown.length - 1), k = 1;
      if (full > W * 0.88) { k = W * 0.88 / full; full *= k; }
      let x = W / 2 - full / 2;
      shown.forEach((it, i) => {
        const age = T - it.t0, a = Math.min(1, age * 9) * fade, w = widths[i] * k, rise = (1 - Math.min(1, age * 7)) * fs * 0.3;
        g.save(); g.translate(x + w / 2, H * s.pos + rise); g.scale(k, k); g.globalAlpha = a;
        if (!s.ink) { g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = fs * 0.4; }
        g.fillStyle = s.ink || '#f4f5ff'; g.fillText(it.w, 0, 0);
        g.restore();
        x += w + gap * k;
      });
      g.restore();
    }
  }
  // i - iv: four different monoliths, each in its own framing, the light breaking round it
  const SOLO = [
    { seed: 71, w: 1.1, h: 5.6, x: 0.5, y: 0.92, s0: 1.0, s1: 1.12, r: 0, skew: 0, rise: 0.05 },        // i   - head-on, looking up, pushing in
    { seed: 72, w: 1.0, h: 4.6, x: 0.42, y: 0.86, s0: 1.08, s1: 1.0, r: 0.16, skew: -0.25, rise: 0 },   // ii  - leaning, seen from the side, drifting
    { seed: 73, w: 1.3, h: 3.8, x: 0.5, y: 0.78, s0: 1.25, s1: 1.4, r: -0.05, skew: 0.12, rise: -0.04, split: true },   // iii - the split one, close
    { seed: 74, w: 0.9, h: 3.2, x: 0.55, y: 0.74, s0: 0.95, s1: 0.85, r: 0.06, skew: 0, rise: 0.02 },  // iv  - small, alone, stark
  ];
  function solo(g, W, H, T, i, k, beat) {
    const S = SOLO[i], m = Math.min(W, H), U = m * 0.16, stark = i === 3;
    g.fillStyle = stark ? '#f2f2f2' : '#000'; g.fillRect(0, 0, W, H);
    if (!stark) {                                                       // a cold light falling from behind
      g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, W * S.x, H * S.y - U * S.h * 0.7, m * (0.9 + 0.1 * beat), 0.55); g.restore();
    }
    const s = S.s0 + (S.s1 - S.s0) * k, x = W * S.x + (i === 1 ? (k - 0.5) * W * 0.16 : 0), y = H * (S.y + S.rise * k);
    g.save(); g.translate(x, y); g.transform(1, 0, S.skew, 1, 0, 0); g.translate(-x, -y);
    if (S.split) {
      const F1 = fragment('solo2a', U * S.w * 0.55, U * S.h, S.seed, true), F2 = fragment('solo2b', U * S.w * 0.55, U * S.h * 0.9, S.seed + 50, true), gap = U * (0.2 + k * 0.25);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(raySprite(), x - gap * 1.5, y - U * S.h * s * 1.4, gap * 3, U * S.h * s * 1.5); g.restore();
      drawFrag(g, F1, x - gap - U * S.w * 0.3 * s, y, s, S.r - 0.04, 0.9 + 0.3 * beat);
      drawFrag(g, F2, x + gap + U * S.w * 0.3 * s, y, s, S.r + 0.05, 0.9 + 0.3 * beat);
    } else {
      const F = fragment('solo' + i, U * S.w, U * S.h, S.seed, true);
      if (stark) drawFrag(g, F, x, y, s, S.r, 0);                     // black stone on a white field
      else drawFrag(g, F, x, y, s, S.r, 0.85 + 0.35 * beat);
    }
    g.restore();
    // dust in the light
    g.save(); g.globalCompositeOperation = stark ? 'source-over' : 'lighter';
    for (let j = 0; j < 30; j++) {
      const life = fr(j * 0.618 + T * 0.05), px = fr(j * 0.37 + i) * W, py = H - life * H;
      if (stark) { g.fillStyle = `rgba(0,0,0,${Math.sin(life * Math.PI) * 0.5})`; g.fillRect(px, py, 2, 2); }
      else glowAt(g, px, py, 3, Math.sin(life * Math.PI) * 0.6);
    }
    g.restore();
  }
  G.cutscenes.register({
    id: 'nullscapes', name: 'NULLSCAPES', odds: 555500000000, tier: 'null', biome: 'null', zone: -1,
    music: 'audio/flow.mp3', musicAt: DA, pre: 2000, fullscreen: true,
    duration: DUR * 1000, revealAt: REVEAL / DUR, colors: ['#ffffff', '#c8ccff', '#000000'],
    captions: [],                                                       // drawn by say(), word by word on the beat
    draw(g, e) {
      const { W, H, time } = e, T = time / 1000, m = Math.min(W, H);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      // ---- the blackout: motes of light drawn into a star, its flare swelling ----
      if (T < 0) {
        const k = 1 + T / 2;
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 60; i++) {
          const [a, b, s] = MOTES[i], ang = a * TAU, d = (1 - fr(k * (0.6 + b) + s)) * Math.hypot(W, H) * 0.5;
          glowAt(g, W / 2 + Math.cos(ang) * d, H / 2 + Math.sin(ang) * d, 3 + s * 4, 0.6 * k);
        }
        g.restore();
        flare(g, W, H, W / 2, H / 2, m * (0.02 + k * k * 0.07), 0.3 + 0.7 * k);
        return;
      }
      // ---- "da" / "dan": dark, and the words; one beat out, the light cracks through ----
      if (T < DAN) {
        const hit = Math.max(0, 1 - Math.abs(T - HIT1) / 0.1) + Math.max(0, 1 - Math.abs(T - HIT2) / 0.1);
        if (hit > 0) { g.fillStyle = `rgba(255,255,255,${0.3 * Math.min(1, hit)})`; g.fillRect(0, 0, W, H); }
        const pre = seg(T, DAN - BEAT * 1.5, DAN);
        if (pre > 0) cracks(g, W, H, E.inCubic(pre), 0.5 + 0.5 * pre);
        say(g, W, H, T);
        return;
      }
      const beat = Math.exp(-fr((T - DAN) / BEAT) * 5), bar = (T - DAN) / BAR;
      if (bar < 8) {
        // ---- i - iv ----
        const i = Math.floor(bar / 2), k = E.inOut(clamp((bar - i * 2) / 2));
        solo(g, W, H, T, i, k, beat);
      } else {
        // ---- the five fragments gather; the ground cracks open with light ----
        const U = m * 0.15, gather = E.outCubic(seg(T, barAt(8), barAt(10))), light = 0.5 + 0.5 * seg(T, barAt(8), barAt(11));
        const zoom = 1.35 - 0.35 * E.inOut(seg(T, barAt(8), REVEAL)) + 0.02 * beat;
        const c = { x: W / 2, y: H * 0.5 };
        g.save(); g.translate(W / 2, H / 2); g.scale(zoom, zoom); g.translate(-W / 2, -H / 2);
        fiveAura(g, W, H, c, U, T, beat, gather, light);
        g.restore();
        g.save(); g.globalCompositeOperation = 'lighter'; glowAt(g, W / 2, H * 0.62, m * 0.9, 0.1 * beat); g.restore();
        const cl = seg(T, barAt(12), REVEAL);
        if (cl > 0 && T < REVEAL) cracks(g, W, H, E.inCubic(cl), 0.45 + 0.4 * beat);
      }
      // ---- the drop: the dark shatters outward into the first light ----
      if (T < DAN + 1.4) {
        const k = E.inCubic(clamp((T - DAN) / 1.3)), s = Math.hypot(W, H) * 0.62;
        g.save(); g.translate(W / 2, H / 2);
        for (const shd of CRACK.shards) {
          const a = 1 - k; if (a <= 0) continue;
          g.save(); g.translate(shd.cx * s * k * 2.6 * shd.push, shd.cy * s * k * 2.6 * shd.push); g.rotate(shd.spin * k); g.scale(1 + k * 1.5 * shd.push, 1 + k * 1.5 * shd.push);
          g.beginPath(); shd.poly.forEach((p, i) => (i ? g.lineTo((p[0] - shd.cx) * s, (p[1] - shd.cy) * s) : g.moveTo((p[0] - shd.cx) * s, (p[1] - shd.cy) * s))); g.closePath();
          g.globalAlpha = a; g.fillStyle = '#030305'; g.fill();
          g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.stroke();
          g.restore();
        }
        g.restore();
        g.fillStyle = `rgba(255,255,255,${0.9 * (1 - clamp((T - DAN) / 0.4))})`; g.fillRect(0, 0, W, H);
      }
      // ---- cuts between i / ii / iii / iv / the five: a white hit on the downbeat ----
      const cutBars = [2, 4, 6, 8], since = Math.min(...cutBars.map(b => { const d = (bar - b) * BAR; return d >= 0 ? d : 99; }));
      if (since < 0.25) { g.fillStyle = `rgba(255,255,255,${0.7 * (1 - since / 0.25)})`; g.fillRect(0, 0, W, H); }
      // ---- the reveal ----
      const rv = Math.max(0, 1 - Math.abs(T - REVEAL) / 0.45);
      if (rv > 0) { g.fillStyle = `rgba(255,255,255,${rv})`; g.fillRect(0, 0, W, H); }
      const end = seg(T, DUR - 2.5, DUR);
      if (end > 0) { g.fillStyle = `rgba(0,0,0,${end})`; g.fillRect(0, 0, W, H); }
      if (bar >= 8 || bar < 6) {
        const v = g.createRadialGradient(W / 2, H / 2, m * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.6, 'rgba(0,0,0,.15)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
        g.fillStyle = v; g.fillRect(0, 0, W, H);
      }
      say(g, W, H, T);
    },
  });
})();
