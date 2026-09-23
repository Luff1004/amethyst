/*
  ULTRA - the SECRET mineral (one per map). Its film is a picture from the project folder (eyes.webp for map 0).
  Every TRANSCENDENT / SECRET cutscene opens with a short blackout (engine.js).
*/
(() => {
  const { E, seg, rgba, rng, clamp, lerp } = G;
  const fx = G.fx, TAU = Math.PI * 2, R = G.cutscenes.register;


  /* The three 10억대 (TRANSCENDENT) films live in transcend.js. */

  /* ============ SECRET: THE WATCHER (map 0) ============ */
  const img = new Image(); let tint = null;
  img.onload = () => {
    tint = ['#ff2020', '#20d8ff'].map(c => {
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'multiply'; x.fillStyle = c; x.fillRect(0, 0, cv.width, cv.height);
      return cv;
    });
  };
  img.src = 'eyes.webp';

  R({
    id: 'watcher', name: 'The Watcher', odds: 10000000000, zone: 0, snd: 'rise:heart hit:whomp tail:echo amb:space root:73 scale:phrygian', duration: 17000, revealAt: 0.72,
    colors: ['#ff4a5e', '#8a0018', '#000000'],
    captions: [
      { a: 0.04, b: 0.2, ko: '고요 속에서', en: 'IN THE SILENCE', pos: 'top', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.22, b: 0.4, ko: '무언가가 눈을 떴다', en: 'SOMETHING OPENED ITS EYES', pos: 'center', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.42, b: 0.62, ko: '수많은 시선이 당신을 향한다', en: 'A THOUSAND GAZES FIND YOU', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.74, b: 1.4, ko: '눈을 돌릴 수 없다', en: 'THERE IS NO LOOKING AWAY', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
    ],
    draw(g, e) {
      const { p, u, cx, cy, time, W, H } = e, [A, B] = e.col;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const ready = img.complete && img.naturalWidth > 0;
      const wake = E.inOut(seg(p, 0.12, 0.6)), slam = seg(p, 0.6, 0.72), after = p >= 0.72;
      const sh = p < 0.6 ? seg(p, 0.35, 0.6) * 0.8 : (p < 0.72 ? 2 : 0.25 + 0.15 * Math.sin(time * 0.01));
      const beat = 1 + 0.02 * Math.pow(Math.max(0, Math.sin(time * 0.004)), 6);
      g.save();
      g.translate((Math.random() - 0.5) * u * 1.6 * sh, (Math.random() - 0.5) * u * 1.6 * sh);
      const black = p > 0.6 && p < 0.64;                     // one frame of nothing before the slam
      if (ready && !black) {
        const sc = Math.max(W, H) / img.width * (1.02 + 0.22 * seg(p, 0.1, 0.72)) * beat, iw = img.width * sc, ih = img.height * sc;
        const ix = cx - iw / 2, iy = e.H * 0.5 - ih / 2;
        g.imageSmoothingEnabled = true;
        const a = after ? 1 : 0.06 + 0.7 * wake * wake;
        g.globalAlpha = a; g.drawImage(img, ix, iy, iw, ih);
        // chromatic split + bright bloom as it wakes
        if (tint && p > 0.3) {
          const sp = u * (0.3 + 2.2 * seg(p, 0.35, 0.72)) * (0.6 + 0.4 * Math.sin(time * 0.02));
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * a;
          g.drawImage(tint[0], ix - sp, iy, iw, ih); g.drawImage(tint[1], ix + sp, iy, iw, ih);
          if (after || slam > 0) { g.globalAlpha = 0.25 * (after ? 0.5 + 0.5 * Math.sin(time * 0.006) : slam); g.drawImage(img, ix - iw * 0.02, iy - ih * 0.02, iw * 1.04, ih * 1.04); }
          g.globalCompositeOperation = 'source-over';
        }
        // glitch slices
        const gs = Math.floor(time / 110), gr = rng(gs);
        const gl = p < 0.12 ? 0 : (after ? 0.25 : 0.15 + 0.6 * seg(p, 0.3, 0.6));
        if (gr() < gl) {
          for (let i = 0; i < 4; i++) {
            const sy = gr() * H, sh2 = u * (1 + gr() * 6), dx = (gr() - 0.5) * u * 14 * (0.5 + gl);
            g.globalAlpha = 1;
            g.drawImage(g.canvas, 0, sy * (g.canvas.height / H), g.canvas.width, sh2 * (g.canvas.height / H), dx, sy, W, sh2);
          }
        }
        g.globalAlpha = 1;
      }
      g.restore();
      // scanlines + red pulse vignette
      g.fillStyle = 'rgba(0,0,0,.28)';
      for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.5);
      const pul = 0.5 + 0.5 * Math.sin(time * 0.004);
      const vg = g.createRadialGradient(cx, H / 2, e.R * 0.25, cx, H / 2, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${after ? 90 + 60 * pul : 20},0,10,${0.75 + 0.15 * wake})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      if (p > 0.6 && p < 0.72) { const q = seg(p, 0.64, 0.72); fx.flash(g, e, 0.9 * (1 - E.outCubic(q)) * (p > 0.64 ? 1 : 0)); fx.glow(g, cx, H / 2, e.R, A, 0.4 * (1 - q)); }
      // faint heartbeat static before it wakes
      if (p < 0.2) { g.fillStyle = rgba(B, 0.5 * (0.5 + 0.5 * Math.sin(time * 0.007))); g.beginPath(); g.arc(cx, H / 2, u * (0.5 + Math.pow(Math.max(0, Math.sin(time * 0.006)), 6) * 1.5), 0, TAU); g.fill(); }
    },
  });
})();
