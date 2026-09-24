/* MAP 2 (Deep Vein) TRANSCENDENT films - see js/cutscenes/tx/kit.js */
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TX = G.tx, { TAU, bump } = TX;

  /* ---------------- Planetary Core: accretion -> a living planet -> cutaway -> dive into its crystal core ---------------- */
  {
    const disk = [], r0 = rng(11);
    for (let i = 0; i < 520; i++) disk.push({ a: r0() * TAU, d: 0.35 + r0() * 1.4, sp: 0.6 + r0() * 0.8, s: 0.3 + r0() * 0.9, h: r0() });
    const lands = [], r1 = rng(12);
    for (let i = 0; i < 26; i++) lands.push({ lon: r1() * TAU, lat: (r1() - 0.5) * 2.2, s: 0.12 + r1() * 0.22 });
    const LAYERS = [[1, '#5a3a22'], [0.86, '#c2471b'], [0.62, '#f29d2a'], [0.4, '#ffe38a'], [0.22, '#bff0ff']];
    TX.set('planetarycore', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), zoom = lerp(1, 3.6, E.inOut(seg(p, 0.54, 0.65)));
      const form = E.outCubic(seg(p, 0.08, 0.34)), cut = E.outBack(seg(p, 0.4, 0.56)), planetA = 1 - seg(p, 0.63, 0.7);
      const Rp = m * 0.25 * zoom * lerp(0.2, 1, form);
      g.fillStyle = '#02060c'; g.fillRect(0, 0, W, H);
      TX.dust(g, e, '#9fd6ff', 90, 4, 0.001);

      // accretion disk: tilted ring of debris spiralling in, feeding the planet
      g.save(); g.globalCompositeOperation = 'lighter';
      const feed = 1 - seg(p, 0.3, 0.5);
      for (const d of disk) {
        const rr = m * 0.25 * zoom * (1 + d.d * (1 - form * 0.6)) , a = d.a + time * 0.0004 * d.sp / d.d;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.32;
        if (Math.sin(a) < 0 && Math.hypot(x - cx, (y - cy)) < Rp) continue;
        g.globalAlpha = feed * (0.25 + 0.6 * (1 - d.d / 1.8));
        g.fillStyle = d.h > 0.7 ? '#ffd9a0' : '#7cc4ff';
        g.fillRect(x, y, u * 0.35 * d.s, u * 0.35 * d.s);
      }
      g.restore();

      if (planetA > 0) {
        g.save(); g.globalAlpha = planetA;
        TX.glow(g, cx, cy, Rp * 1.35, '#4aa8ff', 0.5);
        g.save(); g.beginPath(); g.arc(cx, cy, Rp, 0, TAU); g.clip();
        const og = g.createRadialGradient(cx - Rp * 0.3, cy - Rp * 0.3, Rp * 0.1, cx, cy, Rp);
        og.addColorStop(0, '#3d8fe0'); og.addColorStop(1, '#0a2447');
        g.fillStyle = og; g.fillRect(cx - Rp, cy - Rp, Rp * 2, Rp * 2);
        const rot = time * 0.00035;
        for (const l of lands) {
          const lo = l.lon + rot, c = Math.cos(lo);
          if (c <= 0) continue;
          const x = cx + Rp * Math.cos(l.lat * 0.6) * Math.sin(lo), y = cy + Rp * Math.sin(l.lat * 0.6);
          g.fillStyle = l.s > 0.25 ? '#3f7a3a' : '#6b8f45'; g.globalAlpha = planetA * 0.85;
          g.beginPath(); g.ellipse(x, y, Rp * l.s * Math.sqrt(c), Rp * l.s * 0.7, 0, 0, TAU); g.fill();
        }
        g.globalAlpha = planetA;
        const sh = g.createLinearGradient(cx - Rp, cy - Rp * 0.4, cx + Rp, cy + Rp * 0.4);
        sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.55, 'rgba(0,0,0,0.1)'); sh.addColorStop(1, 'rgba(0,0,8,0.85)');
        g.fillStyle = sh; g.fillRect(cx - Rp, cy - Rp, Rp * 2, Rp * 2);

        // the cutaway wedge: a quarter sliced out, showing crust -> mantle -> outer core -> inner core
        if (cut > 0) {
          const half = 0.78 * cut, dir = -Math.PI / 4;
          g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, Rp * 1.01, dir - half, dir + half); g.closePath(); g.clip();
          for (const [k, c] of LAYERS) {
            g.fillStyle = c; g.beginPath(); g.arc(cx, cy, Rp * k, 0, TAU); g.fill();
            g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = u * 0.25; g.stroke();
          }
          const pul = 0.6 + 0.4 * Math.sin(time * 0.006);
          TX.glow(g, cx, cy, Rp * 0.34, '#bff0ff', pul);
        }
        g.restore();
        // atmosphere rim
        g.strokeStyle = 'rgba(120,200,255,0.55)'; g.lineWidth = u * 0.6; g.beginPath(); g.arc(cx, cy, Rp * 1.01, 0, TAU); g.stroke();
        g.restore();
      }

      // reveal: the inner core was a gem the whole time - the layers become orbit rings around it
      const rv = E.outCubic(seg(p, 0.62, 0.74));
      if (rv > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        LAYERS.forEach(([k, c], i) => {
          const rr = m * (0.2 + k * 0.28) * rv, tilt = 0.3 + i * 0.05;
          g.strokeStyle = c; g.globalAlpha = 0.5 * rv; g.lineWidth = u * (0.3 + 0.15 * i);
          g.beginPath(); g.ellipse(cx, cy, rr, rr * tilt, time * 0.0002 * (i % 2 ? 1 : -1), 0, TAU); g.stroke();
          const a = time * 0.001 * (1 + i * 0.3);
          g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * tilt, u * 0.6, 0, TAU); g.fill();
        });
        g.restore();
        TX.gem(g, 'prism', cx, cy, m * 0.15 * lerp(1.6, 1, rv), 200, time, { alpha: rv });
      }
      TX.flash(g, e, 0.9 * bump(p, 0.6, 0.68), '#8fd8ff');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- Abyssal Sovereign: the descent, the thing that passes, the two eyes that become one gem ---------------- */
  {
    const snow = [], r0 = rng(21);
    for (let i = 0; i < 160; i++) snow.push({ x: r0(), y: r0(), z: 0.3 + r0() * 0.7 });
    const lum = [], r1 = rng(22);
    for (let i = 0; i < 40; i++) lum.push({ t: r1(), o: (r1() - 0.5) * 0.08 });
    TX.set('abyssalsovereign', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), dark = seg(p, 0, 0.45);
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, `rgb(${Math.round(lerp(10, 1, dark))},${Math.round(lerp(60, 2, dark))},${Math.round(lerp(80, 6, dark))})`);
      bg.addColorStop(1, `rgb(0,${Math.round(lerp(14, 0, dark))},${Math.round(lerp(26, 2, dark))})`);
      g.fillStyle = bg; g.fillRect(0, 0, W, H);

      // god rays from the surface, dying out as we sink
      if (dark < 1) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
          const x = W * (0.15 + i * 0.15) + Math.sin(time * 0.0004 + i) * u * 4;
          const rg = g.createLinearGradient(0, 0, 0, H * 0.8);
          rg.addColorStop(0, `rgba(120,220,255,${0.12 * (1 - dark)})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = rg; g.beginPath(); g.moveTo(x - u * 2, 0); g.lineTo(x + u * 2, 0); g.lineTo(x + u * 14, H * 0.8); g.lineTo(x - u * 6, H * 0.8); g.fill();
        }
        g.restore();
      }

      // marine snow streams upward - we're the ones falling
      const fall = time * 0.00012;
      g.fillStyle = '#cfe8ee';
      for (const s of snow) {
        const y = ((s.y - fall * s.z * 3) % 1 + 1) % 1;
        g.globalAlpha = 0.15 + 0.35 * s.z;
        g.fillRect(s.x * W + Math.sin(time * 0.001 + s.y * 20) * u, y * H, u * 0.25 * s.z, u * 0.25 * s.z);
      }
      g.globalAlpha = 1;

      // the sovereign passes: a vast body sliding across, only its lateral line of lights visible
      const pass = seg(p, 0.28, 0.6);
      if (pass > 0 && pass < 1) {
        const body = new Path2D(), pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = i / 40, x = W * (1.3 - pass * 2.2) + t * W * 1.6, y = cy + Math.sin(t * 5 + time * 0.0008) * m * 0.06 + m * 0.05;
          pts.push([x, y, Math.sin(t * Math.PI) * m * 0.2]);
        }
        pts.forEach(([x, y, w], i) => (i ? body.lineTo(x, y - w) : body.moveTo(x, y - w)));
        for (let i = pts.length - 1; i >= 0; i--) body.lineTo(pts[i][0], pts[i][1] + pts[i][2] * 0.7);
        const bgr = g.createLinearGradient(0, cy - m * 0.25, 0, cy + m * 0.25);
        bgr.addColorStop(0, 'rgba(60,20,16,0.9)'); bgr.addColorStop(0.5, 'rgba(8,2,2,0.95)'); bgr.addColorStop(1, 'rgba(0,0,0,0.95)');
        g.fillStyle = bgr; g.fill(body);
        g.save(); g.globalCompositeOperation = 'lighter';
        g.strokeStyle = 'rgba(255,90,50,0.35)'; g.lineWidth = u * 0.5; g.stroke(body);
        g.strokeStyle = 'rgba(255,90,50,0.12)'; g.lineWidth = u * 2.5; g.stroke(body);
        for (const l of lum) {
          const i = Math.floor(l.t * 40), [x, y, w] = pts[i];
          const blink = 0.5 + 0.5 * Math.sin(time * 0.004 + l.t * 30);
          g.fillStyle = `rgba(255,${120 + 60 * blink},90,${0.7 * blink})`;
          g.beginPath(); g.arc(x, y - w * 0.2 + l.o * m, u * 0.5, 0, TAU); g.fill();
        }
        g.restore();
      }

      // two eyes open in the dark... then drift together and fuse into one twin gem
      const open = E.outCubic(seg(p, 0.5, 0.58)), fuse = E.inOut(seg(p, 0.58, 0.64)), rv = seg(p, 0.63, 0.72);
      if (open > 0 && rv < 1) {
        const sep = m * 0.24 * (1 - fuse), er = m * 0.07 * (1 - fuse * 0.6);
        g.save(); g.globalAlpha = 1 - rv;
        for (const sx of [-1, 1]) {
          const x = cx + sx * sep, y = cy;
          TX.glow(g, x, y, er * 3, '#ff3a1a', 0.6 * open);
          g.fillStyle = '#ff5a2a'; g.beginPath(); g.ellipse(x, y, er, er * 0.55 * open, 0, 0, TAU); g.fill();
          g.fillStyle = '#1a0000'; g.beginPath(); g.ellipse(x, y, er * 0.14, er * 0.5 * open, 0, 0, TAU); g.fill();
        }
        g.restore();
      }
      if (rv > 0) {
        const k = E.outBack(clamp(rv * 1.4));
        TX.glow(g, cx, cy, m * 0.45, '#ff5a2a', 0.5 * k);
        TX.gem(g, 'twin', cx, cy, m * 0.17 * k, 12, time);
      }

      // depth gauge
      const depth = Math.round(40 * Math.pow(10994 / 40, seg(p, 0, 0.6)));
      g.save(); g.font = `${u * 2.6}px ui-monospace,Consolas,monospace`; g.textAlign = 'right';
      g.fillStyle = `rgba(160,230,255,${0.7 * (1 - seg(p, 0.62, 0.7))})`;
      const label = p > 0.56 && Math.floor(time / 90) % 3 ? '?????' : depth.toLocaleString();
      g.fillText(`-${label} m`, W - u * 4, H * 0.5);
      for (let i = -6; i <= 6; i++) {
        const y = H * 0.5 + i * u * 4 + ((time * 0.02) % (u * 4));
        g.fillRect(W - u * 2.5, y, i % 2 ? u : u * 2, 1);
      }
      g.restore();
      TX.flash(g, e, 0.85 * bump(p, 0.61, 0.68), '#ff6a3a');
      TX.vignette(g, e, 0.8, 0.25);
    });
  }

  /* ---------------- World-Forge Eternal: every hammer blow shapes a rough ingot closer to a gem ---------------- */
  {
    const HITS = [0.07, 0.15, 0.22, 0.29, 0.35, 0.4, 0.45, 0.49, 0.53, 0.56, 0.59, 0.625];
    const rough = [], r0 = rng(31);
    for (let i = 0; i < 8; i++) rough.push(0.7 + r0() * 0.6);
    const gemShape = [1, 0.62, 1, 0.62, 1, 0.62, 1, 0.62];
    TX.set('worldforge', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H);
      let last = -1; HITS.forEach((h, i) => { if (p >= h) last = i; });
      const since = last >= 0 ? (p - HITS[last]) * e.def.duration : 1e9;
      const next = HITS[last + 1], prev = last >= 0 ? HITS[last] : 0;
      const heat = Math.exp(-since / 500), shaped = (last + 1) / HITS.length;
      const shake = heat * u * 1.4 * (last === HITS.length - 1 ? 3 : 1);
      g.save(); g.translate((rng(Math.floor(time / 30))() - 0.5) * shake, (rng(Math.floor(time / 30) + 9)() - 0.5) * shake);
      g.fillStyle = '#0d0603'; g.fillRect(-u * 5, -u * 5, W + u * 10, H + u * 10);
      TX.glow(g, cx, cy + m * 0.2, m * 0.9, '#ff6a1a', 0.25 + 0.4 * heat);

      // anvil
      const ay = cy + m * 0.12, aw = m * 0.34;
      g.fillStyle = '#1b1210';
      g.beginPath(); g.moveTo(cx - aw, ay); g.lineTo(cx + aw * 0.8, ay); g.quadraticCurveTo(cx + aw * 1.25, ay + m * 0.02, cx + aw * 1.1, ay + m * 0.05);
      g.lineTo(cx + aw * 0.4, ay + m * 0.08); g.lineTo(cx + aw * 0.3, ay + m * 0.2); g.lineTo(cx + aw * 0.6, ay + m * 0.3); g.lineTo(cx - aw * 0.6, ay + m * 0.3);
      g.lineTo(cx - aw * 0.3, ay + m * 0.2); g.lineTo(cx - aw * 0.4, ay + m * 0.08); g.lineTo(cx - aw, ay + m * 0.06); g.closePath(); g.fill();
      g.strokeStyle = `rgba(255,140,60,${0.25 + 0.5 * heat})`; g.lineWidth = u * 0.4;
      g.beginPath(); g.moveTo(cx - aw, ay); g.lineTo(cx + aw * 0.8, ay); g.stroke();

      // the ingot, reshaping blow by blow; white-hot on impact, cooling to cherry red
      const rise = E.inOut(seg(p, 0.64, 0.74));
      const iy = lerp(ay - m * 0.05, cy, rise), ir = m * lerp(0.07, 0.09, shaped);
      if (rise < 1) {
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + Math.PI / 8, k = lerp(rough[i], gemShape[i], shaped);
          pts.push([cx + Math.cos(a) * ir * k * 1.5, iy + Math.sin(a) * ir * k * lerp(0.55, 0.9, shaped)]);
        }
        const col = heat > 0.5 ? '#fff4d0' : heat > 0.15 ? '#ffb34a' : '#d8401a';
        g.save(); g.globalAlpha = 1 - rise;
        TX.glow(g, cx, iy, ir * 4, '#ff8a2a', 0.5 + heat);
        g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = u * 0.25; g.stroke();
        g.restore();
      }

      // sparks from the last blow
      if (since < 1400) {
        const r = rng(last * 97 + 5), t = since / 1000, n = last === HITS.length - 1 ? 140 : 50;
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const a = -Math.PI * r(), v = m * (0.4 + r() * 1.2), life = 0.4 + r() * 0.9;
          if (t > life) continue;
          const x = cx + Math.cos(a) * v * t, y = ay - m * 0.05 + Math.sin(a) * v * t + m * 1.4 * t * t;
          g.strokeStyle = `rgba(255,${180 + 60 * r()},90,${1 - t / life})`; g.lineWidth = u * 0.3;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a) * u * 1.5, y - (Math.sin(a) * v + m * 2.8 * t) / v * u * 1.5); g.stroke();
        }
        g.restore();
      }

      // the hammer, swinging in from off-screen right
      if (next != null) {
        const ph = seg(p, prev, next), ang = ph < 0.72 ? lerp(0, -1.25, E.outCubic(ph / 0.72)) : lerp(-1.25, 0, E.inCubic((ph - 0.72) / 0.28));
        g.save(); g.translate(cx + m * 0.62, ay - m * 0.72); g.rotate(ang);
        g.fillStyle = '#2a1c16'; g.fillRect(-m * 0.64, m * 0.6, m * 0.64, m * 0.035);
        g.fillStyle = '#3a2a24'; g.fillRect(-m * 0.72, m * 0.52, m * 0.14, m * 0.2);
        g.strokeStyle = 'rgba(255,150,80,0.35)'; g.lineWidth = u * 0.3; g.strokeRect(-m * 0.72, m * 0.52, m * 0.14, m * 0.2);
        g.restore();
      }
      g.restore();

      // quench: steam billows as the finished gem lifts free
      const steam = seg(p, 0.625, 0.9);
      if (steam > 0) {
        const r = rng(8);
        for (let i = 0; i < 26; i++) {
          const t = clamp(steam * 1.4 - r() * 0.4), x = cx + (r() - 0.5) * m * 0.9 * (0.3 + t), y = ay - t * m * 0.6;
          const sr = m * (0.06 + 0.16 * t), sgr = g.createRadialGradient(x, y, 0, x, y, sr);
          sgr.addColorStop(0, `rgba(240,225,210,${0.16 * Math.sin(t * Math.PI)})`); sgr.addColorStop(1, 'rgba(240,225,210,0)');
          g.fillStyle = sgr; g.beginPath(); g.arc(x, y, sr, 0, TAU); g.fill();
        }
      }
      if (rise > 0) TX.gem(g, 'octa', cx, iy, m * 0.16 * E.outBack(rise), 22, time);
      TX.flash(g, e, 0.9 * bump(p, 0.62, 0.69), '#ffae5a');
      TX.vignette(g, e, 0.75);
    });
  }

  /* ---------------- Terminus of Stone: every vein crawls to one point, then the rock face gives out ---------------- */
  {
    const trees = [];
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU + 0.3, d = 1.25;
      trees.push(...TX.branches(400 + i, Math.cos(a) * d, Math.sin(a) * d, a + Math.PI, 0.055, 26, 2, [0, 0]).map(b => Object.assign(b, { st: (i % 4) * 0.04 })));
    }
    const shards = [], r0 = rng(41), GX = 8, GY = 12;
    const jit = [];
    for (let y = 0; y <= GY; y++) { jit.push([]); for (let x = 0; x <= GX; x++) jit[y].push([x / GX + (x % GX ? (r0() - 0.5) * 0.08 : 0), y / GY + (y % GY ? (r0() - 0.5) * 0.06 : 0)]); }
    for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
      const a = jit[y][x], b = jit[y][x + 1], c = jit[y + 1][x + 1], d = jit[y + 1][x];
      for (const tri of [[a, b, c], [a, c, d]]) shards.push({ tri, sp: 0.6 + r0() * 0.8, rot: (r0() - 0.5) * 4 });
    }
    let buf = null, bufKey = '';
    const paintRock = (g, W, H, u, s, cx, cy, k, time) => {
      g.fillStyle = '#120b16'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) {
        const y0 = H * i / 16;
        g.fillStyle = i % 2 ? 'rgba(60,40,70,0.35)' : 'rgba(20,12,26,0.4)';
        g.beginPath(); g.moveTo(0, y0);
        for (let x = 0; x <= W; x += W / 20) g.lineTo(x, y0 + Math.sin(x * 0.01 + i) * u * 1.2);
        g.lineTo(W, y0 + H / 16 + u); g.lineTo(0, y0 + H / 16 + u); g.fill();
      }
      const path = new Path2D(), tips = [];
      for (const b of trees) {
        const kk = clamp((k - b.st - b.t0 * 0.35) / (1 - b.t0 * 0.35 - b.st));
        if (kk <= 0) continue;
        const tip = TX.partial(path, b.pts, kk, s, s, cx, cy);
        if (tip && kk < 1) tips.push(tip);
      }
      TX.neon(g, path, '#c35cff', u * 0.45, 1, '#ffe8ff');
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [x, y] of tips) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, u * 0.7, 0, TAU); g.fill(); }
      g.restore();
    };
    TX.set('terminusofstone', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), s = m * 0.5, grow = E.inOut(seg(p, 0.04, 0.58));
      const brk = seg(p, 0.64, 0.95);
      if (brk <= 0) {
        const quake = seg(p, 0.5, 0.63) * u * 0.8;
        g.save(); g.translate((rng(Math.floor(time / 40))() - 0.5) * quake, 0);
        paintRock(g, W, H, u, s, cx, cy, grow, time);
        TX.glow(g, cx, cy, m * (0.1 + 0.4 * grow), '#c35cff', 0.3 + 0.9 * seg(p, 0.4, 0.63));
        g.restore();
      } else {
        const key = W + 'x' + H;
        if (!buf || bufKey !== key) {
          buf = document.createElement('canvas'); buf.width = Math.ceil(W); buf.height = Math.ceil(H); bufKey = key;
          paintRock(buf.getContext('2d'), W, H, u, s, cx, cy, 1, time);
        }
        g.fillStyle = '#05010a'; g.fillRect(0, 0, W, H);
        const sg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
        sg.addColorStop(0, '#3a1260'); sg.addColorStop(0.5, '#12041f'); sg.addColorStop(1, '#030006');
        g.fillStyle = sg; g.fillRect(0, 0, W, H);
        TX.dust(g, e, '#e0b0ff', 80, 7, 0.002);
        // beams where the veins used to meet
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 11; i++) {
          const a = i / 11 * TAU + 0.3 + time * 0.00005;
          const bg = g.createLinearGradient(cx, cy, cx + Math.cos(a) * e.R, cy + Math.sin(a) * e.R);
          bg.addColorStop(0, `rgba(210,120,255,${0.35 * (1 - brk * 0.5)})`); bg.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = bg; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.04) * e.R, cy + Math.sin(a - 0.04) * e.R); g.lineTo(cx + Math.cos(a + 0.04) * e.R, cy + Math.sin(a + 0.04) * e.R); g.fill();
        }
        g.restore();
        TX.gem(g, 'spire', cx, cy, m * 0.15 * E.outBack(clamp(brk * 3)), 280, time);
        // the rock face flies apart outward from the center
        const t = E.inCubic(brk) * 1.6 + brk * 0.3;
        for (const sh of shards) {
          const [[x1, y1], [x2, y2], [x3, y3]] = sh.tri;
          const mx = (x1 + x2 + x3) / 3 * W, my = (y1 + y2 + y3) / 3 * H;
          const dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) || 1;
          const push = t * sh.sp * m * (0.6 + 400 / (dl + 200));
          g.save();
          g.translate(mx + dx / dl * push, my + dy / dl * push + t * t * m * 0.3);
          g.rotate(sh.rot * t); g.scale(1 - brk * 0.4, 1 - brk * 0.4); g.translate(-mx, -my);
          g.beginPath(); g.moveTo(x1 * W, y1 * H); g.lineTo(x2 * W, y2 * H); g.lineTo(x3 * W, y3 * H); g.closePath();
          g.save(); g.clip(); g.drawImage(buf, 0, 0, W, H); g.restore();
          g.strokeStyle = 'rgba(220,150,255,0.5)'; g.lineWidth = u * 0.2; g.stroke();
          g.restore();
        }
      }
      TX.flash(g, e, 0.9 * bump(p, 0.62, 0.7), '#d38cff');
      TX.vignette(g, e, 0.7);
    });
  }
})();
