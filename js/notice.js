/* AMETHYST - the notice shown on entering (v1.0: what the update brought).
   "다시 보지 않기" is remembered in its own localStorage key, never in the save. Skipped in the
   codex-only viewer and until the tutorial is done. */
(() => {
  const KEY = 'amethyst_notice_v1_1';
  const NOTICE = {
    ver: 'v1.0',
    title: '업데이트 완료!',
    lead: '아메시스트 v1.0 업데이트가 적용되었습니다',
    items: [
      ['crystal', '크리스탈 제조', '상자 뽑기 대신, 모은 자원으로 크리스탈 · 행운 부적 · 건틀렛을 직접 만듭니다 (제조 탭)'],
      ['cloud', '바이옴 자원', '날씨와 바이옴마다 그곳에서만 나는 자원을 모읍니다 (인벤토리)'],
      ['book', '광물 절감', '맵마다 광물을 약 50개로 정리했습니다'],
      ['moon', 'DREAM · LUCID DREAM · NIGHTMARE', '새벽 0시~3시, 하룻밤에 한 번 꿈이 열립니다 · 새 테마 DREAMCORE'],
    ],
  };
  let hidden = false; try { hidden = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (hidden || G.config.viewer) return;

  const el = document.createElement('div'); el.id = 'noticeModal'; el.hidden = true;
  document.body.appendChild(el);
  function open() {
    el.innerHTML = `<div class="scrim"></div>
      <div class="tcard bevel">
        <small class="nver">AMETHYST ${NOTICE.ver}</small>
        <h3>${NOTICE.title}</h3>
        <p>${NOTICE.lead}</p>
        <ul class="nlist">${NOTICE.items.map(([ic, b, s]) => `<li><i>${G.icon(ic, 16)}</i><span><b>${b}</b>${s ? `<small>${s}</small>` : ''}</span></li>`).join('')}</ul>
        <div class="nbtns"><button class="buy bevel small" data-nhide><span>다시 보지 않기</span></button><button class="buy bevel small ready" data-nclose><span>닫기</span></button></div>
      </div>`;
    el.hidden = false; requestAnimationFrame(() => el.classList.add('show'));
  }
  function close() { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 320); }
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    G.audio.tab();
    if (b.dataset.nhide != null) { try { localStorage.setItem(KEY, '1'); } catch (er) {} close(); }
    else if (b.dataset.nclose != null) close();
  });
  // wait until the tutorial is over and nothing else is on screen
  const tryOpen = () => {
    if (!G.state || !G.state.tutorialDone || G.cutscenes.active) { setTimeout(tryOpen, 1500); return; }
    open();
  };
  setTimeout(tryOpen, 1200);
})();
