/* AMETHYST - the monthly event banner (wide button in the top bar) + its package shop popup.
   Data lives in js/data/events.js; this file only renders whatever event is running this month.
   Locally (js/config.js dev) the popup also gets a 1~12 month switcher to preview every event. */
(() => {
  const btn = document.getElementById('btnEvent'), modal = document.getElementById('eventModal');
  if (!btn || !modal || !G.data.events) return;
  let confirmId = null, confirmT = 0;

  const itemInfo = it => {
    if (it.k === 'potion') { const p = G.stats.potion(it.id); return { name: p.name, icon: 'potion', hue: p.hue, special: !!p.grantCut, note: p.grantCut ? '한정 광물 확정 · SPECIAL' : p.event ? `LUCK +${G.fmt(p.luck)} · 이벤트 한정` : `LUCK +${G.fmt(p.luck)}` }; }
    if (it.k === 'ticket') { const b = G.data.boxes.find(x => x.id === it.id); return { name: `${b.name} 무료권`, icon: 'ticket', color: b.color, note: '크리스탈 상점에서 무료 오픈' }; }
    const f = G.data.foods.find(x => x.id === it.id);
    return { name: f.name, icon: f.icon, perm: !!f.perm, note: f.perm ? `영구 LUCK +${G.fmtInt(f.bonus)} · 코인 x${f.coinMul}` : `LUCK +${G.fmtInt(f.bonus)} · ${G.fmtTime(f.duration)}` };
  };

  function paintButton() {
    const ev = G.event.current();
    btn.hidden = !ev;
    if (!ev) return;
    btn.className = 'bevel evbtn';
    btn.style.setProperty('--eh', ev.hue);
    btn.innerHTML = `${G.icon('gift', 17)}<span class="evt"><small>${ev.m}월 한정 이벤트</small><b>${ev.title}</b></span><em class="dday">D-${G.event.daysLeft()}</em>`;
  }

  function paint() {
    const ev = G.event.current(), s = G.state;
    if (!ev) { close(); return; }
    const mineral = G.cutscenes.byId[ev.cut];
    const months = G.config.dev ? `<div class="devmonth"><span>DEV · 월 전환</span>${G.data.events.map(e => `<button class="${e.m === ev.m ? 'on' : ''}" data-month="${e.m}">${e.m}</button>`).join('')}</div>` : '';
    const pkgs = ev.packages.map(pk => {
      const off = Math.round((1 - pk.sale / pk.price) * 100), poor = s.crystals < pk.sale, bought = s.pkgBought[pk.id] || 0;
      const items = pk.items.map(it => {
        const inf = itemInfo(it);
        return `<li class="${inf.special ? 'sp' : ''}${inf.perm ? ' perm' : ''}" style="${inf.hue != null ? `--ih:${inf.hue}` : ''}${inf.color ? `;--ic:${inf.color}` : ''}">
          <i class="iic">${G.icon(inf.icon, 15)}</i><span><b>${inf.name}</b><small>${inf.note}</small></span><em>x${it.n}</em></li>`;
      }).join('');
      const confirming = confirmId === pk.id;
      return `<div class="pkg bevel pk-${pk.tier}" style="--pc:${pk.color}">
        <div class="pkhead"><b>${pk.name}</b><span class="off">-${off}%</span></div>
        <ul class="pkitems">${items}</ul>
        <div class="pkfoot">
          <div class="price"><s>${G.icon('crystal', 11)}${G.fmtInt(pk.price)}</s><b>${G.icon('crystal', 15)}${G.fmtInt(pk.sale)}</b>${bought ? `<small>구매 ${bought}회</small>` : ''}</div>
          <button class="buy bevel ${poor ? 'poor' : ''} ${confirming ? 'confirm' : ''}" data-pkg="${pk.id}"><span>${confirming ? '한 번 더 눌러 구매' : '구매'}</span></button>
        </div></div>`;
    }).join('');
    const prevCard = modal.querySelector('.tcard'), keepScroll = prevCard ? prevCard.scrollTop : 0;
    const keepDone = modal.querySelector('.pkdone');         // a running purchase celebration survives repaints
    modal.innerHTML = `<div class="scrim"></div>
      <div class="tcard bevel pkgshop ev-${ev.id}" style="--eh:${ev.hue}">
        <button class="xclose" data-eclose aria-label="닫기">&times;</button>
        <div class="evhero">
          <small>${ev.m}월 한정 이벤트 &nbsp;·&nbsp; D-${G.event.daysLeft()}</small>
          <h3>${ev.title}</h3>
          <p>${ev.name} 기간에만 판매하는 한정 패키지입니다. 메가 · 하이퍼 패키지에는 도감 <b>SPECIAL</b>에 기록되는 한정 광물
            <b class="mn">${mineral ? mineral.name : ''}</b>이(가) 확정으로 나오는 특별 한정 광물 포션이 들어 있습니다.</p>
        </div>
        ${months}
        <div class="pkgs">${pkgs}</div>
        <div class="evnote">보유 크리스탈 <b>${G.fmtInt(s.crystals)}</b> &nbsp;·&nbsp; 포션은 크리스탈 탭, 음식은 상점 탭에서 사용 &nbsp;·&nbsp; 한정 포션은 이벤트 기간에만 사용할 수 있습니다</div>
      </div>`;
    // re-rendering must never throw the player back to the top of a long, scrolled popup
    const card = modal.querySelector('.tcard'); if (card) card.scrollTop = keepScroll;
    if (keepDone) modal.appendChild(keepDone);
  }

  /* first tap on 구매 only flips that one button into its confirm state - no re-render, so the
     button stays exactly under the player's finger for the second tap */
  function setConfirm(btnEl, on) {
    if (!btnEl) return;
    btnEl.classList.toggle('confirm', on);
    btnEl.querySelector('span').textContent = on ? '한 번 더 눌러 구매' : '구매';
  }

  /* purchase celebration: rays + burst + confetti, then every item in the package pops in one by one */
  function celebrate(pk) {
    const ev = G.event.current(), old = modal.querySelector('.pkdone'); if (old) old.remove();
    const conf = Array.from({ length: 46 }, (_, i) => {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
      const c = ['#ffcf5a', '#7ff3ff', '#ff6ad5', '#ffffff', pk.color][i % 5];
      return `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 60}px;--r:${Math.random() * 720 - 360}deg;--c:${c};--dl:${Math.random() * 120}ms"></i>`;
    }).join('');
    const items = pk.items.map((it, i) => {
      const inf = itemInfo(it);
      return `<li class="${inf.special ? 'sp' : ''}${inf.perm ? ' perm' : ''}" style="--d:${420 + i * 90}ms;${inf.hue != null ? `--ih:${inf.hue};` : ''}${inf.color ? `--ic:${inf.color}` : ''}">
        <i class="iic">${G.icon(inf.icon, 18)}</i><b>${inf.name}</b><em>x${it.n}</em></li>`;
    }).join('');
    const el = document.createElement('div');
    el.className = `pkdone pk-${pk.tier}`;
    el.style.setProperty('--pc', pk.color); el.style.setProperty('--eh', ev ? ev.hue : 40);
    el.innerHTML = `<div class="pdrays"></div><div class="pdburst"></div><div class="pdburst b2"></div><div class="pdconf">${conf}</div>
      <div class="pdbox bevel"><small>PURCHASE COMPLETE</small><b>${pk.name}</b><span>구매 완료! 아이템이 지급되었습니다</span>
        <ul>${items}</ul>
        <button class="buy bevel" data-pdok><span>확인</span></button></div>`;
    modal.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    G.audio.buy(); setTimeout(() => G.audio.potion(), 140);
    G.audio.blast(pk.tier === 'hyper' ? 7 : pk.tier === 'mega' ? 6 : pk.tier === 'delta' ? 5 : 4);
    pk.items.forEach((_, i) => setTimeout(() => G.audio.tab(), 420 + i * 90));
  }
  function closeCelebrate() {
    const el = modal.querySelector('.pkdone'); if (!el) return;
    el.classList.remove('show'); el.classList.add('out'); setTimeout(() => el.remove(), 260);
  }

  function open() { confirmId = null; modal.hidden = false; paint(); requestAnimationFrame(() => modal.classList.add('show')); }
  function close() { modal.classList.remove('show'); setTimeout(() => { modal.hidden = true; }, 320); }

  btn.addEventListener('click', () => { G.audio.init(); G.audio.tab(); open(); });
  modal.addEventListener('click', ev2 => {
    const t = ev2.target;
    if (modal.querySelector('.pkdone')) {                     // celebration is up: any tap on it dismisses
      if (t.closest('[data-pdok]') || !t.closest('.pdbox')) { G.audio.tab(); closeCelebrate(); }
      return;
    }
    if (t.closest('[data-eclose]') || t.classList.contains('scrim')) { G.audio.tab(); close(); return; }
    const mb = t.closest('[data-month]');
    if (mb) { G.audio.tab(); confirmId = null; G.event.setDevMonth(+mb.dataset.month); paint(); paintButton(); return; }
    const pb = t.closest('[data-pkg]');
    if (!pb) return;
    const id = pb.dataset.pkg, pk = G.event.current().packages.find(p => p.id === id);
    if (confirmId !== id) {                                   // first tap arms it, second tap buys
      if (G.state.crystals < pk.sale) { G.audio.deny(); G.emit('toast', `크리스탈이 부족합니다 (${G.fmtInt(pk.sale)} 필요)`); pb.classList.add('shake'); setTimeout(() => pb.classList.remove('shake'), 400); return; }
      setConfirm(modal.querySelector(`[data-pkg="${confirmId}"]`), false);
      confirmId = id; G.audio.tab(); setConfirm(pb, true);
      clearTimeout(confirmT); confirmT = setTimeout(() => { setConfirm(modal.querySelector(`[data-pkg="${confirmId}"]`), false); confirmId = null; }, 3000);
      return;
    }
    clearTimeout(confirmT); confirmId = null;
    const r = G.act.buyPackage(id);        // emits 'change' -> repaint (scroll kept)
    if (r === 'ok') celebrate(pk);
    else { G.audio.deny(); G.emit('toast', r === 'poor' ? '크리스탈이 부족합니다' : '지금은 구매할 수 없습니다'); }
  });

  G.on('change', () => { if (!modal.hidden && modal.classList.contains('show')) paint(); });
  paintButton();
  setInterval(paintButton, 60000);
})();
