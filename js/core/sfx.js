/*
  G.sfx - the cutscene sound designer.
  Every cutscene owns a `snd` recipe:   { rise, hit, tail, amb, root, scale, spd }   (any part optional)
     rise  : build-up   shimmer whoosh choir rumble engine drone clang static crackle water ticks wind glass strings heart
                        bowed bellsrise arpeggio swarm tidal gravity chant granular hum drums breath crystalline
     hit   : the impact when the name shows   boom gong bell glass zap choirstab crash whomp anvil splash ignite harp horn cathedral quake
                        taiko organ laser celesta synthstab bowl thunder chimes roar orchestra toll
     tail  : what rings out afterwards   bells pad sparkle arp echo musicbox piano chime choirpad pluck none
     amb   : ambience under the build-up   drip wind fire water space forest rain machine whisper sea choirdrone none
     root  : base note in Hz   scale : major minor lydian phrygian dorian pent whole hirajoshi harmonic   spd : tempo of rhythmic risers
  Missing parts are derived from the scene (env / entry / finale) and a hash of its id, so every cutscene ends up different.
  In a cutscene:  snd: 'rise:clang hit:anvil tail:echo amb:fire root:196 scale:phrygian'
*/
G.sfx = (() => {
  const A = G.audio;
  const SC = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10], pent: [0, 2, 4, 7, 9], whole: [0, 2, 4, 6, 8, 10], hirajoshi: [0, 2, 3, 7, 8], harmonic: [0, 2, 3, 5, 7, 8, 11],
  };
  const note = (root, sc, deg) => {
    const s = SC[sc] || SC.major, n = s.length, oct = Math.floor(deg / n), i = ((deg % n) + n) % n;
    return root * Math.pow(2, (s[i] + 12 * oct) / 12);
  };
  const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const R = Math.random;

  /* ---- synth voice with optional filter / FM / tremolo ---- */
  function syn(o) {
    const C = A.core(); if (!C) return;
    const { ctx } = C, { type = 'sine', f: f0 = 440, f2: g2 = 0, t = 0, d = 1, v = 0.1, a = 0.02, out, fl, ff = 1000, ff2 = 0, q = 1, det = 0, fm = 0, fmr = 2, trem = 0, tremr = 6 } = o;
    const f = Math.min(f0, 18000), f2 = g2 ? Math.min(g2, 18000) : 0;
    const st = ctx.currentTime + t, at = Math.min(Math.max(a, 0.003), d * 0.95);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, st); if (f2) osc.frequency.exponentialRampToValueAtTime(f2, st + d); osc.detune.value = det;
    g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(v, st + at); g.gain.exponentialRampToValueAtTime(0.0001, st + d);
    if (fm) {
      const m = ctx.createOscillator(), mg = ctx.createGain();
      m.frequency.setValueAtTime(f * fmr, st); if (f2) m.frequency.exponentialRampToValueAtTime(f2 * fmr, st + d);
      mg.gain.setValueAtTime(f * fm, st); mg.gain.exponentialRampToValueAtTime(Math.max(1, f * fm * 0.05), st + d);
      m.connect(mg); mg.connect(osc.frequency); m.start(st); m.stop(st + d + 0.05);
    }
    if (fl) {
      const b = ctx.createBiquadFilter(); b.type = fl; b.Q.value = q; b.frequency.setValueAtTime(ff, st);
      if (ff2) b.frequency.exponentialRampToValueAtTime(ff2, st + d);
      osc.connect(b); b.connect(g);
    } else osc.connect(g);
    if (trem) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = tremr; lg.gain.value = trem * v; l.connect(lg); lg.connect(g.gain); l.start(st); l.stop(st + d + 0.05); }
    g.connect(out); osc.start(st); osc.stop(st + d + 0.05);
  }
  const N = o => A.noise(o);
  const T = o => A.tone(o);

  /* ================= RISERS (build-up) ================= */
  const rise = {
    shimmer(p) {
      for (let i = 0; i < 6; i++) { const f = note(p.root * 2, p.sc, i * 2); T({ f, f2: f * 1.5, type: 'sine', t: i * 0.05, d: p.dur, v: 0.03, a: p.dur * 0.9, out: p.out }); }
      for (let i = 0; i < 26; i++) { const t = p.dur * Math.pow(i / 26, 1.7); T({ f: note(p.root * 8, p.sc, (i * 3) % 10), type: 'sine', t, d: 0.25, v: 0.02 + 0.03 * (t / p.dur), out: p.out }); }
    },
    whoosh(p) {
      N({ d: p.dur, v: 0.16, f: 180, f2: 5200, q: 2.4, a: p.dur * 0.92, out: p.out });
      N({ d: p.dur, v: 0.1, f: 60, f2: 700, q: 0.7, type: 'lowpass', a: p.dur * 0.9, out: p.out });
    },
    choir(p) {
      [0, 2, 4, 7].forEach((deg, i) => {
        const f = note(p.root, p.sc, deg);
        [-9, 9].forEach(det => { syn({ type: 'sawtooth', f, f2: f * 1.06, t: i * 0.08, d: p.dur, v: 0.028, a: p.dur * 0.9, out: p.out, fl: 'bandpass', ff: 700 + i * 180, ff2: 1100 + i * 250, q: 4, det }); });
      });
      syn({ type: 'sine', f: p.root / 2, f2: p.root, d: p.dur, v: 0.05, a: p.dur * 0.9, out: p.out });
    },
    rumble(p) {
      syn({ type: 'sine', f: 34, f2: 78, d: p.dur, v: 0.32, a: p.dur * 0.9, out: p.out });
      N({ d: p.dur, v: 0.14, f: 90, f2: 500, q: 0.8, type: 'lowpass', a: p.dur * 0.9, out: p.out });
      for (let i = 0; i < 16; i++) N({ t: R() * p.dur, d: 0.06, v: 0.05, f: 250 + R() * 900, q: 2, out: p.out });
    },
    engine(p) {
      syn({ type: 'sawtooth', f: 50, f2: 300 + p.tier * 30, d: p.dur, v: 0.09, a: p.dur * 0.9, out: p.out, fm: 1.6, fmr: 1.5, fl: 'lowpass', ff: 300, ff2: 3200, q: 3 });
      syn({ type: 'square', f: 25, f2: 150, d: p.dur, v: 0.05, a: p.dur * 0.9, out: p.out, trem: 0.8, tremr: 9 });
    },
    drone(p) {
      const f = p.root / 2;
      [1, 1.0595, 1.4142].forEach((r, i) => syn({ type: 'sawtooth', f: f * r, d: p.dur, v: 0.045, a: p.dur * 0.9, out: p.out, fl: 'lowpass', ff: 160, ff2: 1300, q: 2, det: i * 6, trem: 0.4, tremr: 3 + i }));
      T({ f: p.root * 4, f2: p.root * 6, type: 'sine', d: p.dur, v: 0.02, a: p.dur * 0.9, out: p.out });
    },
    clang(p) {
      let t = 0, gap = 0.75;
      while (t < p.dur - 0.15) {
        N({ t, d: 0.09, v: 0.16, f: 4200, q: 1.2, out: p.out });
        [1, 2.76, 5.4].forEach((r, i) => T({ f: p.root * 3 * r, type: 'sine', t, d: 0.5 - i * 0.12, v: 0.06 / (i + 1), out: p.out }));
        T({ f: 90, f2: 45, type: 'sine', t, d: 0.2, v: 0.3, out: p.out });
        t += gap; gap = Math.max(0.16, gap * 0.86);
      }
    },
    static(p) {
      syn({ type: 'sine', f: 50, f2: 900, d: p.dur, v: 0.05, a: p.dur * 0.9, out: p.out });
      for (let i = 0; i < 70; i++) { const t = p.dur * Math.sqrt(R()); N({ t, d: 0.03 + R() * 0.05, v: 0.05 + 0.08 * (t / p.dur), f: 2500 + R() * 6000, q: 3, type: 'highpass', out: p.out }); }
    },
    crackle(p) {
      N({ d: p.dur, v: 0.12, f: 70, f2: 380, q: 0.7, type: 'lowpass', a: p.dur * 0.9, out: p.out });
      for (let i = 0; i < 90; i++) { const t = p.dur * Math.sqrt(R()); N({ t, d: 0.03, v: 0.04 + 0.09 * R() * (t / p.dur + 0.3), f: 700 + R() * 2600, q: 3, out: p.out }); }
    },
    water(p) {
      N({ d: p.dur, v: 0.09, f: 500, f2: 2600, q: 0.9, a: p.dur * 0.9, out: p.out });
      for (let i = 0; i < 46; i++) { const t = p.dur * Math.sqrt(R()), f = 300 + R() * 900; T({ f, f2: f * 1.7, type: 'sine', t, d: 0.09, v: 0.05 + 0.05 * (t / p.dur), out: p.out }); }
      syn({ type: 'sine', f: 60, f2: 110, d: p.dur, v: 0.12, a: p.dur * 0.9, out: p.out });
    },
    ticks(p) {
      let t = 0, gap = 0.5, k = 0;
      while (t < p.dur - 0.1) {
        N({ t, d: 0.025, v: 0.14, f: k % 2 ? 2600 : 3400, q: 5, out: p.out });
        T({ f: k % 2 ? 900 : 1300, type: 'sine', t, d: 0.05, v: 0.06, out: p.out });
        t += gap; gap = Math.max(0.085, gap * 0.94); k++;
      }
      syn({ type: 'sine', f: 200, f2: 1700, d: p.dur, v: 0.04, a: p.dur * 0.9, out: p.out });
    },
    wind(p) {
      N({ d: p.dur, v: 0.14, f: 300, f2: 1100, q: 5, a: p.dur * 0.8, out: p.out });
      N({ d: p.dur, v: 0.09, f: 900, f2: 350, q: 3, a: p.dur * 0.6, out: p.out });
      syn({ type: 'sine', f: 650, f2: 1150, d: p.dur, v: 0.025, a: p.dur * 0.9, out: p.out, trem: 0.7, tremr: 4 });
    },
    glass(p) {
      for (let i = 0; i < 28; i++) { const t = p.dur * Math.pow(i / 28, 1.9); T({ f: note(p.root * 4, p.sc, Math.floor(R() * 9)), type: 'sine', t, d: 0.6, v: 0.03 + 0.05 * (t / p.dur), out: p.out }); }
      N({ d: p.dur, v: 0.05, f: 6000, f2: 11000, q: 1, type: 'highpass', a: p.dur * 0.9, out: p.out });
    },
    strings(p) {
      [0.5, 1, 1.5, 2, 3].forEach((r, i) => syn({ type: 'sawtooth', f: p.root * r, d: p.dur, v: 0.03, a: p.dur * 0.9, out: p.out, fl: 'lowpass', ff: 300, ff2: 3200, q: 1, det: i * 4 - 8, trem: 0.35, tremr: 5.5 }));
    },
    heart(p) {
      let t = 0, gap = 0.6;
      while (t < p.dur - 0.2) { T({ f: 90, f2: 42, type: 'sine', t, d: 0.2, v: 0.36, out: p.out }); T({ f: 80, f2: 40, type: 'sine', t: t + 0.13, d: 0.18, v: 0.22, out: p.out }); t += gap; gap = Math.max(0.24, gap * 0.9); }
      syn({ type: 'sawtooth', f: 70, f2: 240, d: p.dur, v: 0.05, a: p.dur * 0.9, out: p.out, fl: 'lowpass', ff: 200, ff2: 2200, q: 3 });
    },
  };

  /* ================= AMBIENCE ================= */
  const amb = {
    drip(p) { for (let i = 0; i < p.dur * 1.2; i++) { const t = R() * p.dur, f = 900 + R() * 900; T({ f, f2: f * 0.6, type: 'sine', t, d: 0.35, v: 0.04, out: p.out }); } },
    wind(p) { N({ d: p.dur, v: 0.05, f: 500, f2: 800, q: 2, a: p.dur * 0.5, out: p.out }); },
    fire(p) { for (let i = 0; i < p.dur * 9; i++) N({ t: R() * p.dur, d: 0.03, v: 0.035, f: 900 + R() * 2200, q: 2, out: p.out }); },
    water(p) { N({ d: p.dur, v: 0.04, f: 400, f2: 1200, q: 0.8, a: p.dur * 0.5, out: p.out }); for (let i = 0; i < p.dur * 3; i++) { const f = 400 + R() * 800; T({ f, f2: f * 1.5, type: 'sine', t: R() * p.dur, d: 0.08, v: 0.02, out: p.out }); } },
    space(p) { syn({ type: 'sine', f: 55, d: p.dur, v: 0.06, a: p.dur * 0.5, out: p.out }); T({ f: 3200, f2: 3400, type: 'sine', d: p.dur, v: 0.006, a: p.dur * 0.6, out: p.out }); },
    forest(p) { for (let i = 0; i < p.dur * 2; i++) { const t = R() * p.dur, f = 2400 + R() * 1500; T({ f, f2: f * 1.2, type: 'sine', t, d: 0.06, v: 0.02, out: p.out }); T({ f: f * 1.1, f2: f * 1.3, type: 'sine', t: t + 0.09, d: 0.06, v: 0.02, out: p.out }); } },
    rain(p) { N({ d: p.dur, v: 0.06, f: 5000, q: 0.5, type: 'highpass', a: p.dur * 0.3, out: p.out }); },
  };

  /* ================= HITS (the moment of reveal) ================= */
  const hit = {
    boom(p) {
      T({ f: 150, f2: 26, type: 'sine', d: 1.6, v: 0.9 * p.vol, out: p.out });
      N({ d: 1.1, v: 0.4 * p.vol, f: 6000, f2: 200, q: 0.4, out: p.out });
      T({ f: 60, f2: 24, type: 'sine', d: 2.2, v: 0.5 * p.vol, out: p.out });
    },
    gong(p) {
      N({ d: 0.15, v: 0.25 * p.vol, f: 2500, q: 0.6, out: p.out });
      [1, 1.47, 2.09, 2.56, 3.86, 5.44].forEach((r, i) => T({ f: p.root * r, type: 'sine', d: 3.4 - i * 0.3, v: 0.16 * p.vol / (1 + i * 0.5), out: p.out }));
      T({ f: 70, f2: 45, type: 'sine', d: 1.4, v: 0.6 * p.vol, out: p.out });
    },
    bell(p) {
      [0, 4, 7, 12].forEach((deg, i) => {
        const f = note(p.root * 2, p.sc, deg);
        syn({ type: 'sine', f, t: i * 0.09, d: 3, v: 0.16 * p.vol, a: 0.005, out: p.out, fm: 1.5, fmr: 3.5 });
        T({ f: f * 2, type: 'sine', t: i * 0.09, d: 1.6, v: 0.05 * p.vol, out: p.out });
      });
      T({ f: 90, f2: 40, type: 'sine', d: 1, v: 0.5 * p.vol, out: p.out });
    },
    glass(p) {
      N({ d: 0.9, v: 0.34 * p.vol, f: 9500, f2: 3000, q: 0.5, type: 'highpass', out: p.out });
      for (let i = 0; i < 16; i++) T({ f: note(p.root * 8, p.sc, Math.floor(R() * 10)), type: 'sine', t: i * 0.035, d: 0.7, v: 0.07 * p.vol, out: p.out });
      T({ f: 180, f2: 40, type: 'sine', d: 0.6, v: 0.5 * p.vol, out: p.out });
    },
    zap(p) {
      N({ d: 0.55, v: 0.4 * p.vol, f: 4500, f2: 300, q: 1.4, out: p.out });
      syn({ type: 'sawtooth', f: 2400, f2: 70, d: 0.45, v: 0.2 * p.vol, out: p.out });
      for (let i = 0; i < 10; i++) N({ t: 0.05 + R() * 0.5, d: 0.03, v: 0.14 * p.vol, f: 2000 + R() * 5000, q: 3, type: 'highpass', out: p.out });
      T({ f: 120, f2: 30, type: 'sine', d: 1.2, v: 0.6 * p.vol, out: p.out });
    },
    choirstab(p) {
      [0, 2, 4, 7, 9].forEach((deg, i) => [-8, 8].forEach(det => syn({ type: 'sawtooth', f: note(p.root, p.sc, deg), d: 2.8, v: 0.06 * p.vol, a: 0.12, out: p.out, fl: 'bandpass', ff: 800 + i * 150, q: 3, det })));
      T({ f: 110, f2: 34, type: 'sine', d: 1.4, v: 0.6 * p.vol, out: p.out });
    },
    crash(p) {
      N({ d: 2.4, v: 0.34 * p.vol, f: 6500, q: 0.4, type: 'highpass', out: p.out });
      N({ d: 1.5, v: 0.22 * p.vol, f: 3200, q: 0.6, out: p.out });
      T({ f: 100, f2: 30, type: 'sine', d: 1, v: 0.7 * p.vol, out: p.out });
    },
    whomp(p) {
      T({ f: 90, f2: 26, type: 'sine', d: 1.8, v: 1 * p.vol, out: p.out });
      N({ d: 1.4, v: 0.4 * p.vol, f: 260, f2: 60, q: 0.5, type: 'lowpass', out: p.out });
      syn({ type: 'sawtooth', f: 60, f2: 30, d: 1.2, v: 0.14 * p.vol, out: p.out, fl: 'lowpass', ff: 400, q: 2 });
    },
    anvil(p) {
      N({ d: 0.08, v: 0.4 * p.vol, f: 4000, q: 1, out: p.out });
      [1, 2.4, 3.9, 5.7, 7.3].forEach((r, i) => T({ f: p.root * 3 * r, type: 'sine', d: 1.8 - i * 0.25, v: 0.17 * p.vol / (1 + i * 0.6), out: p.out }));
      T({ f: 110, f2: 50, type: 'sine', d: 0.5, v: 0.6 * p.vol, out: p.out });
    },
    splash(p) {
      N({ d: 0.7, v: 0.38 * p.vol, f: 1400, f2: 6500, q: 0.8, out: p.out });
      for (let i = 0; i < 24; i++) { const f = 500 + R() * 1500; T({ f, f2: f * 1.8, type: 'sine', t: 0.05 + R() * 0.9, d: 0.09, v: 0.05 * p.vol, out: p.out }); }
      T({ f: 120, f2: 36, type: 'sine', d: 1.2, v: 0.6 * p.vol, out: p.out });
    },
    ignite(p) {
      N({ d: 1.8, v: 0.36 * p.vol, f: 300, f2: 4200, q: 1.2, a: 0.25, out: p.out });
      N({ d: 2.2, v: 0.22 * p.vol, f: 600, f2: 120, q: 0.6, type: 'lowpass', out: p.out });
      for (let i = 0; i < 24; i++) N({ t: R() * 1.8, d: 0.03, v: 0.1 * p.vol, f: 800 + R() * 2600, q: 3, out: p.out });
      T({ f: 100, f2: 32, type: 'sine', d: 1.5, v: 0.55 * p.vol, out: p.out });
    },
    harp(p) {
      for (let i = 0; i < 12; i++) { const f = note(p.root * 2, p.sc, i); T({ f, type: 'triangle', t: i * 0.055, d: 1.8, v: 0.1 * p.vol, out: p.out }); T({ f: f * 2, type: 'sine', t: i * 0.055, d: 1.2, v: 0.04 * p.vol, out: p.out }); }
      T({ f: 100, f2: 34, type: 'sine', d: 1.2, v: 0.5 * p.vol, out: p.out });
    },
    horn(p) {
      [0.5, 1, 1.5].forEach((r, i) => syn({ type: 'sawtooth', f: p.root * r, d: 2.4, v: 0.11 * p.vol, a: 0.13, out: p.out, fl: 'lowpass', ff: 300, ff2: 2600, q: 2, det: i * 5 }));
      T({ f: 120, f2: 30, type: 'sine', d: 1.6, v: 0.7 * p.vol, out: p.out });
    },
    cathedral(p) {
      [0.5, 1, 1.5, 2, 3, 4].forEach((r, i) => syn({ type: 'sine', f: p.root * r, d: 5, v: 0.1 * p.vol, a: 0.7, out: p.out }));
      T({ f: 90, f2: 30, type: 'sine', d: 1.8, v: 0.6 * p.vol, out: p.out });
      N({ d: 2.2, v: 0.14 * p.vol, f: 5000, f2: 900, q: 0.5, a: 0.3, out: p.out });
    },
    quake(p) {
      N({ d: 2.6, v: 0.5 * p.vol, f: 200, f2: 50, q: 0.6, type: 'lowpass', out: p.out });
      T({ f: 62, f2: 24, type: 'sine', d: 2.8, v: 0.9 * p.vol, out: p.out });
      for (let i = 0; i < 18; i++) N({ t: 0.1 + R() * 2.2, d: 0.06, v: 0.1 * p.vol, f: 250 + R() * 1200, q: 2, out: p.out });
    },
  };

  /* ================= TAILS ================= */
  const tail = {
    bells(p) { const n = 5 + p.tier; for (let i = 0; i < n; i++) { const f = note(p.root * 4, p.sc, Math.floor(R() * 9)); syn({ type: 'sine', f, t: 0.5 + i * (0.22 + R() * 0.12), d: 1.8, v: 0.06 * p.vol, out: p.out, fm: 1.2, fmr: 3.5 }); } },
    pad(p) { [0, 2, 4, 6].forEach(deg => syn({ type: 'triangle', f: note(p.root * 2, p.sc, deg), t: 0.3, d: 4.5, v: 0.05 * p.vol, a: 1.6, out: p.out })); },
    sparkle(p) { const n = 14 + p.tier * 3; for (let i = 0; i < n; i++) T({ f: note(p.root * 16, p.sc, Math.floor(R() * 8)), type: 'sine', t: 0.3 + R() * 2.4, d: 0.3, v: 0.03 * p.vol, out: p.out }); },
    arp(p) { for (let i = 0; i < 14; i++) { const deg = [0, 2, 4, 7, 4, 2][i % 6] + (i > 6 ? 7 : 0); T({ f: note(p.root * 2, p.sc, deg), type: 'triangle', t: 0.5 + i * 0.11, d: 0.5, v: 0.06 * p.vol, out: p.out }); } },
    echo(p) { const m = [0, 4, 2, 5]; for (let r = 0; r < 4; r++) m.forEach((deg, i) => T({ f: note(p.root * 4, p.sc, deg), type: 'sine', t: 0.6 + r * 0.75 + i * 0.13, d: 0.5, v: 0.08 * p.vol * Math.pow(0.55, r), out: p.out })); },
    none() {},
  };

  /* ================= MORE VOICES (round 2) ================= */
  Object.assign(rise, {
    bowed(p) {
      [0, 4, 7].forEach((deg, i) => { const f = note(p.root, p.sc, deg); syn({ type: 'sawtooth', f: f * 0.5, f2: f, t: i * 0.1, d: p.dur, v: 0.04, a: p.dur * 0.9, out: p.out, fl: 'lowpass', ff: 500, ff2: 2600, q: 1, trem: 0.25, tremr: 5.5 }); });
    },
    bellsrise(p) {
      let t = 0, gap = 0.9 * (p.spd || 1), i = 0;
      while (t < p.dur - 0.2) { syn({ type: 'sine', f: note(p.root * 2, p.sc, (i * 2) % 9), t, d: 1.5, v: 0.05 + 0.1 * (t / p.dur), a: 0.005, out: p.out, fm: 1.4, fmr: 3.5 }); t += gap; gap = Math.max(0.14, gap * 0.87); i++; }
    },
    arpeggio(p) {
      let t = 0, gap = 0.24 * (p.spd || 1), i = 0;
      while (t < p.dur - 0.15) { T({ f: note(p.root * 2, p.sc, [0, 2, 4, 7, 4, 2][i % 6] + Math.floor(i / 6) * 2), type: 'square', t, d: 0.14, v: 0.03 + 0.04 * (t / p.dur), out: p.out }); t += gap; gap = Math.max(0.05, gap * 0.94); i++; }
    },
    swarm(p) {
      for (let i = 0; i < 70; i++) { const t = p.dur * Math.pow(R(), 0.7), f = 1800 + R() * 3500; T({ f, f2: f * (1 + R() * 0.3), type: 'sine', t, d: 0.25, v: 0.03 + 0.04 * (t / p.dur), out: p.out }); }
      N({ d: p.dur, v: 0.05, f: 3000, f2: 6000, q: 3, a: p.dur * 0.9, out: p.out });
    },
    tidal(p) {
      for (let w = 0; w < Math.floor(p.dur / 1.4); w++) N({ t: w * 1.4, d: 1.6, v: 0.07 + 0.1 * ((w * 1.4) / p.dur), f: 300, f2: 2400, q: 1.2, a: 0.9, out: p.out });
      syn({ type: 'sine', f: 45, f2: 90, d: p.dur, v: 0.18, a: p.dur * 0.9, out: p.out });
    },
    gravity(p) {
      syn({ type: 'sine', f: 190, f2: 30, d: p.dur, v: 0.2, a: p.dur * 0.9, out: p.out });
      syn({ type: 'sawtooth', f: p.root, f2: p.root / 4, d: p.dur, v: 0.05, a: p.dur * 0.8, out: p.out, fl: 'lowpass', ff: 1500, ff2: 120, q: 2 });
      N({ d: p.dur, v: 0.08, f: 1200, f2: 90, q: 0.7, type: 'lowpass', a: p.dur * 0.85, out: p.out });
    },
    chant(p) {
      [0.5, 0.75, 1].forEach((r, i) => syn({ type: 'sawtooth', f: p.root * r, f2: p.root * r * 1.02, d: p.dur, v: 0.05, a: p.dur * 0.9, out: p.out, fl: 'bandpass', ff: 500 + i * 120, ff2: 900 + i * 150, q: 6, det: i * 7, trem: 0.5, tremr: 4 + i }));
    },
    granular(p) {
      for (let i = 0; i < 220; i++) { const t = p.dur * Math.pow(R(), 0.55); N({ t, d: 0.04, v: 0.03 + 0.06 * (t / p.dur), f: 1500 + R() * 5000, q: 2, out: p.out }); }
    },
    hum(p) {
      [1, 2, 3, 4].forEach((r, i) => syn({ type: 'sawtooth', f: 60 * r, f2: 60 * r * 3, d: p.dur, v: 0.04 / (i + 1), a: p.dur * 0.9, out: p.out, fl: 'lowpass', ff: 400, ff2: 3000, q: 3, trem: 0.6, tremr: 50 }));
    },
    drums(p) {
      let t = 0, gap = 0.5 * (p.spd || 1), i = 0;
      while (t < p.dur - 0.1) { T({ f: i % 2 ? 110 : 80, f2: 50, type: 'sine', t, d: 0.25, v: 0.35, out: p.out }); if (i % 4 === 3) N({ t, d: 0.12, v: 0.1, f: 1800, q: 1, out: p.out }); t += gap; gap = Math.max(0.1, gap * 0.9); i++; }
    },
    breath(p) {
      for (let i = 0; i < Math.floor(p.dur / 1.6); i++) N({ t: i * 1.6, d: 1.4, v: 0.07 + 0.06 * ((i * 1.6) / p.dur), f: 800 + i * 150, f2: 1600 + i * 250, q: 1.5, a: 0.6, out: p.out });
    },
    crystalline(p) {
      for (let i = 0; i < 40; i++) { const t = p.dur * Math.pow(i / 40, 1.6); syn({ type: 'sine', f: note(p.root * 4, p.sc, Math.floor(R() * 10)), t, d: 0.7, v: 0.025 + 0.04 * (t / p.dur), out: p.out, fm: 0.9, fmr: 2.4 }); }
    },
  });
  Object.assign(amb, {
    machine(p) { for (let i = 0; i < p.dur * 2; i++) N({ t: i * 0.5, d: 0.06, v: 0.03, f: 600, q: 5, out: p.out }); syn({ type: 'sine', f: 60, d: p.dur, v: 0.05, a: p.dur * 0.5, out: p.out }); },
    whisper(p) { N({ d: p.dur, v: 0.05, f: 2500, f2: 3600, q: 7, a: p.dur * 0.5, out: p.out }); N({ d: p.dur, v: 0.03, f: 1400, f2: 900, q: 8, a: p.dur * 0.6, out: p.out }); },
    sea(p) { for (let i = 0; i < p.dur / 2.2; i++) N({ t: i * 2.2, d: 2.2, v: 0.05, f: 200, f2: 900, q: 1, a: 1.0, out: p.out }); },
    choirdrone(p) { syn({ type: 'sawtooth', f: p.root / 2, d: p.dur, v: 0.025, a: p.dur * 0.5, out: p.out, fl: 'bandpass', ff: 600, q: 5 }); },
  });
  Object.assign(hit, {
    taiko(p) {
      [0, 0.16].forEach(t => { T({ f: 95, f2: 38, type: 'sine', t, d: 1.1, v: 0.85 * p.vol, out: p.out }); N({ t, d: 0.12, v: 0.35 * p.vol, f: 900, q: 0.8, out: p.out }); });
      T({ f: 70, f2: 30, type: 'sine', t: 0.32, d: 1.6, v: 0.9 * p.vol, out: p.out });
    },
    organ(p) {
      [0.5, 1, 1.5, 2, 3].forEach(r => syn({ type: 'square', f: p.root * r, d: 3.4, v: 0.05 * p.vol, a: 0.04, out: p.out, fl: 'lowpass', ff: 1800, q: 0.7, trem: 0.15, tremr: 6 }));
      T({ f: 90, f2: 40, type: 'sine', d: 1.4, v: 0.5 * p.vol, out: p.out });
    },
    laser(p) {
      [0, 0.12, 0.24].forEach((t, i) => syn({ type: 'sawtooth', f: 3200 - i * 300, f2: 120, t, d: 0.5, v: 0.13 * p.vol, out: p.out, fl: 'lowpass', ff: 6000, ff2: 400, q: 4 }));
      N({ d: 0.7, v: 0.2 * p.vol, f: 6000, f2: 300, q: 1, out: p.out });
      T({ f: 120, f2: 30, type: 'sine', d: 1.2, v: 0.6 * p.vol, out: p.out });
    },
    celesta(p) {
      for (let i = 0; i < 10; i++) { const f = note(p.root * 4, p.sc, i); T({ f, type: 'sine', t: i * 0.045, d: 1.2, v: 0.09 * p.vol, out: p.out }); T({ f: f * 4, type: 'sine', t: i * 0.045, d: 0.3, v: 0.03 * p.vol, out: p.out }); }
      T({ f: 100, f2: 36, type: 'sine', d: 1.1, v: 0.5 * p.vol, out: p.out });
    },
    synthstab(p) {
      [0, 4, 7, 11].forEach(s => [-12, 12].forEach(det => syn({ type: 'sawtooth', f: p.root * 2 * Math.pow(2, s / 12), d: 1.2, v: 0.06 * p.vol, a: 0.005, out: p.out, fl: 'lowpass', ff: 6000, ff2: 300, q: 5, det })));
      T({ f: 110, f2: 34, type: 'sine', d: 1.2, v: 0.7 * p.vol, out: p.out });
    },
    bowl(p) {
      [1, 2.02, 2.99, 4.1].forEach((r, i) => { T({ f: p.root * 2 * r, type: 'sine', d: 4 - i * 0.4, v: 0.14 * p.vol, out: p.out, a: 0.01 }); T({ f: p.root * 2 * r + 2 + i, type: 'sine', d: 4 - i * 0.4, v: 0.12 * p.vol, out: p.out }); });
      N({ d: 0.1, v: 0.2 * p.vol, f: 3000, q: 1, out: p.out });
    },
    thunder(p) {
      N({ d: 0.3, v: 0.6 * p.vol, f: 6000, f2: 800, q: 0.5, type: 'highpass', out: p.out });
      for (let i = 0; i < 4; i++) N({ t: 0.25 + i * 0.4, d: 1.6, v: 0.4 * p.vol * Math.pow(0.6, i), f: 220, f2: 60, q: 0.7, type: 'lowpass', out: p.out });
      T({ f: 50, f2: 24, type: 'sine', t: 0.2, d: 2.4, v: 0.7 * p.vol, out: p.out });
    },
    chimes(p) {
      for (let i = 0; i < 18; i++) T({ f: note(p.root * 8, p.sc, Math.floor(R() * 10)), type: 'sine', t: i * 0.05 + R() * 0.03, d: 1.4, v: 0.06 * p.vol, out: p.out });
      T({ f: 110, f2: 36, type: 'sine', d: 1.1, v: 0.5 * p.vol, out: p.out });
    },
    roar(p) {
      N({ d: 1.6, v: 0.5 * p.vol, f: 300, f2: 900, q: 3, a: 0.08, out: p.out });
      syn({ type: 'sawtooth', f: 70, f2: 50, d: 1.6, v: 0.2 * p.vol, a: 0.06, out: p.out, fl: 'bandpass', ff: 500, ff2: 300, q: 4, trem: 0.8, tremr: 30 });
      T({ f: 100, f2: 28, type: 'sine', d: 1.6, v: 0.7 * p.vol, out: p.out });
    },
    orchestra(p) {
      [0.5, 1, 1.5, 2].forEach(r => syn({ type: 'sawtooth', f: p.root * r, d: 1.6, v: 0.09 * p.vol, a: 0.02, out: p.out, fl: 'lowpass', ff: 4200, ff2: 900, q: 1.5 }));
      [1, 1.5, 2, 3].forEach(r => syn({ type: 'sawtooth', f: p.root * r, d: 2.6, v: 0.04 * p.vol, a: 0.2, out: p.out, fl: 'lowpass', ff: 2500, q: 1, trem: 0.3, tremr: 6 }));
      T({ f: 80, f2: 34, type: 'sine', d: 1.3, v: 0.8 * p.vol, out: p.out }); N({ d: 0.3, v: 0.2 * p.vol, f: 5000, q: 0.6, out: p.out });
    },
    toll(p) {
      [1, 2.76, 5.4, 8.9].forEach((r, i) => syn({ type: 'sine', f: p.root * 1.5 * r, d: 4.2 - i * 0.7, v: 0.16 * p.vol / (1 + i * 0.5), a: 0.004, out: p.out, fm: 0.8, fmr: 1.41 }));
      N({ d: 0.06, v: 0.3 * p.vol, f: 2500, q: 1, out: p.out }); T({ f: 70, f2: 40, type: 'sine', d: 1.6, v: 0.6 * p.vol, out: p.out });
    },
  });
  Object.assign(tail, {
    musicbox(p) { const m = [0, 2, 4, 7, 4, 2, 0, 4]; for (let r = 0; r < 2; r++) m.forEach((deg, i) => { const f = note(p.root * 8, p.sc, deg); T({ f, type: 'sine', t: 0.6 + (r * 8 + i) * 0.2, d: 0.7, v: 0.05 * p.vol, out: p.out }); T({ f: f * 2, type: 'triangle', t: 0.6 + (r * 8 + i) * 0.2, d: 0.3, v: 0.02 * p.vol, out: p.out }); }); },
    piano(p) { [0, 4, 2, 5, 3, 7, 4, 9].forEach((deg, i) => { const f = note(p.root * 2, p.sc, deg); T({ f, type: 'triangle', t: 0.7 + i * 0.45, d: 2.2, v: 0.07 * p.vol, out: p.out }); T({ f: f * 2, type: 'sine', t: 0.7 + i * 0.45, d: 1.2, v: 0.03 * p.vol, out: p.out }); }); },
    chime(p) { for (let i = 0; i < 12; i++) T({ f: note(p.root * 8, p.sc, Math.floor(R() * 10)), type: 'sine', t: 0.5 + i * 0.18 + R() * 0.1, d: 1.6, v: 0.035 * p.vol, out: p.out }); },
    choirpad(p) { [0, 2, 4].forEach(deg => syn({ type: 'sawtooth', f: note(p.root, p.sc, deg), t: 0.3, d: 5, v: 0.035 * p.vol, a: 1.6, out: p.out, fl: 'bandpass', ff: 900, q: 4 })); },
    pluck(p) { [0, 2, 4, 7, 9, 7, 4, 2, 0, -3].forEach((deg, i) => T({ f: note(p.root * 2, p.sc, deg), type: 'triangle', t: 0.5 + i * 0.16, d: 0.6, v: 0.07 * p.vol, a: 0.003, out: p.out })); },
  });

  /* ================= public ================= */
  const parse = s => {
    if (!s) return {};
    if (typeof s === 'object') return s;
    const o = {}; s.split(/\s+/).forEach(kv => { const [k, v] = kv.split(':'); if (k && v) o[k] = isNaN(+v) ? v : +v; }); return o;
  };
  const params = (snd, tier) => ({ root: snd.root || 220, sc: snd.scale || 'major', tier, spd: snd.spd || 1 });

  function withBus(kind, fn) {
    const C = A.core(); if (!C) return null;
    return fn(kind === 'cut' ? C.cutBus : C.hitBus);
  }

  /* pick a voice for anything the recipe left open */
  const RISE_BY_ENTRY = {
    rise: ['shimmer', 'strings', 'glass', 'bowed', 'crystalline', 'breath'], drop: ['whoosh', 'rumble', 'wind', 'gravity', 'granular'],
    emerge: ['choir', 'shimmer', 'drone', 'chant', 'swarm', 'arpeggio'], geode: ['rumble', 'drone', 'heart', 'drums', 'hum'],
    orbit: ['engine', 'strings', 'whoosh', 'arpeggio', 'bellsrise'], unveil: ['drone', 'choir', 'wind', 'breath', 'chant', 'hum'],
    forge: ['clang', 'drums'], lightning: ['static', 'rumble', 'hum', 'granular'], ignite: ['crackle', 'whoosh', 'drums'],
    tide: ['water', 'wind', 'rumble', 'tidal', 'breath'],
  };
  const HIT_BY_FINALE = {
    nova: ['boom', 'crash', 'horn', 'orchestra', 'taiko', 'synthstab'], pulse: ['gong', 'bell', 'cathedral', 'bowl', 'toll', 'celesta'],
    beam: ['choirstab', 'cathedral', 'horn', 'organ', 'orchestra'], shatter: ['glass', 'crash', 'anvil', 'chimes', 'laser'],
    bloom: ['harp', 'bell', 'choirstab', 'celesta', 'chimes'], quake: ['quake', 'whomp', 'anvil', 'taiko', 'roar', 'thunder'],
    sweep: ['bell', 'whomp', 'harp', 'laser', 'synthstab', 'toll'], implode: ['zap', 'whomp', 'boom', 'laser', 'roar'],
  };
  const TAIL_BY_HERO = {
    brilliant: ['bells', 'chime', 'musicbox', 'piano'], cluster: ['pad', 'choirpad', 'chime'], orb: ['sparkle', 'musicbox', 'choirpad'], nugget: ['echo', 'pluck', 'piano'],
    spire: ['arp', 'pluck', 'bells'], cube: ['echo', 'pluck'], octa: ['bells', 'arp', 'chime'], rhomb: ['pad', 'piano'], shard: ['arp', 'pluck', 'echo'],
    plates: ['sparkle', 'musicbox'], twin: ['bells', 'chime'], star: ['sparkle', 'chime', 'musicbox'], prism: ['bells', 'chime'],
  };
  const AMB_BY_ENV = {
    cave: ['drip', 'whisper'], ice: ['wind', 'whisper'], space: ['space', 'choirdrone'], ocean: ['water', 'sea'], abyss: ['water', 'sea', 'whisper'], forge: ['fire', 'machine'],
    forest: ['forest', 'whisper'], storm: ['rain', 'wind'], desert: ['wind', 'whisper'], temple: ['drip', 'choirdrone'], aurora: ['wind', 'choirdrone'],
    void: ['space', 'whisper'], sanctum: ['choirdrone', 'space'], cyber: ['machine', 'space'], clockwork: ['machine', 'drip'], arcane: ['choirdrone', 'whisper'], mountain: ['wind', 'choirdrone'],
  };
  const SCALES = ['major', 'minor', 'lydian', 'phrygian', 'dorian', 'pent', 'hirajoshi', 'harmonic', 'whole'];
  const TEMPLATE_HINT = {
    rain: { rise: 'water', hit: 'splash' }, meteor: { rise: 'whoosh', hit: 'crash' }, gate: { rise: 'drone', hit: 'cathedral' }, rings: { rise: 'shimmer', hit: 'gong' },
    core: { rise: 'heart', hit: 'glass' }, pillar: { rise: 'choir', hit: 'choirstab' }, eclipse: { rise: 'drone', hit: 'gong' }, burst: { rise: 'shimmer', hit: 'bell' },
    lightning: { rise: 'static', hit: 'zap' }, orbit: { rise: 'engine', hit: 'whomp' }, tunnel: { rise: 'whoosh', hit: 'boom' }, slash: { rise: 'wind', hit: 'anvil' },
    ripple: { rise: 'water', hit: 'splash' }, prism: { rise: 'glass', hit: 'harp' }, aurora: { rise: 'choir', hit: 'cathedral' }, runes: { rise: 'ticks', hit: 'gong' },
    bloom: { rise: 'shimmer', hit: 'harp' }, constellation: { rise: 'glass', hit: 'bell' }, vortex: { rise: 'engine', hit: 'boom' }, crossbeam: { rise: 'strings', hit: 'horn' },
  };

  function derive(def) {
    const h = hash(def.id), r = def.cine || {}, hint = TEMPLATE_HINT[def.template] || {};
    const s = Object.assign({}, parse(def.snd));
    const pick = (list, salt) => list[(h >>> salt) % list.length];
    if (!s.rise) s.rise = hint.rise || (r.entry ? pick(RISE_BY_ENTRY[r.entry] || ['shimmer'], 3) : pick(Object.keys(rise), 3));
    if (!s.hit) s.hit = hint.hit || (r.finale ? pick(HIT_BY_FINALE[r.finale] || ['boom'], 6) : pick(Object.keys(hit), 6));
    if (!s.tail) s.tail = pick(r.hero ? (TAIL_BY_HERO[r.hero.k] || ['bells']) : Object.keys(tail).filter(k => k !== 'none'), 9);
    if (!s.amb) s.amb = pick(AMB_BY_ENV[r.env] || ['drip', 'wind', 'space', 'none'], 12);
    if (!s.spd) s.spd = 0.8 + ((h >>> 21) % 9) * 0.06;
    if (!s.scale) s.scale = pick(SCALES, 15);
    if (!s.root) s.root = 110 * Math.pow(2, ((h >>> 18) % 12) / 12);
    return s;
  }

  /* the one sound every reveal always has underneath it: a sub-bass hit + a slow brass/choir power-chord
     swell. This is what makes a reveal feel MAJESTIC rather than busy - the per-mineral hit voice below
     is layered on top at reduced volume purely for colour, it never carries the moment by itself. */
  function grandCore(p) {
    T({ f: 150, f2: 26, type: 'sine', d: 2.4 + p.tier * 0.15, v: 0.85 * p.vol, out: p.out });
    T({ f: 65, f2: 22, type: 'sine', d: 2.8 + p.tier * 0.2, v: 0.5 * p.vol, out: p.out });
    N({ d: 0.4, v: 0.32 * p.vol, f: 4500, f2: 180, q: 0.45, out: p.out });
    const swell = 2.6 + p.tier * 0.3;
    [0, 4, 7].forEach((deg, i) => {
      const f = note(p.root, p.sc, deg - 7);
      [-7, 7].forEach(det => syn({ type: 'sawtooth', f, d: swell, v: 0.075 * p.vol, a: 0.1, out: p.out, fl: 'lowpass', ff: 650, ff2: 2400, q: 1.3, det, trem: 0.12, tremr: 5 }));
    });
    syn({ type: 'sine', f: p.root * 2, d: swell + 0.5, v: 0.05 * p.vol, a: 0.3, out: p.out });
  }

  return {
    derive, SC, note,
    rise(snd, tier, dur) {
      withBus('cut', out => {
        const p = Object.assign(params(snd, tier), { dur, out, spd: snd.spd || 1 });
        (rise[snd.rise] || rise.shimmer)(p);
        if (snd.amb && amb[snd.amb]) amb[snd.amb](p);
      });
    },
    reveal(snd, tier, vol = 1, quick = false) {
      withBus('hit', out => {
        const p = Object.assign(params(snd, tier), { vol: vol * (tier >= G.GRAND ? 1.15 : 1), out });
        grandCore(p);
        (hit[snd.hit] || hit.boom)(Object.assign({}, p, { vol: p.vol * 0.4 }));
        if (!quick) (tail[snd.tail] || tail.bells)(p);
        // every tier above 3 gets an extra sparkle veil so bigger reveals feel bigger
        if (!quick && tier >= 4) tail.sparkle(Object.assign({}, p, { tier: tier - 2, vol: p.vol * 0.5 }));
      });
    },
    voices: { rise: Object.keys(rise), hit: Object.keys(hit), tail: Object.keys(tail), amb: Object.keys(amb) },
  };
})();
