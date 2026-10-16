/*
  THE DREAM BIOMES (js/biome.js) - their backgrounds and their three minerals, built on the pictures in
  img/dream/: a liminal room whose windows open onto sky (room), a green field under clouds with a
  black door standing in it (field), a hazy toy town on a hill (town), and the eye-mushroom hallway
  with its red door (nightmare).
    DREAM MAKER          (DREAM, 1조, luck applies)  the room, its windows' clouds drifting - we dive
                          through a window, fall through the sky, land in the field and walk to the
                          door; it opens onto light
    NOSTALGIA           (LUCID DREAM, 1 in 10,000,000, luck-blind)  a summer afternoon on a home
                          video, the town; the tape wears, dusk comes, the memory pixelates away -
                          only the black door in the field stays
    RUNRUNRUNRUNRUNRUN   (NIGHTMARE, 1 in 1,000,000, luck-blind)  the hallway, a heartbeat - then
                          running, the door rushing closer, RUN everywhere, eyes opening on the walls
*/
(() => {
  const { E, seg, clamp } = G, A = G.apex, K = G.n3.kit, { light } = K;
  const { TAU, fr, lerp } = A;
  const DREAMFONT = 'Georgia, "Times New Roman", serif', VHS = 'ui-monospace, Consolas, "Courier New", monospace';
  const IMG = {};
  ['room.jpg', 'field.jpg', 'town.jpg', 'nightmare.webp'].forEach(f => { const i = new Image(); i.src = 'img/dream/' + f; IMG[f.split('.')[0]] = i; });
  const ok = i => i && i.complete !== false && (i.naturalWidth || i.width) > 0;
  // the nightmare picture is a poster with a white margin - keep only the picture inside it
  let nightC = null;
  const nightmare = () => { if (nightC) return nightC; const i = IMG.nightmare; if (!(i.complete && i.naturalWidth)) return null; const w = i.naturalWidth, h = i.naturalHeight, l = w * 0.085, t = h * 0.085; nightC = document.createElement('canvas'); nightC.width = Math.round(w - l * 2); nightC.height = Math.round(h - t * 2); nightC.getContext('2d').drawImage(i, l, t, nightC.width, nightC.height, 0, 0, nightC.width, nightC.height); return nightC; };
  const dims = i => [i.naturalWidth || i.width, i.naturalHeight || i.height];
  // draw a picture to fill the screen, zoomed in on a focus point (0..1 in the picture), never leaving a gap;
  // returns how picture coordinates land on the screen
  function cover(g, img, W, H, zoom = 1, fx = 0.5, fy = 0.5, ox = 0, oy = 0) {
    const [iw, ih] = dims(img), s = Math.max(W / iw, H / ih) * zoom;
    let x = W / 2 - fx * iw * s + ox, y = H / 2 - fy * ih * s + oy;
    x = Math.min(0, Math.max(W - iw * s, x)); y = Math.min(0, Math.max(H - ih * s, y));
    g.drawImage(img, x, y, iw * s, ih * s);
    return { x, y, s, map: (px, py) => [x + px * iw * s, y + py * ih * s] };
  }
  // a soft (blurred) copy of each picture, made once: drawn 'lighter' on top it blooms the highlights
  const softCache = new Map();
  function soft(img) {
    if (softCache.has(img)) return softCache.get(img);
    const [iw, ih] = dims(img), c = document.createElement('canvas'); c.width = Math.max(8, iw / 10); c.height = Math.max(8, ih / 10);
    const x = c.getContext('2d'); x.filter = 'blur(2px)'; x.drawImage(img, 0, 0, c.width, c.height);
    softCache.set(img, c); return c;
  }
  function bloom(g, img, W, H, zoom, fx, fy, a) {
    if (!ok(img)) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.imageSmoothingQuality = 'high';
    const [iw, ih] = dims(img), sc = soft(img), s = Math.max(W / iw, H / ih) * zoom;
    let x = W / 2 - fx * iw * s, y = H / 2 - fy * ih * s; x = Math.min(0, Math.max(W - iw * s, x)); y = Math.min(0, Math.max(H - ih * s, y));
    g.drawImage(sc, x, y, iw * s, ih * s); g.restore();
  }
  // the picture, pixelated by p (a memory losing its detail)
  let pixC = null;
  function pixelate(g, img, W, H, p, zoom, fx, fy) {
    if (p <= 1.05) return cover(g, img, W, H, zoom, fx, fy);
    pixC = pixC || document.createElement('canvas');
    const w = Math.max(4, Math.round(W / p)), h = Math.max(4, Math.round(H / p)); pixC.width = w; pixC.height = h;
    cover(pixC.getContext('2d'), img, w, h, zoom, fx, fy);
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(pixC, 0, 0, W, H); g.restore();
  }
  // film grain, a tile made once
  let grainC = null;
  function grain(g, W, H, a = 0.08) {
    if (!grainC) { grainC = document.createElement('canvas'); grainC.width = grainC.height = 160; const x = grainC.getContext('2d'), d = x.createImageData(160, 160); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 60 + Math.random() * 80; } x.putImageData(d, 0, 0); }
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'overlay';
    const ox = Math.floor(Math.random() * 160), oy = Math.floor(Math.random() * 160);
    for (let y = -oy; y < H; y += 160) for (let x = -ox; x < W; x += 160) g.drawImage(grainC, x, y);
    g.restore();
  }
  // a soft cloud, made once
  let cloudC = null;
  const cloud = () => {
    if (cloudC) return cloudC;
    cloudC = document.createElement('canvas'); cloudC.width = 256; cloudC.height = 128; const x = cloudC.getContext('2d');
    [[70, 80, 46], [120, 64, 56], [176, 80, 44], [100, 92, 40], [150, 94, 38]].forEach(([cx, cy, r]) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 128); });
    return cloudC;
  };
  const pastel = (g, W, H, a) => { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, `rgba(255,190,235,${a})`); gr.addColorStop(1, `rgba(170,215,255,${a})`); g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); };
  const FL = () => (G.flashMul ? G.flashMul() : 1);
  // the room's three windows (in picture coordinates): their clouds keep drifting
  const WINDOWS = [[0.011, 0.257, 0.097, 0.382], [0.411, 0.055, 0.143, 0.243], [0.661, 0.097, 0.245, 0.632]];
  function windowClouds(g, view, t, a = 0.7) {
    for (const [wx, wy, ww, wh] of WINDOWS) {
      const [x0, y0] = view.map(wx, wy), [x1, y1] = view.map(wx + ww, wy + wh), w = x1 - x0, h = y1 - y0;
      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.globalAlpha = a;
      for (let i = 0; i < 4; i++) { const cw = w * (0.7 + (i % 2) * 0.4), cx = x0 - cw + fr(i * 0.31 + t * 0.018) * (w + cw * 2), cy = y0 + h * (0.15 + i * 0.22); g.drawImage(cloud(), cx, cy, cw, cw * 0.5); }
      g.restore();
    }
  }
  // the black door in the field: light leaks round its edges, then it opens and the light pours out
  function door(g, view, T, RV, span) {
    const [x0, y0] = view.map(141 / 300, 152 / 300), [x1, y1] = view.map(159 / 300, 182 / 300), w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const leak = seg(T, RV - span - 2, RV - span * 0.4), open = E.inCubic(seg(T, RV - span * 0.55, RV));
    light(g, cx, cy, w * (2.5 + leak * 3 + open * 30), 0.2 + leak * 0.4 + open * 0.6);
    g.fillStyle = "#060608"; g.fillRect(x0, y0, w, h);                 // the door itself stays black against its own glow
    if (leak > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,248,230,${0.9 * leak})`; g.lineWidth = 1.5 + leak * 2; g.shadowColor = '#fff'; g.shadowBlur = 12 * leak; g.strokeRect(x0, y0, w, h); g.restore(); }
    if (open > 0) { const ow = w * (0.1 + open * 0.9), sw = w * (1 + open * 40), sh = h * (1 + open * 26); g.fillStyle = `rgba(255,250,240,${Math.min(1, open * 1.4)})`; g.fillRect(cx - ow / 2, y0, ow, h); if (open > 0.35) { g.globalAlpha = (open - 0.35) / 0.65; g.fillRect(cx - sw / 2, y1 - sh, sw, sh); g.globalAlpha = 1; } }
  }
  // eyes opening on the walls (NIGHTMARE): each looks at the middle, blinks on its own clock
  const EYES = Array.from({ length: 12 }, (_, i) => { const r = K.rnd(400 + i); return { x: r() < 0.5 ? r() * 0.22 : 0.78 + r() * 0.22, y: 0.08 + r() * 0.84, s: 0.035 + r() * 0.05, ph: r() * 10, t0: r() }; });
  function eyes(g, W, H, T, open, m) {
    for (const e of EYES) {
      const k = clamp((open - e.t0 * 0.6) / 0.3); if (k <= 0) continue;
      const x = e.x * W, y = e.y * H, rx = e.s * m, blink = fr(T * 0.35 + e.ph) > 0.94 ? 0.1 : 1, ry = rx * 0.55 * k * blink;
      g.save(); g.beginPath(); g.ellipse(x, y, rx, Math.max(0.5, ry), 0, 0, TAU); g.fillStyle = '#f4e8e4'; g.fill(); g.clip();
      const dx = (W / 2 - x) / W, dy = (H * 0.47 - y) / H;
      g.beginPath(); g.arc(x + dx * rx * 0.9, y + dy * rx * 0.6, rx * 0.45, 0, TAU); g.fillStyle = '#b0101c'; g.fill();
      g.beginPath(); g.arc(x + dx * rx * 0.9, y + dy * rx * 0.6, rx * 0.2, 0, TAU); g.fillStyle = '#100'; g.fill();
      g.restore();
      g.beginPath(); g.ellipse(x, y, rx, Math.max(0.5, ry), 0, 0, TAU); g.strokeStyle = 'rgba(80,0,0,.8)'; g.lineWidth = 1.5; g.stroke();
    }
  }
  const RUNW = Array.from({ length: 90 }, (_, i) => { const r = K.rnd(900 + i); return [r(), r(), 0.04 + r() * 0.16, r() < 0.3 ? 'RUNRUNRUN' : 'RUN', r()]; });
  function runText(g, W, H, T, n, m) {
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    const slot = Math.floor(T * 14);
    for (let i = 0; i < Math.min(n, RUNW.length); i++) {
      const [x, y, s, w, f] = RUNW[i]; if (fr(Math.sin((slot + i) * 12.9898) * 43758.5) < 0.25) continue;
      g.font = `900 ${m * s}px Impact, "Arial Black", sans-serif`; g.fillStyle = f < 0.5 ? '#ff1424' : '#fff';
      g.globalAlpha = 0.5 + 0.5 * f; g.fillText(w, x * W + (f - 0.5) * 8, y * H);
    }
    g.restore();
  }

  /* ---------------- the DREAMCORE theme (js/data/themes.js): somewhere you've been before ----------------
     A pastel sky over the field with its black door, clouds drifting across, a faint checkerboard
     fading into the grass, bubbles and little four-point stars rising, a soft rainbow halo and a ring of
     stars round the crystal - and now and then a line of text surfacing and sinking again. */
  const WHISPERS = ['you\'ve been here before', 'are you still dreaming?', 'it\'s okay. you can stay', 'this place remembers you', 'wake up?', 'it was always summer here', 'don\'t open the door'];
  const BUBBLES = Array.from({ length: 22 }, (_, i) => { const r = K.rnd(1700 + i); return { x: r(), s: 0.006 + r() * 0.018, sp: 0.02 + r() * 0.03, ph: r() * 10, star: r() < 0.4 }; });
  function sparkle(g, x, y, s, a) { g.globalAlpha = a; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.25, y - s * 0.25); g.lineTo(x + s, y); g.lineTo(x + s * 0.25, y + s * 0.25); g.lineTo(x, y + s); g.lineTo(x - s * 0.25, y + s * 0.25); g.lineTo(x - s, y); g.lineTo(x - s * 0.25, y - s * 0.25); g.closePath(); g.fill(); g.globalAlpha = 1; }
  function dreamcoreTheme(g, W, H, t, c, R) {
    const m = Math.min(W, H), hz = H * 0.66;
    // the sky, its colours wandering slowly
    const sh = Math.sin(t * 0.05) * 20, sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, `hsl(${300 + sh},60%,78%)`); sky.addColorStop(0.55, `hsl(${255 + sh},55%,80%)`); sky.addColorStop(1, `hsl(${200 + sh},70%,84%)`);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // the field and its door, faded into the sky
    if (ok(IMG.field)) { g.save(); g.globalAlpha = 0.6; cover(g, IMG.field, W, H, 1.1, 0.5, 0.58); g.restore(); bloom(g, IMG.field, W, H, 1.1, 0.5, 0.58, 0.25); }
    pastel(g, W, H, 0.5);
    // clouds drifting
    for (let i = 0; i < 6; i++) { const cw = m * (0.5 + (i % 3) * 0.25), x = fr(i * 0.37 + t * 0.006 * (1 + (i % 2))) * (W + cw * 2) - cw, y = H * (0.05 + (i % 4) * 0.09); g.globalAlpha = 0.55; g.drawImage(cloud(), x, y, cw, cw * 0.5); }
    g.globalAlpha = 1;
    // a checkerboard floor fading into the grass
    g.save(); g.globalAlpha = 0.18;
    for (let r = 0; r < 10; r++) {
      const z0 = 1 + r, z1 = 2 + r, y0 = hz + (H - hz) * 1.2 / z1 * 1.6, y1 = hz + (H - hz) * 1.2 / z0 * 1.6; if (y0 > H) continue;
      for (let k = -12; k < 12; k++) { if ((k + r) % 2) continue; const xa = W / 2 + k * W * 0.2 / z1 * 2, xb = W / 2 + (k + 1) * W * 0.2 / z1 * 2, xc = W / 2 + (k + 1) * W * 0.2 / z0 * 2, xd = W / 2 + k * W * 0.2 / z0 * 2; g.beginPath(); g.moveTo(xa, y0); g.lineTo(xb, y0); g.lineTo(xc, y1); g.lineTo(xd, y1); g.closePath(); g.fillStyle = '#ffffff'; g.fill(); }
    }
    g.restore();
    // the halo: soft rainbow rings, and a ring of little stars turning
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(c.x, c.y, R * (1.35 + i * 0.07), 0, TAU); g.strokeStyle = `hsla(${(i * 55 + t * 12) % 360},90%,75%,.22)`; g.lineWidth = R * 0.06; g.stroke(); }
    g.restore();
    light(g, c.x, c.y, R * 2.6, 0.35);
    g.fillStyle = '#fff';
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + t * 0.08, rr = R * 2.05; sparkle(g, c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr, R * (0.05 + (i % 3) * 0.02), 0.5 + 0.4 * Math.sin(t * 2 + i)); }
    // bubbles and stars rising
    for (const b of BUBBLES) {
      const life = fr(b.ph + t * b.sp), x = b.x * W + Math.sin(t * 0.6 + b.ph) * m * 0.02, y = H * (1.05 - life * 1.1), s = b.s * m, a = Math.sin(life * Math.PI);
      if (b.star) { g.fillStyle = '#fff'; sparkle(g, x, y, s, a * 0.8); }
      else { g.beginPath(); g.arc(x, y, s, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.6 * a})`; g.lineWidth = 1.2; g.stroke(); g.fillStyle = `rgba(255,220,250,${0.12 * a})`; g.fill(); g.beginPath(); g.arc(x - s * 0.35, y - s * 0.35, s * 0.22, 0, TAU); g.fillStyle = `rgba(255,255,255,${0.7 * a})`; g.fill(); }
    }
    // a line of text surfacing now and then, never over the crystal
    const cyc = 11, k = fr(t / cyc), idx = Math.floor(t / cyc);
    if (k < 0.55) {
      const a = Math.sin((k / 0.55) * Math.PI), txt = WHISPERS[idx % WHISPERS.length], top = idx % 2 === 0;
      g.save(); g.font = `italic 400 ${Math.max(14, m * 0.034)}px ${DREAMFONT}`; g.textAlign = 'center'; g.fillStyle = `rgba(255,255,255,${0.75 * a})`; g.shadowColor = 'rgba(180,120,220,.8)'; g.shadowBlur = 12;
      g.fillText(txt, W / 2, top ? c.y - R * 2.6 : c.y + R * 2.75); g.restore();
    }
    grain(g, W, H, 0.06);
    const v = g.createRadialGradient(W / 2, H / 2, m * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,30,90,.35)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  /* ---------------- the biome backgrounds ---------------- */
  G.dreams = {
    theme: dreamcoreTheme,
    back(g, W, H, t, id) {
      const img = id === 'lucid' ? IMG.room : id === 'nightmare' ? nightmare() : IMG.field;
      g.fillStyle = id === 'nightmare' ? '#120406' : '#1a1428'; g.fillRect(0, 0, W, H);
      if (!ok(img)) return;
      const z = 1.06 + Math.sin(t * 0.05) * 0.03, fx = 0.5 + Math.sin(t * 0.03) * 0.05;
      g.save(); g.globalAlpha = id === 'nightmare' ? 0.55 + 0.12 * Math.max(0, Math.sin(t * 7.4)) ** 8 : 0.62;
      const v = cover(g, img, W, H, z, fx, 0.5); g.restore();
      if (id === 'lucid') windowClouds(g, v, t, 0.45);
      bloom(g, img, W, H, z, fx, 0.5, id === 'nightmare' ? 0.15 : 0.3);
      if (id !== 'nightmare') pastel(g, W, H, 0.35);
      for (let i = 0; i < 40; i++) { const life = fr(i * 0.618 + t * 0.02), x = fr(i * 0.37) * W + Math.sin(t * 0.4 + i) * 20, y = H * (1 - life); g.fillStyle = id === 'nightmare' ? `rgba(255,60,60,${0.5 * Math.sin(life * Math.PI)})` : `rgba(255,255,255,${0.6 * Math.sin(life * Math.PI)})`; g.fillRect(x, y, 2, 2); }
      g.fillStyle = id === 'nightmare' ? 'rgba(20,0,4,.35)' : 'rgba(20,12,40,.22)'; g.fillRect(0, 0, W, H);
    },
    front(g, W, H, t, id) {
      grain(g, W, H, id === 'nightmare' ? 0.12 : 0.07);
      const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.62);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, id === 'nightmare' ? 'rgba(60,0,6,.55)' : 'rgba(30,10,50,.35)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
      if (id === 'nightmare' && fr(Math.sin(Math.floor(t * 6) * 91.7) * 4375.5) < 0.03) {
        g.save(); g.font = `900 ${Math.min(W, H) * 0.12}px Impact, sans-serif`; g.fillStyle = 'rgba(255,20,36,.55)'; g.textAlign = 'center'; g.fillText(['RUN', 'WAKE UP', 'YOU\'RE NOT REAL'][Math.floor(t) % 3], W / 2, H * (0.3 + 0.4 * fr(t))); g.restore();
      }
    },
  };

  /* ================= DREAM MAKER - DREAM, 1조 ================= */
  A.film({ id: 'dreammaker', name: 'DREAM MAKER', odds: 1e12, tier: 'dream', biome: 'dream', zone: -1, duration: 22000, revealAt: 0.74, colors: ['#ffe4f6', '#ffc4ee', '#1a1428'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H);
    // the room, its windows alive; then a dive into the right-hand window
    if (T < 10.4 && ok(IMG.room)) {
      const dive = E.inCubic(seg(T, 6.6, 10.2)), z = lerp(1.04 + 0.12 * E.inOut(clamp(T / 6.6)), 7, dive), fx = lerp(0.6, 0.785, E.inOut(seg(T, 5, 9))), fy = lerp(0.46, 0.41, dive);
      const view = cover(g, IMG.room, W, H, z, fx, fy);
      windowClouds(g, view, T, 0.65);
      bloom(g, IMG.room, W, H, z, fx, fy, 0.35);
      pastel(g, W, H, 0.4);
      for (let i = 0; i < 50; i++) { const life = fr(i * 0.618 + T * 0.05), x = fr(i * 0.37) * W, y = H * (1 - life * 0.8); g.fillStyle = `rgba(255,250,235,${0.7 * Math.sin(life * Math.PI)})`; g.fillRect(x + Math.sin(T * 0.7 + i) * 14, y, 2, 2); }
    }
    // falling through the sky
    if (T > 9.2 && T < 13.4) {
      const k = seg(T, 9.2, 9.9) * (1 - seg(T, 12.6, 13.4));
      g.save(); g.globalAlpha = k;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2f7fe6'); sky.addColorStop(1, '#a8d4ff'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 18; i++) { const d = 0.4 + (i % 3) * 0.4, cw = m * (0.5 + d * 0.6), x = fr(i * 0.618) * (W + cw) - cw / 2, y = H - fr(i * 0.37 + T * 0.35 * d) * (H + cw) ; g.globalAlpha = k * (0.5 + d * 0.4); g.drawImage(cloud(), x - cw / 2, y, cw, cw * 0.5); }
      g.globalAlpha = k * 0.4; g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 30; i++) { const x = fr(i * 0.71) * W, y = H - fr(i * 0.29 + T * 1.6) * H * 1.3; g.moveTo(x, y); g.lineTo(x, y + m * 0.12); } g.stroke();
      g.restore();
    }
    // the field, and the door
    if (T > 12.4 && ok(IMG.field)) {
      const k = seg(T, 12.4, 13.4), z = lerp(1.0, 2.1, E.inOut(seg(T, 12.4, RV + 0.5))), lt = T - RV;
      g.save(); g.globalAlpha = k;
      const view = cover(g, IMG.field, W, H, T < RV ? z : 1.15, 0.5, 0.56);
      bloom(g, IMG.field, W, H, T < RV ? z : 1.15, 0.5, 0.56, 0.3);
      pastel(g, W, H, 0.3);
      if (T < RV) {
        door(g, view, T, RV, 2.2);
      }
      g.restore();
      if (lt > -0.1) { g.fillStyle = `rgba(20,12,40,${0.5 * E.outCubic(clamp(lt / 1.2))})`; g.fillRect(0, 0, W, H); }
    }
    A.flash(g, W, H, T, RV - 0.05, 1.1, '255,250,240');
    if (T > RV - 0.1) A.gem(g, W, H, T, '#ffc4ee', E.outCubic(seg(T, RV - 0.1, RV + 1)));
    grain(g, W, H, 0.09); A.vignette(g, W, H, 0.5);
    A.say(g, W, H, T, [[1.2, 4.8, 'this room was always here', 0.88, 0.044], [5.2, 8.6, 'you just forgot the way back', 0.88, 0.044], [9.9, 12.5, 'fall', 0.5, 0.07], [13.6, RV - 0.8, 'who made this dream?', 0.88, 0.048]], DREAMFONT);
  });

  /* ================= NOSTALGIA - LUCID DREAM, 1 in 10,000,000 (luck-blind) ================= */
  A.film({ id: 'nostalgia', name: 'NOSTALGIA', odds: 1e7, tier: 'lucid', biome: 'lucid', aura: true, zone: -1, duration: 24000, revealAt: 0.76, colors: ['#fff2c4', '#bfeeff', '#101820'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H);
    if (T < 14.2 && ok(IMG.town)) {
      const fx = lerp(0.36, 0.62, clamp(T / 14)), z = 1.08 + 0.06 * clamp(T / 14), p = 1 + 26 * E.inCubic(seg(T, 9, 14.2));
      pixelate(g, IMG.town, W, H, p, z, fx, 0.5);
      // chroma bleed of a worn tape
      if (p < 3) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.18; cover(g, IMG.town, W, H, z, fx, 0.5, 3, 0); g.restore(); }
      // the afternoon turns to dusk
      const dusk = E.inOut(seg(T, 7.5, 13.5));
      g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,190,110,.45)'; g.fillRect(0, 0, W, H); g.restore();
      if (dusk > 0) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(255,120,60,${0.45 * dusk})`); gr.addColorStop(1, `rgba(40,20,80,${0.55 * dusk})`); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
      // the flicker of a memory going
      if (T > 9 && fr(Math.sin(Math.floor(T * 10) * 77.7) * 999) < 0.12) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, W, H); }
      // VHS: scanlines, a tracking band, the date in the corner
      g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      const ty = fr(T * 0.13) * (H + 60) - 30; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, ty, W, 26);
      g.save(); g.font = `700 ${Math.max(12, m * 0.03)}px ${VHS}`; g.fillStyle = 'rgba(255,255,255,.85)'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
      g.textAlign = 'left'; g.fillText('▶ PLAY', m * 0.05, m * 0.08); g.textAlign = 'right'; g.fillText('AUG 14 2003', W - m * 0.05, H - m * 0.2); g.fillText(`${4 + Math.floor(T / 8)}:${String(12 + Math.floor(T * 3) % 48).padStart(2, '0')} PM`, W - m * 0.05, H - m * 0.15); g.restore();
    }
    if (T > 13.6 && ok(IMG.field)) {
      const k = seg(T, 13.6, 14.4), z = lerp(1.0, 2.6, E.inOut(seg(T, 14, RV))), lt = T - RV;
      g.save(); g.globalAlpha = k;
      const view = cover(g, IMG.field, W, H, T < RV ? z : 1.15, 0.5, 0.56);
      bloom(g, IMG.field, W, H, T < RV ? z : 1.15, 0.5, 0.56, 0.25);
      if (T < RV) {
        door(g, view, T, RV, 2);
      }
      g.restore();
      if (lt > -0.1) { g.fillStyle = `rgba(10,16,24,${0.5 * E.outCubic(clamp(lt / 1.2))})`; g.fillRect(0, 0, W, H); }
    }
    A.flash(g, W, H, T, 13.7, 0.6, '255,255,255');
    A.flash(g, W, H, T, RV - 0.05, 1.1, '255,252,240');
    if (T > RV - 0.1) A.gem(g, W, H, T, '#bfeeff', E.outCubic(seg(T, RV - 0.1, RV + 1)));
    grain(g, W, H, 0.1); A.vignette(g, W, H, 0.5);
    A.say(g, W, H, T, [[1, 4.4, 'do you remember this place?', 0.9, 0.042], [4.8, 8.4, 'you used to play here, every summer', 0.9, 0.04], [9, 12.8, 'it is fading', 0.9, 0.046], [14.4, RV - 0.8, 'but some things stay', 0.9, 0.046]], DREAMFONT);
  });

  /* ================= RUNRUNRUNRUNRUNRUN - NIGHTMARE, 1 in 1,000,000 (luck-blind) ================= */
  A.film({ id: 'runrunrun', name: 'RUNRUNRUNRUNRUNRUN', odds: 1e6, tier: 'nightmare', biome: 'nightmare', aura: true, zone: -1, duration: 16000, revealAt: 0.72, colors: ['#ff2a3a', '#ffffff', '#120406'] }, (g, W, H, T, RV) => {
    const m = Math.min(W, H), run = E.inCubic(seg(T, 3, RV)), beat = Math.exp(-fr(T / (T < 3 ? 0.85 : 0.42)) * 6);
    const NM = nightmare();
    if (ok(NM)) {
      const shake = (T < 3 ? 0.002 : 0.004 + run * 0.03) * m, sx = (Math.random() - 0.5) * shake * 2, sy = (Math.random() - 0.5) * shake * 2;
      const z = T < RV ? 1.02 + 0.02 * beat + run * 3.2 : 1.08;
      // motion trails as it rushes in
      if (run > 0.05 && T < RV) for (let j = 3; j >= 1; j--) { g.save(); g.globalAlpha = 0.12; cover(g, NM, W, H, z * (1 - j * 0.035 * run), 0.5, 0.47, sx, sy); g.restore(); }
      cover(g, NM, W, H, z, 0.5, 0.47, sx, sy);
      g.fillStyle = `rgba(40,0,6,${T < 3 ? 0.35 - 0.2 * beat : 0.15})`; g.fillRect(0, 0, W, H);
      bloom(g, NM, W, H, z, 0.5, 0.47, 0.18 + 0.2 * beat);
    }
    if (T < RV) {
      eyes(g, W, H, T, seg(T, 2.4, 7), m);
      runText(g, W, H, T, Math.floor(seg(T, 4, RV - 0.5) * 90), m);
      // the marquee bands near the end
      if (T > 8) { g.save(); g.font = `900 ${m * 0.09}px Impact, sans-serif`; g.fillStyle = 'rgba(255,20,36,.8)'; for (let b = 0; b < 3; b++) { const y = H * (0.2 + b * 0.3), off = (T * (b % 2 ? -900 : 900)) % (m * 2); g.fillText('RUNRUNRUNRUNRUNRUNRUNRUNRUN', off - m, y); } g.restore(); }
      // red flashes on the beat, glitch slices
      if (T > 6) { g.fillStyle = `rgba(255,0,20,${0.35 * beat * FL()})`; g.fillRect(0, 0, W, H); }
      if (T > 5 && Math.random() < 0.25) { const cv = g.canvas, dpr = cv.width / W; for (let i = 0; i < 3; i++) { const y = Math.random() * H, h = 4 + Math.random() * 30; try { g.drawImage(cv, 0, y * dpr, cv.width, h * dpr, (Math.random() - 0.5) * 60, y, W, h); } catch (e) {} } }
      // a blackout beat before the door bursts
      const bo = seg(T, RV - 0.5, RV - 0.15); if (bo > 0) { g.fillStyle = `rgba(0,0,0,${bo})`; g.fillRect(0, 0, W, H); }
    } else {
      g.fillStyle = 'rgba(30,0,4,.55)'; g.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha = 0.2; runText(g, W, H, T * 0.2, 24, m); g.restore();
    }
    A.flash(g, W, H, T, RV - 0.05, 1, '255,40,50');
    if (T > RV - 0.1) A.gem(g, W, H, T, '#ff2a3a', E.outCubic(seg(T, RV - 0.1, RV + 0.8)));
    grain(g, W, H, 0.14); A.vignette(g, W, H, 0.7);
    A.say(g, W, H, T, [[0.4, 1.5, 'wake up', 0.86, 0.05, '#ff3040'], [1.6, 2.9, 'wake up', 0.86, 0.06, '#ff3040']], 'Impact, "Arial Black", sans-serif');
  });
})();
