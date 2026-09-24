/* MAP 4 (Molten Core) TRANSCENDENT films - see js/cutscenes/tx/kit.js */
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TX = G.tx, { TAU, bump } = TX;

  const flames = (g, x, y, w, h, time, seed, a = 1) => {
    const r = rng(seed);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const ox = (r() - 0.5) * w, ph = r() * 10, hh = h * (0.5 + 0.5 * r()) * (0.75 + 0.25 * Math.sin(time * 0.012 + ph));
      const sway = Math.sin(time * 0.006 + ph) * w * 0.08, fw = w * (0.08 + r() * 0.1);
      const fg = g.createLinearGradient(0, y, 0, y - hh);
      fg.addColorStop(0, `rgba(255,240,180,${0.5 * a})`); fg.addColorStop(0.3, `rgba(255,120,30,${0.4 * a})`); fg.addColorStop(1, 'rgba(120,10,0,0)');
      g.fillStyle = fg; g.beginPath(); g.moveTo(x + ox - fw, y);
      g.quadraticCurveTo(x + ox - fw * 0.8 + sway, y - hh * 0.6, x + ox + sway * 2, y - hh);
      g.quadraticCurveTo(x + ox + fw * 0.8 + sway, y - hh * 0.6, x + ox + fw, y); g.fill();
    }
    g.restore();
  };

  /* ---------------- The Infernal Core: straight down through the strata, into the fire that never went out ---------------- */
  {
    const bands = [], r0 = rng(91);
    let acc = 0;
    for (let i = 0; i < 90; i++) { const h = 0.02 + r0() * 0.05; bands.push({ y: acc, h, n: r0() }); acc += h; }
    const TOTAL = acc;
    const bandCol = (d, n) => {
      const C = [[70, 48, 30], [58, 56, 60], [40, 30, 32], [90, 24, 12], [200, 70, 20]];
      const k = clamp(d) * (C.length - 1), i = Math.min(C.length - 2, Math.floor(k)), f = k - i;
      return C[i].map((v, j) => Math.round(lerp(v, C[i + 1][j], f) * (0.8 + 0.4 * n)));
    };
    TX.set('infernalcore', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), D = Math.pow(seg(p, 0, 0.58), 1.25), open = E.inOut(seg(p, 0.52, 0.64));
      const scroll = D * (TOTAL - 1.4);
      g.fillStyle = '#1a0402'; g.fillRect(0, 0, W, H);
      // strata rushing past; the deeper, the hotter - glowing cracks and heat shimmer
      for (const b of bands) {
        const y0 = (b.y - scroll) * H, h = b.h * H;
        if (y0 > H || y0 + h < 0) continue;
        const d = b.y / TOTAL, [r, gg, bb] = bandCol(d, b.n);
        const wob = d > 0.5 ? Math.sin(time * 0.01 + b.y * 40) * u * 1.2 * d : 0;
        g.fillStyle = `rgb(${r},${gg},${bb})`; g.fillRect(wob, y0, W, h + 1);
        if (d > 0.45) {
          g.strokeStyle = `rgba(255,${Math.round(90 + 100 * d)},30,${0.6 * d})`; g.lineWidth = u * 0.3;
          const cr = rng(Math.floor(b.y * 1000)); g.beginPath();
          let x = cr() * W; g.moveTo(x, y0);
          for (let s = 0; s < 5; s++) { x += (cr() - 0.5) * u * 8; g.lineTo(x, y0 + h * (s + 1) / 5); }
          g.stroke();
        }
      }
      // the floor falls away: the molten sea
      if (open > 0) {
        g.save(); g.globalAlpha = open;
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#2a0500'); sky.addColorStop(0.6, '#8a1a04'); sky.addColorStop(1, '#ffb03a');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        const sea = H * 0.74;
        const lg = g.createLinearGradient(0, sea, 0, H);
        lg.addColorStop(0, '#fff0b0'); lg.addColorStop(0.2, '#ff8a1a'); lg.addColorStop(1, '#6a0e00');
        g.fillStyle = lg; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 40) g.lineTo(x, sea + Math.sin(x * 0.02 + time * 0.002) * u * 1.2 + Math.sin(x * 0.05 - time * 0.003) * u * 0.6);
        g.lineTo(W, H); g.fill();
        // cooling crust plates drifting on the surface
        const cr = rng(5);
        for (let i = 0; i < 14; i++) {
          const x = (cr() * W + time * 0.01 * (cr() + 0.3)) % (W * 1.2) - W * 0.1, y = sea + u * 2 + cr() * (H - sea) * 0.8;
          g.fillStyle = 'rgba(40,6,0,0.7)'; g.beginPath(); g.ellipse(x, y, u * (3 + cr() * 5), u * (0.6 + cr()), 0, 0, TAU); g.fill();
        }
        g.restore();
      }
      // embers everywhere
      g.save(); g.globalCompositeOperation = 'lighter';
      const er = rng(6);
      for (let i = 0; i < 60; i++) {
        const x = er() * W + Math.sin(time * 0.001 + i) * u * 3, y = H - ((er() * H + time * 0.05 * (0.4 + er())) % H);
        g.fillStyle = `rgba(255,${120 + Math.round(100 * er())},40,${0.3 + 0.5 * D})`; g.fillRect(x, y, u * 0.3, u * 0.3);
      }
      g.restore();
      // thermometer
      const temp = Math.round(15 + 5385 * Math.pow(seg(p, 0, 0.6), 1.6));
      g.save(); g.font = `${u * 2.6}px ui-monospace,Consolas,monospace`; g.textAlign = 'left';
      g.fillStyle = `rgba(255,200,150,${0.8 * (1 - seg(p, 0.62, 0.7))})`;
      g.fillText(p > 0.58 && Math.floor(time / 90) % 2 ? '∞ °C' : `${temp.toLocaleString()} °C`, u * 4, H * 0.5);
      g.restore();
      // the core rises from the sea, wrapped in fire
      const rv = E.outCubic(seg(p, 0.6, 0.74)), gy = lerp(H * 0.85, cy, rv);
      if (rv > 0) {
        flames(g, cx, gy + m * 0.16, m * 0.5, m * 0.55 * rv, time, 12, rv);
        TX.gem(g, 'spire', cx, gy, m * 0.15 * rv, 8, time);
        flames(g, cx, gy + m * 0.18, m * 0.3, m * 0.25 * rv, time, 13, rv * 0.7);
      }
      TX.flash(g, e, 0.9 * bump(p, 0.61, 0.68), '#ff7a2a');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- Obsidian Singularity: a black hole bends the stars, drinks its own fire, and turns out to have a shape ---------------- */
  {
    const stars = [], r0 = rng(101);
    for (let i = 0; i < 380; i++) stars.push({ a: r0() * TAU, d: 0.05 + Math.sqrt(r0()) * 1.1, s: 0.3 + r0(), h: r0() });
    const disk = [], r1 = rng(102);
    for (let i = 0; i < 900; i++) disk.push({ a: r1() * TAU, d: 1.35 + Math.pow(r1(), 1.6) * 1.7, s: r1() });
    TX.set('obsidiansingularity', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), Rs = m * 0.13 * lerp(0.35, 1, E.outCubic(seg(p, 0.05, 0.4)));
      const drain = seg(p, 0.35, 0.62), tilt = 0.2;
      g.fillStyle = '#010005'; g.fillRect(0, 0, W, H);
      // lensed starfield: every star pushed outward around the shadow (an Einstein ring forms)
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const s of stars) {
        const d0 = s.d * e.R * 0.9, a = s.a + time * 0.00002;
        const d = d0 + (Rs * Rs * 2.2) / Math.max(d0, 1);
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        const stretch = clamp(Rs * 3 / d0);
        g.fillStyle = s.h > 0.8 ? '#ffd9b0' : '#cfd8ff'; g.globalAlpha = 0.4 + 0.5 * s.s;
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2);
        g.fillRect(-u * 0.15 * s.s * (1 + stretch * 6), -u * 0.12 * s.s, u * 0.3 * s.s * (1 + stretch * 6), u * 0.24 * s.s);
        g.restore();
      }
      g.restore();
      const hot = t => { // disk colour cools from white-gold to bruised violet as it drinks the heat
        const r = Math.round(lerp(255, 120, drain) * (0.6 + 0.4 * t)), gg = Math.round(lerp(lerp(120, 230, t), 40, drain)), b = Math.round(lerp(lerp(40, 180, t), 220, drain));
        return `rgb(${r},${gg},${b})`;
      };
      const drawDisk = back => {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const q of disk) {
          const a = q.a + time * 0.0012 / (q.d * q.d) * (1 + drain * 2);
          const sn = Math.sin(a);
          if (back ? sn > 0 : sn <= 0) continue;
          const pull = 1 - drain * 0.25 * q.s, rr = Rs * q.d * pull;
          const x = cx + Math.cos(a) * rr, y = cy + sn * rr * tilt;
          const dop = 0.55 + 0.45 * -Math.cos(a);
          g.globalAlpha = (0.3 + 0.6 * dop) * (1 - (q.d - 1.35) / 2);
          g.fillStyle = hot(1 - (q.d - 1.35) / 1.7);
          g.fillRect(x, y, u * 0.45, u * 0.3);
        }
        g.restore();
      };
      drawDisk(true);
      // the lensed back of the disk, thrown up over the top and under the bottom of the shadow
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = hot(0.8 - k * 0.2); g.globalAlpha = 0.35 - k * 0.08; g.lineWidth = u * (1.4 - k * 0.3);
        g.beginPath(); g.ellipse(cx, cy, Rs * (1.3 + k * 0.12), Rs * (1.18 + k * 0.1), 0, Math.PI, TAU); g.stroke();
        g.globalAlpha *= 0.5; g.beginPath(); g.ellipse(cx, cy, Rs * (1.3 + k * 0.12), Rs * (1.12 + k * 0.1), 0, 0, Math.PI); g.stroke();
      }
      g.restore();
      // shadow + photon ring
      g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, Rs, 0, TAU); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = drain > 0.5 ? '#c9a0ff' : '#ffe8c0';
      g.globalAlpha = 0.9; g.lineWidth = u * 0.35; g.beginPath(); g.arc(cx, cy, Rs * 1.04, 0, TAU); g.stroke(); g.restore();
      drawDisk(false);
      // it has a shape: an obsidian octahedron, rim-lit in violet, sitting where the dark was
      const rv = E.outCubic(seg(p, 0.6, 0.74));
      if (rv > 0) {
        TX.glow(g, cx, cy, m * 0.4, '#8a4aff', 0.5 * rv);
        TX.gem(g, 'octa', cx, cy, m * 0.15 * lerp(0.6, 1, rv), 268, time, { alpha: rv, col: [G.hsl(268, 80, 72), G.hsl(268, 30, 14), '#000000'], shine: 80 });
      }
      TX.flash(g, e, 0.9 * bump(p, 0.61, 0.68), '#b890ff');
      TX.vignette(g, e, 0.6);
    });
  }

  /* ---------------- The Pressure Monarch: mountains stack up, graphite gives in, diamond is what's left ---------------- */
  {
    const ridges = [], r0 = rng(111);
    for (let i = 0; i < 7; i++) { const pts = []; for (let k = 0; k <= 20; k++) pts.push(r0()); ridges.push({ pts, st: 0.02 + i * 0.035 }); }
    // lattice: same atoms, two arrangements - hexagonal graphite sheets vs. a tight diamond-cubic projection
    const atoms = [], NX = 9, NY = 7;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const gx = (i + (j % 2) * 0.5 - NX / 2) * 0.12, gy = (j - NY / 2) * 0.2;
      const dx = (i - NX / 2) * 0.085 + ((j % 2) ? 0.0425 : 0), dy = (j - NY / 2) * 0.085 + ((i % 2) ? 0.03 : 0);
      atoms.push({ a: [gx, gy], b: [dx, dy] });
    }
    const bonds = (key, maxD) => {
      const out = [];
      for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
        const A = atoms[i][key], B = atoms[j][key];
        if (Math.hypot(A[0] - B[0], A[1] - B[1]) < maxD) out.push([i, j]);
      }
      return out;
    };
    const BA = bonds('a', 0.125), BB = bonds('b', 0.1);
    TX.set('pressuremonarch', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H);
      const lat = E.inOut(seg(p, 0.26, 0.34)), squeeze = E.inOut(seg(p, 0.34, 0.58)), latOut = seg(p, 0.6, 0.66);
      g.fillStyle = '#02070b'; g.fillRect(0, 0, W, H);
      // mountains landing on each other, one age at a time
      if (lat < 1) {
        g.save(); g.globalAlpha = 1 - lat;
        ridges.forEach((r, i) => {
          const land = E.outBack(seg(p, r.st, r.st + 0.06)), base = H * (0.95 - i * 0.07);
          const y0 = lerp(-H * 0.3, base, land);
          g.fillStyle = `rgb(${14 + i * 6},${24 + i * 8},${34 + i * 9})`;
          g.beginPath(); g.moveTo(0, H);
          r.pts.forEach((v, k) => g.lineTo(k / 20 * W, y0 - v * m * 0.12 - Math.sin(k * 0.6 + i) * m * 0.03));
          g.lineTo(W, H); g.fill();
          g.strokeStyle = 'rgba(160,220,255,0.25)'; g.lineWidth = u * 0.25; g.stroke();
          const imp = bump(p, r.st + 0.055, r.st + 0.09);
          if (imp > 0) { g.fillStyle = `rgba(180,200,210,${0.25 * imp})`; g.fillRect(0, y0 - m * 0.05, W, m * 0.08); }
        });
        g.restore();
      }
      // down to the atoms: hexagonal sheets forced into diamond
      if (lat > 0 && latOut < 1) {
        const s = m * 1.05, alpha = lat * (1 - latOut);
        const P = atoms.map(A => [cx + lerp(A.a[0], A.b[0], squeeze) * s, cy + lerp(A.a[1], A.b[1], squeeze) * s]);
        g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
        g.strokeStyle = `rgba(150,160,170,${1 - squeeze})`; g.lineWidth = u * 0.4;
        g.beginPath(); BA.forEach(([i, j]) => { g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); }); g.stroke();
        g.strokeStyle = `rgba(160,240,255,${squeeze})`; g.lineWidth = u * 0.5;
        g.beginPath(); BB.forEach(([i, j]) => { g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); }); g.stroke();
        for (const [x, y] of P) {
          const ag = g.createRadialGradient(x - u * 0.3, y - u * 0.3, 0, x, y, u * 1.3);
          ag.addColorStop(0, squeeze > 0.5 ? '#ffffff' : '#d0d4d8'); ag.addColorStop(1, squeeze > 0.5 ? '#3aa0d0' : '#30343a');
          g.fillStyle = ag; g.beginPath(); g.arc(x, y, u * 1.2, 0, TAU); g.fill();
        }
        // the pressure itself: arrows bearing down from above and below
        const pr = 0.5 + 0.5 * Math.sin(time * 0.01);
        g.fillStyle = `rgba(140,210,255,${0.3 + 0.3 * pr})`;
        for (let i = -3; i <= 3; i++) for (const sd of [-1, 1]) {
          const x = cx + i * m * 0.1, y = cy + sd * m * lerp(0.42, 0.32, squeeze);
          g.beginPath(); g.moveTo(x - u * 1.5, y + sd * u * 3); g.lineTo(x + u * 1.5, y + sd * u * 3); g.lineTo(x, y); g.fill();
        }
        g.restore();
      }
      // the diamond: white fire, scattering spectral sparks
      const rv = E.outCubic(seg(p, 0.6, 0.74));
      if (rv > 0) {
        TX.glow(g, cx, cy, m * 0.45, '#bfefff', 0.5 * rv);
        TX.gem(g, 'brilliant', cx, cy, m * 0.17 * E.outBack(rv), 195, time, { col: ['#ffffff', '#cfefff', '#5a7a8a'], rx: 0.9 + Math.sin(time * 0.0006) * 0.2, shine: 90 });
        g.save(); g.globalCompositeOperation = 'lighter';
        const sr = rng(Math.floor(time / 160));
        for (let i = 0; i < 10; i++) {
          const a = sr() * TAU, d = m * (0.12 + sr() * 0.16);
          G.cine.star(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, m * 0.03 * sr(), G.hsl(sr() * 360, 90, 70), rv * sr());
        }
        g.restore();
      }
      TX.flash(g, e, 0.9 * bump(p, 0.62, 0.69), '#dff6ff');
      TX.vignette(g, e, 0.65);
    });
  }

  /* ---------------- The Ashen Throne: ash settles into a throne - and something is already sitting on it ---------------- */
  {
    const THRONE = [[-0.2, 0.36], [-0.2, 0.12], [-0.26, 0.1], [-0.26, 0.02], [-0.16, 0.02], [-0.16, -0.36], [-0.1, -0.44], [0, -0.4], [0.1, -0.44], [0.16, -0.36], [0.16, 0.02], [0.26, 0.02], [0.26, 0.1], [0.2, 0.12], [0.2, 0.36]];
    const pts = [];
    {
      const c = document.createElement('canvas'), cg = c.getContext('2d'), pth = new Path2D();
      THRONE.forEach(([x, y], i) => (i ? pth.lineTo(x, y) : pth.moveTo(x, y))); pth.closePath();
      const r = rng(121);
      while (pts.length < 1700) { const x = (r() - 0.5) * 0.6, y = (r() - 0.5) * 0.9; if (cg.isPointInPath(pth, x, y)) pts.push({ x, y, t: 0.08 + (0.36 - y) / 0.8 * 0.45 + r() * 0.08, sx: (r() - 0.5) * 0.8, ember: r() < 0.1, s: r() }); }
    }
    const trees = [];
    for (let i = 0; i < 9; i++) trees.push(TX.branches(130 + i, (i + 0.5) / 9, 0, -Math.PI / 2, 0.018, 10, 2));
    TX.set('ashenthrone', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), hz = H * 0.78, ty = cy + m * 0.05;
      const sky = g.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#0d0907'); sky.addColorStop(1, '#3a2014');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      // burnt trees on the horizon, ground with ember seams
      const tp = new Path2D();
      trees.forEach(bs => bs.forEach(b => TX.partial(tp, b.pts, 1, W * 0.9, H * 0.9, W * 0.05, hz)));
      g.strokeStyle = '#0a0605'; g.lineWidth = u * 0.6; g.lineCap = 'round'; g.stroke(tp);
      g.fillStyle = '#120c0a'; g.fillRect(0, hz, W, H - hz);
      g.save(); g.globalCompositeOperation = 'lighter';
      const sr = rng(4);
      for (let i = 0; i < 10; i++) {
        const x = sr() * W, w = u * (5 + sr() * 10), pul = 0.5 + 0.5 * Math.sin(time * 0.002 + i);
        g.strokeStyle = `rgba(255,${90 + Math.round(60 * pul)},30,${0.35 * pul})`; g.lineWidth = u * 0.3;
        g.beginPath(); g.moveTo(x, hz + u * 2 + sr() * (H - hz) * 0.6); g.lineTo(x + w, hz + u * 3 + sr() * (H - hz) * 0.6); g.stroke();
      }
      g.restore();
      // falling ash, some of it landing on the throne's shape
      const ignite = seg(p, 0.55, 0.66);
      g.save();
      for (const q of pts) {
        const land = seg(p, q.t - 0.14, q.t), tx = cx + q.x * m, tyy = ty + q.y * m;
        let x = tx, y = tyy;
        if (land < 1) { x = tx + q.sx * m * (1 - land) + Math.sin(time * 0.002 + q.s * 20) * u * 2 * (1 - land); y = lerp(-u * 4, tyy, land); if (land <= 0) continue; }
        const glow = q.ember ? 0.5 + 0.5 * Math.sin(time * 0.004 + q.s * 30) : 0;
        g.fillStyle = q.ember || ignite > q.s ? `rgba(255,${Math.round(100 + 90 * glow)},40,${0.6 + 0.4 * glow})` : `rgba(${150 + q.s * 50},${140 + q.s * 40},${130 + q.s * 30},0.8)`;
        g.fillRect(x, y, u * 0.55, u * 0.55);
      }
      g.restore();
      // free ash snow over everything
      const ar = rng(7);
      g.fillStyle = 'rgba(200,190,180,0.5)';
      for (let i = 0; i < 90; i++) { const x = (ar() * W + Math.sin(time * 0.0007 + i) * u * 4), y = (ar() * H + time * 0.012 * (0.5 + ar())) % H; g.fillRect(x, y, u * 0.3, u * 0.3); }
      // the throne burns from inside; something sits on it
      if (ignite > 0) TX.glow(g, cx, ty, m * 0.5, '#ff6a1a', 0.6 * ignite);
      const rv = E.outCubic(seg(p, 0.6, 0.74));
      if (rv > 0) {
        g.save(); g.globalAlpha = 0.5 * rv;
        const fg = g.createRadialGradient(cx, ty - m * 0.2, 0, cx, ty - m * 0.2, m * 0.3);
        fg.addColorStop(0, 'rgba(0,0,0,0.9)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = fg; g.beginPath(); g.ellipse(cx, ty - m * 0.2, m * 0.16, m * 0.3, 0, 0, TAU); g.fill();
        g.restore();
        const blink = Math.sin(time * 0.0009) > 0.97 ? 0.1 : 1;
        for (const sx of [-1, 1]) {
          TX.glow(g, cx + sx * m * 0.035, ty - m * 0.33, m * 0.05, '#ff5a1a', rv);
          g.fillStyle = '#ffd08a'; g.beginPath(); g.ellipse(cx + sx * m * 0.035, ty - m * 0.33, m * 0.012, m * 0.006 * blink, 0, 0, TAU); g.fill();
        }
        TX.gem(g, 'cluster', cx, ty - m * 0.05, m * 0.12 * E.outBack(rv), 30, time);
      }
      TX.flash(g, e, 0.8 * bump(p, 0.61, 0.68), '#ff9a4a');
      TX.vignette(g, e, 0.75);
    });
  }

  /* ---------------- The Heart of Creation: a molten star with a heartbeat that speeds up... until a piece of it breaks off toward you ---------------- */
  {
    // beat times (ms), accelerating: period 1400ms -> 480ms
    const BEATS = []; { let t = 600, per = 1400; while (t < 12600) { BEATS.push(t); t += per; per = Math.max(480, per * 0.9); } }
    const beatAt = t => { let v = 0; for (const b of BEATS) { const d = t - b; if (d > -60 && d < 700) v += Math.exp(-Math.pow(d / 60, 2)) + 0.55 * Math.exp(-Math.pow((d - 230) / 55, 2)); } return v; };
    const ecg = t => { let v = 0; for (const b of BEATS) { const d = t - b; if (d > -100 && d < 500) v += Math.exp(-Math.pow(d / 14, 2)) * 1 - Math.exp(-Math.pow((d - 30) / 16, 2)) * 0.35 + Math.exp(-Math.pow((d - 260) / 60, 2)) * 0.25; } return v; };
    const fil = [], r0 = rng(141);
    for (let i = 0; i < 9; i++) fil.push({ a: r0() * TAU, w: 0.3 + r0() * 0.5, h: 0.2 + r0() * 0.35, ph: r0() * 10 });
    TX.set('heartofcreation', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), beat = beatAt(time), rv = E.outCubic(seg(p, 0.62, 0.76));
      const recede = lerp(1, 0.45, rv), sx = cx, sy = lerp(cy, cy - m * 0.08, rv);
      const R = m * 0.2 * recede * (1 + 0.1 * beat);
      g.fillStyle = '#080100'; g.fillRect(0, 0, W, H);
      TX.dust(g, e, '#ffb080', 60, 17, 0.001);
      // shockwave rings from each beat
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const b of BEATS) {
        const d = time - b; if (d < 0 || d > 1600) continue;
        const k = d / 1600;
        g.strokeStyle = `rgba(255,140,60,${0.5 * (1 - k)})`; g.lineWidth = u * (1.2 - k);
        g.beginPath(); g.arc(sx, sy, m * 0.2 * recede + k * e.R * 0.9, 0, TAU); g.stroke();
      }
      g.restore();
      TX.glow(g, sx, sy, R * 3, '#ff5a1a', 0.5 + 0.5 * beat);
      // coronal filaments looping off the surface
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const f of fil) {
        const a0 = f.a + time * 0.00005, a1 = a0 + f.w, hh = R * (1 + f.h * (0.8 + 0.4 * Math.sin(time * 0.002 + f.ph)) + beat * 0.08);
        g.strokeStyle = 'rgba(255,170,80,0.5)'; g.lineWidth = u * 0.6;
        g.beginPath(); g.moveTo(sx + Math.cos(a0) * R, sy + Math.sin(a0) * R);
        g.quadraticCurveTo(sx + Math.cos((a0 + a1) / 2) * hh * 1.5, sy + Math.sin((a0 + a1) / 2) * hh * 1.5, sx + Math.cos(a1) * R, sy + Math.sin(a1) * R); g.stroke();
      }
      g.restore();
      // the star: granulated molten surface
      g.save(); g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip();
      const sg = g.createRadialGradient(sx - R * 0.2, sy - R * 0.2, 0, sx, sy, R);
      sg.addColorStop(0, '#fff6d0'); sg.addColorStop(0.45, '#ffb030'); sg.addColorStop(0.85, '#e0400a'); sg.addColorStop(1, '#6a0e00');
      g.fillStyle = sg; g.fillRect(sx - R, sy - R, R * 2, R * 2);
      const gr = rng(9);
      for (let i = 0; i < 60; i++) {
        const a = gr() * TAU, d = Math.sqrt(gr()) * R, x = sx + Math.cos(a + time * 0.00008) * d, y = sy + Math.sin(a + time * 0.00008) * d;
        g.fillStyle = `rgba(${gr() < 0.5 ? '255,240,180' : '120,20,0'},${0.18 + 0.1 * Math.sin(time * 0.003 + i)})`;
        g.beginPath(); g.arc(x, y, R * (0.05 + gr() * 0.08), 0, TAU); g.fill();
      }
      // the crack a fragment is about to leave through
      const crackK = seg(p, 0.5, 0.62);
      if (crackK > 0) {
        g.strokeStyle = '#ffffff'; g.lineWidth = u * 0.5; g.shadowColor = '#fff'; g.shadowBlur = u * 3;
        g.beginPath(); g.moveTo(sx + R * 0.1, sy - R * 0.1);
        const cr = rng(3); for (let i = 0; i < 6 * crackK; i++) g.lineTo(sx + R * (0.1 + (cr() - 0.3) * 0.5), sy + R * (-0.1 + (cr() - 0.3) * 0.6));
        g.stroke(); g.shadowBlur = 0;
      }
      g.restore();
      // ECG trace along the bottom
      g.save(); g.globalAlpha = 1 - rv * 0.7;
      const ep = new Path2D(), base = H * 0.8;
      for (let x = 0; x <= W; x += 2) { const t = time - (W - x) * 6; x ? ep.lineTo(x, base - ecg(t) * m * 0.08) : ep.moveTo(x, base - ecg(t) * m * 0.08); }
      TX.neon(g, ep, '#ff5a3a', u * 0.35, 0.9);
      g.restore();
      // a fragment tears free and flies at you
      if (rv > 0) {
        const fx = lerp(sx + R * 0.2, cx, rv), fy = lerp(sy, cy + m * 0.04, rv);
        TX.gem(g, 'star', fx, fy, m * lerp(0.03, 0.17, rv), 12, time);
      }
      TX.flash(g, e, 0.9 * bump(p, 0.62, 0.69), '#ffb070');
      TX.vignette(g, e, 0.7);
    });
  }
})();
