/*
  MAP 5 - EDGE OF THE COSMOS (우주의 끝), the 6th map. 17 minerals, 10만 -> 6000억, every one its own
  hand-built film of a real cosmic event: stardust, a comet, a ringed world, the pillars of creation,
  a pulsar, a binary merger, a spiral galaxy, a supernova, a quasar, an event horizon, a wormhole,
  a cosmic string, a dyson swarm, a galaxy collision, the last star, the big bang - and the cosmos
  seen whole. Pure picture, no captions.
  Shared kit below: a 3D starfield (with warp), cached nebula textures, a particle spiral galaxy,
  and one reveal used by every film so the stone always lands the same way.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2, ZONE = 5;
  const fr = v => v - Math.floor(v);
  const bump = (p, a, b) => G.tx.bump(p, a, b);
  const ob = k => (k <= 0 ? 0 : E.outBack(k));
  const hsla = (h, s, l, a) => `hsla(${h},${s}%,${l}%,${a})`;
  const HX = (h, s = 90, l = 62) => G.hsl(h, s, l);
  const DUR = odds => (odds < 1e8 ? 11000 : odds < 1e10 ? 14000 : odds < 3e11 ? 17000 : 19500);
  const reg = o => G.cutscenes.register(Object.assign({ zone: ZONE, captions: [], revealAt: 0.68, duration: DUR(o.odds) }, o));

  /* ---------------- kit ---------------- */
  // deep-space backdrop: a near-black radial wash in the scene's colour
  function space(g, e, h = 235, l = 7) {
    const gr = g.createRadialGradient(e.cx, e.cy, 0, e.cx, e.cy, e.R);
    gr.addColorStop(0, hsla(h, 45, l, 1)); gr.addColorStop(1, '#010104');
    g.fillStyle = gr; g.fillRect(0, 0, e.W, e.H);
  }
  // a 3D starfield: stars at depth z, flying toward the camera at `speed`; `warp` stretches them into streaks
  const SF = {};
  const starList = (seed, n) => SF[seed + ':' + n] || (SF[seed + ':' + n] = (r => Array.from({ length: n }, () => [r() * 2 - 1, r() * 2 - 1, r(), r()]))(rng(seed)));
  function stars(g, e, seed, n, o = {}) {
    const { W, H, cx, cy, time } = e, speed = o.speed || 0, warp = o.warp || 0, a = o.alpha == null ? 1 : o.alpha, F = Math.max(W, H) * 0.55;
    const ox = o.ox || 0, oy = o.oy || 0, hue = o.hue == null ? 220 : o.hue;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const [x, y, z0, c] of starList(seed, n)) {
      const z = 0.03 + 0.97 * fr(z0 - time * speed * 0.00004);
      const px = cx + ox + (x / z) * F * 0.35, py = cy + oy + (y / z) * F * 0.35;
      if (px < -50 || px > W + 50 || py < -50 || py > H + 50) continue;
      const near = 1 - z, al = a * Math.min(1, near * 1.6 + 0.15) * (o.twinkle ? 0.65 + 0.35 * Math.sin(time * 0.004 + c * 40) : 1);
      const col = c > 0.85 ? `rgba(255,220,190,${al})` : c > 0.7 ? `rgba(190,215,255,${al})` : hsla(hue, 30, 92, al);
      if (warp > 0.02) {
        const z2 = Math.min(1, z + warp * 0.06), qx = cx + ox + (x / z2) * F * 0.35, qy = cy + oy + (y / z2) * F * 0.35;
        g.strokeStyle = col; g.lineWidth = 0.6 + near * 2.2; g.beginPath(); g.moveTo(qx, qy); g.lineTo(px, py); g.stroke();
      } else { const s = 0.5 + near * 2.4; g.fillStyle = col; g.fillRect(px - s / 2, py - s / 2, s, s); }
    }
    g.restore();
  }
  // nebula textures are painted once into an offscreen canvas and then just drawn (cheap per frame)
  const TEX = {};
  function nebulaTex(key, seed, hues, o = {}) {
    if (TEX[key]) return TEX[key];
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), r = rng(seed), spread = o.spread || 0.38, n = o.n || 70;
    const gauss = () => (r() + r() + r() - 1.5) / 1.5;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = S / 2 + gauss() * S * spread * (o.wide || 1), y = S / 2 + gauss() * S * spread, rad = S * (0.04 + r() * 0.2);
      const h = hues[i % hues.length] + (r() - 0.5) * 24, gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, hsla(h, 85, 58, 0.08 + r() * 0.14)); gr.addColorStop(1, hsla(h, 85, 40, 0));
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.globalCompositeOperation = 'destination-out';           // dark dust lanes cut through it
    for (let i = 0; i < (o.lanes || 12); i++) {
      const x = S / 2 + gauss() * S * spread, y = S / 2 + gauss() * S * spread, rad = S * (0.03 + r() * 0.1);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 260; i++) { const x = S / 2 + gauss() * S * 0.45, y = S / 2 + gauss() * S * 0.45, b = r(); g.fillStyle = `rgba(255,255,255,${0.2 + b * 0.7})`; g.fillRect(x, y, b > 0.95 ? 2 : 1, b > 0.95 ? 2 : 1); }
    return (TEX[key] = c);
  }
  function drawTex(g, tex, x, y, size, rot = 0, a = 1, sy = 1) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.rotate(rot); g.scale(1, sy);
    g.drawImage(tex, -size / 2, -size / 2, size, size); g.restore();
  }
  // a particle spiral galaxy: arms of stars, a bulge, tilt (sy) and spin
  const GX = {};
  function galaxyPts(seed, n, arms) {
    const k = seed + ':' + n; if (GX[k]) return GX[k];
    const r = rng(seed);
    return (GX[k] = Array.from({ length: n }, (_, i) => { const d = Math.pow(r(), 0.7), arm = i % arms; return [d, arm / arms * TAU + (r() - 0.5) * 0.5 / (d + 0.15), r(), r()]; }));
  }
  function galaxy(g, x, y, R, o) {
    const pts = galaxyPts(o.seed, o.n || 900, o.arms || 2), twist = o.twist || 4.2, spin = o.spin || 0, sy = o.sy || 0.45, rot = o.rot || 0;
    const h1 = o.h1 == null ? 220 : o.h1, h2 = o.h2 == null ? 40 : o.h2, a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.rotate(rot);
    const bg = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.35); bg.addColorStop(0, hsla(h2, 90, 85, 0.9 * a)); bg.addColorStop(0.4, hsla(h2, 80, 60, 0.35 * a)); bg.addColorStop(1, hsla(h2, 80, 50, 0));
    g.fillStyle = bg; g.save(); g.scale(1, sy); g.beginPath(); g.arc(0, 0, R * 0.35, 0, TAU); g.restore(); g.fillRect(-R * 0.35, -R * 0.35, R * 0.7, R * 0.7);
    const k = Math.max(1, R / 160);                   // dots grow with the galaxy so it never turns to dust on screen
    for (const [d, th, c, b] of pts) {
      const ang = th + Math.log(d + 0.05) * twist + spin / Math.sqrt(d + 0.08), rr = d * R;
      const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr * sy + (o.warpY ? o.warpY(d, ang) : 0);
      const pxx = px + (o.warpX ? o.warpX(d, ang) : 0);
      const hue = lerp(h2, h1, Math.min(1, d * 1.5)), sz = (b > 0.97 ? 2.6 : b > 0.85 ? 1.8 : 1.2) * k;
      if (b < 0.4) {                                  // the soft glowing gas that makes the arms read as arms
        const hs = R * 0.045; g.fillStyle = hsla(hue, 80, 60, 0.05 * a * (1 - d * 0.6)); g.fillRect(pxx - hs / 2, py - hs * sy / 2, hs, hs * sy);
      }
      g.fillStyle = hsla(hue, 70 + c * 20, 72 + b * 20, (0.4 + 0.6 * b) * a * (1 - d * 0.45)); g.fillRect(pxx, py, sz, sz);
    }
    g.restore();
  }
  function shock(g, x, y, k, r, col, w) { if (k <= 0 || k >= 1) return; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.globalAlpha = 1 - k; g.lineWidth = w * (1 - k) + 1; g.beginPath(); g.arc(x, y, r * E.outCubic(k), 0, TAU); g.stroke(); g.restore(); }
  function rays(g, x, y, n, len, col, a, rot = 0, width = 0.04) {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const ang = rot + i / n * TAU, w = width * (0.6 + 0.4 * Math.sin(i * 3.7)), l = len * (0.65 + 0.35 * Math.sin(i * 5.3));
      const gr = g.createLinearGradient(x, y, x + Math.cos(ang) * l, y + Math.sin(ang) * l); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a * (0.5 + 0.5 * Math.sin(i * 2.3 + rot * 3)); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang - w) * l, y + Math.sin(ang - w) * l); g.lineTo(x + Math.cos(ang + w) * l, y + Math.sin(ang + w) * l); g.fill();
    }
    g.restore();
  }
  function glint(g, x, y, r, col, a) {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a); g.fillStyle = col;
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.1, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.1, y); g.fill();
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y + r * 0.1); g.lineTo(x + r, y); g.lineTo(x, y - r * 0.1); g.fill();
    g.restore();
  }
  /* the stone lands the same way in every film: a burst, the gem, a slow orbit of light around it */
  function reveal(g, e, o) {
    const { p, u, W, H, time } = e, m = Math.min(W, H), x = o.x == null ? e.cx : o.x, y = o.y == null ? e.cy : o.y;
    const at = o.at || 0.66, rv = ob(seg(p, at, at + 0.12)), hue = o.hue;
    TX().flash(g, e, bump(p, at - 0.02, at + 0.05) * (o.flash == null ? 0.9 : o.flash), HX(hue, 90, 75));
    shock(g, x, y, seg(p, at, at + 0.1), m * 1.1, HX(hue, 90, 80), u * 3);
    shock(g, x, y, seg(p, at + 0.03, at + 0.18), m * 1.6, HX(hue + 40, 90, 70), u * 1.6);
    if (rv <= 0) return;
    rays(g, x, y, 26, m * 1.5 * rv, hsla(hue, 95, 75, 0.4), rv, time * 0.00012, 0.028);
    TX().glow(g, x, y, m * 0.6 * rv, HX(hue, 90, 60), 0.45);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const R = m * (0.21 + i * 0.055) * rv, a0 = time * 0.0005 * (i % 2 ? -1 : 1) + i * 2.1;
      g.strokeStyle = hsla(hue + i * 25, 90, 75, 0.55 - i * 0.12); g.lineWidth = u * (0.4 - i * 0.08);
      g.beginPath(); g.ellipse(x, y, R, R * 0.32, i * 0.6 - 0.3, a0, a0 + Math.PI * 1.25); g.stroke();
    }
    g.restore();
    TX().gem(g, o.kind || 'brilliant', x, y, m * (o.size || 0.15) * rv, hue, time, { glow: 1.4 });
    glint(g, x - m * 0.04, y - m * 0.08, m * 0.1 * (0.7 + 0.3 * Math.sin(time * 0.005)), '#ffffff', rv);
    TX().dust(g, e, HX(hue, 70, 85), 60, 31, 0.002);
  }
  const TX = () => G.tx;

  /* ================= 1 · 10만 · 별먼지 결정 - dust spiralling in until it lights ================= */
  reg({ id: 'cz_stardust', name: '별먼지 결정', odds: 1e5, colors: ['#9ac8ff', '#4a6aff', '#02040c'],
    snd: 'rise:shimmer hit:celesta tail:sparkle amb:space root:330 scale:lydian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 225); stars(g, e, 101, 260, { speed: 0.3, twinkle: 1 });
      drawTex(g, nebulaTex('dust', 11, [210, 240, 190]), cx, cy, m * 2.2, time * 0.00003, 0.7);
      const pull = E.inCubic(seg(p, 0.1, 0.62)), r0 = rng(12);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 420; i++) {
        const d0 = 0.15 + r0() * 0.9, a0 = r0() * TAU, d = d0 * (1 - pull * 0.97), a = a0 + time * 0.0004 / (d + 0.08) + pull * 4;
        g.fillStyle = hsla(200 + r0() * 50, 80, 75, (0.3 + 0.6 * r0()) * (0.4 + pull * 0.6));
        g.fillRect(cx + Math.cos(a) * d * m * 0.75, cy + Math.sin(a) * d * m * 0.75 * 0.55, 1.6, 1.6);
      }
      g.restore();
      TX().glow(g, cx, cy, m * (0.05 + pull * 0.25), '#a8d0ff', 0.4 + pull * 0.6);
      reveal(g, e, { hue: 212, kind: 'octa', at: 0.64 });
      TX().vignette(g, e, 0.6);
    } });

  /* ================= 2 · 100만 · 혜성의 눈물 - a comet streaks in, its nucleus splits open ================= */
  reg({ id: 'cz_comet', name: '혜성의 눈물', odds: 1e6, colors: ['#bff4ff', '#3ab0ff', '#01060c'],
    snd: 'rise:whoosh hit:glass tail:chime amb:wind root:294 scale:major',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 205); stars(g, e, 202, 240, { speed: 0.6 });
      const k = E.outCubic(seg(p, 0, 0.6)), x = lerp(-W * 0.2, cx, k), y = lerp(-H * 0.15, cy, k);
      const dx = cx + W * 0.2, dy = cy + H * 0.15, ang = Math.atan2(y - (-H * 0.15), x - (-W * 0.2)) + Math.PI;
      g.save(); g.globalCompositeOperation = 'lighter';
      // ion tail: straight, blue, flickering
      for (let i = 0; i < 6; i++) { const L = m * (1.1 + i * 0.1), w = u * (3 - i * 0.4), gr = g.createLinearGradient(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L); gr.addColorStop(0, `rgba(140,220,255,${0.35 - i * 0.04})`); gr.addColorStop(1, 'rgba(80,160,255,0)'); g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang + (i - 2.5) * 0.006 + Math.sin(time * 0.01 + i) * 0.003) * L, y + Math.sin(ang + (i - 2.5) * 0.006) * L); g.stroke(); }
      // dust tail: curved, golden, grainy
      const r0 = rng(5);
      for (let i = 0; i < 300; i++) { const t = r0(), L = t * m * 0.9, bend = t * t * 0.5, a = ang - 0.18 - bend + (r0() - 0.5) * 0.12 * t; g.fillStyle = `rgba(255,${200 + r0() * 40 | 0},150,${0.5 * (1 - t)})`; g.fillRect(x + Math.cos(a) * L, y + Math.sin(a) * L, 1.5, 1.5); }
      g.restore();
      // coma + nucleus, cracking at the end
      TX().glow(g, x, y, m * 0.16, '#bff4ff', 0.9); TX().glow(g, x, y, m * 0.05, '#ffffff', 1);
      const crack = seg(p, 0.5, 0.64);
      if (crack > 0 && crack < 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,255,${crack})`; g.lineWidth = u * 0.3; const cr = rng(9); for (let i = 0; i < 8; i++) { let a = cr() * TAU, px = x, py = y; g.beginPath(); g.moveTo(px, py); for (let s = 0; s < 4; s++) { a += (cr() - 0.5); px += Math.cos(a) * m * 0.025 * crack * 2; py += Math.sin(a) * m * 0.025 * crack * 2; g.lineTo(px, py); } g.stroke(); } g.restore(); }
      reveal(g, e, { hue: 192, kind: 'spire', at: 0.64 });
      TX().vignette(g, e, 0.6);
    } });

  /* ================= 3 · 1000만 · 고리 행성의 반지 - diving through a ringed giant's rings ================= */
  reg({ id: 'cz_ringworld', name: '고리 행성의 반지', odds: 1e7, colors: ['#ffe0a8', '#c08a4a', '#060402'],
    snd: 'rise:bowed hit:harp tail:pad amb:space root:220 scale:dorian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 35, 5); stars(g, e, 303, 220, {});
      const dive = E.inOut(seg(p, 0.05, 0.62)), S = 1 + dive * 0.8, px = cx + m * 0.22 - dive * m * 0.1, py = cy + m * 0.1 + dive * m * 0.12, PR = m * 0.3 * S;
      g.save(); g.translate(px, py); g.rotate(-0.32);
      const ringDraw = back => {
        for (let i = 0; i < 26; i++) {
          const rr = PR * (1.3 + i * 0.045), gap = i === 9 || i === 10 || i === 17;
          if (gap) continue;
          g.strokeStyle = `rgba(${230 - i * 3},${200 - i * 4},${150 - i * 3},${0.18 + 0.12 * Math.sin(i * 1.7)})`; g.lineWidth = PR * 0.04;
          g.beginPath(); g.ellipse(0, 0, rr, rr * 0.18, 0, back ? Math.PI : 0, back ? TAU : Math.PI); g.stroke();
        }
      };
      ringDraw(true);
      const pg = g.createLinearGradient(-PR, -PR, PR, PR);
      pg.addColorStop(0, '#f0d0a0'); pg.addColorStop(0.5, '#b07840'); pg.addColorStop(1, '#2a1406');
      g.fillStyle = pg; g.beginPath(); g.arc(0, 0, PR, 0, TAU); g.fill();
      g.save(); g.clip(); for (let b = 0; b < 12; b++) { g.fillStyle = `rgba(${b % 2 ? 90 : 255},${b % 2 ? 50 : 220},${b % 2 ? 20 : 170},.12)`; g.fillRect(-PR, -PR + b * PR * 0.17 + Math.sin(time * 0.0004 + b) * PR * 0.02, PR * 2, PR * 0.08); } g.restore();
      const sh = g.createRadialGradient(PR * 0.5, PR * 0.4, PR * 0.2, 0, 0, PR * 1.1); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = sh; g.beginPath(); g.arc(0, 0, PR, 0, TAU); g.fill();
      ringDraw(false);
      g.restore();
      // ring particles flying past as we dive through the plane
      g.save(); g.globalCompositeOperation = 'lighter';
      const r0 = rng(31); for (let i = 0; i < 160; i++) { const z = fr(r0() - time * 0.00025 * (0.3 + dive)), sz = (1 - z) * 6 * dive; if (sz < 0.3) continue; g.fillStyle = `rgba(255,230,190,${0.6 * dive})`; g.beginPath(); g.arc(cx + (r0() - 0.5) / z * m * 0.5, cy + (r0() - 0.5) * 0.15 / z * m * 0.5, sz, 0, TAU); g.fill(); }
      g.restore();
      reveal(g, e, { hue: 38, kind: 'cube', at: 0.64 });
      TX().vignette(g, e, 0.55);
    } });

  /* ================= 4 · 1억 · 창조의 기둥 - a star is born at the tip of a dust pillar ================= */
  reg({ id: 'cz_pillars', name: '창조의 기둥', odds: 1e8, colors: ['#ffc8a0', '#c04a8a', '#06020a'],
    snd: 'rise:choir hit:cathedral tail:choirpad amb:choirdrone root:196 scale:lydian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 320, 6);
      const push = 1 + E.inOut(seg(p, 0, 0.62)) * 0.35;
      g.save(); g.translate(cx, cy); g.scale(push, push); g.translate(-cx, -cy);
      drawTex(g, nebulaTex('pillars', 41, [20, 330, 180, 40], { n: 90, wide: 1.4 }), cx, cy, m * 2.4, 0.2, 1);
      stars(g, e, 404, 200, {});
      // three pillars of dark dust with sunlit rims
      [[-0.32, 0.9, 0.12], [0.02, 1.15, 0.16], [0.3, 0.8, 0.1]].forEach(([ox, h, w], i) => {
        const bx = cx + ox * m, top = cy + m * 0.55 - h * m * 0.75, path = new Path2D();
        path.moveTo(bx - w * m, H + 10); path.bezierCurveTo(bx - w * m * 0.8, cy, bx - w * m * 0.3, top + m * 0.05, bx, top);
        path.bezierCurveTo(bx + w * m * 0.4, top + m * 0.06, bx + w * m * 0.7, cy, bx + w * m, H + 10); path.closePath();
        const pg = g.createLinearGradient(bx - w * m, 0, bx + w * m, 0); pg.addColorStop(0, '#1a0810'); pg.addColorStop(0.5, '#2a1018'); pg.addColorStop(1, '#0a0306');
        g.fillStyle = pg; g.fill(path);
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,170,120,${0.45 + 0.1 * Math.sin(time * 0.002 + i)})`; g.lineWidth = u * 0.5; g.stroke(path); g.restore();
        if (i === 1) { // the protostar at the tallest tip: jets, then ignition
          const ign = seg(p, 0.3, 0.6);
          TX().glow(g, bx, top, m * (0.05 + ign * 0.2), '#ffe0c0', 0.3 + ign * 0.7);
          if (ign > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) { const gr = g.createLinearGradient(bx, top, bx, top + sd * m * 0.4 * ign); gr.addColorStop(0, 'rgba(255,240,220,.8)'); gr.addColorStop(1, 'rgba(255,160,200,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - u * 0.6, top); g.lineTo(bx, top + sd * m * 0.4 * ign); g.lineTo(bx + u * 0.6, top); g.fill(); } g.restore(); }
        }
      });
      g.restore();
      reveal(g, e, { hue: 335, kind: 'cluster', at: 0.64, y: cy - m * 0.05 });
      TX().vignette(g, e, 0.6);
    } });

  /* ================= 5 · 10억 · 펄서의 심장 - lighthouse beams sweeping faster and faster ================= */
  reg({ id: 'cz_pulsar', name: '펄서의 심장', odds: 1e9, colors: ['#c8f0ff', '#4aa8ff', '#00040a'],
    snd: 'rise:static hit:zap tail:arp amb:laser root:247 scale:phrygian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 210, 4); stars(g, e, 505, 260, { twinkle: 1 });
      const spinUp = seg(p, 0, 0.62), ang = time * 0.0006 * (1 + spinUp * spinUp * 18), tilt = 0.5;
      // magnetic field loops
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, cy); g.rotate(Math.sin(ang) * 0.3);
      for (let i = 1; i <= 6; i++) { g.strokeStyle = `rgba(120,200,255,${0.12 + 0.04 * Math.sin(time * 0.003 + i)})`; g.lineWidth = 1.5; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * m * 0.05 * i, 0, m * 0.05 * i, m * 0.09 * i, 0, 0, TAU); g.stroke(); } }
      g.restore();
      // the two beams: cones from the poles, swept around, strobing the whole frame as they pass
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, cy);
      for (const sd of [0, Math.PI]) {
        const a = ang + sd, L = e.R * 1.3, w = 0.07, sweep = Math.abs(Math.sin(ang * 1)) ;
        const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L * tilt); gr.addColorStop(0, 'rgba(230,250,255,.95)'); gr.addColorStop(0.3, 'rgba(120,200,255,.35)'); gr.addColorStop(1, 'rgba(60,120,255,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - w) * L, Math.sin(a - w) * L * tilt); g.lineTo(Math.cos(a + w) * L, Math.sin(a + w) * L * tilt); g.fill();
      }
      g.restore();
      const strobe = Math.pow(Math.abs(Math.cos(ang)), 30);
      g.fillStyle = `rgba(200,235,255,${0.12 * strobe * G.flashMul()})`; g.fillRect(0, 0, W, H);
      TX().glow(g, cx, cy, m * 0.15, '#c8f0ff', 0.9); TX().glow(g, cx, cy, m * 0.03, '#ffffff', 1);
      reveal(g, e, { hue: 198, kind: 'star', at: 0.64 });
      TX().vignette(g, e, 0.62);
    } });

  /* ================= 6 · 100억 · 쌍성의 왈츠 - two stars spiral in, stream, ripple, and merge ================= */
  reg({ id: 'cz_binary', name: '쌍성의 왈츠', odds: 1e10, colors: ['#ffd0a0', '#8ab4ff', '#03030a'],
    snd: 'rise:gravity hit:boom tail:echo amb:space root:174 scale:minor',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 250, 5); stars(g, e, 606, 240, {});
      const k = E.inCubic(seg(p, 0, 0.6)), sep = lerp(m * 0.32, m * 0.01, k), w = time * 0.0008 + k * k * 30;
      const ax = cx + Math.cos(w) * sep * 0.4, ay = cy + Math.sin(w) * sep * 0.4 * 0.5, bx = cx - Math.cos(w) * sep * 0.6, by = cy - Math.sin(w) * sep * 0.6 * 0.5;
      // gravitational ripples
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const q = fr(time * 0.0004 * (1 + k * 6) + i / 6); g.strokeStyle = `rgba(160,180,255,${0.25 * (1 - q) * (0.3 + k)})`; g.lineWidth = u * 0.3; g.beginPath(); g.ellipse(cx, cy, e.R * q, e.R * q * 0.5, 0, 0, TAU); g.stroke(); }
      // the stream from the red giant onto its blue companion
      const r0 = rng(66);
      for (let i = 0; i < 160; i++) { const t = fr(r0() + time * 0.0006), sx = lerp(ax, bx, t) + Math.sin(t * Math.PI) * Math.cos(w + 1.6) * sep * 0.25, sy = lerp(ay, by, t) + Math.sin(t * Math.PI) * Math.sin(w + 1.6) * sep * 0.12; g.fillStyle = `rgba(255,${lerp(160, 220, t) | 0},${lerp(120, 255, t) | 0},${0.6 * (1 - k * 0.5)})`; g.fillRect(sx, sy, 1.8, 1.8); }
      g.restore();
      if (p < 0.6) { TX().glow(g, ax, ay, m * 0.3, '#ff9a5a', 0.85); g.fillStyle = '#ffd8b0'; g.beginPath(); g.arc(ax, ay, m * 0.075, 0, TAU); g.fill(); TX().glow(g, bx, by, m * 0.2, '#9ac8ff', 0.95); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(bx, by, m * 0.028, 0, TAU); g.fill(); }
      reveal(g, e, { hue: 265, kind: 'twin', at: 0.6, flash: 1 });
      TX().vignette(g, e, 0.62);
    } });

  /* ================= 7 · 1000억 · 나선은하의 왕관 - a spiral galaxy turns; we fall into its heart ================= */
  reg({ id: 'cz_spiral', name: '나선은하의 왕관', odds: 1e11, colors: ['#ffe0a0', '#8a7aff', '#020208'],
    snd: 'rise:strings hit:orchestra tail:choirpad amb:space root:196 scale:lydian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 250, 4); stars(g, e, 707, 200, { speed: 0.4 * seg(p, 0.2, 0.6) });
      const zoom = 1 + E.inCubic(seg(p, 0.3, 0.64)) * 2.4;
      galaxy(g, cx, cy, m * 0.48 * zoom, { seed: 71, n: 1400, arms: 2, spin: time * 0.0004, sy: lerp(0.42, 0.85, seg(p, 0.1, 0.6)), rot: -0.35, h1: 225, h2: 42 });
      TX().glow(g, cx, cy, m * 0.05 * zoom, '#fff0c8', 0.45);
      reveal(g, e, { hue: 44, kind: 'brilliant', at: 0.66 });
      TX().vignette(g, e, 0.6);
    } });

  /* ================= 8 · 1500억 · 초신성의 잔해 - a giant breathes, collapses, and blows itself apart ================= */
  reg({ id: 'cz_supernova', name: '초신성의 잔해', odds: 1.5e11, colors: ['#ffd0a0', '#ff4a2a', '#080202'],
    snd: 'rise:rumble hit:quake tail:echo amb:fire root:110 scale:phrygian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 10, 4); stars(g, e, 808, 220, {});
      const breathe = 1 + 0.06 * Math.sin(time * 0.004) * (1 - seg(p, 0.35, 0.45)), coll = E.inCubic(seg(p, 0.42, 0.5)), boom = seg(p, 0.5, 1);
      const SR = m * 0.24 * breathe * (1 - coll * 0.95);
      if (boom <= 0) {
        TX().glow(g, cx, cy, SR * 2.6, '#ff6a2a', 0.7);
        const sg = g.createRadialGradient(cx - SR * 0.3, cy - SR * 0.3, 0, cx, cy, SR); sg.addColorStop(0, '#ffe8c0'); sg.addColorStop(0.6, '#ff7a30'); sg.addColorStop(1, '#a01800');
        g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, SR, 0, TAU); g.fill();
        g.save(); g.beginPath(); g.arc(cx, cy, SR, 0, TAU); g.clip(); g.globalCompositeOperation = 'lighter';
        const r0 = rng(8); for (let i = 0; i < 40; i++) { const a = r0() * TAU, d = r0() * SR, s = SR * (0.06 + r0() * 0.1); g.fillStyle = `rgba(255,200,120,${0.15 + 0.1 * Math.sin(time * 0.003 + i)})`; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, 0, TAU); g.fill(); }
        g.restore();
      } else {
        // the blast: an expanding shell of filaments and a coloured remnant cloud
        const R = e.R * E.outCubic(boom) * 1.1;
        drawTex(g, nebulaTex('snr', 81, [10, 30, 200, 340], { n: 80, spread: 0.3 }), cx, cy, R * 2.2, boom * 0.4, clamp(1.2 - boom * 0.4));
        g.save(); g.globalCompositeOperation = 'lighter'; const r0 = rng(18);
        for (let i = 0; i < 140; i++) { const a = r0() * TAU, l = R * (0.7 + r0() * 0.35), wob = (r0() - 0.5) * 0.08; g.strokeStyle = `rgba(255,${120 + r0() * 120 | 0},${80 + r0() * 100 | 0},${0.5 * (1 - boom * 0.6)})`; g.lineWidth = u * 0.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * l * 0.8, cy + Math.sin(a) * l * 0.8); g.lineTo(cx + Math.cos(a + wob) * l, cy + Math.sin(a + wob) * l); g.stroke(); }
        g.restore();
      }
      reveal(g, e, { hue: 18, kind: 'star', at: 0.5, flash: 1.2 });
      TX().vignette(g, e, 0.6);
    } });

  /* ================= 9 · 2000억 · 퀘이사의 창 - a feeding black hole fires two jets across the sky ================= */
  reg({ id: 'cz_quasar', name: '퀘이사의 창', odds: 2e11, colors: ['#f0c8ff', '#a04aff', '#030008'],
    snd: 'rise:engine hit:thunder tail:echo amb:laser root:98 scale:phrygian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 280, 4); stars(g, e, 909, 220, {});
      galaxy(g, cx, cy, m * 0.7, { seed: 91, n: 700, arms: 3, spin: time * 0.0002, sy: 0.3, rot: 0.15, h1: 270, h2: 30, alpha: 0.45 });
      const jet = E.outCubic(seg(p, 0.15, 0.55)), L = e.R * 1.2 * jet;
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, cy); g.rotate(0.15);
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 3; k++) { const w = u * (4 - k * 1.2), gr = g.createLinearGradient(0, 0, 0, sd * L); gr.addColorStop(0, `rgba(255,240,255,${0.9 - k * 0.2})`); gr.addColorStop(0.5, `rgba(200,120,255,${0.4 - k * 0.1})`); gr.addColorStop(1, 'rgba(120,60,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-w, 0); g.lineTo(0, sd * L); g.lineTo(w, 0); g.fill(); }
        for (let i = 0; i < 8; i++) { const q = fr(time * 0.0008 + i / 8), y = sd * q * L; TX().glow(g, 0, y, u * 3 * (1 - q * 0.5), '#e8b8ff', (1 - q) * jet); }
      }
      // the disk, edge-on, white-hot at the centre
      const dg = g.createRadialGradient(0, 0, 0, 0, 0, m * 0.2); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(0.3, 'rgba(255,190,255,.6)'); dg.addColorStop(1, 'rgba(160,60,255,0)');
      g.save(); g.scale(1, 0.18); g.fillStyle = dg; g.beginPath(); g.arc(0, 0, m * 0.2, 0, TAU); g.fill(); g.restore();
      g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, m * 0.018, 0, TAU); g.fill();
      g.restore();
      reveal(g, e, { hue: 285, kind: 'spire', at: 0.66 });
      TX().vignette(g, e, 0.62);
    } });

  /* ================= 10 · 2500억 · 사건의 지평선 - the lensed disk of a black hole, and the light that can't leave ================= */
  reg({ id: 'cz_horizon', name: '사건의 지평선', odds: 2.5e11, colors: ['#ffe0b0', '#ff9a3a', '#000000'],
    snd: 'rise:drone hit:gong tail:pad amb:choirdrone root:82 scale:minor',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const slow = 1 - seg(p, 0.2, 0.62) * 0.9;                         // time itself slows near the horizon
      stars(g, e, 1010, 300, { speed: 0.25 * slow, alpha: 0.9 });
      const push = 1 + E.inOut(seg(p, 0, 0.64)) * 0.6, BH = m * 0.11 * push, D = m * 0.48 * push;
      g.save(); g.translate(cx, cy);
      const disk = (front) => {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 40; i++) {
          const rr = lerp(BH * 1.5, D, i / 39), a0 = front ? 0 : Math.PI, dop = 0.55 + 0.45 * Math.sin(time * 0.0003 + i);
          const gr = g.createLinearGradient(-rr, 0, rr, 0); gr.addColorStop(0, `rgba(255,${200 + i},${150 + i * 2},${0.08 * dop})`); gr.addColorStop(1, `rgba(255,140,60,${0.03 * dop})`);   // the side spinning toward us is brighter
          g.strokeStyle = gr; g.lineWidth = (D - BH) / 30; g.beginPath(); g.ellipse(0, 0, rr, rr * 0.16, 0, a0, a0 + Math.PI); g.stroke();
        }
        g.restore();
      };
      disk(false);
      // the far side of the disk, bent up over the top and under the bottom of the shadow by gravity
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const rr = BH * (1.2 + i * 0.07); g.strokeStyle = `rgba(255,${215 - i * 4},${165 - i * 5},${0.34 - i * 0.015})`; g.lineWidth = BH * 0.09; g.beginPath(); g.ellipse(0, 0, rr * 1.05, rr, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); g.beginPath(); g.ellipse(0, 0, rr * 1.05, rr * 0.9, 0, Math.PI * 0.08, Math.PI * 0.92); g.stroke(); }
      g.strokeStyle = 'rgba(255,240,210,.9)'; g.lineWidth = BH * 0.04; g.beginPath(); g.arc(0, 0, BH * 1.12, 0, TAU); g.stroke();   // photon ring
      g.restore();
      g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, BH, 0, TAU); g.fill();
      disk(true);
      g.restore();
      const pinch = seg(p, 0.58, 0.66); if (pinch > 0) TX().glow(g, cx, cy, BH * 2 * (1 - pinch), '#ffffff', pinch);
      reveal(g, e, { hue: 32, kind: 'octa', at: 0.66 });
      TX().vignette(g, e, 0.7);
    } });

  /* ================= 11 · 3000억 · 웜홀의 문 - through the throat and out into another sky ================= */
  reg({ id: 'cz_wormhole', name: '웜홀의 문', odds: 3e11, colors: ['#a0f0ff', '#c04aff', '#01000a'],
    snd: 'rise:whoosh hit:whomp tail:sparkle amb:space root:147 scale:whole',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      const inT = seg(p, 0.15, 0.6), out = seg(p, 0.6, 0.68);
      if (out < 1) {
        space(g, e, lerp(190, 300, inT), 5);
        stars(g, e, 1111, 320, { speed: 0.6 + inT * 5, warp: inT * 1.2 });
        // the throat: rings of light rushing past, hue sliding blue -> violet
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 22; i++) {
          const z = fr(i / 22 - time * 0.0004 * (0.5 + inT * 4)), R = m * 0.06 / Math.max(0.04, z), a = Math.min(1, (1 - z) * 1.5) * (0.15 + inT * 0.6);
          if (R > e.R * 2) continue;
          g.strokeStyle = hsla(lerp(190, 300, inT) + i * 6, 90, 70, a * 0.5); g.lineWidth = Math.max(1, u * 1.5 * (1 - z));
          g.beginPath(); g.ellipse(cx + Math.sin(time * 0.001 + i) * u * 3 * inT, cy, R, R * 0.92, time * 0.0002 + i, 0, TAU); g.stroke();
        }
        g.restore();
        TX().glow(g, cx, cy, m * (0.08 + inT * 0.3), '#e8d0ff', 0.4 + inT * 0.6);
      } else {
        // the other side: a sky packed with galaxies
        space(g, e, 300, 6); stars(g, e, 1112, 260, {});
        for (let i = 0; i < 7; i++) { const r0 = rng(120 + i); galaxy(g, W * r0(), H * r0(), m * (0.06 + r0() * 0.12), { seed: 130 + i, n: 220, arms: 2, spin: time * 0.0003, sy: 0.4 + r0() * 0.5, rot: r0() * 3, h1: 200 + r0() * 120, h2: 40, alpha: 0.8 }); }
      }
      reveal(g, e, { hue: 300, kind: 'prism', at: 0.62, flash: 1.3 });
      TX().vignette(g, e, 0.6);
    } });

  /* ================= 12 · 3500억 · 우주의 현 - one vibrating string, then a whole lattice of them ================= */
  reg({ id: 'cz_string', name: '우주의 현', odds: 3.5e11, colors: ['#a0ffe8', '#2ad0b0', '#000806'],
    snd: 'rise:arpeggio hit:harp tail:pluck amb:space root:262 scale:pent',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 170, 4); stars(g, e, 1212, 200, { twinkle: 1 });
      const many = E.inOut(seg(p, 0.35, 0.62)), amp = m * 0.08 * (0.4 + seg(p, 0, 0.35) * 0.6);
      const string = (y0, ang, harm, phase, a, hue) => {
        const path = new Path2D(), L = e.R * 2.2, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
        for (let i = 0; i <= 80; i++) {
          const t = i / 80, s = (t - 0.5) * L, wave = Math.sin(t * Math.PI * harm) * Math.sin(time * 0.006 * harm + phase) * amp * Math.sin(t * Math.PI);
          const x = cx + dx * s + nx * (wave + y0), y = cy + dy * s + ny * (wave + y0);
          i ? path.lineTo(x, y) : path.moveTo(x, y);
        }
        TX().neon(g, path, HX(hue, 90, 65), u * 0.5, a, '#ffffff');
      };
      string(0, -0.12, 3, 0, 1, 168);
      if (many > 0) for (let k = 0; k < 10; k++) string((k - 4.5) * m * 0.09, -0.12 + (k % 2 ? 1 : -1) * (0.5 + k * 0.08), 2 + (k % 4), k, many * 0.7, 160 + k * 12);
      // where strings cross, little knots of light
      if (many > 0.3) { const r0 = rng(12); for (let i = 0; i < 30; i++) TX().glow(g, cx + (r0() - 0.5) * W * 0.9, cy + (r0() - 0.5) * H * 0.8, u * 3, '#c8fff0', (many - 0.3) * (0.5 + 0.5 * Math.sin(time * 0.004 + i))); }
      reveal(g, e, { hue: 168, kind: 'spire', at: 0.66 });
      TX().vignette(g, e, 0.62);
    } });

  /* ================= 13 · 4000억 · 다이슨의 왕관 - a swarm of orbiting panels closes around a star ================= */
  reg({ id: 'cz_dyson', name: '다이슨의 왕관', odds: 4e11, colors: ['#ffe8a0', '#e0a020', '#060400'],
    snd: 'rise:engine hit:anvil tail:bells amb:machine root:220 scale:major',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 45, 4); stars(g, e, 1313, 220, {});
      const build = seg(p, 0.05, 0.6), dim = seg(p, 0.5, 0.62);
      TX().glow(g, cx, cy, m * 0.7, '#ffd070', 0.75 * (1 - dim * 0.6));
      g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(cx, cy, m * 0.07, 0, TAU); g.fill();
      rays(g, cx, cy, 18, m * 1.1, 'rgba(255,220,140,.25)', 1 - dim * 0.8, time * 0.00005, 0.02);
      g.save(); g.translate(cx, cy);
      const RINGS = 7;
      for (let k = 0; k < RINGS; k++) {
        const show = clamp(build * RINGS - k), R = m * (0.14 + k * 0.035), tilt = (k / RINGS) * Math.PI, n = 22 + k * 4, spin = time * 0.0004 * (k % 2 ? 1 : -1.3);
        if (show <= 0) continue;
        for (let i = 0; i < n * show; i++) {
          const a = spin + i / n * TAU, x0 = Math.cos(a) * R, y0 = Math.sin(a) * R * 0.3, x = x0 * Math.cos(tilt) - y0 * Math.sin(tilt), y = x0 * Math.sin(tilt) + y0 * Math.cos(tilt);
          const front = Math.sin(a) > 0, glintK = Math.pow(Math.max(0, Math.cos(a - time * 0.001)), 20);
          g.fillStyle = front ? `rgba(${200 + glintK * 55 | 0},${170 + glintK * 85 | 0},90,.95)` : 'rgba(90,70,30,.7)';
          g.save(); g.translate(x, y); g.rotate(a + tilt); g.fillRect(-u * 0.9, -u * 0.35, u * 1.8, u * 0.7); g.restore();
          if (glintK > 0.5) glint(g, x, y, u * 2.5, '#fff4c0', glintK);
        }
      }
      g.restore();
      reveal(g, e, { hue: 46, kind: 'cube', at: 0.66 });
      TX().vignette(g, e, 0.62);
    } });

  /* ================= 14 · 4500억 · 은하의 충돌 - two galaxies pass, tear, and become one ================= */
  reg({ id: 'cz_collision', name: '은하의 충돌', odds: 4.5e11, colors: ['#ffc8f0', '#6a8aff', '#020208'],
    snd: 'rise:tidal hit:crash tail:choirpad amb:space root:130 scale:dorian',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      space(g, e, 280, 4); stars(g, e, 1414, 220, {});
      const k = E.inOut(seg(p, 0, 0.62)), d = lerp(m * 0.62, 0, k), tide = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.6 + k * 0.4;
      const pull = sd => (dd, ang) => Math.cos(ang) * dd * m * 0.35 * tide * sd * Math.max(0, dd - 0.4);
      galaxy(g, cx - d * 0.6, cy - d * 0.25, m * 0.46, { seed: 141, n: 900, arms: 2, spin: time * 0.0004 + k * 3, sy: 0.5, rot: 0.4, h1: 215, h2: 45, warpX: pull(-1), warpY: (dd, ang) => Math.sin(ang * 2) * dd * m * 0.1 * tide });
      galaxy(g, cx + d * 0.6, cy + d * 0.25, m * 0.42, { seed: 142, n: 800, arms: 2, spin: -time * 0.0004 - k * 3, sy: 0.6, rot: -0.6, h1: 330, h2: 30, warpX: pull(1), warpY: (dd, ang) => -Math.sin(ang * 2) * dd * m * 0.1 * tide });
      // starbursts where the gas collides
      const burst = seg(p, 0.35, 0.62);
      if (burst > 0) { const r0 = rng(14); for (let i = 0; i < 14; i++) { const x = cx + (r0() - 0.5) * m * 0.5, y = cy + (r0() - 0.5) * m * 0.3; TX().glow(g, x, y, m * 0.04, r0() > 0.5 ? '#9ac8ff' : '#ff9ad8', burst * (0.5 + 0.5 * Math.sin(time * 0.006 + i * 2))); } }
      reveal(g, e, { hue: 290, kind: 'cluster', at: 0.66 });
      TX().vignette(g, e, 0.62);
    } });

  /* ================= 15 · 5000억 · 마지막 별 - every star goes out, one by one, except one ================= */
  reg({ id: 'cz_laststar', name: '마지막 별', odds: 5e11, colors: ['#e8f0ff', '#8a9aff', '#000000'],
    snd: 'rise:breath hit:bowl tail:musicbox amb:whisper root:233 scale:minor',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const fade = seg(p, 0.05, 0.55), r0 = rng(1515);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 500; i++) {
        const x = r0() * W, y = r0() * H, die = r0(), b = r0();
        const life = clamp((die - fade) * 8);                 // each star has its own moment to go out
        if (life <= 0) continue;
        const red = 1 - life;                                 // they redden as they die
        g.fillStyle = `rgba(${200 + red * 55 | 0},${(200 - red * 140) | 0},${(230 - red * 200) | 0},${(0.3 + 0.6 * b) * life})`;
        const s = 0.8 + b * 1.6; g.fillRect(x, y, s, s);
      }
      g.restore();
      // the last one, in the middle, flickering - then it holds
      const lastA = 0.6 + 0.4 * Math.sin(time * 0.009) * Math.sin(time * 0.0031) * (1 - seg(p, 0.55, 0.62));
      TX().glow(g, cx, cy, m * (0.06 + seg(p, 0.55, 0.64) * 0.3), '#cfe0ff', lastA);
      g.fillStyle = `rgba(255,255,255,${lastA})`; g.beginPath(); g.arc(cx, cy, u * 0.8, 0, TAU); g.fill();
      reveal(g, e, { hue: 222, kind: 'octa', at: 0.66, flash: 0.6 });
      TX().vignette(g, e, 0.8);
    } });

  /* ================= 16 · 5500억 · 태초의 불꽃 - nothing, a point, then everything ================= */
  reg({ id: 'cz_bigbang', name: '태초의 불꽃', odds: 5.5e11, colors: ['#ffffff', '#ffb040', '#000000'],
    snd: 'rise:gravity hit:orchestra tail:choirpad amb:space root:65 scale:major',
    draw(g, e) {
      const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const pt = seg(p, 0.05, 0.28), bang = seg(p, 0.28, 0.32), grow = E.outCubic(seg(p, 0.3, 0.62)), cool = seg(p, 0.38, 0.62);
      if (bang <= 0) { TX().glow(g, cx, cy, u * (1 + pt * 6), '#ffffff', pt); return; }
      // the fireball: white-hot -> gold -> red as it cools, then the afterglow mottles into the first structure
      const R = e.R * 1.3 * grow;
      const fg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, R));
      fg.addColorStop(0, hsla(lerp(50, 20, cool), 100, lerp(98, 60, cool), 1)); fg.addColorStop(0.6, hsla(lerp(40, 10, cool), 100, lerp(80, 35, cool), 0.8)); fg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fg; g.fillRect(0, 0, W, H);
      if (cool > 0.2) {
        drawTex(g, nebulaTex('cmb', 161, [10, 30, 200, 220], { n: 140, spread: 0.5, lanes: 30 }), cx, cy, e.R * 2.4, time * 0.00002, (cool - 0.2) * 0.9);
        // the first galaxies switch on across the field as we pull back
        const r0 = rng(160); g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 60; i++) { const on = clamp((cool - 0.3 - r0() * 0.6) * 5); const x = cx + (r0() - 0.5) * W * 1.2 * (1 - cool * 0.3), y = cy + (r0() - 0.5) * H * 1.2 * (1 - cool * 0.3); if (on > 0) TX().glow(g, x, y, m * 0.02, r0() > 0.5 ? '#ffe0b0' : '#b0c8ff', on); }
        g.restore();
      }
      TX().flash(g, e, bump(p, 0.28, 0.36) * 1.4, '#ffffff');
      reveal(g, e, { hue: 48, kind: 'star', at: 0.66, size: 0.17 });
      TX().vignette(g, e, 0.55);
    } });

  /* ================= 17 · 6000억 · 우주의 눈 - pull back past the galaxies, past the cosmic web: it was a crystal all along ================= */
  {
    const NODES = (r => Array.from({ length: 70 }, () => [r() * 2 - 1, r() * 2 - 1, r()]))(rng(1717));
    reg({ id: 'cz_cosmiceye', name: '우주의 눈', odds: 6e11, colors: ['#e0c8ff', '#7a4aff', '#000000'],
      snd: 'rise:chant hit:toll tail:choirpad amb:choirdrone root:55 scale:harmonic',
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H);
        space(g, e, 265, 3);
        const back = E.inOut(seg(p, 0, 0.6)), Z = lerp(3.2, 0.42, back);   // zoom factor: galaxy scale -> the whole web
        // the galaxy we start inside, falling away
        galaxy(g, cx, cy, m * 0.5 * Z, { seed: 171, n: 900, arms: 2, spin: time * 0.0003, sy: 0.5, rot: -0.3, h1: 240, h2: 45, alpha: clamp(1.3 - back * 1.6) });
        // the cosmic web: nodes and filaments, growing in as we pull back
        const web = clamp(back * 1.6 - 0.3), S = m * 0.9 * Z;
        if (web > 0) {
          g.save(); g.globalCompositeOperation = 'lighter';
          const P = NODES.map(([x, y, b]) => [cx + x * S, cy + y * S * 0.8, b]);
          g.lineWidth = 1;
          for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
            const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], d = Math.hypot(dx, dy);
            if (d > S * 0.42) continue;
            g.strokeStyle = `rgba(170,140,255,${0.16 * web * (1 - d / (S * 0.42))})`; g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke();
          }
          for (const [x, y, b] of P) TX().glow(g, x, y, u * (1.5 + b * 3), b > 0.6 ? '#ffe8c0' : '#c0a8ff', web * (0.5 + 0.5 * Math.sin(time * 0.002 + b * 30)));
          g.restore();
        }
        // ... and the whole web is the inside of one faceted crystal, an eye looking back at you
        const shell = seg(p, 0.45, 0.62);
        if (shell > 0) {
          const R = m * 0.44 * lerp(1.6, 1, shell), facets = 10;
          g.save(); g.globalCompositeOperation = 'lighter';
          const path = new Path2D(); for (let i = 0; i < facets; i++) { const a = i / facets * TAU - Math.PI / 2; i ? path.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.72) : path.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.72); } path.closePath();
          TX().neon(g, path, '#b08aff', u * 0.6, shell, '#ffffff');
          for (let i = 0; i < facets; i++) { const a = i / facets * TAU - Math.PI / 2; g.strokeStyle = `rgba(200,180,255,${0.3 * shell})`; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.72); g.stroke(); }
          const iris = shell * shell; TX().glow(g, cx, cy, R * 0.45, '#8a4aff', iris * 0.8);
          g.fillStyle = `rgba(0,0,0,${iris * 0.85})`; g.beginPath(); g.ellipse(cx, cy, R * 0.06, R * 0.22 * iris, 0, 0, TAU); g.fill();
          g.restore();
        }
        reveal(g, e, { hue: 272, kind: 'brilliant', at: 0.66, size: 0.18, flash: 1.2 });
        TX().vignette(g, e, 0.7);
      } });
  }
})();
