/*
  CUTSCENE ENGINE
  ---------------
  Add a new cutscene anywhere (see js/cutscenes/*.js):

    G.cutscenes.register({
      id: 'my_scene',              // unique
      name: '이름',                 // shown in the codex / on reveal (English for 1억+ minerals)
      odds: 25000,                 // "1 in 25,000" per mining action (before luck)
      zone: 0,                     // map index this mineral lives in (only appears there). [0,1] = several maps
      colors: G.pal(280),          // [bright, mid, dark]  (G.pal(hue) builds one)
      template: 'burst',           // built-in look (+ optional  p: { ...params })  ... OR ...
      draw(g, e) { ... },          // ... your own canvas drawing (see below)

      // optional
      rewardMul: 2,                // reward = odds * rewardMul * zone/coin multipliers
      duration: 5200,              // ms (default depends on rarity)
      revealAt: 0.6,               // 0..1 - when the name / odds / reward appear
      tier: 'epic',                // override the automatic rarity from odds
      captions: [ { a: .1, b: .3, en: 'SUBTITLE', pos: 'top' },     // cinematic subtitles (a/b = fractions of duration).
        { a: .5, b: .9, en: '永劫', v: true, size: 46, font: '"Noto Serif KR",serif', x: .84, y: .4 } ],
        // only `en` is ever shown (no colour, no translation line - deliberate; put Arabic/Hanja/etc. straight
        // in `en`, whatever script - it just renders). pos:'top'|'center'|'bottom' (default bottom) moves a normal
        // line off the letterbox bar. v:true instead swaps in a huge vertical title-card (great for 2-4 CJK/Arabic
        // characters) - use it sparingly, on a minority of cutscenes, not as a blanket rule. size/font/x/y optional,
        // and everything auto-shrinks/clamps to stay on-screen on a narrow phone.
    });

  draw(g, e): g = 2d context (already scaled to CSS pixels).
    e.W e.H e.cx e.cy   canvas size / centre
    e.u                 unit = min(W,H)/100  (size things in u so they scale)
    e.R                 half-diagonal (covers the screen)
    e.p                 progress 0..1 (clamps at 1 - scene should HOLD its final look)
    e.time              ms since start (keeps running - use for ambient loops)
    e.col               the colors array,   e.def.p  the params object
    G.seg(p,a,b)        0..1 slice of the timeline;  G.E.*  easing;  G.rng(seed) stable random
    G.fx.*              glow / rays / poly / gem3 / stars / bg helpers
*/
(() => {
  const { E, seg, clamp, rgba } = G;
  const C = G.cutscenes = { list: [], byId: {}, templates: {}, active: null };
  const TAU = Math.PI * 2;

  /* ---------- drawing helpers for scenes ---------- */
  G.fx = {
    bg(g, e, k = 0.25) {
      g.fillStyle = e.col[2]; g.fillRect(0, 0, e.W, e.H);
      if (k > 0) this.glow(g, e.cx, e.cy, e.R, e.col[1], k);
    },
    glow(g, x, y, r, col, a = 1) {
      if (r <= 0 || a <= 0) return;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    },
    polyPath(g, x, y, r, n, rot = 0) {
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * TAU;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
    },
    starPath(g, x, y, r1, r2, n, rot = 0) {
      g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = rot + (i / (n * 2)) * TAU, r = i % 2 ? r2 : r1;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
    },
    rays(g, x, y, len, n, rot, width, col, a) {
      if (len <= 0 || a <= 0) return;
      g.fillStyle = rgba(col, a);
      for (let i = 0; i < n; i++) {
        const an = rot + (i / n) * TAU;
        g.save(); g.translate(x, y); g.rotate(an);
        g.beginPath(); g.moveTo(0, -width); g.lineTo(len, 0); g.lineTo(0, width); g.closePath(); g.fill();
        g.restore();
      }
    },
    ring(g, x, y, r, w, col, a) {
      if (r <= 0 || a <= 0) return;
      g.strokeStyle = rgba(col, a); g.lineWidth = w;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    },
    /* flat faceted gem (hexagon, fan of triangles) */
    gem(g, x, y, r, col, rot = 0, a = 1) {
      const n = 6, pts = [];
      for (let i = 0; i < n; i++) { const an = rot + (i / n) * TAU - Math.PI / 2; pts.push([x + Math.cos(an) * r, y + Math.sin(an) * r * 1.15]); }
      for (let i = 0; i < n; i++) {
        const q = pts[(i + 1) % n];
        g.beginPath(); g.moveTo(x, y - r * 0.1); g.lineTo(pts[i][0], pts[i][1]); g.lineTo(q[0], q[1]); g.closePath();
        g.fillStyle = rgba(col[i % 2], a * (0.55 + 0.45 * ((i % 3) / 2)));
        g.fill();
      }
      g.strokeStyle = rgba('#ffffff', 0.7 * a); g.lineWidth = Math.max(1, r * 0.03);
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
    },
    /* rotating pseudo-3D bipyramid crystal. n = sides, tall = height factor */
    gem3(g, x, y, r, col, rot = 0, a = 1, n = 6, tall = 1.25) {
      if (r <= 0) return;
      const ry = 0.3, top = [x, y - r * tall], bot = [x, y + r * tall], ring = [], faces = [];
      for (let i = 0; i < n; i++) { const an = rot + (i / n) * TAU; ring.push([x + Math.cos(an) * r * 0.9, y + Math.sin(an) * r * 0.9 * ry, an]); }
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, mid = (ring[i][2] + ring[j][2]) / 2, dep = Math.sin(mid);
        faces.push({ p: [top, ring[i], ring[j]], dep, mid, up: 1 });
        faces.push({ p: [bot, ring[j], ring[i]], dep, mid, up: 0 });
      }
      faces.sort((m, q) => m.dep - q.dep);
      for (const f of faces) {
        if (!f.up && f.dep < -0.2) continue;
        const l = 0.5 + 0.5 * Math.cos(f.mid + 0.9);
        g.beginPath(); g.moveTo(f.p[0][0], f.p[0][1]); g.lineTo(f.p[1][0], f.p[1][1]); g.lineTo(f.p[2][0], f.p[2][1]); g.closePath();
        g.fillStyle = rgba(f.up ? col[0] : col[1], a * (0.28 + 0.72 * l * (f.up ? 1 : 0.7)));
        g.fill();
        g.strokeStyle = rgba('#ffffff', 0.55 * a); g.lineWidth = Math.max(1, r * 0.025); g.stroke();
      }
    },
    /* seeded starfield covering the screen */
    stars(g, e, seed = 3, n = 90, size = 0.35) {
      const r = G.rng(seed);
      for (let i = 0; i < n; i++) {
        const x = r() * e.W, y = r() * e.H, ph = r() * 9;
        g.fillStyle = `rgba(255,255,255,${0.12 + 0.6 * ((Math.sin(e.time * 0.002 + ph) + 1) / 2)})`;
        g.fillRect(x, y, e.u * size, e.u * size);
      }
    },
    /* camera: zoom about the centre */
    zoom(g, e, z, dx = 0, dy = 0) {
      g.translate(e.cx + dx, e.cy + dy); g.scale(z, z); g.translate(-e.cx, -e.cy);
    },
    /* a real-looking lightning bolt: soft glow pass, a tapered bright core, and one or two branch forks */
    bolt(g, x0, y0, x1, y1, seed, jag, col, w, a, branches = true) {
      const r = G.rng(seed), n = 11, pts = [[x0, y0]];
      for (let i = 1; i < n; i++) { const t = i / n; pts.push([G.lerp(x0, x1, t) + (r() - 0.5) * jag * (1 - t * 0.25), G.lerp(y0, y1, t) + (r() - 0.5) * jag * 0.4]); }
      pts.push([x1, y1]);
      g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
      // soft glow underlay
      g.strokeStyle = rgba(col, a * 0.32); g.lineWidth = w * 3;
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      // tapered bright core, whiter near the source
      for (let i = 0; i < pts.length - 1; i++) {
        const t = i / (pts.length - 1);
        g.strokeStyle = rgba(t < 0.3 ? '#ffffff' : col, a * (1 - t * 0.3));
        g.lineWidth = Math.max(0.6, w * (1 - t * 0.6));
        g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke();
      }
      // one or two branch forks off the main path
      if (branches) {
        const nb = 1 + Math.floor(r() * 2), ang = Math.atan2(y1 - y0, x1 - x0);
        for (let b = 0; b < nb; b++) {
          const bi = 2 + Math.floor(r() * (pts.length - 5)), [bx, by] = pts[bi];
          const an = ang + (r() - 0.5) * 1.7, len = jag * (1.3 + r());
          g.strokeStyle = rgba(col, a * 0.55); g.lineWidth = Math.max(0.5, w * 0.32);
          g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(an) * len * 0.5, by + Math.sin(an) * len * 0.5); g.lineTo(bx + Math.cos(an) * len, by + Math.sin(an) * len); g.stroke();
        }
      }
      g.restore();
    },
    flash(g, e, a) {
      if (a <= 0) return;
      g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(0, 0, e.W, e.H);
    },
    vignette(g, e, a = 0.6) {
      const vg = g.createRadialGradient(e.cx, e.cy, e.R * 0.35, e.cx, e.cy, e.R);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${a})`);
      g.fillStyle = vg; g.fillRect(0, 0, e.W, e.H);
    },
  };

  /* ---------- registry ---------- */
  C.template = (name, fn) => { C.templates[name] = fn; };

  const DUR = [3000, 3600, 4400, 5200, 6200, 7400, 11000, 16000, 13000];

  C.register = def => {
    if (!def || !def.id || !def.odds) throw new Error('cutscene needs id and odds');
    const ti = def.tier ? G.tiers.findIndex(t => t.key === def.tier) : G.tierIndex(def.odds);
    def.tierIdx = ti < 0 ? G.tierIndex(def.odds) : ti;
    def.zones = Array.isArray(def.zone) ? def.zone : [def.zone || 0];
    def.zone = def.zones[0];
    def.rewardMul = def.rewardMul || 2;
    def.colors = def.colors || ['#c89bff', '#6d3fd1', '#0a0614'];
    def.duration = def.duration || DUR[def.tierIdx];
    def.revealAt = def.revealAt || (def.tierIdx >= G.GRAND ? 0.62 : 0.6);
    def.captions = def.captions || [];
    def.p = def.p || {};
    def.snd = G.sfx.derive(def);            // sound recipe: explicit parts + parts derived from the scene
    if (typeof def.draw !== 'function') {
      const tpl = def.template;
      def.draw = (g, e) => {
        const fn = C.templates[tpl];
        if (fn) fn(g, e, def); else G.fx.bg(g, e);
      };
    }
    const i = C.list.findIndex(c => c.id === def.id);
    if (i >= 0) C.list[i] = def; else C.list.push(def);
    C.list.sort((a, b) => a.odds - b.odds);
    C.byId = {};
    C.list.forEach(c => { C.byId[c.id] = c; });
    return def;
  };

  C.inZone = i => C.list.filter(c => c.zones.includes(i));

  /* roll once per mining action. Rarest first, at most one cutscene. Only this zone's minerals. */
  C.roll = (zone, luck, cap = 0.5) => {
    for (let i = C.list.length - 1; i >= 0; i--) {
      const c = C.list[i];
      if (!c.zones.includes(zone)) continue;
      if (Math.random() < Math.min(cap, luck / c.odds)) return c;
    }
    return null;
  };

  C.reward = def => Math.floor(def.odds * def.rewardMul * G.stats.coinMul());

  /* ---------- playback ---------- */
  C.start = (def, opt = {}) => {
    // TRANSCENDENT and above open with a short blackout (time runs negative during it)
    const pre = def.tierIdx >= 7 ? 1800 : 0;
    C.active = {
      def, reward: opt.reward || 0, first: !!opt.first, replay: !!opt.replay,
      t0: performance.now() + pre, pre, revealed: false, time: -pre, guard: 0, audioOn: pre === 0,
    };
    if (pre) G.audio.blackout(def.tierIdx);
    else G.audio.riser(def.tierIdx, (def.duration * def.revealAt) / 1000, def.snd);
    G.emit('cut:start', C.active);
  };

  /* returns true when the tap was consumed */
  C.tap = () => {
    const a = C.active;
    if (!a) return false;
    const revealMs = a.def.duration * a.def.revealAt, now = performance.now();
    if (now < a.guard) return true;
    if (a.time < 500) return true;
    if (a.time < revealMs - 200) {          // skip the build-up, jump to the reveal (never on a first sighting)
      if (a.first) return true;
      G.audio.stopCut();
      a.t0 = now - revealMs; a.time = revealMs; a.guard = now + 500;
    } else if (a.time > revealMs + 900) {
      C.end();
    }
    return true;
  };

  C.end = () => {
    const a = C.active;
    if (!a) return;
    C.active = null;
    G.audio.stopCut();
    G.emit('cut:end', a);
  };

  C.update = now => {
    const a = C.active;
    if (!a) return;
    if (a.frozen != null) a.t0 = now - a.frozen;    // debug: G.debug.seek() parks the film on one frame
    a.time = now - a.t0;
    const revealMs = a.def.duration * a.def.revealAt;
    if (!a.audioOn && a.time >= 0) { a.audioOn = true; G.audio.riser(a.def.tierIdx, revealMs / 1000, a.def.snd); }
    if (!a.revealed && a.time >= revealMs) { a.revealed = true; G.audio.reveal(a.def.tierIdx, a.def.snd); G.emit('cut:reveal', a); }
  };

  const FONT = 'system-ui,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  const MONO = 'ui-monospace,Consolas,"SF Mono",monospace';
  /* the default caption face: a bold display serif, for a dramatic "film title" feel rather than a UI font.
     A cutscene can override per-line with caption.font (any CSS font-family string). */
  const CAP_SERIF = '"Noto Serif KR","Nanum Myeongjo","Batang",Georgia,serif';

  /* a caption line rendered as a dying signal: banded jitter, flicker, and the odd full dropout.
     No colour, no translation line - just the one string, static and unstable. Deterministic on `time`.
     Auto-shrinks so it never overflows a narrow phone screen - the requested size is a ceiling, not a promise. */
  function glitchCaption(g, str, cx, y, fontPx, spacing, alpha, W, time, font) {
    const bucket = Math.floor(time / 70), rnd = G.rng(bucket * 97 + str.length * 13 + 1), maxW = W * 0.88;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${fontPx}px ${font || CAP_SERIF}`;
    let tw = g.measureText(str).width + spacing * str.length;
    if (tw > maxW) { const k = maxW / tw; fontPx *= k; spacing *= k; g.font = `800 ${fontPx}px ${font || CAP_SERIF}`; tw = maxW; }
    if ('letterSpacing' in g) g.letterSpacing = `${spacing}px`;
    if (rnd() < 0.05) {                              // brief total dropout - just noise bars where the line was
      for (let i = 0; i < 3; i++) {
        const yy = y - fontPx * 0.5 + i * (fontPx / 2) + (rnd() - 0.5) * 4;
        g.fillStyle = `rgba(255,255,255,${(0.12 + rnd() * 0.22) * alpha})`;
        g.fillRect(cx - tw / 2 - 10, yy, tw + 20, 1.2 + rnd() * 2);
      }
    } else {
      const bands = 3 + Math.floor(rnd() * 3), bh = (fontPx * 1.5) / bands;
      for (let i = 0; i < bands; i++) {
        const tear = rnd() < 0.22, jx = (rnd() - 0.5) * (tear ? 14 : 2.5);
        const a2 = alpha * (0.7 + rnd() * 0.3) * (rnd() < 0.05 ? 0.25 : 1);
        g.save();
        g.beginPath(); g.rect(cx - tw / 2 - 20, y - fontPx * 0.75 + i * bh, tw + 40, bh + 0.6); g.clip();
        g.globalAlpha = a2; g.fillStyle = '#eef1f8';
        g.fillText(str, cx + jx, y);
        g.restore();
      }
      if (rnd() < 0.18) { g.globalAlpha = alpha * 0.45 * rnd(); g.fillStyle = '#fff'; g.fillRect(cx - tw / 2 - 10, y + (rnd() - 0.5) * fontPx, tw + 20, 1); }
    }
    g.globalAlpha = 1; if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  /* the "간지" version: one glyph per line, stacked top-to-bottom, dead centre of the frame, huge and glowing -
     the classic vertical title-card look. Meant for a short punchy phrase (2-5 characters / Hanja work great). */
  function glitchCaptionVertical(g, str, cx, cy, fontPx, alpha, time, col, font, W, H) {
    const chars = [...str], bucket = Math.floor(time / 90), rnd = G.rng(bucket * 131 + str.length * 7 + 3);
    // never let the column run off-screen: shrink to fit the available height, then clamp x inside the margins
    const maxH = H * 0.62;
    let lh = fontPx * 1.18, totalH = lh * (chars.length - 1);
    if (totalH + fontPx * 1.4 > maxH) { const k = maxH / (totalH + fontPx * 1.4); fontPx *= k; lh = fontPx * 1.18; totalH = lh * (chars.length - 1); }
    cx = clamp(cx, fontPx * 1.1, W - fontPx * 1.1);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${fontPx}px ${font || CAP_SERIF}`;
    const y0 = clamp(cy - totalH / 2, H * 0.12, H - H * 0.12 - totalH);
    // a soft dark backing plate, so this reads against ANY background (bright reveal flashes included)
    g.save(); g.globalAlpha = alpha * 0.55;
    const bw = fontPx * 1.9, bh = totalH + fontPx * 1.9, bg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(bw, bh) * 0.62);
    bg.addColorStop(0, 'rgba(4,3,10,0.85)'); bg.addColorStop(0.7, 'rgba(4,3,10,0.55)'); bg.addColorStop(1, 'rgba(4,3,10,0)');
    g.fillStyle = bg; g.beginPath(); g.ellipse(cx, cy, bw * 0.62, bh * 0.56, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    chars.forEach((ch, i) => {
      const y = y0 + i * lh, drop = rnd() < 0.04, jx = drop ? 0 : (rnd() - 0.5) * 2.5;
      const a2 = alpha * (0.8 + rnd() * 0.2) * (drop ? 0.15 : 1);
      g.save(); g.shadowColor = rgba(col || '#ffffff', 0.6 * a2); g.shadowBlur = fontPx * 0.35;
      g.globalAlpha = a2; g.fillStyle = '#f4f1ff';
      g.fillText(ch, cx + jx, y);
      g.restore();
    });
    // a thin rule above and below, like a title card
    g.save(); g.globalAlpha = alpha * 0.6; g.strokeStyle = rgba(col || '#ffffff', 0.7); g.lineWidth = Math.max(1, fontPx * 0.03);
    g.beginPath(); g.moveTo(cx - fontPx * 0.22, y0 - lh * 0.62); g.lineTo(cx + fontPx * 0.22, y0 - lh * 0.62); g.stroke();
    g.beginPath(); g.moveTo(cx - fontPx * 0.22, y0 + totalH + lh * 0.62); g.lineTo(cx + fontPx * 0.22, y0 + totalH + lh * 0.62); g.stroke();
    g.restore(); g.globalAlpha = 1;
  }

  /* horizontal-caption entrance styles - a cutscene picks one per line with caption.style, so the
     10억대+ tier doesn't all read the same way. 'fade' (default) is the original soft scale-in.
     'fly' sends the line in from an edge (caption.from: left/right/top/bottom, or a deterministic
     pick from the text itself) with a bouncy overshoot, and drifts back out the same way at the end
     - "떠다니다가 사라지는" feel, good for wind/light/airy minerals.
     'engrave' reveals the line through a widening clip mask from the centre out, with a scatter of
     chisel-dust at the growing edges - a "carved into the stone/metal" feel, good for
     forge/pressure/crystal minerals. */
  const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  function drawCaptionLine(g, c, txt, py, k, W, H, time, tierColor, s) {
    const fontPx = Math.min((c.size || 24) * s, W * 0.07), spacing = 3.5 * s, style = c.style || 'fade';
    if (style === 'fly') {
      const dirs = ['left', 'right', 'top', 'bottom'], dir = c.from || dirs[hashStr(txt) % 4];
      const ease = E.outBack(clamp(k, 0, 1)), dist = (1 - ease) * (dir === 'left' || dir === 'right' ? W * 0.42 : H * 0.3);
      let ox = 0, oy = 0;
      if (dir === 'left') ox = -dist; else if (dir === 'right') ox = dist; else if (dir === 'top') oy = -dist; else oy = dist;
      g.save(); g.translate(ox, oy);
      glitchCaption(g, txt, W / 2, py, fontPx, spacing, k, W, time, c.font);
      g.restore();
    } else if (style === 'engrave') {
      g.save(); g.textAlign = 'center'; g.font = `800 ${fontPx}px ${c.font || CAP_SERIF}`;
      const tw = g.measureText(txt).width + spacing * txt.length, revW = Math.max(2, tw * clamp(k * 1.35));
      g.beginPath(); g.rect(W / 2 - revW / 2 - 6, py - fontPx * 0.9, revW + 12, fontPx * 1.8); g.clip();
      glitchCaption(g, txt, W / 2, py, fontPx, spacing, Math.min(1, k * 1.7), W, time, c.font);
      g.restore();
      if (k > 0.02 && k < 0.97) {
        const r = G.rng(Math.floor(time / 60) * 977 + txt.length);
        [W / 2 - revW / 2, W / 2 + revW / 2].forEach(ex => {
          for (let i = 0; i < 3; i++) {
            g.fillStyle = rgba(tierColor, 0.5 * r());
            g.fillRect(ex + (r() - 0.5) * 8, py + (r() - 0.5) * fontPx, 1.5, 1.5 + r() * 2.5);
          }
        });
      }
    } else if (style === 'type') {
      // clean typewriter reveal - no jitter/dropout, characters appear in sequence with a blinking cursor
      g.save(); g.font = `800 ${fontPx}px ${c.font || CAP_SERIF}`; g.textAlign = 'left'; g.textBaseline = 'middle';
      let full = g.measureText(txt).width + spacing * (txt.length - 1), fpx = fontPx, sp = spacing;
      if (full > W * 0.88) { const kk = (W * 0.88) / full; fpx *= kk; sp *= kk; g.font = `800 ${fpx}px ${c.font || CAP_SERIF}`; full = W * 0.88; }
      const nShow = Math.round(txt.length * clamp(k * 1.08));
      g.globalAlpha = Math.min(1, k * 4);
      g.shadowColor = rgba(tierColor, 0.6); g.shadowBlur = fpx * 0.3;
      g.fillStyle = '#eef1f8';
      let x = W / 2 - full / 2;
      for (let i = 0; i < nShow; i++) { const ch = txt[i]; g.fillText(ch, x, py); x += g.measureText(ch).width + sp; }
      if (nShow < txt.length && Math.floor(time / 380) % 2 === 0) { g.fillStyle = rgba(tierColor, 0.9); g.fillRect(x, py - fpx * 0.5, Math.max(2, fpx * 0.09), fpx); }
      g.restore();
    } else {
      g.save(); g.translate(W / 2, py); g.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); g.translate(-W / 2, -py);
      glitchCaption(g, txt, W / 2, py, fontPx, spacing, k, W, time, c.font);
      g.restore();
    }
  }

  C.draw = (g, W, H) => {
    const a = C.active;
    if (!a) return;
    const d = a.def, tier = G.tiers[d.tierIdx], grand = d.tierIdx >= G.GRAND;
    const s = Math.min(W, 520) / 390;
    const e = {
      W, H, cx: W / 2, cy: H * (grand ? 0.42 : 0.46), u: Math.min(W, H) / 100, R: Math.hypot(W, H) / 2,
      time: a.time, p: clamp(a.time / d.duration), col: d.colors, tier, def: d,
    };
    const spc = v => { if ('letterSpacing' in g) g.letterSpacing = v; };

    // blackout before the film (TRANSCENDENT+): the world goes dark, a beat of nothing, then the scene fades up
    if (d.tierIdx >= 7) {
      g.fillStyle = '#000';
      if (a.time < 0) { g.globalAlpha = E.outCubic(seg(a.time + a.pre, 0, 500)); g.fillRect(0, 0, W, H); g.globalAlpha = 1; return; }
      g.fillRect(0, 0, W, H);
    }

    // scene (fades in over the game)
    g.save();
    g.globalAlpha = E.outCubic(seg(a.time, 0, grand ? 900 : 450));
    g.beginPath(); g.rect(0, 0, W, H); g.clip();
    d.draw(g, e);
    g.restore();

    // reveal flash
    const revealMs = d.duration * d.revealAt, rt = a.time - revealMs;
    const fl = grand ? 1100 : 700;
    if (rt > 0 && rt < fl) { g.fillStyle = `rgba(255,255,255,${(grand ? 0.7 : 0.55) * (1 - rt / fl)})`; g.fillRect(0, 0, W, H); }

    // letterbox
    const bar = H * (grand ? 0.12 : 0.085) * E.outCubic(seg(a.time, 0, 800));
    g.fillStyle = '#000'; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar);
    g.fillStyle = rgba(tier.color, 0.7);
    g.fillRect(0, bar, W * E.outCubic(seg(a.time, 100, 1000)), 1);
    g.fillRect(W - W * E.outCubic(seg(a.time, 100, 1000)), H - bar - 1, W, 1);

    // captions: original-language line only, no tier colour - a flickering, jittering, dropout-glitchy signal.
    // big and legible by default; v:true swaps in a huge vertical title-card treatment; pos:'top'|'center'|'bottom'
    // moves a horizontal line off the letterbox bar (default 'bottom'), each with its own soft scale-in entrance -
    // not every line has to sit at the bottom, Sol's-RNG-style reveal text drifts around the frame.
    for (const c of d.captions) {
      const t0 = c.a * d.duration, t1 = c.b * d.duration, t = a.time;
      const txt = c.en || c.ko; if (!txt) continue;
      if (t < t0 || t > t1) continue;
      const k = Math.min(E.outCubic(seg(t, t0, t0 + 500)), 1 - E.inQuad(seg(t, t1 - 450, t1)));
      if (c.v) {
        glitchCaptionVertical(g, txt, c.x != null ? W * c.x : W * (grand ? 0.82 : 0.86), H * (c.y != null ? c.y : 0.42), Math.min((c.size || 34) * s, W * 0.11), k, a.time, tier.color, c.font, W, H);
      } else {
        const py = c.pos === 'top' ? H * 0.22 : c.pos === 'center' ? H * (c.y != null ? c.y : 0.5) : H - bar * 0.5;
        drawCaptionLine(g, c, txt, py, k, W, H, a.time, tier.color, s);
      }
    }

    // reveal text
    if (rt > 0) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const y0 = grand ? H * 0.6 : H * 0.7;
      const back = g.createLinearGradient(0, y0 - 90 * s, 0, H);
      back.addColorStop(0, 'rgba(0,0,0,0)'); back.addColorStop(0.35, 'rgba(0,0,0,.72)'); back.addColorStop(1, 'rgba(0,0,0,.85)');
      g.fillStyle = back; g.globalAlpha = E.outCubic(seg(rt, 0, 500));
      g.fillRect(0, y0 - 90 * s, W, H - (y0 - 90 * s));
      g.globalAlpha = 1;

      let k = E.outCubic(seg(rt, 0, 400));
      g.globalAlpha = k; g.fillStyle = tier.color; g.font = `700 ${12 * s}px ${FONT}`; spc(`${(grand ? 8 : 4) * s}px`);
      g.fillText(`${tier.en}  /  ${tier.ko}`, W / 2, y0);
      if (grand) {   // flanking lines
        const L = E.outCubic(seg(rt, 100, 1100)) * W * 0.28;
        g.fillStyle = rgba(tier.color, 0.8); g.globalAlpha = 1;
        g.fillRect(W / 2 - 130 * s - L, y0, L, 1); g.fillRect(W / 2 + 130 * s, y0, L, 1);
      }
      // name
      k = E.outCubic(seg(rt, 120, grand ? 1400 : 720)); g.globalAlpha = k;
      g.fillStyle = '#fff';
      let fs = grand ? 40 * s : Math.min(32 * s, W * 0.1);
      const sp = grand ? (6 + (1 - k) * 26) * s : 2 * s;
      g.font = `${grand ? 800 : 800} ${fs}px ${FONT}`; spc(`${sp}px`);
      const label = grand ? d.name.toUpperCase() : d.name, mw = g.measureText(label).width;
      if (mw > W * 0.9) { const f = (W * 0.9) / mw; fs *= f; g.font = `800 ${fs}px ${FONT}`; spc(`${sp * f}px`); }
      if (grand) { g.shadowColor = rgba(tier.color, 0.7); g.shadowBlur = 24; }
      g.fillText(label, W / 2, y0 + (grand ? 44 : 36) * s + (1 - k) * 10);
      g.shadowBlur = 0;
      // odds
      k = E.outCubic(seg(rt, 300, 900)); g.globalAlpha = k;
      g.fillStyle = tier.color; g.font = `700 ${18 * s}px ${MONO}`; spc('0px');
      g.fillText(d.special ? `SPECIAL  ·  ${d.eventName} 한정` : `1 in ${G.fmtInt(d.odds)}`, W / 2, y0 + (grand ? 86 : 72) * s);
      // reward
      if (!a.replay) {
        k = E.outCubic(seg(rt, 500, 900)); g.globalAlpha = k;
        const count = a.reward * E.outExpo(seg(rt, 500, grand ? 3400 : 2400));
        const txt = '+ ' + (a.reward < 1e12 ? G.fmtInt(count) : G.fmt(count));
        let f2 = 34 * s; g.font = `800 ${f2}px ${MONO}`;
        const m2 = g.measureText(txt).width;
        if (m2 > W * 0.9) { f2 *= (W * 0.9) / m2; g.font = `800 ${f2}px ${MONO}`; }
        g.fillStyle = '#ffd766'; g.shadowColor = 'rgba(255,200,60,.6)'; g.shadowBlur = 16;
        g.fillText(txt, W / 2, y0 + (grand ? 128 : 112) * s);
        g.shadowBlur = 0;
        if (a.first) {
          g.fillStyle = '#fff'; g.font = `700 ${11 * s}px ${FONT}`; spc(`${3 * s}px`);
          g.globalAlpha = k * (0.6 + 0.4 * Math.sin(a.time / 180));
          g.fillText('NEW  /  도감에 기록되었습니다', W / 2, y0 + (grand ? 160 : 142) * s);
        }
      }
      // tap hint
      if (a.time > revealMs + 900) {
        g.globalAlpha = 0.45 + 0.45 * Math.sin(a.time / 260);
        g.fillStyle = '#fff'; g.font = `600 ${11 * s}px ${FONT}`; spc(`${4 * s}px`);
        g.fillText('TAP', W / 2, H - bar - 20 * s);
      }
      g.globalAlpha = 1; spc('0px');
    } else if (a.time > 700 && a.time < revealMs - 200 && !a.first) {
      // "tap to skip ahead" hint
      g.globalAlpha = 0.28; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillStyle = '#fff'; g.font = `600 ${9 * s}px ${MONO}`; spc(`${3 * s}px`);
      g.fillText('TAP TO SKIP', W - 14 * s, bar + 16 * s);
      g.globalAlpha = 1; spc('0px');
    }
  };
})();
