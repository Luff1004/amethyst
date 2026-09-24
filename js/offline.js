/* AMETHYST - offline mining. If you come back after a while with the auto-miner on, it has kept
   working while you were gone: a "while you were away" card rolls up what it earned, at reduced
   efficiency and up to a cap. Uses G.state.lastSeen, which every save stamps (js/core/state.js). */
(() => {
  if (G.config.viewer) return;
  const OFF = { eff: 0.4, capH: 9, minSec: 60 };
  const m = document.getElementById('offlineModal');
  if (!m) return;

  // remember when the save we just loaded was written, before this session starts overwriting it
  let awayFrom = 0;
  const load0 = G.load;
  G.load = () => { load0(); awayFrom = G.state.lastSeen || 0; };

  function check() {
    const st = G.state;
    if (!awayFrom || !st.autoOn || st.level1.crystalGone) return;
    const sec = Math.min(OFF.capH * 3600, (Date.now() - awayFrom) / 1000), rate = G.stats.autoRate();
    if (sec < OFF.minSec || rate <= 0) return;
    const perHit = G.stats.clickValue() * (1 + G.stats.critChance() * (G.stats.critMul() - 1));
    const coins = Math.floor(rate * perHit * sec * OFF.eff), hits = Math.floor(rate * sec * OFF.eff);
    if (coins <= 0) return;
    const h = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), capped = sec >= OFF.capH * 3600 - 1;
    m.innerHTML = `<div class="scrim"></div><div class="ofcard bevel">
      <div class="ofspin">${G.icon('crystal', 34)}</div>
      <small>WHILE YOU WERE AWAY</small>
      <h3>자리를 비운 동안</h3>
      <p>자동 채굴기가 <b>${h ? h + '시간 ' : ''}${mm}분</b> 동안 쉬지 않고 일했습니다${capped ? ` <i>(최대 ${OFF.capH}시간)</i>` : ''}</p>
      <div class="ofrow"><span>채굴</span><b>${G.fmtInt(hits)}회</b></div>
      <div class="ofcoins">${G.icon('coin', 26)}<b data-ofc>0</b></div>
      <em>효율 ${Math.round(OFF.eff * 100)}% · 자동 채굴기 Lv.${G.stats.level('auto')}</em>
      <button class="buy bevel" data-ofok><span>받기</span></button></div>`;
    m.hidden = false; void m.offsetWidth; m.classList.add('show');
    const el = m.querySelector('[data-ofc]'), t0 = performance.now();
    (function roll(now) { const k = Math.min(1, (now - t0) / 1400); el.textContent = G.fmt(coins * (1 - Math.pow(1 - k, 3))); if (k < 1 && !m.hidden) requestAnimationFrame(roll); })(t0);
    let taken = false;
    m.onclick = ev => {
      if (taken || !ev.target.closest('[data-ofok]')) return;
      taken = true; G.addCoins(coins); G.save(); G.emit('change');
      G.audio.pour(14); G.audio.buy();
      m.classList.remove('show'); setTimeout(() => { m.hidden = true; m.innerHTML = ''; }, 350);
    };
  }
  G.on('ready', () => setTimeout(check, 400));
  // local testing: G.offlinePreview(hours) shows the card as if you'd been away that long
  if (G.config.dev) G.offlinePreview = (hours = 3) => { awayFrom = Date.now() - hours * 3600 * 1000; check(); };
})();
