/*
  TRANSCENDENT (10억대) - three hand-directed films, ~22s each, built on the cine pipeline
  (fog, additive sprites, 3D crystal, bloom, radial light shafts, grain) with cinematic captions.
  They open with a blackout (engine.js).
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const Cine = G.cine, TAU = Math.PI * 2, R = G.cutscenes.register;
  const hx = G.hsl, css = Cine.css, rgb = Cine.rgb;
  /* the TRANSCENDENT hero: a colossal 20-sided crystal spire (icosagon prism), not a faceted "eye"-like gem */
  const GEM = Cine.mesh.prism(20, 0.42, 1.5, 0.45, { taper: 0.97, tipB: 0.45, jit: 0.012 });

  /* ---------- shared pieces ---------- */
  /* log-spiral galaxy made of glow sprites */
  function galaxy(g, cx, cy, Rr, arms, rot, tilt, alpha, cols, seed, n = 420) {
    if (Rr < 2 || alpha <= 0) return;
    const r = rng(seed);
    g.save(); g.globalCompositeOperation = 'lighter';
    Cine.glow(g, cx, cy, Rr * 0.42, cols[0], 0.85 * alpha);
    for (let i = 0; i < n; i++) {
      const arm = i % arms, rad = Rr * Math.pow(r(), 0.62), ang = (arm / arms) * TAU + (rad / Rr) * 4.4 + rot + (r() - 0.5) * 0.35;
      const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * tilt, t = rad / Rr;
      Cine.glow(g, x, y, Rr * (0.012 + r() * 0.03), t < 0.5 ? cols[0] : cols[1], alpha * (0.9 - t * 0.55));
    }
    g.restore();
  }
  /* tilted accretion disk: hot inner ring -> cool outer, orbiting particles with a Doppler-bright side */
  function accretion(g, cx, cy, Rr, tilt, time, alpha, inner, outer, seed) {
    if (Rr < 2 || alpha <= 0) return;
    const r = rng(seed), ci = rgb(inner), co = rgb(outer);
    g.save(); g.translate(cx, cy); g.rotate(-0.28); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      const q = i / 9, rad = Rr * (0.32 + q * 0.68);
      g.strokeStyle = css(Cine.mixc(ci, co, q), alpha * (0.7 - q * 0.45)); g.lineWidth = Rr * (0.05 - q * 0.03);
      g.beginPath(); g.ellipse(0, 0, rad, rad * tilt, 0, 0, TAU); g.stroke();
    }
    for (let i = 0; i < 260; i++) {
      const q = Math.pow(r(), 0.7), rad = Rr * (0.3 + q * 0.7), ph = r() * TAU, w = 0.0011 * Math.pow(0.3 / (0.3 + q * 0.7), 1.5);
      const a = ph + time * w, x = Math.cos(a) * rad, y = Math.sin(a) * rad * tilt, dop = 0.55 + 0.45 * Math.cos(a - 0.6);
      Cine.glow(g, x, y, Rr * (0.012 + r() * 0.02), q < 0.4 ? inner : outer, alpha * dop * 0.9);
    }
    g.restore();
  }
  const shake = (u, k) => [(Math.random() - 0.5) * u * 2.2 * k, (Math.random() - 0.5) * u * 2.2 * k];

  /* ================= 1. GENESIS SINGULARITY ================= */
  R({
    id: 'genesis', name: 'Genesis Singularity', odds: 1000000000, zone: 0, duration: 22000, revealAt: 0.66,
    snd: 'rise:rumble hit:cathedral tail:pad amb:space root:55 scale:minor',
    colors: ['#fff1c9', '#8a5cff', '#000000'],
    captions: [
      { a: 0.03, b: 0.17, ko: '태초에는 아무것도 없었다', en: 'IN THE BEGINNING, NOTHING', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.19, b: 0.35, ko: '그리고 하나의 점이 숨을 쉬었다', en: 'THEN A SINGLE POINT BREATHED', pos: 'center', style: 'fly', from: 'left' },
      { a: 0.37, b: 0.55, ko: '모든 것이 한 곳으로 모여들었다', en: 'EVERYTHING FELL INTO ONE', style: 'fly', from: 'right' },
      { a: 0.7, b: 0.86, ko: '그리고, 빛이 있었다', en: 'AND THERE WAS LIGHT', style: 'fly', from: 'bottom' },
      { a: 0.88, b: 1.4, ko: '이 순간 우주는 당신의 것이다', en: 'THE UNIVERSE IS YOURS', style: 'fly', from: 'top' },
    ],
    draw(gm, e) {
      Cine.render(gm, e, g => {
        const { p, u, W, H, cx, cy, time } = e, S = Math.min(W, H);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        const a1 = E.outCubic(seg(p, 0.06, 0.32)), a2 = seg(p, 0.32, 0.57), boom = seg(p, 0.565, 0.625), a3 = seg(p, 0.615, 1), pre = p < 0.62;
        const sk = pre ? seg(p, 0.3, 0.6) * 1.1 : (1 - seg(p, 0.62, 0.9)) * 1.7, [sx, sy] = shake(u, sk);
        const zoom = pre ? 1 + 0.1 * seg(p, 0.1, 0.6) : 1.12 - 0.14 * E.outCubic(seg(p, 0.62, 1));
        g.save(); g.translate(cx + sx, cy + sy); g.scale(zoom, zoom); g.translate(-cx, -cy);
        if (pre) {
          Cine.fog(g, e, '#8a5cff', { s: 2.6, vx: -4, vy: 2, a: 0.34 * a1, comp: 'lighter' });
          Cine.fog(g, e, '#ffb45a', { s: 2, vx: 5, vy: -3, a: 0.2 * a1, comp: 'lighter', ox: 80 });
          const hb = Math.pow(Math.max(0, Math.sin(time * 0.0052)), 9), rr = rng(4);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 160; i++) {                                   // matter falling in, spiralling
            const an = rr() * TAU, r0 = S * (0.24 + rr() * 0.75), q = clamp(seg(p, 0.1, 0.58) * 1.35 - rr() * 0.4);
            if (q <= 0 || q >= 1) continue;
            const sp = (1 - q) * 6, d = r0 * (1 - E.inCubic(q)), d2 = r0 * (1 - E.inCubic(Math.max(0, q - 0.06)));
            const x = cx + Math.cos(an + sp) * d, y = cy + Math.sin(an + sp) * d * 0.62, x2 = cx + Math.cos(an + (1 - Math.max(0, q - 0.06)) * 6) * d2, y2 = cy + Math.sin(an + (1 - Math.max(0, q - 0.06)) * 6) * d2 * 0.62;
            g.strokeStyle = css(rgb(i % 3 ? '#ffd9a0' : '#b9a0ff'), 0.15 + 0.6 * q); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
            Cine.glow(g, x, y, S * 0.012, '#ffffff', 0.55 * q);
          }
          g.restore();
          accretion(g, cx, cy, S * 0.46 * (0.2 + 0.8 * a1) * (1 - 0.4 * a2), 0.26, time, 0.95 * a1, '#fff7e0', '#8a5cff', 4);
          const core = S * (0.008 + 0.05 * a1 + 0.13 * E.inCubic(a2) + 0.1 * boom) * (1 + 0.28 * hb);
          Cine.add(g, () => { Cine.glow(g, cx, cy, core * 7, '#8a5cff', 0.5 * a1); Cine.glow(g, cx, cy, core * 3.2, '#ffd9a0', 0.9); Cine.star(g, cx, cy, core * 9, '#ffffff', 0.9 * a1, time * 0.00012); });
          g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, core * 0.5, 0, TAU); g.fill();
          if (a2 > 0.4) Cine.add(g, () => {                                    // the point cracks
            const r2 = rng(88 + Math.floor(time / 90));
            for (let i = 0; i < 14; i++) { const an = r2() * TAU, L = e.R * a2 * (0.35 + r2() * 0.8); G.fx.bolt(g, cx, cy, cx + Math.cos(an) * L, cy + Math.sin(an) * L, i * 7 + Math.floor(time / 90), u * 8, '#ffffff', u * (0.2 + 0.4 * r2()), 0.75 * a2); }
          });
        } else {
          const k = E.outExpo(a3), grow = E.outCubic(seg(a3, 0.1, 0.65)), sc = lerp(4.4, 2, E.outCubic(a3));
          Cine.fog(g, e, '#ff5fa2', { s: sc * 0.95, vx: 3, vy: 1, a: 0.4 * grow, comp: 'lighter', ox: cx * (1 - k) });
          Cine.fog(g, e, '#8a5cff', { s: sc, vx: -2, vy: 2, a: 0.46 * grow, comp: 'lighter', ox: -cx * (1 - k) });
          Cine.fog(g, e, '#3ec8ff', { s: sc * 1.15, vx: 2, vy: -1, a: 0.3 * grow, comp: 'lighter', oy: cy * (1 - k) });
          Cine.fog(g, e, '#ffd28a', { s: sc * 0.8, vx: -3, vy: -2, a: 0.28 * grow, comp: 'lighter' });
          Cine.motes(g, e, { n: 200, seed: 3, col: '#ffffff', size: 0.5, twinkle: 1, a: 0.95 * E.outCubic(seg(a3, 0.08, 0.5)) });
          const rr = rng(11);                                                  // hyperspace streaks that settle into stars
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 130; i++) {
            const an = rr() * TAU, d = 0.06 + rr(), rad = k * e.R * d, L = S * 0.5 * d * (1 - E.outCubic(seg(a3, 0, 0.5)));
            g.strokeStyle = css(rgb(i % 4 ? '#ffffff' : '#ffd9a0'), 0.7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + Math.cos(an) * (rad - L), cy + Math.sin(an) * (rad - L)); g.lineTo(cx + Math.cos(an) * rad, cy + Math.sin(an) * rad); g.stroke();
          }
          g.restore();
          galaxy(g, cx, cy, S * 0.66 * E.outCubic(seg(a3, 0.14, 0.7)), 3, time * 0.00012, 0.44, 0.95 * seg(a3, 0.12, 0.5), ['#ffe3b0', '#8fb0ff'], 9);
          Cine.add(g, () => { for (let i = 0; i < 3; i++) { const q = clamp(a3 * 1.4 - i * 0.12); Cine.fx_ring(g, cx, cy, e.R * 1.15 * E.outExpo(q), u * (2.6 - i * 0.6), i % 2 ? '#8a5cff' : '#ffffff', (1 - q) * 0.9); } });
          // the crystal that condenses out of the light
          const gs = S * 0.2 * E.outBack(seg(a3, 0.14, 0.42));
          if (gs > 1) {
            Cine.add(g, () => Cine.glow(g, cx, cy, gs * 3, '#ffd28a', 0.35));
            Cine.drawMesh(g, GEM, { x: cx, y: cy, s: gs, rx: -0.3, ry: time * 0.0005, col: [hx(45, 90, 82), hx(268, 80, 56), hx(268, 70, 12)], trans: 0.85, glow: 0.4, shine: 60, t: time, sparkle: 1 });
            Cine.add(g, () => {
              const r0 = gs * 2.3, rot = time * 0.0003, hh = E.outCubic(seg(a3, 0.3, 0.7));
              Cine.fx_ring(g, cx, cy, r0, u * 0.5, '#ffe3b0', 0.8 * hh);
              for (let i = 0; i < 48; i++) { const a = rot + (i / 48) * TAU, l = i % 4 ? gs * 0.06 : gs * 0.15; g.strokeStyle = css(rgb('#ffffff'), 0.7 * hh); g.lineWidth = 1; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0 * 1.03, cy + Math.sin(a) * r0 * 1.03 * 0.96); g.lineTo(cx + Math.cos(a) * (r0 * 1.03 + l), cy + Math.sin(a) * (r0 * 1.03 + l) * 0.96); g.stroke(); }
            });
            Cine.flare(g, e, cx, cy, 0.5 * E.outCubic(seg(a3, 0.2, 0.55)), '#ffd28a');
            const gw = E.outCubic(seg(a3, 0.25, 0.65));
            Cine.mandala(g, cx, cy, gs * 2.7 * gw, time * 0.00032, 0.65 * gw, '#8a5cff', '#ffd28a');
            Cine.wireframe(g, 'icosa', { x: cx, y: cy, s: gs * 2.15 * gw, rx: 0.5 + time * 0.0003, ry: time * 0.00045, col: '#8a5cff', alpha: 0.8 * gw, glow: 0.5, lineW: 1.4 });
            Cine.wireframe(g, 'merkaba', { x: cx, y: cy, s: gs * 1.5 * gw, rx: -0.3 - time * 0.00025, ry: -time * 0.0005, col: '#ffffff', alpha: 0.55 * gw, glow: 0.3, lineW: 1 });
          }
        }
        g.restore();
        return {
          bloom: 0.55 + 0.45 * a2 + (pre ? 0 : 0.5 * (1 - a3)), rays: pre ? 0.12 + 0.55 * a2 : 0.95 * (1 - E.outCubic(seg(a3, 0, 0.5))) + 0.25,
          rx: cx, ry: cy, grain: 0.11, vig: 0.62, flash: pre ? 0.95 * boom : 1 * (1 - E.outCubic(seg(a3, 0, 0.13))),
        };
      });
    },
  });

  /* ================= 2. CHRONOS REQUIEM ================= */
  const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  function gear(g, x, y, r, teeth, rot, k) {
    const pts = teeth * 4;
    g.beginPath();
    for (let i = 0; i < pts; i++) { const a = rot + (i / pts) * TAU, rr = (i % 4 < 2) ? r : r * 0.86; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.closePath();
    const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, css([120, 78, 30], 0.85 * k)); gr.addColorStop(0.5, css([64, 40, 14], 0.85 * k)); gr.addColorStop(1, css([28, 16, 6], 0.9 * k));
    g.fillStyle = gr; g.fill(); g.strokeStyle = css([255, 200, 110], 0.55 * k); g.lineWidth = Math.max(1, r * 0.03); g.stroke();
    g.beginPath(); g.arc(x, y, r * 0.55, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y, r * 0.14, 0, TAU); g.fillStyle = css([10, 6, 2], 0.9 * k); g.fill();
    for (let i = 0; i < 6; i++) { const a = rot + (i / 6) * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.16, y + Math.sin(a) * r * 0.16); g.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); g.stroke(); }
  }
  const frozen = e => Object.assign({}, e, { time: e.def.duration * e.def.revealAt });

  R({
    id: 'chronos', name: 'Chronos Requiem', odds: 2500000000, zone: 0, duration: 23000, revealAt: 0.64,
    snd: 'rise:ticks hit:gong tail:bells amb:machine root:110 scale:harmonic',
    colors: ['#ffd98a', '#c9822b', '#0a0703'],
    captions: [
      { a: 0.04, b: 0.2, ko: '시간은 흐르지 않는다, 다만 되감길 뿐', en: 'TIME DOES NOT FLOW. IT UNWINDS', pos: 'top', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.22, b: 0.4, ko: '초침이 비명을 지르며 달려간다', en: 'THE SECOND HAND SCREAMS ONWARD', pos: 'center', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.42, b: 0.58, ko: '마지막 한 초, 세계가 숨을 멈춘다', en: 'ONE LAST SECOND', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.7, b: 0.86, ko: '영원 속에서 부서진 시간', en: 'SHATTERED IN ETERNITY', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.88, b: 1.4, ko: '이 순간, 시간은 당신을 위해 멈춘다', en: 'TIME STANDS STILL FOR YOU', style: 'type', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
    ],
    draw(gm, e) {
      Cine.render(gm, e, g => {
        const { p, u, W, H, cx, cy, time } = e, S = Math.min(W, H), R0 = S * 0.36;
        const t1 = E.outCubic(seg(p, 0.02, 0.22)), spin = E.inCubic(seg(p, 0.1, 0.57)), stopped = p >= 0.58, shat = p >= 0.6, b = seg(p, 0.6, 1);
        const sk = p < 0.6 ? seg(p, 0.35, 0.6) * 0.9 : (1 - seg(p, 0.6, 0.8)) * 1.5, [sx, sy] = shake(u, sk);
        const eW = shat ? frozen(e) : e;                                   // TIME STOP: the whole world freezes at the moment of the break
        g.save(); g.translate(cx + sx, cy + sy); const z = 1 + 0.07 * seg(p, 0, 0.6) - 0.05 * E.outCubic(b); g.scale(z, z); g.translate(-cx, -cy);
        Cine.env.clockwork(g, eW, { h: 38, k: t1, cam: { x: 0, y: 0 }, o: {} });
        Cine.add(g, () => Cine.glow(g, cx, cy, R0 * 2.2, '#ffb040', 0.32 * t1));
        if (!shat) {
          // rewinding dust
          Cine.motes(g, e, { n: 70, seed: 6, col: '#ffe0a0', size: 0.5, vy: -3 - 20 * spin, wobble: 2, a: 0.8 * t1, twinkle: 1 });
          // dial
          g.save(); g.translate(cx, cy);
          const face = g.createRadialGradient(0, 0, R0 * 0.05, 0, 0, R0); face.addColorStop(0, css([26, 14, 4], 0.9 * t1)); face.addColorStop(1, css([84, 50, 14], 0.9 * t1));
          g.fillStyle = face; g.beginPath(); g.arc(0, 0, R0 * t1, 0, TAU); g.fill();
          const rim = g.createRadialGradient(0, 0, R0 * 0.88, 0, 0, R0 * 1.06); rim.addColorStop(0, css([70, 40, 10], t1)); rim.addColorStop(0.5, css([255, 214, 130], t1)); rim.addColorStop(1, css([70, 40, 10], t1));
          g.strokeStyle = rim; g.lineWidth = R0 * 0.1; g.beginPath(); g.arc(0, 0, R0 * 0.97 * t1, 0, TAU); g.stroke();
          g.strokeStyle = css([255, 214, 130], 0.5 * t1); g.lineWidth = 1; g.beginPath(); g.arc(0, 0, R0 * 0.78 * t1, 0, TAU); g.stroke();
          for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU - Math.PI / 2, l = i % 5 ? R0 * 0.03 : R0 * 0.07, r1 = R0 * 0.86 * t1; g.strokeStyle = css([255, 222, 150], (i % 5 ? 0.6 : 1) * t1); g.lineWidth = i % 5 ? 1 : 2.2; g.beginPath(); g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a) * (r1 - l), Math.sin(a) * (r1 - l)); g.stroke(); }
          g.fillStyle = css([255, 222, 150], 0.95 * t1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${R0 * 0.12}px "Times New Roman", Georgia, serif`;
          for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU - Math.PI / 2; g.fillText(ROMAN[i], Math.cos(a) * R0 * 0.67, Math.sin(a) * R0 * 0.67); }
          const turn = -spin * TAU * 15, top = -Math.PI / 2;
          const hand = (ang, len, w, col, ghosts) => {
            for (let gi = ghosts; gi >= 0; gi--) {
              const aa = ang + gi * spin * 0.045 * (col === 'sec' ? 3 : 1), al = gi === 0 ? 1 : 0.16 * (1 - gi / (ghosts + 1));
              g.save(); g.rotate(aa); g.globalAlpha *= al;
              const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, css([255, 210, 120])); gr.addColorStop(1, css(col === 'sec' ? [255, 255, 255] : [255, 240, 200]));
              g.fillStyle = gr; g.beginPath(); g.moveTo(-len * 0.14, -w * 0.5); g.lineTo(len * 0.1, -w); g.lineTo(len, 0); g.lineTo(len * 0.1, w); g.lineTo(-len * 0.14, w * 0.5); g.closePath(); g.fill(); g.restore();
            }
          };
          hand(turn / 15 + top, R0 * 0.5, R0 * 0.045, 'h', 0); hand(turn + top, R0 * 0.76, R0 * 0.03, 'm', Math.round(4 * spin));
          hand(turn * 4 + top, R0 * 0.84, R0 * 0.012, 'sec', Math.round(6 * spin));
          const cap = g.createRadialGradient(-R0 * 0.01, -R0 * 0.01, 0, 0, 0, R0 * 0.06); cap.addColorStop(0, '#fff2c8'); cap.addColorStop(1, '#a06a1a'); g.fillStyle = cap; g.beginPath(); g.arc(0, 0, R0 * 0.055, 0, TAU); g.fill();
          g.restore();
          // time ripples sucked back inward
          Cine.add(g, () => { for (let i = 0; i < 4; i++) { const q = 1 - ((time * 0.00035 * (1 + 2 * spin) + i / 4) % 1); Cine.fx_ring(g, cx, cy, R0 * (0.3 + 1.3 * q), u * 0.5, '#ffd28a', (1 - q) * 0.5 * t1); } });
          if (stopped) Cine.add(g, () => { const q = seg(p, 0.58, 0.6); Cine.fx_ring(g, cx, cy, R0 * (1 + q * 0.5), u * 2, '#ffffff', (1 - q) * 0.9); });
        } else {
          // the dial bursts into wedges that hang in the air
          const k = E.outExpo(b), r = rng(15), N = 26;
          for (let i = 0; i < N; i++) {
            const a0 = (i / N) * TAU, a1 = a0 + (TAU / N) * 0.94, mid = (a0 + a1) / 2, d = R0 * (0.06 + r() * 0.9) * k * 1.4, rot = (r() - 0.5) * 0.7 * (1 - Math.exp(-b * 5)), fl = Math.sin(time * 0.0007 + i) * u * 0.9;
            g.save(); g.translate(cx + Math.cos(mid) * d, cy + Math.sin(mid) * d + fl); g.rotate(rot);
            g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0 * (0.7 + 0.3 * r()), a0, a1); g.closePath();
            const gr = g.createRadialGradient(0, 0, 0, 0, 0, R0); gr.addColorStop(0, css([70, 40, 12], 0.6)); gr.addColorStop(1, css([255, 208, 120], 0.55)); g.fillStyle = gr; g.fill();
            g.strokeStyle = css([255, 240, 200], 0.9); g.lineWidth = 1.4; g.stroke(); g.restore();
          }
          Cine.add(g, () => { for (let i = 0; i < 3; i++) { const q = clamp(b * 1.4 - i * 0.12); Cine.fx_ring(g, cx, cy, e.R * 1.1 * E.outExpo(q), u * (2.4 - i * 0.6), i % 2 ? '#c9822b' : '#ffffff', (1 - q) * 0.9); }
            for (let i = 0; i < 3; i++) { const q = ((time * 0.00028 + i / 3) % 1); Cine.fx_ring(g, cx, cy, R0 * (0.5 + 2.2 * q), u * 0.6, '#ffe3b0', (1 - q) * 0.6 * seg(b, 0.15, 0.4)); } });
          // the hour the world stopped: a gold crystal inside three astrolabe rings
          const hs0 = S * 0.17 * E.outBack(seg(b, 0.12, 0.42));
          if (hs0 > 1) {
            Cine.add(g, () => Cine.glow(g, cx, cy, hs0 * 3, '#ffb040', 0.35));
            for (let i = 0; i < 3; i++) {
              g.save(); g.translate(cx, cy); g.rotate(time * 0.0004 * (i % 2 ? 1 : -1) + (i * TAU) / 3);
              g.strokeStyle = css([255, 214, 130], 0.85); g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, 0, hs0 * 2.1, hs0 * (0.5 + 0.12 * i), 0, 0, TAU); g.stroke();
              for (let q = 0; q < 24; q++) { const a = (q / 24) * TAU; g.beginPath(); g.moveTo(Math.cos(a) * hs0 * 2.1, Math.sin(a) * hs0 * (0.5 + 0.12 * i)); g.lineTo(Math.cos(a) * hs0 * 2.18, Math.sin(a) * hs0 * (0.54 + 0.12 * i)); g.stroke(); }
              g.fillStyle = '#ffffff'; g.beginPath(); g.arc(hs0 * 2.1, 0, hs0 * 0.06, 0, TAU); g.fill(); g.restore();
            }
            Cine.drawMesh(g, GEM, { x: cx, y: cy, s: hs0, rx: -0.3, ry: time * 0.0004, col: [hx(46, 90, 84), hx(38, 90, 54), hx(30, 80, 12)], trans: 0.85, glow: 0.4, shine: 60, t: time });
            Cine.flare(g, e, cx, cy, 0.45 * seg(b, 0.2, 0.5), '#ffd28a');
            const hw = E.outCubic(seg(b, 0.22, 0.6));
            Cine.mandala(g, cx, cy, hs0 * 2.9 * hw, time * 0.0003, 0.6 * hw, '#c9822b', '#ffe3b0');
            Cine.wireframe(g, 'octa', { x: cx, y: cy, s: hs0 * 2.2 * hw, rx: 0.45 + time * 0.00028, ry: time * 0.0004, col: '#ffd98a', alpha: 0.75 * hw, glow: 0.5, lineW: 1.4 });
          }
          Cine.motes(g, e, { n: 60, seed: 3, col: '#ffe0a0', size: 0.5, vy: -1.2, wobble: 3, a: 0.7, twinkle: 1 });
        }
        g.restore();
        return { bloom: 0.55 + (shat ? 0.45 * (1 - E.outCubic(seg(b, 0, 0.3))) : 0.25 * spin), rays: shat ? 0.55 * (1 - 0.5 * seg(b, 0, 0.6)) : 0.1 + 0.35 * spin, rx: cx, ry: cy, grain: 0.1, vig: 0.62, flash: shat ? 1 * (1 - E.outCubic(seg(b, 0, 0.13))) : 0 };
      });
    },
  });

  /* ================= 3. ETERNITY'S DAWN ================= */
  R({
    id: 'dawn', name: "Eternity's Dawn", odds: 7777777777, zone: 0, duration: 25000, revealAt: 0.64,
    snd: 'rise:choir hit:choirstab tail:choirpad amb:sea root:130 scale:major',
    colors: ['#ffe9a8', '#ff7a3a', '#050208'],
    captions: [
      { a: 0.03, b: 0.18, ko: '마지막 태양이 저물어 간다', en: 'THE LAST SUN IS SETTING', pos: 'top', style: 'fly', from: 'right' },
      { a: 0.2, b: 0.38, ko: '별은 스스로의 무게에 무너진다', en: 'A STAR FALLS INTO ITSELF', pos: 'center', style: 'fly', from: 'top' },
      { a: 0.4, b: 0.58, ko: '빛조차 돌아오지 못하는 곳', en: 'WHERE EVEN LIGHT CANNOT RETURN', style: 'fly', from: 'left' },
      { a: 0.7, b: 0.86, ko: '그러나 끝은 다시 시작이었다', en: 'BUT THE END WAS A BEGINNING', style: 'fly', from: 'bottom' },
      { a: 0.88, b: 1.4, ko: '영원의 새벽이 당신 앞에 밝아온다', en: 'ETERNITY DAWNS BEFORE YOU', style: 'fly', from: 'right' },
    ],
    draw(gm, e) {
      Cine.render(gm, e, g => {
        const { p, u, W, H, cx, cy, time } = e, S = Math.min(W, H);
        const t1 = seg(p, 0, 0.22), t2 = E.inOut(seg(p, 0.2, 0.5)), t3 = seg(p, 0.48, 0.62), dawn = seg(p, 0.62, 1), pre = p < 0.63;
        const sk = pre ? seg(p, 0.3, 0.62) * 1.1 : (1 - seg(p, 0.63, 0.88)) * 1.5, [sx, sy] = shake(u, sk);
        g.save(); g.translate(cx + sx, cy + sy); const z = pre ? 1 + 0.06 * seg(p, 0, 0.6) : 1.08 - 0.08 * E.outCubic(dawn); g.scale(z, z); g.translate(-cx, -cy);
        if (pre) {
          g.fillStyle = '#050208'; g.fillRect(0, 0, W, H);
          Cine.motes(g, e, { n: 160, seed: 5, col: '#ffffff', size: 0.45, twinkle: 1, a: 0.9 });
          const hue = 48 - 44 * t2, rs = S * 0.27 * (1 - 0.8 * t2) * (t3 > 0 ? 1 - 0.5 * t3 : 1), col = hx(hue, 95, 60 - 26 * t2);
          Cine.add(g, () => { Cine.glow(g, cx, cy, rs * 3.6, col, 0.45 * (1 - 0.6 * t3)); Cine.glow(g, cx, cy, rs * 1.9, hx(hue + 12, 100, 65), 0.4 * (1 - t2)); });
          if (t2 < 0.9) {
            g.save(); g.beginPath(); g.arc(cx, cy, rs, 0, TAU); g.clip();
            const disc = g.createRadialGradient(cx - rs * 0.2, cy - rs * 0.2, rs * 0.1, cx, cy, rs); disc.addColorStop(0, hx(hue + 14, 100, 84 - 30 * t2)); disc.addColorStop(0.7, col); disc.addColorStop(1, hx(hue - 10, 90, 22));
            g.fillStyle = disc; g.fillRect(cx - rs, cy - rs, rs * 2, rs * 2);
            Cine.fog(g, e, hx(hue - 6, 100, 50), { s: 1.1, vx: 10, vy: 3, a: 0.75, comp: 'lighter' });
            Cine.fog(g, e, '#ffffff', { s: 0.7, vx: -7, vy: 5, a: 0.18 * (1 - t2), comp: 'lighter', ox: 60 });
            g.restore();
            const r = rng(3);                                             // prominences
            Cine.add(g, () => { for (let i = 0; i < 16; i++) { const an = (i / 16) * TAU + r(), L = rs * (0.35 + 0.35 * Math.abs(Math.sin(time * 0.0016 + i))) * (1 - 0.6 * t2); const x0 = cx + Math.cos(an) * rs, y0 = cy + Math.sin(an) * rs, x1 = cx + Math.cos(an + 0.45) * (rs + L), y1 = cy + Math.sin(an + 0.45) * (rs + L), x2 = cx + Math.cos(an + 0.8) * rs, y2 = cy + Math.sin(an + 0.8) * rs; for (let q = 0; q <= 8; q++) { const tt = q / 8, x = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * x1 + tt * tt * x2, y = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * y1 + tt * tt * y2; Cine.glow(g, x, y, rs * 0.07, col, 0.7 * (1 - t2)); } } });
          }
          const bh = E.outCubic(seg(t2, 0.5, 1));
          if (bh > 0) {
            const rb = S * 0.075 * bh;
            for (let i = 0; i < 60; i++) { const rr = rng(i + 200), an = rr() * TAU, d0 = S * (0.3 + rr() * 0.8), q = ((time * 0.0003 * (0.6 + rr()) + rr()) % 1), d = d0 * (1 - q * q), an2 = an + q * 2.2; Cine.add(g, () => { g.strokeStyle = css(rgb('#ffffff'), 0.35 * (1 - q)); g.lineWidth = 1; g.beginPath(); g.moveTo(cx + Math.cos(an2 - 0.08) * (d + 12), cy + Math.sin(an2 - 0.08) * (d + 12) * 0.7); g.lineTo(cx + Math.cos(an2) * d, cy + Math.sin(an2) * d * 0.7); g.stroke(); }); }
            accretion(g, cx, cy, S * 0.36 * bh, 0.2, time, 0.95 * bh * (1 - 0.3 * t3), '#fff2d0', '#ff6a2a', 12);
            const jl = S * 0.75 * E.outCubic(t3);
            Cine.add(g, () => { const jg = g.createLinearGradient(0, cy - jl, 0, cy + jl); jg.addColorStop(0, 'rgba(255,200,140,0)'); jg.addColorStop(0.5, `rgba(255,255,255,${0.85 * t3})`); jg.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = jg; g.fillRect(cx - S * (0.004 + 0.012 * t3), cy - jl, S * (0.008 + 0.024 * t3), jl * 2); });
            g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, rb, 0, TAU); g.fill();
            Cine.add(g, () => { Cine.fx_ring(g, cx, cy, rb * 1.06, S * 0.008, '#ffffff', 0.95 * bh); Cine.fx_ring(g, cx, cy, rb * 1.5, S * 0.003, '#ffb060', 0.4 * bh); });
          }
          if (t3 > 0) { g.fillStyle = `rgba(0,0,0,${0.55 * t3})`; g.fillRect(0, 0, W, H); Cine.add(g, () => { for (let i = 0; i < 4; i++) Cine.fx_ring(g, cx, cy, S * (0.7 - 0.6 * E.inCubic(clamp(t3 * 1.2 - i * 0.05))), 1.5, '#ffffff', 0.5 * t3); }); }
        } else {
          const k = E.outCubic(dawn), hy = H * 0.6;
          const sky = g.createLinearGradient(0, 0, 0, hy); sky.addColorStop(0, '#0d0930'); sky.addColorStop(0.5, css(rgb('#c04a8a'), 0.9)); sky.addColorStop(1, '#ffc46a');
          g.fillStyle = '#050208'; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha *= k; g.fillStyle = sky; g.fillRect(0, 0, W, hy); g.restore();
          const gy = hy + S * 0.02 - S * 0.4 * E.outCubic(seg(dawn, 0.04, 0.6)), gx = cx;
          Cine.motes(g, e, { n: 90, seed: 5, col: '#ffffff', size: 0.4, twinkle: 1, a: 0.6 * (1 - seg(dawn, 0.2, 0.6)), h: hy });
          Cine.fog(g, e, '#ff9ac0', { s: 2.4, vx: 6, a: 0.2 * k, y0: 0, h: hy, comp: 'lighter' });
          Cine.fog(g, e, '#ffd28a', { s: 1.8, vx: -5, a: 0.14 * k, y0: hy * 0.3, h: hy * 0.7, comp: 'lighter', ox: 50 });
          Cine.add(g, () => { Cine.glow(g, gx, gy, S * 1.1, '#ffc46a', 0.26 * k); Cine.glow(g, gx, gy, S * 0.4, '#ffffff', 0.18 * k); });
          Cine.shafts(g, e, { x: gx, y: gy, ang: Math.PI / 2, n: 9, len: H, spread: S * 1.3, w: S * 0.035, col: '#ffe0a0', a: 0.08 * k, seed: 7 });
          Cine.shafts(g, e, { x: gx, y: gy, ang: Math.PI / 2, n: 5, len: H, spread: S * 0.6, w: S * 0.05, col: '#ffffff', a: 0.05 * k, seed: 9 });
          // ocean of light
          const wg = g.createLinearGradient(0, hy, 0, H); wg.addColorStop(0, '#5a2a52'); wg.addColorStop(1, '#0a0418'); g.fillStyle = wg; g.fillRect(0, hy, W, H - hy);
          for (let i = 0; i < 22; i++) { const q = i / 22, y = hy + q * q * (H - hy), amp = u * (0.3 + q * 1.9); g.strokeStyle = css(rgb(i % 2 ? '#ffd28a' : '#ff8ab0'), (0.16 + 0.4 * (1 - q)) * k); g.lineWidth = 0.8 + q * 2.6; g.beginPath(); for (let x = 0; x <= W; x += 12) { const yy = y + Math.sin(x * 0.02 * (1 + q) + time * 0.0016 + i * 1.7) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
          Cine.add(g, () => { const rf = g.createLinearGradient(0, hy, 0, H); rf.addColorStop(0, 'rgba(255,214,150,.75)'); rf.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = rf; g.fillRect(gx - S * 0.05, hy, S * 0.1, H - hy); });
          Cine.motes(g, e, { n: 60, seed: 8, col: '#fff2c8', size: 0.5, vy: -0.4, wobble: 1.5, a: 0.9 * k, twinkle: 1, y0: hy, h: H - hy });
          Cine.fog(g, e, '#ffd0a0', { s: 2, vx: 8, a: 0.18 * k, y0: hy - S * 0.06, h: S * 0.16, comp: 'lighter' });
          // the sun-crystal
          const gs = S * 0.19 * (0.7 + 0.3 * E.outBack(seg(dawn, 0.1, 0.5)));
          Cine.drawMesh(g, GEM, { x: gx, y: gy, s: gs, rx: -0.28, ry: time * 0.0004, col: [hx(48, 95, 88), hx(30, 95, 60), hx(340, 70, 14)], trans: 0.85, glow: 0.5, shine: 60, t: time });
          Cine.add(g, () => { const q = seg(dawn, 0.25, 0.7); Cine.fx_ring(g, gx, gy, gs * 2.6 * E.outBack(q), S * 0.004, '#ffffff', 0.8 * q); });
          { const dw = E.outCubic(seg(dawn, 0.28, 0.68));
            Cine.mandala(g, gx, gy, gs * 2.8 * dw, time * 0.00032, 0.6 * dw, '#ff7a3a', '#ffe9a8');
            Cine.wireframe(g, 'tetra', { x: gx, y: gy, s: gs * 2.1 * dw, rx: 0.5 + time * 0.0003, ry: time * 0.00045, col: '#ffd28a', alpha: 0.78 * dw, glow: 0.5, lineW: 1.4 }); }
          // a flock crossing the sun
          const fq = seg(dawn, 0.5, 0.95); g.strokeStyle = css([20, 8, 24], 0.85 * fq * (1 - seg(fq, 0.85, 1))); g.lineWidth = Math.max(1.2, S * 0.005); g.lineCap = 'round';
          for (let i = 0; i < 9; i++) { const rr = rng(i * 3 + 1), bx = -S * 0.2 + fq * (W + S * 0.4) - i * S * 0.07 + rr() * S * 0.05, by = hy - S * (0.32 + rr() * 0.22) + Math.sin(time * 0.004 + i) * S * 0.01, wv = Math.sin(time * 0.012 + i * 2) * S * 0.014; g.beginPath(); g.moveTo(bx - S * 0.03, by + wv); g.quadraticCurveTo(bx - S * 0.012, by - S * 0.012, bx, by); g.quadraticCurveTo(bx + S * 0.012, by - S * 0.012, bx + S * 0.03, by + wv); g.stroke(); }
          Cine.flare(g, e, gx, gy, 0.6 * E.outCubic(seg(dawn, 0.2, 0.6)), '#ffd28a');
          e._dawnGy = gy;
        }
        g.restore();
        return {
          bloom: 0.5 + 0.4 * t2 - (pre ? 0 : 0.15) + (pre ? 0 : 0.5 * (1 - E.outCubic(seg(dawn, 0, 0.35)))), rays: pre ? 0.25 * (1 - t2) + 0.45 * t3 : 0.85 * (1 - 0.65 * E.outCubic(seg(dawn, 0.1, 0.6))),
          rx: cx, ry: pre ? cy : (e._dawnGy || cy), grain: 0.1, vig: 0.6, flash: pre ? 0 : 1 * (1 - E.outCubic(seg(dawn, 0, 0.14))),
        };
      });
    },
  });
})();
