/* SPECIAL minerals - months 9-12 (see js/cutscenes/special/s1.js for G.sp) */
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2, { SERIF, SANS } = G.sp.fonts;
  const cap = (a, b, ko, extra = {}) => Object.assign({ a, b, ko }, extra);

  /* ---------------- 9월 추석: the harvest moon rises over a hanok roof; the moon rabbit pounds rice cake;
     lanterns go up; the moonlight gathers into a moonstone ringed by songpyeon ---------------- */
  {
    const ridges = [0, 1, 2].map(i => { const r = rng(1200 + i), pts = []; for (let k = 0; k <= 20; k++) pts.push(r()); return pts; });
    const lanterns = [], r0 = rng(1210);
    for (let i = 0; i < 16; i++) lanterns.push({ x: r0(), t: r0() * 0.3, sp: 0.6 + r0() * 0.6, s: 0.6 + r0() * 0.6, ph: r0() * 10 });
    const SONG = ['#ffe8f0', '#bfe8b0', '#fff6d8', '#ffc4d8', '#d8f0c0', '#f4e0a8'];
    let branch = null;
    const rabbit = (g, R, pound, col) => {
      // the moon's own shadows, read the Korean way: a rabbit at a mortar (moon-local coords, radius R)
      g.fillStyle = col;
      const el = (x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x * R, y * R, rx * R, ry * R, rot, 0, TAU); g.fill(); };
      el(-0.2, 0.18, 0.24, 0.19, -0.35); el(0.02, -0.06, 0.12, 0.1, 0);
      el(-0.08, -0.32, 0.045, 0.17, -0.35); el(-0.01, -0.33, 0.04, 0.16, -0.12);
      el(-0.35, 0.32, 0.08, 0.05, 0);
      const hy = lerp(-0.28, 0.08, pound);                        // pestle head height
      g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = R * 0.05;
      g.beginPath(); g.moveTo(0.06 * R, 0.06 * R); g.lineTo(0.3 * R, (hy + 0.12) * R); g.stroke();
      g.lineWidth = R * 0.04; g.beginPath(); g.moveTo(0.34 * R, (hy - 0.12) * R); g.lineTo(0.34 * R, (hy + 0.14) * R); g.stroke();
      g.beginPath(); g.moveTo(0.2 * R, 0.2 * R); g.lineTo(0.48 * R, 0.2 * R); g.lineTo(0.43 * R, 0.4 * R); g.lineTo(0.25 * R, 0.4 * R); g.closePath(); g.fill();
    };
    const songpyeon = (g, x, y, r, rot, col) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = col; g.beginPath(); g.moveTo(-r, 0); g.quadraticCurveTo(-r, -r * 1.1, 0, -r * 1.05); g.quadraticCurveTo(r, -r * 1.1, r, 0); g.quadraticCurveTo(0, r * 0.35, -r, 0); g.fill();
      g.strokeStyle = 'rgba(120,90,60,0.35)'; g.lineWidth = Math.max(0.6, r * 0.08); g.beginPath(); g.moveTo(-r * 0.85, -r * 0.1); g.quadraticCurveTo(0, -r * 0.95, r * 0.85, -r * 0.1); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.55, r * 0.25, r * 0.12, -0.4, 0, TAU); g.fill();
      g.restore();
    };
    G.sp(9, {
      colors: ['#ffe6a0', '#ff9a3a', '#050612'],
      snd: 'rise:crystalline hit:celesta tail:chime amb:whisper root:220 scale:major',
      captions: [
        cap(0.04, 0.2, '한가위 보름달이 떠오르면', { pos: 'top', style: 'engrave', font: SERIF }),
        cap(0.22, 0.4, '달 속의 토끼가 떡방아를 찧는다', { pos: 'top', style: 'engrave', font: SERIF }),
        cap(0.42, 0.6, '올해도 소원을 빌어요', { pos: 'top', style: 'engrave', font: SERIF }),
        cap(0.72, 1.4, '더도 말고 덜도 말고, 한가위만 같아라', { style: 'engrave', font: SERIF }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        if (!branch) branch = TX.branches(1250, 1.04, 0.06, Math.PI * 0.85, 0.04, 12, 2, [0.6, 0.3]);
        const push = E.inOut(seg(p, 0.5, 0.66)), rv = E.outCubic(seg(p, 0.64, 0.76));
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#04061a'); sky.addColorStop(0.7, '#141a3e'); sky.addColorStop(1, '#2a2440');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        const st = rng(3); g.fillStyle = '#fff';
        for (let i = 0; i < 80; i++) { g.globalAlpha = (0.2 + 0.6 * st()) * (0.6 + 0.4 * Math.sin(time * 0.002 + i)); g.fillRect(st() * W, st() * H * 0.7, 1.3, 1.3); }
        g.globalAlpha = 1;
        // the full moon: rising, then filling the frame as the camera leans in
        const hz = H * 0.7, MR = m * 0.21 * (1 + push * 0.9);
        const mx = cx, my = lerp(hz + MR * 0.2, cy - m * 0.02, E.outCubic(seg(p, 0.02, 0.4)));
        TX.glow(g, mx, my, MR * 4.5, '#ffd88a', 0.55 + 0.3 * push);
        const mg = g.createRadialGradient(mx - MR * 0.3, my - MR * 0.3, MR * 0.1, mx, my, MR);
        mg.addColorStop(0, '#fffbe8'); mg.addColorStop(0.7, '#ffe7a8'); mg.addColorStop(1, '#f4c870');
        g.fillStyle = mg; g.beginPath(); g.arc(mx, my, MR, 0, TAU); g.fill();
        g.save(); g.beginPath(); g.arc(mx, my, MR, 0, TAU); g.clip(); g.translate(mx, my);
        const cr = rng(8);
        for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(200,150,70,0.12)'; g.beginPath(); g.arc((cr() - 0.5) * MR * 1.6, (cr() - 0.5) * MR * 1.6, MR * (0.08 + cr() * 0.18), 0, TAU); g.fill(); }
        // pestle rhythm: lift slow, drop fast, a steady 0.9s beat; it stops when the moonlight gathers
        const beat = (time % 900) / 900, pound = p < 0.6 ? (beat < 0.75 ? 1 - E.outCubic(beat / 0.75) : E.inCubic((beat - 0.75) / 0.25)) : 1;
        rabbit(g, MR, pound, `rgba(170,120,50,${0.42 * (1 - rv)})`);
        // the rice cake glows a little each time it's struck
        const hit = p < 0.6 ? Math.max(0, 1 - Math.abs(beat - 1) * 8, 1 - beat * 8) : 0;
        if (hit > 0) TX.glow(g, 0.34 * MR, 0.18 * MR, MR * 0.35, '#fffbe0', hit * 0.8);
        g.restore();
        // thin clouds crossing the moon
        for (let i = 0; i < 3; i++) {
          const cx2 = ((time * 0.012 * (1 + i * 0.4) + i * W * 0.5) % (W * 1.6)) - W * 0.3, cy2 = my - MR * 0.5 + i * MR * 0.45;
          const cg = g.createLinearGradient(cx2 - m * 0.3, 0, cx2 + m * 0.3, 0);
          cg.addColorStop(0, 'rgba(40,40,70,0)'); cg.addColorStop(0.5, 'rgba(50,50,80,0.55)'); cg.addColorStop(1, 'rgba(40,40,70,0)');
          g.fillStyle = cg; g.beginPath(); g.ellipse(cx2, cy2, m * 0.32, m * 0.022, 0, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(255,230,170,0.25)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx2, cy2 - m * 0.006, m * 0.28, m * 0.016, 0, Math.PI, TAU); g.stroke();
        }
        // mountains, fading as we lean toward the moon
        g.save(); g.globalAlpha = 1 - push * 0.8;
        ridges.forEach((pts, i) => {
          const base = hz + i * m * 0.06;
          g.fillStyle = ['#10142a', '#0c0f20', '#080a16'][i];
          g.beginPath(); g.moveTo(0, H); pts.forEach((v, k) => g.lineTo(k / 20 * W, base - m * (0.1 - i * 0.02) * (0.3 + 0.7 * v))); g.lineTo(W, H); g.fill();
        });
        // hanok roof in the foreground, with a warm lit window under the eaves
        const ry = H * 0.84, rx0 = -W * 0.05, rx1 = W * 0.62;
        g.fillStyle = '#05060c';
        g.beginPath(); g.moveTo(rx0, ry - m * 0.12);
        g.quadraticCurveTo((rx0 + rx1) / 2, ry - m * 0.02, rx1, ry - m * 0.15);
        g.lineTo(rx1 - m * 0.04, ry - m * 0.08); g.quadraticCurveTo((rx0 + rx1) / 2, ry + m * 0.05, rx0, ry - m * 0.03); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(120,130,170,0.25)'; g.lineWidth = 1;
        for (let k = 1; k < 26; k++) { const t = k / 26, x = lerp(rx0, rx1, t), y0 = ry - m * 0.12 + (Math.pow(t - 0.5, 2) * 4 - 1) * m * 0.035 - (t > 0.9 ? (t - 0.9) * m * 0.3 : 0); g.beginPath(); g.moveTo(x, y0 + m * 0.012); g.lineTo(x - m * 0.01, y0 + m * 0.07); g.stroke(); }
        g.fillStyle = '#0a0a12'; g.fillRect(rx0, ry - m * 0.03, rx1 - rx0 - m * 0.06, H);
        const wx = W * 0.2, wy = ry + m * 0.03, ww = m * 0.12, wh = m * 0.1;
        TX.glow(g, wx + ww / 2, wy + wh / 2, m * 0.2, '#ffb050', 0.5 + 0.08 * Math.sin(time * 0.005));
        g.fillStyle = '#ffcf80'; g.fillRect(wx, wy, ww, wh);
        g.strokeStyle = '#6a4020'; g.lineWidth = Math.max(1, u * 0.25);
        for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(wx + ww * k / 4, wy); g.lineTo(wx + ww * k / 4, wy + wh); g.stroke(); }
        for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(wx, wy + wh * k / 3); g.lineTo(wx + ww, wy + wh * k / 3); g.stroke(); }
        // a persimmon branch hanging in from the corner
        const bp = new Path2D(); branch.forEach(b => TX.partial(bp, b.pts, 1, W, H * 0.9, 0, 0));
        g.strokeStyle = '#140a08'; g.lineWidth = Math.max(1.5, u * 0.7); g.lineCap = 'round'; g.stroke(bp);
        branch.forEach((b, bi) => b.pts.forEach(([x, y], k) => {
          if (k % 3 !== 2) return;
          const sw = Math.sin(time * 0.0012 + bi + k) * u * 0.6, px = x * W + sw, py = y * H * 0.9 + m * 0.02, pr = m * 0.022;
          g.strokeStyle = '#140a08'; g.lineWidth = 1; g.beginPath(); g.moveTo(x * W, y * H * 0.9); g.lineTo(px, py - pr); g.stroke();
          const pg = g.createRadialGradient(px - pr * 0.35, py - pr * 0.35, pr * 0.1, px, py, pr);
          pg.addColorStop(0, '#ffb45a'); pg.addColorStop(1, '#d8520a');
          g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
          g.fillStyle = '#3a4a1a'; g.beginPath(); g.ellipse(px, py - pr * 0.9, pr * 0.5, pr * 0.18, 0, 0, TAU); g.fill();
        }));
        g.restore();
        // sky lanterns carrying wishes up past the moon
        for (const L of lanterns) {
          const k = (seg(p, 0.14 + L.t, 0.9) * L.sp) % 1;
          if (k <= 0) continue;
          const x = L.x * W + Math.sin(time * 0.001 + L.ph) * m * 0.03, y = lerp(H * 1.05, -H * 0.1, k), s = m * 0.022 * L.s * (1 - k * 0.4);
          TX.glow(g, x, y, s * 4, '#ff9a3a', 0.45);
          const lg = g.createLinearGradient(0, y - s, 0, y + s * 1.2); lg.addColorStop(0, '#ffe2a0'); lg.addColorStop(1, '#ff8a2a');
          g.fillStyle = lg; g.beginPath(); g.moveTo(x - s * 0.8, y - s); g.lineTo(x + s * 0.8, y - s); g.lineTo(x + s * 0.6, y + s * 1.2); g.lineTo(x - s * 0.6, y + s * 1.2); g.closePath(); g.fill();
        }
        // the moonstone, ringed by songpyeon
        if (rv > 0) {
          // night settles back over the moon so the stone reads against it; the moon stays as a halo
          g.fillStyle = `rgba(6,8,24,${0.62 * rv})`; g.fillRect(0, 0, W, H);
          g.strokeStyle = `rgba(255,236,180,${0.5 * rv})`; g.lineWidth = u * 0.5; g.beginPath(); g.arc(mx, my, MR * 0.98, 0, TAU); g.stroke();
          TX.glow(g, cx, cy, m * 0.4, '#fff2c8', 0.7 * rv);
          const N = 12;
          const ring = [];
          for (let i = 0; i < N; i++) { const a = i / N * TAU + time * 0.0006, d = m * 0.24 * E.outBack(rv); ring.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.42, Math.sin(a), a, i]); }
          ring.filter(q => q[2] < 0).forEach(([x, y, z, a, i]) => songpyeon(g, x, y, m * 0.03 * (0.8 + 0.2 * z), a * 0.3, SONG[i % SONG.length]));
          G.cine.orb(g, cx, cy, m * 0.11 * E.outBack(rv), { col: ['#ffffff', '#f0f4ff', '#c8b88a'], kind: 'opal', t: time, glow: 0.8 });
          ring.filter(q => q[2] >= 0).forEach(([x, y, z, a, i]) => songpyeon(g, x, y, m * 0.03 * (0.8 + 0.2 * z), a * 0.3, SONG[i % SONG.length]));
          g.save(); g.globalCompositeOperation = 'lighter';
          const sr = rng(Math.floor(time / 180));
          for (let i = 0; i < 10; i++) G.cine.star(g, cx + (sr() - 0.5) * m * 0.7, cy + (sr() - 0.5) * m * 0.5, m * 0.03 * sr(), '#fff2c8', rv * sr());
          g.restore();
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.63, 0.71), '#fff2c8');
        TX.vignette(g, e, 0.55);
      },
    });
  }

  /* ---------------- 10월 할로윈: bats, fog, grinning pumpkins; the biggest one carves its own face ---------------- */
  {
    const bats = [], r0 = rng(1310);
    for (let i = 0; i < 12; i++) bats.push({ ph: r0() * TAU, sp: 0.5 + r0() * 0.8, r: 0.25 + r0() * 0.3, y: 0.15 + r0() * 0.3, s: 0.6 + r0() * 0.6 });
    const pumpkins = [];
    for (let i = 0; i < 5; i++) pumpkins.push({ x: [0.1, 0.27, 0.73, 0.9, 0.58][i], s: 0.5 + r0() * 0.4, ph: r0() * 10 });
    const stones = [];
    for (let i = 0; i < 7; i++) stones.push({ x: r0(), h: 0.05 + r0() * 0.05, w: 0.035 + r0() * 0.02, tilt: (r0() - 0.5) * 0.3 });
    const bat = (g, x, y, s, flap) => {
      g.save(); g.translate(x, y); g.scale(s, s);
      const f = flap;
      g.beginPath(); g.moveTo(0, 0);
      g.quadraticCurveTo(-4, -6 * f, -10, -3 * f); g.quadraticCurveTo(-8, -1, -9, 2 * f + 1); g.quadraticCurveTo(-6, 0, -4, 2); g.quadraticCurveTo(-2, 1, 0, 3);
      g.quadraticCurveTo(2, 1, 4, 2); g.quadraticCurveTo(6, 0, 9, 2 * f + 1); g.quadraticCurveTo(8, -1, 10, -3 * f); g.quadraticCurveTo(4, -6 * f, 0, 0); g.fill();
      g.restore();
    };
    const pumpkin = (g, x, y, r, face, glow, time, seed) => {
      const lobes = [[-0.55, 0.62], [0.55, 0.62], [-0.28, 0.8], [0.28, 0.8], [0, 0.85]];
      lobes.forEach(([ox, w]) => {
        const pg = g.createRadialGradient(x + ox * r - r * 0.2, y - r * 0.3, r * 0.1, x + ox * r, y, r);
        pg.addColorStop(0, '#ffb04a'); pg.addColorStop(1, '#b8480a');
        g.fillStyle = pg; g.beginPath(); g.ellipse(x + ox * r, y, r * w * 0.55, r * 0.78, 0, 0, TAU); g.fill();
      });
      g.fillStyle = '#4a3a14'; g.beginPath(); g.moveTo(x - r * 0.08, y - r * 0.72); g.quadraticCurveTo(x, y - r * 1.1, x + r * 0.18, y - r * 1.05); g.lineTo(x + r * 0.08, y - r * 0.72); g.fill();
      if (face <= 0) return;
      const fl = 0.75 + 0.25 * Math.sin(time * 0.02 + seed) * Math.sin(time * 0.013 + seed * 2);
      const col = `rgba(255,${Math.round(200 + 40 * fl)},${Math.round(60 + 60 * fl)},${face})`;
      g.fillStyle = col;
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * r * 0.42, y - r * 0.05); g.lineTo(x + sd * r * 0.12, y - r * 0.05); g.lineTo(x + sd * r * 0.28, y - r * 0.4); g.closePath(); g.fill(); }
      g.beginPath(); g.moveTo(x - r * 0.55, y + r * 0.2);
      for (let k = 0; k <= 8; k++) g.lineTo(x - r * 0.55 + k * r * 0.1375, y + r * 0.2 + (k % 2 ? r * 0.12 : 0) + Math.sin(k / 8 * Math.PI) * r * 0.22);
      for (let k = 8; k >= 0; k--) g.lineTo(x - r * 0.55 + k * r * 0.1375, y + r * 0.35 + Math.sin(k / 8 * Math.PI) * r * 0.28);
      g.closePath(); g.fill();
      if (glow > 0) G.tx.glow(g, x, y, r * 2.4, '#ff9a1a', glow * fl);
    };
    G.sp(10, {
      colors: ['#ffa03a', '#9a4aff', '#08040e'],
      snd: 'rise:heart hit:whomp tail:echo amb:space root:110 scale:phrygian',
      captions: [
        cap(0.04, 0.2, '호박등에 불이 켜지는 밤', { pos: 'top', style: 'fly', from: 'left', font: SANS }),
        cap(0.22, 0.4, '과자를 안 주면 장난칠 거야', { pos: 'top', style: 'fly', from: 'right', font: SANS }),
        cap(0.42, 0.6, '가장 큰 호박이 웃는다', { pos: 'top', style: 'fly', from: 'top', font: SANS }),
        cap(0.72, 1.4, '달콤하고 으스스한 선물', { style: 'fly', from: 'bottom', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H), gy = H * 0.78;
        const sky = g.createLinearGradient(0, 0, 0, gy);
        sky.addColorStop(0, '#0a0418'); sky.addColorStop(1, '#3a1a4a');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        const mx = W * 0.72, my = H * 0.24, mr = m * 0.12;
        TX.glow(g, mx, my, mr * 5, '#ffb050', 0.4);
        g.fillStyle = '#ffd89a'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
        // dead tree
        const tr = rng(4);
        g.strokeStyle = '#06020a'; g.lineCap = 'round';
        const limb = (x, y, a, l, w, d) => { if (d > 5 || l < m * 0.01) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); limb(x2, y2, a - 0.3 - tr() * 0.4, l * 0.72, w * 0.65, d + 1); limb(x2, y2, a + 0.3 + tr() * 0.4, l * 0.7, w * 0.65, d + 1); };
        limb(W * 0.16, gy, -Math.PI / 2 - 0.1, m * 0.2, u * 1.6, 0);
        // graves and ground
        g.fillStyle = '#0c0614'; g.fillRect(0, gy, W, H - gy);
        for (const s of stones) { g.save(); g.translate(s.x * W, gy + u); g.rotate(s.tilt); g.fillStyle = '#1a1424'; const w = s.w * W, h = s.h * H; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + w / 2); g.arc(0, -h + w / 2, w / 2, Math.PI, 0); g.lineTo(w / 2, 0); g.fill(); g.restore(); }
        // bats
        g.fillStyle = '#05020a';
        for (const b of bats) {
          const a = time * 0.0006 * b.sp + b.ph, x = W * 0.5 + Math.cos(a) * W * b.r * 1.3, y = H * b.y + Math.sin(a * 2) * H * 0.05;
          bat(g, x, y, m * 0.004 * b.s, Math.sin(time * 0.02 * b.sp + b.ph));
        }
        // small pumpkins, lit
        for (const pk of pumpkins) pumpkin(g, pk.x * W, gy + m * 0.02, m * 0.05 * pk.s, seg(p, 0.1, 0.3), 0.5, time, pk.ph);
        // fog
        for (let i = 0; i < 5; i++) {
          const fx = ((time * 0.01 * (1 + i * 0.3) + i * W * 0.4) % (W * 1.6)) - W * 0.3, fy = gy - m * 0.02 + i * m * 0.02;
          const fg = g.createRadialGradient(fx, fy, 0, fx, fy, m * 0.35); fg.addColorStop(0, 'rgba(160,140,190,0.18)'); fg.addColorStop(1, 'rgba(160,140,190,0)');
          g.fillStyle = fg; g.beginPath(); g.ellipse(fx, fy, m * 0.4, m * 0.08, 0, 0, TAU); g.fill();
        }
        // the giant pumpkin: rises, carves its own grin, and blazes
        const rise = E.outBack(seg(p, 0.36, 0.48)), carve = seg(p, 0.46, 0.6), rv = E.outCubic(seg(p, 0.64, 0.76));
        if (p > 0.36) {
          const gx = cx, gyy = lerp(H * 1.1, cy + m * 0.14, rise), gr = m * 0.17;
          pumpkin(g, gx, gyy, gr, carve, carve * 1.3 + rv, time, 1);
          if (carve > 0 && carve < 1) { const cr = rng(Math.floor(time / 60)); g.fillStyle = '#ffd08a'; for (let i = 0; i < 8; i++) g.fillRect(gx + (cr() - 0.5) * gr, gyy + (cr() - 0.3) * gr * 0.6, u * 0.4, u * 0.4); }
          if (rv > 0) {
            const ay = lerp(gyy - gr * 0.8, cy - m * 0.1, rv);
            TX.glow(g, cx, ay, m * 0.45, '#ff9a1a', 0.8 * rv);
            g.fillStyle = '#05020a';
            for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + time * 0.0015, d = m * 0.2; bat(g, cx + Math.cos(a) * d, ay + Math.sin(a) * d * 0.5, m * 0.004, Math.sin(time * 0.025 + i)); }
            TX.gem(g, 'cluster', cx, ay, m * 0.12 * E.outBack(rv), 28, time);
          }
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#ffb050');
        TX.vignette(g, e, 0.7);
      },
    });
  }

  /* ---------------- 11월 단풍: leaves falling on a burning-red forest; the reddest one turns to crystal ---------------- */
  {
    const leafPath = (() => {
      const pth = [], tips = [[-90, 1], [-35, 0.9], [-145, 0.9], [15, 0.62], [-195, 0.62]];
      const order = [-195, -145, -90, -35, 15].map(a => tips.find(t => t[0] === a));
      order.forEach(([a, r], i) => {
        const rad = a * Math.PI / 180, prev = i ? order[i - 1][0] * Math.PI / 180 : rad - 0.8;
        const va = (prev + rad) / 2; pth.push([Math.cos(va) * 0.38, Math.sin(va) * 0.38]);
        pth.push([Math.cos(rad - 0.16) * r * 0.72, Math.sin(rad - 0.16) * r * 0.72]);
        pth.push([Math.cos(rad) * r, Math.sin(rad) * r]);
        pth.push([Math.cos(rad + 0.16) * r * 0.72, Math.sin(rad + 0.16) * r * 0.72]);
      });
      pth.push([0.12, 0.3]); pth.push([-0.12, 0.3]);
      return pth;
    })();
    const leaf = (g, x, y, s, rot, flip, col) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * flip, s);
      g.fillStyle = col; g.beginPath(); leafPath.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill();
      g.restore();
    };
    const COLS = ['#d8201a', '#ff5a1a', '#ff9a1a', '#ffc83a', '#b8100a'];
    const falling = [], r0 = rng(1410);
    for (let i = 0; i < 70; i++) falling.push({ x: r0(), y: r0(), sp: 0.4 + r0() * 0.7, s: 0.6 + r0() * 0.7, ph: r0() * 10, c: COLS[i % COLS.length], sw: r0() });
    const canopy = [];
    for (let i = 0; i < 160; i++) canopy.push({ x: r0(), y: r0() * 0.22, s: 0.7 + r0() * 0.8, rot: r0() * TAU, c: COLS[Math.floor(r0() * COLS.length)] });
    G.sp(11, {
      colors: ['#ff6a3a', '#ffc83a', '#140604'],
      snd: 'rise:crystalline hit:celesta tail:chime amb:whisper root:196 scale:lydian',
      captions: [
        cap(0.04, 0.2, '산이 붉게 물드는 계절', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.22, 0.4, '잎 하나가 떨어질 때마다', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.42, 0.6, '가을이 한 걸음 깊어진다', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.72, 1.4, '가장 붉었던 한 장을 간직하다', { style: 'fade', font: SERIF }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3a0e06'); bg.addColorStop(0.5, '#8a3a12'); bg.addColorStop(1, '#2a0a04');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        TX.glow(g, cx, H * 0.55, m * 0.9, '#ffb050', 0.35);
        // trunks receding into the haze
        const tr = rng(6);
        for (let i = 0; i < 14; i++) { const x = tr() * W, w = m * (0.01 + tr() * 0.03), d = tr(); g.fillStyle = `rgba(${Math.round(30 + 50 * d)},${Math.round(10 + 20 * d)},6,${0.5 + 0.5 * (1 - d)})`; g.fillRect(x, 0, w, H); }
        // the canopy overhead
        for (const c of canopy) leaf(g, c.x * W, c.y * H, m * 0.03 * c.s, c.rot + Math.sin(time * 0.001 + c.x * 9) * 0.1, 1, c.c);
        // leaf carpet
        const cr = rng(9);
        for (let i = 0; i < 120; i++) leaf(g, cr() * W, H * (0.86 + cr() * 0.14), m * 0.025 * (0.6 + cr()), cr() * TAU, 1, COLS[Math.floor(cr() * COLS.length)]);
        // falling leaves - then the gust gathers them into a spiral
        const gust = seg(p, 0.44, 0.64), rv = E.outCubic(seg(p, 0.64, 0.76));
        for (const f of falling) {
          let x = f.x * W + Math.sin(time * 0.0012 * f.sp + f.ph) * m * 0.06, y = ((f.y * H + time * 0.025 * f.sp) % (H * 1.1)) - H * 0.05;
          const loose = clamp((gust - f.sw * 0.4) * 1.8);
          if (loose > 0) {
            const a = Math.atan2(y - cy, x - cx) + loose * 4 + time * 0.002, d = Math.hypot(x - cx, y - cy) * (1 - loose * 0.9);
            x = lerp(x, cx + Math.cos(a) * d, loose); y = lerp(y, cy + Math.sin(a) * d * 0.7, loose);
          }
          leaf(g, x, y, m * 0.03 * f.s * (1 - rv * 0.7), time * 0.0015 * f.sp + f.ph, Math.cos(time * 0.003 * f.sp + f.ph), f.c);
        }
        // the crystal leaf: faceted, veined, turning slowly
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 0.55, '#ff4a1a', 0.8 * rv);
          const s = m * 0.24 * E.outBack(rv), flip = 0.8 + 0.2 * Math.cos(time * 0.0012);
          g.save(); g.translate(cx, cy + s * 0.05); g.rotate(Math.sin(time * 0.0008) * 0.12); g.scale(flip, 1);
          const lg = g.createLinearGradient(-s, -s, s, s);
          lg.addColorStop(0, '#ff9a7a'); lg.addColorStop(0.5, '#e0200a'); lg.addColorStop(1, '#5a0400');
          g.fillStyle = lg; g.beginPath(); leafPath.forEach(([a, b], i) => (i ? g.lineTo(a * s, b * s) : g.moveTo(a * s, b * s))); g.closePath(); g.fill();
          g.save(); g.clip();
          leafPath.forEach(([a, b], i) => {
            const [a2, b2] = leafPath[(i + 1) % leafPath.length];
            g.fillStyle = i % 2 ? `rgba(255,220,200,${0.12 + 0.15 * Math.sin(time * 0.003 + i)})` : 'rgba(60,0,0,0.18)';
            g.beginPath(); g.moveTo(0, s * 0.05); g.lineTo(a * s, b * s); g.lineTo(a2 * s, b2 * s); g.closePath(); g.fill();
          });
          g.restore();
          g.strokeStyle = 'rgba(255,230,200,0.7)'; g.lineWidth = Math.max(1, u * 0.3);
          for (const t of [-90, -35, -145, 15, -195]) { const a = t * Math.PI / 180; g.beginPath(); g.moveTo(0, s * 0.05); g.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85); g.stroke(); }
          g.beginPath(); g.moveTo(0, s * 0.05); g.lineTo(0, s * 0.55); g.stroke();
          g.strokeStyle = 'rgba(255,200,170,0.9)'; g.beginPath(); leafPath.forEach(([a, b], i) => (i ? g.lineTo(a * s, b * s) : g.moveTo(a * s, b * s))); g.closePath(); g.stroke();
          g.restore();
          g.save(); g.globalCompositeOperation = 'lighter';
          const sr = rng(Math.floor(time / 170));
          for (let i = 0; i < 8; i++) G.cine.star(g, cx + (sr() - 0.5) * s * 1.8, cy + (sr() - 0.5) * s * 1.6, m * 0.03 * sr(), '#ffd0a0', rv * sr());
          g.restore();
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#ffb07a');
        TX.vignette(g, e, 0.6);
      },
    });
  }

  /* ---------------- 12월 크리스마스: a snow globe, shaken; a tiny village; the star on the tree becomes the gem ---------------- */
  {
    const snowIn = [], r0 = rng(1510);
    for (let i = 0; i < 140; i++) snowIn.push({ a: r0() * TAU, d: Math.sqrt(r0()), sp: 0.3 + r0() * 0.7, s: 0.5 + r0() });
    const bokeh = [];
    for (let i = 0; i < 26; i++) bokeh.push({ x: r0(), y: r0(), r: 0.02 + r0() * 0.05, c: ['#ffcf5a', '#ff4a4a', '#6aff8a', '#ffe8b0'][i % 4], ph: r0() * 10 });
    G.sp(12, {
      colors: ['#fff0b0', '#3aff7a', '#04080e'],
      snd: 'rise:crystalline hit:celesta tail:musicbox amb:whisper root:262 scale:major',
      captions: [
        cap(0.04, 0.2, '창밖에 첫눈이 내리는 밤', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.22, 0.4, '유리구슬을 흔들면', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.42, 0.6, '작은 마을에 별이 켜진다', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.72, 1.4, '메리 크리스마스', { style: 'fade', font: SERIF }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        g.fillStyle = '#05070e'; g.fillRect(0, 0, W, H);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const b of bokeh) {
          const x = b.x * W, y = b.y * H, r = m * b.r, a = 0.1 + 0.08 * Math.sin(time * 0.0015 + b.ph);
          const bg = g.createRadialGradient(x, y, 0, x, y, r); bg.addColorStop(0, b.c); bg.addColorStop(1, 'rgba(0,0,0,0)');
          g.globalAlpha = a; g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        }
        g.restore();
        const zoom = E.inOut(seg(p, 0.56, 0.68)), rv = E.outCubic(seg(p, 0.64, 0.76));
        const shake = (1 - seg(p, 0, 0.16)) * 0.14 * Math.sin(time * 0.02);
        const R = m * 0.3 * (1 + zoom * 1.2), gx = cx, gyy = cy + m * 0.05 + zoom * R * 0.5;
        g.save(); g.translate(gx, gyy + R); g.rotate(shake); g.translate(-gx, -(gyy + R));
        // wooden base with a gold band
        if (zoom < 1) {
          g.fillStyle = '#3a1a0a'; g.beginPath(); g.moveTo(gx - R * 0.85, gyy + R * 0.7); g.lineTo(gx + R * 0.85, gyy + R * 0.7); g.lineTo(gx + R, gyy + R * 1.15); g.lineTo(gx - R, gyy + R * 1.15); g.closePath(); g.fill();
          g.fillStyle = '#d8a83a'; g.fillRect(gx - R * 0.9, gyy + R * 0.82, R * 1.8, R * 0.06);
        }
        // inside the glass
        g.save(); g.beginPath(); g.arc(gx, gyy, R, 0, TAU); g.clip();
        const inner = g.createLinearGradient(0, gyy - R, 0, gyy + R);
        inner.addColorStop(0, '#0a1a3a'); inner.addColorStop(1, '#2a3a6a');
        g.fillStyle = inner; g.fillRect(gx - R, gyy - R, R * 2, R * 2);
        g.fillStyle = '#eef4ff'; g.beginPath(); g.ellipse(gx, gyy + R * 0.62, R * 1.1, R * 0.32, 0, 0, TAU); g.fill();
        // the little house with a lit window and a smoking chimney
        const hx = gx - R * 0.45, hy = gyy + R * 0.5, hs = R * 0.22;
        g.fillStyle = '#6a2a1a'; g.fillRect(hx - hs * 0.6, hy - hs * 0.6, hs * 1.2, hs * 0.7);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(hx - hs * 0.75, hy - hs * 0.55); g.lineTo(hx, hy - hs * 1.1); g.lineTo(hx + hs * 0.75, hy - hs * 0.55); g.fill();
        TX.glow(g, hx, hy - hs * 0.3, hs * 0.9, '#ffb04a', 0.6);
        g.fillStyle = '#ffd07a'; g.fillRect(hx - hs * 0.18, hy - hs * 0.42, hs * 0.36, hs * 0.26);
        for (let k = 0; k < 4; k++) { const t = ((time * 0.0004 + k * 0.25) % 1); g.fillStyle = `rgba(220,220,240,${0.4 * (1 - t)})`; g.beginPath(); g.arc(hx + hs * 0.4 + t * hs * 0.4, hy - hs * 1.0 - t * hs * 1.4, hs * (0.1 + t * 0.15), 0, TAU); g.fill(); }
        // the tree: three tiers, twinkling ornaments, and the star on top
        const tx = gx + R * 0.15, tb = gyy + R * 0.58, th = R * 0.95;
        for (let k = 0; k < 3; k++) {
          const y0 = tb - k * th * 0.28, w = R * (0.42 - k * 0.1);
          g.fillStyle = ['#0e5a2a', '#137a36', '#1a9a44'][k];
          g.beginPath(); g.moveTo(tx - w, y0); g.lineTo(tx, y0 - th * 0.42); g.lineTo(tx + w, y0); g.closePath(); g.fill();
        }
        g.fillStyle = '#4a2a10'; g.fillRect(tx - R * 0.04, tb, R * 0.08, R * 0.08);
        const lights = seg(p, 0.3, 0.6), orn = rng(6);
        for (let k = 0; k < 16; k++) {
          const t = orn(), y = tb - t * th * 0.78, w = R * 0.4 * (1 - t * 0.9), x = tx + (orn() - 0.5) * w * 1.4;
          const tw = 0.5 + 0.5 * Math.sin(time * 0.006 * (1 + lights * 2) + k * 1.7);
          const c = ['#ff4a4a', '#ffcf5a', '#5ab8ff', '#ff8aff'][k % 4];
          g.fillStyle = c; g.globalAlpha = 0.6 + 0.4 * tw; g.beginPath(); g.arc(x, y, R * 0.025, 0, TAU); g.fill();
          if (lights > 0) TX.glow(g, x, y, R * 0.07, c, lights * tw * 0.6);
        }
        g.globalAlpha = 1;
        const sx = tx, sy = tb - th * 0.98, starK = 0.4 + 0.6 * seg(p, 0.42, 0.6);
        TX.glow(g, sx, sy, R * 0.3 * starK, '#ffe08a', starK);
        G.cine.star(g, sx, sy, R * 0.12 * starK, '#fff2b0', 1);
        // snow inside: whirling from the shake, then settling
        const swirl = 1 - seg(p, 0.05, 0.3);
        g.fillStyle = '#ffffff';
        for (const s of snowIn) {
          const a = s.a + time * 0.004 * swirl * s.sp, d = s.d * R;
          let x = gx + Math.cos(a) * d, y = gyy + Math.sin(a) * d * (0.3 + 0.7 * swirl);
          const fall = (1 - swirl) * (((time * 0.00004 * s.sp + s.d) % 1) * 2 - 1) * R;
          y = lerp(y, gyy + fall, 1 - swirl);
          g.globalAlpha = 0.85; g.beginPath(); g.arc(x, y, R * 0.012 * s.s, 0, TAU); g.fill();
        }
        g.globalAlpha = 1;
        g.restore();
        // glass
        g.strokeStyle = 'rgba(210,230,255,0.45)'; g.lineWidth = Math.max(1, u * 0.35); g.beginPath(); g.arc(gx, gyy, R, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = R * 0.03; g.lineCap = 'round';
        g.beginPath(); g.arc(gx, gyy, R * 0.86, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
        g.restore();
        // the star becomes the gem, and the snow comes out of the globe to fall on everything
        if (rv > 0) {
          const outSnow = rng(17); g.fillStyle = '#fff';
          for (let i = 0; i < 70; i++) { const x = (outSnow() * W + Math.sin(time * 0.0009 + i) * u * 3) % W, y = (outSnow() * H + time * 0.025 * (0.4 + outSnow())) % H; g.globalAlpha = rv * (0.4 + 0.5 * outSnow()); g.beginPath(); g.arc(x, y, u * (0.2 + 0.3 * outSnow()), 0, TAU); g.fill(); }
          g.globalAlpha = 1;
          TX.glow(g, cx, cy, m * 0.55, '#ffe08a', 0.8 * rv);
          TX.gem(g, 'star', cx, cy, m * 0.14 * E.outBack(rv), 46, time, { col: ['#fffbe0', '#ffcf3a', '#6a4a08'] });
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#fff0c0');
        TX.vignette(g, e, 0.6);
      },
    });
  }
})();
