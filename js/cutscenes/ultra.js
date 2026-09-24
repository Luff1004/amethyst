/*
  MAP 0 SECRET - THE WATCHER (eyes.webp: 27 eyes on black).
  Every eye in the picture is its own actor: each opens behind its own eyelid mask, glances around
  (its image content slides inside the lid, so it reads as an eyeball turning), then they all find
  you at once and blink in unison. After the reveal the camera falls into the big eye's pupil - and
  the same field of eyes is inside it, and inside that one's pupil, forever (a seamless Droste loop
  around the map's fixed point). Eye boxes / the pupil were measured from the picture itself.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2;

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

  // [cx, cy, w, h] of every eye's white, in image pixels (310x310), detected from the picture
  const EYES = [[58, 50, 86, 59], [204, 67, 63, 44], [137, 72, 43, 30], [35, 101, 34, 27], [100, 111, 65, 42], [163, 104, 37, 26], [223, 111, 50, 36], [49, 141, 49, 33], [184, 148, 66, 46], [243, 142, 33, 21], [110, 157, 48, 32], [257, 175, 39, 29], [38, 183, 49, 36], [144, 183, 32, 22], [208, 210, 84, 60], [96, 194, 36, 26], [62, 211, 31, 21], [137, 215, 30, 23], [97, 223, 21, 15], [150, 240, 26, 18], [98, 266, 87, 60], [255, 254, 37, 27], [216, 255, 25, 17], [178, 262, 40, 27], [274, 283, 43, 30], [220, 289, 48, 33], [164, 290, 30, 20]];
  const HERO = 14, PUP = [209.6, 210.4], PR = 22.7, IMG = 310;
  const actors = EYES.map((e, i) => {
    const r = rng(900 + i), d = Math.hypot(e[0] - 208, e[1] - 210);
    return { e, open: i === HERO ? 0.08 : 0.2 + r() * 0.2, find: 0.44 + d / 300 * 0.08, ph: r() * 10, sp: 0.6 + r(), lx: r() - 0.5, ly: r() - 0.5, blinkAt: r() };
  });
  // Droste fixed point: f(q) = PUP + (q - C) * K maps the whole picture into its own pupil
  const K = (PR * 2) / IMG, C = IMG / 2;
  const FIX = [(PUP[0] - C * K) / (1 - K), (PUP[1] - C * K) / (1 - K)];

  const lid = (g, x, y, hw, hh) => {
    g.beginPath(); g.moveTo(x - hw, y);
    g.bezierCurveTo(x - hw * 0.45, y - hh * 1.35, x + hw * 0.45, y - hh * 1.35, x + hw, y);
    g.bezierCurveTo(x + hw * 0.45, y + hh * 1.35, x - hw * 0.45, y + hh * 1.35, x - hw, y); g.closePath();
  };

  G.cutscenes.register({
    id: 'watcher', name: 'The Watcher', odds: 10000000000, zone: 0, snd: 'rise:heart hit:whomp tail:echo amb:space root:73 scale:phrygian', duration: 17000, revealAt: 0.72,
    colors: ['#ff4a5e', '#8a0018', '#000000'],
    captions: [
      { a: 0.04, b: 0.2, ko: '고요 속에서', en: 'IN THE SILENCE', pos: 'top', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.22, b: 0.4, ko: '무언가가 눈을 떴다', en: 'SOMETHING OPENED ITS EYES', pos: 'top', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.42, b: 0.6, ko: '수많은 시선이 당신을 향한다', en: 'A THOUSAND GAZES FIND YOU', pos: 'top', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
      { a: 0.74, b: 1.4, ko: '눈을 돌릴 수 없다', en: 'THERE IS NO LOOKING AWAY', style: 'engrave', font: 'Georgia,"Times New Roman",serif' },
    ],
    draw(g, e) {
      const { p, u, cx, cy, time, W, H } = e, TX = G.tx;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (!(img.complete && img.naturalWidth > 0)) return;
      const sy = H * 0.5, m = Math.min(W, H), cover = Math.max(W, H) / IMG * 1.04;
      const beat = Math.pow(Math.max(0, Math.sin(time * 0.0042)), 10);

      if (p < 0.6) {
        // camera: locked on the first eye, pulling back to the whole field, then creeping toward the big pupil
        const pull = E.inOut(seg(p, 0.22, 0.42)), creep = E.inCubic(seg(p, 0.42, 0.6));
        const S = lerp(m * 0.7 / 84, cover, pull) * (1 + 0.35 * creep) * (1 + 0.012 * beat);
        const fx = lerp(lerp(208, C, pull), PUP[0], creep * 0.6), fy = lerp(lerp(210, C, pull), PUP[1], creep * 0.6);
        const shake = seg(p, 0.44, 0.6) * u * 0.8;
        const ox = cx - fx * S + (Math.random() - 0.5) * shake, oy = sy - fy * S + (Math.random() - 0.5) * shake;
        // unison blinks right before the dark
        const sync = Math.max(TX.bump(p, 0.545, 0.56), TX.bump(p, 0.575, 0.59));
        const red = seg(p, 0.42, 0.6);
        for (const a of actors) {
          const [ex, ey, ew, eh] = a.e;
          let op = E.outBack(seg(p, a.open, a.open + 0.035));
          if (op <= 0) continue;
          const solo = actors.indexOf(a) === HERO;
          const blink = 1 - TX.bump(((time * 0.00011 * a.sp + a.blinkAt) % 1), 0, 0.04);
          op = Math.min(op, p < 0.44 ? blink : 1) * (1 - sync);
          if (op <= 0.02) continue;
          // where it's looking: darting around, then snapping onto you
          const found = E.outBack(seg(p, a.find, a.find + 0.03));
          const dart = Math.floor(time / (700 + a.ph * 90) + a.ph);
          const dr = rng(dart * 31 + actors.indexOf(a));
          const lx = lerp((dr() - 0.5) * 0.22 + Math.sin(time * 0.001 * a.sp) * 0.04, 0, found) * ew;
          const ly = lerp((dr() - 0.5) * 0.16, 0, found) * eh;
          const x = ox + ex * S, y = oy + ey * S, hw = ew / 2 * S * 1.02, hh = eh / 2 * S * op;
          g.save(); lid(g, x, y, hw, hh); g.clip();
          const pad = 1.4, sw = ew * pad, sh = eh * pad * 1.4;
          g.drawImage(img, ex - sw / 2 - lx, ey - sh / 2 - ly, sw, sh, x - sw / 2 * S, y - sh / 2 * S, sw * S, sh * S);
          if (tint && red > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * red; g.drawImage(tint[0], ex - sw / 2 - lx, ey - sh / 2 - ly, sw, sh, x - sw / 2 * S, y - sh / 2 * S, sw * S, sh * S); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
          // lid shadow so each opening reads as flesh, not a cut-out
          const lg = g.createRadialGradient(x, y, Math.min(hw, hh) * 0.4, x, y, hw);
          lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.75)');
          g.fillStyle = lg; g.fillRect(x - hw, y - hh * 1.4, hw * 2, hh * 2.8);
          g.restore();
          g.strokeStyle = `rgba(${solo ? 120 : 60},10,20,${0.5 * op})`; g.lineWidth = Math.max(1, S * 0.8);
          lid(g, x, y, hw, hh); g.stroke();
        }
        // the heartbeat you can hear before anything opens
        if (p < 0.12) {
          g.fillStyle = `rgba(160,0,30,${0.6 * (1 - seg(p, 0.07, 0.12))})`;
          g.beginPath(); g.arc(cx, sy, u * (0.4 + beat * 1.6), 0, TAU); g.fill();
        }
        if (red > 0) G.tx.vignette(g, e, 0.4 * red + 0.4, 0.3);
      } else if (p >= 0.64) {
        // THE PLUNGE: into the big eye's pupil, which holds the whole field again, forever
        const t = (p - 0.64) * e.def.duration / 1000;
        const settle = E.outCubic(clamp(t / 1.6));
        const Z = Math.exp(t * Math.log(1 / K) / 2.6);
        const S = cover * Z * (1 + 0.02 * beat);
        const fx = lerp(C, FIX[0], settle), fy = lerp(C, FIX[1], settle);
        const shake = (t < 0.5 ? (1 - t / 0.5) * 3 : 0.25) * u;
        const jx = (Math.random() - 0.5) * shake, jy = (Math.random() - 0.5) * shake;
        // level k lives inside level k-1's pupil: q0 = FIX + (qk - FIX) * K^k, so its screen transform is
        // scale S*K^k with offset c + (FIX*(1-K^k) - focus)*S
        const lvl = k => {
          const kk = Math.pow(K, k), sk = S * kk;
          const ox = cx + jx + (FIX[0] * (1 - kk) - fx) * S, oy = sy + jy + (FIX[1] * (1 - kk) - fy) * S;
          const px = ox + PUP[0] * sk, py = oy + PUP[1] * sk, pr = PR * sk;
          const far = Math.max(Math.hypot(px, py), Math.hypot(W - px, py), Math.hypot(px, H - py), Math.hypot(W - px, H - py));
          return { sk, ox, oy, px, py, pr, covers: pr > far };
        };
        g.save();
        let first = true;
        for (let k = -2; k <= 9; k++) {
          const L = lvl(k);
          if (IMG * L.sk < 2) break;
          if (L.covers) continue;                        // its own pupil already fills the screen - only inner levels show
          if (!first) {
            const P = lvl(k - 1);
            g.beginPath(); g.arc(P.px, P.py, P.pr, 0, TAU); g.clip();
            g.fillStyle = '#000'; g.fillRect(P.px - P.pr, P.py - P.pr, P.pr * 2, P.pr * 2);
          }
          const iw = IMG * L.sk;
          g.drawImage(img, L.ox, L.oy, iw, iw);
          if (tint && k <= 1) {
            const sp = u * (0.6 + 1.2 * Math.abs(Math.sin(time * 0.013)));
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.28;
            g.drawImage(tint[0], L.ox - sp, L.oy, iw, iw); g.drawImage(tint[1], L.ox + sp, L.oy, iw, iw);
            g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
          }
          // a dark wet rim at every pupil threshold so the seams read as depth
          if (!first) {
            const P = lvl(k - 1);
            const rg = g.createRadialGradient(P.px, P.py, P.pr * 0.7, P.px, P.py, P.pr);
            rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(20,0,4,0.95)');
            g.fillStyle = rg; g.fillRect(P.px - P.pr, P.py - P.pr, P.pr * 2, P.pr * 2);
          }
          first = false;
        }
        g.restore();
        // a blood-red heartbeat washing over it
        g.save(); g.globalCompositeOperation = 'multiply';
        g.fillStyle = `rgb(255,${Math.round(150 - 60 * beat)},${Math.round(150 - 60 * beat)})`; g.fillRect(0, 0, W, H);
        g.restore();
        TX.flash(g, e, 0.95 * (1 - E.outCubic(clamp(t / 1.1))), '#ff3a4a');
        TX.tear(g, e, 0.14, 12);
        const vg = g.createRadialGradient(cx, sy, e.R * 0.25, cx, sy, e.R);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${Math.round(80 + 80 * beat)},0,10,0.8)`);
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
      }
      // scanlines over everything
      g.fillStyle = 'rgba(0,0,0,.22)';
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    },
  });
})();
