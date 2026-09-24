/* MAP 5 (Void Rift) TRANSCENDENT films - see js/cutscenes/tx/kit.js */
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TX = G.tx, { TAU, bump } = TX;

  /* ---------------- The Labyrinth's Maker: a maze drafted by hand, raised into 3D, and one door left open ---------------- */
  {
    const N = 9, walls = [];
    {
      const r = rng(151), seen = new Set(['0,0']), st = [[0, 0]], open = new Set();
      while (st.length) {
        const [x, y] = st[st.length - 1];
        const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(a + ',' + b));
        if (!nb.length) { st.pop(); continue; }
        const [a, b] = nb[Math.floor(r() * nb.length)];
        open.add([x, y, a, b].join()); open.add([a, b, x, y].join()); seen.add(a + ',' + b); st.push([a, b]);
      }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (x < N - 1 && !open.has([x, y, x + 1, y].join())) walls.push([x + 1, y, x + 1, y + 1]);
        if (y < N - 1 && !open.has([x, y, x, y + 1].join())) walls.push([x, y + 1, x + 1, y + 1]);
      }
      for (let i = 0; i < N; i++) { walls.push([i, 0, i + 1, 0]); walls.push([i, N, i + 1, N]); walls.push([0, i, 0, i + 1]); if (i !== 4) walls.push([N, i, N, i + 1]); }
      walls.forEach((w, i) => { w.ord = (w[1] + w[3]) * 20 + ((w[1] | 0) % 2 ? N * 2 - w[0] - w[2] : w[0] + w[2]); });
      const ords = walls.map(w => w.ord).sort((a, b) => a - b);
      walls.forEach(w => { w.t = ords.indexOf(w.ord) / walls.length; });
    }
    TX.set('labyrinthmaker', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), s = m * 0.075;
      const draft = seg(p, 0.03, 0.33), iso = E.inOut(seg(p, 0.33, 0.47)), hgt = E.outBack(seg(p, 0.38, 0.5));
      const zk = E.inCubic(seg(p, 0.5, 0.64));
      g.fillStyle = '#0c0212'; g.fillRect(0, 0, W, H);
      const pt = (gx, gy) => [lerp((gx - 4.5) * s, (gx - gy) * s * 0.72, iso), lerp((gy - 4.5) * s, (gx + gy - 9) * s * 0.36 + s * 0.6, iso)];
      const door = pt(9, 4.5), Z = lerp(1, 9, zk * zk);
      g.save(); g.translate(cx, cy); g.scale(Z, Z); g.translate(-door[0] * zk, -(door[1] - s * 0.4 * hgt) * zk);
      // blueprint grid
      g.strokeStyle = `rgba(255,120,220,${0.08 * (1 - iso)})`; g.lineWidth = 1 / Z;
      g.beginPath();
      for (let i = -12; i <= 12; i++) { g.moveTo(i * s * 0.5, -m); g.lineTo(i * s * 0.5, m); g.moveTo(-m, i * s * 0.5); g.lineTo(m, i * s * 0.5); }
      g.stroke();
      // walls, sorted far -> near so the 3D faces overlap correctly
      const hWall = s * 0.9 * hgt, list = walls.filter(w => w.t <= draft).sort((a, b) => (a[0] + a[1] + a[2] + a[3]) - (b[0] + b[1] + b[2] + b[3]));
      let pen = null;
      for (const w of list) {
        const k = clamp((draft - w.t) * walls.length / 3);
        const A = pt(w[0], w[1]), B0 = pt(w[2], w[3]), B = [lerp(A[0], B0[0], k), lerp(A[1], B0[1], k)];
        if (k < 1) pen = B;
        if (hWall > 0.5) {
          g.fillStyle = w[0] === w[2] ? '#3a0f3e' : '#5a1a5c';
          g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(B[0], B[1] - hWall); g.lineTo(A[0], A[1] - hWall); g.closePath(); g.fill();
        }
        g.strokeStyle = '#ff7ad8'; g.lineWidth = u * 0.35 / Math.sqrt(Z); g.lineCap = 'round';
        g.beginPath(); g.moveTo(A[0], A[1] - hWall); g.lineTo(B[0], B[1] - hWall); g.stroke();
      }
      // the one unlocked door, spilling light
      const dl = seg(p, 0.42, 0.55);
      if (dl > 0) {
        const [dx, dy] = door;
        g.save(); g.globalCompositeOperation = 'lighter';
        const lg = g.createRadialGradient(dx, dy - hWall / 2, 0, dx, dy - hWall / 2, s * 3);
        lg.addColorStop(0, `rgba(255,230,250,${0.9 * dl})`); lg.addColorStop(1, 'rgba(255,60,200,0)');
        g.fillStyle = lg; g.fillRect(dx - s * 3, dy - s * 3, s * 6, s * 6);
        g.fillStyle = `rgba(255,245,255,${dl})`;
        g.beginPath(); g.moveTo(dx - s * 0.3, dy - s * 0.15); g.lineTo(dx + s * 0.3, dy + s * 0.15); g.lineTo(dx + s * 0.3, dy + s * 0.15 - hWall); g.lineTo(dx - s * 0.3, dy - s * 0.15 - hWall); g.fill();
        g.restore();
      }
      g.restore();
      // the drafting pen
      if (pen && draft < 1) {
        const x = cx + pen[0], y = cy + pen[1];
        TX.glow(g, x, y, u * 5, '#ff7ad8', 1);
        g.strokeStyle = 'rgba(255,200,240,0.5)'; g.lineWidth = u * 0.3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + u * 6, y - u * 14); g.stroke();
      }
      // through the door: the light, and what was waiting in it
      const white = seg(p, 0.58, 0.64), rv = E.outCubic(seg(p, 0.63, 0.75));
      if (white > 0) { g.fillStyle = `rgba(255,236,250,${white * (1 - rv * 0.9)})`; g.fillRect(0, 0, W, H); }
      if (rv > 0) {
        const bg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
        bg.addColorStop(0, `rgba(120,20,90,${rv})`); bg.addColorStop(1, `rgba(12,2,18,${rv})`);
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.save(); g.globalAlpha = 0.25 * rv; g.strokeStyle = '#ff7ad8'; g.lineWidth = u * 0.25;
        for (let i = 0; i < 6; i++) { const r = m * (0.2 + i * 0.09) + (time * 0.02) % (m * 0.09); g.strokeRect(cx - r, cy - r * 0.8, r * 2, r * 1.6); }
        g.restore();
        TX.gem(g, 'spire', cx, cy, m * 0.15 * E.outBack(rv), 322, time);
      }
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- 创世的回声: one crack in black glass rings outward, echoes off the edges of the world, then runs backward ---------------- */
  {
    const cracks = [], r0 = rng(161);
    for (let i = 0; i < 26; i++) {
      const x = (r0() - 0.5) * 1.6, y = (r0() - 0.5) * 2;
      cracks.push({ x, y, d: Math.hypot(x, y), b: TX.branches(170 + i, 0, 0, r0() * TAU, 0.025, 6, 1) });
    }
    TX.set('genesisecho', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), rev = E.inCubic(seg(p, 0.54, 0.63)), shrink = 1 - rev;
      g.fillStyle = '#05020a'; g.fillRect(0, 0, W, H);
      const sheen = g.createLinearGradient(0, 0, W, H);
      sheen.addColorStop(0, 'rgba(120,80,200,0.08)'); sheen.addColorStop(0.5, 'rgba(0,0,0,0)'); sheen.addColorStop(1, 'rgba(80,40,160,0.06)');
      g.fillStyle = sheen; g.fillRect(0, 0, W, H);
      const t0 = e.def.duration * 0.04, speed = m * 0.00018, period = 850;
      const sources = [[cx, cy, 1], [-cx, cy, 0.55], [2 * W - cx, cy, 0.55], [cx, -cy, 0.55], [cx, 2 * H - cy, 0.55]];
      g.save(); g.globalCompositeOperation = 'lighter';
      if (time > t0) {
        for (let k = 0; k < 16; k++) {
          const age = (time - t0) - k * period;
          if (age < 0) continue;
          const r = age * speed;
          for (const [sx, sy, a] of sources) {
            const x = lerp(cx, sx, shrink), y = lerp(cy, sy, shrink), rr = r * shrink;
            const fade = a * clamp(1 - r / (e.R * 2.2));
            if (fade <= 0 || rr < 1) continue;
            g.strokeStyle = `rgba(190,140,255,${0.6 * fade})`; g.lineWidth = u * 0.6;
            g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke();
            g.strokeStyle = `rgba(255,255,255,${0.2 * fade})`; g.lineWidth = u * 0.15; g.stroke();
          }
        }
      }
      g.restore();
      // new hairline cracks wherever the first wave has passed
      const path = new Path2D();
      const firstR = Math.max(0, time - t0) * speed;
      for (const c of cracks) {
        const reach = clamp((firstR - c.d * m * 0.5) / (m * 0.1));
        if (reach <= 0) continue;
        c.b.forEach(b => TX.partial(path, b.pts, reach, m * shrink, m * shrink, cx + c.x * m * 0.5 * shrink, cy + c.y * m * 0.5 * shrink));
      }
      TX.neon(g, path, '#b58cff', u * 0.25, 0.8);
      // the first crack
      const fc = seg(p, 0.02, 0.06);
      if (fc > 0) {
        const cp = new Path2D(); cp.moveTo(cx - m * 0.06 * fc * shrink, cy + m * 0.02 * fc); cp.lineTo(cx - m * 0.01, cy - m * 0.01); cp.lineTo(cx + m * 0.02 * fc, cy + m * 0.015); cp.lineTo(cx + m * 0.07 * fc * shrink, cy - m * 0.02 * fc);
        TX.neon(g, cp, '#d0b0ff', u * 0.5, 1);
      }
      const rv = E.outCubic(seg(p, 0.61, 0.73));
      if (rv > 0) {
        TX.glow(g, cx, cy, m * 0.5, '#8a5aff', 0.6 * rv);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const r = (m * 0.18 + ((time * 0.03 + i * m * 0.12) % (m * 0.6)));
          g.strokeStyle = `rgba(190,150,255,${0.3 * rv * (1 - r / (m * 0.8))})`; g.lineWidth = u * 0.3;
          g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
        }
        g.restore();
        TX.gem(g, 'octa', cx, cy, m * 0.15 * E.outBack(rv), 280, time);
      }
      TX.flash(g, e, 0.9 * bump(p, 0.6, 0.68), '#b890ff');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- Sovereign of the Rift: the screen tears, every other fracture turns toward the tear, and they crown it ---------------- */
  {
    const GL = '01<>/\\|#%$&*アイウエオカキクケコ░▒▓';
    let buf = null, key = '';
    const rift = [], r0 = rng(181);
    for (let i = 0; i <= 24; i++) rift.push([(r0() - 0.5) * 0.08 + (i % 2 ? 0.02 : -0.02), i / 24]);
    const fr = [];
    for (let i = 0; i < 14; i++) { const side = i % 2 ? 1 : -1, y = r0(); fr.push(...TX.branches(190 + i, side * (0.3 + r0() * 0.18), y * 1.6 - 0.8, side > 0 ? Math.PI : 0, 0.03, 12, 1, [0, y * 1.6 - 0.8]).map(b => Object.assign(b, { st: r0() * 0.2 }))); }
    const CROWN = [[-0.2, 0.06], [-0.2, -0.08], [-0.1, 0.0], [0, -0.14], [0.1, 0.0], [0.2, -0.08], [0.2, 0.06]];
    TX.set('riftsovereign2', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), tear = E.outCubic(seg(p, 0.04, 0.2)), gap = m * lerp(0.01, 0.05, tear) + m * 0.12 * E.inOut(seg(p, 0.6, 0.7));
      const k = W + 'x' + H;
      if (!buf || key !== k) {
        buf = document.createElement('canvas'); buf.width = Math.ceil(W); buf.height = Math.ceil(H); key = k;
        const bg = buf.getContext('2d'), r = rng(7), cs = u * 2.6;
        bg.fillStyle = '#05030c'; bg.fillRect(0, 0, W, H);
        bg.font = `${cs * 0.8}px ui-monospace,Consolas,monospace`;
        for (let y = cs; y < H; y += cs) for (let x = 0; x < W; x += cs * 0.7) {
          const v = r(); if (v < 0.35) continue;
          bg.fillStyle = `rgba(${140 + Math.round(60 * r())},110,255,${0.06 + 0.16 * r()})`;
          bg.fillText(GL[Math.floor(r() * GL.length)], x, y);
        }
      }
      const scroll = (time * 0.02) % H;
      const riftX = y => cx + rift[Math.min(24, Math.floor(y / H * 24))][0] * m;
      const half = side => {
        g.save(); g.beginPath();
        if (side < 0) { g.moveTo(0, 0); rift.forEach(([x, y]) => g.lineTo(cx + x * m, y * H)); g.lineTo(0, H); }
        else { g.moveTo(W, 0); rift.forEach(([x, y]) => g.lineTo(cx + x * m, y * H)); g.lineTo(W, H); }
        g.closePath(); g.clip(); g.translate(side * gap / 2, 0);
        g.drawImage(buf, 0, scroll - H, W, H); g.drawImage(buf, 0, scroll, W, H);
        g.restore();
      };
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      // what's inside the tear: raw violet static
      if (tear > 0) {
        const sr = rng(Math.floor(time / 50));
        for (let y = 0; y < H; y += u * 1.2) {
          const x = riftX(y);
          g.fillStyle = `rgba(${150 + Math.round(100 * sr())},${60 + Math.round(80 * sr())},255,${0.5 + 0.5 * sr()})`;
          g.fillRect(x - gap / 2, y, gap * sr(), u * 1.2);
        }
        TX.glow(g, cx, cy, m * 0.3 + gap * 2, '#9a4aff', 0.4 + tear * 0.4);
      }
      half(-1); half(1);
      // edges of the tear
      const ep = new Path2D();
      for (const sd of [-1, 1]) rift.forEach(([x, y], i) => (i ? ep.lineTo(cx + x * m + sd * gap / 2, y * H) : ep.moveTo(cx + x * m + sd * gap / 2, y * H)));
      TX.neon(g, ep, '#b36bff', u * 0.4, tear);
      // fractures crawl in from both sides and all bend toward the tear
      const fp = new Path2D(), fk = seg(p, 0.2, 0.52), fo = 1 - seg(p, 0.55, 0.64);
      for (const b of fr) TX.partial(fp, b.pts, clamp((fk - b.st) / 0.8), m, m, cx, cy);
      TX.neon(g, fp, '#8a5aff', u * 0.3, 0.9 * fo);
      // ...and crown it
      const ck = E.inOut(seg(p, 0.5, 0.64));
      if (ck > 0) {
        const cp = new Path2D(), cyy = cy - m * 0.2;
        const n = Math.max(2, Math.ceil(ck * CROWN.length));
        CROWN.slice(0, n).forEach(([x, y], i) => (i ? cp.lineTo(cx + x * m, cyy + y * m) : cp.moveTo(cx + x * m, cyy + y * m)));
        TX.neon(g, cp, '#d9a8ff', u * 0.6, ck);
        for (const [x, y] of CROWN) if (y < -0.05) TX.glow(g, cx + x * m, cyy + y * m, u * 4, '#ffffff', ck);
      }
      const rv = E.outCubic(seg(p, 0.62, 0.74));
      if (rv > 0) TX.gem(g, 'cube', cx, cy + m * 0.02, m * 0.14 * E.outBack(rv), 260, time);
      TX.tear(g, e, 0.08 + 0.3 * bump(p, 0.55, 0.7));
      TX.flash(g, e, 0.8 * bump(p, 0.61, 0.69), '#b890ff');
      TX.scan(g, e, 0.1);
      TX.vignette(g, e, 0.65);
    });
  }

  /* ---------------- صدى الوجود: a voice made visible - sand on a vibrating plate settling into Chladni figures ---------------- */
  {
    const MODES = [[1, 2], [1, 3], [2, 5], [3, 5]], NP = 1800;
    const f = (n, mm, x, y) => Math.cos(n * Math.PI * x) * Math.cos(mm * Math.PI * y) - Math.cos(mm * Math.PI * x) * Math.cos(n * Math.PI * y);
    const settle = (n, mm, x, y) => {
      for (let i = 0; i < 10; i++) {
        const v = f(n, mm, x, y), h = 1e-3;
        const fx = (f(n, mm, x + h, y) - v) / h, fy = (f(n, mm, x, y + h) - v) / h, gg = fx * fx + fy * fy || 1;
        x = clamp(x - v * fx / gg, -1, 1); y = clamp(y - v * fy / gg, -1, 1);
      }
      return [x, y];
    };
    const r0 = rng(201), start = [], layouts = MODES.map(() => []);
    for (let i = 0; i < NP; i++) {
      const x = r0() * 2 - 1, y = r0() * 2 - 1;
      start.push([x, y]);
      MODES.forEach(([n, mm], k) => layouts[k].push(settle(n, mm, x + (r0() - 0.5) * 0.12, y + (r0() - 0.5) * 0.12)));
    }
    const W8 = [[0.08, 0.2], [0.26, 0.34], [0.4, 0.46], [0.52, 0.58]];
    TX.set('existenceecho', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), S = m * 0.36;
      let from = start, to = layouts[0], k = 0, shake = 0;
      for (let i = 0; i < W8.length; i++) {
        const [a, b] = W8[i];
        if (p >= a) { from = i ? layouts[i - 1] : start; to = layouts[i]; k = E.inOut(seg(p, a, b)); shake = bump(p, a - 0.02, a + 0.08); }
      }
      if (p < W8[0][0]) { from = start; to = start; k = 0; shake = 0.3; }
      const gather = E.inCubic(seg(p, 0.58, 0.64)), rv = E.outCubic(seg(p, 0.62, 0.74));
      g.fillStyle = '#01060c'; g.fillRect(0, 0, W, H);
      // the plate
      const jx = (rng(Math.floor(time / 25))() - 0.5) * u * 0.6 * (shake + 0.2);
      g.save(); g.translate(jx, 0);
      const pg = g.createLinearGradient(cx - S, cy - S, cx + S, cy + S);
      pg.addColorStop(0, '#14222c'); pg.addColorStop(0.5, '#0a141b'); pg.addColorStop(1, '#162630');
      g.fillStyle = pg; g.fillRect(cx - S * 1.05, cy - S * 1.05, S * 2.1, S * 2.1);
      g.strokeStyle = 'rgba(140,210,255,0.35)'; g.lineWidth = u * 0.3; g.strokeRect(cx - S * 1.05, cy - S * 1.05, S * 2.1, S * 2.1);
      // sound waves radiating from the plate's center
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const r = ((time * 0.05 + i * S * 0.4) % (S * 1.6));
        g.strokeStyle = `rgba(120,200,255,${0.12 * (1 - r / (S * 1.6))})`; g.lineWidth = u * 0.3;
        g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
      }
      g.restore();
      // the sand
      g.fillStyle = 'rgba(220,245,255,0.85)';
      const sr = rng(Math.floor(time / 40));
      for (let i = 0; i < NP; i++) {
        let x = lerp(from[i][0], to[i][0], k), y = lerp(from[i][1], to[i][1], k);
        x += (sr() - 0.5) * 0.04 * shake; y += (sr() - 0.5) * 0.04 * shake;
        x *= 1 - gather; y *= 1 - gather;
        if (rv > 0) { const a = Math.atan2(y, x) + time * 0.0002, d = Math.hypot(x, y) + rv * 0.5 * (0.5 + (i % 7) / 14); x = Math.cos(a) * d; y = Math.sin(a) * d; }
        g.fillRect(cx + x * S, cy + y * S, u * 0.32, u * 0.32);
      }
      g.restore();
      if (rv > 0) {
        TX.glow(g, cx, cy, m * 0.4, '#5ad0ff', 0.6 * rv);
        TX.gem(g, 'twin', cx, cy, m * 0.15 * E.outBack(rv), 200, time);
      }
      TX.flash(g, e, 0.85 * bump(p, 0.61, 0.69), '#a0e0ff');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- 迷宫尽头: first-person through the corridors until they all open into one round chamber ---------------- */
  {
    const segs = [], r0 = rng(211);
    for (let i = 0; i < 80; i++) segs.push({ openL: r0() < 0.18, openR: r0() < 0.18, lamp: r0() < 0.3 });
    const bend = z => [Math.sin(z * 0.19) * 0.9 + Math.sin(z * 0.05) * 1.2, Math.sin(z * 0.11) * 0.25];
    TX.set('mazeend', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), travel = (time / 1000) * (1.5 + 3 * p * p);
      const fold = E.inOut(seg(p, 0.5, 0.62)), K = m * 0.5 * (1 + fold * 4);
      g.fillStyle = '#060106'; g.fillRect(0, 0, W, H);
      const base = Math.floor(travel), cam = bend(travel);
      const frame = zi => {
        const z = zi - travel; if (z < 0.2) return null;
        const b = bend(zi), s = K / z, x = cx + (b[0] - cam[0]) * s, y = cy + (b[1] - cam[1]) * s;
        return { x, y, w: s * 0.8, h: s * 0.62, z };
      };
      if (fold < 1) {
        g.save(); g.globalAlpha = 1 - fold;
        for (let j = 30; j >= 1; j--) {
          const A = frame(base + j), B = frame(base + j - 1);
          if (!A || !B) continue;
          const sg = segs[((base + j) % 80 + 80) % 80], lit = Math.pow(clamp(1 - A.z / 30), 1.5);
          const quad = (a, b, c, d, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.fill(); };
          const shade = (k) => `rgb(${Math.round(20 + 90 * lit * k)},${Math.round(4 + 14 * lit * k)},${Math.round(14 + 40 * lit * k)})`;
          quad([A.x - A.w, A.y + A.h], [A.x + A.w, A.y + A.h], [B.x + B.w, B.y + B.h], [B.x - B.w, B.y + B.h], shade(0.55));
          quad([A.x - A.w, A.y - A.h], [A.x + A.w, A.y - A.h], [B.x + B.w, B.y - B.h], [B.x - B.w, B.y - B.h], shade(0.3));
          if (!sg.openL) quad([A.x - A.w, A.y - A.h], [A.x - A.w, A.y + A.h], [B.x - B.w, B.y + B.h], [B.x - B.w, B.y - B.h], shade(0.8));
          if (!sg.openR) quad([A.x + A.w, A.y - A.h], [A.x + A.w, A.y + A.h], [B.x + B.w, B.y + B.h], [B.x + B.w, B.y - B.h], shade(0.7));
          g.strokeStyle = `rgba(255,90,150,${0.6 * lit})`; g.lineWidth = Math.max(0.5, u * 0.4 / A.z * 3);
          g.strokeRect(A.x - A.w, A.y - A.h, A.w * 2, A.h * 2);
          if (sg.lamp) TX.glow(g, A.x, A.y - A.h * 0.9, A.w * 0.4, '#ff5a8a', 0.6 * lit);
        }
        g.restore();
      }
      // the chamber at the end of every corridor
      const ch = E.outCubic(seg(p, 0.55, 0.7));
      if (ch > 0) {
        g.save(); g.globalAlpha = ch;
        const fy = cy + m * 0.2, fr = m * 0.62;
        const fg = g.createRadialGradient(cx, fy, 0, cx, fy, fr);
        fg.addColorStop(0, '#5a1030'); fg.addColorStop(1, '#12020a');
        g.fillStyle = fg; g.beginPath(); g.ellipse(cx, fy, fr, fr * 0.28, 0, 0, TAU); g.fill();
        // doorways all around the rim - every corridor you walked ends here
        const arches = [];
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + time * 0.00003; arches.push([Math.cos(a), Math.sin(a)]); }
        arches.sort((a, b) => a[1] - b[1]).forEach(([c, s]) => {
          const x = cx + c * fr * 0.92, y = fy + s * fr * 0.26, sc = 0.6 + 0.4 * (s + 1) / 2, aw = m * 0.05 * sc, ah = m * 0.16 * sc;
          g.fillStyle = '#020001'; g.beginPath(); g.moveTo(x - aw, y); g.lineTo(x - aw, y - ah); g.arc(x, y - ah, aw, Math.PI, 0); g.lineTo(x + aw, y); g.fill();
          g.strokeStyle = 'rgba(255,90,150,0.5)'; g.lineWidth = u * 0.3; g.stroke();
        });
        g.fillStyle = '#2a0818'; g.fillRect(cx - m * 0.06, fy - m * 0.1, m * 0.12, m * 0.1);
        g.strokeStyle = 'rgba(255,120,170,0.6)'; g.strokeRect(cx - m * 0.06, fy - m * 0.1, m * 0.12, m * 0.1);
        g.restore();
      }
      const rv = E.outCubic(seg(p, 0.63, 0.76));
      if (rv > 0) {
        TX.glow(g, cx, cy, m * 0.4, '#ff4a8a', 0.6 * rv);
        TX.gem(g, 'prism', cx, cy - m * 0.02, m * 0.13 * E.outBack(rv), 340, time);
      }
      TX.flash(g, e, 0.85 * bump(p, 0.62, 0.7), '#ff8ab0');
      TX.vignette(g, e, 0.75);
    });
  }

  /* ---------------- The Eye That Waits: security footage of your own crystal, day after day... and it was an eye all along ---------------- */
  {
    const cctv = (g, x, y, r, time, p, u) => {
      const dayK = 0.5 + 0.5 * Math.sin(time * 0.0014), night = dayK < 0.3;
      const bg = g.createLinearGradient(x, y - r, x, y + r);
      bg.addColorStop(0, `rgb(${Math.round(20 + 40 * dayK)},${Math.round(30 + 60 * dayK)},${Math.round(24 + 40 * dayK)})`); bg.addColorStop(1, `rgb(${Math.round(10 + 20 * dayK)},${Math.round(16 + 30 * dayK)},${Math.round(12 + 20 * dayK)})`);
      g.fillStyle = bg; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.strokeStyle = 'rgba(160,255,190,0.18)'; g.lineWidth = r * 0.006;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(x + i * r * 0.16, y + r * 0.2); g.lineTo(x + i * r * 0.5, y + r); g.stroke(); }
      g.beginPath(); g.moveTo(x - r, y + r * 0.2); g.lineTo(x + r, y + r * 0.2); g.stroke();
      g.fillStyle = 'rgba(40,70,50,0.9)'; g.fillRect(x - r * 0.12, y + r * 0.05, r * 0.24, r * 0.18);
      TX.gem(g, 'octa', x, y - r * 0.08, r * 0.14, 280, time, { glow: night ? 1.2 : 0.4, sparkle: 0.3 });
      // someone mining it: a flash of the pickaxe every so often (but never at night...mostly)
      const hit = (time % 700) < 90 && !night;
      if (hit) { g.fillStyle = 'rgba(220,255,230,0.8)'; for (let i = 0; i < 6; i++) { const a = i * 1.1 + time; g.fillRect(x + Math.cos(a) * r * 0.1, y - r * 0.08 + Math.sin(a) * r * 0.1, r * 0.012, r * 0.012); } }
      // monochrome green
      g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(60,255,120,0.55)'; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
      const nr = rng(Math.floor(time / 45));
      g.fillStyle = 'rgba(200,255,210,0.08)';
      for (let i = 0; i < 80; i++) g.fillRect(x - r + nr() * r * 2, y - r + nr() * r * 2, r * 0.008, r * 0.008);
      return { night, dayK };
    };
    TX.set('eyethatwaits', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), pull = E.inOut(seg(p, 0.5, 0.64));
      const Rv = lerp(e.R * 1.05, m * 0.1, pull);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      // the eye around the footage (only visible once we pull back)
      if (pull > 0) {
        const Ri = Rv * 3.2;
        const L = Ri * 1.9, Hh = Ri * 1.05;
        g.save();
        g.beginPath(); g.moveTo(cx - L, cy); g.quadraticCurveTo(cx, cy - 2 * Hh, cx + L, cy); g.quadraticCurveTo(cx, cy + 2 * Hh, cx - L, cy); g.closePath();
        g.fillStyle = '#281a1a'; g.fill(); g.clip();
        const ig = g.createRadialGradient(cx, cy, Rv, cx, cy, Ri);
        ig.addColorStop(0, '#2a0000'); ig.addColorStop(0.3, '#b01010'); ig.addColorStop(0.75, '#5a0404'); ig.addColorStop(1, '#100000');
        g.fillStyle = ig; g.beginPath(); g.arc(cx, cy, Ri, 0, TAU); g.fill();
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = u * 0.2;
        const fr = rng(4);
        for (let i = 0; i < 140; i++) {
          const a = i / 140 * TAU + (fr() - 0.5) * 0.03, r1 = Rv * (1.05 + fr() * 0.2), r2 = Ri * (0.7 + fr() * 0.28);
          g.strokeStyle = `rgba(255,${60 + Math.round(80 * fr())},40,${0.15 + 0.2 * fr()})`;
          g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.quadraticCurveTo(cx + Math.cos(a + 0.08) * (r1 + r2) / 2, cy + Math.sin(a + 0.08) * (r1 + r2) / 2, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke();
        }
        g.restore();
        g.restore();
        g.strokeStyle = 'rgba(255,60,60,0.5)'; g.lineWidth = u * 0.4;
        g.beginPath(); g.moveTo(cx - L, cy); g.quadraticCurveTo(cx, cy - 2 * Hh, cx + L, cy); g.quadraticCurveTo(cx, cy + 2 * Hh, cx - L, cy); g.stroke();
      }
      // the footage - which is the pupil
      g.save(); g.beginPath(); g.arc(cx, cy, Rv, 0, TAU); g.clip();
      const st = cctv(g, cx, cy, Rv, time, p, u);
      const vg = g.createRadialGradient(cx, cy, Rv * 0.5, cx, cy, Rv);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)');
      g.fillStyle = vg; g.fillRect(cx - Rv, cy - Rv, Rv * 2, Rv * 2);
      g.restore();
      // camera overlay
      if (pull < 1) {
        g.save(); g.globalAlpha = 1 - pull;
        g.font = `${u * 2.4}px ui-monospace,Consolas,monospace`; g.fillStyle = '#c8ffd4';
        const day = 1 + Math.floor(time / 4500), hh = Math.floor((time % 4500) / 4500 * 24), mm = Math.floor((time * 7) % 60);
        g.textAlign = 'left'; g.fillText(`CAM 00   DAY ${String(day).padStart(4, '0')}   ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, u * 4, H * 0.17);
        g.textAlign = 'right'; if (Math.floor(time / 500) % 2) { g.fillStyle = '#ff3a3a'; g.fillText('● REC', W - u * 4, H * 0.17); }
        g.fillStyle = '#c8ffd4'; g.fillText(st.night ? 'MOTION: NONE' : 'MOTION: DETECTED', W - u * 4, H * 0.84);
        g.restore();
      }
      // it was the eye's pupil; now it narrows onto you and the gem sits in its dark
      const rv = E.outCubic(seg(p, 0.62, 0.74));
      if (rv > 0) {
        g.fillStyle = `rgba(0,0,0,${0.85 * rv})`; g.beginPath(); g.arc(cx, cy, Rv * 1.02, 0, TAU); g.fill();
        TX.glow(g, cx, cy, m * 0.35, '#ff2a2a', 0.5 * rv);
        TX.gem(g, 'octa', cx, cy, m * 0.13 * E.outBack(rv), 0, time);
      }
      TX.tear(g, e, pull < 1 ? 0.12 : 0.05, 6);
      TX.flash(g, e, 0.85 * bump(p, 0.61, 0.69), '#ff5a5a');
      TX.scan(g, e, 0.12 * (1 - rv * 0.5));
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- الحقيقة الأخيرة: a geometric truth drawn above, a scrambled reflection below - until they agree ---------------- */
  {
    const star8 = (path, x, y, r, rot) => {
      for (const off of [0, Math.PI / 4]) {
        for (let k = 0; k <= 4; k++) { const a = rot + off + k / 4 * TAU; k ? path.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : path.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      }
      const ri = r * 0.54;
      for (let k = 0; k <= 8; k++) { const a = rot + Math.PI / 8 + k / 8 * TAU; k ? path.lineTo(x + Math.cos(a) * ri, y + Math.sin(a) * ri) : path.moveTo(x + Math.cos(a) * ri, y + Math.sin(a) * ri); }
    };
    const scr = [], r0 = rng(221);
    for (let i = 0; i < 200; i++) scr.push([(r0() - 0.5) * 2, (r0() - 0.5) * 2, (r0() - 0.5) * 3, r0()]);
    TX.set('finaltruth', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), cs = m * 0.16, r = cs * 0.46;
      const draw = seg(p, 0.03, 0.45), agree = E.inOut(seg(p, 0.3, 0.6));
      g.fillStyle = '#020a0e'; g.fillRect(0, 0, W, H);
      const top = new Path2D(), bot = new Path2D();
      const nx = Math.ceil(W / cs / 2) + 1, ny = Math.ceil(cy / cs) + 1;
      let idx = 0;
      for (let j = 0; j <= ny; j++) for (let i = -nx; i <= nx; i++) {
        const x = cx + i * cs, y = cy - cs * 0.5 - j * cs, d = Math.hypot(i, j) / (nx + ny);
        const k = clamp((draw - d * 0.6) / 0.4);
        if (k <= 0) { idx++; continue; }
        const rr = r * E.outBack(k);
        star8(top, x, y, rr, 0);
        top.moveTo(x + rr, y); top.lineTo(x + cs - rr, y); top.moveTo(x, y + rr); top.lineTo(x, y + cs - rr);
        const s = scr[idx++ % scr.length], dis = 1 - agree;
        const bx = x + s[0] * cs * dis, by = 2 * cy - y + s[1] * cs * dis, rot = s[2] * dis;
        star8(bot, bx, by, rr * (1 - 0.4 * dis * s[3]), rot);
      }
      TX.neon(g, top, '#4ad8ff', u * 0.35, 0.9, '#e8fbff');
      g.save(); g.globalAlpha = lerp(0.35, 1, agree);
      TX.neon(g, bot, agree > 0.95 ? '#4ad8ff' : '#ff9a4a', u * 0.35, 0.8, null);
      g.restore();
      // the mirror line
      const ml = g.createLinearGradient(0, 0, W, 0);
      ml.addColorStop(0, 'rgba(160,240,255,0)'); ml.addColorStop(0.5, 'rgba(220,250,255,0.9)'); ml.addColorStop(1, 'rgba(160,240,255,0)');
      g.fillStyle = ml; g.fillRect(0, cy - u * 0.15, W, u * 0.3);
      TX.glow(g, cx, cy, m * 0.2 + m * 0.3 * agree, '#6ae4ff', 0.3 + 0.5 * agree);
      const rv = E.outCubic(seg(p, 0.63, 0.75));
      if (rv > 0) {
        const clr = g.createRadialGradient(cx, cy, 0, cx, cy, m * 0.35);
        clr.addColorStop(0, `rgba(2,10,14,${0.9 * rv})`); clr.addColorStop(1, 'rgba(2,10,14,0)');
        g.fillStyle = clr; g.fillRect(0, 0, W, H);
        TX.gem(g, 'star', cx, cy, m * 0.15 * E.outBack(rv), 190, time);
        g.save(); g.globalAlpha = 0.35 * rv; g.scale(1, -1);
        TX.gem(g, 'star', cx, -(cy + m * 0.3), m * 0.12 * E.outBack(rv), 190, time, { glow: 0.3, sparkle: 0 });
        g.restore();
      }
      TX.flash(g, e, 0.85 * bump(p, 0.62, 0.7), '#9aeaff');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- 永恒回归: every mineral in the game spirals home into one - and then flows back out again ---------------- */
  {
    let pts = null;
    const build = () => {
      const list = G.cutscenes.list, r = rng(231);
      pts = list.map((c, i) => ({ id: c.id, hue: c.hue != null ? c.hue : (i * 37) % 360, arm: i % 4, t: r(), s: 0.5 + r() * 0.8, tier: c.tierIdx || 0 }));
    };
    TX.set('eternalreturn', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      if (!pts || pts.length !== G.cutscenes.list.length) build();
      const m = Math.min(W, H);
      const inflow = E.outCubic(seg(p, 0, 0.3)), tighten = seg(p, 0.3, 0.58), collapse = E.inCubic(seg(p, 0.56, 0.64));
      const out = seg(p, 0.66, 1), rv = E.outCubic(seg(p, 0.62, 0.74));
      g.fillStyle = '#07010a'; g.fillRect(0, 0, W, H);
      const bg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
      bg.addColorStop(0, `rgba(90,20,90,${0.3 + 0.4 * tighten})`); bg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      const codex = (G.state && G.state.codex) || {};
      let found = 0;
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const q of pts) {
        const have = codex[q.id] && codex[q.id].n > 0; if (have) found++;
        let d, a;
        if (p < 0.64) {
          d = lerp(1.6, q.t * 0.9 + 0.1, inflow) * (1 - tighten * 0.35) * (1 - collapse);
          a = q.arm / 4 * TAU + Math.log(d + 0.05) * 2.4 + time * 0.00025 * (1 + tighten * 3) / (d + 0.3);
        } else {
          d = (q.t * 0.9 + 0.1) * out * 1.1;
          a = q.arm / 4 * TAU + Math.log(d + 0.05) * 2.4 + time * 0.00025 / (d + 0.3);
        }
        const x = cx + Math.cos(a) * d * m * 0.6, y = cy + Math.sin(a) * d * m * 0.6 * 0.72;
        const sz = u * (0.35 + q.tier * 0.1) * q.s * (have ? 1.5 : 1);
        g.fillStyle = TX.hsl(q.hue, 90, have ? 70 : 55, have ? 0.95 : 0.5);
        g.beginPath(); g.moveTo(x, y - sz); g.lineTo(x + sz * 0.6, y); g.lineTo(x, y + sz); g.lineTo(x - sz * 0.6, y); g.fill();
        if (q.tier >= 7) G.cine.star(g, x, y, sz * 3, G.hsl(q.hue, 90, 75), 0.6);
      }
      g.restore();
      // the count: every one of them, coming home
      if (p > 0.08 && p < 0.62) {
        const n = Math.round(pts.length * seg(p, 0.1, 0.56));
        g.save(); g.font = `${u * 2.4}px ui-monospace,Consolas,monospace`; g.textAlign = 'center';
        g.fillStyle = `rgba(255,190,255,${0.6 * (1 - collapse)})`;
        g.fillText(`${n} / ${pts.length}`, cx, H * 0.82);
        g.restore();
      }
      TX.glow(g, cx, cy, m * (0.08 + 0.4 * collapse + 0.2 * rv), '#ff7af0', 0.4 + 0.6 * tighten);
      if (rv > 0) TX.gem(g, 'star', cx, cy, m * 0.16 * E.outBack(rv), (300 + time * 0.02) % 360, time);
      TX.flash(g, e, 0.95 * bump(p, 0.61, 0.69), '#ffb0ff');
      TX.vignette(g, e, 0.65);
    });
  }
})();
