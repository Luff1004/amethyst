/* AMETHYST - boss fights. A boss weather (js/data/weather.js `boss`) brings one of two bosses,
   each with its own way to fight it:
     크롤러 (모래폭풍)     - the crystal splits into three lanes; notes fall from its jaws, rhythm-game style
     보이드 워처 (공허 폭풍) - rings close in on targets; hit each one as its ring meets it
   Drawn into the main canvas by js/game.js (instead of the crystal) and fed taps from it. Beat one and
   its mineral (js/cutscenes/weather-cuts.js) plays as a real find. A clean run takes about 3-4 minutes; the clock is 4.5-5. */
(() => {
  const TAU = Math.PI * 2, clamp = G.clamp, lerp = G.lerp, rng = G.rng;
  const E = G.E;
  const fr = v => v - Math.floor(v);

  const BOSSES = {
    crawler: { id: 'crawler', name: '크롤러', en: 'THE CRAWLER', color: '#f0b04a', hp: 2400, time: 300, cut: 'boss_crawler',
      how: '1페이즈: 크리스탈이 세 갈래로 갈라집니다 - 모래 결정이 판정선에 닿는 순간 그 줄을 누르세요. 2페이즈: 모래 속에서 솟는 약점을 부수고 꼬리를 피하세요. 3페이즈: 날아오는 바위를 부수고, 눈이 열리면 눈을 노리세요.', keys: '1페이즈 키보드: A S D / J K L / ← ↓ →' },
    watcher: { id: 'watcher', name: '보이드 워처', en: 'VOID WATCHER', color: '#c05aff', hp: 2400, time: 270, cut: 'boss_watcher',
      how: '공허의 고리가 목표에 닿는 순간 목표를 누르세요. 너무 늦거나 놓치면 콤보가 끊깁니다.', keys: '마우스 / 터치' },
  };

  let B = null;                         // the fight in progress
  const now = () => performance.now();
  const T = () => (B ? now() - B.t0 - B.paused : 0);          // fight clock (ms), paused while hidden
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!B) return;
    if (document.hidden) hiddenAt = now(); else if (hiddenAt) { B.paused += now() - hiddenAt; hiddenAt = 0; }
  });

  /* ---------------- shared bits ---------------- */
  function glow(g, x, y, r, rgb, a) { if (r <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function gem(g, x, y, r, hue, lit, t) {
    const pts = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i / 6 * TAU; pts.push([x + Math.cos(a) * r * (i % 3 === 0 ? 1.15 : 0.9), y + Math.sin(a) * r]); }
    glow(g, x, y, r * (2 + lit * 1.5), `${hue === 'amethyst' ? '190,120,255' : hue}`, 0.25 + lit * 0.5);
    for (let i = 0; i < 6; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 6], lt = 45 + 25 * Math.cos(i + t * 0.002) + lit * 25;
      g.fillStyle = `hsl(275,80%,${Math.min(92, lt)}%)`; g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
    }
    g.strokeStyle = `rgba(255,255,255,${0.5 + lit * 0.5})`; g.lineWidth = 1.5; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.stroke();
  }
  function popText(txt, x, y, col, size = 22) { B.pops.push({ txt, x, y, col, size, t: now() }); }
  function hurt(n, x, y) {
    const bonus = Math.min(3, Math.floor(B.combo / 20));
    const dmg = n + bonus;
    B.hp = Math.max(0, B.hp - dmg); B.dealt += dmg; B.flash = now();
    B.combo++; B.maxCombo = Math.max(B.maxCombo, B.combo);
    for (let i = 0; i < 10; i++) B.sparks.push({ x, y, vx: (Math.random() - 0.5) * 520, vy: (Math.random() - 0.8) * 520, t: now(), col: B.def.color });
    const ph = Math.max(B.phase, B.hp / B.max > 0.66 ? 1 : B.hp / B.max > 0.33 ? 2 : 3);   // heals never undo a phase
    if (ph !== B.phase) {
      B.phase = ph; B.roar = now(); B.phaseAt = now(); G.audio.blast(6); G.game.shake(1); G.buzz && G.buzz([80, 40, 120]);
      popText(ph === 2 ? 'PHASE 2' : 'FINAL PHASE', B.W / 2, B.H * 0.5, '#ff4a4a', 34);
      if (B.kind.onPhase) B.kind.onPhase(ph);
    }
    if (B.hp <= 0) win();
  }
  function judge(dt) { const a = Math.abs(dt); return a <= B.win[0] ? 'perfect' : a <= B.win[1] ? 'good' : null; }
  function missed(x, y) {
    B.combo = 0; B.miss++; B.missAt = now();
    popText('MISS', x, y, '#ff5a6a', 20); G.game.shake(0.5);
  }
  // the boss recovers a little (tail sweep caught you, a boulder landed)
  function heal(frac, x, y, why) {
    B.hp = Math.min(B.max, B.hp + B.max * frac); B.combo = 0; B.miss++; B.burned = now();
    popText(why, x, y, '#ff4a3a', 20); G.audio.deny(); G.game.shake(0.9); G.buzz && G.buzz([60, 30, 60]);
  }
  // phase banner: what just changed and how to fight it now
  function phaseBanner(g, W, H, lines) {
    const k = (now() - (B.phaseAt || 0)) / 3200;
    if (!B.phaseAt || k < 0 || k > 1) return;
    const a = Math.min(1, k * 6, (1 - k) * 4);
    g.save(); g.globalAlpha = a; g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, H * 0.555, W, 62);
    g.fillStyle = B.def.color; g.font = '900 20px system-ui,"Malgun Gothic",sans-serif'; g.fillText(lines[0], W / 2, H * 0.555 + 26);
    g.fillStyle = '#f2e8d8'; g.font = '700 12.5px system-ui,"Malgun Gothic",sans-serif'; g.fillText(lines[1], W / 2, H * 0.555 + 48);
    g.restore();
  }
  function hitFx(kind, x, y) {
    if (kind === 'perfect') { B.perfect++; popText('PERFECT', x, y, '#fff2a0', 20); G.audio.crit && G.audio.crit(); }
    else { B.good++; popText('GOOD', x, y, '#9adfff', 18); G.audio.coin(Math.min(10, B.combo % 11), false, 'glass'); }
    G.buzz && G.buzz(10);
  }

  // a steady beat under every fight, so the rhythm is felt not just seen
  function beat(i) {
    if (!G.audio.tone) return;
    const bar = i % 4;
    G.audio.tone({ f: bar === 0 ? 72 : 62, f2: 36, type: 'sine', d: 0.28, v: bar === 0 ? 0.55 : 0.35 });
    if (B.phase >= 2) G.audio.noise({ d: 0.05, v: 0.05, f: 8000, q: 0.6 });
    if (B.phase >= 3 && bar % 2 === 1) G.audio.noise({ d: 0.12, v: 0.08, f: 1800, q: 0.8 });
  }

  /* ================= CRAWLER - three-lane rhythm ================= */
  const Crawler = {
    init() { B.notes = []; B.nextBar = 1500; B.laneHit = [0, 0, 0]; B.win = [85, 160]; B.lastLane = 1; B.seed = 1; },
    bpm: () => [0, 100, 120, 140][B.phase],
    travel: () => [0, 1500, 1300, 1100][B.phase],
    lanes() { const gap = Math.min(B.W * 0.26, 150); return [B.W / 2 - gap, B.W / 2, B.W / 2 + gap]; },
    hitY: () => B.H * 0.8,
    // write the next bar of notes, choosing a pattern for the phase
    schedule() {
      const t = T(), ahead = t + 4000;
      while (B.nextBar < ahead) {
        const beatMs = 60000 / this.bpm(), r = rng(B.seed++ * 7919);
        const pool = B.phase === 1 ? ['single', 'single', 'stair', 'double', 'rest'] : B.phase === 2 ? ['single', 'stair', 'double', 'stream', 'zig'] : ['stream', 'triple', 'double', 'zig', 'stair', 'burst'];
        const pat = pool[Math.floor(r() * pool.length)], at = B.nextBar;
        const add = (i, lane) => B.notes.push({ lane, hit: at + i * beatMs, done: false });
        const any = () => { let l; do { l = Math.floor(r() * 3); } while (l === B.lastLane && r() < 0.6); B.lastLane = l; return l; };
        if (pat === 'single') for (let i = 0; i < 4; i++) add(i, any());
        else if (pat === 'stair') { const up = r() < 0.5; [0, 1, 2, 1].forEach((l, i) => add(i, up ? l : 2 - l)); }
        else if (pat === 'double') for (let i = 0; i < 4; i += 1) { if (i % 2 === 0) { const a = any(); add(i, a); add(i, (a + 1 + Math.floor(r() * 2)) % 3); } else add(i, any()); }
        else if (pat === 'stream') for (let i = 0; i < 8; i++) add(i / 2, i % 2 ? any() : [0, 2][Math.floor(r() * 2)]);
        else if (pat === 'zig') for (let i = 0; i < 8; i++) add(i / 2, [0, 2, 1, 2, 0, 1, 0, 2][i]);
        else if (pat === 'triple') { add(0, 0); add(0, 1); add(0, 2); add(2, any()); add(3, any()); }
        else if (pat === 'burst') { for (let i = 0; i < 6; i++) add(i / 3, [0, 1, 2, 2, 1, 0][i]); add(3, 1); }
        B.nextBar += beatMs * 4;
      }
    },
    update() {
      if (B.phase === 2) return this.update2();
      if (B.phase === 3) return this.update3();
      this.schedule();
      const t = T(), lanes = this.lanes();
      for (const n of B.notes) if (!n.done && t > n.hit + B.win[1]) { n.done = true; missed(lanes[n.lane], this.hitY() - 30); B.bite = now(); }
      B.notes = B.notes.filter(n => !n.done || t < n.hit + 400);
      const beatMs = 60000 / this.bpm(), bi = Math.floor(t / beatMs);
      if (bi !== B.lastBeat) { B.lastBeat = bi; beat(bi); B.pulse = now(); }
    },
    press(lane) {
      const t = T(), lanes = this.lanes(); B.laneHit[lane] = now();
      let best = null;
      for (const n of B.notes) if (!n.done && n.lane === lane && Math.abs(t - n.hit) <= B.win[1] && (!best || Math.abs(t - n.hit) < Math.abs(t - best.hit))) best = n;
      if (!best) return;
      const j = judge(t - best.hit); best.done = true; best.hitAt = now();
      hitFx(j, lanes[lane], this.hitY() - 40); hurt(j === 'perfect' ? 3 : 2, lanes[lane], this.hitY());
    },
    tap(x, y) {
      if (B.phase === 2) return this.tap2(x, y);
      if (B.phase === 3) return this.tap3(x, y);
      if (y < B.H * 0.42) return;
      const lanes = this.lanes(), gap = lanes[1] - lanes[0];
      let best = 0; lanes.forEach((lx, i) => { if (Math.abs(x - lx) < Math.abs(x - lanes[best])) best = i; });
      if (Math.abs(x - lanes[best]) < gap * 0.75) this.press(best);
    },
    key(k) { if (B.phase !== 1) return false; const map ={ a: 0, s: 1, d: 2, j: 0, k: 1, l: 2, arrowleft: 0, arrowdown: 1, arrowright: 2, '1': 0, '2': 1, '3': 2 }; if (k in map) { this.press(map[k]); return true; } return false; },
    // --- the creature ---
    drawBoss(g, W, H, t, dead) {
      const hx = W / 2, hy = H * 0.27, s = Math.min(W, H) / 700, hurtK = clamp(1 - (now() - B.flash) / 160), roar = clamp(1 - (now() - (B.roar || 0)) / 1400);
      const bite = clamp(1 - (now() - (B.bite || 0)) / 300), beatK = clamp(1 - (now() - (B.pulse || 0)) / 180);
      const N = 40;
      // body: a long armoured chain arching behind the head, dragged through the sand
      const seg = i => {
        // rears up behind the head and snakes out to both sides, swaying, the tail sinking into the dunes
        const u = i / N, sway = Math.sin(u * 4.4 - t * 0.0018) * (20 + u * 330) * s * (1 + roar * 0.3);
        const lift = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * 150 * s - Math.max(0, u - 0.6) * 380 * s;
        const dx = dead ? (i % 2 ? -1 : 1) * dead * 60 * s * (1 + u) : 0, dy = dead ? dead * dead * 900 * s * (0.3 + u) : 0;
        return [hx + sway + dx, hy + 10 * s - lift + dy, (46 - u * 26) * s];
      };
      g.save();
      if (dead) g.globalAlpha = clamp(1 - dead * 0.9);
      for (let i = N - 1; i >= 0; i--) {
        const [x, y, r] = seg(i), [nx, ny] = seg(Math.max(0, i - 1)), a = Math.atan2(ny - y, nx - x);
        // legs
        g.strokeStyle = '#2a1a0a'; g.lineWidth = 3 * s; g.lineCap = 'round';
        for (const sd of [-1, 1]) {
          const ph = Math.sin(t * 0.012 + i * 1.3) * 0.5;
          const k1x = x + Math.cos(a + sd * (1.4 + ph)) * r * 1.3, k1y = y + Math.sin(a + sd * (1.4 + ph)) * r * 1.3;
          g.beginPath(); g.moveTo(x, y); g.lineTo(k1x, k1y); g.lineTo(k1x + Math.cos(a + sd * 2.4) * r * 0.8, k1y + r * 0.9); g.stroke();
        }
        // armour plate
        g.save(); g.translate(x, y); g.rotate(a);
        const pg = g.createLinearGradient(0, -r, 0, r);
        pg.addColorStop(0, hurtK > 0 ? `rgb(${lerp(232, 255, hurtK)},${lerp(176, 255, hurtK)},${lerp(96, 255, hurtK)})` : '#e8b060'); pg.addColorStop(0.35, '#8a5a24'); pg.addColorStop(1, '#2a1606');
        g.fillStyle = pg; g.beginPath(); g.ellipse(0, 0, r * 0.95, r, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,220,150,.35)'; g.lineWidth = 2 * s; g.beginPath(); g.ellipse(0, 0, r * 0.95, r, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        g.fillStyle = '#3a2410';
        for (const sp of [-0.45, 0, 0.45]) { g.beginPath(); g.moveTo(sp * r - 5 * s, -r * 0.85); g.lineTo(sp * r, -r * 1.35); g.lineTo(sp * r + 5 * s, -r * 0.85); g.fill(); }
        g.restore();
      }
      // head
      const recoil = hurtK * 14 * s - roar * 10 * s, headY = hy + recoil + (dead ? dead * dead * 700 * s : 0) + Math.sin(t * 0.004) * 4 * s;
      const open = Math.max(beatK * 0.35, bite * 0.8, roar, 0.12);
      g.save(); g.translate(hx, headY);
      glow(g, 0, 20 * s, 180 * s, '255,140,40', 0.18 + roar * 0.4);
      // mandibles
      for (const sd of [-1, 1]) {
        g.save(); g.scale(sd, 1); g.rotate(-0.25 - open * 0.55);
        const mg = g.createLinearGradient(0, 0, 90 * s, 90 * s); mg.addColorStop(0, '#6a4418'); mg.addColorStop(1, '#1a0e04');
        g.fillStyle = mg; g.beginPath(); g.moveTo(22 * s, 20 * s);
        g.quadraticCurveTo(95 * s, 40 * s, 70 * s, 120 * s); g.quadraticCurveTo(60 * s, 80 * s, 16 * s, 46 * s); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,200,120,.4)'; g.lineWidth = 2 * s; g.stroke();
        g.fillStyle = '#f0e0c0'; for (let k = 0; k < 4; k++) { const px = 40 * s + k * 7 * s, py = 48 * s + k * 16 * s; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 9 * s, py + 3 * s); g.lineTo(px, py + 7 * s); g.fill(); }
        g.restore();
      }
      // skull plate
      const hg = g.createRadialGradient(-20 * s, -30 * s, 10 * s, 0, 0, 90 * s);
      hg.addColorStop(0, hurtK > 0 ? '#fff' : '#f0c070'); hg.addColorStop(0.5, '#8a5a22'); hg.addColorStop(1, '#241206');
      g.fillStyle = hg; g.beginPath(); g.moveTo(-78 * s, 10 * s); g.quadraticCurveTo(-80 * s, -70 * s, 0, -84 * s); g.quadraticCurveTo(80 * s, -70 * s, 78 * s, 10 * s); g.quadraticCurveTo(40 * s, 52 * s, 0, 56 * s); g.quadraticCurveTo(-40 * s, 52 * s, -78 * s, 10 * s); g.fill();
      g.strokeStyle = 'rgba(40,20,5,.8)'; g.lineWidth = 3 * s;
      g.beginPath(); g.moveTo(0, -84 * s); g.lineTo(0, 40 * s); g.moveTo(-60 * s, -40 * s); g.quadraticCurveTo(0, -20 * s, 60 * s, -40 * s); g.stroke();
      // horns
      g.fillStyle = '#2a1606';
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 50 * s, -60 * s); g.quadraticCurveTo(sd * 110 * s, -120 * s, sd * 96 * s, -160 * s); g.quadraticCurveTo(sd * 80 * s, -110 * s, sd * 30 * s, -72 * s); g.fill(); }
      // four eyes
      const eyeCol = roar > 0.1 || B.phase === 3 ? '255,60,40' : '255,170,50';
      // in the frenzy its eyes are armoured shut most of the time - open, they're the weak spot
      const shut = B.phase === 3 && !dead && !(T() < (B.eyesUntil || 0)), inv = B.baseInv, M = inv ? inv.multiply(g.getTransform()) : null;
      B.eyeScr = [];
      [[-38, -18, 13], [38, -18, 13], [-22, 8, 8], [22, 8, 8]].forEach(([ex, ey, er], i) => {
        if (M) { const q = M.transformPoint(new DOMPoint(ex * s, ey * s)); B.eyeScr.push([q.x, q.y, er * s * Math.hypot(M.a, M.b)]); }
        if (shut) {
          g.fillStyle = '#3a2008'; g.beginPath(); g.ellipse(ex * s, ey * s, er * 1.1 * s, er * 0.75 * s, 0, 0, TAU); g.fill();
          g.strokeStyle = `rgba(${eyeCol},.8)`; g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo((ex - er) * s, ey * s); g.lineTo((ex + er) * s, ey * s); g.stroke();
          return;
        }
        const hitK = clamp(1 - (now() - ((B.eyeHit || [])[i] || 0)) / 200);
        glow(g, ex * s, ey * s, er * (3.2 + (B.phase === 3 ? 1.5 : 0)) * s, eyeCol, 0.7 + hitK * 0.3);
        g.fillStyle = hitK > 0 ? '#fff' : `rgb(${eyeCol})`; g.beginPath(); g.ellipse(ex * s, ey * s, er * s, er * 0.7 * s, 0, 0, TAU); g.fill();
        g.fillStyle = '#1a0500'; g.beginPath(); g.ellipse(ex * s, ey * s, er * 0.25 * s, er * 0.62 * s, 0, 0, TAU); g.fill();
      });
      if (M) { const q = M.transformPoint(new DOMPoint(0, 70 * s)); B.mouthScr = [q.x, q.y]; }
      g.restore();
      // sand pouring off it
      g.fillStyle = 'rgba(230,190,120,.5)';
      for (let i = 0; i < 40; i++) { const k = fr(t * 0.0009 + i * 0.37), x = hx + (fr(i * 0.618) - 0.5) * 300 * s; g.fillRect(x, headY + 40 * s + k * 200 * s, 2, 2); }
      g.restore();
      return { mouthX: hx, mouthY: headY + 60 * s };
    },
    drawArena(g, W, H, t) {
      const lanes = this.lanes(), hy = this.hitY(), top = H * 0.36, beatK = clamp(1 - (now() - (B.pulse || 0)) / 200);
      // lanes of glowing sand
      lanes.forEach((x, i) => {
        const hk = clamp(1 - (now() - B.laneHit[i]) / 160);
        const lg = g.createLinearGradient(0, top, 0, hy + 60);
        lg.addColorStop(0, 'rgba(240,180,80,0)'); lg.addColorStop(1, `rgba(240,180,80,${0.12 + hk * 0.3})`);
        g.fillStyle = lg; g.fillRect(x - 38, top, 76, hy + 60 - top);
        g.strokeStyle = `rgba(255,210,140,${0.25 + beatK * 0.2})`; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x - 38, top); g.lineTo(x - 38, H); g.moveTo(x + 38, top); g.lineTo(x + 38, H); g.stroke();
      });
      // judgement line
      g.fillStyle = `rgba(255,230,170,${0.5 + beatK * 0.4})`; g.fillRect(lanes[0] - 60, hy - 1.5, lanes[2] - lanes[0] + 120, 3);
      // the crystal, split three ways - the lane buttons
      lanes.forEach((x, i) => gem(g, x, hy, 24 + clamp(1 - (now() - B.laneHit[i]) / 140) * 8, 'amethyst', clamp(1 - (now() - B.laneHit[i]) / 200), t));
      // key hints on PC
      if (B.W > 700) { g.fillStyle = 'rgba(255,230,190,.4)'; g.font = '700 11px ui-monospace,monospace'; g.textAlign = 'center'; ['A / J / ←', 'S / K / ↓', 'D / L / →'].forEach((k, i) => g.fillText(k, lanes[i], hy + 46)); }
    },
    drawNotes(g, W, H, t, mouth) {
      const lanes = this.lanes(), hy = this.hitY(), tr = this.travel(), ft = T();
      for (const n of B.notes) {
        if (n.done && !n.hitAt) continue;
        const k = 1 - (n.hit - ft) / tr;
        if (k < 0) continue;
        if (n.hitAt) { const q = (now() - n.hitAt) / 260; if (q > 1) continue; g.strokeStyle = `rgba(255,240,180,${1 - q})`; g.lineWidth = 3; g.beginPath(); g.arc(lanes[n.lane], hy, 24 + q * 40, 0, TAU); g.stroke(); continue; }
        // spat out of the jaws, arcing into its lane
        const x = lerp(mouth.mouthX, lanes[n.lane], E.outCubic(clamp(k * 1.6))), y = lerp(mouth.mouthY, hy, k);
        const r = lerp(6, 17, clamp(k * 1.5));
        glow(g, x, y, r * 2.8, '255,190,90', 0.5);
        g.save(); g.translate(x, y); g.rotate(t * 0.004 + n.lane);
        g.fillStyle = '#ffe2a8'; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, 0); g.lineTo(0, r); g.lineTo(-r * 0.8, 0); g.closePath(); g.fill();
        g.fillStyle = '#c07a2a'; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, 0); g.lineTo(0, 0); g.fill();
        g.restore();
      }
    },
    /* ---------- phase 2 · 잠행: it dives; armoured segments break the sand, weak scales exposed; a tail sweeps the field ---------- */
    /* ---------- phase 3 · 광란: it rears up huge, spitting boulders at the screen; when its four eyes open, go for them ---------- */
    onPhase(ph) {
      B.notes = [];
      if (ph === 2) { B.holes = []; B.nextHole = T() + 1800; B.sweep = null; B.nextSweep = T() + 7500; }
      if (ph === 3) { B.holes = []; B.sweep = null; B.rocks = []; B.nextRock = T() + 2000; B.eyesUntil = 0; B.nextEyes = T() + 4500; B.cracks = []; B.eyeHit = [0, 0, 0, 0]; }
    },
    sc: () => Math.min(B.W, B.H) / 700,
    update2() {
      const t = T(), s = this.sc();
      if (t > B.nextHole && B.holes.filter(h => !h.done).length < 3) {
        let x, y, k = 0;
        do { x = lerp(B.W * 0.16, B.W * 0.84, Math.random()); y = lerp(B.H * 0.44, B.H * 0.86, Math.random()); k++; }
        while (k < 20 && B.holes.some(h => !h.done && Math.hypot(h.x - x, h.y - y) < 130 * s + 40));
        B.holes.push({ x, y, open: t, close: t + 1500, dir: Math.random() < 0.5 ? -1 : 1, done: false });
        B.nextHole = t + 520 + Math.random() * 380;
      }
      for (const h of B.holes) if (!h.done && t > h.close) { h.done = true; h.missed = now(); missed(h.x, h.y - 40); }
      B.holes = B.holes.filter(h => !h.done || now() - (h.hitAt || h.missed) < 600);
      if (!B.sweep && t > B.nextSweep) {
        const y = lerp(B.H * 0.5, B.H * 0.82, Math.random());
        B.sweep = { y, dir: Math.random() < 0.5 ? -1 : 1, warn: t, live: t + 1400, end: t + 1400 + 1000 };
        G.audio.blackout && G.audio.blackout(5);
      }
      if (B.sweep && t > B.sweep.end) { B.sweep = null; B.nextSweep = t + 7000 + Math.random() * 4000; }
      const bi = Math.floor(t / 500); if (bi !== B.lastBeat) { B.lastBeat = bi; beat(bi); B.pulse = now(); }
    },
    tap2(x, y) {
      const t = T(), s = this.sc(), sw = B.sweep;
      if (sw && t > sw.live && t < sw.end && Math.abs(y - sw.y) < 70 * s + 20) { heal(0.025, x, y, '꼬리에 휩쓸렸다!'); return; }
      let best = null, bd = 1e9;
      for (const h of B.holes) { if (h.done) continue; const d = Math.hypot(x - h.x, y - (h.y - 62 * s * 1.6 - 16 * s)); if (d < bd) { bd = d; best = h; } }
      if (!best || bd > 70 * s + 22) return;
      const life = (t - best.open) / (best.close - best.open), j = life > 0.18 && life < 0.72 ? 'perfect' : 'good';
      best.done = true; best.hitAt = now();
      hitFx(j, best.x, best.y - 150 * s); hurt(j === 'perfect' ? 10 : 7, best.x, best.y - 115 * s);
    },
    draw2(g, W, H, t) {
      const s = this.sc(), ft = T(), sink = E.inCubic(clamp((now() - (B.phaseAt || 0)) / 1300));
      // the head goes under, sand boiling where it went
      if (sink < 1) { g.save(); g.globalAlpha = 1 - sink; g.translate(0, sink * H * 0.5); this.drawBoss(g, W, H, t, 0); g.restore(); }
      // the desert floor
      const top = H * 0.36, fl = g.createLinearGradient(0, top, 0, H);
      fl.addColorStop(0, 'rgba(120,70,30,0)'); fl.addColorStop(0.15, 'rgba(150,90,40,.55)'); fl.addColorStop(1, 'rgba(90,50,20,.75)');
      g.fillStyle = fl; g.fillRect(0, top, W, H - top);
      g.strokeStyle = 'rgba(255,210,150,.12)'; g.lineWidth = 1;
      for (let i = 0; i < 12; i++) { const y = top + (i + 1) * (H - top) / 13; g.beginPath(); for (let k = 0; k <= 24; k++) { const x = k / 24 * W, yy = y + Math.sin(k * 0.9 + i * 1.3 + t * 0.0005) * 4; k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
      // something huge moving under the sand
      const ux = W / 2 + Math.sin(t * 0.0007) * W * 0.3, uy = H * 0.66 + Math.cos(t * 0.0005) * H * 0.1;
      glow(g, ux, uy, 160 * s, '40,20,5', 0.35);
      // the tail sweep: warning band, then the tail itself raking across
      const sw = B.sweep;
      if (sw && ft > sw.warn) {
        const live = ft > sw.live, band = 70 * s + 20, p = live ? 1 : 0.5 + 0.5 * Math.sin(ft * 0.03);
        g.fillStyle = `rgba(255,40,30,${live ? 0.22 : 0.1 * p + 0.05})`; g.fillRect(0, sw.y - band, W, band * 2);
        g.strokeStyle = `rgba(255,70,50,${0.7 * p})`; g.lineWidth = 2; g.setLineDash([10, 8]);
        g.beginPath(); g.moveTo(0, sw.y - band); g.lineTo(W, sw.y - band); g.moveTo(0, sw.y + band); g.lineTo(W, sw.y + band); g.stroke(); g.setLineDash([]);
        g.fillStyle = `rgba(255,120,90,${p})`; g.font = '900 15px system-ui,"Malgun Gothic",sans-serif'; g.textAlign = 'center';
        if (!live) { g.fillText(sw.dir > 0 ? '▶▶  꼬리 휩쓸기 - 이 줄은 누르지 마!  ▶▶' : '◀◀  꼬리 휩쓸기 - 이 줄은 누르지 마!  ◀◀', W / 2, sw.y + 5); }
        else {
          const k = clamp((ft - sw.live) / (sw.end - sw.live)), hx = sw.dir > 0 ? lerp(-W * 0.3, W * 1.5, k) : lerp(W * 1.3, -W * 0.5, k);
          for (let i = 0; i < 14; i++) {
            const x = hx - sw.dir * i * 34 * s, y = sw.y + Math.sin(i * 0.8 + ft * 0.02) * 10 * s, r = (30 - i * 1.2) * s;
            const pg = g.createLinearGradient(0, y - r, 0, y + r); pg.addColorStop(0, '#e8b060'); pg.addColorStop(0.4, '#8a5a24'); pg.addColorStop(1, '#2a1606');
            g.fillStyle = pg; g.beginPath(); g.ellipse(x, y, r * 1.1, r, 0, 0, TAU); g.fill();
            g.fillStyle = '#3a2410'; g.beginPath(); g.moveTo(x - 6 * s, y - r * 0.8); g.lineTo(x, y - r * 1.5); g.lineTo(x + 6 * s, y - r * 0.8); g.fill();
          }
          // the stinger
          g.fillStyle = '#f0e0c0'; g.beginPath(); g.moveTo(hx + sw.dir * 20 * s, sw.y - 16 * s); g.lineTo(hx + sw.dir * 80 * s, sw.y); g.lineTo(hx + sw.dir * 20 * s, sw.y + 16 * s); g.fill();
          g.fillStyle = 'rgba(240,200,140,.6)'; for (let i = 0; i < 30; i++) g.fillRect(hx - sw.dir * (fr(i * 0.37) * 400 * s), sw.y + (fr(i * 0.61) - 0.5) * band * 2, 3, 2);
        }
      }
      // segments breaking the surface
      for (const h of B.holes) {
        const life = clamp((ft - h.open) / (h.close - h.open));
        const up = h.hitAt ? Math.max(0, 1 - (now() - h.hitAt) / 350) : h.missed ? Math.max(0, 1 - (now() - h.missed) / 300) : Math.min(1, life * 6, (1 - life) * 5 + 0.25);
        const R = 62 * s;
        // crater
        g.fillStyle = 'rgba(40,20,6,.55)'; g.beginPath(); g.ellipse(h.x, h.y, R * 1.25, R * 0.36, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,210,150,.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(h.x, h.y, R * 1.25, R * 0.36, 0, Math.PI, TAU); g.stroke();
        if (up <= 0) continue;
        // an arch of armour plates coming up out of the sand and back in
        g.save(); g.beginPath(); g.rect(h.x - R * 2, h.y - R * 3, R * 4, R * 3 + R * 0.05); g.clip();
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i / 6) * Math.PI, px = h.x + Math.cos(a) * R * h.dir, py = h.y + R * 0.3 + Math.sin(a) * R * 1.9 * up, r = (22 - Math.abs(i - 3) * 1.5) * s;
          const pg = g.createLinearGradient(0, py - r, 0, py + r); pg.addColorStop(0, h.hitAt ? '#fff' : '#e8b060'); pg.addColorStop(0.4, '#8a5a24'); pg.addColorStop(1, '#2a1606');
          g.fillStyle = pg; g.beginPath(); g.ellipse(px, py, r * 1.1, r, a + Math.PI / 2, 0, TAU); g.fill();
          g.fillStyle = '#3a2410'; g.beginPath(); g.moveTo(px - 5 * s, py - r * 0.8); g.lineTo(px, py - r * 1.45); g.lineTo(px + 5 * s, py - r * 0.8); g.fill();
        }
        g.restore();
        // the exposed weak scale at the top of the arch
        if (!h.done) {
          const wx = h.x, wy = h.y + R * 0.3 - R * 1.9 * up - 16 * s, pulse = 0.5 + 0.5 * Math.sin(ft * 0.015);
          glow(g, wx, wy, 42 * s, '255,150,40', 0.5 + pulse * 0.3);
          const cg = g.createRadialGradient(wx, wy, 0, wx, wy, 15 * s); cg.addColorStop(0, '#fffbe0'); cg.addColorStop(0.6, '#ffb040'); cg.addColorStop(1, '#b05010');
          g.fillStyle = cg; g.beginPath(); g.ellipse(wx, wy, 15 * s, 12 * s, 0, 0, TAU); g.fill();
          g.strokeStyle = life > 0.7 ? '#ff4a3a' : 'rgba(255,240,190,.9)'; g.lineWidth = 3 * s;
          g.beginPath(); g.arc(wx, wy, 26 * s, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - life)); g.stroke();
        }
        // sand spraying off
        g.fillStyle = 'rgba(240,200,140,.7)';
        for (let i = 0; i < 12; i++) { const k = fr(ft * 0.002 + i * 0.37), a = Math.PI + fr(i * 0.618) * Math.PI; g.fillRect(h.x + Math.cos(a) * R * (0.8 + k * 0.6), h.y + Math.sin(a) * R * 0.5 * k - k * 20 * s + k * k * 30 * s, 2.5, 2.5); }
      }
    },
    update3() {
      const t = T(), s = this.sc();
      if (t > B.nextEyes && t > (B.eyesUntil || 0)) { B.eyesUntil = t + 2600; B.nextEyes = t + 2600 + 4200 + Math.random() * 2000; B.roar = now(); G.audio.blackout && G.audio.blackout(6); }
      if (t > B.nextRock) {
        const mouth = B.mouthScr || [B.W / 2, B.H * 0.4];
        const tx = lerp(B.W * 0.14, B.W * 0.86, Math.random()), ty = lerp(B.H * 0.5, B.H * 0.9, Math.random());
        B.rocks.push({ x0: mouth[0], y0: mouth[1], tx, ty, t0: t, dur: 1500 - Math.random() * 200, spin: Math.random() * 6, done: false });
        B.nextRock = t + 620 + Math.random() * 300; B.bite = now();
      }
      for (const r of B.rocks) if (!r.done && t > r.t0 + r.dur) {
        r.done = true; r.missed = now(); B.cracks.push({ x: r.tx, y: r.ty, t: now(), seed: Math.random() * 1000 });
        heal(0.01, r.tx, r.ty - 30, '쾅!');
      }
      B.rocks = B.rocks.filter(r => !r.done || now() - (r.hitAt || r.missed) < 400);
      B.cracks = B.cracks.filter(c => now() - c.t < 2600);
      const bi = Math.floor(t / 430); if (bi !== B.lastBeat) { B.lastBeat = bi; beat(bi); B.pulse = now(); }
    },
    rockPos(r) { const k = clamp((T() - r.t0) / r.dur), e = k * k; return { k, x: lerp(r.x0, r.tx, e), y: lerp(r.y0, r.ty, e) - Math.sin(k * Math.PI) * 60 * this.sc(), rad: lerp(8, 58, e) * this.sc() }; },
    tap3(x, y) {
      const t = T(), s = this.sc();
      let best = null, bd = 1e9;
      for (const r of B.rocks) { if (r.done) continue; const q = this.rockPos(r), d = Math.hypot(x - q.x, y - q.y) - q.rad; if (d < bd) { bd = d; best = r; } }
      if (best && bd < 26) {
        const q = this.rockPos(best); best.done = true; best.hitAt = now(); best.hx = q.x; best.hy = q.y; best.hr = q.rad;
        const j = q.k < 0.75 ? 'perfect' : 'good';
        hitFx(j, q.x, q.y - q.rad - 10); hurt(j === 'perfect' ? 7 : 5, q.x, q.y); return;
      }
      if (t < (B.eyesUntil || 0) && B.eyeScr) {
        for (let i = 0; i < B.eyeScr.length; i++) {
          const [ex, ey, er] = B.eyeScr[i];
          if (Math.hypot(x - ex, y - ey) < er * 1.6 + 16 && now() - B.eyeHit[i] > 220) { B.eyeHit[i] = now(); hitFx('perfect', ex, ey - er - 12); hurt(4, ex, ey); return; }
        }
      }
      popText('딱!', x, y, '#a89a8a', 14); G.audio.tab();
    },
    draw3(g, W, H, t) {
      const ft = T(), emerge = E.outBack(clamp((now() - (B.phaseAt || 0)) / 1400)), S = 1.45, hy = H * 0.27;
      // it bursts back up, bigger, closer
      g.save(); g.translate(W / 2, hy + (1 - emerge) * H * 0.6); g.scale(S, S); g.translate(-W / 2, -hy);
      this.drawBoss(g, W, H, t, 0);
      g.restore();
      const open = ft < (B.eyesUntil || 0);
      if (open) { g.fillStyle = `rgba(255,30,20,${0.06 + 0.04 * Math.sin(ft * 0.02)})`; g.fillRect(0, 0, W, H); g.fillStyle = '#ff6a5a'; g.font = '900 15px system-ui,"Malgun Gothic",sans-serif'; g.textAlign = 'center'; g.fillText('눈이 열렸다 - 지금!', W / 2, H * 0.5); }
      // boulders flying at the glass: a shadow reticle where each will land
      for (const r of B.rocks) {
        if (r.hitAt) { const q = (now() - r.hitAt) / 400; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.fillStyle = `rgba(200,150,90,${1 - q})`; g.fillRect(r.hx + Math.cos(a) * r.hr * (1 + q * 1.5), r.hy + Math.sin(a) * r.hr * (1 + q * 1.5), 5, 5); } continue; }
        if (r.done) continue;
        const q = this.rockPos(r);
        g.strokeStyle = `rgba(255,70,50,${0.25 + q.k * 0.6})`; g.lineWidth = 2; g.beginPath(); g.arc(r.tx, r.ty, lerp(70, 26, q.k) * this.sc() + 10, 0, TAU); g.stroke();
        g.beginPath(); g.moveTo(r.tx - 8, r.ty); g.lineTo(r.tx + 8, r.ty); g.moveTo(r.tx, r.ty - 8); g.lineTo(r.tx, r.ty + 8); g.stroke();
        g.fillStyle = 'rgba(230,180,110,.35)'; for (let i = 1; i < 6; i++) { const b = this.rockPos({ ...r, t0: r.t0 + i * 45 }); g.beginPath(); g.arc(b.x, b.y, b.rad * (1 - i * 0.14), 0, TAU); g.fill(); }
        g.save(); g.translate(q.x, q.y); g.rotate(r.spin + ft * 0.006);
        const rg = g.createRadialGradient(-q.rad * 0.3, -q.rad * 0.3, 0, 0, 0, q.rad); rg.addColorStop(0, '#e8c088'); rg.addColorStop(0.6, '#9a6a36'); rg.addColorStop(1, '#3a2410');
        g.fillStyle = rg; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = q.rad * (0.85 + fr(i * 0.37 + r.spin) * 0.25); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
        g.strokeStyle = 'rgba(40,20,5,.6)'; g.lineWidth = 2; g.stroke();
        g.restore();
      }
      // cracked glass where boulders got through
      for (const c of B.cracks) {
        const a = 1 - (now() - c.t) / 2600, r = rng(c.seed | 0);
        g.strokeStyle = `rgba(255,255,255,${0.75 * a})`; g.lineWidth = 1.5;
        for (let i = 0; i < 9; i++) { let x = c.x, y = c.y, ang = r() * TAU; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { ang += (r() - 0.5) * 0.7; x += Math.cos(ang) * 22; y += Math.sin(ang) * 22; g.lineTo(x, y); } g.stroke(); }
        g.beginPath(); g.arc(c.x, c.y, 16, 0, TAU); g.stroke();
      }
    },
    draw(g, W, H, t, dead) {
      B.baseInv = g.getTransform().inverse();
      g.fillStyle = 'rgba(20,10,4,.45)'; g.fillRect(0, 0, W, H);
      if (dead) { if (B.phase === 3) { g.save(); g.translate(W / 2, H * 0.27); g.scale(1.45, 1.45); g.translate(-W / 2, -H * 0.27); this.drawBoss(g, W, H, t, dead); g.restore(); } else this.drawBoss(g, W, H, t, dead); return; }
      if (B.phase === 2) this.draw2(g, W, H, t);
      else if (B.phase === 3) this.draw3(g, W, H, t);
      else { const mouth = this.drawBoss(g, W, H, t, 0); this.drawArena(g, W, H, t); this.drawNotes(g, W, H, t, mouth); }
      if (B.phase === 2) phaseBanner(g, W, H, ['잠행', '솟아오르는 등껍질의 약점을 부숴라 · 꼬리가 휩쓰는 줄은 누르지 마라']);
      if (B.phase === 3) phaseBanner(g, W, H, ['광란', '날아오는 바위를 부숴라 · 네 개의 눈이 열리면 눈을 노려라']);
    },
  };

  /* ================= VOID WATCHER - closing rings ================= */
  const Watcher = {
    init() { B.targets = []; B.nextT = 2000; B.win = [75, 170]; B.seq = 0; B.blink = 0; },
    approach: () => [0, 1300, 1050, 850][B.phase],
    arena() { return { x0: B.W * 0.12, x1: B.W * 0.88, y0: B.H * 0.34, y1: B.H * 0.88 }; },
    place() {
      const a = this.arena(), last = B.targets[B.targets.length - 1];
      for (let k = 0; k < 20; k++) {
        const x = lerp(a.x0, a.x1, Math.random()), y = lerp(a.y0, a.y1, Math.random());
        if (!last || Math.hypot(x - last.x, y - last.y) > 90) return [x, y];
      }
      return [lerp(a.x0, a.x1, Math.random()), lerp(a.y0, a.y1, Math.random())];
    },
    update() {
      const t = T(), ap = this.approach();
      while (B.nextT < t + ap) {
        const pat = Math.random(), gap = [0, 650, 520, 420][B.phase];
        if (B.phase >= 2 && pat < 0.25) {                     // a quick triangle
          const [x, y] = this.place(), r = 70;
          for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i / 3 * TAU; B.targets.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, hit: B.nextT + i * gap * 0.45, n: ++B.seq, fade: B.phase === 3 && Math.random() < 0.4 }); }
          B.nextT += gap * 2.2;
        } else if (B.phase >= 2 && pat < 0.4) {               // a ring around the eye
          const a0 = Math.random() * TAU, ar = this.arena(), cx = (ar.x0 + ar.x1) / 2, cy = (ar.y0 + ar.y1) / 2, rr = Math.min(ar.x1 - ar.x0, ar.y1 - ar.y0) * 0.36;
          for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * TAU; B.targets.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, hit: B.nextT + i * gap * 0.5, n: ++B.seq, fade: false }); }
          B.nextT += gap * 3.2;
        } else {
          const [x, y] = this.place();
          B.targets.push({ x, y, hit: B.nextT, n: ++B.seq, fade: B.phase === 3 && Math.random() < 0.3 });
          B.nextT += gap;
        }
      }
      for (const o of B.targets) if (!o.done && t > o.hit + B.win[1]) { o.done = true; o.missedAt = now(); missed(o.x, o.y); B.glitch = now(); }
      B.targets = B.targets.filter(o => !o.done || now() - (o.hitAt || o.missedAt) < 400);
      const bi = Math.floor(t / 500); if (bi !== B.lastBeat) { B.lastBeat = bi; beat(bi); B.pulse = now(); }
      if (Math.random() < 0.002) B.blink = now();
    },
    tap(x, y) {
      const t = T(); let best = null;
      for (const o of B.targets) if (!o.done && Math.hypot(x - o.x, y - o.y) < 46 && Math.abs(t - o.hit) <= B.win[1] && (!best || o.hit < best.hit)) best = o;
      if (!best) return;
      const j = judge(t - best.hit); best.done = true; best.hitAt = now(); B.look = [best.x, best.y];
      hitFx(j, best.x, best.y - 40); hurt(j === 'perfect' ? 4 : 2, best.x, best.y);
    },
    draw(g, W, H, t, dead) {
      const ft = T(), s = Math.min(W, H) / 700, ex = W / 2, ey = H * 0.2, hurtK = clamp(1 - (now() - B.flash) / 160);
      g.fillStyle = 'rgba(8,0,16,.55)'; g.fillRect(0, 0, W, H);
      // rift tendrils around the eye
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * TAU + t * 0.0003; let x = ex, y = ey, ang = a;
        g.strokeStyle = `rgba(190,90,255,${0.35 - (dead || 0) * 0.3})`; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y);
        for (let i = 0; i < 14; i++) { ang += Math.sin(t * 0.001 + k * 3 + i * 0.7) * 0.35; x += Math.cos(ang) * 18 * s; y += Math.sin(ang) * 18 * s; g.lineTo(x, y); }
        g.stroke();
      }
      glow(g, ex, ey, 260 * s, '160,60,255', 0.35 + hurtK * 0.3);
      g.restore();
      // the eye
      const collapse = dead ? E.inCubic(clamp(dead * 1.4)) : 0, R = 95 * s * (1 - collapse);
      const blink = clamp(1 - Math.abs((now() - B.blink) - 150) / 150), lid = Math.max(blink, collapse);
      if (R > 1) {
        g.save(); g.translate(ex, ey);
        g.beginPath(); g.ellipse(0, 0, R * 1.6, R * (1 - lid * 0.95), 0, 0, TAU); g.save(); g.clip();
        const sg = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.6); sg.addColorStop(0, '#2a0a3a'); sg.addColorStop(1, '#0a0012');
        g.fillStyle = sg; g.fillRect(-R * 2, -R * 2, R * 4, R * 4);
        const look = B.look || [ex, H * 0.6], la = Math.atan2(look[1] - ey, look[0] - ex), lx = Math.cos(la) * R * 0.35, ly = Math.sin(la) * R * 0.3;
        const ig = g.createRadialGradient(lx, ly, R * 0.1, lx, ly, R * 0.8);
        ig.addColorStop(0, '#ffffff'); ig.addColorStop(0.25, hurtK > 0 ? '#ffffff' : '#e08aff'); ig.addColorStop(0.6, '#7a1ad0'); ig.addColorStop(1, '#1a0030');
        g.fillStyle = ig; g.beginPath(); g.arc(lx, ly, R * 0.8, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,200,255,.25)'; g.lineWidth = 1.5;
        for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.moveTo(lx + Math.cos(a) * R * 0.28, ly + Math.sin(a) * R * 0.28); g.lineTo(lx + Math.cos(a) * R * 0.78, ly + Math.sin(a) * R * 0.78); g.stroke(); }
        g.fillStyle = '#000'; g.beginPath(); g.ellipse(lx, ly, R * 0.14, R * (B.phase === 3 ? 0.42 : 0.3), 0, 0, TAU); g.fill();
        g.restore();
        g.strokeStyle = 'rgba(210,140,255,.8)'; g.lineWidth = 2.5 * s; g.beginPath(); g.ellipse(0, 0, R * 1.6, R * (1 - lid * 0.95), 0, 0, TAU); g.stroke();
        g.restore();
      }
      if (dead) return;
      // targets with their closing rings
      const ap = this.approach();
      for (const o of B.targets) {
        if (o.hitAt) { const q = (now() - o.hitAt) / 380; g.strokeStyle = `rgba(230,180,255,${1 - q})`; g.lineWidth = 4; g.beginPath(); g.arc(o.x, o.y, 34 + q * 50, 0, TAU); g.stroke(); continue; }
        if (o.missedAt) { const q = (now() - o.missedAt) / 380; g.fillStyle = `rgba(255,60,90,${0.6 * (1 - q)})`; g.font = '900 26px system-ui'; g.textAlign = 'center'; g.fillText('×', o.x, o.y + 9); continue; }
        const k = 1 - (o.hit - ft) / ap;
        if (k < 0) continue;
        const fadeA = o.fade ? clamp(1 - k * 1.6) : 1;
        g.save(); g.globalAlpha = clamp(k * 3);
        g.globalCompositeOperation = 'lighter'; glow(g, o.x, o.y, 60, '170,80,255', 0.35 * fadeA); g.globalCompositeOperation = 'source-over';
        g.fillStyle = `rgba(40,10,60,${0.85 * fadeA})`; g.strokeStyle = `rgba(230,190,255,${0.95 * fadeA})`; g.lineWidth = 3;
        g.beginPath(); g.arc(o.x, o.y, 32, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = `rgba(255,255,255,${fadeA})`; g.font = '800 20px ui-monospace,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(((o.n - 1) % 9) + 1, o.x, o.y + 1);
        const rr = lerp(32 * 3.2, 32, clamp(k));
        g.strokeStyle = `rgba(210,150,255,${0.9})`; g.lineWidth = 2.5; g.beginPath(); g.arc(o.x, o.y, rr, 0, TAU); g.stroke();
        g.restore();
      }
      g.textBaseline = 'alphabetic';
      if (B.glitch && now() - B.glitch < 250) { g.fillStyle = 'rgba(255,40,120,.12)'; g.fillRect(0, Math.random() * H, W, 30); g.fillRect(0, Math.random() * H, W, 14); }
    },
  };

  const KINDS = { crawler: Crawler, watcher: Watcher };

  /* ---------------- flow: prompt -> intro -> fight -> death / time up -> result ---------------- */
  function available() {
    if (!G.weather || G.config.viewer || B) return false;
    const w = G.weather.current(), inst = G.weather.instance();
    return !!(w.boss && inst && !inst.bossDone && !G.state.level1.crystalGone);
  }
  let promptGen = 0;
  function prompt(force) {
    if (!available()) return;
    const w = G.weather.current(), def = BOSSES[w.boss], el = document.getElementById('bossPrompt');
    const inst = G.weather.instance();
    if (!force && (inst.prompted || !el.hidden)) return;           // pops up by itself once per storm; the weather chip reopens it
    inst.prompted = true; G.save();
    const kills = (G.state.bossKills || {})[def.id] || 0;
    el.style.setProperty('--bc', def.color);
    el.innerHTML = `<div class="scrim"></div><div class="bpcard bevel">
      <div class="bpwarn"><span>WARNING</span><span>WARNING</span><span>WARNING</span></div>
      <small>${w.name} 속에서 무언가가 다가온다</small>
      <h3>${def.name}</h3><em>${def.en}</em>
      <canvas class="bpprev" width="560" height="300"></canvas>
      <p>${def.how}</p>
      <div class="bpmeta"><span>제한 시간 ${Math.floor(def.time / 60)}분 ${def.time % 60 ? (def.time % 60) + '초' : ''}</span><span>처치 보상: 보스 전용 광물 + 코인</span>${kills ? `<span>처치 ${kills}회</span>` : ''}</div>
      ${B === null && def.keys ? `<div class="bpkeys">${def.keys}</div>` : ''}
      <div class="bpbtns"><button class="buy bevel" data-bplater><span>나중에</span></button><button class="buy bevel go" data-bpgo><span>맞서기</span></button></div></div>`;
    el.hidden = false; void el.offsetWidth; el.classList.add('show');
    G.audio.blackout && G.audio.blackout(7);
    // a live preview of the boss in the card
    const cv = el.querySelector('.bpprev'), pg = cv.getContext('2d');
    const gen = ++promptGen; let previewing = true;
    const fake = { W: 560, H: 300 * 2.4, def, hp: 1, max: 1, phase: 1, flash: 0, pulse: 0, t0: now(), paused: 0, notes: [], laneHit: [0, 0, 0], targets: [] };
    (function prev() {
      if (el.hidden || !previewing || gen !== promptGen) return;
      const saveB = B;
      B = fake; pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, 560, 300);
      pg.save(); pg.translate(0, def.id === 'crawler' ? 20 : 30); pg.scale(1, 1);
      try { if (def.id === 'crawler') Crawler.drawBoss(pg, 560, 720, now(), 0); else { B.W = 560; B.H = 700; Watcher.draw(pg, 560, 700, now(), 0); } } catch (e) {}
      pg.restore();
      B = saveB;
      requestAnimationFrame(prev);
    })();
    el.onclick = ev => {
      if (ev.target.closest('[data-bpgo]')) { G.audio.init(); close(); start(def.id); }
      else if (ev.target.closest('[data-bplater]') || ev.target.classList.contains('scrim')) { G.audio.tab(); close(); }
    };
    function close() { previewing = false; el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 300); }
  }

  function start(id) {
    const def = BOSSES[id];
    if (!def || B) return;
    G.ui && G.ui.closePanel();
    const W = window.innerWidth, H = window.innerHeight;
    B = { def, kind: KINDS[id], hp: def.hp, max: def.hp, phase: 1, t0: now() + 3400, paused: 0, W, H, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0, dealt: 0,
      pops: [], sparks: [], flash: 0, lastBeat: -1, intro: now(), over: null };
    B.kind.init();
    document.body.classList.add('bossing');
    G.boss.active = true;
    G.audio.blackout && G.audio.blackout(7);
    setTimeout(() => G.audio.blast(7), 1600);
  }
  function win() {
    if (B.over) return;
    B.over = { win: true, at: now() };
    G.audio.shatter && G.audio.shatter('glass'); G.audio.blast(7); G.game.shake(1); G.game.flash(0.6);
    const inst = G.weather.instance(); if (inst) inst.bossDone = true;
    G.state.bossKills = G.state.bossKills || {}; G.state.bossKills[B.def.id] = (G.state.bossKills[B.def.id] || 0) + 1;
    B.prize = Math.floor(G.stats.clickValue() * 40000 * (1 + B.maxCombo / 100));
    G.addCoins(B.prize); G.save();
  }
  function lose() {
    if (B.over) return;
    B.over = { win: false, at: now() };
    G.audio.deny(); G.game.shake(0.6);
  }
  function finish() {
    const won = B.over.win, def = B.def;
    B = null; G.boss.active = false;
    document.body.classList.remove('bossing');
    G.emit('change');
    if (won) { const cd = G.cutscenes.byId[def.cut]; if (cd) setTimeout(() => G.game.grantCut(cd), 300); }
  }
  function grade() { const tot = B.perfect + B.good + B.miss || 1, acc = (B.perfect + B.good * 0.6) / tot; return { acc, g: acc > 0.95 ? 'S' : acc > 0.85 ? 'A' : acc > 0.7 ? 'B' : acc > 0.5 ? 'C' : 'D' }; }

  function draw(g, W, H, n) {
    if (!B) return;
    B.W = W; B.H = H;
    const t = n, fightT = T(), intro = n < B.t0;
    let dead = 0;
    if (!intro && !B.over) {
      B.kind.update();
      if (fightT > B.def.time * 1000) lose();
    }
    if (B.over && B.over.win) dead = clamp((n - B.over.at) / 2600);
    B.kind.draw(g, W, H, t, dead || (B.over && !B.over.win ? clamp((n - B.over.at) / 2000) : 0));
    if (B.burned && n - B.burned < 350) { g.fillStyle = `rgba(255,40,0,${0.3 * (1 - (n - B.burned) / 350)})`; g.fillRect(0, 0, W, H); }

    // sparks + judgement pops
    g.save(); g.globalCompositeOperation = 'lighter';
    B.sparks = B.sparks.filter(p => n - p.t < 600);
    for (const p of B.sparks) { const k = (n - p.t) / 1000; g.fillStyle = p.col; g.globalAlpha = 1 - k / 0.6; g.fillRect(p.x + p.vx * k, p.y + p.vy * k + 700 * k * k, 3, 3); }
    g.restore();
    B.pops = B.pops.filter(p => n - p.t < 700);
    g.textAlign = 'center';
    for (const p of B.pops) { const k = (n - p.t) / 700; g.globalAlpha = 1 - k; g.fillStyle = p.col; g.font = `900 ${p.size * (1 + (1 - k) * 0.25)}px system-ui,"Malgun Gothic",sans-serif`; g.fillText(p.txt, p.x, p.y - k * 30); }
    g.globalAlpha = 1;

    // HUD: name, hp bar with phase marks, clock, combo
    if (!intro && !(B.over && B.over.win && dead > 0.6)) {
      const bw = Math.min(W * 0.86, 560), bx = (W - bw) / 2, tl = document.getElementById('topline'), by = (tl ? tl.getBoundingClientRect().bottom : 60) + 14;
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(bx - 4, by - 4, bw + 8, 22);
      const hk = B.hp / B.max, shownK = B.shownHp == null ? hk : (B.shownHp += (hk - B.shownHp) * 0.08);
      if (B.shownHp == null) B.shownHp = hk;
      g.fillStyle = '#5a1020'; g.fillRect(bx, by, bw * shownK, 14);
      const hg = g.createLinearGradient(bx, 0, bx + bw, 0); hg.addColorStop(0, B.def.color); hg.addColorStop(1, '#fff2c0');
      g.fillStyle = hg; g.fillRect(bx, by, bw * hk, 14);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(bx + bw * 0.33, by, 2, 14); g.fillRect(bx + bw * 0.66, by, 2, 14);
      g.font = '800 13px system-ui,"Malgun Gothic",sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(`${B.def.name}  ·  ${B.def.en}`, bx, by + 34);
      const left = Math.max(0, B.def.time - fightT / 1000);
      g.textAlign = 'right'; g.fillStyle = left < 30 ? '#ff6a6a' : '#fff'; g.font = '800 15px ui-monospace,monospace';
      g.fillText(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, bx + bw, by + 34);
      g.textAlign = 'center';
      if (B.combo >= 5) { g.font = `900 ${26 + Math.min(14, B.combo / 10)}px ui-monospace,monospace`; g.fillStyle = `rgba(255,255,255,${0.85})`; g.fillText(`${B.combo}`, W / 2, H * 0.34); g.font = '700 10px ui-monospace,monospace'; g.fillStyle = B.def.color; g.fillText('COMBO', W / 2, H * 0.34 + 16); }
      // forfeit
      g.font = '700 12px system-ui,"Malgun Gothic",sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)'; g.textAlign = 'right'; g.fillText('포기 ×', W - 14, H - 16);
    }

    // intro: warning bars and the name slamming in
    if (intro) {
      const k = (n - B.intro) / 3400;
      g.fillStyle = `rgba(0,0,0,${0.6 * clamp(k * 4)})`; g.fillRect(0, 0, W, H);
      const stripe = (y, dir) => {
        g.save(); g.beginPath(); g.rect(0, y, W, 34); g.clip();
        g.fillStyle = '#1a0000'; g.fillRect(0, y, W, 34);
        g.fillStyle = B.def.color; for (let x = -80 + ((n * 0.2 * dir) % 80); x < W + 80; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y); g.lineTo(x + 20, y + 34); g.lineTo(x - 20, y + 34); g.fill(); }
        g.fillStyle = '#000'; g.font = '900 20px ui-monospace,monospace'; g.textAlign = 'center';
        g.fillStyle = '#fff'; g.fillText('WARNING  ·  WARNING  ·  WARNING', W / 2, y + 24);
        g.restore();
      };
      stripe(H * 0.3, 1); stripe(H * 0.66, -1);
      const nk = E.outBack(clamp((k - 0.25) * 3));
      g.save(); g.translate(W / 2, H * 0.5); g.scale(nk, nk);
      g.textAlign = 'center'; g.fillStyle = '#fff'; g.shadowColor = B.def.color; g.shadowBlur = 30;
      g.font = `900 ${Math.min(64, W * 0.13)}px system-ui,"Malgun Gothic",sans-serif`; g.fillText(B.def.name, 0, 10);
      g.font = '800 14px ui-monospace,monospace'; g.fillStyle = B.def.color; g.fillText(B.def.en, 0, 40);
      g.restore();
      if (k > 0.8) { g.font = '900 30px ui-monospace,monospace'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(k > 0.93 ? 'FIGHT!' : 'READY', W / 2, H * 0.85); }
    }

    // result card
    if (B.over) {
      const k = (n - B.over.at) / 1000, show = B.over.win ? 2.6 : 1.8;
      if (k > show) {
        const a = clamp((k - show) * 3), gr = grade();
        g.fillStyle = `rgba(0,0,0,${0.7 * a})`; g.fillRect(0, 0, W, H);
        g.globalAlpha = a; g.textAlign = 'center';
        g.font = `900 ${Math.min(52, W * 0.11)}px system-ui,"Malgun Gothic",sans-serif`; g.fillStyle = B.over.win ? B.def.color : '#8a8aa0';
        g.fillText(B.over.win ? 'BOSS DEFEATED' : 'TIME UP', W / 2, H * 0.34);
        g.font = '700 15px system-ui,"Malgun Gothic",sans-serif'; g.fillStyle = '#ddd';
        g.fillText(B.over.win ? `${B.def.name}을(를) 쓰러뜨렸다` : `${B.def.name}이(가) 모래 속으로 사라졌다`.replace('모래 속으로', B.def.id === 'crawler' ? '모래 속으로' : '공허 속으로'), W / 2, H * 0.34 + 30);
        g.font = '900 72px ui-monospace,monospace'; g.fillStyle = '#fff'; g.fillText(gr.g, W / 2, H * 0.52);
        g.font = '700 13px ui-monospace,monospace'; g.fillStyle = '#cfc6ea';
        g.fillText(`정확도 ${(gr.acc * 100).toFixed(1)}%   ·   최대 콤보 ${B.maxCombo}`, W / 2, H * 0.58);
        g.fillText(`PERFECT ${B.perfect}   GOOD ${B.good}   MISS ${B.miss}`, W / 2, H * 0.58 + 22);
        if (B.over.win) { g.fillStyle = '#ffd766'; g.font = '800 20px ui-monospace,monospace'; g.fillText(`+ ${G.fmt(B.prize)} 코인  ·  보스 광물 획득`, W / 2, H * 0.67); }
        g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(n / 250)})`; g.font = '700 13px system-ui,"Malgun Gothic",sans-serif'; g.fillText('탭해서 계속', W / 2, H * 0.78);
        g.globalAlpha = 1;
        B.canClose = true;
      }
    }
  }

  function tap(x, y) {
    if (!B) return;
    if (B.over) { if (B.canClose) finish(); return; }
    if (now() < B.t0) return;
    if (x > B.W - 90 && y > B.H - 44) { if (confirm('보스전을 포기할까요?')) lose(); return; }
    B.kind.tap(x, y);
  }
  window.addEventListener('keydown', ev => {
    if (!B || ev.repeat || G.cutscenes.active) return;
    const k = ev.key.toLowerCase();
    if (B.over) { if (B.canClose && (k === ' ' || k === 'enter' || k === 'escape')) finish(); return; }
    if (now() < B.t0) return;
    if (B.kind.key && B.kind.key(k)) ev.preventDefault();
  });

  G.boss = { active: false, available, prompt, start, draw, tap, list: BOSSES, debug: () => B };
  G.on('weather', () => { setTimeout(() => prompt(false), 4600); });
  G.on('zone', () => setTimeout(() => prompt(false), 800));
  G.on('ready', () => setTimeout(() => prompt(false), 2500));
})();
