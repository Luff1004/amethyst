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

  /* ---------------- mining stage: the SAME faceted-crystal + branching-crack renderer the main
     game uses (js/core/crystalfx.js), just drawn onto LEVEL 1's own canvas and grayscaled by the
     container's CSS filter - not a cheap stand-in shape. A second, screen-sized crack rig cracks
     the whole stage, not just the gem. ---------------- */
  let gauge = 0, mineRig = null, screenCracks = null, loopId = 0, destroyStart = 0, miningLive = false;

  function renderMineShell() {
    el.innerHTML = `
      <div class="l1head">
        <div class="l1mark">?<b>${Math.round(gauge * 40)}</b></div>
        <div class="l1tabs">
          <button class="l1tab" data-l1up>강화</button>
          <button class="l1tab devil" data-l1devil>与魔鬼的交易</button>
        </div>
      </div>
      <div class="l1stage"><canvas class="l1cv"></canvas><div class="l1tapline">탭</div></div>
      <div class="l1mosaic" hidden>
        <div class="l1mosaicinner">
          <div class="l1mrow"></div><div class="l1mrow"></div><div class="l1mrow"></div><div class="l1mrow"></div>
        </div>
        <button class="l1close" data-l1close>&times;</button>
      </div>`;
    el.querySelector('.l1cv').addEventListener('click', onClick);
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

  function updateHud() {
    const mark = el.querySelector('.l1mark b'); if (mark) mark.textContent = Math.round(gauge * 40);
    const tap = el.querySelector('.l1tapline'); if (tap) tap.textContent = gauge >= 1 ? '' : '탭';
  }

  function drawFrame(now) {
    const cv = el.querySelector('.l1cv'); if (!cv || !mineRig) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), rect = cv.parentElement.getBoundingClientRect();
    const needW = Math.round(rect.width * dpr), needH = Math.round(rect.height * dpr);
    if (cv.width !== needW || cv.height !== needH) { cv.width = needW; cv.height = needH; }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, rect.width, rect.height);
    const w = rect.width, h = rect.height, cx = w / 2, cy = h / 2;

    // the whole stage cracking, not just the gem - same branching-crack renderer. Painted at a
    // fixed, modest scale (matching the crystal's own internal CS) so the strokes stay thin and
    // crisp instead of blobbing into a solid dark mass when stretched across a whole screen.
    const screenCS = 130;
    screenCracks.paintIfDirty(now, 0, screenCS);
    g.save(); g.globalAlpha = Math.min(1, gauge * 1.15); g.translate(cx, cy);
    // no extra scale() here (unlike the crystal's own draw, which runs inside one) - the CR buffer
    // is already in screen-ish pixels once painted at CS, so draw it 1:1 at native size
    g.drawImage(screenCracks.canvas, -screenCracks.CR / 2, -screenCracks.CR / 2, screenCracks.CR, screenCracks.CR);
    g.restore();

    let alpha = 1;
    if (destroyStart) alpha = Math.max(0, 1 - (now - destroyStart) / 400);
    if (alpha > 0) {
      g.save(); g.globalAlpha = alpha;
      mineRig.draw(g, { cx, cy, R: Math.min(w, h) * 0.22, hue: 0, time: now, prog: gauge, pulse: 0.15 + 0.15 * Math.sin(now * 0.003) });
      g.restore();
    }
  }
  function loop(now) {
    if (!miningLive) return;
    drawFrame(now);
    loopId = requestAnimationFrame(loop);
  }

  function onClick() {
    if (gauge >= 1) return;
    gauge = G.act.level1Click();
    mineRig.growCrack((Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1);
    screenCracks.grow((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25, 2.4);
    G.audio.crack('glass', gauge, false);
    updateHud();
    if (gauge >= 1) {
      destroyStart = performance.now();
      G.audio.blackout();
      setTimeout(() => { miningLive = false; cancelAnimationFrame(loopId); playEnding(); }, 650);
    }
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
    miningLive = false; cancelAnimationFrame(loopId);
    G.act.level1Finish();
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 400);
  }

  function open() {
    gauge = G.state.level1.gauge || 0;
    destroyStart = 0;
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('show');
    G.audio.init(); G.audio.tab();
    renderMineShell();
    mineRig = G.crystalFX.make((Math.random() * 1e9) | 0);
    screenCracks = G.crystalFX.makeCracks(900);
    // resume mid-session progress: replay that many cracks so the damage isn't invisible
    const preClicks = Math.round(gauge * 40);
    for (let i = 0; i < preClicks; i++) {
      mineRig.growCrack((Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1);
      screenCracks.grow((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.25, 2.4);
    }
    updateHud();
    miningLive = true;
    cancelAnimationFrame(loopId);
    loopId = requestAnimationFrame(loop);
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
