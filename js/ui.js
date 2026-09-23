/* AMETHYST - top HUD, shop / map / upgrade / codex panels */
(() => {
  const $ = s => document.querySelector(s);
  const panel = $('#panel'), tabs = [...document.querySelectorAll('#tabs button')];
  const coinVal = $('#coinVal'), coinBox = $('#coinBox'), luckChip = $('#luckChip'), luckVal = $('#luckVal');
  const foot = $('#foot'), toastEl = $('#toast'), btnSound = $('#btnSound'), btnAuto = $('#btnAuto'), crysVal = $('#crysVal');
  let open = null, shown = 0, lastShown = '', bumpT = 0, toastT = 0;

  $('#coinIco').innerHTML = G.icon('coin', 28);
  const tabIcon = { shop: 'shop', map: 'map', up: 'up', codex: 'book', crystal: 'crystal' };
  tabs.forEach(b => { b.insertAdjacentHTML('afterbegin', G.icon(tabIcon[b.dataset.tab], 18)); });
  const mapTab = document.querySelector('[data-tab=map]');
  mapTab.insertAdjacentHTML('beforeend', '<i class="badge"></i>');
  const mapBadge = mapTab.querySelector('.badge');
  const paintSound = () => { btnSound.innerHTML = G.icon(G.audio.muted ? 'mute' : 'sound', 20); };

  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1400);
  }
  G.on('toast', toast);   // lets other files (game.js etc.) surface a toast without touching ui.js internals

  /* ---------------- panel renderers ---------------- */
  const coinBtn = (cost, extra = '') =>
    `<button class="buy bevel ${G.state.coins < cost ? 'poor' : ''}" ${extra} data-cost="${cost}">${G.icon('coin', 15)}<span>${G.fmt(cost)}</span></button>`;

  const crystalBtn = (cost, extra = '') =>
    `<button class="buy bevel cbuy ${G.state.crystals < cost ? 'poor' : ''}" ${extra} data-ccost="${cost}">${G.icon('crystal', 15)}<span>${G.fmt(cost)}</span></button>`;

  /* coins -> crystals */
  function exchangeCard() {
    const rate = G.data.exchange.rate, max = Math.floor(G.state.coins / rate);
    return `<div class="card bevel exch">
      <div class="ico cyan">${G.icon('exchange', 26)}</div>
      <div class="meta"><b>교환 <small style="display:inline">EXCHANGE</small></b>
        <span>${G.fmt(rate)} 코인 &rarr; <b class="cy">1 크리스탈</b></span>
        <span>보유 <b class="cy">${G.fmtInt(G.state.crystals)}</b> 크리스탈 &nbsp;/&nbsp; 교환 가능 ${G.fmtInt(max)}</span></div>
      <div class="side">
        <div class="pair"><button class="buy bevel small ${max < 1 ? 'poor' : ''}" data-exch="1" data-exmin="1"><span>1개</span></button>
          <button class="buy bevel small ${max < 10 ? 'poor' : ''}" data-exch="10" data-exmin="10"><span>10개</span></button></div>
        <button class="buy bevel small ${max < 1 ? 'poor' : ''}" data-exch="max" data-exmin="1"><span>최대</span></button></div></div>`;
  }

  function crystalShop() {
    const s = G.state;
    const boxes = G.data.boxes.map(b => {
      const tot = b.w.reduce((a, v) => a + v, 0);
      const odds = b.w.map((w, i) => (w > 0 ? `<i style="--hc:hsl(${G.data.potions[i].hue},85%,66%)">${G.data.potions[i].name} <b>${(w / tot * 100).toFixed(w / tot < 0.01 ? 2 : w / tot < 0.1 ? 1 : 0)}%</b></i>` : '')).join('');
      return `<div class="card bevel box" style="--bc:${b.color}">
        <div class="ico bico">${G.icon('shop', 26)}</div>
        <div class="meta"><b style="color:${b.color}">${b.name}</b><small style="color:${b.color}">${b.en}</small>
          <span>열면 <b>크리스탈 1개</b>가 나옵니다 (종류는 확률)</span>
          <div class="odds2">${odds}</div></div>
        <div class="side">${crystalBtn(b.cost, `data-box="${b.id}"`)}</div></div>`;
    }).join('');
    const hidden = pt => (pt.id === 'tutorial' || pt.id === 'hodumaroo') && !(s.potions[pt.id] > 0) && !(s.armed[pt.id] > 0);
    const potions = G.data.potions.filter(pt => !hidden(pt)).map(pt => {
      const have = s.potions[pt.id] || 0, armedN = s.armed[pt.id] || 0;
      const valTxt = pt.guarantee ? `${G.tiers[pt.guarantee].en}+ 확정 <i>/ 1 CLICK, 1회 한정</i>` : `LUCK +${G.fmt(pt.luck)} <i>/ 1 CLICK, 중첩 가능</i>`;
      return `<div class="card bevel potion ${armedN ? 'on' : ''} ${have || armedN ? '' : 'dim'}" style="--ph:${pt.hue}">
        <div class="ico pico">${G.icon('potion', 26)}</div>
        <div class="meta"><b>${pt.name}</b><small>${pt.en}</small>
          <span class="val">${valTxt}</span></div>
        <div class="side"><em>${armedN ? '장전 ' + armedN + (have ? ' · 보유 ' + have : '') : '보유 ' + have}</em>
          <div class="pair">
            <button class="buy bevel small offbtn ${armedN ? '' : 'poor'}" data-punarm="${pt.id}"><span>취소</span></button>
            <button class="buy bevel small ${have ? '' : 'poor'}" data-puse="${pt.id}"><span>마시기</span></button>
          </div></div></div>`;
    }).join('');
    const armedLuck = G.stats.armedLuck();
    return `<div class="ph"><h2>CRYSTAL <small>크리스탈 상점</small></h2><span>크리스탈은 <b>다음 클릭 한 번</b>에만 적용 · 여러 개 중첩 가능</span></div>
      <div class="sub">크리스탈 <b class="cy">${G.fmtInt(s.crystals)}</b> &nbsp;/&nbsp; 크리스탈은 상자에서만 나옵니다${armedLuck ? ` &nbsp;/&nbsp; 장전된 럭 <b class="cy">+${G.fmt(armedLuck)}</b>` : ''}</div>
      ${exchangeCard()}
      <div class="ph mini"><h2>CRYSTAL BOX <small>크리스탈 상자</small></h2></div>
      <div class="list">${boxes}</div>
      <div class="ph mini"><h2>CRYSTALS <small>보유 크리스탈</small></h2></div>
      <div class="list">${potions}</div>`;
  }

  function shop() {
    const luck = G.stats.luck();
    return `<div class="ph"><h2>SHOP <small>상점</small></h2><span>음식을 먹으면 컷신 확률이 올라갑니다</span></div>
      <div class="sub">현재 행운 <b>${G.fmtLuck(luck)}</b></div>
      ${exchangeCard()}
      <div class="ph mini"><h2>FOOD <small>음식</small></h2></div>
      <div class="list">${G.data.foods.map(f => {
        const left = G.stats.buffLeft(f.id), on = left > 0;
        return `<div class="card bevel ${on ? 'on' : ''}">
          <div class="ico">${G.icon(f.icon, 26)}</div>
          <div class="meta"><b>${f.name}</b><small>${f.en}</small>
            <span>LUCK +${f.bonus} &nbsp;/&nbsp; ${G.fmtTime(f.duration)}</span>
            <i class="bar"><u data-bar="${f.id}" data-dur="${f.duration}" style="width:${Math.min(100, left / f.duration * 100)}%"></u></i></div>
          <div class="side"><em data-timer="${f.id}">${on ? G.fmtTime(left) : ''}</em>${coinBtn(f.cost, `data-food="${f.id}"`)}</div></div>`;
      }).join('')}</div>`;
  }

  function upgrades() {
    return `<div class="ph"><h2>UPGRADE <small>강화</small></h2><span>영구 적용</span></div>
      <div class="list">${G.data.upgrades.map(u => {
        const l = G.stats.level(u.id), maxed = l >= u.max;
        return `<div class="card bevel">
          <div class="meta"><b>${u.name}</b><small>${u.en} &nbsp; LV ${l}${u.max < 1e6 ? ' / ' + u.max : ''}</small>
            <span>${u.desc}</span>
            <span class="val">${u.show(u.value(l))}${maxed ? '' : ' <i>&rsaquo;</i> ' + u.show(u.value(l + 1))}</span></div>
          <div class="side">${maxed ? '<button class="buy bevel max" disabled><span>MAX</span></button>' : coinBtn(u.cost(l), `data-up="${u.id}"`)}</div></div>`;
      }).join('')}</div>`;
  }

  function map() {
    const s = G.state;
    return `<div class="ph"><h2>MAP <small>지도</small></h2><span>깊이 내려갈수록 코인 배율과 컷신이 늘어납니다</span></div>
      <div class="list">${G.data.zones.map((z, i) => {
        const n = G.cutscenes.inZone(i).length, cur = i === s.zone, owned = i <= s.maxZone, next = i === s.maxZone + 1;
        const locked = next && z.unlock;
        const isLevel1 = z.unlock && z.unlock.type === 'level1' && !s.level1.restored;
        let btn, req, name = owned || next ? z.name : '???', card = '';
        if (cur) btn = '<button class="buy bevel cur" disabled><span>현재 위치</span></button>';
        else if (owned) btn = `<button class="buy bevel" data-zone="${i}"><span>이동</span></button>`;
        else if (locked && isLevel1) {
          if (!G.stats.allSecretsFound()) { btn = `<button class="buy bevel locked" disabled>${G.icon('lock', 15)}</button>`; }
          else {
            name = 'LEVEL 1'; card = ' level1card';
            req = `<span class="unlockreq met">${G.icon('luck', 12)} 모든 시크릿 발견됨</span>`;
            btn = `<button class="buy bevel level1btn" data-level1open="1"><span>???</span></button>`;
          }
        }
        else if (locked && z.unlock.type === 'level1') {
          // only reached once restored (isLevel1 is false by then), so this is always met
          req = `<span class="unlockreq met">${G.icon('luck', 12)} ${z.unlock.label}</span>`;
          btn = `<button class="buy bevel" data-zone="${i}"><span>해금</span></button>`;
        }
        else if (locked) {
          const have = z.unlock.type === 'secret' ? G.stats.secretFound() : G.stats.divineFound(), met = have >= z.unlock.n;
          req = `<span class="unlockreq ${met ? 'met' : ''}">${G.icon('luck', 12)} ${z.unlock.label || '조건 필요'} (${Math.min(have, z.unlock.n)}/${z.unlock.n})</span>`;
          btn = `<button class="buy bevel ${met ? '' : 'poor'}" data-zone="${i}"><span>${met ? '해금' : '조건 미달'}</span></button>`;
        }
        else if (next) btn = coinBtn(z.cost, `data-zone="${i}"`);
        else btn = `<button class="buy bevel locked" disabled>${G.icon('lock', 15)}</button>`;
        return `<div class="card bevel zone ${cur ? 'on' : ''} ${owned ? '' : 'dim'}${card}" style="--zh:${z.hue}">
          <div class="depth"><b>${String(i + 1).padStart(2, '0')}</b></div>
          <div class="meta"><b>${name}</b><small>${isLevel1 && name === 'LEVEL 1' ? '' : z.en}</small>
            <span>COIN x${z.coinMul} &nbsp;/&nbsp; 컷신 ${n}종</span>${req || ''}</div>
          <div class="side">${btn}</div></div>`;
      }).join('')}</div>`;
  }

  let codexZone = -1;
  const known = c => G.config.unlockCodex || ((G.state.codex[c.id] || {}).n > 0);
  const mapOpen = i => G.config.unlockCodex || i <= G.state.maxZone;

  function codex() {
    const s = G.state, luck = G.stats.luck(), Z = G.data.zones;
    if (codexZone < 0 || codexZone >= Z.length) codexZone = s.zone;
    const zc = c => G.cutscenes.inZone(c);
    const foundOf = i => zc(i).filter(c => (s.codex[c.id] || {}).n > 0).length;
    const chips = Z.map((z, i) => `<button class="chip bevel ${i === codexZone ? 'on' : ''} ${mapOpen(i) ? '' : 'off'}" data-cz="${i}" style="--zh:${z.hue}">
        <b>${String(i + 1).padStart(2, '0')}</b><span>${mapOpen(i) ? foundOf(i) + '/' + zc(i).length : '?'}</span></button>`).join('');
    const z = Z[codexZone], L = zc(codexZone), open = mapOpen(codexZone);
    let head = '', body = '';
    if (!open) {
      body = `<div class="empty">${G.icon('lock', 20)}<span>아직 도달하지 못한 지역입니다</span></div>`;
    } else {
      let last = -1;
      L.forEach(c => {
        if (c.tierIdx !== last) {
          last = c.tierIdx;
          const t = G.tiers[c.tierIdx], n = L.filter(x => x.tierIdx === c.tierIdx);
          body += `<div class="band" style="--tc:${t.color}"><i></i><b>${t.en}</b><span>${t.ko}</span><em>${n.filter(x => (s.codex[x.id] || {}).n > 0).length}/${n.length}</em></div>`;
        }
        const rec = s.codex[c.id], seen = rec && rec.n > 0, ok = known(c), t = G.tiers[c.tierIdx];
        const eff = Math.max(1, Math.ceil(c.odds / luck)), off = rec && rec.skip;
        body += `<div class="card bevel ${ok ? '' : 'dim'} ${off ? 'skipped' : ''}" style="--tc:${t.color}">
          <div class="stripe"></div>
          <div class="meta"><b>${ok ? c.name : '???'}</b>${off ? '<small class="skip">SKIP</small>' : ''}
            <span class="odds">1 in ${G.fmtInt(c.odds)}</span>
            ${luck > 1.001 ? `<span class="eff">현재 1 in ${G.fmtInt(eff)}</span>` : ''}
            <span>${seen ? `발견 ${G.fmtInt(rec.n)}회 &nbsp;/&nbsp; 최고 +${G.fmt(rec.best)}` : '미발견'}</span></div>
          <div class="side">${ok ? `<button class="buy bevel" data-replay="${c.id}">${G.icon('play', 14)}<span>보기</span></button>
            ${seen ? `<button class="buy bevel small ${off ? 'offbtn' : ''}" data-skip="${c.id}"><span>${off ? '컷신 켜기' : '그만 보기'}</span></button>`
              : `<span class="firstonly">첫 감상은 건너뛸 수 없음</span>`}` : ''}</div></div>`;
      });
    }
    const total = G.cutscenes.list.length, found = G.cutscenes.list.filter(c => (s.codex[c.id] || {}).n > 0).length;
    head = `<div class="ph"><h2>CODEX <small>도감</small></h2><span>전체 발견 <b>${found}</b> / ${total}</span></div>
      <div class="chips">${chips}</div>
      <div class="zhead" style="--zh:${z.hue}"><b>${z.name}</b><small>${z.en}</small></div>
      ${G.config.unlockCodex ? '<div class="review">검토 모드: 모든 컷신이 열려 있습니다 (js/config.js)</div>' : ''}`;
    return `${head}<div class="list">${body}</div><div class="reset"><button data-reset>데이터 초기화</button></div>`;
  }
  const ODDS_STEPS = [0, 1e3, 1e4, 1e5, 1e6, 1e7];
  const ODDS_LABEL = v => v === 0 ? '전체' : G.fmt(v) + '+';
  const BANNERS = [['banner', '큰 배너'], ['toast', '작은 알림'], ['flash', '플래시만']];

  function settingsView() {
    const st = G.state.settings;
    return `<div class="ph"><h2>SETTINGS <small>설정</small></h2></div>
      <div class="card bevel setcard">
        <div class="meta"><b>이미 본 컷신은 항상 건너뛰기</b><span>도감에서 개별로 켠 것과 상관없이, 다시 뜬 컷신은 재생하지 않고 바로 보상만 받습니다</span></div>
        <div class="side"><button class="toggle ${st.autoSkipSeen ? 'on' : ''}" data-set="autoSkipSeen" data-val="${!st.autoSkipSeen}"><i></i></button></div></div>
      <div class="card bevel setcard">
        <div class="meta"><b>최소 확률부터 컷신 표시</b><span>이보다 흔한 컷신은 처음 보는 것이라도 재생 없이 보상만 받습니다</span>
          <div class="segset">${ODDS_STEPS.map(v => `<button class="seg ${st.minOdds === v ? 'on' : ''}" data-set="minOdds" data-val="${v}">${ODDS_LABEL(v)}</button>`).join('')}</div></div></div>
      <div class="card bevel setcard">
        <div class="meta"><b>보상 알림 스타일</b><span>컷신을 건너뛸 때(또는 상자를 열 때) 뜨는 알림의 모양</span>
          <div class="segset">${BANNERS.map(([v, label]) => `<button class="seg ${st.bannerStyle === v ? 'on' : ''}" data-set="bannerStyle" data-val="${v}">${label}</button>`).join('')}</div></div></div>
      <div class="card bevel setcard" data-preview="1">
        <div class="meta"><b>알림 미리보기</b><span>지금 스타일로 한 번 띄워봅니다</span></div>
        <div class="side"><button class="buy bevel small" data-prevwin="1"><span>보기</span></button></div></div>
      <div class="card bevel setcard">
        <div class="meta"><b>튜토리얼 다시 보기</b><span>처음 시작할 때 나오는 안내를 다시 재생합니다</span></div>
        <div class="side"><button class="buy bevel small" data-retutorial="1"><span>시작</span></button></div></div>
      <div class="card bevel setcard">
        <div class="meta"><b>진행 데이터 백업</b><span>브라우저 저장소가 지워져도(캐시/쿠키 삭제, 기기 변경 등) 복구할 수 있는 코드를 만들거나 불러옵니다</span></div>
        <div class="side"><button class="buy bevel small" data-savecode="export"><span>코드 만들기</span></button>
          <button class="buy bevel small" data-savecode="import"><span>코드 불러오기</span></button></div></div>`;
  }

  const views = { shop, up: upgrades, map, codex, crystal: crystalShop, settings: settingsView };

  function render() {
    if (!open) return;
    const top = panel.scrollTop;
    panel.innerHTML = views[open]();
    panel.scrollTop = top;
  }

  function setOpen(name) {
    open = open === name ? null : name;
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === open));
    panel.hidden = !open;
    if (open) { panel.scrollTop = 0; render(); }
  }
  G.ui = { closePanel() { if (open) setOpen(open); } };

  /* ---------------- events ---------------- */
  tabs.forEach(b => b.addEventListener('click', () => {
    G.audio.init();
    if (b.dataset.tab === 'codex' && G.state.level1.crystalGone && !G.state.level1.restored && G.jumpscare) { G.jumpscare(); return; }
    G.audio.tab(); setOpen(b.dataset.tab);
  }));
  btnSound.addEventListener('click', () => {
    G.audio.init(); G.audio.setMuted(!G.audio.muted); G.state.muted = G.audio.muted; G.save(); paintSound();
  });
  const btnGear = $('#btnGear');
  btnGear.innerHTML = G.icon('gear', 18);
  btnGear.addEventListener('click', () => { G.audio.init(); G.audio.tab(); setOpen('settings'); });

  $('#crysIco').innerHTML = G.icon('crystal', 15);
  const paintAuto = () => { btnAuto.innerHTML = G.icon(G.state.autoOn ? 'pause' : 'play', 18) + '<em>AUTO</em>'; btnAuto.title = G.state.autoOn ? '자동 클릭 멈추기' : '자동 클릭 다시 켜기'; };
  btnAuto.addEventListener('click', () => {
    G.audio.init(); const on = G.act.toggleAuto(); G.audio.tab(); paintAuto();
    toast(on ? '자동 클릭 재개' : '자동 클릭 정지');
  });
  G.on('change', paintAuto);
  panel.addEventListener('click', ev => {
    G.audio.init();
    const el = ev.target.closest('button'); if (!el || el.disabled) return;
    if (el.dataset.food) {
      if (G.act.buyFood(el.dataset.food)) { G.audio.buy(); } else { G.audio.deny(); toast('코인이 부족합니다'); }
    } else if (el.dataset.up) {
      if (G.act.buyUpgrade(el.dataset.up)) G.audio.buy(); else { G.audio.deny(); toast('코인이 부족합니다'); }
    } else if (el.dataset.zone) {
      const i = +el.dataset.zone, z = G.data.zones[i];
      if (G.act.travel(i)) { G.audio.buy(); } else { G.audio.deny(); toast(z && z.unlock ? '아직 해금 조건을 만족하지 않았습니다' : '코인이 부족합니다'); }
    } else if (el.dataset.level1open) {
      G.ui.closePanel(); if (G.level1) G.level1.open();
    } else if (el.dataset.exch) {
      const ok = el.dataset.exch === 'max' ? G.act.exchangeMax() : G.act.exchange(+el.dataset.exch);
      if (ok) { G.audio.buy(); toast('크리스탈로 교환했습니다'); } else { G.audio.deny(); toast('코인이 부족합니다 (' + G.fmt(G.data.exchange.rate) + ' = 1 크리스탈)'); }
    } else if (el.dataset.box) {
      const pt = G.act.openBox(el.dataset.box);
      if (!pt) { G.audio.deny(); toast('크리스탈이 부족합니다'); } else G.audio.buy();
    } else if (el.dataset.puse) {
      if (G.act.armPotion(el.dataset.puse)) { G.audio.potion(); toast('장전됨 - 다음 클릭에 럭이 중첩됩니다'); } else { G.audio.deny(); toast('보유한 크리스탈이 없습니다'); }
    } else if (el.dataset.punarm) {
      if (G.act.unarmPotion(el.dataset.punarm)) { G.audio.tab(); toast('크리스탈을 되돌렸습니다'); } else { G.audio.deny(); }
    } else if (el.dataset.replay) {
      G.replay(el.dataset.replay);
    } else if (el.dataset.skip) {
      const off = G.act.toggleSkip(el.dataset.skip); G.audio.tab();
      toast(off ? '이 컷신은 더 이상 재생되지 않습니다 (보상은 그대로)' : '컷신이 다시 재생됩니다');
    } else if (el.dataset.cz) {
      codexZone = +el.dataset.cz; G.audio.tab(); render(); panel.scrollTop = 0;
    } else if (el.dataset.set) {
      const raw = el.dataset.val, val = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
      G.act.setSetting(el.dataset.set, val); G.audio.tab();
    } else if (el.dataset.prevwin) {
      G.emit('win', { def: { name: '미리보기 컷신', odds: 123456 }, reward: 123456, tier: G.tiers[4] });
    } else if (el.dataset.retutorial) {
      G.state.tutorialStep = 0; G.state.tutorialDone = false; G.save(); G.ui.closePanel(); G.emit('tutorial:start');
    } else if ('reset' in el.dataset) {
      if (confirm('모든 진행 데이터를 삭제할까요?')) { G.reset(); shown = 0; }
    } else if (el.dataset.savecode === 'export') {
      const code = G.act.exportSave();
      if (code) { prompt('아래 코드를 복사해 안전한 곳에 보관하세요. "코드 불러오기"로 언제든 복구할 수 있습니다.', code); G.audio.tab(); }
      else { G.audio.deny(); toast('코드 생성에 실패했습니다'); }
    } else if (el.dataset.savecode === 'import') {
      const code = prompt('백업 코드를 붙여넣으세요. 현재 진행 데이터를 덮어씁니다.');
      if (code && confirm('코드를 불러오면 현재 진행 데이터를 덮어씁니다. 계속할까요?')) {
        if (G.act.importSave(code)) { G.audio.buy(); toast('데이터를 불러왔습니다'); shown = 0; render(); }
        else { G.audio.deny(); toast('올바르지 않은 코드입니다'); }
      }
    }
  });

  G.on('change', render);

  /* reward banner for cutscenes that were switched off / filtered by settings, and potion box results.
     style comes from settings ('banner' | 'toast' | 'flash') - see 설정 tab. */
  const winEl = $('#win');
  let winT = 0;
  const fireWin = (html, tc, ms) => {
    winEl.className = `style-${G.state.settings.bannerStyle}`;
    winEl.style.setProperty('--tc', tc);
    winEl.innerHTML = html;
    void winEl.offsetWidth; winEl.classList.add('show');
    clearTimeout(winT); winT = setTimeout(() => winEl.classList.remove('show'), ms);
  };
  G.on('win', ({ def, reward, tier }) => {
    fireWin(`<small>${tier.en}</small><b>${def.name}</b><span>1 in ${G.fmtInt(def.odds)}</span><em>+ ${G.fmt(reward)}</em>`, tier.color, 2600);
  });
  /* crystal box opened: spin a roulette strip past a run of crystals before landing on the real
     result, then show the usual reward banner. The outcome is already decided (G.act.openBox already
     picked + granted it) - the strip is just decelerated onto that predetermined item for show.
     Geometry is measured from the actual rendered layout (offsetLeft/clientWidth) rather than
     assumed magic numbers, so the pointer always lines up exactly on the landed card regardless of
     card size/gap tweaks. The spin itself is two stages: a long fast blurred run that slightly
     overshoots the target, then a short bouncy settle back onto it - closer to a real slot machine
     than a single flat deceleration. */
  const spinEl = $('#boxSpin'), spinTrack = spinEl.querySelector('.spintrack'), spinStrip = spinEl.querySelector('.spinstrip');
  function playBoxSpin(potion, onDone) {
    const pool = G.data.potions.filter(p => p.id !== 'tutorial' && p.id !== 'hodumaroo');
    const winIndex = 32, n = 40;
    const items = [];
    for (let i = 0; i < n; i++) items.push(i === winIndex ? potion : pool[(Math.random() * pool.length) | 0]);
    spinStrip.className = 'spinstrip blur';
    spinStrip.style.transition = 'none';
    spinStrip.style.transform = 'translateX(0)';
    spinStrip.innerHTML = items.map((pt, i) => {
      const rarity = pt.secret ? 'SECRET' : (pt.star || 1) + '★';
      return `<div class="spinitem${i === winIndex ? ' win' : ''}${pt.secret ? ' secret' : ''}" style="--ph:${pt.hue}">${G.icon('potion', 26)}<i class="sistar">${rarity}</i><b>${pt.name}</b></div>`;
    }).join('');

    spinEl.hidden = false;
    void spinEl.offsetWidth;
    spinEl.classList.add('show');

    requestAnimationFrame(() => {
      const itemEls = spinStrip.children, target = itemEls[winIndex];
      const trackW = spinTrack.clientWidth;
      const centerOf = el => el.offsetLeft + el.offsetWidth / 2;
      const startX = trackW / 2 - centerOf(itemEls[0]);
      const finalX = trackW / 2 - centerOf(target);
      const overshootX = trackW / 2 - centerOf(itemEls[Math.min(items.length - 1, winIndex + 2)]);

      spinStrip.style.transform = `translateX(${startX}px)`;
      void spinStrip.offsetWidth;
      spinStrip.style.transition = 'transform 2.3s cubic-bezier(.08,.85,.1,1)';
      spinStrip.style.transform = `translateX(${overshootX}px)`;

      [80, 150, 230, 320, 430, 560, 720, 900, 1100, 1350, 1650, 2000].forEach(t => setTimeout(() => G.audio.tab(), t));
      setTimeout(() => spinStrip.classList.remove('blur'), 1750);
      setTimeout(() => {
        spinStrip.style.transition = 'transform .45s cubic-bezier(.3,1.4,.3,1)';
        spinStrip.style.transform = `translateX(${finalX}px)`;
        G.audio.tab();
      }, 2300);
      setTimeout(() => target.classList.add('land'), 2760);
    });

    setTimeout(() => {
      spinEl.classList.remove('show');
      setTimeout(() => { spinEl.hidden = true; onDone(); }, 300);
    }, 3350);
  }
  G.on('box', ({ box, potion, idx }) => {
    playBoxSpin(potion, () => {
      const col = `hsl(${potion.hue},90%,66%)`;
      fireWin(`<small>${box.en} OPENED</small><b>${potion.name}</b><span>${potion.en}</span><em style="color:${col}">LUCK +${G.fmt(potion.luck)}</em>`, col, 2800);
      G.audio.potion(); if (idx >= 4) G.audio.blast(idx);
    });
  });
  G.on('tutorialDone', () => toast('견습생의 크리스탈을 받았습니다 - 크리스탈 탭에서 마셔보세요'));
  G.on('tutorialReplayDone', () => toast('튜토리얼을 다시 봤습니다 (크리스탈은 처음 한 번만 지급돼요)'));
  G.on('coinArrive', () => {
    if (bumpT) return;
    coinBox.classList.add('bump');
    bumpT = setTimeout(() => { coinBox.classList.remove('bump'); bumpT = 0; }, 90);
  });

  /* ---------------- HUD numbers ---------------- */
  function hud(dt) {
    const c = G.state.coins;
    if (!G.hold) {
      const d = c - shown;
      shown += Math.abs(d) < 1 ? d : d * (1 - Math.exp(-dt * (Math.abs(d) > 1e4 ? 5 : 10)));
    }
    const str = G.fmt(shown);
    if (str !== lastShown) { coinVal.textContent = str; lastShown = str; }
  }
  let last = performance.now();
  (function loop(now) { hud(Math.min(0.1, (now - last) / 1000)); last = now; requestAnimationFrame(loop); })(last);

  /* slow tick: timers, affordability, luck chip, footer */
  function tick() {
    const luck = G.stats.luck();
    // crystals, auto button, armed-crystals luck chip (several can stack now)
    const s = G.state, ap = G.stats.armedTop(), armedLuck = G.stats.armedLuck();
    crysVal.textContent = G.fmt(s.crystals);
    btnAuto.classList.toggle('off', !s.autoOn); btnAuto.classList.toggle('idle', G.stats.autoRate() <= 0);
    const guaranteeTop = G.stats.armedList().find(p => p.guarantee);
    luckChip.classList.toggle('potion', !!ap);
    luckChip.querySelector('span').textContent = guaranteeTop ? G.tiers[guaranteeTop.guarantee].en + '+' : ap ? 'NEXT CLICK' : 'LUCK';
    luckVal.textContent = guaranteeTop ? '확정' : ap ? G.fmtLuck(luck + armedLuck) : G.fmtLuck(luck);
    if (ap) luckChip.style.setProperty('--pc', `hsl(${ap.hue},100%,66%)`);
    luckChip.classList.toggle('hot', luck > 1.001);
    const z = G.stats.zone();
    foot.innerHTML = `<b>${z.en}</b><span>${G.fmtInt(G.state.clicks)} MINED</span>`;
    // a fresh map unlock badge on the 지도 tab, until the player actually travels there
    const nz = G.data.zones[G.state.maxZone + 1];
    mapBadge.classList.toggle('show', !!(nz && nz.unlock && G.stats.meetsUnlock(nz.unlock)));
    if (!open) return;
    panel.querySelectorAll('[data-cost]').forEach(b => b.classList.toggle('poor', G.state.coins < +b.dataset.cost));
    panel.querySelectorAll('[data-ccost]').forEach(b => b.classList.toggle('poor', G.state.crystals < +b.dataset.ccost));
    const exMax = Math.floor(G.state.coins / G.data.exchange.rate);
    panel.querySelectorAll('[data-exmin]').forEach(b => b.classList.toggle('poor', exMax < +b.dataset.exmin));
    if (open === 'shop') {
      G.data.foods.forEach(f => {
        const left = G.stats.buffLeft(f.id);
        const t = panel.querySelector(`[data-timer="${f.id}"]`), bar = panel.querySelector(`[data-bar="${f.id}"]`);
        if (t) t.textContent = left > 0 ? G.fmtTime(left) : '';
        if (bar) bar.style.width = Math.min(100, left / f.duration * 100) + '%';
        if (t) t.closest('.card').classList.toggle('on', left > 0);
      });
      const sub = panel.querySelector('.sub b'); if (sub) sub.textContent = G.fmtLuck(luck);
    }
  }
  setInterval(tick, 250);

  G.on('ready', () => { shown = G.state.coins; paintSound(); paintAuto(); tick(); });
  G.on('cut:end', () => { /* wallet counter rolls up on its own once G.hold is released */ });
})();
