/* AMETHYST - promo event banner button + popup. Edit js/data/event.js to change or remove the
   active event; this file just wires whatever is there up to the UI. `theme: 'exam'` renders the
   body as a math-exam question instead of the plain banner/link layout. */
(() => {
  const btn = document.getElementById('btnEvent'), modal = document.getElementById('eventModal');
  const ev = G.data.event;
  if (!btn || !modal || !ev) return;

  const exam = ev.theme === 'exam';
  btn.hidden = false;
  btn.className = 'bevel' + (exam ? ' exam' : '');
  btn.innerHTML = exam
    ? `${G.icon('book', 15)}<span>${ev.teaser}</span><i class="xmark">X</i>`
    : `${G.icon('gift', 16)}<span>${ev.teaser}</span>`;

  const redeemed = () => !!G.state.eventRedeemed[ev.id];

  function paint(msg) {
    const done = redeemed();
    const codeBlock = ev.reward ? `<div class="ecode">
        <input type="text" maxlength="40" placeholder="${ev.codeLabel || '코드 입력'}" data-ecode ${done ? 'disabled' : ''}>
        <button class="buy bevel small" data-esubmit ${done ? 'disabled' : ''}><span>${exam ? '채점' : '확인'}</span></button>
      </div>
      <div class="emsg${done ? ' ok' : msg === 'invalid' ? ' bad' : ''}">${done ? (exam ? '이미 정답 처리되었습니다 (만점)' : '이미 수령했습니다') : msg === 'invalid' ? (exam ? '오답입니다 - 다시 풀어보세요' : '올바르지 않은 코드입니다') : ''}</div>` : '';

    modal.innerHTML = `<div class="scrim"></div>
      <div class="tcard bevel${exam ? ' exam' : ''}">
        <button class="xclose" data-eclose aria-label="닫기">&times;</button>
        ${exam ? `
          <div class="examhead"><b>${ev.title}</b><span>${ev.points || ''}</span></div>
          <p class="exintro">${ev.body.split('\n').map(l => l || '&nbsp;').join('<br>')}</p>
          <div class="exampaper">
            <div class="qtext">${ev.problem}</div>
            ${ev.meta ? `<div class="qmeta">${ev.meta}</div>` : ''}
          </div>
          ${codeBlock}
        ` : `
          <h3>${ev.title}</h3>
          <p>${ev.body.split('\n').map(l => l || '&nbsp;').join('<br>')}</p>
          ${ev.linkUrl ? `<a class="buy bevel eventlink" href="${ev.linkUrl}" target="_blank" rel="noopener"><span>${ev.linkLabel || '바로가기'}</span></a>` : ''}
          ${codeBlock}
        `}
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
