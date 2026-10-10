/*
  RARE BIOME minerals (js/biome.js). None of them is listed in the codex.
    CUBER STAGE  - the limited aura "Luff1004": 1 in 1,000,000 per swing, luck ignored. The maker's mark.
    GLITCH       - 19 error minerals, each one a different way for a computer to fall apart on screen:
                   blue screen, frozen dialogs, stack traces, missing textures, no signal, kernel panic...
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2;
  const fr = v => v - Math.floor(v);
  const bump = (p, a, b) => G.tx.bump(p, a, b);
  const ob = k => (k <= 0 ? 0 : E.outBack(k));
  const MONO = 'ui-monospace,"Cascadia Mono",Consolas,"D2Coding","Malgun Gothic",monospace';
  const SANS = '"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  const TX = () => G.tx;

  /* ================================================================================================
     LUFF1004 - CUBER STAGE's limited aura
     a terminal asks who's there -> the world compiles in a flood of code -> a neon stage unrolls,
     cubes rain into one monolith -> it splits open and its pieces become a name.
     ================================================================================================ */
  {
    const TERM = ['> connect amethyst://world', '  handshake .............. ok', '> load --stage cuber', '  cubes ........ 4096 / 4096', '> whoami'];
    const WORDS = ['crystal', 'luck', 'odds', 'shatter', 'render()', 'aura', 'mine', 'void', 'cube', 'stage', 'seed', 'world', 'amethyst', '0x1004', 'while(true)', 'spawn', 'glow', 'build'];
    const NAME = 'LUFF1004';
    const CUBES = (r => Array.from({ length: 64 }, (_, i) => ({ x: i % 4, y: Math.floor(i / 4) % 4, z: Math.floor(i / 16), d: r() * 0.25, sp: r() })))(rng(1004));
    const iso = (x, y, z, s, ax) => { const c = Math.cos(ax), si = Math.sin(ax), X = x * c - z * si, Z = x * si + z * c; return [X * s, (y - Z * 0.35) * s * 0.9, Z]; };
    function solidCube(g, cx, cy, s, ax, ay, cols, a) {
      const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => {
        const y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax), x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
        const k = 1 / (1 + z2 * 0.15); return [cx + x2 * s * k, cy + y1 * s * k, z2];
      });
      const F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]];
      const faces = F.map((f, i) => ({ f, i, z: f.reduce((a, j) => a + V[j][2], 0) / 4 })).sort((a, b) => b.z - a.z);
      g.save(); g.globalAlpha = a;
      for (const { f, i } of faces) {
        g.beginPath(); f.forEach((j, n) => (n ? g.lineTo(V[j][0], V[j][1]) : g.moveTo(V[j][0], V[j][1]))); g.closePath();
        g.fillStyle = cols[i % cols.length]; g.fill();
        g.strokeStyle = 'rgba(160,250,255,.9)'; g.lineWidth = Math.max(1, s * 0.04); g.stroke();
      }
      g.restore();
    }
    G.cutscenes.register({
      id: 'aura_luff1004', name: 'Luff1004', odds: 1e6, tier: 'aura', biome: 'cuber', aura: true, zone: -1,
      duration: 24000, revealAt: 0.72, colors: ['#bff8ff', '#3af0ff', '#02020a'],
      snd: 'rise:arpeggio hit:synthstab tail:choirpad amb:laser root:146 scale:dorian',
      captions: [
        { a: 0.21, b: 0.37, en: 'compiling the world', style: 'type', font: MONO, size: 20, pos: 'bottom' },
        { a: 0.46, b: 0.62, ko: '모든 세계에는, 처음 쌓아 올린 이름이 하나 있다', style: 'engrave', size: 22, pos: 'bottom' },
        { a: 0.76, b: 1.4, en: '> whoami   luff1004', style: 'type', font: MONO, size: 20, pos: 'bottom' },
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, m = Math.min(W, H), t = time;
        g.fillStyle = '#010106'; g.fillRect(0, 0, W, H);
        /* A · the terminal */
        const termA = 1 - seg(p, 0.16, 0.22);
        if (termA > 0) {
          const fs = Math.max(11, m * 0.034), x0 = W * 0.08, y0 = H * 0.32, chars = Math.floor(seg(p, 0.01, 0.15) * TERM.join('').length);
          g.save(); g.globalAlpha = termA; g.font = `600 ${fs}px ${MONO}`; g.textBaseline = 'top';
          let used = 0;
          TERM.forEach((ln, i) => {
            const show = ln.slice(0, Math.max(0, chars - used)); used += ln.length;
            g.fillStyle = ln.startsWith('>') ? '#3af0ff' : ln.includes('ok') || ln.includes('4096') ? '#7affc8' : '#9ab0c8';
            g.fillText(show, x0, y0 + i * fs * 1.6);
            if (show.length < ln.length && show.length > 0 || (i === TERM.length - 1 && show.length === ln.length)) {
              if (Math.floor(t / 400) % 2 === 0) { g.fillStyle = '#3af0ff'; g.fillRect(x0 + g.measureText(show).width + 3, y0 + i * fs * 1.6, fs * 0.55, fs); }
            }
          });
          g.restore();
        }
        /* B · the world compiles: code rains, faster and faster, then folds into a grid */
        const flood = bump(p, 0.15, 0.36), grid = E.inOut(seg(p, 0.3, 0.42));
        if (flood > 0) {
          const fs = Math.max(9, m * 0.022), cols = Math.ceil(W / (fs * 0.85)), r = rng(7), speed = 1 + seg(p, 0.15, 0.34) * 5;
          g.save(); g.font = `700 ${fs}px ${MONO}`; g.globalCompositeOperation = 'lighter'; g.textBaseline = 'top';
          for (let c = 0; c < cols; c++) {
            const sp = 0.5 + r() * 1.3, off = r(), x = c * fs * 0.85, trail = 3 + Math.floor(r() * 3);
            for (let w = 0; w < trail; w++) {                 // each column streams several words, the newest letter burning white
              const word = WORDS[Math.floor(r() * WORDS.length)], head = fr(off + w / trail + t * sp * 0.00018 * speed);
              for (let k = 0; k < word.length; k++) {
                const y = (head * 1.3 - 0.15) * H - (word.length - k) * fs;
                const isHead = k === word.length - 1, a = flood * (0.25 + 0.75 * (k + 1) / word.length);
                g.fillStyle = isHead ? `rgba(235,255,255,${flood})` : (c % 4 === 0 ? `rgba(255,58,216,${0.7 * a})` : `rgba(58,240,255,${0.75 * a})`);
                g.fillText(word[k], x, y);
              }
            }
          }
          g.restore();
          TX().glow(g, cx, cy, m * 0.8 * seg(p, 0.26, 0.34), '#3af0ff', 0.5 * flood);   // the code converging into light
        }
        /* C · the stage: a neon floor, cubes falling into one monolith, a slow orbit */
        if (grid > 0) {
          const hz = H * 0.6, vx = W / 2;
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = grid; g.lineWidth = 1.3;
          for (let i = 0; i < 22; i++) { const k = fr(i / 22 + t * 0.00012), y = hz + (H - hz) * k * k; g.strokeStyle = `rgba(58,240,255,${0.06 + k * 0.5})`; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
          for (let i = -16; i <= 16; i++) { g.strokeStyle = `rgba(255,58,216,${0.3 - Math.abs(i) * 0.014})`; g.beginPath(); g.moveTo(vx + i * W * 0.015, hz); g.lineTo(vx + i * W * 0.2, H); g.stroke(); }
          const hzg = g.createLinearGradient(0, hz - m * 0.2, 0, hz); hzg.addColorStop(0, 'rgba(255,58,216,0)'); hzg.addColorStop(1, 'rgba(255,58,216,.35)');
          g.fillStyle = hzg; g.fillRect(0, hz - m * 0.2, W, m * 0.2);
          // it's a stage: four spotlights sweep up from the floor
          for (let i = 0; i < 4; i++) {
            const bx = W * (0.08 + i * 0.28), a = -Math.PI / 2 + Math.sin(t * 0.0009 + i * 1.7) * 0.5, L = H * 1.1, wd = 0.07;
            const bg = g.createLinearGradient(bx, H, bx + Math.cos(a) * L, H + Math.sin(a) * L);
            bg.addColorStop(0, i % 2 ? 'rgba(255,58,216,.32)' : 'rgba(58,240,255,.32)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = bg; g.beginPath(); g.moveTo(bx, H); g.lineTo(bx + Math.cos(a - wd) * L, H + Math.sin(a - wd) * L); g.lineTo(bx + Math.cos(a + wd) * L, H + Math.sin(a + wd) * L); g.fill();
          }
          g.restore();
          // the monolith assembles: 64 cubes drop in, each at its own moment
          const orbit = t * 0.00035 + p * 2, S = m * 0.045, splitK = E.inOut(seg(p, 0.5, 0.62)), mx = cx, my = H * 0.42;
          const list = CUBES.map(c => { const [X, Y, Z] = iso(c.x - 1.5, c.y - 1.5, c.z - 1.5, 1, orbit); return { c, X, Y, Z }; }).sort((a, b) => a.Z - b.Z);
          for (const { c, X, Y } of list) {
            const land = E.outCubic(seg(p, 0.34 + c.d * 0.4 + c.sp * 0.05, 0.44 + c.d * 0.4));
            if (land <= 0) continue;
            const dir = Math.atan2(Y, X || 0.001), push = splitK * m * 0.25 * (0.6 + c.sp), fx = Math.cos(dir) * push, fy = Math.sin(dir) * push;
            const x = mx + X * S * 2.1 + fx, y = my + Y * S * 2.1 - (1 - land) * H * 0.7 + fy;
            solidCube(g, x, y, S * (1 - splitK * 0.3), 0.5 + orbit * 0.2, orbit + c.sp, ['#0a2a40', '#123a5a', '#2a0f40', '#0e4a60'], Math.min(1, land * 1.5) * (1 - seg(p, 0.6, 0.66)));
          }
          // the core inside, exposed as it splits
          const nk = seg(p, 0.58, 0.66), coreA = splitK * (1 - nk * 0.75);       // dims as the name takes the light
          if (splitK > 0) {
            TX().glow(g, mx, my, m * 0.35 * splitK, '#bff8ff', coreA); TX().glow(g, mx, my, m * 0.1 * splitK, '#ffffff', coreA);
            // electricity arcing from the core out to the drifting cubes
            if (splitK < 0.98) {
              g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(190,250,255,.9)'; g.lineWidth = 1.6; g.shadowColor = '#3af0ff'; g.shadowBlur = 10;
              const ar = rng(Math.floor(t / 70));
              for (let k = 0; k < 6; k++) { const a = ar() * TAU, L = m * (0.15 + ar() * 0.3) * splitK; let x = mx, y = my; g.beginPath(); g.moveTo(x, y); for (let s2 = 1; s2 <= 7; s2++) { x = mx + Math.cos(a) * L * s2 / 7 + (ar() - 0.5) * m * 0.03; y = my + Math.sin(a) * L * s2 / 7 + (ar() - 0.5) * m * 0.03; g.lineTo(x, y); } g.stroke(); }
              g.restore();
            }
          }
          if (bump(p, 0.44, 0.47) > 0) { g.fillStyle = `rgba(190,250,255,${0.3 * bump(p, 0.44, 0.47) * G.flashMul()})`; g.fillRect(0, 0, W, H); }   // the last cube locks in
        }
        /* D · the pieces become a name */
        const nameK = seg(p, 0.56, 0.68);
        if (nameK > 0) {
          const fs = Math.min(W * 0.15, m * 0.2), y = H * 0.42;
          g.save(); g.font = `900 ${fs}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.06}px`;
          const total = g.measureText(NAME).width, x0 = W / 2 - total / 2;
          let x = x0;
          for (let i = 0; i < NAME.length; i++) {
            const ch = NAME[i], w = g.measureText(ch).width + fs * 0.06, k = E.outCubic(clamp(nameK * 1.6 - i * 0.07)), r = rng(30 + i);
            const sx = W * r(), sy = r() > 0.5 ? -fs : H + fs, px = lerp(sx, x + w / 2, k), py = lerp(sy, y, k);
            g.save(); g.translate(px, py); g.rotate((1 - k) * (r() - 0.5) * 6);
            const chrome = g.createLinearGradient(0, -fs / 2, 0, fs / 2); chrome.addColorStop(0, '#ffffff'); chrome.addColorStop(0.45, '#a8f4ff'); chrome.addColorStop(0.5, '#1a4a6a'); chrome.addColorStop(1, '#bff8ff');
            g.fillStyle = chrome; g.globalAlpha = k * (1 - seg(p, 0.7, 0.74)); g.fillText(ch, 0, 0);
            g.strokeStyle = '#3af0ff'; g.lineWidth = Math.max(1, fs * 0.025); g.strokeText(ch, 0, 0);
            g.restore();
            x += w;
          }
          g.restore();
          if (nameK > 0.6) TX().glow(g, W / 2, y, m * 0.5, '#3af0ff', (nameK - 0.6) * 1.2);
        }
        /* E · the stone */
        const rv = ob(seg(p, 0.7, 0.82));
        TX().flash(g, e, bump(p, 0.68, 0.74) * 1.2, '#bff8ff');
        if (rv > 0) {
          const gy = H * 0.42;
          g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 1.4;
          for (let i = 0; i < 8; i++) {   // small cubes orbiting the stone
            const a = t * 0.0006 + i / 8 * TAU, r = m * 0.24 * rv, x = cx + Math.cos(a) * r, y = gy + Math.sin(a) * r * 0.32;
            g.strokeStyle = i % 2 ? '#3af0ff' : '#ff3ad8'; g.globalAlpha = 0.8;
            const s2 = m * 0.018; g.strokeRect(x - s2, y - s2, s2 * 2, s2 * 2);
          }
          g.restore();
          TX().glow(g, cx, gy, m * 0.6 * rv, '#3af0ff', 0.5);
          TX().gem(g, 'brilliant', cx, gy, m * 0.16 * rv, 188, t, { glow: 1.5 });
          for (let k = 0; k < 2; k++) { const q = fr(t * 0.0004 + k / 2); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(58,240,255,${0.5 * (1 - q)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, gy, m * 0.3 * (0.6 + q), m * 0.1 * (0.6 + q), 0, 0, TAU); g.stroke(); g.restore(); }
          TX().dust(g, e, '#bff8ff', 70, 1004, 0.002);
        }
        // scanlines over everything - it is, after all, running on a screen
        g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
        TX().vignette(g, e, 0.6);
      },
    });
  }

  /* ================================================================================================
     GLITCH - 19 error minerals
     shared kit: tearing slices of the frame, RGB fringes, noise blocks, a CRT pass, and the reveal -
     a gem that renders wrong (split channels, sliced, flickering) before it settles.
     ================================================================================================ */
  const step = (t, hz = 12) => Math.floor(t / (1000 / hz));
  const R = (n, t, hz) => fr(Math.sin(n * 12.9898 + step(t, hz) * 78.233) * 43758.5453);
  function tear(g, e, amt, n = 4) {
    if (amt <= 0) return;
    const cv = g.canvas, dpr = cv.width / e.W;
    for (let i = 0; i < n; i++) {
      const y = R(i + 1, e.time) * e.H, h = 4 + R(i + 9, e.time) * 50, dx = (R(i + 17, e.time) - 0.5) * 120 * amt;
      try { g.drawImage(cv, 0, y * dpr, cv.width, h * dpr, dx, y, e.W, h); } catch (err) {}
    }
  }
  function fringe(g, e, amt) {
    if (amt <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(255,0,60,${0.06 * amt})`; g.fillRect(3 * amt, 0, e.W, e.H);
    g.fillStyle = `rgba(0,255,220,${0.06 * amt})`; g.fillRect(-3 * amt, 0, e.W, e.H);
    g.restore();
  }
  function blocks(g, e, amt, hz = 10) {
    if (amt <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16 * amt; i++) { if (R(i, e.time, hz) < 0.4) continue; g.fillStyle = ['rgba(255,42,106,.35)', 'rgba(42,255,208,.3)', 'rgba(255,255,255,.25)', 'rgba(120,80,255,.3)'][i % 4]; g.fillRect(R(i + 3, e.time, hz) * e.W, R(i + 5, e.time, hz) * e.H, 10 + R(i + 7, e.time, hz) * e.W * 0.3, 2 + R(i + 11, e.time, hz) * 30); }
    g.restore();
  }
  function crt(g, e, a = 0.15) { g.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < e.H; y += 3) g.fillRect(0, y, e.W, 1); TX().vignette(g, e, 0.65); }
  function mono(g, txt, x, y, size, col, align = 'left', weight = 600) { g.font = `${weight} ${size}px ${MONO}`; g.textAlign = align; g.textBaseline = 'top'; g.fillStyle = col; g.fillText(txt, x, y); }
  function errGem(g, e, at, hue, kind) {
    const { p, W, H, time } = e, m = Math.min(W, H), rv = ob(seg(p, at, at + 0.12)), cx = e.cx, cy = e.cy;
    TX().flash(g, e, bump(p, at - 0.02, at + 0.04), '#ffffff');
    if (rv <= 0) return;
    const jitter = (1 - seg(p, at + 0.05, at + 0.25)) * m * 0.02;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.55; TX().gem(g, kind, cx - jitter - 3, cy, m * 0.15 * rv, 350, time, { glow: 0.6 });
    TX().gem(g, kind, cx + jitter + 3, cy, m * 0.15 * rv, 175, time, { glow: 0.6 });
    g.restore();
    TX().gem(g, kind, cx, cy, m * 0.15 * rv, hue, time, { glow: 1.3 });
    TX().glow(g, cx, cy, m * 0.5 * rv, '#ff2a6a', 0.25);
    if (R(77, time, 8) < 0.25) tear(g, e, 0.5, 3);
  }
  const ERR = (o) => G.cutscenes.register(Object.assign({ tier: 'glitch', biome: 'glitch', zone: -1, captions: [], revealAt: 0.68,
    duration: o.odds < 1e8 ? 12000 : o.odds < 2e9 ? 14000 : 16000, snd: 'rise:static hit:zap tail:none amb:machine root:110 scale:whole' }, o));

  /* 1 · NULL - the world forgets what things are */
  ERR({ id: 'err_null', name: 'NULL', odds: 1e5, colors: ['#ffffff', '#ff2a6a', '#000000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#05050a'; g.fillRect(0, 0, W, H);
    const k = seg(p, 0.05, 0.6), n = Math.floor(k * 220), r = rng(11);
    for (let i = 0; i < n; i++) mono(g, r() > 0.15 ? 'null' : 'NULL', r() * W, r() * H, m * (0.02 + r() * 0.05), `rgba(${200 + r() * 55 | 0},${r() > 0.85 ? 40 : 200},${r() > 0.85 ? 90 : 210},${0.25 + r() * 0.6})`);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.setLineDash([6, 6]); g.strokeRect(e.cx - m * 0.18, e.cy - m * 0.18, m * 0.36, m * 0.36); g.setLineDash([]);
    mono(g, 'Object reference not set to an instance of an object', W / 2, e.cy + m * 0.22, m * 0.026, '#ff6a8a', 'center');
    tear(g, e, seg(p, 0.4, 0.66)); errGem(g, e, 0.66, 0, 'octa'); crt(g, e);
  } });

  /* 2 · NaN - every number on screen stops being one */
  ERR({ id: 'err_nan', name: 'NaN석', odds: 5e5, colors: ['#e0f0ff', '#ff2a6a', '#000000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#04060c'; g.fillRect(0, 0, W, H);
    const rows = 14, k = seg(p, 0.1, 0.6);
    for (let i = 0; i < rows; i++) {
      const y = H * 0.12 + i * H * 0.055, broken = fr(i * 0.37) < k;
      mono(g, ['COINS', 'LUCK', 'ODDS', 'CRYSTALS', 'CLICKS', 'DEPTH', 'MULT'][i % 7], W * 0.12, y, m * 0.03, '#7a8aa8');
      mono(g, broken ? (R(i, time) < 0.5 ? 'NaN' : '-Infinity') : (Math.floor(time * (i + 1) * 3) % 1e9).toLocaleString(), W * 0.88, y, m * 0.034, broken ? '#ff4a7a' : '#e0f0ff', 'right', 800);
    }
    blocks(g, e, seg(p, 0.45, 0.66)); errGem(g, e, 0.66, 340, 'cube'); crt(g, e);
  } });

  /* 3 · 404 - the crystal page can't be found */
  ERR({ id: 'err_404', name: '404 NOT FOUND', odds: 2e6, colors: ['#ffffff', '#5a8aff', '#0a0a0a'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H);
    g.fillStyle = '#f4f4f6'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#e2e2e6'; g.fillRect(0, 0, W, H * 0.07); mono(g, 'https://amethyst/crystal', W * 0.06, H * 0.022, m * 0.028, '#555');
    mono(g, '404', W / 2, H * 0.2, m * 0.2, '#222', 'center', 900);
    mono(g, '요청하신 결정을 찾을 수 없습니다.', W / 2, H * 0.43, m * 0.034, '#444', 'center');
    const bx = e.cx - m * 0.08, by = H * 0.52, bs = m * 0.16;          // the broken-image icon
    g.strokeStyle = '#aaa'; g.lineWidth = 2; g.strokeRect(bx, by, bs, bs); g.beginPath(); g.moveTo(bx, by + bs * 0.7); g.lineTo(bx + bs * 0.4, by + bs * 0.4); g.lineTo(bx + bs * 0.6, by + bs * 0.6); g.lineTo(bx + bs, by + bs * 0.3); g.stroke();
    const dark = E.inCubic(seg(p, 0.5, 0.64)); g.fillStyle = `rgba(0,0,0,${dark})`; g.fillRect(0, 0, W, H);
    tear(g, e, seg(p, 0.35, 0.6), 6); errGem(g, e, 0.66, 225, 'prism'); crt(g, e, 0.08);
  } });

  /* 4 · MISSING_TEXTURE - pink and black checkers eat the world */
  ERR({ id: 'err_texture', name: 'MISSING_TEXTURE', odds: 8e6, colors: ['#ff00dc', '#000000', '#000000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#10101a'; g.fillRect(0, 0, W, H);
    const k = E.inOut(seg(p, 0.05, 0.62)), sz = m * 0.06, R0 = k * Math.hypot(W, H) * 0.7;
    for (let y = 0; y < H; y += sz) for (let x = 0; x < W; x += sz) {
      const d = Math.hypot(x - e.cx, y - e.cy); if (d > R0) continue;
      g.fillStyle = (Math.floor(x / sz) + Math.floor(y / sz)) % 2 ? '#ff00dc' : '#000'; g.fillRect(x, y, sz + 1, sz + 1);
    }
    mono(g, 'texture "crystal_diffuse.png" not found', 12, H - m * 0.06, m * 0.026, '#ffffff');
    errGem(g, e, 0.66, 310, 'cube'); crt(g, e, 0.08);
  } });

  /* 5 · 99% - the loading bar that never finishes, until it does */
  ERR({ id: 'err_loading', name: '99% 결정', odds: 3e7, colors: ['#ffffff', '#3a8aff', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#06080e'; g.fillRect(0, 0, W, H);
    const pc = Math.min(99, Math.floor(seg(p, 0, 0.2) * 99)) + (p > 0.6 ? 1 : 0), bw = W * 0.6, bx = (W - bw) / 2, by = e.cy;
    g.strokeStyle = '#3a8aff'; g.lineWidth = 2; g.strokeRect(bx, by, bw, m * 0.03);
    g.fillStyle = '#3a8aff'; g.fillRect(bx + 3, by + 3, (bw - 6) * pc / 100, m * 0.03 - 6);
    mono(g, `결정 불러오는 중... ${pc}%`, W / 2, by - m * 0.07, m * 0.034, '#e0e8ff', 'center');
    g.save(); g.translate(W / 2, by + m * 0.12); g.rotate(time * 0.008); for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillStyle = `rgba(200,220,255,${(i + 1) / 8})`; g.fillRect(m * 0.03, -2, m * 0.02, 4); } g.restore();
    if (p > 0.3 && p < 0.6) mono(g, `남은 시간: ${Math.floor(1 + R(1, time, 2) * 9999)}시간`, W / 2, by + m * 0.2, m * 0.026, '#8a9ab8', 'center');
    blocks(g, e, bump(p, 0.55, 0.68)); errGem(g, e, 0.66, 210, 'octa'); crt(g, e);
  } });

  /* 6 · NO SIGNAL - colour bars, a bouncing box, then snow */
  ERR({ id: 'err_nosignal', name: 'NO SIGNAL', odds: 7e7, colors: ['#ffffff', '#ffd000', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H);
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    bars.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * W / 7, 0, W / 7 + 1, H * 0.7); });
    ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * W / 7, H * 0.7, W / 7 + 1, H * 0.08); });
    g.fillStyle = '#101010'; g.fillRect(0, H * 0.78, W, H * 0.22);
    const bx = fr(time * 0.00011) , by = fr(time * 0.00007), x = Math.abs(bx * 2 - 1) * (W - m * 0.4), y = Math.abs(by * 2 - 1) * (H - m * 0.12);
    g.fillStyle = '#000'; g.fillRect(x, y, m * 0.4, m * 0.12); mono(g, 'NO SIGNAL', x + m * 0.2, y + m * 0.035, m * 0.05, '#fff', 'center', 800);
    const snow = seg(p, 0.45, 0.64);
    if (snow > 0) { for (let i = 0; i < 1400 * snow; i++) { const v = Math.random() * 255 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); } }
    errGem(g, e, 0.66, 50, 'star'); crt(g, e, 0.2);
  } });

  /* 7 · BLUE SCREEN - the classic */
  ERR({ id: 'err_bsod', name: 'BLUE SCREEN', odds: 1e8, colors: ['#ffffff', '#0a5aff', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H);
    g.fillStyle = '#0a5aff'; g.fillRect(0, 0, W, H);
    const x0 = W * 0.1, fs = m * 0.04;
    mono(g, ':(', x0, H * 0.14, m * 0.2, '#fff', 'left', 400);
    g.font = `500 ${fs}px ${SANS}`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'top';
    ['PC에 문제가 발생하여 다시 시작해야 합니다.', '오류 정보를 수집하고 있습니다.'].forEach((s, i) => g.fillText(s, x0, H * 0.42 + i * fs * 1.6));
    g.fillText(`${Math.min(100, Math.floor(seg(p, 0.1, 0.6) * 100))}% 완료`, x0, H * 0.56);
    g.font = `400 ${fs * 0.55}px ${SANS}`; g.fillText('중지 코드: CRYSTAL_INTEGRITY_VIOLATION', x0, H * 0.7); g.fillText('실패한 항목: amethyst.sys', x0, H * 0.74);
    tear(g, e, seg(p, 0.5, 0.66), 6); fringe(g, e, seg(p, 0.55, 0.7) * 3);
    errGem(g, e, 0.66, 215, 'brilliant'); crt(g, e, 0.08);
  } });

  /* 8 · 응답 없음 - error dialogs cascade until they fill the screen */
  ERR({ id: 'err_popup', name: '응답 없음', odds: 1.6e8, colors: ['#ffffff', '#ff4a4a', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#1a3a5a'; g.fillRect(0, 0, W, H);
    const n = Math.floor(E.inCubic(seg(p, 0.05, 0.62)) * 60), dw = Math.min(W * 0.7, 300), dh = 120;
    for (let i = 0; i < n; i++) {
      const x = 20 + (i * 14) % (W - dw - 20), y = 30 + (i * 14 + Math.floor(i / 20) * 40) % (H - dh - 30);
      g.fillStyle = '#f0f0f0'; g.fillRect(x, y, dw, dh); g.strokeStyle = '#888'; g.strokeRect(x, y, dw, dh);
      g.fillStyle = i === n - 1 ? '#2a6ad0' : '#b8b8c0'; g.fillRect(x, y, dw, 22);
      g.font = `600 12px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('amethyst.exe (응답 없음)', x + 8, y + 11);
      g.fillStyle = '#d02020'; g.beginPath(); g.arc(x + 26, y + 58, 13, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = `900 16px ${SANS}`; g.textAlign = 'center'; g.fillText('×', x + 26, y + 58);
      g.fillStyle = '#222'; g.font = `500 12px ${SANS}`; g.textAlign = 'left'; g.fillText('결정이 응답하지 않습니다.', x + 50, y + 52); g.fillText('프로그램을 닫으시겠습니까?', x + 50, y + 70);
      g.fillStyle = '#e0e0e0'; g.fillRect(x + dw - 80, y + dh - 30, 66, 22); g.strokeRect(x + dw - 80, y + dh - 30, 66, 22); g.fillStyle = '#222'; g.textAlign = 'center'; g.fillText('확인', x + dw - 47, y + dh - 19);
    }
    g.fillStyle = `rgba(255,255,255,${0.35 * bump(p, 0.4, 0.66)})`; g.fillRect(0, 0, W, H);   // the whole window whitens, frozen
    errGem(g, e, 0.66, 0, 'octa'); crt(g, e, 0.06);
  } });

  /* 9 · STACK OVERFLOW - a red stack trace scrolls faster than it can be read */
  ERR({ id: 'err_stack', name: 'STACK OVERFLOW', odds: 2.6e8, colors: ['#ff6a6a', '#ff2a2a', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#0a0406'; g.fillRect(0, 0, W, H);
    const fs = Math.max(10, m * 0.026), lh = fs * 1.35, scroll = time * 0.06 * (1 + seg(p, 0.2, 0.6) * 12), first = Math.floor(scroll / lh);
    mono(g, 'Uncaught RangeError: Maximum call stack size exceeded', 10, 10, fs * 1.1, '#ff4a4a', 'left', 800);
    for (let i = 0; i < Math.ceil(H / lh); i++) {
      const n = first + i, y = 40 + i * lh - (scroll % lh);
      mono(g, `    at mineCrystal (amethyst.js:${1004 + (n % 97)}:${(n * 7) % 80})  ← crystal.mine() ← crystal.mine()`, 10, y, fs, n % 9 === 0 ? '#ffb0b0' : '#c04a5a');
    }
    blocks(g, e, seg(p, 0.5, 0.66)); errGem(g, e, 0.66, 355, 'spire'); crt(g, e);
  } });

  /* 10 · MEMORY DUMP - hex scrolls; the ascii column spells something */
  ERR({ id: 'err_hex', name: 'MEMORY DUMP', odds: 4.2e8, colors: ['#7affc8', '#2ad08a', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#020806'; g.fillRect(0, 0, W, H);
    const fs = Math.max(10, m * 0.026), lh = fs * 1.4, base = Math.floor(time / 60), secret = 'AMETHYST.IS.WATCHING.';
    for (let i = 0; i < Math.ceil(H / lh); i++) {
      const addr = (0x1004 * 16 + (base + i) * 16).toString(16).toUpperCase().padStart(8, '0');
      let hex = '', asc = '';
      for (let j = 0; j < 8; j++) { const b = Math.floor(fr(Math.sin((base + i) * 31.7 + j * 7.3) * 9999) * 256); hex += b.toString(16).padStart(2, '0').toUpperCase() + ' '; asc += b > 32 && b < 127 ? String.fromCharCode(b) : '.'; }
      if (p > 0.35 && (base + i) % 3 === 0) asc = secret.slice(((base + i) * 2) % secret.length, ((base + i) * 2) % secret.length + 8).padEnd(8, '.');
      mono(g, addr, 8, 10 + i * lh, fs, '#2a8a5a'); mono(g, hex, 8 + fs * 6, 10 + i * lh, fs, '#7affc8'); mono(g, asc, W - 8, 10 + i * lh, fs, (base + i) % 3 === 0 && p > 0.35 ? '#ffffff' : '#3aaa7a', 'right');
    }
    tear(g, e, seg(p, 0.5, 0.66)); errGem(g, e, 0.66, 150, 'twin'); crt(g, e);
  } });

  /* 11 · DATAMOSH - the picture forgets its keyframes and smears */
  ERR({ id: 'err_datamosh', name: 'DATAMOSH', odds: 6.8e8, colors: ['#ff8ae0', '#8a4aff', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a0a3a'); sky.addColorStop(1, '#0a0a2a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    TX().glow(g, e.cx, e.cy, m * 0.4, '#c060ff', 0.6);
    const smear = seg(p, 0.15, 0.62), bs = m * 0.08, r = rng(Math.floor(time / 90));
    for (let i = 0; i < 70 * smear; i++) {
      const x = Math.floor(r() * W / bs) * bs, y = Math.floor(r() * H / bs) * bs, dx = (r() - 0.5) * bs * 4 * smear, dy = r() * bs * 3 * smear;
      try { const cv = g.canvas, d = cv.width / W; g.drawImage(cv, x * d, y * d, bs * d, bs * d, x + dx, y + dy, bs, bs * (1 + r() * 2)); } catch (err) {}
    }
    fringe(g, e, smear * 2); errGem(g, e, 0.66, 290, 'cluster'); crt(g, e, 0.08);
  } });

  /* 12 · PIXEL SORT - columns of light slide into order */
  ERR({ id: 'err_sort', name: 'PIXEL SORT', odds: 1.1e9, colors: ['#ffe0a0', '#ff6a2a', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#0a0604'; g.fillRect(0, 0, W, H);
    const k = seg(p, 0.05, 0.62), cols = 90, cw = W / cols, r = rng(12);
    for (let i = 0; i < cols; i++) {
      const len = H * (0.2 + r() * 0.8) * k, y0 = r() * H * (1 - k), hue = 20 + r() * 40;
      const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, `hsla(${hue},90%,85%,.9)`); gr.addColorStop(1, `hsla(${hue + 280},80%,20%,0)`);
      g.fillStyle = gr; g.fillRect(i * cw, y0, cw + 0.5, len);
    }
    errGem(g, e, 0.66, 30, 'prism'); crt(g, e, 0.08);
  } });

  /* 13 · KERNEL PANIC - white on black, and then nothing moves */
  ERR({ id: 'err_kernel', name: 'KERNEL PANIC', odds: 1.8e9, colors: ['#ffffff', '#aaaaaa', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const L = ['Kernel panic - not syncing: Attempted to kill crystal!', 'CPU: 0 PID: 1004 Comm: amethyst Tainted: G    ERR', 'Call Trace:', ' dump_stack+0x6d/0x8b', ' panic+0x101/0x2e3', ' do_exit+0xb44/0xb50', ' do_group_exit+0x3a/0xa0', ' mine_crystal+0x10/0x10', 'Kernel Offset: 0x1004000 from 0xffffffff81000000', '---[ end Kernel panic - not syncing ]---'];
    const fs = Math.max(10, m * 0.027), n = Math.floor(seg(p, 0.05, 0.4) * L.length);
    for (let i = 0; i < n; i++) mono(g, L[i], 10, 16 + i * fs * 1.5, fs, '#e8e8e8');
    if (p > 0.4 && Math.floor(time / 500) % 2) g.fillStyle = '#e8e8e8', g.fillRect(10, 16 + n * fs * 1.5, fs * 0.6, fs);
    tear(g, e, bump(p, 0.58, 0.66) * 2, 5); errGem(g, e, 0.66, 0, 'octa'); crt(g, e, 0.1);
  } });

  /* 14 · SEGFAULT - the screen itself cracks, each shard a different colour channel */
  {
    const SH = (r => Array.from({ length: 16 }, () => [r() * TAU, 0.3 + r() * 0.9]))(rng(14));
    ERR({ id: 'err_segfault', name: 'SEGFAULT', odds: 2.9e9, colors: ['#ffffff', '#ff2a6a', '#000'], draw(g, e) {
      const { p, W, H, time } = e, m = Math.min(W, H);
      galaxyBg(g, e);
      const crack = seg(p, 0.25, 0.4), hx = e.cx + m * 0.1, hy = e.cy - m * 0.08;
      if (crack > 0) {
        g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5;
        SH.forEach(([a, l], i) => { let x = hx, y = hy; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { const aa = a + Math.sin(i * 3 + s) * 0.3; x += Math.cos(aa) * m * 0.12 * l * crack; y += Math.sin(aa) * m * 0.12 * l * crack; g.lineTo(x, y); } g.stroke(); });
        for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(hx, hy, m * (0.03 + i * 0.05) * crack, 0, TAU); g.stroke(); }
        g.restore();
        mono(g, 'Segmentation fault (core dumped)', 12, H - m * 0.07, m * 0.03, '#ff4a7a', 'left', 800);
      }
      fringe(g, e, seg(p, 0.4, 0.66) * 3); tear(g, e, seg(p, 0.45, 0.66));
      errGem(g, e, 0.66, 330, 'star'); crt(g, e, 0.08);
    } });
  }
  function galaxyBg(g, e) { g.fillStyle = '#05030a'; g.fillRect(0, 0, e.W, e.H); TX().dust(g, e, '#c0b0ff', 120, 33, 0.001); TX().glow(g, e.cx, e.cy, Math.min(e.W, e.H) * 0.6, '#6a3aff', 0.3); }

  /* 15 · 무한 재귀 - the frame is inside the frame is inside the frame */
  ERR({ id: 'err_recursion', name: '무한 재귀', odds: 4.6e9, colors: ['#bfe8ff', '#4a8aff', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H), z = fr(time * 0.00025 * (1 + seg(p, 0.2, 0.6) * 4));
    g.fillStyle = '#04060c'; g.fillRect(0, 0, W, H);
    for (let i = 8; i >= 0; i--) {
      const s = Math.pow(0.72, i - z), w = W * s, h = H * s;
      g.strokeStyle = `hsla(${200 + i * 15},90%,70%,${Math.min(1, s * 1.5)})`; g.lineWidth = Math.max(1, 3 * s);
      g.strokeRect(e.cx - w / 2, e.cy - h / 2, w, h);
      if (s > 0.15) mono(g, `frame(${i + Math.floor(time / 4000) * 9})`, e.cx - w / 2 + 6, e.cy - h / 2 + 4, Math.max(8, 14 * s), `hsla(${200 + i * 15},90%,80%,${Math.min(1, s)})`);
    }
    mono(g, 'InternalError: too much recursion', W / 2, H - m * 0.08, m * 0.028, '#ff6a8a', 'center', 700);
    errGem(g, e, 0.66, 205, 'spire'); crt(g, e);
  } });

  /* 16 · undefined - the game's own screen, broken */
  ERR({ id: 'err_undefined', name: 'undefined', odds: 7.4e9, colors: ['#e0d0ff', '#9a6aff', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#0a0814'; g.fillRect(0, 0, W, H);
    const broke = seg(p, 0.1, 0.55);
    mono(g, 'COINS', 20, 18, 10, '#8a84a0'); mono(g, broke > 0.2 ? 'undefined' : '1.00Sx', 20, 30, m * 0.05, '#fff', 'left', 800);
    mono(g, 'LUCK', W - 120, 18, 10, '#8a84a0'); mono(g, broke > 0.4 ? 'NaN' : 'x1.00', W - 120, 30, m * 0.04, '#ffd84a', 'left', 800);
    const tabs = ['상점', '지도', '강화', '도감', '크리스탈'];
    tabs.forEach((t, i) => { const x = 10 + i * (W - 20) / 5, garbled = fr(i * 0.37 + 0.2) < broke; g.strokeStyle = '#6a5aa0'; g.strokeRect(x + 2, H * 0.12, (W - 20) / 5 - 4, 30); mono(g, garbled ? '[object Object]'.slice(0, 6 + i) : t, x + (W - 20) / 10, H * 0.12 + 8, 12, garbled ? '#ff4a7a' : '#cfc6ea', 'center'); });
    // the crystal, duplicated and offset like a stuck render
    for (let i = 0; i < 1 + Math.floor(broke * 6); i++) TX().gem(g, 'octa', e.cx + (i - 1) * m * 0.08 * broke, e.cy + Math.sin(i) * m * 0.04 * broke, m * 0.12, 275, time, { glow: 0.5 });
    mono(g, 'TypeError: Cannot read properties of undefined (reading "crystal")', W / 2, H - m * 0.08, m * 0.024, '#ff6a8a', 'center');
    tear(g, e, seg(p, 0.45, 0.66)); errGem(g, e, 0.68, 280, 'brilliant'); crt(g, e);
  } });

  /* 17 · ■■■■ - the name itself is corrupted, the palette breaks */
  ERR({ id: 'err_corrupt', name: '■■■■', odds: 1.2e10, colors: ['#ffffff', '#ff2a6a', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H);
    const hue = (time * 0.2) % 360; g.fillStyle = `hsl(${hue},60%,8%)`; g.fillRect(0, 0, W, H);
    const k = seg(p, 0.05, 0.6), word = '아메시스트';
    for (let row = 0; row < 9; row++) {
      let s = ''; for (let i = 0; i < word.length; i++) s += R(row * 9 + i, time, 6) < k ? '■' : word[i];
      g.save(); g.globalAlpha = 0.25 + 0.75 * (row === 4 ? 1 : 0.3); mono(g, s, W / 2 + (R(row, time, 9) - 0.5) * 40 * k, H * 0.1 + row * H * 0.09, m * (row === 4 ? 0.1 : 0.05), row === 4 ? '#fff' : `hsl(${hue + row * 40},90%,65%)`, 'center', 900); g.restore();
    }
    blocks(g, e, k * 1.5, 14); fringe(g, e, k * 3); tear(g, e, seg(p, 0.35, 0.66), 6);
    errGem(g, e, 0.66, (hue + 180) % 360, 'cube'); crt(g, e);
  } });

  /* 18 · OVERFLOW 0xFFFF - a counter climbs past its limit and the screen wraps around */
  ERR({ id: 'err_overflow', name: 'OVERFLOW 0xFFFF', odds: 1.9e10, colors: ['#a0ffea', '#2affd0', '#000'], draw(g, e) {
    const { p, W, H, time } = e, m = Math.min(W, H); g.fillStyle = '#020a0a'; g.fillRect(0, 0, W, H);
    const v = Math.floor(E.inCubic(seg(p, 0.05, 0.5)) * 65535), wrapped = p > 0.5;
    mono(g, wrapped ? '-32768' : String(v), W / 2, e.cy - m * 0.12, m * 0.16, wrapped ? '#ff4a7a' : '#a0ffea', 'center', 900);
    mono(g, wrapped ? 'INTEGER OVERFLOW' : `0x${v.toString(16).toUpperCase().padStart(4, '0')}`, W / 2, e.cy + m * 0.08, m * 0.04, '#2affd0', 'center', 700);
    if (wrapped) { const sh = (time * 0.4) % H, cv = g.canvas, d = cv.width / W; try { g.drawImage(cv, 0, 0, cv.width, cv.height, 0, sh - H, W, H); g.drawImage(cv, 0, 0, cv.width, (H - sh) * d, 0, sh, W, H - sh); } catch (err) {} }
    errGem(g, e, 0.66, 168, 'twin'); crt(g, e);
  } });

  /* 19 · FATAL - the world deletes itself row by row; the crystal renders back in, one scanline at a time */
  ERR({ id: 'err_fatal', name: 'FATAL: 결정이 존재하지 않음', odds: 3e10, colors: ['#ffffff', '#ff2a6a', '#000'], duration: 18000, revealAt: 0.7, draw(g, e) {
    const { p, u, W, H, time } = e, m = Math.min(W, H);
    galaxyBg(g, e); TX().gem(g, 'octa', e.cx, e.cy, m * 0.12, 275, time, { glow: 0.6 });
    const del = E.inCubic(seg(p, 0.15, 0.5)), rows = 40;
    for (let i = 0; i < rows; i++) if (fr(i * 0.618) < del) { g.fillStyle = '#fff'; g.fillRect(0, i * H / rows, W, H / rows + 1); }
    if (p > 0.5) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); }
    const msg = seg(p, 0.48, 0.6);
    if (msg > 0) { mono(g, 'FATAL ERROR', W / 2, H * 0.3, m * 0.09, `rgba(200,0,40,${msg})`, 'center', 900); mono(g, '결정이 존재하지 않습니다', W / 2, H * 0.3 + m * 0.12, m * 0.04, `rgba(30,30,30,${msg})`, 'center', 600); }
    // the stone renders back in from the top, scanline by scanline
    const scan = seg(p, 0.66, 0.8);
    if (scan > 0) {
      g.save(); g.beginPath(); g.rect(0, 0, W, H * scan); g.clip();
      g.fillStyle = '#05030a'; g.fillRect(0, 0, W, H);
      TX().glow(g, e.cx, e.cy, m * 0.6, '#ff2a6a', 0.4); TX().gem(g, 'brilliant', e.cx, e.cy, m * 0.17, 330, time, { glow: 1.5 });
      g.restore();
      g.fillStyle = 'rgba(255,42,106,.9)'; g.fillRect(0, H * scan - 2, W, 3);
    }
    if (scan >= 1) { fringe(g, e, 1 + Math.sin(time * 0.02)); if (R(5, time, 6) < 0.15) tear(g, e, 0.4, 2); }
    crt(g, e, 0.1);
  } });
})();
