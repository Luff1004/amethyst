/*
  TRANSCENDENT rework kit. Every 10억대 scene on maps 2-5 used to share the generic 'cine' template
  (wireframe + gem). js/cutscenes/tx/map*.js give each one its own hand-built film instead, keeping
  id / name / odds / captions / sound intact and only swapping def.draw (the engine calls it directly).
  This file is just the shared toolbox: post passes, shaded 3D gems via the cine mesh renderer, and
  small maths helpers - each scene's actual idea lives in its own file.
*/
(() => {
  const { seg, rng, clamp, lerp } = G;
  const Cine = G.cine, M = Cine.mesh, TAU = Math.PI * 2;

  const star = M.cluster([
    { m: M.octa(1.35, 0.9), pos: [0, 0, 0] },
    { m: M.octa(1.0, 0.55), pos: [0, 0, 0], rz: Math.PI / 2, s: 1 },
    { m: M.octa(1.0, 0.55), pos: [0, 0, 0], rx: Math.PI / 2, s: 1 },
  ]);
  const MESH = {
    octa: M.octa(), cube: M.cube(0.72), brilliant: M.brilliant(8), prism: M.prism(6, 0.45, 1.6, 0.55),
    spire: M.prism(6, 0.3, 2.1, 0.85, { taper: 0.82 }),
    twin: M.cluster([{ m: M.prism(6, 0.3, 1.5, 0.5), pos: [-0.3, 0, 0], rz: 0.35 }, { m: M.prism(6, 0.3, 1.5, 0.5), pos: [0.3, 0, 0], rz: -0.35 }]),
    cluster: M.cluster([
      { m: M.prism(6, 0.34, 1.7, 0.55), pos: [0, 0.1, 0] },
      { m: M.prism(6, 0.24, 1.1, 0.4), pos: [-0.45, -0.3, 0.1], rz: 0.5 },
      { m: M.prism(6, 0.22, 1.0, 0.4), pos: [0.45, -0.3, -0.1], rz: -0.55 },
      { m: M.prism(6, 0.18, 0.8, 0.3), pos: [0.15, -0.45, 0.35], rz: -0.2, rx: 0.5 },
    ]),
    star,
  };

  const TX = G.tx = {
    TAU,
    bump: (p, a, b) => { const t = seg(p, a, b); return t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI); },
    hsl: (h, s, l, a = 1) => Cine.hsl(h, s, l, a),

    /* replace a registered scene's visuals, keep everything else */
    set(id, draw, extra) {
      const d = G.cutscenes.byId[id];
      if (!d) return;
      d.draw = draw; d.template = null;
      if (extra) Object.assign(d, extra);
    },

    /* a properly shaded, faceted 3D gem (same renderer the rest of the game's gems use) */
    gem(g, kind, x, y, s, hue, t, o = {}) {
      Cine.drawMesh(g, MESH[kind] || MESH.octa, Object.assign({
        x, y, s, rx: 0.32 + Math.sin(t * 0.0007) * 0.12, ry: t * 0.0008, t,
        col: [G.hsl(hue, 90, 82), G.hsl(hue, 82, 52), G.hsl(hue, 70, 12)],
        glow: 0.9, trans: 0.35, shine: 60, glowCol: G.hsl(hue, 95, 65),
      }, o));
    },
    glow(g, x, y, r, hex, a = 1) { g.save(); g.globalCompositeOperation = 'lighter'; Cine.glow(g, x, y, r, hex, a); g.restore(); },
    flare(g, e, x, y, k, hex) { Cine.flare(g, e, x, y, k, hex); },

    dust(g, e, hex, n = 60, seed = 3, drift = 0.004) {
      const r = rng(seed), { W, H, u, time } = e;
      g.fillStyle = hex;
      for (let i = 0; i < n; i++) {
        const x = (r() * W + time * drift * (r() + 0.2) * W / 400) % W, y = (r() * H - time * drift * 0.3 * r() * H / 400 + H * 4) % H;
        g.globalAlpha = (0.1 + 0.3 * r()) * (0.5 + 0.5 * Math.sin(time * 0.002 + i));
        const s = u * (0.15 + r() * 0.3); g.fillRect(x, y, s, s);
      }
      g.globalAlpha = 1;
    },
    flash(g, e, k, hex = '#ffffff') {
      k *= G.flashMul();
      if (k <= 0) return;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
      const fg = g.createRadialGradient(e.cx, e.cy, 0, e.cx, e.cy, e.R);
      fg.addColorStop(0, '#fff'); fg.addColorStop(0.3, hex); fg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fg; g.fillRect(0, 0, e.W, e.H); g.restore();
    },
    tear(g, e, prob, amt = 9) {
      const gr = rng(Math.floor(e.time / 110));
      if (gr() >= prob) return;
      const sx = g.canvas.width / e.W, sy = g.canvas.height / e.H;
      for (let i = 0; i < 4; i++) {
        const y = gr() * e.H, h = e.u * (0.6 + gr() * 3), dx = (gr() - 0.5) * e.u * amt;
        try { g.drawImage(g.canvas, 0, y * sy, e.W * sx, h * sy, dx, y, e.W, h); } catch (err) {}
      }
    },
    scan(g, e, a = 0.08) { g.globalAlpha = a; g.fillStyle = '#000'; for (let y = 0; y < e.H; y += 3) g.fillRect(0, y, e.W, 1); g.globalAlpha = 1; },
    vignette(g, e, a = 0.72, inner = 0.35) {
      const vg = g.createRadialGradient(e.cx, e.cy, e.R * inner, e.cx, e.cy, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${a})`);
      g.fillStyle = vg; g.fillRect(0, 0, e.W, e.H);
    },
    /* two-pass neon stroke of a Path2D: wide soft glow, then a thin hot core */
    neon(g, path, hex, w, a = 1, core = '#ffffff') {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = hex; g.globalAlpha = 0.28 * a; g.lineWidth = w * 4; g.stroke(path);
      g.globalAlpha = 0.9 * a; g.lineWidth = w; g.stroke(path);
      if (core) { g.strokeStyle = core; g.globalAlpha = 0.6 * a; g.lineWidth = w * 0.4; g.stroke(path); }
      g.restore();
    },
    /* seeded branching random walk from (x,y) heading `ang`, returns [{pts:[[x,y]..], w, t0}] in unit space */
    branches(seed, x, y, ang, len, steps, depth = 3, pull = null) {
      const r = rng(seed), out = [];
      const walk = (x0, y0, a, n, w, t0, d) => {
        const pts = [[x0, y0]]; let px = x0, py = y0;
        for (let i = 0; i < n; i++) {
          a += (r() - 0.5) * 0.9;
          if (pull) { const ta = Math.atan2(pull[1] - py, pull[0] - px); let da = ta - a; da -= Math.round(da / TAU) * TAU; a += da * 0.18; }
          px += Math.cos(a) * len; py += Math.sin(a) * len; pts.push([px, py]);
          if (d > 0 && r() < 0.14) walk(px, py, a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6), Math.floor(n * 0.5), w * 0.6, t0 + (i / n) * (1 - t0) * 0.8, d - 1);
        }
        out.push({ pts, w, t0 });
      };
      walk(x, y, ang, steps, 1, 0, depth);
      return out;
    },
    /* draw a polyline partially (k 0..1 of its length) into a path */
    partial(path, pts, k, sx = 1, sy = 1, ox = 0, oy = 0) {
      const n = Math.floor(clamp(k) * (pts.length - 1));
      if (n < 1 && k <= 0) return null;
      path.moveTo(ox + pts[0][0] * sx, oy + pts[0][1] * sy);
      for (let i = 1; i <= n; i++) path.lineTo(ox + pts[i][0] * sx, oy + pts[i][1] * sy);
      const f = clamp(k) * (pts.length - 1) - n;
      if (n + 1 < pts.length && f > 0) { const a = pts[n], b = pts[n + 1]; path.lineTo(ox + lerp(a[0], b[0], f) * sx, oy + lerp(a[1], b[1], f) * sy); return [ox + lerp(a[0], b[0], f) * sx, oy + lerp(a[1], b[1], f) * sy]; }
      return [ox + pts[n][0] * sx, oy + pts[n][1] * sy];
    },
  };
})();
