/*
  THE GODS - THE HEAVEN's own mineral (js/biome.js), 1 in 12,049,712,324. Nowhere else.
  Made from GOD@2.jpg (four winged eyes in a blue sky) and GOD.jpg (a ring of eyes held up by two
  pairs of wings). The sky is keyed out of both pictures, so the winged eyes fly free as sprites.
  Ascending through cloud -> they come in from every side, wings beating -> the sky goes dark as they
  circle -> the ring of eyes comes down out of the light -> it opens over you.
  Captions sit in the middle of the screen in a celestial face.
  G.gods (the cut-out sprites) is shared with THE HEAVEN biome and the G.O.D.S theme.
*/
(() => {
  const { E, seg, clamp, lerp } = G;
  const TAU = Math.PI * 2, fr = v => v - Math.floor(v);
  const HOLY = '"Cinzel Decorative", Cinzel, Georgia, serif';

  /* cut a region out of a picture, keying the blue sky to transparent and feathering the edge */
  function cutout(img, sx, sy, sw, sh) {
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    const x = c.getContext('2d'); x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const d = x.getImageData(0, 0, sw, sh), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2], blue = b - (r + g) / 2;
      const px = (i / 4) % sw, py = Math.floor(i / 4 / sw), ex = Math.min(px, sw - 1 - px) / (sw * 0.12), ey = Math.min(py, sh - 1 - py) / (sh * 0.12);
      const ox = px / sw - 0.5, oy = py / sh - 0.5, ell = clamp((0.5 - Math.hypot(ox, oy * 1.05)) / 0.12);   // an oval mask: no square corners
      p[i + 3] = 255 * clamp(1 - (blue - 3) / 10) * clamp(Math.min(ex, ey)) * ell;   // sky AND the bluish clouds go; white wings and the eye stay
    }
    x.putImageData(d, 0, 0);
    return c;
  }
  const S = G.gods = { ready: false, flock: [], ring: null };
  const a = new Image(), b = new Image();
  let loaded = 0;
  const done = () => {
    if (++loaded < 2) return;
    // the four winged eyes of GOD@2.jpg: [x, y, w, h] in the picture, and where the eye sits inside it
    S.flock = [[0, 60, 335, 265, 210, 105], [400, 0, 336, 305, 120, 115], [35, 280, 305, 275, 120, 103], [210, 325, 526, 320, 320, 130]]
      .map(([x, y, w, h, ex, ey]) => ({ c: cutout(a, x, y, w, h), w, h, ex, ey }));
    S.ring = { c: cutout(b, 0, 36, 300, 232), w: 300, h: 232, ex: 150, ey: 86 };
    S.ready = true;
  };
  a.onload = done; b.onload = done;
  a.src = 'GOD@2.jpg'; b.src = 'GOD.jpg';

  /* draw one winged eye: scaled to width w, centred on its eye, wings beating (a squash on y + a tilt) */
  S.draw = (g, s, x, y, w, t, alpha = 1, beat = 1) => {
    const k = w / s.w, flap = Math.sin(t * 7 * beat + x * 0.01);
    g.save(); g.translate(x, y); g.rotate(flap * 0.04); g.scale(k, k * (0.92 + 0.08 * flap)); g.globalAlpha = alpha;
    g.drawImage(s.c, -s.ex, -s.ey); g.restore();
  };

  function sky(g, W, H, dark) {
    const sk = g.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, `rgb(${lerp(70, 8, dark)},${lerp(140, 2, dark)},${lerp(230, 18, dark)})`);
    sk.addColorStop(0.6, `rgb(${lerp(150, 40, dark)},${lerp(200, 4, dark)},${lerp(250, 30, dark)})`);
    sk.addColorStop(1, `rgb(${lerp(225, 90, dark)},${lerp(240, 10, dark)},${lerp(255, 20, dark)})`);
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
  }
  function clouds(g, W, H, t, rise, alpha) {
    for (let i = 0; i < 16; i++) {
      const x = fr(i * 0.618 + t * 0.00001 * (1 + i % 3)) * (W + 300) - 150, y = fr(i * 0.37 + rise) * (H + 300) - 150, r = 70 + (i % 5) * 30;
      const cg = g.createRadialGradient(x, y, 0, x, y, r);
      cg.addColorStop(0, `rgba(255,255,255,${0.75 * alpha})`); cg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = cg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  S.sky = sky; S.clouds = clouds;

  // where each of the four winged eyes settles in phase B, as fractions of the screen
  const POS = [[0.24, 0.3], [0.78, 0.26], [0.2, 0.68], [0.7, 0.66]];

  G.cutscenes.register({
    id: 'thegods', name: 'THE GODS', odds: 12049712324, tier: 'heaven', biome: 'heaven', zone: -1, music: 'audio/gods.mp3', pre: 2000,
    duration: 26000, revealAt: 0.74, colors: ['#ffffff', '#bfe6ff', '#04020a'],
    snd: 'rise:crystalline hit:celesta tail:choirpad amb:whisper root:261 scale:lydian',
    captions: [
      { a: 0.04, b: 0.18, en: 'LOOK UP', style: 'holy', pos: 'center', font: HOLY, size: 40 },
      { a: 0.22, b: 0.35, en: 'THEY HAVE ALWAYS BEEN WATCHING', style: 'holy', pos: 'center', font: HOLY, size: 26 },
      { a: 0.37, b: 0.47, en: 'EVERY EYE A SERAPH', style: 'holy', pos: 'center', font: HOLY, size: 30 },
      { a: 0.5, b: 0.61, en: 'BE NOT AFRAID', style: 'holy', pos: 'center', font: HOLY, size: 40 },
      { a: 0.63, b: 0.72, en: 'BEHOLD', style: 'holy', pos: 'center', font: HOLY, size: 52 },
      { a: 0.77, b: 0.9, en: 'WE ARE MANY. WE ARE ONE.', style: 'holy', pos: 'center', font: HOLY, size: 28 },
      { a: 0.91, b: 1.4, en: 'AND NOW, YOU ARE SEEN', style: 'holy', pos: 'center', font: HOLY, size: 26 },
    ],
    draw(g, e) {
      const { p, W, H, time } = e, t = time / 1000, m = Math.min(W, H);
      const dark = E.inOut(seg(p, 0.46, 0.6)) * (1 - E.inOut(seg(p, 0.72, 0.78)) * 0.75);
      sky(g, W, H, dark);
      // god rays from above, always
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const a0 = Math.PI / 2 + (i / 11 - 0.5) * 1.3 + Math.sin(t * 0.3 + i) * 0.04, L = H * 1.3;
        const rg = g.createLinearGradient(W / 2, -40, W / 2 + Math.cos(a0) * L, Math.sin(a0) * L);
        rg.addColorStop(0, `rgba(255,250,230,${0.09 * (1 - dark * 0.6)})`); rg.addColorStop(0.6, `rgba(255,250,230,${0.03 * (1 - dark * 0.6)})`); rg.addColorStop(1, 'rgba(255,250,230,0)');
        g.fillStyle = rg; g.beginPath(); g.moveTo(W / 2, -40); g.lineTo(W / 2 + Math.cos(a0 - 0.075) * L, Math.sin(a0 - 0.075) * L); g.lineTo(W / 2 + Math.cos(a0 + 0.075) * L, Math.sin(a0 + 0.075) * L); g.closePath(); g.fill();
      }
      g.restore();
      // A: climbing through cloud - the clouds rush down past you, then thin out
      const rise = p < 0.2 ? E.outCubic(seg(p, 0, 0.2)) * 1.6 : 1.6 + t * 0.01;
      clouds(g, W, H, time, rise, 1 - seg(p, 0.15, 0.3) * 0.6 - dark * 0.3);
      if (!S.ready) return;
      // B: the four winged eyes fly in from the four sides, then C: they circle, faster and faster
      const inK = E.outBack(seg(p, 0.2, 0.34)), circle = E.inOut(seg(p, 0.48, 0.66)), spin = t * (0.4 + circle * 1.4);
      const cx = W / 2, cy = H * 0.44, orb = m * 0.38;
      S.flock.forEach((s, i) => {
        if (p < 0.2) return;
        const [fx, fy] = POS[i], from = [[-0.4, 0.2], [1.4, 0.1], [-0.4, 0.9], [1.4, 0.8]][i];
        let x = lerp(from[0] * W, fx * W, inK) + Math.sin(t * 0.7 + i * 2) * 10, y = lerp(from[1] * H, fy * H, inK) + Math.cos(t * 0.9 + i) * 8;
        if (circle > 0) { const a0 = spin + i * TAU / 4; x = lerp(x, cx + Math.cos(a0) * orb, circle); y = lerp(y, cy + Math.sin(a0) * orb * 0.75, circle); }
        const w = m * (i === 3 ? 0.62 : 0.42) * (1 - circle * 0.35);
        S.draw(g, s, x, y, w, t, 1, 1 + circle);
      });
      // the dark: a red glow from the eyes' circle
      if (dark > 0.05) {
        const rg2 = g.createRadialGradient(cx, cy, 0, cx, cy, m * 0.6);
        rg2.addColorStop(0, `rgba(255,60,40,${0.25 * dark})`); rg2.addColorStop(1, 'rgba(255,0,0,0)');
        g.fillStyle = rg2; g.fillRect(0, 0, W, H);
      }
      // C -> reveal: the ring of eyes comes down out of the light and opens over you
      const desc = E.outCubic(seg(p, 0.56, 0.74)), rev = seg(p, 0.74, 1);
      if (desc > 0) {
        const r = S.ring, ry = lerp(-H * 0.3, cy, desc), rw = m * lerp(0.5, 1.15, desc) * (1 + 0.04 * Math.sin(t * 1.5));
        // halo rings behind it
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 4; j++) {
          const rr = rw * (0.42 + j * 0.12) * (1 + fr(t * 0.2 + j * 0.25) * 0.15);
          g.strokeStyle = `rgba(255,248,220,${(0.35 - j * 0.06) * desc})`; g.lineWidth = 2 + (3 - j);
          g.beginPath(); g.arc(cx, ry, rr, 0, TAU); g.stroke();
        }
        g.translate(cx, ry); g.rotate(t * 0.15);
        for (let j = 0; j < 24; j++) {
          const a0 = j / 24 * TAU, L = rw * (j % 2 ? 0.9 : 1.4);
          const lg = g.createLinearGradient(0, 0, Math.cos(a0) * L, Math.sin(a0) * L);
          lg.addColorStop(0.2, `rgba(255,245,210,${0.22 * desc})`); lg.addColorStop(1, 'rgba(255,245,210,0)');
          g.strokeStyle = lg; g.lineWidth = j % 2 ? 2 : 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * L, Math.sin(a0) * L); g.stroke();
        }
        g.restore();
        S.draw(g, r, cx, ry, rw, t * 0.5, desc, 0.6);
      }
      // the opening flash
      const fl = Math.max(0, 1 - Math.abs(p - 0.74) / 0.025);
      if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
      // feathers drifting down after the reveal
      if (rev > 0) {
        for (let i = 0; i < 36; i++) {
          const x = fr(i * 0.618 + Math.sin(t * 0.3 + i) * 0.02) * W, y = fr(i * 0.37 + t * (0.04 + (i % 4) * 0.012)) * (H + 40) - 20, s2 = 6 + (i % 4) * 3;
          g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.3 + i) * 0.9); g.globalAlpha = 0.85 * Math.min(1, rev * 3);
          g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 0, s2 * 0.35, s2, 0, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(200,210,230,.9)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -s2); g.lineTo(0, s2 * 1.2); g.stroke();
          g.restore();
        }
      }
      // out of the 2s blackout, slowly
      const dawn = 1 - E.inOut(seg(p, 0, 0.12));
      if (dawn > 0) { g.fillStyle = `rgba(0,0,0,${dawn})`; g.fillRect(0, 0, W, H); }
      // a soft white veil over everything, thickest at the edges
      const v = g.createRadialGradient(W / 2, H / 2, m * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, `rgba(${dark > 0.5 ? '0,0,0' : '255,255,255'},${(0.25 + dark * 0.3) * (1 - dawn)})`);
      g.fillStyle = v; g.fillRect(0, 0, W, H);
    },
  });
})();
