/*
  MAP 2 SECRET - STATIC.avi (11.jpg: an XP-era Media Player window playing a video of a house,
  sitting in a field under a sky full of eyes, a winged eye, smiley balloons that say "have fun
  pretending everything is okay", and an eye-mushroom).
  An old CRT clicks on to NO SIGNAL; a signal locks, but all you get is that one Media Player
  window, playing; a cursor that isn't yours presses play; the camera falls into the video... then
  pulls back out, and the window was never on a desktop - it was out in that field, watched. The
  picture datamoshes apart, and once it's revealed the error dialogs start piling up.
  All framing uses coordinates measured on the picture (1200x1600).
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2, IW = 1200, IH = 1600;
  const MONO = 'ui-monospace,"SF Mono",Consolas,monospace';

  const img = new Image(); let ready = false;
  img.onload = () => { ready = true; };
  img.src = '11.jpg';

  const WIN = [85, 745, 605, 645], VID = [97, 872, 583, 396], PLAY = [128, 1340], SEEK = [235, 1322, 425];
  let noise = null;
  const makeNoise = () => {
    noise = [];
    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'), d = x.createImageData(128, 128), r = rng(f * 77 + 1);
      for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0); noise.push(c);
    }
  };
  const staticFill = (g, W, H, time, a) => {
    if (!noise) makeNoise();
    g.save(); g.globalAlpha = a; g.imageSmoothingEnabled = false;
    g.drawImage(noise[Math.floor(time / 45) % 6], 0, 0, W, H); g.restore();
  };
  // one copy of the current frame per effect; slicing from it is far cheaper than drawing the canvas onto itself hundreds of times
  const scratch = document.createElement('canvas');
  const snap = g => {
    const c = g.canvas;
    if (scratch.width !== c.width || scratch.height !== c.height) { scratch.width = c.width; scratch.height = c.height; }
    const s = scratch.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, c.width, c.height); s.drawImage(c, 0, 0);
    return scratch;
  };
  const cursor = (g, x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 17); g.lineTo(4, 13); g.lineTo(7, 20); g.lineTo(10, 19); g.lineTo(7, 12); g.lineTo(12, 12); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.2; g.stroke(); g.restore();
  };
  const dialog = (g, x, y, u) => {
    const w = u * 46, h = u * 19, t = u * 3.6;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + u * 0.8, y + u * 0.8, w, h);
    const tb = g.createLinearGradient(0, y, 0, y + t);
    tb.addColorStop(0, '#3a8cff'); tb.addColorStop(0.5, '#0a5be0'); tb.addColorStop(1, '#0846b8');
    g.fillStyle = tb; g.fillRect(x, y, w, t);
    g.fillStyle = '#ece9d8'; g.fillRect(x, y + t, w, h - t);
    g.strokeStyle = '#0831a0'; g.lineWidth = Math.max(1, u * 0.3); g.strokeRect(x, y, w, h);
    g.fillStyle = '#fff'; g.font = `bold ${u * 2}px Tahoma,Verdana,sans-serif`; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText('STATIC.avi', x + u * 1.2, y + t / 2);
    g.fillStyle = '#e0502a'; g.fillRect(x + w - t + u * 0.4, y + u * 0.4, t - u * 0.8, t - u * 0.8);
    g.fillStyle = '#fff'; g.fillText('×', x + w - t + u * 1.1, y + t / 2);
    g.fillStyle = '#d42020'; g.beginPath(); g.arc(x + u * 5, y + t + u * 5, u * 2.6, 0, TAU); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = u * 0.6; g.beginPath();
    g.moveTo(x + u * 3.8, y + t + u * 3.8); g.lineTo(x + u * 6.2, y + t + u * 6.2); g.moveTo(x + u * 6.2, y + t + u * 3.8); g.lineTo(x + u * 3.8, y + t + u * 6.2); g.stroke();
    g.fillStyle = '#000'; g.font = `${u * 1.9}px Tahoma,Verdana,sans-serif`;
    g.fillText('STATIC.avi is not responding.', x + u * 9.5, y + t + u * 4.2);
    g.fillText('Keep pretending?', x + u * 9.5, y + t + u * 7);
    g.fillStyle = '#f4f3ee'; g.fillRect(x + w / 2 - u * 5, y + h - u * 4.4, u * 10, u * 3.2);
    g.strokeStyle = '#003c74'; g.lineWidth = Math.max(1, u * 0.25); g.strokeRect(x + w / 2 - u * 5, y + h - u * 4.4, u * 10, u * 3.2);
    g.fillStyle = '#000'; g.textAlign = 'center'; g.fillText('OK', x + w / 2, y + h - u * 2.8);
  };

  G.cutscenes.register({
    id: 'staticmemory', name: 'STATIC.avi', odds: 1000000000000, tier: 'secret', zone: 2, duration: 17500, revealAt: 0.7,
    snd: 'rise:granular hit:laser tail:chime amb:machine root:180 scale:phrygian',
    colors: ['#8fe8ff', '#ff5ec4', '#050308'],
    captions: [
      { a: 0.04, b: 0.2, en: 'SOMEONE LEFT THIS RUNNING', pos: 'top', style: 'type', font: MONO },
      { a: 0.22, b: 0.4, en: 'DEEP WHERE NO SIGNAL SHOULD REACH', pos: 'top', style: 'type', font: MONO },
      { a: 0.42, b: 0.6, en: 'IT KEEPS PLAYING ANYWAY', pos: 'top', style: 'type', font: MONO },
      { a: 0.72, b: 1.4, en: 'PRETENDING EVERYTHING IS FINE', style: 'type', font: MONO },
    ],
    draw(g, e) {
      const { p, u, cx, time, W, H } = e, [A, B, D] = e.col, TX = G.tx;
      const sy = H * 0.5, dur = e.def.duration;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (!ready) return;

      // ---- 1. the CRT clicks on, to NO SIGNAL ----
      if (p < 0.21) {
        const on = seg(p, 0.03, 0.075);
        if (on > 0) {
          const lh = on < 0.5 ? Math.max(1.5, u * 0.3) : H * E.outCubic((on - 0.5) * 2);
          g.save(); g.beginPath(); g.rect(0, sy - lh / 2, W, lh); g.clip();
          staticFill(g, W, H, time, 0.35);
          g.fillStyle = 'rgba(10,20,60,0.55)'; g.fillRect(0, 0, W, H);
          if (on >= 1) {
            // the DVD-style bouncing box, changing colour at every wall
            const bw = u * 30, bh = u * 9, t = time * 0.08;
            const tri = (v, span) => { const k = ((v % (2 * span)) + 2 * span) % (2 * span); return k < span ? k : 2 * span - k; };
            const bx = tri(t, W - bw), by = tri(t * 0.77 + 40, H - bh);
            const bounces = Math.floor(t / (W - bw)) + Math.floor((t * 0.77 + 40) / (H - bh));
            g.fillStyle = ['#1a3cff', '#ff2a8a', '#18c48a', '#ffb81a'][bounces % 4];
            g.fillRect(bx, by, bw, bh);
            g.fillStyle = '#fff'; g.font = `bold ${u * 3.4}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText('NO SIGNAL', bx + bw / 2, by + bh / 2);
          }
          g.restore();
          if (on < 1) TX.glow(g, cx, sy, W * 0.6, '#cfe8ff', 0.6);
        }
      } else {
        // ---- 2..5. the picture, framed by a camera that goes window -> into the video -> out to the field -> the balloons ----
        const cover = Math.max(W / IW, H / IH);
        const winS = Math.min(W * 0.94 / WIN[2], H * 0.62 / WIN[3]), vidS = Math.max(W * 1.02 / VID[2], H * 0.5 / VID[3]);
        const push = E.inOut(seg(p, 0.35, 0.44)), back = E.inOut(seg(p, 0.45, 0.62)), bal = E.inOut(seg(p, 0.71, 0.82));
        let S = lerp(winS, vidS, push), fx = 388, fy = lerp(1010, VID[1] + VID[3] / 2, push);
        S = lerp(S, cover * 1.02, back); fx = lerp(fx, 600, back); fy = lerp(fy, 800, back);
        S = lerp(S, cover * 2.1, bal); fx = lerp(fx, 990, bal); fy = lerp(fy, 150, bal);
        fx = clamp(fx, Math.min(W / 2 / S, IW / 2), Math.max(IW - W / 2 / S, IW / 2)); fy = clamp(fy, Math.min(H / 2 / S, IH / 2), Math.max(IH - H / 2 / S, IH / 2));
        const lock = seg(p, 0.21, 0.25), roll = (1 - lock) * H * 0.6 * ((time * 0.004) % 1);
        const ox = cx - fx * S, oy = sy - fy * S + roll;
        // the clip opens from just the window out to the whole world
        const open = back;
        const cx0 = lerp(WIN[0], 0, open), cy0 = lerp(WIN[1], 0, open), cw = lerp(WIN[2], IW, open), ch = lerp(WIN[3], IH, open);
        if (open < 1) staticFill(g, W, H, time, 0.12);
        g.save();
        g.beginPath(); g.rect(ox + cx0 * S, oy + cy0 * S, cw * S, ch * S); g.clip();
        g.imageSmoothingEnabled = true;
        g.drawImage(img, ox, oy, IW * S, IH * S);
        // RGB split, worse while the signal is unstable
        const split = u * (0.3 + 2 * (1 - lock) + 1.5 * TX.bump(p, 0.44, 0.52) + 2.5 * seg(p, 0.6, 0.7));
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18;
        g.drawImage(img, ox - split, oy, IW * S, IH * S); g.drawImage(img, ox + split, oy, IW * S, IH * S);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        // once play is pressed, the video in the window actually plays: VHS wobble on just that rectangle
        const playing = p > 0.325;
        if (playing) {
          const vx = ox + VID[0] * S, vy = oy + VID[1] * S, vw = VID[2] * S, vh = VID[3] * S, sx = g.canvas.width / W, syy = g.canvas.height / H;
          const src = snap(g), step = Math.max(3, vh / 90);
          for (let y = Math.max(0, -vy); y < Math.min(vh, H - vy); y += step) {
            const d = Math.sin(y * 0.05 + time * 0.006) * u * 0.6 + (Math.sin(time * 0.0013) > 0.9 ? Math.sin(y * 0.3) * u * 2 : 0);
            g.drawImage(src, vx * sx, (vy + y) * syy, vw * sx, step * syy, vx + d, vy + y, vw, step);
          }
          // tracking band rolling through the video
          const band = ((time * 0.05) % (vh * 1.4)) - vh * 0.2;
          g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(vx, vy + band, vw, u * 1.4);
          // seek bar crawling along
          const k = ((p - 0.325) * dur / 9000) % 1;
          g.fillStyle = '#7ad8ff'; g.fillRect(ox + SEEK[0] * S, oy + (SEEK[1] - 4) * S, SEEK[2] * S * k, 8 * S);
          g.fillStyle = '#fff'; g.fillRect(ox + (SEEK[0] + SEEK[2] * k) * S - 4 * S, oy + (SEEK[1] - 9) * S, 8 * S, 18 * S);
        }
        g.restore();
        if (open < 1) {
          g.strokeStyle = `rgba(160,200,255,${0.4 * (1 - open)})`; g.lineWidth = u * 0.3;
          g.strokeRect(ox + cx0 * S, oy + cy0 * S, cw * S, ch * S);
        }
        // a cursor that isn't yours: drifts in, presses play
        const cur = seg(p, 0.25, 0.32), leave = seg(p, 0.34, 0.4);
        if (cur > 0 && leave < 1) {
          const tx = ox + PLAY[0] * S, ty = oy + PLAY[1] * S;
          const x = lerp(W * 0.9, tx, E.inOut(cur)) + leave * W * 0.5, y = lerp(H * 0.2, ty, E.inOut(cur)) + Math.sin(cur * 7) * u * 2 * (1 - cur) - leave * H * 0.2;
          const click = TX.bump(p, 0.318, 0.335);
          if (click > 0) { g.strokeStyle = `rgba(255,255,255,${click})`; g.lineWidth = u * 0.3; g.beginPath(); g.arc(tx, ty, u * (1 + 4 * (1 - click)), 0, TAU); g.stroke(); }
          cursor(g, x, y, u * 0.16 * (1 - click * 0.15));
        }
        // ---- datamosh: motion vectors smear the frame apart before the reveal ----
        const mosh = seg(p, 0.6, 0.7) * (p < 0.72 ? 1 : 0) + (p > 0.7 ? 0.05 : 0);
        if (mosh > 0) {
          const sx = g.canvas.width / W, syy = g.canvas.height / H, r = rng(Math.floor(time / 70)), src = snap(g);
          const vx = (r() - 0.5) * u * 6 * mosh, vy = (r() - 0.3) * u * 4 * mosh, bs = u * 6;
          for (let i = 0; i < 70 * mosh; i++) {
            const bx = Math.floor(r() * W / bs) * bs, by = Math.floor(r() * H / bs) * bs;
            g.drawImage(src, bx * sx, by * syy, bs * sx, bs * syy, bx + vx * (1 + r() * 3), by + vy * (1 + r() * 3), bs, bs);
          }
          for (let i = 0; i < 24 * mosh; i++) {
            const x = r() * W, y = r() * H * 0.8;
            g.drawImage(src, x * sx, y * syy, 2 * sx, 1 * syy, x, y, u * 0.6, H * 0.3 * r() * mosh);
          }
        }
        // ---- the errors start piling up, dragged across the screen like a frozen window trail ----
        const errs = Math.floor(Math.max(0, p - 0.8) * dur / 85);
        for (let k = 0; k < Math.min(errs, 70); k++) {
          const t = k * 0.09;
          dialog(g, W * 0.1 + Math.sin(t) * W * 0.18 + k * u * 0.5, H * 0.2 + Math.sin(t * 1.7 + 1) * H * 0.12 + k * u * 0.45, u);
        }
      }
      // CRT: scanlines, glass curvature darkening, faint noise, and the reveal flash
      g.globalAlpha = 0.2; g.fillStyle = '#000';
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      g.globalAlpha = 1;
      if (p > 0.21) staticFill(g, W, H, time, 0.05);
      const vg = g.createRadialGradient(cx, sy, e.R * 0.45, cx, sy, e.R * 1.05);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.8)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      TX.tear(g, e, p > 0.21 && p < 0.25 ? 0.6 : 0.07, 16);
      TX.flash(g, e, 0.9 * TX.bump(p, 0.69, 0.76), A);
    },
  });
})();
