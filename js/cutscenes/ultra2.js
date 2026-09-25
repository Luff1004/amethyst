/*
  MAP 1 SECRET - THE REVERIE (eyeeye.jpg: a pink dream - eye mushrooms, winged eyes, an obelisk,
  a rainbow, a lit doorway, "Be not afriad", and a tiny "Do I know you?").
  First person: your own eyelids flutter open onto a blur that focuses into the dream; the camera
  wanders it like a sleepwalker - to each winged eye, to the lit doorway where something asks if it
  knows you, to the words in the air - while the winged eyes peel off the picture and fly on their own.
  Everything is framed from coordinates measured on the picture (1617x901), and the camera is clamped
  to it, so portrait phones get a guided tour rather than a cropped middle.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2, IW = 1617, IH = 901;

  const img = new Image(); let ready = false, blur = null, wings = [], tint = null;
  const feather = (sx, sy, sw, sh) => {
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    const x = c.getContext('2d'); x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    x.globalCompositeOperation = 'destination-in';
    x.translate(sw / 2, sh / 2); x.scale(1, sh / sw);
    const gr = x.createRadialGradient(0, 0, sw * 0.2, 0, 0, sw * 0.5);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(-sw / 2, -sw / 2, sw, sw);
    return c;
  };
  img.onload = () => {
    ready = true;
    blur = document.createElement('canvas'); blur.width = 81; blur.height = 45;
    const b = blur.getContext('2d'); b.imageSmoothingEnabled = true; b.drawImage(img, 0, 0, 81, 45);
    // the two winged-eye flocks, lifted off the picture as soft-edged sprites
    wings = [
      { c: feather(400, 90, 400, 390), x: 600, y: 285, ph: 0 },
      { c: feather(860, 40, 480, 470), x: 1100, y: 275, ph: 2 },
      { c: feather(845, 330, 260, 190), x: 975, y: 425, ph: 4 },
    ];
    tint = ['#ff6ad5', '#6affe0', '#ffd76a'].map(col => {
      const cv = document.createElement('canvas'); cv.width = 540; cv.height = 300;
      const x = cv.getContext('2d'); x.drawImage(img, 0, 0, 540, 300);
      x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, 540, 300);
      return cv;
    });
  };
  img.src = 'eyeeye.jpg';

  // camera keyframes [p, x, y, zoom-over-cover]: winged eyes -> the lit door & "Do I know you?" -> "Be not afriad" -> pull back
  const KEYS = [[0, 815, 470, 1.18], [0.18, 640, 300, 1.12], [0.34, 1080, 270, 1.14], [0.48, 470, 715, 1.75], [0.6, 815, 590, 1.7], [0.7, 815, 440, 1.0], [1, 815, 430, 1.06]];
  const cam = p => {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const [p0, x0, y0, z0] = KEYS[i], [p1, x1, y1, z1] = KEYS[i + 1], t = E.inOut(clamp((p - p0) / (p1 - p0)));
    return [lerp(x0, x1, t), lerp(y0, y1, t), lerp(z0, z1, t)];
  };

  G.cutscenes.register({
    id: 'reverie', name: 'The Reverie', odds: 1000000000000, zone: 1, duration: 18000, revealAt: 0.7,
    snd: 'rise:crystalline hit:celesta tail:musicbox amb:whisper root:220 scale:lydian',
    colors: ['#ff9ae0', '#6affe0', '#1a0a2e'],
    captions: [
      { a: 0.04, b: 0.2, ko: '눈을 감으면, 다른 곳이 보인다', en: 'CLOSE YOUR EYES, SEE ELSEWHERE', pos: 'top', style: 'fly', from: 'top' },
      { a: 0.22, b: 0.4, ko: '전에 와 본 적 있는 것 같다', en: 'IT FEELS LIKE YOU HAVE BEEN HERE', pos: 'top', style: 'fly', from: 'left' },
      { a: 0.42, b: 0.6, ko: '낯설지만, 다정하다', en: 'STRANGE, BUT KIND', pos: 'top', style: 'fly', from: 'right' },
      { a: 0.72, b: 0.92, ko: '두려워하지 마라', en: 'BE NOT AFRAID', style: 'fly', from: 'bottom' },
      { a: 0.94, b: 1.4, ko: '이곳은 언제나 당신을 알고 있었다', en: 'THIS PLACE HAS ALWAYS KNOWN YOU', style: 'fly', from: 'top' },
    ],
    draw(g, e) {
      const { p, u, cx, time, W, H } = e, [A, B, D] = e.col, TX = G.tx;
      g.fillStyle = D; g.fillRect(0, 0, W, H);
      if (!ready) return;
      const sy = H * 0.5, m = Math.min(W, H), after = p >= 0.7;
      const cover = Math.max(W / IW, H / IH);
      let [fx, fy, z] = cam(p);
      z *= 1 + 0.015 * Math.sin(time * 0.0011);
      const S = cover * z;
      // keep the view inside the picture
      fx = clamp(fx, W / 2 / S, IW - W / 2 / S); fy = clamp(fy, H / 2 / S, IH - H / 2 / S);
      fx += Math.sin(time * 0.00031) * 6; fy += Math.cos(time * 0.00027) * 4;
      const ox = cx - fx * S, oy = sy - fy * S;
      const focus = E.inOut(seg(p, 0.03, 0.2));

      // the dream itself: blurred until your eyes focus, with a slow chromatic halo drifting round it
      g.save();
      g.imageSmoothingEnabled = true;
      g.drawImage(img, ox, oy, IW * S, IH * S);
      if (focus < 1) { g.globalAlpha = 1 - focus; g.drawImage(blur, ox, oy, IW * S, IH * S); g.globalAlpha = 1; }
      if (tint) {
        g.globalCompositeOperation = 'lighter';
        const rot = time * 0.00025;
        tint.forEach((cv, i) => {
          const an = rot + i / 3 * TAU, r0 = u * (0.5 + 1.5 * (1 - focus) + (after ? 0.8 : 0));
          g.globalAlpha = 0.1 + 0.06 * Math.sin(time * 0.0015 + i);
          g.drawImage(cv, ox + Math.cos(an) * r0, oy + Math.sin(an) * r0, IW * S, IH * S);
        });
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      }
      g.restore();

      // the lit doorway breathes - and floods at the reveal
      const door = [358, 740], dx = ox + door[0] * S, dy = oy + door[1] * S;
      const dk = seg(p, 0.36, 0.5) * (0.6 + 0.4 * Math.sin(time * 0.004)) + TX.bump(p, 0.62, 0.8) * 2;
      if (dk > 0) TX.glow(g, dx, dy, S * 90 * (1 + dk), '#fff0ff', 0.5 * dk);
      // "Do I know you?" - the tiny words by the door glow when the camera finds them
      const ask = TX.bump(p, 0.4, 0.6);
      if (ask > 0) TX.glow(g, ox + 610 * S, oy + 688 * S, S * 70, '#bff8ff', 0.8 * ask);
      // "Be not afriad" in the air, lit from behind as the caption says it for real
      const bna = TX.bump(p, 0.54, 0.76);
      if (bna > 0) TX.glow(g, ox + 815 * S, oy + 595 * S, S * 200, '#ffffff', 0.45 * bna);

      // the winged eyes peel off the picture and fly on their own - gently before, freely after
      const free = E.inOut(seg(p, 0.66, 0.9)), lift = seg(p, 0.6, 0.7);
      if (lift > 0) for (const w of wings) {
        const flap = Math.sin(time * 0.004 + w.ph), bob = Math.sin(time * 0.0012 + w.ph) * 8 * lift;
        const orbit = time * 0.00018 + w.ph;
        const tx = lerp(w.x, 815 + Math.cos(orbit) * 520, free), ty = lerp(w.y + bob, 380 + Math.sin(orbit) * 210, free);
        const sc = lerp(1, 1.25 + 0.2 * Math.sin(orbit * 2), free) * (1 + 0.02 * flap);
        const x = ox + tx * S, y = oy + ty * S, ww = w.c.width * S * sc, hh = w.c.height * S * sc;
        g.save(); g.translate(x, y); g.scale(1 - 0.08 * Math.abs(flap), 1);
        g.globalAlpha = lift * lerp(0.7, 0.95, free);
        g.drawImage(w.c, -ww / 2, -hh / 2, ww, hh);
        g.restore();
      }

      // drifting motes of the dream's own light
      const mr = rng(6);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 60; i++) {
        const sp = 0.15 + mr() * 0.3, ph = mr() * 1000;
        const x = ((mr() * W + Math.sin(time * 0.0004 * sp + ph) * u * 6) % W + W) % W;
        const y = ((mr() * H + Math.cos(time * 0.00035 * sp + ph) * u * 5 - time * 0.008 * sp) % H + H) % H;
        const col = i % 3 === 0 ? A : i % 3 === 1 ? B : '#ffe27a', r0 = u * (0.3 + mr() * 0.7);
        const grd = g.createRadialGradient(x, y, 0, x, y, r0);
        grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = 0.55 * Math.max(0, Math.sin(time * 0.002 + i)) * focus; g.fillStyle = grd;
        g.beginPath(); g.arc(x, y, r0, 0, TAU); g.fill();
      }
      g.restore();

      // the reveal: the obelisk fires a column of light into the sky, and rainbow rings ripple out from it
      const rv = E.outCubic(seg(p, 0.68, 0.8));
      if (rv > 0) {
        const bx = ox + 818 * S, top = oy + 10 * S;
        g.save(); g.globalCompositeOperation = 'lighter';
        const bg = g.createLinearGradient(bx - S * 60, 0, bx + S * 60, 0);
        bg.addColorStop(0, 'rgba(255,200,255,0)'); bg.addColorStop(0.5, `rgba(255,240,255,${0.55 * rv})`); bg.addColorStop(1, 'rgba(255,200,255,0)');
        g.fillStyle = bg; g.fillRect(bx - S * 60, 0, S * 120, Math.max(0, top + (oy + 760 * S - top)));
        const hues = ['#ff6a6a', '#ffd76a', '#8aff6a', '#6affe0', '#6a9aff', '#c26aff'];
        for (let k = 0; k < 3; k++) {
          const rr = ((time * 0.06 + k * m * 0.35) % (m * 1.05));
          hues.forEach((c, i) => {
            g.strokeStyle = c; g.lineWidth = u * 0.45; g.globalAlpha = 0.45 * rv * (1 - rr / (m * 1.05));
            g.beginPath(); g.arc(cx, e.cy, rr + i * u * 0.9, 0, TAU); g.stroke();
          });
        }
        g.restore();
      }

      // your own eyelids, fluttering open at the start (and once more, a slow blink, near the end)
      let open = p < 0.05 ? 0.55 * E.outCubic(seg(p, 0, 0.05))
        : p < 0.08 ? 0.55 * (1 - 0.85 * Math.sin(seg(p, 0.05, 0.08) * Math.PI))
        : lerp(0.55, 1, E.outCubic(seg(p, 0.08, 0.17)));
      open *= 1 - TX.bump(p, 0.9, 0.96) * 0.9;
      const lidH = H * 0.5 * (1 - open);
      if (lidH > 1) {
        for (const sd of [-1, 1]) {
          const y0 = sd < 0 ? 0 : H, edge = sy + sd * (H * 0.5 - lidH);
          const lg = g.createLinearGradient(0, y0, 0, edge);
          lg.addColorStop(0, '#0c0206'); lg.addColorStop(0.8, '#2a0612'); lg.addColorStop(1, 'rgba(255,90,120,0.55)');
          g.fillStyle = lg; g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.lineTo(W, edge);
          g.quadraticCurveTo(cx, edge + sd * -lidH * 0.35, 0, edge); g.closePath(); g.fill();
        }
      }

      // pastel scanlines, soft vignette, and the reveal bloom
      g.globalAlpha = 0.1; g.fillStyle = B;
      for (let y = 0; y < H; y += 5) g.fillRect(0, y, W, 1.4);
      g.globalAlpha = 1;
      const vg = g.createRadialGradient(cx, sy, e.R * 0.3, cx, sy, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(40,10,50,${after ? 0.5 : 0.62})`);
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      TX.flash(g, e, 0.7 * TX.bump(p, 0.68, 0.76), A);
    },
  });
})();
