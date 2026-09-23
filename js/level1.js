/* AMETHYST - LEVEL 1: a secret ARG-style detour gating the real void rift map (zone 4).
   Unlocked once every SECRET-tier cutscene in the game has been found (see the map card in
   js/ui.js and G.stats.allSecretsFound() in js/core/state.js). Entirely self-contained and
   rendered in grayscale: its own mini header, its own "?" currency, its own crystal.

   Flow: enter from the map -> click the crystal for "?" (js/core/state.js: G.act.level1Click)
   -> the crystal and the whole screen crack more each click -> at full gauge, the crystal is
   destroyed -> a blackout -> a still photo -> a line-by-line caption sequence -> credits ->
   back to the MAIN game, where the real crystal is now gone (G.state.level1.crystalGone).
   Tapping 도감 while it's gone fires the jumpscare (G.jumpscare, called from js/ui.js), which
   ends in a "자수정 회복하기" button - clicking it restores the crystal for good and unlocks
   zone 4 (js/core/state.js: G.act.level1Restore). */
(() => {
  const el = document.getElementById('level1'), jsEl = document.getElementById('jumpscare');
  if (!el || !jsEl) return;

  const EYE_IMG = 'last13409u81ujionjl%23(.jpg';   // '#' must be percent-encoded or it truncates the URL
  const JUMP_IMG = 'jump scare.jpg';

  /* ---------------- mining stage ---------------- */
  let gauge = 0;

  const crackPaths = (() => {
    const r = G.rng(4242), out = [];
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + r() * 0.35, cx = 50, cy = 50;
      let x = cx, y = cy, d = `M${x},${y}`;
      const segs = 3 + Math.floor(r() * 3);
      for (let s = 0; s < segs; s++) {
        const len = (60 / segs) * (0.7 + r() * 0.7);
        x += Math.cos(ang + (r() - 0.5) * 0.7) * len;
        y += Math.sin(ang + (r() - 0.5) * 0.7) * len;
        d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      out.push(d);
    }
    return out;
  })();

  function crackSVG(g) {
    const shown = Math.round(g * crackPaths.length);
    const paths = crackPaths.slice(0, shown).map(d => `<path d="${d}"/>`).join('');
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="l1cracksvg">${paths}</svg>`;
  }

  function paintMine() {
    const marks = Math.round(gauge * 40);
    const gone = gauge >= 1;
    el.innerHTML = `
      <div class="l1head">
        <div class="l1mark">?<b>${marks}</b></div>
        <div class="l1tabs">
          <button class="l1tab" data-l1up>강화</button>
          <button class="l1tab devil" data-l1devil>与魔鬼的交易</button>
        </div>
      </div>
      <div class="l1cracks">${crackSVG(gauge)}</div>
      <div class="l1stage">
        <div class="l1crystal${gone ? ' gone' : ''}" data-l1click style="--dmg:${gauge}">
          <svg viewBox="0 0 100 116" class="l1gem"><polygon points="50,4 92,38 76,112 24,112 8,38"/></svg>
        </div>
        <div class="l1tapline">${gone ? '' : '탭'}</div>
      </div>
      <div class="l1mosaic" hidden>
        <div class="l1mosaicinner">
          <div class="l1mrow"></div><div class="l1mrow"></div><div class="l1mrow"></div><div class="l1mrow"></div>
        </div>
        <button class="l1close" data-l1close>&times;</button>
      </div>`;
    el.querySelector('[data-l1click]').addEventListener('click', onClick);
    el.querySelector('[data-l1up]').addEventListener('click', () => { G.audio.tab(); el.querySelector('.l1mosaic').hidden = false; });
    el.querySelector('[data-l1close]').addEventListener('click', () => { G.audio.tab(); el.querySelector('.l1mosaic').hidden = true; });
    el.querySelector('[data-l1devil]').addEventListener('click', () => { G.audio.deny(); l1toast('它没有回应...'); });
  }

  let toastT = 0;
  function l1toast(msg) {
    let t = el.querySelector('.l1toast');
    if (!t) { t = document.createElement('div'); t.className = 'l1toast'; el.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1400);
  }

  function onClick() {
    if (gauge >= 1) return;
    gauge = G.act.level1Click();
    G.audio.crack('glass', gauge, false);
    paintMine();
    if (gauge >= 1) { G.audio.blackout(); setTimeout(playEnding, 650); }
  }

  /* ---------------- ending: blackout -> still eye -> captions -> credits ---------------- */
  function playEnding() {
    el.innerHTML = `<div class="l1black"></div><div class="l1eyewrap"><img src="${EYE_IMG}" class="l1eye" alt=""></div>
      <div class="l1cap"></div><div class="l1credits" hidden></div>`;
    const black = el.querySelector('.l1black'), eyeWrap = el.querySelector('.l1eyewrap'), cap = el.querySelector('.l1cap'), credits = el.querySelector('.l1credits');
    requestAnimationFrame(() => black.classList.add('show'));
    setTimeout(() => {
      eyeWrap.classList.add('show');
      const lines = ['YOU', 'ARE', 'FOUND', 'MY', 'Labyrinth', '.', '.', '.', '.', 'AND', 'NOW', '', '', 'WAKE UP'];
      let i = 0;
      const step = () => {
        cap.innerHTML = '';
        if (i >= lines.length) { setTimeout(showCredits, 1700); return; }
        const ln = lines[i++];
        if (ln) {
          const d = document.createElement('div'); d.className = 'l1capline'; d.textContent = ln; cap.appendChild(d);
          requestAnimationFrame(() => d.classList.add('show'));
        }
        setTimeout(step, ln === '.' ? 420 : ln === '' ? 480 : 780);
      };
      setTimeout(step, 1300);
    }, 950);
    function showCredits() {
      eyeWrap.classList.remove('show'); cap.innerHTML = '';
      credits.hidden = false; requestAnimationFrame(() => credits.classList.add('show'));
      credits.innerHTML = `<h2>AMETHYST</h2><p class="l1cline">LEVEL 1</p>
        <p class="l1cline">감사합니다</p>
        <button class="buy bevel l1exit" data-l1exit><span>계속</span></button>`;
      credits.querySelector('[data-l1exit]').addEventListener('click', finish);
    }
  }

  function finish() {
    G.act.level1Finish();
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 400);
  }

  function open() {
    gauge = G.state.level1.gauge || 0;
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.init(); G.audio.tab();
    paintMine();
  }
  G.level1 = { open };

  /* ---------------- post-ending: jumpscare -> restore ---------------- */
  function jumpscare() {
    G.audio.init();
    jsEl.hidden = false; jsEl.innerHTML = `<img src="${JUMP_IMG}" class="jsimg" alt="">`;
    void jsEl.offsetWidth;
    jsEl.classList.add('flash');
    G.audio.jumpscare();
    setTimeout(() => {
      jsEl.classList.remove('flash');
      jsEl.innerHTML = `<div class="jsend"><p>...정말로, 끝났습니다</p>
        <button class="buy bevel" data-restore><span>자수정 회복하기</span></button></div>`;
      requestAnimationFrame(() => jsEl.querySelector('.jsend').classList.add('show'));
      jsEl.querySelector('[data-restore]').addEventListener('click', () => {
        G.audio.init(); G.act.level1Restore();
        jsEl.classList.add('restoreburst'); G.audio.blast(6);
        G.emit('zone');
        setTimeout(() => { jsEl.hidden = true; jsEl.classList.remove('restoreburst'); jsEl.innerHTML = ''; }, 1000);
      });
    }, 600);
  }
  G.jumpscare = jumpscare;
})();
