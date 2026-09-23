/*
  MAP 1 SECRET - THE REVERIE. Deep Vein's one-per-map secret mineral.
  A different mood from map 0's Watcher: not dread but a warm, trippy, half-remembered dream (eyeeye.jpg).
  Slow hue-drifting chromatic bloom, a breathing zoom, drifting glow-motes, pastel scanlines, soft captions.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const R = G.cutscenes.register;

  const img = new Image(); let ready = false, tint = null;
  img.onload = () => {
    ready = true;
    tint = ['#ff6ad5', '#6affe0', '#ffd76a'].map(c => {
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'multiply'; x.fillStyle = c; x.fillRect(0, 0, cv.width, cv.height);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0);
      return cv;
    });
  };
  img.src = 'eyeeye.jpg';

  R({
    id: 'reverie', name: 'The Reverie', odds: 15000000000, zone: 1, duration: 18000, revealAt: 0.7,
    snd: 'rise:crystalline hit:celesta tail:musicbox amb:whisper root:220 scale:lydian',
    colors: ['#ff9ae0', '#6affe0', '#1a0a2e'],
    captions: [
      { a: 0.04, b: 0.2, ko: '눈을 감으면, 다른 곳이 보인다', en: 'CLOSE YOUR EYES, SEE ELSEWHERE', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.22, b: 0.4, ko: '전에 와 본 적 있는 것 같다', en: 'IT FEELS LIKE YOU HAVE BEEN HERE', pos: 'center', style: 'fly', from: 'left' },
      { a: 0.42, b: 0.6, ko: '낯설지만, 다정하다', en: 'STRANGE, BUT KIND', style: 'fly', from: 'right' },
      { a: 0.72, b: 0.92, ko: '두려워하지 마라', en: 'BE NOT AFRAID', style: 'fly', from: 'bottom' },
      { a: 0.94, b: 1.4, ko: '이곳은 언제나 당신을 알고 있었다', en: 'THIS PLACE HAS ALWAYS KNOWN YOU', style: 'fly', from: 'top' },
    ],
    draw(g, e) {
      const { p, u, cx, cy, time, W, H } = e, [A, B, D] = e.col;
      const wake = E.outCubic(seg(p, 0.06, 0.55)), settle = seg(p, 0.55, 0.72), after = p >= 0.72;
      g.fillStyle = D; g.fillRect(0, 0, W, H);
      if (!ready) return;

      // breathing zoom + slow drift, faster/wider once revealed
      const breathe = 1 + 0.02 * Math.sin(time * 0.0012) + (after ? 0.05 * Math.sin(time * 0.0009) : 0);
      const zoom = (1.08 - 0.1 * wake) * breathe;
      const dx = Math.sin(time * 0.00035) * u * 3 * (0.4 + 0.6 * wake), dy = Math.cos(time * 0.0003) * u * 2 * (0.4 + 0.6 * wake);
      const sc = Math.max(W, H) / img.width * zoom, iw = img.width * sc, ih = img.height * sc;
      const ix = cx - iw / 2 + dx, iy = e.H * 0.5 - ih / 2 + dy;

      g.save();
      g.globalAlpha = 0.1 + 0.9 * wake;
      g.imageSmoothingEnabled = true;
      g.drawImage(img, ix, iy, iw, ih);

      // slow chromatic hue-drift: three tinted copies orbiting the colour wheel, additive
      if (tint) {
        g.globalCompositeOperation = 'lighter';
        const rot = time * 0.00025;
        tint.forEach((cv, i) => {
          const an = rot + (i / tint.length) * Math.PI * 2, r0 = u * (0.6 + 1.6 * (after ? settle + 0.3 : wake));
          g.globalAlpha = (0.16 + 0.1 * Math.sin(time * 0.0015 + i)) * (0.3 + 0.7 * wake);
          g.drawImage(cv, ix + Math.cos(an) * r0, iy + Math.sin(an) * r0, iw, ih);
        });
        g.globalCompositeOperation = 'source-over';
      }
      g.globalAlpha = 1;
      g.restore();

      // drifting glow motes (the eyes' own light, wandering free of the picture)
      const mr = rng(6);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 46; i++) {
        const sp = 0.15 + mr() * 0.3, ph = mr() * 1000;
        const x = ((mr() * W + Math.sin(time * 0.0004 * sp + ph) * u * 6) % W + W) % W;
        const y = ((mr() * H + Math.cos(time * 0.00035 * sp + ph) * u * 5 + time * 0.006 * sp) % H + H) % H;
        const tw = 0.4 + 0.6 * Math.sin(time * 0.002 + i);
        const col = i % 3 === 0 ? A : i % 3 === 1 ? B : '#ffe27a';
        const r0 = u * (0.25 + mr() * 0.5) * (0.5 + wake);
        const grd = g.createRadialGradient(x, y, 0, x, y, r0);
        grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = 0.5 * Math.max(0, tw) * (0.3 + 0.7 * wake); g.fillStyle = grd;
        g.beginPath(); g.arc(x, y, r0, 0, Math.PI * 2); g.fill();
      }
      g.restore();

      // soft pastel scanlines + vignette that warms as it wakes
      g.globalAlpha = 0.14; g.fillStyle = B;
      for (let y = 0; y < H; y += 5) g.fillRect(0, y, W, 1.6);
      g.globalAlpha = 1;
      const pul = 0.5 + 0.5 * Math.sin(time * 0.0022);
      const vg = g.createRadialGradient(cx, H / 2, e.R * 0.3, cx, H / 2, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, after ? `rgba(${60 + 40 * pul},20,70,${0.6})` : `rgba(20,8,32,${0.55 + 0.2 * (1 - wake)})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);

      // the reveal: a warm bloom pulse + rainbow ring (echoing the picture's own rainbow)
      if (settle > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.5 * (1 - E.outCubic(seg(settle, 0, 0.7)));
        const fl = g.createRadialGradient(cx, cy, 0, cx, cy, e.R * 0.9);
        fl.addColorStop(0, '#ffffff'); fl.addColorStop(0.3, A); fl.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = fl; g.fillRect(0, 0, W, H);
        g.restore();
      }
      if (after) {
        const rr = E.outBack(seg(settle, 0.15, 0.6)) * u * 34;
        g.save(); g.globalCompositeOperation = 'lighter';
        const hues = ['#ff6a6a', '#ffd76a', '#8aff6a', '#6affe0', '#6a9aff', '#c26aff'];
        hues.forEach((c, i) => {
          g.strokeStyle = c; g.lineWidth = u * 0.5; g.globalAlpha = 0.55;
          g.beginPath(); g.arc(cx, cy, rr - i * u * 1.1, 0, Math.PI * 2); g.stroke();
        });
        g.restore();
      }
    },
  });
})();
