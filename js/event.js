/* AMETHYST - promo event banner button + code redemption popup. Edit js/data/event.js to change
   or remove the active event; this file just wires whatever is there up to the UI. */
(() => {
  const btn = document.getElementById('btnEvent'), modal = document.getElementById('eventModal');
  const ev = G.data.event;
  if (!btn || !modal || !ev) return;

  btn.hidden = false;
  btn.innerHTML = `${G.icon('gift', 16)}<span>${ev.teaser}</span>`;

  const redeemed = () => !!G.state.eventRedeemed[ev.id];

  function paint(msg) {
    const done = redeemed();
    modal.innerHTML = `<div class="scrim"></div>
      <div class="tcard bevel">
        <button class="xclose" data-eclose aria-label="닫기">&times;</button>
        <h3>${ev.title}</h3>
        <p>${ev.body.split('\n').map(l => l || '&nbsp;').join('<br>')}</p>
        ${ev.linkUrl ? `<a class="buy bevel eventlink" href="${ev.linkUrl}" target="_blank" rel="noopener"><span>${ev.linkLabel || '바로가기'}</span></a>` : ''}
        ${ev.reward ? `<div class="ecode">
            <input type="text" maxlength="40" placeholder="${ev.codeLabel || '코드 입력'}" data-ecode ${done ? 'disabled' : ''}>
            <button class="buy bevel small" data-esubmit ${done ? 'disabled' : ''}><span>확인</span></button>
          </div>
          <div class="emsg${done ? ' ok' : msg === 'invalid' ? ' bad' : ''}">${done ? '이미 수령했습니다' : msg === 'invalid' ? '올바르지 않은 코드입니다' : ''}</div>` : ''}
      </div>`;
  }

  function open() { modal.hidden = false; paint(); requestAnimationFrame(() => modal.classList.add('show')); }
  function close() { modal.classList.remove('show'); setTimeout(() => { modal.hidden = true; }, 320); }

  function submit() {
    const input = modal.querySelector('[data-ecode]'); if (!input || redeemed()) return;
    const r = G.act.redeemEventCode(input.value);
    if (r === 'ok' || r === 'already') { G.audio.buy(); paint(); }
    else { G.audio.deny(); paint('invalid'); input.focus(); }
  }

  btn.addEventListener('click', () => { G.audio.init(); G.audio.tab(); open(); });
  modal.addEventListener('click', ev2 => {
    if (ev2.target.closest('[data-eclose]') || ev2.target.classList.contains('scrim')) { G.audio.tab(); close(); }
    else if (ev2.target.closest('[data-esubmit]')) submit();
  });
  modal.addEventListener('keydown', ev2 => { if (ev2.key === 'Enter' && ev2.target.matches('[data-ecode]')) submit(); });
})();
