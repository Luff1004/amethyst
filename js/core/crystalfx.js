/* AMETHYST - shared crystal + crack rendering, factored out of js/game.js so anything else (LEVEL 1's
   own crystal, LEVEL 1's screen-wide crack overlay) can draw the exact same faceted-gem-with-glowing-
   branching-cracks look instead of a cheaper stand-in. Each call to make()/makeCracks() is a fresh,
   fully independent instance (its own shape/crack state, its own offscreen buffer) - nothing here is
   shared mutable module state, so the main game and LEVEL 1 never step on each other.

   G.crystalFX.make(seed)         -> a crystal rig: { shape, growCrack(lx,ly), draw(g, opts), respawn(seed) }
   G.crystalFX.makeCracks(canvasPx) -> just the crack-buffer half, for cracking something that isn't a
                                       crystal-shaped clip region (LEVEL 1's full-screen crack overlay) */
(() => {
  const { rng, clamp } = G;
  const TAU = Math.PI * 2;

  function makeShape(seed) {
    const r = rng(seed), n = 7 + Math.floor(r() * 3), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (r() - 0.5) * 0.35 - Math.PI / 2, rad = 0.78 + r() * 0.22;
      pts.push([Math.cos(a) * rad * 0.86, Math.sin(a) * rad]);
    }
    const apex = [(r() - 0.5) * 0.25, (r() - 0.5) * 0.25 - 0.05];
    const facets = pts.map((p, i) => {
      const q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, mid = Math.atan2(my, mx);
      return { l: 20 + 38 * (0.5 + 0.5 * Math.cos(mid + 2.2)) + r() * 8, ang: mid, mx, my, var: r() };
    });
    return { pts, apex, facets, born: performance.now() };
  }

  /* the crack half alone: a branching-walk generator + a 3-pass (dark outline / hue glow / white core)
     cached render, reusable for anything - a crystal's own clip region, or a full screen. Coordinates
     for grow() are in the same [-1,1]-ish unit space the buffer is set up for. */
  function makeCracks(canvasPx = 512) {
    const CR = canvasPx, cv = document.createElement('canvas'); cv.width = cv.height = CR;
    const cg = cv.getContext('2d');
    const cracks = []; let dirty = true;
    function grow(lx, ly, ampMul = 1) {
      const segs = [], rnd = Math.random, step = 0.05;
      const walk = (x, y, ang, len, w, depth, d0) => {
        const n = Math.max(3, Math.round(len / step));
        let cx = x, cy = y, a = ang;
        for (let i = 0; i < n; i++) {
          const na = a + (rnd() - 0.5) * 0.75, sl = step * (0.7 + rnd() * 0.6);
          const nx = cx + Math.cos(na) * sl, ny = cy + Math.sin(na) * sl, d = d0 + i * step;
          segs.push({ x0: cx, y0: cy, x1: nx, y1: ny, w: w * (1 - (i / n) * 0.82), d });
          const rest = (len - i * step) * 0.62;
          if (depth < 2 && rest > 0.12 && rnd() < 0.17) walk(nx, ny, na + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.7), rest, w * 0.62, depth + 1, d);
          cx = nx; cy = ny; a = na;
        }
      };
      const a0 = rnd() * TAU;
      walk(lx, ly, a0, (0.45 + rnd() * 0.45) * ampMul, 0.034 * ampMul, 0, 0);
      walk(lx, ly, a0 + Math.PI + (rnd() - 0.5) * 0.8, (0.25 + rnd() * 0.3) * ampMul, 0.026 * ampMul, 0, 0);
      let max = 0; for (const s of segs) max = Math.max(max, s.d);
      cracks.push({ segs, born: performance.now(), max });
      if (cracks.length > 60) cracks.shift();
      dirty = true;
    }
    function paint(now, hue, CS, speed = 4.5) {
      cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, CR, CR);
      cg.setTransform(CS, 0, 0, CS, CR / 2, CR / 2);
      cg.lineCap = 'round';
      let growing = false;
      const passes = [
        ['source-over', 'rgba(0,0,0,.78)', 1.9], ['lighter', `hsla(${hue},100%,62%,.55)`, 1.15], ['source-over', 'rgba(255,255,255,.92)', 0.42],
      ];
      for (const [op, col, wm] of passes) {
        cg.globalCompositeOperation = op; cg.strokeStyle = col;
        for (const c of cracks) {
          const reach = (now - c.born) / 1000 * speed;
          if (reach < c.max) growing = true;
          for (const s of c.segs) {
            if (s.d > reach) continue;
            cg.lineWidth = s.w * wm;
            cg.beginPath(); cg.moveTo(s.x0, s.y0); cg.lineTo(s.x1, s.y1); cg.stroke();
          }
        }
      }
      cg.globalCompositeOperation = 'source-over';
      dirty = growing;
    }
    return {
      canvas: cv, CR, grow,
      paintIfDirty(now, hue, CS, speed) { if (dirty) paint(now, hue, CS, speed); },
      get count() { return cracks.length; },
      reset() { cracks.length = 0; dirty = true; },
    };
  }

  /* the full rig: shape + its own crack buffer + the faceted-gem draw routine (same math as the
     main game's drawCrystal, minus the HUD chrome around it - reticle/HP-arc/armed-halo are the
     caller's job since those only make sense for the main mining crystal). */
  function make(seed) {
    let shape = makeShape(seed);
    const CR = 512, CS = CR / 2.6;
    const crackRig = makeCracks(CR);
    return {
      get shape() { return shape; },
      respawn(newSeed) { shape = makeShape(newSeed); crackRig.reset(); },
      growCrack(lx, ly) { crackRig.grow(lx, ly); },
      /* g: 2d ctx. opts: cx,cy,R (px), hue, time(ms), pulse(0..1)=0, kick={x,y}=0,0,
         prog(0..1, crack-light-leak intensity near "shatter")=0, spawn(0..1 scale-in)=1 */
      draw(g, opts) {
        const { cx, cy, R, hue: h, time } = opts, pulse = opts.pulse || 0, kick = opts.kick || { x: 0, y: 0 };
        const prog = opts.prog || 0, spawn = opts.spawn == null ? 1 : opts.spawn, t = time / 1000;
        const bob = Math.sin(t * 1.6) * R * 0.015;
        const sc = R * (1 + pulse * 0.07) * (0.3 + 0.7 * spawn);
        g.save();
        g.translate(cx + kick.x, cy + bob + kick.y);
        g.scale(sc, sc);
        const { pts, apex, facets } = shape, n = pts.length;
        const lightAng = t * 0.22, ambient = 0.35 + pulse * 0.18;
        for (let i = 0; i < n; i++) {
          const p = pts[i], q = pts[(i + 1) % n], f = facets[i];
          const diff = Math.max(0, Math.cos(f.ang - lightAng));
          const boost = Math.pow(diff, 4) * 34, baseL = clamp(f.l + pulse * 14 + boost, 6, 97);
          const hue2 = h + f.var * 16 - 8, sat = 55 + pulse * 18 + boost * 0.3;
          g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.closePath();
          const grad = g.createLinearGradient(apex[0], apex[1], f.mx, f.my);
          grad.addColorStop(0, `hsl(${hue2},${sat * 0.7}%,${Math.max(8, baseL * ambient - 4)}%)`);
          grad.addColorStop(0.55, `hsl(${hue2},${sat}%,${baseL * 0.72}%)`);
          grad.addColorStop(1, `hsl(${hue2},${sat}%,${baseL}%)`);
          g.fillStyle = grad; g.fill();
        }
        const lw = 1.4 / sc;
        g.lineWidth = lw; g.strokeStyle = `hsla(${h},90%,88%,0.55)`;
        g.beginPath();
        for (let i = 0; i < n; i++) { g.moveTo(apex[0], apex[1]); g.lineTo(pts[i][0], pts[i][1]); }
        g.stroke();
        g.lineWidth = lw * 1.6; g.strokeStyle = `hsla(${h},95%,92%,0.9)`;
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
        crackRig.paintIfDirty(time, h, CS);
        g.save();
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip();
        if (prog > 0.4) {
          const lk = g.createRadialGradient(0, 0, 0, 0, 0, 1.1);
          lk.addColorStop(0, `hsla(${h},100%,80%,${(prog - 0.4) * 0.5 * (0.7 + 0.3 * Math.sin(t * 14))})`); lk.addColorStop(1, `hsla(${h},100%,70%,0)`);
          g.fillStyle = lk; g.fillRect(-1.2, -1.2, 2.4, 2.4);
        }
        g.drawImage(crackRig.canvas, -CR / 2 / CS, -CR / 2 / CS, CR / CS, CR / CS);
        g.restore();
        g.restore();
      },
    };
  }

  G.crystalFX = { make, makeCracks };
})();
