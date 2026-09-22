/*
  CINE LIBRARY - what makes the 10만~1억대 cutscenes look like a film instead of shapes.
    sprites  : cached glow / star sprites, drawn additively (hundreds per frame for free)
    fog      : tileable fractal noise, tinted and scrolled -> clouds, smoke, nebulae, mist
    ridge    : layered silhouettes with depth
    mesh     : real 3D crystals (prism, brilliant, cube, octa, rhombohedron, nugget, shard, clusters)
               rotated in 3D, lit per facet with diffuse + specular glints + fresnel rim + transparency
    orb      : cabochon stones (opal, moonstone, amber, planet ...)
    post     : bloom, radial light-shaft blur, film grain, vignette
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2;
  const Cine = G.cine = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

  /* ---------------- colour ---------------- */
  const _rgb = {};
  const rgb = hex => {
    if (_rgb[hex]) return _rgb[hex];
    let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return (_rgb[hex] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
  };
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const lit = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
  const add3 = (c, d, k) => [clamp(c[0] + d[0] * k, 0, 255), clamp(c[1] + d[1] * k, 0, 255), clamp(c[2] + d[2] * k, 0, 255)];
  Cine.rgb = rgb; Cine.css = css; Cine.mixc = mixc; Cine.mk = mk;
  Cine.hsl = (h, s, l, a = 1) => { const c = rgb(G.hsl(h, s, l)); return css(c, a); };

  /* ---------------- sprites ---------------- */
  const _spr = {}, _star = {};
  Cine.spr = hex => {
    if (_spr[hex]) return _spr[hex];
    const c = mk(64, 64), x = c.getContext('2d'), [r, g, b] = rgb(hex);
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.1, `rgba(${(r + 255) >> 1},${(g + 255) >> 1},${(b + 255) >> 1},.9)`);
    gr.addColorStop(0.35, `rgba(${r},${g},${b},.42)`);
    gr.addColorStop(0.7, `rgba(${r},${g},${b},.1)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (_spr[hex] = c);
  };
  Cine.starSpr = hex => {
    if (_star[hex]) return _star[hex];
    const c = mk(128, 128), x = c.getContext('2d'), [r, g, b] = rgb(hex);
    const gh = x.createLinearGradient(0, 0, 128, 0);
    gh.addColorStop(0, `rgba(${r},${g},${b},0)`); gh.addColorStop(0.5, 'rgba(255,255,255,1)'); gh.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gh; x.fillRect(0, 62, 128, 4);
    const gv = x.createLinearGradient(0, 0, 0, 128);
    gv.addColorStop(0, `rgba(${r},${g},${b},0)`); gv.addColorStop(0.5, 'rgba(255,255,255,1)'); gv.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gv; x.fillRect(62, 0, 4, 128);
    x.globalCompositeOperation = 'lighter'; x.drawImage(Cine.spr(hex), 32, 32, 64, 64);
    return (_star[hex] = c);
  };
  /* additive glow blob */
  Cine.glow = (g, x, y, r, hex, a = 1) => {
    if (r < 0.5 || a <= 0) return;
    const pa = g.globalAlpha; g.globalAlpha = pa * Math.min(1, a);
    g.drawImage(Cine.spr(hex), x - r, y - r, r * 2, r * 2); g.globalAlpha = pa;
  };
  Cine.star = (g, x, y, size, hex, a = 1, rot = 0) => {
    if (size < 1 || a <= 0) return;
    const pa = g.globalAlpha; g.globalAlpha = pa * Math.min(1, a);
    g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(Cine.starSpr(hex), -size, -size, size * 2, size * 2); g.restore(); g.globalAlpha = pa;
  };
  Cine.add = (g, fn) => { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); };

  /* ---------------- fractal noise + fog ---------------- */
  let _noise = null; const _fog = {};
  Cine.noiseTex = () => {
    if (_noise) return _noise;
    const N = 256, c = mk(N, N), x = c.getContext('2d'), im = x.createImageData(N, N);
    const oct = [4, 8, 16, 32, 64], wt = [0.34, 0.27, 0.2, 0.12, 0.07];
    const lat = oct.map((s, i) => { const r = rng(900 + i * 17), a = new Float32Array(s * s); for (let k = 0; k < a.length; k++) a[k] = r(); return a; });
    const sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
      let v = 0;
      for (let o = 0; o < oct.length; o++) {
        const s = oct[o], fx = xx / N * s, fy = y / N * s, i = Math.floor(fx), j = Math.floor(fy), tx = sm(fx - i), ty = sm(fy - j), L = lat[o];
        const a = L[(j % s) * s + (i % s)], b = L[(j % s) * s + ((i + 1) % s)], c2 = L[((j + 1) % s) * s + (i % s)], d = L[((j + 1) % s) * s + ((i + 1) % s)];
        v += (a + (b - a) * tx + (c2 - a) * ty + (a - b - c2 + d) * tx * ty) * wt[o];
      }
      v = clamp((v - 0.3) * 2.1);
      const p = (y * N + xx) * 4; im.data[p] = im.data[p + 1] = im.data[p + 2] = 255; im.data[p + 3] = v * 255;
    }
    x.putImageData(im, 0, 0);
    return (_noise = c);
  };
  Cine.fogTex = hex => {
    if (_fog[hex]) return _fog[hex];
    const c = mk(256, 256), x = c.getContext('2d');
    x.drawImage(Cine.noiseTex(), 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = hex; x.fillRect(0, 0, 256, 256);
    return (_fog[hex] = c);
  };
  /* scrolling coloured fog. o: s scale, vx/vy px per sec, a alpha, comp, x0 y0 w h (clip) */
  Cine.fog = (g, e, hex, o = {}) => {
    const s = o.s || 1.6, t = e.time / 1000;
    g.save();
    g.beginPath(); g.rect(o.x0 || 0, o.y0 || 0, o.w || e.W, o.h || e.H); g.clip();
    g.globalAlpha *= o.a == null ? 0.3 : o.a;
    g.globalCompositeOperation = o.comp || 'source-over';
    g.translate((o.ox || 0) + t * (o.vx == null ? 8 : o.vx), (o.oy || 0) + t * (o.vy || 0));
    g.scale(s, s);
    g.fillStyle = g.createPattern(Cine.fogTex(hex), 'repeat');
    g.fillRect(-4000, -4000, 9000, 9000);
    g.restore();
  };

  /* ---------------- 1D noise / silhouettes ---------------- */
  const h1 = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const n1 = (x, s) => { const i = Math.floor(x), f = x - i, a = h1(i, s), b = h1(i + 1, s); return a + (b - a) * f * f * (3 - 2 * f); };
  Cine.fbm1 = (x, s) => n1(x, s) * 0.58 + n1(x * 2.1, s + 7) * 0.29 + n1(x * 4.3, s + 13) * 0.13;
  /* filled silhouette. o: y, amp, seed, col(css), freq, off, top(bool - hangs from the top), peaks */
  Cine.ridge = (g, e, o) => {
    const step = e.W / 56, f = o.freq || 0.006, top = o.top;
    g.beginPath(); g.moveTo(-20, top ? -20 : e.H + 20);
    for (let x = -20; x <= e.W + 20; x += step) {
      let v = Cine.fbm1(x * f + (o.off || 0), o.seed || 1);
      if (o.peaks) v = 1 - Math.abs(v * 2 - 1) * 0.9;
      g.lineTo(x, o.y + (top ? 1 : -1) * (v - 0.5) * 2 * o.amp);
    }
    g.lineTo(e.W + 20, top ? -20 : e.H + 20); g.closePath();
    g.fillStyle = o.col; g.fill();
    if (o.rim) { g.strokeStyle = o.rim; g.lineWidth = o.rimW || 1.5; g.beginPath(); for (let x = -20, first = true; x <= e.W + 20; x += step) { let v = Cine.fbm1(x * f + (o.off || 0), o.seed || 1); if (o.peaks) v = 1 - Math.abs(v * 2 - 1) * 0.9; const y = o.y + (top ? 1 : -1) * (v - 0.5) * 2 * o.amp; first ? g.moveTo(x, y) : g.lineTo(x, y); first = false; } g.stroke(); }
  };

  /* ---------------- particles ---------------- */
  /* o: n seed col size(u) vx vy (u/sec) a twinkle wobble  x0 y0 w h (region) */
  Cine.motes = (g, e, o) => {
    const r = rng(o.seed || 1), t = e.time / 1000, u = e.u, n = o.n || 40, W = o.w || e.W, H = o.h || e.H, x0 = o.x0 || 0, y0 = o.y0 || 0;
    g.save(); g.globalCompositeOperation = 'lighter';
    const spr = Cine.spr(o.col || '#ffffff');
    for (let i = 0; i < n; i++) {
      const bx = r() * W, by = r() * H, sp = 0.5 + r() * 0.9, sz = u * (o.size || 1.2) * (0.4 + r() * 0.9), ph = r() * 9;
      let x = bx + t * (o.vx || 0) * u * sp + Math.sin(t * 0.9 * sp + ph) * (o.wobble || 0) * u;
      let y = by + t * (o.vy || 0) * u * sp + Math.cos(t * 0.7 * sp + ph) * (o.wobble || 0) * u * 0.6;
      x = ((x % (W + 40)) + (W + 40)) % (W + 40) - 20 + x0; y = ((y % (H + 40)) + (H + 40)) % (H + 40) - 20 + y0;
      const tw = o.twinkle ? 0.45 + 0.55 * Math.sin(t * 2.4 * sp + ph) : 1;
      g.globalAlpha *= 1; const pa = g.globalAlpha;
      g.globalAlpha = pa * (o.a == null ? 0.8 : o.a) * Math.max(0, tw) * (o.fade ? o.fade(y, x) : 1);
      g.drawImage(spr, x - sz, y - sz, sz * 2, sz * 2); g.globalAlpha = pa;
    }
    g.restore();
  };
  /* light shafts. o: x y ang n len spread w col a seed */
  Cine.shafts = (g, e, o) => {
    const r = rng(o.seed || 4), t = e.time / 1000, n = o.n || 6, L = o.len || e.H * 1.4, [cr, cg, cb] = rgb(o.col || '#ffffff');
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(o.x, o.y); g.rotate(o.ang == null ? Math.PI / 2 : o.ang);
    for (let i = 0; i < n; i++) {
      const off = (n > 1 ? (i / (n - 1) - 0.5) : 0) * (o.spread || e.u * 30), wi = (o.w || e.u * 3) * (0.5 + r()), fl = 0.55 + 0.45 * Math.sin(t * 1.1 + i * 2.3);
      const gr = g.createLinearGradient(0, 0, L, 0);
      gr.addColorStop(0, `rgba(${cr},${cg},${cb},${(o.a || 0.1) * fl})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, off - wi * 0.2); g.lineTo(L, off * 2.2 - wi * 1.6); g.lineTo(L, off * 2.2 + wi * 1.6); g.lineTo(0, off + wi * 0.2); g.closePath(); g.fill();
    }
    g.restore();
  };
  /* lens flare: anamorphic streak + ghosts */
  Cine.flare = (g, e, x, y, k, hex) => {
    if (k <= 0.01) return;
    const [cr, cg, cb] = rgb(hex || '#ffffff'), L = e.W * 1.05 * k;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(x - L, 0, x + L, 0);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},0)`); gr.addColorStop(0.5, `rgba(${cr},${cg},${cb},${0.75 * k})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    g.fillStyle = gr; g.fillRect(x - L, y - e.u * 0.35, L * 2, e.u * 0.7);
    Cine.glow(g, x, y, e.u * 16 * k, '#ffffff', 0.7 * k);
    [[0.6, 4, '#ffb0a0'], [1.2, 6, '#a0d0ff'], [1.7, 3, '#ffe0a0'], [-0.5, 5, '#c0a0ff']].forEach(([d, r, c]) => Cine.glow(g, x + (e.cx - x) * d, y + (e.cy - y) * d, e.u * r * k, c, 0.35 * k));
    g.restore();
  };

  /* ================= 3D MESHES ================= */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  function finish(m) {
    const c = [0, 0, 0];
    m.v.forEach(p => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
    c[0] /= m.v.length; c[1] /= m.v.length; c[2] /= m.v.length;
    m.n = m.f.map(idx => {
      let n = norm(cross(sub(m.v[idx[1]], m.v[idx[0]]), sub(m.v[idx[2]], m.v[idx[0]])));
      const fc = [0, 0, 0]; idx.forEach(i => { fc[0] += m.v[i][0]; fc[1] += m.v[i][1]; fc[2] += m.v[i][2]; });
      fc[0] /= idx.length; fc[1] /= idx.length; fc[2] /= idx.length;
      if (dot(n, sub(fc, c)) < 0) n = [-n[0], -n[1], -n[2]];
      return n;
    });
    return m;
  }

  const M = Cine.mesh = {
    prism(n = 6, r = 0.45, h = 1.6, tip = 0.55, o = {}) {
      const v = [], f = [], rr = rng(o.seed || 1), tr = o.taper == null ? 1 : o.taper;
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU + (o.rot || 0), j = 1 + (o.jit || 0) * (rr() - 0.5); v.push([Math.cos(a) * r * j, -h / 2, Math.sin(a) * r * j]); }
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU + (o.rot || 0), j = 1 + (o.jit || 0) * (rr() - 0.5); v.push([Math.cos(a) * r * tr * j, h / 2, Math.sin(a) * r * tr * j]); }
      v.push([o.lean || 0, h / 2 + tip, 0]);
      if (o.tipB) v.push([0, -h / 2 - o.tipB, 0]);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n + j, n + i]); f.push([n + i, n + j, 2 * n]); if (o.tipB) f.push([j, i, 2 * n + 1]); }
      if (!o.tipB) f.push(Array.from({ length: n }, (_, i) => i));
      return finish({ v, f });
    },
    brilliant(N = 8, o = {}) {
      const v = [], f = [], tab = o.table || 0.56, cw = o.crown || 0.42, pv = o.pavilion || 1;
      for (let i = 0; i < N; i++) { const a = (i / N) * TAU; v.push([Math.cos(a) * tab, cw, Math.sin(a) * tab]); }                     // table 0..N-1
      for (let i = 0; i < N; i++) { const a = ((i + 0.5) / N) * TAU; v.push([Math.cos(a), 0, Math.sin(a)]); }                          // girdle N..2N-1
      v.push([0, -pv, 0]);                                                                                                            // culet 2N
      f.push(Array.from({ length: N }, (_, i) => i));
      for (let i = 0; i < N; i++) { f.push([i, (i + 1) % N, N + i]); f.push([N + ((i + N - 1) % N), N + i, i]); f.push([N + i, N + ((i + 1) % N), 2 * N]); }
      return finish({ v, f });
    },
    octa(h = 1.35, w = 0.9) {
      const v = [[w, 0, 0], [-w, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, w], [0, 0, -w]];
      const f = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
      return finish({ v, f });
    },
    cube(s = 0.7, skew = 0) {
      const v = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x * s + y * skew, y * s, z * s + y * skew * 0.6]);
      const f = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
      return finish({ v, f });
    },
    nugget(seed = 1, amp = 0.32, sq = [1, 0.85, 0.9]) {
      const t = (1 + Math.sqrt(5)) / 2, base = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
      const tris = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      const v = base.slice(), cache = {}, mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] != null) return cache[k]; const p = norm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2]); v.push(p); return (cache[k] = v.length - 1); };
      const f = []; tris.forEach(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); f.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
      const r = rng(seed), rad = v.map(p => 1 + (r() - 0.5) * 2 * amp + Math.sin(p[0] * 3 + seed) * amp * 0.5);
      return finish({ v: v.map((p, i) => [p[0] * rad[i] * sq[0], p[1] * rad[i] * sq[1], p[2] * rad[i] * sq[2]]), f });
    },
    /* merge parts: [{ m, pos, rx, ry, rz, s }] */
    cluster(parts) {
      const v = [], f = [], n = [];
      parts.forEach(pt => {
        const { m } = pt, s = pt.s || 1, cy = Math.cos(pt.ry || 0), sy = Math.sin(pt.ry || 0), cx = Math.cos(pt.rx || 0), sx = Math.sin(pt.rx || 0), cz = Math.cos(pt.rz || 0), sz = Math.sin(pt.rz || 0);
        const rot = p => { let X = p[0] * cy + p[2] * sy, Z = -p[0] * sy + p[2] * cy, Y = p[1]; const Y2 = Y * cx - Z * sx, Z2 = Y * sx + Z * cx; return [X * cz - Y2 * sz, X * sz + Y2 * cz, Z2]; };
        const off = v.length, P = pt.pos || [0, 0, 0];
        m.v.forEach(p => { const q = rot(p); v.push([q[0] * s + P[0], q[1] * s + P[1], q[2] * s + P[2]]); });
        m.f.forEach((idx, i) => { f.push(idx.map(k => k + off)); n.push(rot(m.n[i])); });
      });
      return { v, f, n };
    },
  };

  /* ================= SACRED GEOMETRY (TRANSCENDENT tier: 10억대+) =================
     Bold wireframe platonic solids + a radial mandala, the "big geometric aura" look. */
  const autoEdges = v => {
    let min = Infinity;
    for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]));
    const e = [];
    for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) < min * 1.05) e.push([i, j]);
    return e;
  };
  const nrm = p => { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
  const PHI = (1 + Math.sqrt(5)) / 2;
  const poly = {
    tetra: (() => { const v = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(nrm); return { v, e: autoEdges(v) }; })(),
    cube: (() => { const v = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push(nrm([x, y, z]).map(k => k * 1.0)); return { v: v.map(p => [p[0], p[1], p[2]]), e: autoEdges(v) }; })(),
    octa: (() => { const v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; return { v, e: autoEdges(v) }; })(),
    icosa: (() => { const v = [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]].map(nrm); return { v, e: autoEdges(v) }; })(),
    merkaba: (() => { const a = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(nrm), b = a.map(p => [-p[0], -p[1], -p[2]]); const v = a.concat(b); return { v, e: autoEdges(a).concat(autoEdges(b).map(([i, j]) => [i + 4, j + 4])) }; })(),
  };
  Cine.polyKeys = Object.keys(poly);
  /* draw a wireframe polyhedron. o: x y s rx ry rz col alpha glow lineW */
  Cine.wireframe = (g, key, o) => {
    const p = poly[key] || poly.icosa, { x = 0, y = 0, s = 100, rx = 0, ry = 0, rz = 0, col = '#ffffff', alpha = 1, glow = 0.45, lineW = 1.4 } = o;
    const cy2 = Math.cos(ry), sy2 = Math.sin(ry), cx2 = Math.cos(rx), sx2 = Math.sin(rx), cz2 = Math.cos(rz), sz2 = Math.sin(rz);
    const rot = v => { const X = v[0] * cy2 + v[2] * sy2, Z = -v[0] * sy2 + v[2] * cy2, Y = v[1], Y2 = Y * cx2 - Z * sx2, Z2 = Y * sx2 + Z * cx2; return [X * cz2 - Y2 * sz2, X * sz2 + Y2 * cz2, Z2]; };
    const P = p.v.map(rot), S = P.map(v => { const k = 1 / (1 - v[2] * 0.2); return [x + v[0] * s * k, y - v[1] * s * k, v[2]]; });
    const c = rgb(col);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const edges = p.e.map(([i, j]) => ({ i, j, z: (S[i][2] + S[j][2]) / 2 })).sort((m, n) => m.z - n.z);
    if (glow > 0) {
      g.strokeStyle = css(c, alpha * glow * 0.55); g.lineWidth = lineW * 3.4;
      g.beginPath(); edges.forEach(({ i, j }) => { g.moveTo(S[i][0], S[i][1]); g.lineTo(S[j][0], S[j][1]); }); g.stroke();
    }
    for (const { i, j, z } of edges) {
      const depth = (z + 1) / 2, al = alpha * (0.4 + 0.6 * depth);
      g.strokeStyle = css(c, al); g.lineWidth = lineW * (0.7 + 0.6 * depth);
      g.beginPath(); g.moveTo(S[i][0], S[i][1]); g.lineTo(S[j][0], S[j][1]); g.stroke();
    }
    for (const v of S) { const al = alpha * (0.35 + 0.5 * ((v[2] + 1) / 2)); g.fillStyle = css([255, 255, 255], al); g.beginPath(); g.arc(v[0], v[1], lineW * 0.9, 0, TAU); g.fill(); }
    g.restore();
  };
  /* radial sacred-geometry mandala: interlocking triangles + ticked concentric rings, Sol's-RNG-aura style */
  Cine.mandala = (g, cx, cy, r, rot, alpha, col, col2) => {
    const c = rgb(col), c2 = rgb(col2 || col);
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, cy);
    [0, Math.PI].forEach((off, i) => {
      g.save(); g.rotate(rot * (i ? -1 : 1) * 0.6 + off);
      g.strokeStyle = css(i ? c2 : c, alpha * 0.75); g.lineWidth = Math.max(1, r * 0.012);
      g.beginPath();
      for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU - Math.PI / 2, px = Math.cos(a) * r, py = Math.sin(a) * r; k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.stroke(); g.restore();
    });
    for (let ring = 0; ring < 3; ring++) {
      const rr = r * (0.5 + ring * 0.24), n = 12 + ring * 6, rr2 = rot * (ring % 2 ? -0.7 : 0.7);
      g.strokeStyle = css(c, alpha * (0.5 - ring * 0.1)); g.lineWidth = Math.max(0.8, r * 0.005);
      g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
      for (let i = 0; i < n; i++) { const a = rr2 + (i / n) * TAU, l = i % 3 ? r * 0.02 : r * 0.05; g.beginPath(); g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a) * (rr + l), Math.sin(a) * (rr + l)); g.stroke(); }
    }
    g.restore();
  };

  /* draw a mesh. o: x y s rx ry rz col[hi,mid,dark] alpha trans glow shine t edge hatch faceCols light sparkle dim */
  Cine.drawMesh = (g, m, o) => {
    const { x = 0, y = 0, s = 100, rx = 0, ry = 0, rz = 0, alpha = 1, trans = 0, glow = 0, shine = 46, t = 0, edge = 1, hatch = 0, sparkle = 1, dim = 0 } = o;
    const col = o.col.map(rgb), fcols = o.faceCols ? o.faceCols.map(rgb) : null;
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
    const rot = p => { const X = p[0] * cy + p[2] * sy, Z = -p[0] * sy + p[2] * cy, Y = p[1], Y2 = Y * cx - Z * sx, Z2 = Y * sx + Z * cx; return [X * cz - Y2 * sz, X * sz + Y2 * cz, Z2]; };
    const P = m.v.map(rot), S = P.map(p => { const k = 1 / (1 - p[2] * 0.16); return [x + p[0] * s * k, y - p[1] * s * k]; });
    const L = norm(o.light || [-0.55 + Math.sin(t * 0.0006) * 0.35, 0.7, 0.55]), Hh = norm([L[0], L[1], L[2] + 1]);
    const faces = m.f.map((idx, i) => { const n = rot(m.n[i]); let z = 0; idx.forEach(k => { z += P[k][2]; }); return { i, idx, n, z: z / idx.length }; });
    faces.sort((a, b) => a.z - b.z);
    const pa = g.globalAlpha, glints = [];
    if (glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; Cine.glow(g, x, y, s * 1.5, o.glowCol || o.col[0], glow * 0.3); g.restore(); }
    g.lineJoin = 'round';
    for (const F of faces) {
      const front = F.n[2] > -0.02;
      if (!trans && !front) continue;
      const nl = dot(F.n, L), diff = Math.max(0, nl), rim = Math.pow(1 - Math.abs(F.n[2]), 2.2);
      const nh = Math.max(0, dot(F.n, Hh)), spec = Math.pow(nh, shine);
      const base = fcols ? fcols[F.i % fcols.length] : col[1];
      let fc = mixc(col[2], base, clamp(0.18 + diff * 1.15));
      fc = add3(fc, col[0], Math.pow(diff, 3) * 0.55 + rim * (trans ? 0.55 : 0.28));
      fc = add3(fc, [255, 255, 255], spec * 0.85);
      if (dim > 0) fc = mixc(fc, [4, 4, 8], dim);
      const c1 = lit(fc, 1.2), c2 = lit(fc, 0.72);
      const pts = F.idx.map(k => S[k]);
      const dx = L[0], dy = -L[1]; let mn = 1e9, mx = -1e9;
      pts.forEach(p => { const d = p[0] * dx + p[1] * dy; if (d < mn) mn = d; if (d > mx) mx = d; });
      const lenD = Math.hypot(dx, dy) || 1, gx = dx / lenD, gy = dy / lenD;
      const cxp = pts.reduce((a, p) => a + p[0], 0) / pts.length, cyp = pts.reduce((a, p) => a + p[1], 0) / pts.length, half = (mx - mn) / 2 || 1, mid = (mx + mn) / 2;
      const px0 = cxp - gx * half, py0 = cyp - gy * half, px1 = cxp + gx * half, py1 = cyp + gy * half;
      const gr = g.createLinearGradient(px0, py0, px1, py1); gr.addColorStop(0, css(c1)); gr.addColorStop(1, css(c2));
      g.globalAlpha = pa * alpha * (trans ? (front ? 0.66 + 0.3 * rim : 0.2) : 1);
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      g.fillStyle = gr; g.fill();
      if (hatch && F.idx.length === 4 && front) {
        g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(0.6, s * 0.004);
        for (let k = 1; k <= hatch; k++) { const tt = k / (hatch + 1); g.beginPath(); g.moveTo(lerp(pts[0][0], pts[3][0], tt), lerp(pts[0][1], pts[3][1], tt)); g.lineTo(lerp(pts[1][0], pts[2][0], tt), lerp(pts[1][1], pts[2][1], tt)); g.stroke(); }
        g.strokeStyle = 'rgba(255,255,255,.14)';
        for (let k = 1; k <= hatch; k++) { const tt = k / (hatch + 1) + 0.02; g.beginPath(); g.moveTo(lerp(pts[0][0], pts[3][0], tt), lerp(pts[0][1], pts[3][1], tt)); g.lineTo(lerp(pts[1][0], pts[2][0], tt), lerp(pts[1][1], pts[2][1], tt)); g.stroke(); }
      }
      if (edge) { g.strokeStyle = `rgba(255,255,255,${edge * (0.14 + 0.5 * spec + 0.28 * rim)})`; g.lineWidth = Math.max(0.7, s * 0.006); g.stroke(); }
      if (spec > 0.35 && front) glints.push([cxp, cyp, spec]);
    }
    g.globalAlpha = pa;
    if (glow > 0 || trans) { g.save(); g.globalCompositeOperation = 'lighter'; Cine.glow(g, x, y, s * 0.9, o.glowCol || o.col[0], (glow || 0.25) * 0.14); g.restore(); }
    if (sparkle) { g.save(); g.globalCompositeOperation = 'lighter'; glints.forEach(([gx, gy, sp], i) => Cine.star(g, gx, gy, s * (0.16 + 0.34 * sp), '#ffffff', sp * sparkle, 0.2 * i)); g.restore(); }
  };

  /* cabochon stones. o: col[hi,mid,dark] kind t glow alpha hue */
  Cine.orb = (g, x, y, r, o) => {
    const col = o.col.map(rgb), t = o.t || 0, kind = o.kind || 'opal', pa = g.globalAlpha, dim = o.dim || 0;
    g.save(); g.globalCompositeOperation = 'lighter'; Cine.glow(g, x, y, r * 2.3, o.glowCol || o.col[0], (o.glow == null ? 0.45 : o.glow)); g.restore();
    g.globalAlpha = pa * (o.alpha == null ? 1 : o.alpha);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
    const bg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05);
    bg.addColorStop(0, css(mixc(col[0], [255, 255, 255], 0.35))); bg.addColorStop(0.45, css(col[1])); bg.addColorStop(1, css(col[2]));
    g.fillStyle = bg; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalCompositeOperation = 'lighter';
    if (kind === 'opal' || kind === 'pearl') {
      for (let i = 0; i < 6; i++) {
        const a = t * 0.0004 * (i % 2 ? 1 : -1) + i * 1.3, hh = (o.hue || 0) + i * (kind === 'pearl' ? 22 : 62) + Math.sin(t * 0.0008 + i) * 30;
        Cine.glow(g, x + Math.cos(a) * r * 0.45, y + Math.sin(a * 1.3) * r * 0.45, r * (0.42 + 0.14 * Math.sin(t * 0.001 + i)), G.hsl(hh, 95, 60), kind === 'pearl' ? 0.28 : 0.6);
      }
    } else if (kind === 'moon') {
      const a = Math.sin(t * 0.0006) * 0.5; g.save(); g.translate(x, y); g.rotate(a);
      const sh = g.createLinearGradient(-r, 0, r, 0); sh.addColorStop(0, 'rgba(120,170,255,0)'); sh.addColorStop(0.5, 'rgba(160,200,255,.55)'); sh.addColorStop(1, 'rgba(120,170,255,0)');
      g.fillStyle = sh; g.fillRect(-r, -r * 0.35 + Math.sin(t * 0.001) * r * 0.1, r * 2, r * 0.7); g.restore();
    } else if (kind === 'amber') {
      Cine.glow(g, x + r * 0.15, y + r * 0.1, r * 0.9, '#ffb030', 0.35);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(60,25,0,.7)'; g.beginPath(); g.ellipse(x - r * 0.05, y + r * 0.08, r * 0.16, r * 0.06, 0.5, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(60,25,0,.6)'; g.lineWidth = Math.max(1, r * 0.02); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x - r * 0.05 + i * r * 0.05, y + r * 0.08); g.lineTo(x - r * 0.05 + i * r * 0.12, y + r * 0.28); g.stroke(); }
      g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const rr = rng(i + 5); Cine.glow(g, x + (rr() - 0.5) * r * 1.3, y + (rr() - 0.5) * r * 1.3, r * (0.03 + rr() * 0.06), '#ffe0a0', 0.6); }
    } else if (kind === 'planet') {
      g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 9; i++) { g.fillStyle = css(mixc(col[0], col[2], (i % 3) / 3), 0.35); g.fillRect(x - r, y - r + (i / 9) * r * 2 + Math.sin(t * 0.0006 + i) * r * 0.03, r * 2, r * 0.13); }
    } else if (kind === 'swirl') {
      for (let i = 0; i < 5; i++) { const a = t * 0.0005 * (i % 2 ? 1 : -1) + i; g.strokeStyle = css(col[0], 0.28); g.lineWidth = r * 0.07; g.beginPath(); g.ellipse(x, y, r * 0.95, r * (0.2 + i * 0.14), a, 0, TAU); g.stroke(); }
      Cine.glow(g, x, y, r * 0.5, '#ffffff', 0.5);
    } else if (kind === 'lapis') {
      g.globalCompositeOperation = 'source-over'; const rr = rng(9);
      for (let i = 0; i < 46; i++) { const a = rr() * TAU, d = Math.sqrt(rr()) * r; g.fillStyle = css([255, 215, 120], 0.35 + rr() * 0.6); g.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.02 + rr() * r * 0.025, r * 0.02 + rr() * r * 0.025); }
    }
    g.globalCompositeOperation = 'source-over';
    if (dim > 0) { g.fillStyle = `rgba(2,2,8,${dim})`; g.fillRect(x - r, y - r, r * 2, r * 2); }
    const rm = g.createRadialGradient(x, y, r * 0.55, x, y, r);
    rm.addColorStop(0, 'rgba(255,255,255,0)'); rm.addColorStop(1, css(mixc(col[0], [255, 255, 255], 0.4), 0.5)); g.fillStyle = rm; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.restore();
    g.save(); g.globalAlpha = pa * 0.75; g.fillStyle = 'rgba(255,255,255,.75)';
    g.beginPath(); g.ellipse(x - r * 0.36, y - r * 0.4, r * 0.2, r * 0.1, -0.6, 0, TAU); g.fill();
    g.globalAlpha = pa * 0.9; g.beginPath(); g.arc(x + r * 0.3, y + r * 0.42, r * 0.035, 0, TAU); g.fill();
    g.restore(); g.globalAlpha = pa;
  };

  /* ================= POST PROCESSING ================= */
  let S = null, grainTile = null;
  Cine.stage = e => {
    const q = clamp(920 / Math.max(e.W, e.H), 0.55, 1), w = Math.round(e.W * q), h = Math.round(e.H * q);
    if (!S || S.w !== w || S.h !== h) {
      S = { w, h, q, scene: mk(w, h) };
      S.g = S.scene.getContext('2d');
      S.c = [2, 4, 8, 16].map(d => mk(w / d, h / d)); S.cg = S.c.map(c => c.getContext('2d'));
      S.tmp = mk(w / 4, h / 4); S.tg = S.tmp.getContext('2d');
    }
    S.g.setTransform(S.q, 0, 0, S.q, 0, 0); S.g.globalAlpha = 1; S.g.globalCompositeOperation = 'source-over';
    return S;
  };
  const grain = () => {
    if (grainTile) return grainTile;
    grainTile = mk(160, 160); const x = grainTile.getContext('2d'), im = x.createImageData(160, 160);
    for (let i = 0; i < im.data.length; i += 4) { const v = 96 + Math.random() * 64; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); return grainTile;
  };
  /* draw a whole scene through the post pipeline:  Cine.render(gm, e, g => { ...draw...; return { bloom, rays, rx, ry, flash } }) */
  Cine.render = (gm, e, fn) => {
    const st = Cine.stage(e), g = st.g;
    g.clearRect(0, 0, e.W, e.H);
    const post = fn(g, st) || {};
    Cine.compose(gm, e, post);
  };
  /* composite the offscreen scene onto the main canvas with bloom, radial light shafts, grain, vignette.
     post: bloom, rays, rx, ry (light source, screen px), grain, vig, flash */
  Cine.compose = (gm, e, post = {}) => {
    const { W, H } = e, base = gm.globalAlpha;
    gm.save();
    gm.imageSmoothingEnabled = true;
    gm.drawImage(S.scene, 0, 0, W, H);
    // bloom pyramid (threshold by squaring)
    const [c1, c2, c3, c4] = S.c, [g1, g2, g3, g4] = S.cg;
    g1.globalCompositeOperation = 'source-over'; g1.drawImage(S.scene, 0, 0, c1.width, c1.height);
    g1.globalCompositeOperation = 'multiply'; g1.drawImage(c1, 0, 0);
    g2.drawImage(c1, 0, 0, c2.width, c2.height); g3.drawImage(c2, 0, 0, c3.width, c3.height); g4.drawImage(c3, 0, 0, c4.width, c4.height);
    g1.globalCompositeOperation = 'source-over';
    gm.globalCompositeOperation = 'lighter';
    const bl = post.bloom == null ? 0.6 : post.bloom;
    gm.globalAlpha = base * bl * 0.3; gm.drawImage(c2, 0, 0, W, H);
    gm.globalAlpha = base * bl * 0.42; gm.drawImage(c3, 0, 0, W, H);
    gm.globalAlpha = base * bl * 0.5; gm.drawImage(c4, 0, 0, W, H);
    // radial light shafts: zoom-blur the bright pyramid layer from the light position
    if (post.rays > 0.01) {
      const tg = S.tg, tw = S.tmp.width, th = S.tmp.height, px = (post.rx == null ? W / 2 : post.rx) * (tw / W), py = (post.ry == null ? H / 2 : post.ry) * (th / H);
      tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, tw, th); tg.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) {
        const sc = 1 + i * 0.075; tg.globalAlpha = 0.2 * (1 - i / 10);
        tg.setTransform(sc, 0, 0, sc, px * (1 - sc), py * (1 - sc)); tg.drawImage(c2, 0, 0, tw, th);
      }
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalAlpha = 1;
      gm.globalAlpha = base * post.rays; gm.drawImage(S.tmp, 0, 0, W, H);
    }
    // film grain
    gm.globalCompositeOperation = 'overlay'; gm.globalAlpha = base * (post.grain == null ? 0.09 : post.grain);
    const gt = grain(), ox = Math.floor(Math.random() * 160), oy = Math.floor(Math.random() * 160);
    gm.fillStyle = gm.createPattern(gt, 'repeat'); gm.translate(-ox, -oy); gm.fillRect(0, 0, W + 160, H + 160); gm.translate(ox, oy);
    gm.globalCompositeOperation = 'source-over'; gm.globalAlpha = base;
    // vignette
    const vg = gm.createRadialGradient(W / 2, H / 2, e.R * 0.32, W / 2, H / 2, e.R);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${post.vig == null ? 0.62 : post.vig})`);
    gm.fillStyle = vg; gm.fillRect(0, 0, W, H);
    if (post.flash > 0.01) { gm.fillStyle = `rgba(255,255,255,${post.flash * base})`; gm.fillRect(0, 0, W, H); }
    gm.restore();
  };
})();
