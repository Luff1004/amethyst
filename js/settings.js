/* AMETHYST - applies the player's settings (G.state.settings, defaults in js/core/state.js) to the
   parts of the game that aren't simply read on the fly: sound levels, muting in the background,
   keeping the screen awake, and vibration. The 설정 panel itself is rendered by js/ui.js. */
(() => {
  const applySound = () => G.audio.setOptions({
    vol: G.opt('volume') / 100, cutVol: G.opt('cutVolume') / 100, mine: G.opt('sndMine'), ui: G.opt('sndUi'),
  });

  /* 화면 꺼짐 방지: a screen wake lock while the game is visible (browsers drop it when hidden) */
  let lock = null;
  async function wake() {
    const want = G.opt('wakeLock') && !document.hidden && 'wakeLock' in navigator;
    if (want && !lock) { try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch (e) { lock = null; } }
    else if (!want && lock) { try { await lock.release(); } catch (e) {} lock = null; }
  }

  /* 진동: short buzzes on crits / shatters / big finds, only if the device supports it */
  G.buzz = pattern => { if (G.opt('vibrate') && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} } };
  G.canVibrate = () => !!navigator.vibrate;
  G.canWakeLock = () => 'wakeLock' in navigator;
  G.on('cut:start', a => { if (!a || a.replay) return; const t = a.def ? a.def.tierIdx : 0; if (t >= 6) G.buzz([60, 40, 120]); else if (t >= 3) G.buzz(30); });

  document.addEventListener('visibilitychange', () => {
    if (G.opt('bgMute')) G.audio.suspend(document.hidden);
    wake();
  });

  G.on('settings', k => {
    applySound();
    if (k === 'wakeLock' || k === '*') wake();
    if (k === 'bgMute' && !G.opt('bgMute')) G.audio.suspend(false);
  });
  /* 테마: the palette lives in css (html[data-theme]); the backdrop is read by js/game.js each frame.
     `previewId` lets the settings panel try a theme on for a few seconds without owning it. */
  let previewId = null, previewT = 0;
  const applyTheme = () => {
    const t = previewId ? G.data.themes.find(x => x.id === previewId) : G.theme();
    if (t.css) document.documentElement.dataset.theme = t.css; else delete document.documentElement.dataset.theme;
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t.preview[0];
  };
  G.activeTheme = () => (previewId ? G.data.themes.find(x => x.id === previewId) : G.theme());
  G.previewTheme = id => {
    previewId = id; applyTheme(); clearTimeout(previewT);
    previewT = setTimeout(() => { previewId = null; applyTheme(); G.emit('change'); }, 6000);
  };
  G.isPreviewing = id => previewId === id;
  G.on('theme', () => { previewId = null; clearTimeout(previewT); applyTheme(); });

  G.on('ready', () => { applySound(); wake(); applyTheme(); window.dispatchEvent(new Event('resize')); });
})();
