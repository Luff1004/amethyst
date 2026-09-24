/* MAP 3 (Crystal Cavern) TRANSCENDENT films - see js/cutscenes/tx/kit.js */
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TX = G.tx, { TAU, bump } = TX;
  const SPECTRUM = ['#ff3b3b', '#ff9a2a', '#ffe93a', '#4dff6a', '#3ad8ff', '#4a6bff', '#b04aff'];

  /* ---------------- The Light Eternal: days pass through a hole in the ceiling; the hole closes; the gem keeps the sun ---------------- */
  {
    const motes = [], r0 = rng(51);
    for (let i = 0; i < 90; i++) motes.push({ t: r0(), o: r0() - 0.5, s: r0() });
    const sky = t => { // time-of-day colour: dawn -> noon -> dusk -> night, cycling
      const k = (t % 1) * 4, i = Math.floor(k), f = k - i;
      const C = [[255, 150, 60], [255, 240, 190], [255, 90, 50], [70, 110, 220]];
      const a = C[i % 4], b = C[(i + 1) % 4];
      return [0, 1, 2].map(j => Math.round(lerp(a[j], b[j], f)));
    };
    TX.set('lighteternal', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), hy = H * 0.2, fy = H * 0.76;
      const close = E.inOut(seg(p, 0.46, 0.6)), hr = m * 0.07 * (1 - close);
      const day = seg(p, 0, 0.6) * 2.25, [cr, cg, cb] = sky(day);
      const swing = Math.sin(day * TAU * 0.5 - Math.PI / 2) * 0.55;
      g.fillStyle = '#0b0703'; g.fillRect(0, 0, W, H);

      // cave walls lit faintly by whatever the beam spills
      const wl = g.createRadialGradient(cx, fy, 0, cx, fy, m);
      wl.addColorStop(0, `rgba(${cr},${cg},${cb},${0.18 * (1 - close)})`); wl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = wl; g.fillRect(0, 0, W, H);

      // the beam: a cone from the ceiling hole to the floor, sweeping with the sun
      if (hr > 0.5) {
        const fx = cx + Math.tan(swing) * (fy - hy), fw = hr * 2.4;
        g.save(); g.globalCompositeOperation = 'lighter';
        const bg = g.createLinearGradient(cx, hy, fx, fy);
        bg.addColorStop(0, `rgba(${cr},${cg},${cb},0.55)`); bg.addColorStop(1, `rgba(${cr},${cg},${cb},0.12)`);
        g.fillStyle = bg; g.beginPath(); g.moveTo(cx - hr, hy); g.lineTo(cx + hr, hy); g.lineTo(fx + fw, fy); g.lineTo(fx - fw, fy); g.closePath(); g.fill();
        g.fillStyle = `rgba(${cr},${cg},${cb},0.35)`; g.beginPath(); g.ellipse(fx, fy, fw * 1.2, fw * 0.25, 0, 0, TAU); g.fill();
        for (const mo of motes) {
          const t = (mo.t + time * 0.00003 * (0.5 + mo.s)) % 1;
          const x = lerp(cx, fx, t) + mo.o * lerp(hr, fw, t) * 1.8, y = lerp(hy, fy, t) + Math.sin(time * 0.001 + mo.s * 9) * u;
          g.globalAlpha = 0.5 * Math.sin(t * Math.PI); g.fillStyle = '#fff'; g.fillRect(x, y, u * 0.25, u * 0.25);
        }
        g.restore();
      }

      // ceiling rock with its hole
      g.fillStyle = '#050302';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, hy + m * 0.1);
      for (let x = W; x >= 0; x -= W / 24) g.lineTo(x, hy + Math.sin(x * 0.03) * m * 0.02 + (Math.abs(x - cx) < m * 0.25 ? -m * 0.02 : m * 0.04));
      g.closePath(); g.fill();
      if (hr > 0.5) { g.fillStyle = `rgb(${cr},${cg},${cb})`; g.beginPath(); g.ellipse(cx, hy, hr, hr * 0.35, 0, 0, TAU); g.fill(); }

      // the gem on the floor - soaking up every day, holding it after the hole is gone
      const soak = seg(p, 0.05, 0.6), rise = E.inOut(seg(p, 0.6, 0.72));
      const gy = lerp(fy - m * 0.03, cy, rise), gs = m * lerp(0.05, 0.16, rise);
      TX.glow(g, cx, gy, m * (0.1 + 0.5 * soak + 0.4 * rise), '#ffd76a', 0.3 + 0.7 * soak);
      if (rise > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, gy); g.rotate(time * 0.00012);
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * TAU, l = e.R * (i % 2 ? 0.6 : 1) * rise;
          const rg = g.createLinearGradient(0, 0, Math.cos(a) * l, Math.sin(a) * l);
          rg.addColorStop(0, 'rgba(255,230,140,0.35)'); rg.addColorStop(1, 'rgba(255,200,80,0)');
          g.fillStyle = rg; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - 0.03) * l, Math.sin(a - 0.03) * l); g.lineTo(Math.cos(a + 0.03) * l, Math.sin(a + 0.03) * l); g.fill();
        }
        g.restore();
      }
      TX.gem(g, 'prism', cx, gy, gs, 48, time, { glow: 0.6 + soak });
      TX.flash(g, e, 0.9 * bump(p, 0.61, 0.68), '#ffe08a');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- Cavern of Infinity: an endless tunnel ride - and the gem at the end holds the same tunnel ---------------- */
  {
    const RING = 60, SIDES = 16, shapes = [];
    for (let i = 0; i < RING; i++) {
      const r = rng(600 + i), pts = [], glints = [];
      for (let k = 0; k < SIDES; k++) { pts.push(0.8 + r() * 0.45); glints.push(r() < 0.18 ? 0.5 + r() * 0.5 : 0); }
      shapes.push({ pts, glints });
    }
    const bend = z => [Math.sin(z * 0.23) * 0.5 + Math.sin(z * 0.07) * 0.8, Math.cos(z * 0.17) * 0.35];
    const tunnel = (g, cx, cy, K, travel, alpha, W, H, u, time) => {
      const base = Math.floor(travel), cam = bend(travel);
      for (let j = 40; j >= 1; j--) {
        const zi = base + j, z = zi - travel;
        if (z < 0.25) continue;
        const sh = shapes[((zi % RING) + RING) % RING], b = bend(zi), s = K / z;
        const ox = cx + (b[0] - cam[0]) * s, oy = cy + (b[1] - cam[1]) * s;
        const fog = clamp(1 - z / 40), lit = Math.pow(fog, 1.6);
        g.beginPath(); g.rect(-W, -H, W * 3, H * 3);
        const pts = sh.pts.map((k, i) => { const a = i / SIDES * TAU + zi * 0.1; return [ox + Math.cos(a) * s * k, oy + Math.sin(a) * s * k * 0.85]; });
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        g.fillStyle = `rgba(${Math.round(8 + 30 * lit)},${Math.round(14 + 50 * lit)},${Math.round(30 + 80 * lit)},${alpha})`;
        g.fill('evenodd');
        g.strokeStyle = `rgba(120,190,255,${0.35 * lit * alpha})`; g.lineWidth = Math.max(0.5, u * 0.5 / z * 4); g.stroke();
        if (lit > 0.2) {
          g.save(); g.globalCompositeOperation = 'lighter';
          sh.glints.forEach((gl, i) => {
            if (!gl) return;
            const [x, y] = pts[i], tw = 0.5 + 0.5 * Math.sin(time * 0.006 + i + zi);
            g.fillStyle = `rgba(170,220,255,${gl * lit * tw * alpha})`;
            g.beginPath(); g.moveTo(x, y - s * 0.06); g.lineTo(x + s * 0.02, y); g.lineTo(x, y + s * 0.03); g.lineTo(x - s * 0.02, y); g.fill();
          });
          g.restore();
        }
      }
    };
    TX.set('cavernofinfinity', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), t = time / 1000, travel = t * (1.2 + 3.2 * p * p);
      g.fillStyle = '#01030a'; g.fillRect(0, 0, W, H);
      const endGlow = seg(p, 0.35, 0.63);
      TX.glow(g, cx, cy, m * (0.1 + 0.4 * endGlow), '#6ab8ff', 0.4 + endGlow);
      tunnel(g, cx, cy, m * 0.9, travel, 1, W, H, u, time);
      const rv = E.outCubic(seg(p, 0.62, 0.74));
      if (rv > 0) {
        const gs = m * 0.17 * E.outBack(rv);
        TX.gem(g, 'spire', cx, cy, gs, 210, time);
        // inside the gem: the same tunnel, still falling - there is no bottom
        g.save(); g.globalAlpha = 0.85 * rv;
        g.beginPath(); g.arc(cx, cy - gs * 0.1, gs * 0.28, 0, TAU); g.clip();
        g.fillStyle = '#01030a'; g.fillRect(cx - gs, cy - gs, gs * 2, gs * 2);
        tunnel(g, cx, cy - gs * 0.1, gs * 0.3, travel * 1.4, 1, W, H, u * 0.3, time);
        TX.glow(g, cx, cy - gs * 0.1, gs * 0.12, '#bfe4ff', 1);
        g.restore();
        g.strokeStyle = 'rgba(190,230,255,0.7)'; g.lineWidth = u * 0.3;
        g.beginPath(); g.arc(cx, cy - gs * 0.1, gs * 0.28, 0, TAU); g.stroke();
      }
      TX.flash(g, e, 0.9 * bump(p, 0.61, 0.68), '#8cc8ff');
      TX.vignette(g, e, 0.6, 0.3);
    });
  }

  /* ---------------- Crystalborn Monarch: columns grow out of every wall into a throne; the king rises from it ---------------- */
  {
    const cols = [], r0 = rng(71);
    const add = (x, y, ang, len, w, st, hue) => cols.push({ x, y, ang, len, w, st, hue });
    for (let i = 0; i < 16; i++) { const x = r0(); add(x, 1.02, -Math.PI / 2 + (x - 0.5) * -0.9 + (r0() - 0.5) * 0.3, 0.12 + r0() * 0.18, 0.025 + r0() * 0.02, r0() * 0.25, 160 + r0() * 30); }
    for (let i = 0; i < 8; i++) { const y = 0.3 + r0() * 0.6; add(-0.02, y, -0.3 + (r0() - 0.5) * 0.5, 0.1 + r0() * 0.14, 0.02 + r0() * 0.02, 0.05 + r0() * 0.2, 165 + r0() * 25); }
    for (let i = 0; i < 8; i++) { const y = 0.3 + r0() * 0.6; add(1.02, y, Math.PI + 0.3 + (r0() - 0.5) * 0.5, 0.1 + r0() * 0.14, 0.02 + r0() * 0.02, 0.05 + r0() * 0.2, 165 + r0() * 25); }
    // the throne itself: a tall back of columns and two arms, grown last
    [[-0.09, 0.3], [-0.045, 0.38], [0, 0.44], [0.045, 0.38], [0.09, 0.3]].forEach(([dx, l], i) => add(0.5 + dx, 0.76, -Math.PI / 2 + dx * 1.5, l, 0.035, 0.3 + i * 0.02, 172));
    [[-0.17, 0.12, -0.35], [0.17, 0.12, 0.35]].forEach(([dx, l, tilt]) => add(0.5 + dx, 0.76, -Math.PI / 2 + tilt, l, 0.03, 0.36, 176));
    const drawCol = (g, c, W, H, m, k, time) => {
      const bx = c.x * W, by = c.y * H, L = c.len * m * 1.6 * k, w = c.w * m;
      if (L < 1) return null;
      g.save(); g.translate(bx, by); g.rotate(c.ang + Math.PI / 2);
      const tip = w * 1.4;
      const face = (x0, x1, l) => { g.fillStyle = TX.hsl(c.hue, 70, l); g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1, 0); g.lineTo(x1, -L); g.lineTo(0, -L - tip); g.lineTo(x0, -L); g.closePath(); g.fill(); };
      face(-w, -w * 0.3, 18); face(-w * 0.3, w * 0.35, 44); face(w * 0.35, w, 28);
      g.strokeStyle = 'rgba(200,255,245,0.6)'; g.lineWidth = Math.max(0.6, w * 0.06);
      g.beginPath(); g.moveTo(-w * 0.3, 0); g.lineTo(-w * 0.3, -L); g.lineTo(0, -L - tip); g.lineTo(w * 0.35, -L); g.lineTo(w * 0.35, 0); g.stroke();
      const sh = 0.5 + 0.5 * Math.sin(time * 0.002 + bx);
      g.fillStyle = `rgba(255,255,255,${0.25 * sh})`; g.fillRect(-w * 0.2, -L * 0.9, w * 0.12, L * 0.7);
      g.restore();
      return [bx + Math.cos(c.ang) * (L + tip), by + Math.sin(c.ang) * (L + tip)];
    };
    TX.set('crystalbornmonarch', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H);
      const bg = g.createRadialGradient(cx, H * 0.7, 0, cx, H * 0.7, e.R);
      bg.addColorStop(0, '#0b3a38'); bg.addColorStop(0.6, '#041614'); bg.addColorStop(1, '#010605');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      TX.dust(g, e, '#9ff8ea', 60, 9, 0.001);
      const tips = [];
      for (const c of cols) {
        const k = E.outCubic(seg(p, 0.03 + c.st, 0.03 + c.st + 0.28));
        const tp = drawCol(g, c, W, H, m, k, time);
        if (tp && k > 0.95) tips.push(tp);
      }
      // light starts ricocheting between the finished tips
      const ref = seg(p, 0.45, 0.63);
      if (ref > 0 && tips.length > 2) {
        const path = new Path2D(), r = rng(3), n = Math.floor(ref * 26);
        let a = tips[0];
        for (let i = 0; i < n; i++) { const b = tips[Math.floor(r() * tips.length)]; path.moveTo(a[0], a[1]); path.lineTo(b[0], b[1]); a = b; }
        TX.neon(g, path, '#6affe8', u * 0.2, 0.6 * (1 - seg(p, 0.64, 0.75)));
      }
      // the monarch rises from the throne, crowned
      const rv = E.outCubic(seg(p, 0.6, 0.74)), ky = lerp(H * 0.7, cy, rv);
      if (rv > 0) {
        TX.glow(g, cx, ky, m * 0.5, '#4affe0', 0.6 * rv);
        TX.gem(g, 'cluster', cx, ky, m * 0.15 * rv, 172, time);
        const cr = m * 0.1, crY = ky - m * 0.2;
        g.save(); g.globalAlpha = rv;
        const spikes = [];
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + time * 0.0006; spikes.push([Math.cos(a), Math.sin(a), a]); }
        spikes.sort((a, b) => a[1] - b[1]).forEach(([c, s]) => {
          const x = cx + c * cr, y = crY + s * cr * 0.28, h = m * 0.05 * (0.7 + 0.3 * (s + 1) / 2);
          g.fillStyle = TX.hsl(172, 70, 40 + 25 * (s + 1) / 2);
          g.beginPath(); g.moveTo(x - m * 0.012, y); g.lineTo(x, y - h); g.lineTo(x + m * 0.012, y); g.fill();
        });
        g.strokeStyle = TX.hsl(172, 90, 75); g.lineWidth = u * 0.4;
        g.beginPath(); g.ellipse(cx, crY, cr, cr * 0.28, 0, 0, TAU); g.stroke();
        g.restore();
      }
      TX.flash(g, e, 0.9 * bump(p, 0.62, 0.69), '#7affe6');
      TX.vignette(g, e, 0.7);
    });
  }

  /* ---------------- Radiant Abyss: sunlight dies on the way down... then light comes UP from the bottom ---------------- */
  {
    const wallL = [], wallR = [], r0 = rng(81);
    for (let i = 0; i < 80; i++) { wallL.push(0.08 + r0() * 0.1); wallR.push(0.08 + r0() * 0.1); }
    TX.set('radiantabyss', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H), sink = time * 0.00006 * (1 + 2 * seg(p, 0, 0.5));
      const up = E.inCubic(seg(p, 0.42, 0.63));
      g.fillStyle = '#000307'; g.fillRect(0, 0, W, H);

      // sun rays from above, each dying at a shallower depth as we go down
      const reach = H * lerp(1.1, 0.15, seg(p, 0, 0.45));
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const x = W * (0.22 + i * 0.093), rg = g.createLinearGradient(0, 0, 0, reach);
        rg.addColorStop(0, `rgba(160,235,255,${0.34 * (1 - up)})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.beginPath(); g.moveTo(x - u, 0); g.lineTo(x + u, 0); g.lineTo(x + u * 5, reach); g.lineTo(x - u * 3, reach); g.fill();
      }
      // ...and the light from below
      if (up > 0) {
        const lg = g.createRadialGradient(cx, H * 1.05, 0, cx, H * 1.05, H * (0.4 + 0.9 * up));
        lg.addColorStop(0, `rgba(190,250,255,${0.9 * up})`); lg.addColorStop(0.4, `rgba(60,200,255,${0.35 * up})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = lg; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 12; i++) {
          const a = -Math.PI / 2 + (i / 11 - 0.5) * 1.4 + Math.sin(time * 0.0005 + i) * 0.03, l = H * 1.3 * up;
          const rg = g.createLinearGradient(cx, H, cx + Math.cos(a) * l, H + Math.sin(a) * l);
          rg.addColorStop(0, `rgba(170,245,255,${0.28 * up})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = rg; g.beginPath(); g.moveTo(cx, H); g.lineTo(cx + Math.cos(a - 0.04) * l, H + Math.sin(a - 0.04) * l); g.lineTo(cx + Math.cos(a + 0.04) * l, H + Math.sin(a + 0.04) * l); g.fill();
        }
      }
      g.restore();

      // shaft walls, scrolling up - lit by caustics once the light rises
      const wall = (list, side) => {
        g.beginPath(); const x0 = side < 0 ? 0 : W; g.moveTo(x0, -H * 0.1);
        for (let i = 0; i <= 40; i++) {
          const y = i / 40 * H * 1.2 - H * 0.1, idx = Math.floor(i + sink * 40) % 80;
          const w = list[(idx + 80) % 80] * W + Math.sin((i + sink * 40) * 0.5) * u * 2;
          g.lineTo(side < 0 ? w : W - w, y);
        }
        g.lineTo(x0, H * 1.1); g.closePath();
      };
      for (const [list, side] of [[wallL, -1], [wallR, 1]]) {
        wall(list, side);
        g.fillStyle = `rgb(${Math.round(6 + 20 * up)},${Math.round(16 + 50 * up)},${Math.round(24 + 60 * up)})`; g.fill();
        const rim = g.createLinearGradient(0, 0, 0, H);
        rim.addColorStop(0, 'rgba(140,230,255,0.55)'); rim.addColorStop(clamp(reach / H), 'rgba(140,230,255,0.08)'); rim.addColorStop(1, `rgba(140,230,255,${0.6 * up})`);
        g.strokeStyle = rim; g.lineWidth = u * 0.35; g.stroke();
      }

      // flecks of sunlight sinking with us, each one going out before it reaches the bottom
      g.save(); g.globalCompositeOperation = 'lighter';
      const fr = rng(88);
      for (let i = 0; i < 70; i++) {
        const x = W * (0.2 + fr() * 0.6), sp = 0.3 + fr(), life = (fr() + time * 0.00005 * sp) % 1;
        const y = life * H, alive = clamp(1 - y / Math.max(1, reach)) * (1 - up);
        if (alive <= 0) continue;
        g.fillStyle = `rgba(190,245,255,${0.8 * alive})`;
        g.beginPath(); g.arc(x + Math.sin(time * 0.001 + i) * u * 2, y, u * (0.2 + 0.4 * fr()), 0, TAU); g.fill();
      }
      g.restore();

      // caustic web dancing over everything once light arrives
      if (up > 0.05) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = u * 0.22;
        const T = time * 0.001;
        for (let fam = 0; fam < 2; fam++) for (let k = 0; k < 14; k++) {
          g.strokeStyle = `rgba(150,240,255,${0.16 * up})`; g.beginPath();
          for (let s = 0; s <= 30; s++) {
            const t = s / 30, a = fam ? t * W : k / 13 * W, b = fam ? k / 13 * H : t * H;
            const x = a + (fam ? 0 : Math.sin(b * 0.02 + T * 1.3 + k) * u * 3 + Math.sin(b * 0.05 - T) * u * 1.5);
            const y = b + (fam ? Math.sin(a * 0.02 + T + k) * u * 3 + Math.sin(a * 0.05 - T * 1.7) * u * 1.5 : 0);
            s ? g.lineTo(x, y) : g.moveTo(x, y);
          }
          g.stroke();
        }
        g.restore();
      }

      const rv = E.outCubic(seg(p, 0.6, 0.74)), gy = lerp(H * 0.95, cy, rv);
      if (rv > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, gy); g.rotate(-time * 0.0001);
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * TAU, l = m * (i % 2 ? 0.4 : 0.7) * rv;
          g.strokeStyle = 'rgba(180,250,255,0.4)'; g.lineWidth = u * 0.4;
          g.beginPath(); g.moveTo(Math.cos(a) * m * 0.12, Math.sin(a) * m * 0.12); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke();
        }
        g.restore();
        TX.gem(g, 'octa', cx, gy, m * 0.15 * rv, 190, time);
      }
      TX.flash(g, e, 0.9 * bump(p, 0.62, 0.69), '#9ef0ff');
      TX.vignette(g, e, 0.65);
    });
  }

  /* ---------------- The Last Refraction: one beam through a chain of prisms, split and rejoined, until it bends into the gem for good ---------------- */
  {
    TX.set('lastrefraction', (g, e) => {
      const { p, u, cx, cy, W, H, time } = e;
      const m = Math.min(W, H);
      const bg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
      bg.addColorStop(0, '#1a0420'); bg.addColorStop(1, '#040008');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      TX.dust(g, e, '#f0b0ff', 50, 13, 0.0015);
      // prism stations along a zig-zag that ends at the center
      const S = [[-0.1, 0.62], [0.22, 0.3], [0.78, 0.36], [0.72, 0.7], [0.5, 0.42]].map(([x, y]) => [x * W, y * H]);
      S[4] = [cx, cy];
      const segs = S.length - 1, front = seg(p, 0.03, 0.56) * segs, dim = [1, 0.8, 0.6, 0.45];
      const fade = 1 - seg(p, 0.64, 0.8);
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < segs; i++) {
        const k = clamp(front - i);
        if (k <= 0) break;
        const [x0, y0] = S[i], [x1, y1] = S[i + 1], xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
        const a = dim[i] * fade;
        if (i % 2 === 1) {
          // split into a spectrum that fans out and pulls back together at the next prism
          const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny);
          SPECTRUM.forEach((c, j) => {
            const off = (j - 3) / 3 * m * 0.07;
            g.strokeStyle = c; g.globalAlpha = 0.8 * a; g.lineWidth = u * 0.5;
            g.beginPath(); g.moveTo(x0, y0);
            const steps = 20;
            for (let s = 1; s <= steps * k; s++) {
              const t = s / steps, bow = Math.sin(t * Math.PI) * off;
              g.lineTo(lerp(x0, x1, t) + nx / nl * bow, lerp(y0, y1, t) + ny / nl * bow);
            }
            g.stroke();
          });
        } else {
          g.strokeStyle = '#ffffff'; g.globalAlpha = 0.25 * a; g.lineWidth = u * 2.4;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(xe, ye); g.stroke();
          g.globalAlpha = 0.95 * a; g.lineWidth = u * 0.5; g.stroke();
        }
      }
      g.restore();
      // the prisms
      for (let i = 1; i < 4; i++) {
        const [x, y] = S[i], r = m * 0.07, rot = time * 0.0003 * (i % 2 ? 1 : -1) + i;
        const lit = clamp(front - i + 1);
        g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = fade;
        g.beginPath(); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU - Math.PI / 2; k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
        const pg = g.createLinearGradient(-r, -r, r, r);
        pg.addColorStop(0, 'rgba(255,255,255,0.18)'); pg.addColorStop(1, 'rgba(200,120,255,0.05)');
        g.fillStyle = pg; g.fill();
        g.strokeStyle = `rgba(255,220,255,${0.3 + 0.6 * lit})`; g.lineWidth = u * 0.35; g.stroke();
        g.restore();
        if (lit > 0) TX.glow(g, x, y, r * 2, '#ffffff', 0.4 * lit * fade);
      }
      // the last bend: every colour spirals down into the gem
      const sp = E.inCubic(seg(p, 0.52, 0.64));
      if (sp > 0 && sp < 1) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = u * 0.5;
        SPECTRUM.forEach((c, j) => {
          g.strokeStyle = c; g.globalAlpha = 0.8; g.beginPath();
          for (let s = 0; s <= 60; s++) {
            const t = s / 60, rr = m * 0.45 * (1 - sp) * Math.exp(-t * 2.2), a = j / 7 * TAU + t * 9 + sp * 6;
            s ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          }
          g.stroke();
        });
        g.restore();
      }
      const rv = E.outCubic(seg(p, 0.62, 0.74));
      if (rv > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        SPECTRUM.forEach((c, j) => {
          g.strokeStyle = c; g.globalAlpha = 0.35 * rv; g.lineWidth = u * 0.8;
          g.beginPath(); g.arc(cx, cy, m * (0.24 + j * 0.018) * rv, 0, TAU); g.stroke();
        });
        g.restore();
        TX.gem(g, 'twin', cx, cy, m * 0.16 * E.outBack(rv), (time * 0.03) % 360, time);
      } else TX.gem(g, 'twin', cx, cy, m * 0.08, 300, time, { dim: 0.75, glow: 0.1 });
      TX.flash(g, e, 0.9 * bump(p, 0.63, 0.7), '#f0a0ff');
      TX.vignette(g, e, 0.65);
    });
  }
})();
