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
  // a frame over the whole screen that themes can dress (THE SOVEREIGN's gold corners) - plain css, hidden otherwise
  const frame = document.createElement('div');
  frame.id = 'themeFrame'; frame.innerHTML = '<i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i><b class="mt"></b><b class="mb"></b><b class="ml"></b><b class="mr"></b>';
  document.body.appendChild(frame);
  const applyTheme = () => {
    const t = previewId ? G.data.themes.find(x => x.id === previewId) : G.theme();
    if (t.css) document.documentElement.dataset.theme = t.css; else delete document.documentElement.dataset.theme;
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = t.preview[0];
  };
  G.activeTheme = () => (previewId ? G.data.themes.find(x => x.id === previewId) : G.theme());
  /* THE UNSEEN corrupts the labels: combining marks heaped on the letters (the same marks every time for
     the same text, so it doesn't crawl), restored the moment another theme is on. Only decorative labels -
     numbers, prices and buttons stay readable. Text the UI re-renders gets corrupted again on the next pass. */
  const ZSEL = '.ph h2, #tabs .tab span, #foot b, #foot span, .card .meta small, #coinBox small, #luckChip span, .upswitch .seg, .setchips .chip b, .tu-box small';
  const MARKS = [];
  for (let u = 0x300; u <= 0x36f; u++) MARKS.push(String.fromCharCode(u));
  // marks go on latin letters and digits only - on hangul they fall apart into boxes
  const zalgo = s => { let o = '', h = 7; for (const ch of s) { o += ch; if (/[A-Za-z0-9]/.test(ch)) { h = (h * 31 + ch.charCodeAt(0)) % 9973; const n = 1 + h % 3; for (let j = 0; j < n; j++) o += MARKS[(h * (j + 3)) % MARKS.length]; } } return o; };
  const corruptPass = () => {
    const on = document.documentElement.dataset.theme === 'unseen';
    document.querySelectorAll(ZSEL).forEach(el => {
      for (const nd of el.childNodes) {
        if (nd.nodeType !== 3 || !nd.nodeValue.trim()) continue;
        if (on) { if (nd.__z !== nd.nodeValue) { nd.__o = nd.nodeValue; nd.__z = nd.nodeValue = zalgo(nd.nodeValue); } }
        else if (nd.__o != null && nd.__z === nd.nodeValue) { nd.nodeValue = nd.__o; nd.__o = nd.__z = null; }
      }
    });
  };
  /* ...and about half of the hangul is eaten by black glitch blocks (the same letters every time for the
     same text). Each touched text node becomes <span class="zg" data-o="original"> with the eaten
     letters in <i class="gk">; buttons, inputs and timers are left alone so the game stays playable. */
  const HANGUL = /[가-힣]/;
  const glitchPass = on => {
    if (!on) { document.querySelectorAll('.zg').forEach(z => z.replaceWith(document.createTextNode(z.dataset.o))); return; }
    const roots = [document.getElementById('hud'), document.getElementById('foot')].filter(Boolean), nodes = [];
    for (const root of roots) {
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (!HANGUL.test(n.nodeValue) || n.parentElement.closest('.zg, button, input, textarea, [data-timer], [data-labtime]')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      for (let n; (n = tw.nextNode());) nodes.push(n);
    }
    for (const nd of nodes) {
      const txt = nd.nodeValue, span = document.createElement('span');
      span.className = 'zg'; span.dataset.o = nd.__o != null && nd.__z === txt ? nd.__o : txt;
      let h = 11, html = '', idx = 0;
      for (const ch of txt) {
        h = (h * 131 + ch.charCodeAt(0) + idx++) % 100003;
        const esc = ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch;
        html += HANGUL.test(ch) && (h >> 3) % 2 === 0 ? `<i class="gk g${h % 4}">${esc}</i>` : esc;
      }
      span.innerHTML = html; nd.replaceWith(span);
    }
  };
  setInterval(() => { corruptPass(); glitchPass(document.documentElement.dataset.theme === 'unseen'); }, 400);
  /* 미리보기: the settings panel closes so the whole screen shows the theme, and a small bar counts
     down with 장착 (if owned) / 끝내기 */
  const PREV_S = 10;
  const bar = document.createElement('div');
  bar.id = 'themePrev'; bar.hidden = true;
  document.body.appendChild(bar);
  let prevTick = 0;
  const endPreview = () => { previewId = null; clearTimeout(previewT); clearInterval(prevTick); bar.hidden = true; applyTheme(); G.emit('change'); };
  G.previewTheme = id => {
    const t = G.data.themes.find(x => x.id === id); if (!t) return;
    previewId = id; applyTheme(); clearTimeout(previewT); clearInterval(prevTick);
    if (G.ui) G.ui.closePanel();
    const own = G.state.themesOwned[id], end = Date.now() + PREV_S * 1000;
    bar.innerHTML = `<span><b>${t.name}</b> 미리보기</span><em>${PREV_S}</em>${own ? '<button class="eq" data-pv="eq">장착</button>' : ''}<button data-pv="end">끝내기</button>`;
    bar.hidden = false;
    prevTick = setInterval(() => { const e = bar.querySelector('em'); if (e) e.textContent = Math.max(0, Math.ceil((end - Date.now()) / 1000)); }, 250);
    previewT = setTimeout(endPreview, PREV_S * 1000);
  };
  bar.addEventListener('click', ev => {
    const b = ev.target.closest('[data-pv]'); if (!b) return;
    G.audio.tab();
    if (b.dataset.pv === 'eq' && previewId) { const id = previewId, t = G.data.themes.find(x => x.id === id); endPreview(); G.act.setTheme(id); G.emit('toast', `${t.name} 테마를 장착했습니다`); }
    else endPreview();
  });
  G.isPreviewing = id => previewId === id;
  G.on('theme', () => { previewId = null; clearTimeout(previewT); clearInterval(prevTick); bar.hidden = true; applyTheme(); });

  /* achievement themes: checked on every change (cheap - a codex scan at most), handed over the moment
     the condition passes, then announced with a full-screen unlock banner - held back while a
     cutscene or boss fight is on screen, one banner at a time */
  const unlockQ = [];
  const checkUnlocks = () => {
    const s = G.state;
    if (!s || !s.themesOwned) return;
    for (const t of G.data.themes) {
      if (!t.unlock || s.themesOwned[t.id]) continue;
      // local dev: every achievement theme is simply open (quietly - no banner), to try them on freely
      if (G.config.dev) { s.themesOwned[t.id] = true; G.save(); continue; }
      let ok = false; try { ok = t.unlock.test(s); } catch (e) {}
      if (!ok) continue;
      s.themesOwned[t.id] = true; G.save();
      unlockQ.push(t);
    }
    showUnlock();
  };
  let unlockEl = null;
  function showUnlock() {
    if (!unlockQ.length || unlockEl || document.body.classList.contains('cut') || document.body.classList.contains('bossing')) return;
    const t = unlockQ.shift(), [bg, acc] = t.preview;
    unlockEl = document.createElement('div');
    unlockEl.className = 'tunlock tu-' + t.id;
    unlockEl.style.cssText = `--tbg:${bg};--tacc:${acc}`;
    unlockEl.innerHTML = `<div class="tu-rays"></div><div class="tu-ring"></div><div class="tu-box">
      <small>THEME UNLOCKED</small><b data-t="${t.en}">${t.en}</b><i></i>
      <span>${t.unlock.label}</span><em>${t.desc}</em>
      <div class="tu-btns"><button class="tu-eq" data-tueq="${t.id}">지금 장착하기</button><button class="tu-no">나중에</button></div></div>`;
    document.body.appendChild(unlockEl);
    G.audio.init(); G.audio.blast(8); G.audio.potion();
    unlockEl.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.tueq) { G.act.setTheme(b.dataset.tueq); G.emit('toast', `${t.name} 테마를 장착했습니다`); }
      else G.emit('toast', '설정 > 테마에서 언제든 장착할 수 있어요');
      G.audio.tab();
      const el = unlockEl; el.classList.add('out'); setTimeout(() => { el.remove(); unlockEl = null; showUnlock(); }, 450);
    });
  }
  // every 1.5s: catches a fresh find, and lets a banner that waited out a cutscene take its turn
  if (!G.config.viewer) setInterval(checkUnlocks, 1500);

  G.on('ready', () => { applySound(); wake(); applyTheme(); window.dispatchEvent(new Event('resize')); });
})();
