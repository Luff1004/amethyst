/*
  MAP 4 SECRET - Labyrinth. Void Rift's one-per-map secret, and the last secret in the game.
  Fully procedural, no image: a circular (polar) labyrinth carves itself ring by ring, a point of
  light walks the one true path to its center - and when it arrives, the maze turns out to be the
  iris of an eye. It looks at you, blinks, and the last caption is LEVEL 1's own: WAKE UP.
  The maze is seeded, so it is always the SAME labyrinth, every time anyone finds it.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2;

  /* ---------- the labyrinth: polar grid, carved once by a seeded recursive backtracker ---------- */
  const N = 10;
  const cnt = r => (r === 0 ? 1 : 6 * Math.pow(2, Math.floor(Math.log2(r))));
  const key = (r, i) => r * 1000 + i;
  const open = new Set();
  const link = (a, b) => { open.add(a + ':' + b); open.add(b + ':' + a); };
  const linked = (a, b) => open.has(a + ':' + b);
  const nbrs = (r, i) => {
    const out = [], c = cnt(r);
    if (r > 0) {
      out.push([r, (i + 1) % c], [r, (i - 1 + c) % c]);
      out.push(r === 1 ? [0, 0] : [r - 1, Math.floor(i / (c / cnt(r - 1)))]);
    }
    if (r < N - 1) {
      const k = cnt(r + 1) / c;
      if (r === 0) for (let j = 0; j < cnt(1); j++) out.push([1, j]);
      else for (let j = 0; j < k; j++) out.push([r + 1, i * k + j]);
    }
    return out;
  };
  {
    const rand = rng(20260924), seen = new Set([key(0, 0)]), stack = [[0, 0]];
    while (stack.length) {
      const [r, i] = stack[stack.length - 1];
      const fresh = nbrs(r, i).filter(([a, b]) => !seen.has(key(a, b)));
      if (!fresh.length) { stack.pop(); continue; }
      const [a, b] = fresh[Math.floor(rand() * fresh.length)];
      link(key(r, i), key(a, b)); seen.add(key(a, b)); stack.push([a, b]);
    }
  }

  /* walls in unit space (radius 1 = outer rim); each gets a build delay, outer rings first */
  const ENTRY = 29;
  const walls = [];
  {
    const rand = rng(77);
    for (let r = 1; r < N; r++) {
      const c = cnt(r);
      for (let i = 0; i < c; i++) {
        const a0 = i / c * TAU, a1 = (i + 1) / c * TAU;
        const inner = r === 1 ? key(0, 0) : key(r - 1, Math.floor(i / (c / cnt(r - 1))));
        const t0 = (N - 1 - r) / N * 0.65 + rand() * 0.25;
        if (!linked(key(r, i), inner)) walls.push({ arc: true, rr: r / N, a0, a1, t0, ring: r });
        if (!linked(key(r, i), key(r, (i + 1) % c))) walls.push({ arc: false, ang: a1, rA: r / N, rB: (r + 1) / N, t0, ring: r });
      }
    }
    const c = cnt(N - 1);
    for (let i = 0; i < c; i++) if (i !== ENTRY) walls.push({ arc: true, rr: 1, a0: i / c * TAU, a1: (i + 1) / c * TAU, t0: rand() * 0.12, ring: N });
  }

  /* the one true path: BFS from the center, walked back from the entrance gap, then densified in
     polar space so the trail curves along the rings instead of cutting chords through walls */
  const path = [];
  {
    const par = new Map([[key(0, 0), null]]), q = [[0, 0]];
    while (q.length) {
      const [r, i] = q.shift();
      for (const [a, b] of nbrs(r, i)) if (!par.has(key(a, b)) && linked(key(r, i), key(a, b))) { par.set(key(a, b), [r, i]); q.push([a, b]); }
    }
    const cells = [];
    for (let cur = [N - 1, ENTRY]; cur; cur = par.get(key(cur[0], cur[1]))) cells.push(cur);
    const polar = ([r, i]) => (r === 0 ? [0, 0] : [(r + 0.5) / N, (i + 0.5) / cnt(r) * TAU]);
    let prev = [(N + 0.9) / N, (ENTRY + 0.5) / cnt(N - 1) * TAU];
    path.push(prev);
    for (const cell of cells) {
      const nx = polar(cell);
      if (nx[0] === 0) nx[1] = prev[1];
      let da = nx[1] - prev[1]; da -= Math.round(da / TAU) * TAU;
      for (let s = 1; s <= 6; s++) path.push([lerp(prev[0], nx[0], s / 6), prev[1] + da * s / 6]);
      prev = [nx[0], prev[1] + da];
    }
  }
  const P = path.map(([rr, a]) => [Math.cos(a) * rr, Math.sin(a) * rr]);

  const bump = (p, a, b) => { const t = seg(p, a, b); return t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI); };
  const MONO = 'ui-monospace,"SF Mono",Consolas,monospace';

  G.cutscenes.register({
    id: 'labyrinth', name: 'Labyrinth', odds: 1e24, tier: 'secret', zone: 4, duration: 21000, revealAt: 0.66,
    snd: 'rise:heart hit:whomp tail:echo amb:space root:58 scale:phrygian',
    colors: ['#ff3fd0', '#7af0ff', '#030106'],
    captions: [
      { a: 0.04, b: 0.2, en: 'YOU FOUND MY LABYRINTH', pos: 'top', style: 'type', font: MONO },
      { a: 0.3, b: 0.46, en: 'YOU WALKED EVERY CORRIDOR', pos: 'top', style: 'type', font: MONO },
      { a: 0.48, b: 0.63, en: 'ALL THE WAY TO THE CENTER', pos: 'top', style: 'type', font: MONO },
      { a: 0.72, b: 0.88, en: 'IT WAS NEVER A MAZE', style: 'type', font: MONO },
      { a: 0.93, b: 1.4, en: 'WAKE UP', style: 'type', font: MONO },
    ],
    draw(g, e) {
      const { p, u, cx, cy, time, W, H } = e, [A, B, D] = e.col;
      const build = seg(p, 0.03, 0.33), solve = E.inOut(seg(p, 0.3, 0.62));
      const eye = E.outCubic(seg(p, 0.62, 0.72)), after = p >= 0.66;
      const Rm = Math.min(W, H) * 0.34 * lerp(0.86, 1, E.outCubic(seg(p, 0, 0.62))) * (1 + 0.06 * eye);
      const rot = time * 0.00004 + eye * 0.35;

      g.fillStyle = D; g.fillRect(0, 0, W, H);

      // drifting void dust behind everything
      const dr = rng(5);
      g.fillStyle = A;
      for (let i = 0; i < 70; i++) {
        const x = (dr() * W + time * 0.004 * (dr() + 0.2)) % W, y = dr() * H;
        g.globalAlpha = 0.12 + 0.25 * dr() * (0.5 + 0.5 * Math.sin(time * 0.002 + i));
        g.fillRect(x, y, u * 0.25, u * 0.25);
      }
      g.globalAlpha = 1;

      // blink: lids slam shut once near the end, just before WAKE UP
      const lidOpen = 1 - bump(p, 0.885, 0.93);
      const L = Rm * 1.95, Hh = Rm * 1.08 * lidOpen;
      const almond = () => {
        g.beginPath(); g.moveTo(cx - L, cy);
        g.quadraticCurveTo(cx, cy - 2 * Hh, cx + L, cy);
        g.quadraticCurveTo(cx, cy + 2 * Hh, cx - L, cy); g.closePath();
      };

      // sclera + iris, fading in only as the maze becomes an eye
      if (eye > 0) {
        g.save(); g.globalAlpha = eye; almond();
        const sg = g.createRadialGradient(cx, cy, Rm * 0.8, cx, cy, L);
        sg.addColorStop(0, '#2a2530'); sg.addColorStop(0.55, '#15111a'); sg.addColorStop(1, D);
        g.fillStyle = sg; g.fill();
        const ig = g.createRadialGradient(cx, cy, Rm * 0.1, cx, cy, Rm * 1.02);
        ig.addColorStop(0, '#1a0418'); ig.addColorStop(0.35, '#5a1150'); ig.addColorStop(0.72, '#1d6b86');
        ig.addColorStop(0.93, '#0b2a3a'); ig.addColorStop(1, 'rgba(0,0,0,0.9)');
        g.fillStyle = ig; g.beginPath(); g.arc(cx, cy, Rm * 1.02, 0, TAU); g.fill();
        g.restore();
      }

      // the maze walls - two passes (wide glow, thin core), colour sliding magenta -> iris cyan
      g.save(); g.translate(cx, cy); g.rotate(rot);
      const wallPath = new Path2D();
      for (const w of walls) {
        const k = clamp((build - w.t0) / 0.12);
        if (k <= 0) continue;
        if (w.arc) {
          wallPath.moveTo(Math.cos(w.a0) * w.rr * Rm, Math.sin(w.a0) * w.rr * Rm);
          wallPath.arc(0, 0, w.rr * Rm, w.a0, w.a0 + (w.a1 - w.a0) * k);
        } else {
          const r1 = lerp(w.rA, w.rB, k);
          wallPath.moveTo(Math.cos(w.ang) * w.rA * Rm, Math.sin(w.ang) * w.rA * Rm);
          wallPath.lineTo(Math.cos(w.ang) * r1 * Rm, Math.sin(w.ang) * r1 * Rm);
        }
      }
      g.lineCap = 'round';
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = eye > 0.5 ? B : A; g.globalAlpha = 0.18 + 0.1 * Math.sin(time * 0.003);
      g.lineWidth = u * 1.6; g.stroke(wallPath);
      g.globalAlpha = 0.9 - 0.35 * eye; g.lineWidth = u * 0.32;
      g.strokeStyle = eye > 0 ? `hsl(${lerp(322, 190, eye)},90%,${lerp(72, 78, eye)}%)` : A;
      g.stroke(wallPath);

      // the walker: a glowing trail along the solution, head bright, fading to embers behind
      if (solve > 0) {
        const n = Math.max(2, Math.floor(solve * (P.length - 1)) + 1);
        const fade = 1 - seg(p, 0.66, 0.8);
        if (fade > 0) {
          g.globalAlpha = 0.85 * fade; g.strokeStyle = '#ffffff'; g.lineWidth = u * 0.45;
          g.shadowColor = A; g.shadowBlur = u * 3;
          g.beginPath(); g.moveTo(P[0][0] * Rm, P[0][1] * Rm);
          for (let i = 1; i < n; i++) g.lineTo(P[i][0] * Rm, P[i][1] * Rm);
          g.stroke(); g.shadowBlur = 0;
        }
        if (p < 0.66) {
          const [hx, hy] = P[n - 1], hr = u * (2.2 + 0.6 * Math.sin(time * 0.02));
          const hg = g.createRadialGradient(hx * Rm, hy * Rm, 0, hx * Rm, hy * Rm, hr * 3);
          hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.3, A); hg.addColorStop(1, 'rgba(0,0,0,0)');
          g.globalAlpha = 1; g.fillStyle = hg; g.beginPath(); g.arc(hx * Rm, hy * Rm, hr * 3, 0, TAU); g.fill();
        }
      }
      g.restore();

      // pupil: the center cell tears open, breathes, then snaps tight when it notices you
      if (eye > 0) {
        const base = Rm * (0.1 + 0.2 * E.outBack(seg(p, 0.62, 0.74)));
        const pr = base * (1 + 0.08 * Math.sin(time * 0.0021)) * (1 - 0.4 * bump(p, 0.78, 0.9));
        const pg = g.createRadialGradient(cx, cy, pr * 0.6, cx, cy, pr * 1.25);
        pg.addColorStop(0, '#000'); pg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, pr * 1.25, 0, TAU); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, pr, 0, TAU); g.fill();
        // wet highlights
        g.globalAlpha = 0.85 * eye;
        g.fillStyle = '#fff';
        g.beginPath(); g.ellipse(cx - Rm * 0.32, cy - Rm * 0.34, Rm * 0.11, Rm * 0.07, -0.6, 0, TAU); g.fill();
        g.globalAlpha = 0.5 * eye;
        g.beginPath(); g.arc(cx + Rm * 0.22, cy + Rm * 0.26, Rm * 0.03, 0, TAU); g.fill();
        g.globalAlpha = 1;

        // eyelids: everything outside the almond goes back to the void
        g.save(); g.globalAlpha = eye;
        g.beginPath(); g.rect(0, 0, W, H);
        g.moveTo(cx - L, cy); g.quadraticCurveTo(cx, cy - 2 * Hh, cx + L, cy); g.quadraticCurveTo(cx, cy + 2 * Hh, cx - L, cy); g.closePath();
        g.fillStyle = D; g.fill('evenodd');
        almond(); g.strokeStyle = A; g.lineWidth = u * 0.5; g.shadowColor = A; g.shadowBlur = u * 4; g.stroke();
        g.restore();
      }

      // reveal flash as the walker reaches the center
      const fl = bump(p, 0.615, 0.7);
      if (fl > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.8 * fl;
        const fg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
        fg.addColorStop(0, '#fff'); fg.addColorStop(0.25, A); fg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = fg; g.fillRect(0, 0, W, H); g.restore();
      }

      // tearing: rare before the eye, frequent after it wakes and again around the blink
      const gr = rng(Math.floor(time / 110));
      const tear = after ? 0.22 + 0.5 * bump(p, 0.87, 0.97) : 0.06;
      if (gr() < tear) {
        const sx = g.canvas.width / W, sy = g.canvas.height / H;
        for (let i = 0; i < 4; i++) {
          const y = gr() * H, h = u * (0.6 + gr() * 3), dx = (gr() - 0.5) * u * 9;
          try { g.drawImage(g.canvas, 0, y * sy, W * sx, h * sy, dx, y, W, h); } catch (err) {}
        }
      }

      // scanlines + vignette
      g.globalAlpha = 0.1; g.fillStyle = '#000';
      for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
      g.globalAlpha = 1;
      const vg = g.createRadialGradient(cx, cy, e.R * 0.35, cx, cy, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    },
  });
})();
