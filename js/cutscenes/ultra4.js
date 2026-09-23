/*
  MAP 3 SECRET - 102.jpg. Molten Core's one-per-map secret mineral.
  Found burned into the rock at the bottom of the deepest shaft: a thermal-camera frame that
  shouldn't be readable at these temperatures, and an eye in it that is still very much open (102.jpg).
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const R = G.cutscenes.register;

  const img = new Image(); let ready = false;
  img.onload = () => { ready = true; };
  img.src = '102.jpg';

  R({
    id: 'corescan', name: '102.jpg', odds: 20000000000, zone: 3, duration: 18000, revealAt: 0.7,
    snd: 'rise:rumble hit:whomp tail:machine amb:machine root:60 scale:phrygian',
    colors: ['#39ff6a', '#ff2b2b', '#050502'],
    captions: [
      { a: 0.04, b: 0.2, en: 'THE THERMAL RIG SHOULD HAVE MELTED', pos: 'top', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.22, b: 0.4, en: 'INSTEAD IT KEPT RECORDING', pos: 'center', style: 'fly', from: 'left', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.42, b: 0.6, en: 'إطار واحد، مرارا وتكرارا', size: 24, font: 'ui-monospace,"SF Mono",Consolas,monospace' },
      { a: 0.72, b: 1.4, en: 'SOMETHING DOWN HERE IS STILL WARM ENOUGH TO WATCH', font: 'ui-monospace,"SF Mono",Consolas,monospace' },
    ],
    draw(g, e) {
      const { p, u, cx, cy, time, W, H } = e, [A, B, D] = e.col;
      const wake = E.outCubic(seg(p, 0.05, 0.5)), settle = seg(p, 0.5, 0.7), after = p >= 0.7;
      g.fillStyle = D; g.fillRect(0, 0, W, H);
      if (!ready) return;

      // heat-shimmer: the whole frame wobbles horizontally like air over hot rock, worse before it locks in
      const sc = Math.max(W, H) / img.width * (1.04 - 0.04 * wake), iw = img.width * sc, ih = img.height * sc;
      const ix = cx - iw / 2, iy = e.H * 0.5 - ih / 2;
      const shimmer = (1 - settle) * u * 2.2 + 0.3;
      g.save();
      g.globalAlpha = 0.18 + 0.82 * wake;
      g.imageSmoothingEnabled = true;
      g.translate(Math.sin(time * 0.0022) * shimmer, 0);
      g.drawImage(img, ix, iy, iw, ih);
      g.restore();

      // thermal duotone: green (cool) -> red (hot) mapped over the frame, additive
      g.save(); g.globalCompositeOperation = 'color-dodge'; g.globalAlpha = 0.22 * wake;
      const thg = g.createLinearGradient(0, iy, 0, iy + ih);
      thg.addColorStop(0, A); thg.addColorStop(0.55, '#1a0a06'); thg.addColorStop(1, B);
      g.fillStyle = thg; g.fillRect(ix, iy, iw, ih);
      g.restore();

      // pixel-block glitch: a handful of blocky re-sampled tiles, thermal-camera style
      const gs = Math.floor(time / 130), gr = rng(gs);
      const glAmt = after ? 0.16 : 0.3 * (1 - settle) + 0.12;
      if (gr() < glAmt) {
        for (let i = 0; i < 3; i++) {
          const bw = u * (3 + gr() * 6), bh = u * (2 + gr() * 4);
          const sx = gr() * W, sy = gr() * H, dx = sx + (gr() - 0.5) * u * 10, dy = sy + (gr() - 0.5) * u * 6;
          try { g.drawImage(g.canvas, sx * (g.canvas.width / W), sy * (g.canvas.height / H), bw * (g.canvas.width / W), bh * (g.canvas.height / H), dx, dy, bw, bh); } catch (err) {}
        }
      }

      // scanlines, coarse and dim
      g.globalAlpha = 0.16; g.fillStyle = '#000';
      for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.4);
      g.globalAlpha = 1;

      // slow pulse: the eye "breathes" brighter every few seconds, like something is still alive in the frame
      const pulse = Math.pow(Math.max(0, Math.sin(time * 0.0016)), 8);
      if (pulse > 0.05) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * pulse * (0.4 + 0.6 * wake);
        const fl = g.createRadialGradient(cx, cy, 0, cx, cy, e.R * 0.7);
        fl.addColorStop(0, '#ff3a2a'); fl.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = fl; g.fillRect(0, 0, W, H);
        g.restore();
      }

      // vignette that flares hot as it wakes
      const vpul = 0.5 + 0.5 * Math.sin(time * 0.0045);
      const vg = g.createRadialGradient(cx, H / 2, e.R * 0.3, cx, H / 2, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, after ? `rgba(${70 + 60 * vpul},10,10,0.62)` : `rgba(5,15,5,${0.5 + 0.2 * (1 - wake)})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);

      // reveal: a hard thermal flash then a settled green/red duotone pulse ring
      if (settle > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 * (1 - E.outCubic(seg(settle, 0, 0.6)));
        const fl = g.createRadialGradient(cx, cy, 0, cx, cy, e.R * 0.85);
        fl.addColorStop(0, '#ffffff'); fl.addColorStop(0.35, A); fl.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = fl; g.fillRect(0, 0, W, H);
        g.restore();
      }
      if (after) {
        const rr = E.outBack(seg(settle, 0.2, 0.6)) * u * 30;
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5;
        g.strokeStyle = A; g.lineWidth = u * 0.4; g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = B; g.lineWidth = u * 0.25; g.beginPath(); g.arc(cx, cy, rr * 1.12, 0, Math.PI * 2); g.stroke();
        g.restore();
      }
    },
  });
})();
