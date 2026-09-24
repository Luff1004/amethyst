/* SPECIAL minerals - months 5-8 (see js/cutscenes/special/s1.js for G.sp) */
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2, { SERIF, SANS } = G.sp.fonts;
  const cap = (a, b, ko, extra = {}) => Object.assign({ a, b, ko }, extra);

  /* ---------------- 5월 어린이날: pinwheels, balloons, a paper plane - and the wind picks up ---------------- */
  {
    const wheels = [], r0 = rng(810);
    for (let i = 0; i < 7; i++) wheels.push({ x: 0.08 + i * 0.14 + (r0() - 0.5) * 0.04, h: 0.1 + r0() * 0.08, s: 0.8 + r0() * 0.5, hue: r0() * 360, ph: r0() * 10 });
    const balloons = [];
    for (let i = 0; i < 14; i++) balloons.push({ x: r0(), t: r0(), hue: [0, 45, 200, 120, 290, 330][i % 6], s: 0.8 + r0() * 0.5, sp: 0.5 + r0() });
    const pinwheel = (g, x, y, r, rot, hue, blades = 4) => {
      g.save(); g.translate(x, y); g.rotate(rot);
      for (let k = 0; k < blades; k++) {
        g.rotate(TAU / blades);
        g.fillStyle = `hsl(${(hue + k * 360 / blades) % 360},85%,60%)`;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(r, 0); g.lineTo(r * 0.1, -r * 0.9); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(r * 0.6, 0); g.lineTo(r * 0.1, -r * 0.5); g.closePath(); g.fill();
      }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r * 0.1, 0, TAU); g.fill();
      g.restore();
    };
    G.sp(5, {
      colors: ['#ffe46a', '#4ab8ff', '#0a1420'],
      snd: 'rise:crystalline hit:celesta tail:musicbox amb:whisper root:330 scale:major',
      captions: [
        cap(0.04, 0.2, '오늘은 누구나 어린이', { pos: 'top', style: 'fly', from: 'top', font: SANS }),
        cap(0.22, 0.4, '바람이 불면 바람개비가 돌고', { pos: 'top', style: 'fly', from: 'left', font: SANS }),
        cap(0.42, 0.6, '풍선은 하늘 높이', { pos: 'top', style: 'fly', from: 'bottom', font: SANS }),
        cap(0.72, 1.4, '마음껏 뛰어놀아도 되는 날', { style: 'fly', from: 'top', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#3a9aff'); sky.addColorStop(0.7, '#a8dcff'); sky.addColorStop(1, '#e8f6ff');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        TX.glow(g, W * 0.15, H * 0.14, m * 0.5, '#fff6c8', 0.9);
        g.fillStyle = '#fffbe0'; g.beginPath(); g.arc(W * 0.15, H * 0.14, m * 0.06, 0, TAU); g.fill();
        // clouds
        const cr = rng(12);
        for (let i = 0; i < 6; i++) {
          const x = ((cr() * W * 1.4 + time * 0.012 * (0.5 + cr())) % (W * 1.4)) - W * 0.2, y = H * (0.12 + cr() * 0.35), s = m * (0.05 + cr() * 0.05);
          g.fillStyle = 'rgba(255,255,255,0.9)';
          for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + (k - 2) * s * 0.8, y - Math.sin(k / 4 * Math.PI) * s * 0.6, s * (0.7 + 0.3 * Math.sin(k)), 0, TAU); g.fill(); }
        }
        const wind = seg(p, 0.42, 0.62), rv = E.outCubic(seg(p, 0.64, 0.76));
        // balloons, let go more and more as the wind rises
        for (const b of balloons) {
          const rise = ((b.t + time * 0.00004 * b.sp * (1 + wind * 3)) % 1.3) - 0.15;
          const x = b.x * W + Math.sin(time * 0.001 + b.t * 10) * m * 0.03, y = H * (1.05 - rise), r = m * 0.035 * b.s;
          g.strokeStyle = 'rgba(80,80,80,0.5)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(x, y + r * 1.2); g.quadraticCurveTo(x + Math.sin(time * 0.003 + b.t) * r, y + r * 2.5, x, y + r * 4); g.stroke();
          const bg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.2);
          bg.addColorStop(0, `hsl(${b.hue},90%,80%)`); bg.addColorStop(1, `hsl(${b.hue},80%,48%)`);
          g.fillStyle = bg; g.beginPath(); g.ellipse(x, y, r, r * 1.2, 0, 0, TAU); g.fill();
          g.beginPath(); g.moveTo(x - r * 0.15, y + r * 1.25); g.lineTo(x + r * 0.15, y + r * 1.25); g.lineTo(x, y + r * 1.1); g.fill();
        }
        // the hill and its row of pinwheels
        const hy = H * 0.8;
        g.fillStyle = '#5ac85a'; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 20) g.lineTo(x, hy - Math.sin(x / W * Math.PI) * m * 0.08);
        g.lineTo(W, H); g.fill();
        g.fillStyle = '#48b048'; g.fillRect(0, hy + m * 0.04, W, H);
        const spin = time * 0.004 * (1 + wind * 6);
        for (const w of wheels) {
          const x = w.x * W, base = hy - Math.sin(w.x * Math.PI) * m * 0.08, top = base - w.h * m * 2;
          g.strokeStyle = '#8a6a3a'; g.lineWidth = Math.max(1, u * 0.35); g.beginPath(); g.moveTo(x, base); g.lineTo(x, top); g.stroke();
          pinwheel(g, x, top, m * 0.05 * w.s, spin * (0.8 + 0.4 * w.s) + w.ph, w.hue);
        }
        // a paper plane looping overhead
        const pa = time * 0.0009, px = cx + Math.sin(pa) * W * 0.35, py = H * 0.35 + Math.sin(pa * 2) * H * 0.1, pang = Math.atan2(Math.cos(pa * 2) * H * 0.2, Math.cos(pa) * W * 0.35);
        g.save(); g.translate(px, py); g.rotate(pang); g.fillStyle = '#fff'; g.strokeStyle = '#9ab'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(m * 0.04, 0); g.lineTo(-m * 0.03, -m * 0.018); g.lineTo(-m * 0.015, 0); g.lineTo(-m * 0.03, m * 0.018); g.closePath(); g.fill(); g.stroke(); g.restore();
        // confetti in the gust
        if (wind > 0) {
          const fr = rng(Math.floor(time / 80));
          for (let i = 0; i < 40 * wind; i++) { g.fillStyle = `hsl(${fr() * 360},90%,60%)`; g.save(); g.translate(fr() * W, fr() * H); g.rotate(fr() * 6); g.fillRect(-u * 0.5, -u * 0.25, u, u * 0.5); g.restore(); }
        }
        // the giant pinwheel of light, then the crystal at its hub
        const giant = E.outBack(seg(p, 0.55, 0.66));
        if (giant > 0) {
          g.save(); g.globalAlpha = 0.85 * (1 - rv * 0.5);
          pinwheel(g, cx, cy, m * 0.3 * giant, time * 0.01 * (1 + wind * 2), time * 0.05, 8);
          g.restore();
        }
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 0.45, '#fff0a0', 0.8 * rv);
          TX.gem(g, 'star', cx, cy, m * 0.13 * E.outBack(rv), (time * 0.06) % 360, time, { col: ['#ffffff', G.hsl((time * 0.06) % 360, 90, 65), G.hsl((time * 0.06 + 120) % 360, 70, 30)] });
        }
        TX.flash(g, e, 0.7 * TX.bump(p, 0.64, 0.72), '#fffbe0');
        TX.vignette(g, e, 0.3);
      },
    });
  }

  /* ---------------- 6월 장마: rain that won't stop - until it does, mid-air, and every drop becomes one ---------------- */
  {
    const drops = [], r0 = rng(910);
    for (let i = 0; i < 240; i++) drops.push({ x: r0() * 1.2 - 0.1, y: r0(), sp: 0.8 + r0() * 0.6, l: 0.5 + r0() * 0.8 });
    const bld = [];
    for (let i = 0; i < 18; i++) bld.push({ x: i / 18, w: 0.04 + r0() * 0.03, h: 0.1 + r0() * 0.2, win: r0() });
    G.sp(6, {
      colors: ['#9ad8ff', '#3a7aff', '#040a14'],
      snd: 'rise:granular hit:celesta tail:chime amb:whisper root:196 scale:lydian',
      captions: [
        cap(0.04, 0.2, '비가 그치지 않는 계절', { pos: 'top', style: 'fade', font: SANS }),
        cap(0.22, 0.4, '우산 끝으로 떨어지는 소리', { pos: 'top', style: 'fade', font: SANS }),
        cap(0.5, 0.62, '멈춰', { pos: 'top', style: 'engrave', font: SANS }),
        cap(0.72, 1.4, '빗방울 하나에 여름이 담겨 있었다', { style: 'fade', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H), dur = e.def.duration;
        const freezeT = dur * 0.52, t = Math.min(time, freezeT), frozen = time > freezeT;
        const gather = E.inCubic(seg(p, 0.56, 0.66)), rv = E.outCubic(seg(p, 0.64, 0.76));
        const bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#060e1c'); bg.addColorStop(1, '#0e2236');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        // far city, blurred by the rain
        const gy = H * 0.72;
        for (const b of bld) {
          const bx = b.x * W, bw = b.w * W, bh = b.h * H;
          g.fillStyle = '#0a1826'; g.fillRect(bx, gy - bh, bw, bh);
          const wr = rng(Math.floor(b.win * 1000));
          for (let k = 0; k < 6; k++) { if (wr() < 0.5) continue; g.fillStyle = `rgba(255,${200 + wr() * 40},140,${0.3 + 0.3 * wr()})`; g.fillRect(bx + wr() * bw * 0.8, gy - bh + wr() * bh * 0.9, u * 0.8, u * 1.2); }
        }
        // wet street with the city reflected in it
        const st = g.createLinearGradient(0, gy, 0, H);
        st.addColorStop(0, '#0c1a2a'); st.addColorStop(1, '#050a12');
        g.fillStyle = st; g.fillRect(0, gy, W, H - gy);
        g.save(); g.globalAlpha = 0.25; g.fillStyle = 'rgba(255,210,150,1)';
        for (const b of bld) { const wr = rng(Math.floor(b.win * 1000) + 7); for (let k = 0; k < 3; k++) g.fillRect(b.x * W + wr() * b.w * W, gy + wr() * (H - gy), u * 0.6, u * (2 + wr() * 4)); }
        g.restore();
        // ripples in the puddles (only while it's still raining)
        if (!frozen) {
          g.strokeStyle = 'rgba(160,210,255,0.35)'; g.lineWidth = 1;
          for (let k = 0; k < 14; k++) {
            const slot = Math.floor(time / 400) + k, rr = rng(slot * 13), age = ((time / 400) + k) % 1;
            const x = rr() * W, y = gy + rr() * (H - gy);
            g.globalAlpha = 1 - age; g.beginPath(); g.ellipse(x, y, u * 4 * age, u * 1.2 * age, 0, 0, TAU); g.stroke();
          }
          g.globalAlpha = 1;
        }
        // the umbrella, beads of water sliding down its ribs
        const ux = cx, uy = cy + m * 0.12, ur = m * 0.26;
        g.save(); g.globalAlpha = 1 - rv * 0.8;
        g.fillStyle = 'rgba(190,225,255,0.12)'; g.strokeStyle = 'rgba(210,235,255,0.7)'; g.lineWidth = Math.max(1, u * 0.3);
        g.beginPath(); g.moveTo(ux - ur, uy);
        g.quadraticCurveTo(ux - ur, uy - ur * 0.9, ux, uy - ur * 0.95); g.quadraticCurveTo(ux + ur, uy - ur * 0.9, ux + ur, uy);
        for (let k = 6; k >= 0; k--) { const x0 = ux - ur + k / 6 * ur * 2; g.quadraticCurveTo(x0 + ur / 6, uy - ur * 0.08, x0, uy); }
        g.closePath(); g.fill(); g.stroke();
        for (let k = 0; k <= 6; k++) { const x0 = ux - ur + k / 6 * ur * 2; g.beginPath(); g.moveTo(ux, uy - ur * 0.95); g.quadraticCurveTo(lerp(ux, x0, 0.6), uy - ur * 0.6, x0, uy); g.stroke(); }
        g.beginPath(); g.moveTo(ux, uy - ur * 0.95); g.lineTo(ux, uy + ur * 0.9); g.arc(ux - ur * 0.08, uy + ur * 0.9, ur * 0.08, 0, Math.PI); g.stroke();
        for (let k = 0; k < 7; k++) {
          const f = ((t * 0.0004 + k * 0.37) % 1), x0 = ux - ur + k / 6 * ur * 2;
          const x = lerp(ux, x0, f), y = lerp(uy - ur * 0.95, uy, f) - Math.sin(f * Math.PI) * ur * 0.25;
          g.fillStyle = 'rgba(220,240,255,0.9)'; g.beginPath(); g.arc(x, y, u * 0.45, 0, TAU); g.fill();
        }
        g.restore();
        // lightning, once
        const bolt = TX.bump(p, 0.44, 0.47);
        if (bolt > 0) {
          g.fillStyle = `rgba(200,220,255,${0.5 * bolt})`; g.fillRect(0, 0, W, H);
          const br = rng(44); g.strokeStyle = `rgba(255,255,255,${bolt})`; g.lineWidth = u * 0.5; g.beginPath();
          let x = W * 0.7, y = 0; g.moveTo(x, y);
          while (y < gy * 0.8) { x += (br() - 0.5) * u * 8; y += u * (3 + br() * 4); g.lineTo(x, y); }
          g.stroke();
        }
        // the rain: streaks while falling, hanging beads once time stops, then all pulled into one
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const d of drops) {
          let x = d.x * W - (t * 0.00006 * d.sp) * W * 0.15, y = ((d.y + t * 0.0009 * d.sp) % 1.1) * H - H * 0.05;
          x = ((x % (W * 1.2)) + W * 1.2) % (W * 1.2) - W * 0.1;
          if (!frozen) {
            g.strokeStyle = 'rgba(170,215,255,0.45)'; g.lineWidth = Math.max(1, u * 0.18);
            g.beginPath(); g.moveTo(x, y); g.lineTo(x + u * 0.8, y - u * 5 * d.l); g.stroke();
          } else {
            x = lerp(x, cx, gather); y = lerp(y, cy, gather);
            const wob = Math.sin(time * 0.003 + d.x * 40) * u * 0.3 * (1 - gather);
            g.fillStyle = `rgba(200,235,255,${0.8 * (1 - rv)})`;
            g.beginPath(); g.ellipse(x + wob, y, u * 0.35, u * 0.5, 0, 0, TAU); g.fill();
          }
        }
        g.restore();
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 0.5, '#7ac8ff', 0.8 * rv);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 3; k++) {
            const rr = (time * 0.04 + k * m * 0.25) % (m * 0.75);
            g.strokeStyle = `rgba(160,220,255,${0.4 * rv * (1 - rr / (m * 0.75))})`; g.lineWidth = u * 0.3;
            g.beginPath(); g.ellipse(cx, cy, rr, rr * 0.9, 0, 0, TAU); g.stroke();
          }
          g.restore();
          TX.gem(g, 'octa', cx, cy, m * 0.14 * E.outBack(rv), 205, time, { col: ['#ffffff', '#8ad0ff', '#0a2a5a'], trans: 0.55 });
        }
        TX.flash(g, e, 0.7 * TX.bump(p, 0.64, 0.72), '#bfe6ff');
        TX.vignette(g, e, 0.65);
      },
    });
  }

  /* ---------------- 7월 여름 바다: sunset, the tide, and a clam that opens on a pearl ---------------- */
  {
    const gulls = [], r0 = rng(1010);
    for (let i = 0; i < 5; i++) gulls.push({ x: r0(), y: 0.15 + r0() * 0.2, s: 0.6 + r0() * 0.6, sp: 0.4 + r0() * 0.6, ph: r0() * 10 });
    G.sp(7, {
      colors: ['#ffd2a0', '#3ad8e0', '#060a18'],
      snd: 'rise:crystalline hit:celesta tail:chime amb:whisper root:220 scale:major',
      captions: [
        cap(0.04, 0.2, '여름의 끝에서 바다가 부른다', { pos: 'top', style: 'fly', from: 'left', font: SANS }),
        cap(0.22, 0.4, '파도가 밀려올 때마다', { pos: 'top', style: 'fly', from: 'right', font: SANS }),
        cap(0.42, 0.6, '바다가 숨겨 둔 것이 떠오른다', { pos: 'top', style: 'fly', from: 'left', font: SANS }),
        cap(0.72, 1.4, '바다가 오래 품어 온 빛', { style: 'fly', from: 'bottom', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const hz = H * 0.5, sink = seg(p, 0, 0.7);
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, '#2a1a5a'); sky.addColorStop(0.55, '#c85a7a'); sky.addColorStop(1, '#ffb070');
        g.fillStyle = sky; g.fillRect(0, 0, W, hz);
        // sun setting into the sea
        const sr = m * 0.12, sy = lerp(hz - sr * 0.6, hz + sr * 0.4, sink);
        TX.glow(g, cx, hz, m * 0.9, '#ff9a5a', 0.6);
        g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip();
        const sg = g.createRadialGradient(cx, sy, 0, cx, sy, sr); sg.addColorStop(0, '#fff2c8'); sg.addColorStop(1, '#ff8a3a');
        g.fillStyle = sg; g.beginPath(); g.arc(cx, sy, sr, 0, TAU); g.fill(); g.restore();
        // sea
        const sea = g.createLinearGradient(0, hz, 0, H);
        sea.addColorStop(0, '#5a3a7a'); sea.addColorStop(0.4, '#1a3a6a'); sea.addColorStop(1, '#061a36');
        g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
        // the sun's glitter path on the water
        g.save(); g.globalCompositeOperation = 'lighter';
        const gr = rng(Math.floor(time / 120));
        for (let i = 0; i < 90; i++) {
          const d = gr(), y = hz + d * d * (H - hz) * 0.9, w = (sr * 0.4 + d * m * 0.25) * (0.3 + gr());
          g.fillStyle = `rgba(255,${190 + gr() * 50},120,${0.5 * (1 - d)})`;
          g.fillRect(cx + (gr() - 0.5) * (sr + d * m * 0.4) - w / 2, y, w, Math.max(1, u * 0.25));
        }
        g.restore();
        // swell lines rolling in
        g.strokeStyle = 'rgba(255,220,200,0.18)'; g.lineWidth = 1;
        for (let k = 0; k < 16; k++) {
          const f = ((k / 16 + time * 0.00003) % 1), y = hz + f * f * (H - hz);
          g.beginPath(); for (let x = 0; x <= W; x += W / 30) g.lineTo(x, y + Math.sin(x * 0.02 + k + time * 0.001) * u * f * 1.5); g.stroke();
        }
        // shore: wet sand and foam washing in and out
        const shore = H * 0.9 + Math.sin(time * 0.0012) * m * 0.02;
        g.fillStyle = '#c8a07a'; g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 30) g.lineTo(x, shore + Math.sin(x * 0.015 + time * 0.001) * u * 1.5);
        g.lineTo(W, H); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = u * 0.5; g.beginPath();
        for (let x = 0; x <= W; x += W / 30) g.lineTo(x, shore + Math.sin(x * 0.015 + time * 0.001) * u * 1.5); g.stroke();
        // gulls
        g.strokeStyle = '#2a1a2a'; g.lineWidth = Math.max(1, u * 0.3);
        for (const q of gulls) {
          const x = ((q.x * W + time * 0.02 * q.sp) % (W * 1.2)) - W * 0.1, y = q.y * H + Math.sin(time * 0.001 + q.ph) * u * 2, f = Math.sin(time * 0.008 + q.ph) * 0.5, s = m * 0.025 * q.s;
          g.beginPath(); g.moveTo(x - s, y - s * f); g.quadraticCurveTo(x - s * 0.4, y - s * 0.4, x, y); g.quadraticCurveTo(x + s * 0.4, y - s * 0.4, x + s, y - s * f); g.stroke();
        }
        // the clam rises from the water and opens
        const rise = E.outBack(seg(p, 0.46, 0.6)), openK = E.inOut(seg(p, 0.6, 0.68)), rv = E.outCubic(seg(p, 0.64, 0.76));
        if (p > 0.46) {
          const kx = cx, ky = lerp(H * 0.75, cy + m * 0.1, rise), kr = m * 0.2;
          // the top shell swings up and back on its hinge (lifted + foreshortened), leaving the pearl in front
          const shell = (up, ang) => {
            g.save(); g.translate(kx, ky - (up ? openK * kr * 0.75 : 0)); if (up) g.scale(1, 1 - openK * 0.45); g.rotate(ang);
            const sg2 = g.createLinearGradient(0, up ? -kr : 0, 0, up ? 0 : kr * 0.4);
            sg2.addColorStop(0, '#ffe0d0'); sg2.addColorStop(1, '#d08a8a');
            g.fillStyle = sg2; g.beginPath(); g.moveTo(-kr, 0);
            for (let k = 0; k <= 10; k++) { const a = Math.PI + k / 10 * Math.PI; g.lineTo(Math.cos(a) * kr, (up ? Math.sin(a) : -Math.sin(a) * 0.35) * kr + (k % 2 ? 0 : (up ? -1 : 1) * kr * 0.04)); }
            g.closePath(); g.fill();
            g.strokeStyle = 'rgba(160,80,80,0.5)'; g.lineWidth = Math.max(1, u * 0.2);
            for (let k = 1; k < 10; k++) { const a = Math.PI + k / 10 * Math.PI; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * kr * 0.97, (up ? Math.sin(a) : -Math.sin(a) * 0.35) * kr * 0.97); g.stroke(); }
            g.restore();
          };
          shell(false, 0);
          shell(true, 0);
          if (openK > 0) TX.glow(g, kx, ky - kr * 0.15, m * 0.35, '#fff6ff', 0.6 * openK);
          if (rv > 0) {
            TX.glow(g, kx, ky - kr * 0.2, m * 0.5, '#fff0f4', 0.8 * rv);
            G.cine.orb(g, kx, lerp(ky - kr * 0.1, cy - m * 0.02, rv), m * 0.08 * E.outBack(rv), { col: ['#ffffff', '#f4e4ff', '#b89ac8'], kind: 'pearl', t: time, glow: 0.6 });
          }
          // spray as it breaches
          const br = TX.bump(p, 0.46, 0.56);
          if (br > 0) { const sr2 = rng(5); g.fillStyle = `rgba(255,255,255,${br})`; for (let i = 0; i < 40; i++) { const a = -Math.PI * sr2(), v = m * 0.2 * sr2() * br; g.beginPath(); g.arc(kx + Math.cos(a) * v * 1.5, ky + Math.sin(a) * v, u * 0.4, 0, TAU); g.fill(); } }
        }
        TX.flash(g, e, 0.7 * TX.bump(p, 0.64, 0.72), '#fff0e0');
        TX.vignette(g, e, 0.5);
      },
    });
  }

  /* ---------------- 8월 불꽃축제: fireworks over a river city; the last one bursts into a gem ---------------- */
  {
    const shots = [], r0 = rng(1110), DUR = 18000;
    const add = (t, x, y, hue, type, n) => shots.push({ t, x, y, hue, type, n, seed: shots.length * 17 + 3 });
    for (let t = 600; t < DUR * 0.5; t += 650 + r0() * 450) add(t, 0.15 + r0() * 0.7, 0.18 + r0() * 0.2, r0() * 360, ['peony', 'willow', 'ring', 'peony'][Math.floor(r0() * 4)], 60);
    for (let t = DUR * 0.5; t < DUR * 0.62; t += 140 + r0() * 90) add(t, 0.1 + r0() * 0.8, 0.12 + r0() * 0.25, r0() * 360, ['peony', 'ring', 'willow'][Math.floor(r0() * 3)], 40);
    for (let t = DUR * 0.8; t < DUR; t += 900 + r0() * 400) add(t, 0.15 + r0() * 0.7, 0.18 + r0() * 0.15, r0() * 360, 'peony', 40);
    const bld = [];
    for (let i = 0; i < 26; i++) bld.push({ x: i / 26, w: 0.03 + r0() * 0.03, h: 0.05 + r0() * 0.14, s: r0() });
    const burst = (g, s, tau, W, H, u, flipY, hz) => {
      const LIFT = 750, age = tau - LIFT, sx = s.x * W, ay = s.y * H;
      const Y = y => (flipY ? hz + (hz - y) * 0.55 : y);
      if (tau < LIFT) {
        const k = tau / LIFT, y = lerp(hz, ay, E.outCubic(k));
        g.fillStyle = `rgba(255,220,180,${flipY ? 0.25 : 0.9})`; g.fillRect(sx - 1, Y(y), 2, u * 1.5);
        return;
      }
      if (age > 2200) return;
      const r = rng(s.seed), fade = 1 - age / 2200, a = age / 1000, hue = s.type === 'willow' ? 42 : s.hue;
      if (age < 260 && !flipY) G.tx.glow(g, sx, ay, H * 0.25, G.hsl(hue, 100, 70), 0.9 * (1 - age / 260));
      g.fillStyle = g.strokeStyle = `hsla(${hue},100%,${62 + 25 * fade}%,${(flipY ? 0.3 : 1) * Math.min(1, fade * 1.4)})`;
      for (let i = 0; i < s.n * 1.6; i++) {
        const ang = i / (s.n * 1.6) * TAU + r() * 0.1, v = (s.type === 'ring' ? 1 : 0.35 + r() * 0.75) * H * 0.22;
        const dx = Math.cos(ang) * v * (1 - Math.exp(-a * 2.2)) / 2.2 * 2.2, dy = (s.type === 'ring' ? Math.sin(ang) * 0.35 : Math.sin(ang)) * v * (1 - Math.exp(-a * 2.2)) + H * 0.05 * a * a;
        const x = sx + dx, y = ay + dy;
        if (s.type === 'willow') { g.lineWidth = Math.max(1, u * 0.2); g.beginPath(); g.moveTo(x, Y(y)); g.lineTo(x - dx * 0.08, Y(y - dy * 0.15 - u * 3)); g.stroke(); }
        else { const d = u * (0.45 + 0.35 * fade); g.fillRect(x - d / 2, Y(y) - d / 2, d, d); }
      }
    };
    G.sp(8, {
      colors: ['#ff9aff', '#6ac8ff', '#040412'],
      snd: 'rise:granular hit:laser tail:chime amb:space root:247 scale:lydian',
      captions: [
        cap(0.04, 0.2, '한여름 밤, 강물 위로', { pos: 'top', style: 'fade', font: SANS }),
        cap(0.22, 0.4, '하늘에 꽃이 핀다', { pos: 'top', style: 'fade', font: SANS }),
        cap(0.5, 0.62, '마지막 한 발', { pos: 'top', style: 'engrave', font: SANS }),
        cap(0.72, 1.4, '사라지는 빛이 가장 아름답다', { style: 'fade', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H), hz = H * 0.72;
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, '#04040e'); sky.addColorStop(1, '#141a36');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        const river = g.createLinearGradient(0, hz, 0, H); river.addColorStop(0, '#0c1228'); river.addColorStop(1, '#03040a');
        g.fillStyle = river; g.fillRect(0, hz, W, H - hz);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (const s of shots) { const tau = time - s.t; if (tau >= 0 && tau < 3000) burst(g, s, tau, W, H, u, false, hz); }
        // reflections in the river, rippled
        g.save(); g.beginPath(); g.rect(0, hz, W, H - hz); g.clip();
        for (const s of shots) { const tau = time - s.t; if (tau >= 0 && tau < 3000) burst(g, s, tau, W, H, u, true, hz); }
        g.restore();
        g.restore();
        // skyline
        g.fillStyle = '#05060e';
        for (const b of bld) { g.fillRect(b.x * W, hz - b.h * H, b.w * W + 1, b.h * H); }
        for (const b of bld) { const wr = rng(Math.floor(b.s * 999)); for (let k = 0; k < 4; k++) { if (wr() < 0.4) continue; g.fillStyle = `rgba(255,220,150,${0.4 * wr()})`; g.fillRect(b.x * W + wr() * b.w * W, hz - b.h * H * wr(), u * 0.6, u * 0.8); } }
        g.fillStyle = 'rgba(255,255,255,0.05)';
        for (let k = 0; k < 10; k++) { const y = hz + (k / 10) * (H - hz); g.fillRect(0, y + Math.sin(time * 0.001 + k) * u, W, 1); }
        // the finale: one enormous shell whose sparks settle into the outline of a gem, then the gem
        const fin = seg(p, 0.6, 0.68), rv = E.outCubic(seg(p, 0.64, 0.76));
        if (fin > 0 && rv < 1) {
          const N = 64, outline = [[0, -1], [0.6, -0.35], [0.45, 0.2], [0, 1], [-0.45, 0.2], [-0.6, -0.35]];
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < N; i++) {
            const f = i / N * outline.length, a = outline[Math.floor(f)], b = outline[(Math.floor(f) + 1) % outline.length], k = f % 1;
            const tx = cx + lerp(a[0], b[0], k) * m * 0.25, ty = cy + lerp(a[1], b[1], k) * m * 0.25;
            const ang = i / N * TAU, burstR = m * 0.35 * E.outCubic(fin);
            const x = lerp(cx + Math.cos(ang) * burstR, tx, E.inOut(seg(fin, 0.4, 1))), y = lerp(cy + Math.sin(ang) * burstR, ty, E.inOut(seg(fin, 0.4, 1)));
            g.fillStyle = `hsla(${(i * 6 + time * 0.1) % 360},95%,70%,${1 - rv})`; g.beginPath(); g.arc(x, y, u * 0.6, 0, TAU); g.fill();
          }
          g.restore();
        }
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 0.5, '#ff9aff', 0.7 * rv);
          TX.gem(g, 'star', cx, cy, m * 0.14 * E.outBack(rv), (time * 0.05) % 360, time, { col: ['#ffffff', G.hsl((time * 0.05) % 360, 95, 65), G.hsl((time * 0.05 + 180) % 360, 70, 25)] });
        }
        TX.flash(g, e, 0.7 * TX.bump(p, 0.64, 0.72), '#ffe0ff');
        TX.vignette(g, e, 0.55);
      },
    });
  }
})();
