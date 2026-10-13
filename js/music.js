/*
  Recorded music (everything else in the game is synthesized - js/core/audio.js).
  A cutscene with def.music plays that file from the top instead of its synth score; a theme with
  theme.music loops it quietly as background music while it's on (paused under other cutscenes).
  The file is routed through the game's own audio graph, so 음소거 / 전체 볼륨 / 컷신 소리 /
  백그라운드에서 소리 끄기 all apply to it like to every other sound.
*/
(() => {
  const tracks = {};                 // src -> { el, gain }
  let cutTrack = null;               // the track a cutscene is playing right now
  const BGM_LEVEL = 0.45;

  function track(src) {
    const core = G.audio.core();
    if (!core) return null;          // no audio context until the first tap
    let t = tracks[src];
    if (!t) {
      // the whole file is fetched into memory and played from a blob URL: then seeking (musicAt) works
      // on any server - a server without range requests would otherwise snap every seek back to 0:00
      const el = new Audio(); el.loop = true; el.preload = 'auto';
      const gain = core.ctx.createGain(); gain.gain.value = 0;
      core.ctx.createMediaElementSource(el).connect(gain); gain.connect(core.master);
      t = tracks[src] = { el, gain, ready: false };
      fetch(src).then(r => r.blob()).then(b => { el.src = URL.createObjectURL(b); el.load(); t.ready = true; }).catch(() => {});
    }
    return t;
  }
  function fade(t, to, sec) {
    const c = G.audio.core(); if (!c) return;
    const now = c.ctx.currentTime;
    t.gain.gain.cancelScheduledValues(now); t.gain.gain.setValueAtTime(t.gain.gain.value, now);
    t.gain.gain.linearRampToValueAtTime(Math.max(0.0001, to), now + sec);
  }
  const cutLevel = () => (G.opt('cutVolume') == null ? 100 : G.opt('cutVolume')) / 100;
  const bgmSrc = () => { const th = G.activeTheme && G.activeTheme(); return th && th.music; };

  // a film with a recording: def.music (file), def.musicAt (seconds into it to start from). With a
  // blackout (def.pre) the song comes in the instant the picture does - on cut:go - not before.
  let waiting = null;
  function startScore(a) {
    const t = track(a.def.music); if (!t) return;
    t.el.loop = false; cutTrack = t;
    // a seek made before the file's metadata is in gets thrown away (it would play from 0:00) -
    // so seek only once the browser knows the file, then play
    const go = () => {
      if (cutTrack !== t) return;
      t.el.currentTime = a.def.musicAt || 0;
      t.el.play().catch(() => {});
      fade(t, cutLevel(), a.def.musicAt ? 0.05 : 0.6);
    };
    const wait = () => { if (cutTrack !== t) return; if (t.ready && t.el.readyState >= 1) go(); else setTimeout(wait, 40); };
    wait();
  }
  G.on('cut:start', a => {
    const src = a.def.music;
    for (const k in tracks) if (k !== src || !src) fade(tracks[k], 0, 0.4);   // any background music ducks out
    if (src && tracks[src]) fade(tracks[src], 0, 0.3);
    waiting = null;
    if (!src) return;
    G.audio.stopCut();               // this film has a real recording: silence its synth score
    if (a.pre > 0) { waiting = a; track(src); }   // creating the track starts fetching it, during the blackout
    else startScore(a);
  });
  G.on('cut:go', a => { if (waiting === a) { waiting = null; startScore(a); } });
  G.on('cut:end', () => {
    waiting = null;
    if (cutTrack) cutTrack.el.loop = true;
    if (cutTrack) { const t = cutTrack; cutTrack = null; fade(t, 0, 1.5); setTimeout(() => { if (t !== cutTrack && !(bgmSrc() && tracks[bgmSrc()] === t)) t.el.pause(); }, 1600); }
  });

  G.music = { tracks };              // for inspection in the console

  // background music for the theme on screen (checked twice a second; cheap)
  setInterval(() => {
    if (G.config.viewer || cutTrack || G.cutscenes.active) return;
    const src = bgmSrc();
    for (const k in tracks) if (k !== src && !tracks[k].el.paused) { const t = tracks[k]; fade(t, 0, 0.8); setTimeout(() => { if (bgmSrc() !== k) t.el.pause(); }, 900); }
    if (!src) return;
    const t = track(src); if (!t || !t.ready) return;          // still downloading
    if (t.el.paused) { t.el.play().catch(() => {}); }
    fade(t, BGM_LEVEL, 1.2);
  }, 500);
})();
