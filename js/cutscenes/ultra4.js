/*
  MAP 3 SECRET - 102.jpg (a red eye inside a psychedelic thermal-noise frame).
  A thermal rig at the bottom of the Molten Core, still recording the same single frame - FRAME
  000102 - over and over. Every loop the scan sweeps down a little sharper (4px blocks -> 6 -> 10 ...),
  the crosshair hunts across readings of 1,000°C+ taken from the picture's actual pixel colours...
  and locks on the one cold spot in a sea of lava: 36.9°C. Body temperature. Then the full-resolution
  frame, and the eye in it, which has been open this whole time.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2, N = 500, EYE = [243, 250], BOX = [128, 180, 246, 136];
  const MONO = 'ui-monospace,"SF Mono",Consolas,monospace';
  const RES = [4, 6, 10, 16, 28, 48, 90];

  const img = new Image(); let ready = false, px = null, levels = [];
  img.onload = () => {
    ready = true;
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, N, N); px = x.getImageData(0, 0, N, N).data;
    levels = RES.map(r => { const cv = document.createElement('canvas'); cv.width = cv.height = r; const y = cv.getContext('2d'); y.imageSmoothingEnabled = true; y.drawImage(img, 0, 0, r, r); return cv; });
  };
  img.src = '102.jpg';

  const tempAt = (ix, iy) => {
    if (!px) return 1000;
    const k = ((clamp(iy | 0, 0, N - 1)) * N + clamp(ix | 0, 0, N - 1)) * 4, r = px[k], gg = px[k + 1], b = px[k + 2];
    return Math.round(720 + r * 1.4 + gg * 0.9 - b * 0.4);
  };
  const PAL = ['#05010a', '#2a0a5a', '#8a0a8a', '#e0202a', '#ff8a1a', '#ffe84a', '#ffffff'];

  G.cutscenes.register({
    id: 'corescan', name: '102.jpg', odds: 1000000000000, zone: 3, duration: 18000, revealAt: 0.7,
    snd: 'rise:rumble hit:whomp tail:machine amb:machine root:60 scale:phrygian',
    colors: ['#39ff6a', '#ff2b2b', '#050502'],
    captions: [
      { a: 0.04, b: 0.2, en: 'THE THERMAL RIG SHOULD HAVE MELTED', pos: 'top', style: 'type', font: MONO },
      { a: 0.22, b: 0.4, en: 'INSTEAD IT KEPT RECORDING', pos: 'top', style: 'type', font: MONO },
      { a: 0.42, b: 0.6, en: 'ONE FRAME, OVER AND OVER', pos: 'top', style: 'type', font: MONO },
      { a: 0.72, b: 1.4, en: 'SOMETHING DOWN HERE IS STILL WARM ENOUGH TO WATCH', style: 'type', font: MONO },
    ],
    draw(g, e) {
      const { p, u, cx, time, W, H } = e, TX = G.tx;
      const sy = H * 0.5, dur = e.def.duration;
      g.fillStyle = '#020201'; g.fillRect(0, 0, W, H);
      if (!ready || !levels.length) return;

      // ---- camera: whole frame, then easing onto the eye once it's locked, then in close ----
      const lockK = E.inOut(seg(p, 0.47, 0.55)), rv = seg(p, 0.7, 1);
      const cover = Math.max(W, H) / N * 1.02;
      const S = cover * (1 + 0.25 * lockK + 0.9 * E.inOut(rv)) * (1 + 0.015 * Math.pow(Math.max(0, Math.sin(time * 0.0045)), 8));
      const fx = lerp(N / 2, EYE[0], lockK * 0.7 + rv * 0.3), fy = lerp(N / 2, EYE[1], lockK * 0.7 + rv * 0.3);
      const freak = seg(p, 0.6, 0.7) * (p < 0.7 ? 1 : 0);
      const shake = freak * u * 2.2 + (p > 0.7 ? u * 0.25 : 0);
      const ox = cx - fx * S + (Math.random() - 0.5) * shake, oy = sy - fy * S + (Math.random() - 0.5) * shake;

      // ---- the frame: looped, a sharper scan every pass until the reveal shows it at full resolution ----
      const t0 = dur * 0.05, LP = 1250, lt = Math.max(0, time - t0);
      const loop = Math.floor(lt / LP), f = (lt % LP) / LP;
      const cur = Math.min(loop, RES.length - 1), prev = Math.max(0, cur - 1);
      const scanY = oy + f * N * S * 1.1;
      g.save(); g.imageSmoothingEnabled = false;
      if (p >= 0.7) { g.imageSmoothingEnabled = true; g.drawImage(img, ox, oy, N * S, N * S); }
      else if (time > t0) {
        g.save(); g.beginPath(); g.rect(0, 0, W, scanY); g.clip(); g.drawImage(levels[cur], ox, oy, N * S, N * S); g.restore();
        g.save(); g.beginPath(); g.rect(0, scanY, W, H); g.clip(); g.drawImage(levels[prev], ox, oy, N * S, N * S); g.restore();
        g.fillStyle = 'rgba(200,255,210,0.55)'; g.fillRect(0, scanY - u * 0.3, W, u * 0.6);
        TX.glow(g, cx, scanY, W * 0.25, '#9affb0', 0.2);
      }
      g.restore();
      // heat shimmer + the colour-map freaking out before the reveal (and slowly cycling after)
      if (freak > 0 || p > 0.7) {
        g.save(); g.globalCompositeOperation = 'hue';
        g.globalAlpha = p > 0.7 ? 0.25 : 0.7 * freak;
        g.fillStyle = `hsl(${(time * (p > 0.7 ? 0.03 : 0.4)) % 360},100%,50%)`; g.fillRect(0, 0, W, H);
        g.restore();
      }
      if (p < 0.7 && time < t0) TX.dust(g, e, '#9affb0', 200, 3, 0.02);

      // ---- crosshair: hunting across 1000°C readings, then locking on the one cold spot ----
      const wx = N / 2 + Math.sin(time * 0.0011) * 150 + Math.sin(time * 0.0027) * 40, wy = N / 2 + Math.cos(time * 0.0009) * 140 + Math.sin(time * 0.0031) * 30;
      const hx = lerp(wx, EYE[0], lockK), hy = lerp(wy, EYE[1], lockK);
      const X = ox + hx * S, Y = oy + hy * S, locked = lockK > 0.97;
      const reading = locked ? '36.9' : tempAt(hx, hy).toLocaleString();
      const hud = time > t0 * 0.6;
      if (hud) {
        g.save(); g.lineWidth = Math.max(1, u * 0.3); g.strokeStyle = locked ? '#6af0ff' : '#c8ffd0';
        const cr = u * (locked ? 3 + Math.sin(time * 0.01) * 0.6 : 4.5);
        g.beginPath(); g.arc(X, Y, cr, 0, TAU);
        g.moveTo(X - cr * 2.2, Y); g.lineTo(X - cr * 0.5, Y); g.moveTo(X + cr * 0.5, Y); g.lineTo(X + cr * 2.2, Y);
        g.moveTo(X, Y - cr * 2.2); g.lineTo(X, Y - cr * 0.5); g.moveTo(X, Y + cr * 0.5); g.lineTo(X, Y + cr * 2.2); g.stroke();
        g.font = `bold ${u * (locked ? 3.4 : 2.6)}px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillStyle = locked ? '#6af0ff' : '#e8ffe8';
        g.fillText(`${reading}°C`, X + cr * 2.6, Y - u * 2.2);
        if (locked) { g.font = `${u * 2}px ${MONO}`; g.fillStyle = Math.floor(time / 300) % 2 ? '#ff4a4a' : '#6af0ff'; g.fillText(p > 0.7 ? 'ALIVE' : 'ANOMALY', X + cr * 2.6, Y + u * 1.4); }
        // the target box closing in around the eye
        if (lockK > 0) {
          const b = BOX, k = 1 + (1 - lockK) * 1.5;
          const bx = ox + (EYE[0] - b[2] / 2 * k) * S, by = oy + (EYE[1] - b[3] / 2 * k) * S, bw = b[2] * k * S, bh = b[3] * k * S, l = Math.min(bw, bh) * 0.18;
          g.strokeStyle = `rgba(255,70,70,${lockK})`; g.lineWidth = u * 0.45; g.beginPath();
          for (const [sx2, sy2] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            const x0 = bx + bw * sx2, y0 = by + bh * sy2, dx = sx2 ? -l : l, dy = sy2 ? -l : l;
            g.moveTo(x0 + dx, y0); g.lineTo(x0, y0); g.lineTo(x0, y0 + dy);
          }
          g.stroke();
          if (locked && Math.floor(time / 250) % 2) { g.font = `bold ${u * 2.2}px ${MONO}`; g.fillStyle = '#ff4a4a'; g.textAlign = 'left'; g.fillText('TARGET LOCK', bx, by - u * 2); }
        }
        g.restore();
      }

      // scanlines + dim vignette under the HUD
      g.globalAlpha = 0.16; g.fillStyle = '#000';
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1.2);
      g.globalAlpha = 1;
      const vg = g.createRadialGradient(cx, sy, e.R * 0.35, cx, sy, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, p > 0.7 ? 'rgba(90,0,0,0.6)' : 'rgba(0,12,4,0.6)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);

      // ---- the rig's own HUD ----
      if (hud) {
        const top = H * 0.215, bot = H * 0.8, left = u * 4, right = W - u * 4;
        g.save(); g.font = `${u * 2.2}px ${MONO}`; g.textBaseline = 'top'; g.fillStyle = '#c8ffd0';
        // corner brackets
        g.strokeStyle = 'rgba(200,255,210,0.7)'; g.lineWidth = Math.max(1, u * 0.3);
        const bl = u * 5; g.beginPath();
        [[left, top - u * 3, 1, 1], [right, top - u * 3, -1, 1], [left, bot + u * 6, 1, -1], [right, bot + u * 6, -1, -1]].forEach(([x, y, dx, dy]) => { g.moveTo(x + dx * bl, y); g.lineTo(x, y); g.lineTo(x, y + dy * bl); });
        g.stroke();
        g.textAlign = 'left';
        const amb = Math.round(lerp(640, 1140, seg(p, 0.05, 0.6)));
        g.fillText('THERMAL RIG 04', left + u, top);
        g.fillText('DEPTH  3,112 m', left + u, top + u * 2.8);
        g.fillText(`AMBIENT ${amb.toLocaleString()}°C`, left + u, top + u * 5.6);
        g.textAlign = 'right';
        if (Math.floor(time / 500) % 2) { g.fillStyle = '#ff4040'; g.fillText('● REC', right - u, top); }
        g.fillStyle = '#c8ffd0';
        const ms = time + 11647000, hh = Math.floor(ms / 3600000) % 24, mm = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60, cs = Math.floor(ms / 10) % 100;
        g.fillText(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cs).padStart(2, '0')}`, right - u, top + u * 2.8);
        // the frame counter that never moves
        g.textAlign = 'left'; g.textBaseline = 'bottom';
        const glitchF = freak > 0 && Math.random() < freak ? String(Math.floor(Math.random() * 999999)).padStart(6, '0') : '000102';
        g.fillText(`FRAME ${glitchF}`, left + u, bot + u * 4.5);
        g.fillText(`LOOP  ${String(Math.max(1, loop + 1)).padStart(4, '0')}`, left + u, bot + u * 1.7);
        g.textAlign = 'right';
        if (p > 0.1 && p < 0.62 && Math.floor(time / 400) % 2) { g.fillStyle = '#ff5a3a'; g.fillText('! SENSOR OVERHEAT', right - u, bot + u * 4.5); }
        g.fillStyle = '#c8ffd0'; g.fillText(`RES ${p >= 0.7 ? 500 : RES[Math.min(Math.max(0, loop), RES.length - 1)]}px`, right - u, bot + u * 1.7);
        // palette scale on the right edge, with a marker at the current reading
        const pbx = right - u * 2.2, pby = top + u * 10, pbh = H * 0.34;
        const pg = g.createLinearGradient(0, pby + pbh, 0, pby);
        PAL.forEach((c, i) => pg.addColorStop(i / (PAL.length - 1), c));
        g.fillStyle = pg; g.fillRect(pbx, pby, u * 1.4, pbh);
        g.strokeStyle = 'rgba(200,255,210,0.6)'; g.strokeRect(pbx, pby, u * 1.4, pbh);
        g.font = `${u * 1.7}px ${MONO}`; g.textBaseline = 'middle'; g.fillStyle = '#c8ffd0';
        g.fillText('1500', pbx - u * 0.6, pby); g.fillText('0', pbx - u * 0.6, pby + pbh);
        const tv = locked ? 36.9 : tempAt(hx, hy), my = pby + pbh * (1 - clamp(tv / 1500));
        g.fillStyle = locked ? '#6af0ff' : '#fff';
        g.beginPath(); g.moveTo(pbx - u * 0.3, my); g.lineTo(pbx - u * 1.6, my - u * 0.8); g.lineTo(pbx - u * 1.6, my + u * 0.8); g.fill();
        g.restore();
      }

      // the eye breathes, once it's seen at full resolution
      if (p > 0.7) {
        const pulse = Math.pow(Math.max(0, Math.sin(time * 0.0045)), 8);
        TX.glow(g, ox + EYE[0] * S, oy + EYE[1] * S, 60 * S, '#ff3a2a', 0.5 * pulse);
      }
      TX.tear(g, e, freak > 0 ? 0.6 : (f < 0.05 && p < 0.7 ? 0.8 : 0.04), 14);
      TX.flash(g, e, 0.9 * TX.bump(p, 0.69, 0.76), '#ffffff');
    },
  });
})();
