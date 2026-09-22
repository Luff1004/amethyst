/* AMETHYST - synthesized sound. No audio files needed. */
G.audio = (() => {
  let ctx = null, master = null, noiseBuf = null, muted = false, lastCoin = 0;
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // pentatonic climb for combos

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    // reverb send shared by the two cutscene buses
    const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.8), ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = impulse.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6);
    }
    const conv = ctx.createConvolver(); conv.buffer = impulse;
    const revOut = ctx.createGain(); revOut.gain.value = 0.5;
    conv.connect(revOut); revOut.connect(master);
    const mkBus = send => {
      const b = ctx.createGain(); b.connect(master);
      const s = ctx.createGain(); s.gain.value = send; b.connect(s); s.connect(conv);
      return b;
    };
    cutBus = mkBus(0.25);       // build-up sounds (a skip can silence it)
    hitBus = mkBus(0.45);       // reveal + tail
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  let cutBus = null, hitBus = null;
  function tone({ f = 440, f2 = 0, type = 'sine', t = 0, d = 0.15, v = 0.2, a = 0.004, out = null }) {
    if (!ctx) return;
    f = Math.min(f, 18000); if (f2) f2 = Math.min(f2, 18000);
    const o = ctx.createOscillator(), g = ctx.createGain();
    const st = ctx.currentTime + t;
    o.type = type;
    o.frequency.setValueAtTime(f, st);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, st + d);
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(v, st + a);
    g.gain.exponentialRampToValueAtTime(0.0001, st + d);
    o.connect(g); g.connect(out || master);
    o.start(st); o.stop(st + d + 0.05);
  }

  function noise({ t = 0, d = 0.2, v = 0.2, f = 2000, f2 = 0, q = 0.7, type = 'bandpass', out = null, a = 0.01 }) {
    if (!ctx) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(), g = ctx.createGain();
    const st = ctx.currentTime + t;
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, st);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, st + d);
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(v, st + a);
    g.gain.exponentialRampToValueAtTime(0.0001, st + d);
    s.connect(fl); fl.connect(g); g.connect(out || master);
    s.start(st); s.stop(st + d + 0.05);
  }

  const hz = (base, semis) => base * Math.pow(2, semis / 12);

  return {
    init, tone, noise, hz,
    /* internals for G.sfx (the cutscene sound designer) */
    core: () => (ctx ? { ctx, master, cutBus, hitBus } : null),
    get muted() { return muted; },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; },

    /* every click: bright coin ping, climbs the scale with the combo */
    coin(combo = 0, quiet = false, kind = 'stone') {
      if (!ctx) return;
      const now = performance.now();
      if (now - lastCoin < 35) return;
      lastCoin = now;
      const n = SCALE[Math.min(combo, SCALE.length - 1)];
      const vol = quiet ? 0.05 : 0.13;
      switch (kind) {
        case 'ore': { // bright metal: clinking coin with an inharmonic ring
          const f = hz(988, n);
          tone({ f, type: 'square', d: 0.05, v: vol * 0.55 });
          tone({ f: f * 1.5, type: 'triangle', t: 0.04, d: 0.16, v: vol });
          [2.76, 5.4].forEach((r, i) => tone({ f: f * r, type: 'sine', t: 0.04, d: 0.32 - i * 0.1, v: vol * 0.3 }));
          noise({ d: 0.03, v: quiet ? 0.02 : 0.06, f: 8000, q: 2 });
          break;
        }
        case 'glass': { // crystal chime
          const f = hz(1046, n);
          tone({ f, type: 'sine', d: 0.5, v: vol * 0.9 });
          tone({ f: f * 2.4, type: 'sine', t: 0.01, d: 0.35, v: vol * 0.45 });
          tone({ f: f * 4.1, type: 'sine', t: 0.02, d: 0.22, v: vol * 0.25 });
          break;
        }
        case 'lava': { // warm, rounder pop
          const f = hz(660, n);
          tone({ f, type: 'sawtooth', d: 0.1, v: vol * 0.35 });
          tone({ f: f * 1.5, type: 'triangle', t: 0.05, d: 0.24, v: vol });
          noise({ d: 0.05, v: quiet ? 0.02 : 0.06, f: 1400, q: 2 });
          break;
        }
        case 'void': { // eerie bent ping
          const f = hz(784, n);
          tone({ f: f * 1.6, f2: f, type: 'sine', d: 0.3, v: vol });
          tone({ f: f * 1.62, f2: f * 1.02, type: 'sine', t: 0.03, d: 0.3, v: vol * 0.6 });
          tone({ f: f * 3, type: 'sine', t: 0.05, d: 0.15, v: vol * 0.2 });
          break;
        }
        default: {
          const f = hz(880, n);
          tone({ f, type: 'square', d: 0.07, v: vol * 0.6 });
          tone({ f: f * 1.5, type: 'triangle', t: 0.055, d: 0.22, v: vol });
          tone({ f: f * 3, type: 'sine', t: 0.055, d: 0.12, v: vol * 0.35 });
          noise({ d: 0.04, v: quiet ? 0.02 : 0.05, f: 6000, q: 1.2 });
        }
      }
    },
    /* potions */
    potion() {          // gulp + rising shimmer
      if (!ctx) return;
      [0, 0.11, 0.21].forEach((t, i) => tone({ f: 380 - i * 60, f2: 220 - i * 30, type: 'sine', t, d: 0.09, v: 0.16 }));
      noise({ t: 0.05, d: 0.25, v: 0.06, f: 1200, f2: 500, q: 2 });
      for (let i = 0; i < 9; i++) tone({ f: hz(660, SCALE[i]), type: 'sine', t: 0.35 + i * 0.05, d: 0.35, v: 0.06 });
    },
    arm() { if (!ctx) return; tone({ f: 300, f2: 1200, type: 'sawtooth', d: 0.35, v: 0.06 }); tone({ f: 1760, type: 'sine', t: 0.3, d: 0.6, v: 0.1 }); },
    blast(level = 0) {  // the potion click itself: everything at once, bigger for stronger potions
      if (!ctx) return;
      tone({ f: 170, f2: 30, type: 'sine', d: 0.9, v: 0.7 });
      noise({ d: 0.7, v: 0.35, f: 7000, f2: 200, q: 0.5 });
      tone({ f: 200, f2: 2600, type: 'sawtooth', d: 0.5, v: 0.08 });
      for (let i = 0; i < 6 + level * 2; i++) tone({ f: hz(523, SCALE[i % SCALE.length] + (i > 5 ? 12 : 0)), type: 'triangle', t: 0.1 + i * 0.045, d: 0.5, v: 0.08 });
    },
    blackout(tier = 7) {
      if (!ctx) return;
      tone({ f: 90, f2: 24, type: 'sine', d: 1.6, v: 0.7 });
      noise({ d: 0.5, v: 0.25, f: 3000, f2: 90, q: 0.5, type: 'lowpass' });
    },
    crit() {
      if (!ctx) return;
      [0, 4, 7, 12].forEach((s, i) => tone({ f: hz(660, s), type: 'sawtooth', t: i * 0.035, d: 0.25, v: 0.07 }));
      noise({ d: 0.25, v: 0.12, f: 3000, f2: 9000, q: 0.8 });
    },
    /* the "cracking" layer of a mining hit. kind = zone.snd, prog = 0..1 progress to shatter */
    crack(kind = 'stone', prog = 0, quiet = false) {
      if (!ctx) return;
      const v = (0.10 + 0.16 * prog) * (quiet ? 0.4 : 1), r = Math.random();
      switch (kind) {
        case 'ore': // metallic tink + dull grind
          noise({ d: 0.05, v: v * 1.2, f: 3800, f2: 2200, q: 2 });
          tone({ f: 1500 + r * 500, f2: 900, type: 'square', d: 0.07, v: v * 0.35 });
          tone({ f: 2400 + r * 900, type: 'sine', d: 0.28, v: v * 0.25 });
          tone({ f: 320, f2: 150, type: 'sawtooth', d: 0.09, v: v * 0.3 });
          break;
        case 'glass': // brittle glass snap + shimmering ring
          noise({ d: 0.05, v: v * 1.3, f: 7000, f2: 11000, q: 0.6, type: 'highpass' });
          [3100, 4700, 6200].forEach((f, i) => tone({ f: f * (0.96 + r * 0.08), type: 'sine', t: i * 0.012, d: 0.22 + i * 0.05, v: v * 0.22 }));
          tone({ f: 900, f2: 500, type: 'triangle', d: 0.04, v: v * 0.3 });
          break;
        case 'lava': // wet rumble, crackle and pops
          noise({ d: 0.22, v: v * 1.1, f: 500, f2: 180, q: 0.8, type: 'lowpass' });
          noise({ d: 0.16, v: v * 0.4, f: 5200, q: 0.5, type: 'highpass' });
          for (let i = 0; i < 3; i++) noise({ t: 0.02 + Math.random() * 0.15, d: 0.02, v: v * 0.9, f: 900 + Math.random() * 1600, q: 3 });
          tone({ f: 90, f2: 45, type: 'sine', d: 0.18, v: v * 0.6 });
          break;
        case 'void': // gravity-bent snap
          tone({ f: 1200 + r * 300, f2: 55, type: 'sine', d: 0.34, v: v * 0.5 });
          tone({ f: 1210 + r * 300, f2: 62, type: 'sine', d: 0.34, v: v * 0.4 });
          noise({ d: 0.22, v: v * 0.7, f: 2600, f2: 140, q: 1.4 });
          break;
        default: // stone: dry crack, thump and falling grit
          noise({ d: 0.09, v: v * 1.3, f: 1900, f2: 450, q: 0.9 });
          tone({ f: 150, f2: 62, type: 'sine', d: 0.13, v: v * 0.7 });
          noise({ t: 0.03, d: 0.02, v: v * 0.5, f: 4200, q: 1.5 });
          noise({ t: 0.07 + r * 0.03, d: 0.02, v: v * 0.4, f: 3600, q: 1.5 });
      }
    },
    /* the crystal breaks apart - same family as crack() but big */
    shatter(kind = 'stone') {
      if (!ctx) return;
      tone({ f: 200, f2: 40, type: 'sine', d: 0.4, v: 0.5 });
      switch (kind) {
        case 'ore':
          noise({ d: 0.35, v: 0.3, f: 4500, f2: 800, q: 1.2 });
          for (let i = 0; i < 8; i++) tone({ f: 1400 + Math.random() * 2600, type: 'sine', t: 0.03 + i * 0.045, d: 0.3, v: 0.05 });
          break;
        case 'glass':
          noise({ d: 0.5, v: 0.32, f: 9000, f2: 2500, q: 0.5, type: 'highpass' });
          for (let i = 0; i < 12; i++) tone({ f: 2500 + Math.random() * 5000, type: 'sine', t: 0.02 + i * 0.04, d: 0.35, v: 0.045 });
          break;
        case 'lava':
          noise({ d: 0.7, v: 0.35, f: 700, f2: 120, q: 0.6, type: 'lowpass' });
          for (let i = 0; i < 6; i++) noise({ t: i * 0.06, d: 0.03, v: 0.35, f: 800 + Math.random() * 1800, q: 3 });
          break;
        case 'void':
          tone({ f: 1400, f2: 35, type: 'sine', d: 0.8, v: 0.4 });
          tone({ f: 1420, f2: 40, type: 'sine', d: 0.8, v: 0.35 });
          noise({ d: 0.7, v: 0.3, f: 3000, f2: 100, q: 1.2 });
          break;
        default:
          noise({ d: 0.45, v: 0.32, f: 4200, f2: 300, q: 0.6 });
          for (let i = 0; i < 6; i++) noise({ t: 0.05 + i * 0.05, d: 0.03, v: 0.16, f: 2500 + Math.random() * 2500, q: 1.5 });
      }
      [0, 7, 12, 19].forEach((s, i) => tone({ f: hz(523, s), type: 'triangle', t: 0.06 + i * 0.05, d: 0.35, v: 0.07 }));
    },
    buy() {
      if (!ctx) return;
      tone({ f: 523, type: 'square', d: 0.08, v: 0.07 });
      tone({ f: 784, type: 'square', t: 0.07, d: 0.08, v: 0.07 });
      tone({ f: 1047, type: 'triangle', t: 0.14, d: 0.25, v: 0.1 });
    },
    deny() {
      if (!ctx) return;
      tone({ f: 160, f2: 110, type: 'sawtooth', d: 0.16, v: 0.08 });
    },
    tab() {
      if (!ctx) return;
      tone({ f: 1400, f2: 900, type: 'square', d: 0.04, v: 0.04 });
    },
    /* cutscene build-up: rising sweep + accelerating heartbeat. Routed through cutBus so a skip can kill it. */
    riser(tier, revealSec, snd) {
      if (!ctx) return;
      const st = ctx.currentTime, grand = tier >= G.GRAND;
      cutBus.gain.cancelScheduledValues(st); cutBus.gain.setValueAtTime(1, st);
      if (snd && G.sfx) { G.sfx.rise(snd, tier, revealSec); return; }
      const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(55, st);
      o.frequency.exponentialRampToValueAtTime(220 + tier * 90, st + revealSec);
      fl.type = 'lowpass'; fl.Q.value = 6;
      fl.frequency.setValueAtTime(180, st);
      fl.frequency.exponentialRampToValueAtTime(3500 + tier * 900, st + revealSec);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.16, st + revealSec * 0.92);
      g.gain.exponentialRampToValueAtTime(0.0001, st + revealSec + 0.05);
      o.connect(fl); fl.connect(g); g.connect(cutBus);
      o.start(st); o.stop(st + revealSec + 0.1);
      noise({ d: revealSec, v: 0.07, f: 300, f2: 6000, q: 1.5, out: cutBus });
      if (grand) { // slow choir-like pad under the whole build-up
        [0, 7, 12, 15].forEach((s, i) => {
          const p = ctx.createOscillator(), pg = ctx.createGain();
          p.type = 'sawtooth'; p.frequency.value = hz(110, s) * (1 + i * 0.002);
          const pf = ctx.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 900;
          pg.gain.setValueAtTime(0.0001, st);
          pg.gain.exponentialRampToValueAtTime(0.05, st + revealSec * 0.8);
          pg.gain.exponentialRampToValueAtTime(0.0001, st + revealSec + 0.05);
          p.connect(pf); pf.connect(pg); pg.connect(cutBus); p.start(st); p.stop(st + revealSec + 0.1);
        });
      }
      let tt = 0, gap = grand ? 0.9 : 0.55;
      while (tt < revealSec - 0.2) {
        tone({ f: 90, f2: 45, type: 'sine', t: tt, d: 0.2, v: 0.35, out: cutBus });
        tt += gap; gap = Math.max(0.16, gap * (grand ? 0.9 : 0.86));
      }
    },
    /* the moment the name appears: boom + chord that grows with the tier */
    reveal(tier, snd) {
      if (!ctx) return;
      if (snd && G.sfx) { G.sfx.reveal(snd, tier, 1); return; }
      const grand = tier >= G.GRAND;
      tone({ f: 150, f2: 26, type: 'sine', d: grand ? 2 : 1.1, v: 0.9 });
      noise({ d: grand ? 1.6 : 0.9, v: 0.4, f: 6000, f2: 200, q: 0.4 });
      const notes = [0, 7, 12, 16, 19, 24, 28, 31, 36].slice(0, Math.min(9, 3 + tier));
      notes.forEach((s, i) => {
        tone({ f: hz(261.6, s), type: 'triangle', t: 0.05 + i * 0.07, d: grand ? 3 : 1.6, v: 0.11 });
        tone({ f: hz(523.2, s), type: 'sine', t: 0.05 + i * 0.07, d: grand ? 2.4 : 1.2, v: 0.07 });
      });
      for (let i = 0; i < 4 + tier * 3; i++) tone({ f: hz(1568, SCALE[i % SCALE.length]), type: 'sine', t: 0.3 + i * 0.09, d: 0.3, v: 0.05 });
    },
    stopCut() {
      if (!ctx || !cutBus) return;
      const t = ctx.currentTime;
      cutBus.gain.cancelScheduledValues(t); cutBus.gain.setValueAtTime(cutBus.gain.value, t);
      cutBus.gain.linearRampToValueAtTime(0.0001, t + 0.08);
    },
    /* compact win jingle for cutscenes the player switched off */
    win(tier = 0, snd) {
      if (!ctx) return;
      if (snd && G.sfx) { G.sfx.reveal(snd, tier, 0.55, true); return; }
      const notes = [0, 4, 7, 12, 16, 19, 24].slice(0, 3 + Math.min(4, tier));
      notes.forEach((s, i) => tone({ f: hz(523, s), type: 'triangle', t: i * 0.06, d: 0.4, v: 0.09 }));
      tone({ f: 120, f2: 50, type: 'sine', d: 0.3, v: 0.4 });
    },
    /* coins pouring into the wallet after a cutscene */
    pour(n = 10) {
      if (!ctx) return;
      for (let i = 0; i < n; i++) {
        const f = hz(880, SCALE[i % SCALE.length]);
        tone({ f, type: 'triangle', t: i * 0.045, d: 0.12, v: 0.06 });
      }
    },
  };
})();
