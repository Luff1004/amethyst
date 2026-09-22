/*
  MAP 2 SECRET - STATIC.avi. Crystal Cavern's one-per-map secret mineral.
  A different mood again: not dread (Watcher), not warmth (Reverie), but glitchy retro-nostalgia -
  an old CRT/desktop recording that shouldn't still exist, surfacing from deep in the cave (11.jpg).
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const R = G.cutscenes.register;

  const img = new Image(); let ready = false;
  img.onload = () => { ready = true; };
  img.src = '11.jpg';

  R({
    id: 'staticmemory', name: 'STATIC.avi', odds: 15000000000, zone: 2, duration: 17500, revealAt: 0.7,
    snd: 'rise:granular hit:laser tail:chime amb:machine root:180 scale:phrygian',
    colors: ['#8fe8ff', '#ff5ec4', '#050308'],
    captions: [
      { a: 0.04, b: 0.2, en: 'SOMEONE LEFT THIS RUNNING', pos: 'top' },
      { a: 0.22, b: 0.4, en: 'DEEP WHERE NO SIGNAL SHOULD REACH' },
      { a: 0.42, b: 0.6, en: 'IT KEEPS PLAYING ANYWAY', pos: 'center' },
      { a: 0.72, b: 1.4, en: 'PRETENDING EVERYTHING IS FINE' },
    ],
    draw(g, e) {
      const { p, u, cx, cy, time, W, H } = e, [A, B, D] = e.col;
      const wake = E.outCubic(seg(p, 0.05, 0.5)), settle = seg(p, 0.5, 0.7), after = p >= 0.7;
      g.fillStyle = D; g.fillRect(0, 0, W, H);
      if (!ready) return;

      // VHS tracking: the image rolls in vertically, unstable, before it locks
      const roll = (1 - wake) * H * 0.4 * Math.sin(time * 0.004);
      const sc = Math.max(W, H) / img.width * (1.05 - 0.05 * wake);
      const iw = img.width * sc, ih = img.height * sc, ix = cx - iw / 2, iy = e.H * 0.5 - ih / 2 + roll * (1 - wake);

      g.save();
      g.globalAlpha = 0.15 + 0.85 * wake;
      g.imageSmoothingEnabled = false;                              // crunchy, pixel-y - deliberately un-smooth
      g.drawImage(img, ix, iy, iw, ih);

      // RGB channel split, worse before it "locks in"
      const split = u * (0.4 + 2.4 * (1 - settle)) * (0.6 + 0.4 * Math.sin(time * 0.03));
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.22 * wake;
      g.drawImage(img, ix - split, iy, iw, ih);
      g.globalAlpha = 0.18 * wake;
      g.drawImage(img, ix + split, iy, iw, ih);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.restore();

      // horizontal tearing: random bands re-sampled from the canvas itself and shifted sideways
      const gs = Math.floor(time / 90), gr = rng(gs);
      const tearAmt = after ? 0.08 : 0.35 * (1 - settle) + 0.15;
      if (gr() < tearAmt) {
        for (let i = 0; i < 3; i++) {
          const sy = gr() * H, sh = u * (1.5 + gr() * 8), dx = (gr() - 0.5) * u * 22 * (0.4 + tearAmt);
          try { g.drawImage(g.canvas, 0, sy * (g.canvas.height / H), g.canvas.width, sh * (g.canvas.height / H), dx, sy, W, sh); } catch (err) {}
        }
      }

      // scanlines - a real CRT grid, denser and dimmer than the pastel dream-scanlines elsewhere
      g.globalAlpha = 0.22; g.fillStyle = '#000';
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      g.globalAlpha = 1;

      // an old desktop "window" chrome flickering at the edge of the frame - just a rectangle + titlebar,
      // enough to read as "someone's screen", gone as fast as it appears
      if (gr() < 0.12) {
        const wx = W * (0.06 + gr() * 0.5), wy = H * (0.08 + gr() * 0.6), ww = u * (26 + gr() * 20), wh = u * (16 + gr() * 10);
        g.globalAlpha = 0.5 * wake;
        g.fillStyle = '#c8d4e8'; g.fillRect(wx, wy, ww, wh);
        g.fillStyle = '#1a3a8f'; g.fillRect(wx, wy, ww, u * 3);
        g.fillStyle = '#ffffff'; g.fillRect(wx + u, wy + u * 0.6, ww * 0.5, u * 1.6);
        g.globalAlpha = 1;
      }

      // vignette that reddens as it "wakes up"
      const pul = 0.5 + 0.5 * Math.sin(time * 0.005);
      const vg = g.createRadialGradient(cx, H / 2, e.R * 0.3, cx, H / 2, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, after ? `rgba(${40 + 50 * pul},10,40,0.6)` : `rgba(5,5,15,${0.5 + 0.2 * (1 - wake)})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);

      // reveal: a hard digital flash then a settled cyan/magenta duotone pulse
      if (settle > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4 * (1 - E.outCubic(seg(settle, 0, 0.6)));
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
