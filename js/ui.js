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
  // a NEW dot on 도감 while anything found hasn't been looked at in the codex yet
  const codexTab = document.querySelector('[data-tab=codex]');
  codexTab.insertAdjacentHTML('beforeend', '<i class="badge newb">N</i>');
  const codexBadge = codexTab.querySelector('.badge');
  function paintCodexBadge() {
    const seen = G.state.codexSeen; if (!seen || G.config.viewer) return;
    let any = false; for (const id in G.state.codex) if (G.state.codex[id].n > 0 && !seen[id]) { any = true; break; }
    codexBadge.classList.toggle('show', any);
  }
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
    const s = G.state, multi = G.opt('boxMulti');
    const boxes = G.data.boxes.map(b => {
      const tot = b.w.reduce((a, v) => a + v, 0);
      const odds = b.w.map((w, i) => (w > 0 ? `<i style="--hc:hsl(${G.data.potions[i].hue},85%,66%)">${G.data.potions[i].name} <b>${(w / tot * 100).toFixed(w / tot < 0.01 ? 2 : w / tot < 0.1 ? 1 : 0)}%</b></i>` : '')).join('');
      const tk = s.tickets[b.id] || 0;
      return `<div class="card bevel box" style="--bc:${b.color}">
        <div class="ico bico">${G.icon('shop', 26)}</div>
        <div class="meta"><b style="color:${b.color}">${b.name}</b><small style="color:${b.color}">${b.en}</small>
          <span>열면 <b>크리스탈 1개</b>가 나옵니다 (종류는 확률)</span>
          <div class="odds2">${odds}</div></div>
        <div class="side">${tk ? `<em class="tk">${G.icon('ticket', 13)} 무료권 ${tk}</em><button class="buy bevel ticketbtn" data-box="${b.id}">${G.icon('ticket', 15)}<span>무료로 열기${multi > 1 ? ' x' + multi : ''}</span></button>` : crystalBtn(b.cost * multi, `data-box="${b.id}"`)}${multi > 1 && !tk ? `<em class="tk">${multi}개 한 번에</em>` : ''}</div></div>`;
    }).join('');
    // limited event crystals only show up (and only work) during their own month's event
    const hidden = pt => ((pt.id === 'tutorial' || pt.id === 'hodumaroo') && !(s.potions[pt.id] > 0) && !(s.armed[pt.id] > 0))
      || (pt.event && !G.event.isActive(pt.event));
    const potions = G.data.potions.filter(pt => !hidden(pt)).map(pt => {
      const have = s.potions[pt.id] || 0, armedN = s.armed[pt.id] || 0;
      const valTxt = pt.grantCut ? `${G.cutscenes.byId[pt.grantCut] ? G.cutscenes.byId[pt.grantCut].name : '한정 광물'} 확정 <i>/ SPECIAL</i>`
        : pt.guarantee ? `${G.tiers[pt.guarantee].en}+ 확정 <i>/ 1 CLICK, 1회 한정</i>` : `LUCK +${G.fmt(pt.luck)} <i>/ 1 CLICK, 중첩 가능</i>`;
      return `<div class="card bevel potion ${armedN ? 'on' : ''} ${have || armedN ? '' : 'dim'} ${pt.event ? 'evpot' : ''}" style="--ph:${pt.hue}">
        <div class="ico pico">${G.icon('potion', 26)}</div>
        <div class="meta"><b>${pt.name}</b><small>${pt.event ? '이벤트 한정 · ' : ''}${pt.en}</small>
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

  /* event foods from packages: eaten from here instead of bought. Permanent ones stay listed once active. */
  function foodInventory() {
    const s = G.state, list = G.data.foods.filter(f => f.inv && ((s.foodInv[f.id] || 0) > 0 || (f.perm && s.perm[f.id]) || G.stats.buffLeft(f.id) > 0));
    if (!list.length) return '';
    return `<div class="ph mini"><h2>MY FOOD <small>보유 음식 · 이벤트</small></h2></div>
      <div class="list">${list.map(f => {
        const have = s.foodInv[f.id] || 0, left = G.stats.buffLeft(f.id), permOn = f.perm && s.perm[f.id], on = permOn || left > 0;
        const eff = f.perm ? `LUCK +${G.fmtInt(f.bonus)} · 코인 x${f.coinMul} &nbsp;/&nbsp; <b class="permtag">영구</b>` : `LUCK +${G.fmtInt(f.bonus)} &nbsp;/&nbsp; ${G.fmtTime(f.duration)}`;
        const btn = permOn ? '<button class="buy bevel small max" disabled><span>영구 적용 중</span></button>'
          : `<button class="buy bevel small ${have ? '' : 'poor'}" data-eat="${f.id}"><span>먹기</span></button>`;
        return `<div class="card bevel evfood ${on ? 'on' : ''}">
          <div class="ico">${G.icon(f.icon, 26)}</div>
          <div class="meta"><b>${f.name}</b><small>${f.en}</small><span>${eff}</span>
            ${f.perm ? '' : `<i class="bar"><u data-bar="${f.id}" data-dur="${f.duration}" style="width:${Math.min(100, left / f.duration * 100)}%"></u></i>`}</div>
          <div class="side">${f.perm ? '' : `<em data-timer="${f.id}">${left > 0 ? G.fmtTime(left) : ''}</em>`}
            ${have && !permOn ? `<em>보유 ${have}</em>` : ''}${btn}</div></div>`;
      }).join('')}</div>`;
  }

  function shop() {
    const luck = G.stats.luck();
    return `<div class="ph"><h2>SHOP <small>상점</small></h2><span>음식을 먹으면 컷신 확률이 올라갑니다</span></div>
      <div class="sub">현재 행운 <b>${G.fmtLuck(luck)}</b></div>
      ${exchangeCard()}
      ${foodInventory()}
      <div class="ph mini"><h2>FOOD <small>음식</small></h2></div>
      <div class="list">${G.data.foods.filter(f => !f.inv).map(f => {
        const left = G.stats.buffLeft(f.id), on = left > 0;
        return `<div class="card bevel ${on ? 'on' : ''}">
          <div class="ico">${G.icon(f.icon, 26)}</div>
          <div class="meta"><b>${f.name}</b><small>${f.en}</small>
            <span>LUCK +${f.bonus} &nbsp;/&nbsp; ${G.fmtTime(f.duration)}</span>
            <i class="bar"><u data-bar="${f.id}" data-dur="${f.duration}" style="width:${Math.min(100, left / f.duration * 100)}%"></u></i></div>
          <div class="side"><em data-timer="${f.id}">${on ? G.fmtTime(left) : ''}</em>${coinBtn(f.cost, `data-food="${f.id}"`)}</div></div>`;
      }).join('')}</div>`;
  }

  /* 강화: buy 1 / 10 / as many as you can afford per tap; the card you just upgraded flashes */
  let lastUp = null, lastUpT = 0;
  function upgrades() {
    const mode = G.opt('upgMulti');
    const modes = [[1, 'x1'], [10, 'x10'], ['max', '최대']].map(([v, l]) => `<button class="seg bevel ${mode === v ? 'on' : ''}" data-upm="${v}">${l}</button>`).join('');
    return `<div class="ph"><h2>UPGRADE <small>강화</small></h2><span>영구 적용</span></div>
      <div class="upmode"><span>한 번에</span><div class="segset">${modes}</div></div>
      <div class="list">${G.data.upgrades.map(u => {
        const l = G.stats.level(u.id), maxed = l >= u.max;
        const plan = G.act.upgradePlan(u.id, mode), n = Math.max(1, plan.n), cost = plan.n ? plan.cost : u.cost(l);
        const to = Math.min(u.max, l + n), pct = u.max < 1e6 ? Math.round(l / u.max * 100) : 0;
        return `<div class="card bevel upcard ${lastUp === u.id && performance.now() - lastUpT < 700 ? 'flash' : ''}">
          <div class="meta"><b>${u.name}</b><small>${u.en} &nbsp; LV ${l}${u.max < 1e6 ? ' / ' + u.max : ''}</small>
            <span>${u.desc}</span>
            <span class="val">${u.show(u.value(l))}${maxed ? '' : ` <i>&rsaquo;</i> ${u.show(u.value(to))}${to - l > 1 ? ` <em class="lvup">+${to - l}레벨</em>` : ''}`}</span>
            ${u.max < 1e6 ? `<i class="bar"><u style="width:${pct}%"></u></i>` : ''}</div>
          <div class="side">${maxed ? '<button class="buy bevel max" disabled><span>MAX</span></button>' : coinBtn(cost, `data-up="${u.id}" data-upn="${mode === 'max' ? n : mode}"`)}</div></div>`;
      }).join('')}</div>`;
  }

  function map() {
    const s = G.state;
    return `<div class="ph"><h2>MAP <small>지도</small></h2><span>깊이 내려갈수록 코인 배율과 컷신이 늘어납니다</span></div>
      <div class="list">${G.data.zones.map((z, i) => {
        const isLevel1Zone = z.unlock && z.unlock.type === 'level1';
        const n = G.cutscenes.inZone(i).length, cur = i === s.zone, owned = i <= s.maxZone;
        const review = G.config.unlockCodex;

        // review mode + LEVEL 1's zone: always render BOTH a permanent LEVEL 1 entry card and a
        // normal zone card reflecting its actual state, independent of each other - visiting the
        // real zone (owned becoming true) must not make the LEVEL 1 card disappear, and vice versa
        if (review && isLevel1Zone) {
          const level1Card = `<div class="card bevel zone level1card" style="--zh:${z.hue}">
            <div class="depth"><b>${String(i + 1).padStart(2, '0')}</b></div>
            <div class="meta"><b>LEVEL 1</b><small>${G.stats.allSecretsFound() ? '모든 시크릿 발견됨' : '???'}</small></div>
            <div class="side"><button class="buy bevel level1btn" data-level1open="1"><span>???</span></button></div></div>`;
          const zoneBtn = cur ? '<button class="buy bevel cur" disabled><span>현재 위치</span></button>' : `<button class="buy bevel" data-zone="${i}"><span>이동</span></button>`;
          const realCard = `<div class="card bevel zone ${cur ? 'on' : ''}" style="--zh:${z.hue}">
            <div class="depth"><b>${String(i + 1).padStart(2, '0')}</b></div>
            <div class="meta"><b>${z.name} <small style="opacity:.6">(실제 맵)</small></b><small>${z.en}</small>
              <span>COIN x${z.coinMul} &nbsp;/&nbsp; 컷신 ${n}종</span></div>
            <div class="side">${zoneBtn}</div></div>`;
          return level1Card + realCard;
        }

        const next = i === s.maxZone + 1 || (review && !owned);
        const locked = next && z.unlock;
        let btn, req, name = owned || next ? z.name : '???', card = '';
        if (cur) btn = '<button class="buy bevel cur" disabled><span>현재 위치</span></button>';
        else if (owned) btn = `<button class="buy bevel" data-zone="${i}"><span>이동</span></button>`;
        else if (locked && isLevel1Zone) {
          // production (not review mode - that case returned early above): the classic
          // mystery-card flow - fully hidden until every secret is found, then a "???" prompt
          if (!G.stats.allSecretsFound()) { btn = `<button class="buy bevel locked" disabled>${G.icon('lock', 15)}</button>`; }
          else {
            name = 'LEVEL 1'; card = ' level1card';
            req = `<span class="unlockreq met">${G.icon('luck', 12)} 모든 시크릿 발견됨</span>`;
            btn = `<button class="buy bevel level1btn" data-level1open="1"><span>???</span></button>`;
          }
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
          <div class="meta"><b>${name}</b><small>${card ? '' : z.en}</small>
            <span>COIN x${z.coinMul} &nbsp;/&nbsp; 컷신 ${n}종</span>${req || ''}</div>
          <div class="side">${btn}</div></div>`;
      }).join('')}</div>`;
  }

  let codexZone = -1, codexFilter = 'all', codexQuery = '';
  const pendingSeen = new Set();       // NEW cards currently on screen - marked seen when you leave them
  function commitSeen() {
    if (!pendingSeen.size || !G.state.codexSeen) { pendingSeen.clear(); return; }
    pendingSeen.forEach(id => { G.state.codexSeen[id] = 1; }); pendingSeen.clear(); G.save();
  }
  // search filters the rendered cards in place (re-rendering would steal the input's focus)
  function applySearch() {
    const q = codexQuery.trim().toLowerCase();
    const cards = panel.querySelectorAll('.cxcard');
    cards.forEach(c => { c.hidden = !!q && !c.dataset.name.includes(q); });
    panel.querySelectorAll('.list > .band').forEach(b => {
      let n = b.nextElementSibling, any = false;
      while (n && !n.classList.contains('band')) { if (!n.hidden) { any = true; break; } n = n.nextElementSibling; }
      b.hidden = !!q && !any;
    });
  }
  const known = c => G.config.unlockCodex || ((G.state.codex[c.id] || {}).n > 0);
  const mapOpen = i => G.config.unlockCodex || i <= G.state.maxZone;

  function codex() {
    const s = G.state, luck = G.stats.luck(), Z = G.data.zones;
    if (codexZone < 0 || codexZone > Z.length) codexZone = s.zone;
    // index Z.length = the SPECIAL shelf: the monthly event minerals, which belong to no map
    const SP = Z.length, specials = () => G.cutscenes.list.filter(c => c.special || c.boss).sort((a, b) => (a.boss ? 99 : a.month) - (b.boss ? 99 : b.month));
    const zc = c => (c === SP ? specials() : G.cutscenes.inZone(c));
    const foundOf = i => zc(i).filter(c => (s.codex[c.id] || {}).n > 0).length;
    const seenMap = s.codexSeen || {}, isFound = c => (s.codex[c.id] || {}).n > 0, isNew = c => !G.config.viewer && isFound(c) && !seenMap[c.id];
    const dot = i => (zc(i).some(isNew) ? '<i class="cdot"></i>' : '');
    const spChip = n => `<button class="chip bevel spchip ${codexZone === SP ? 'on' : ''}" data-cz="${SP}" style="--zh:45"><b>SP</b><span>${n}</span>${dot(SP)}</button>`;
    const chips = Z.map((z, i) => `<button class="chip bevel ${i === codexZone ? 'on' : ''} ${mapOpen(i) ? '' : 'off'}" data-cz="${i}" style="--zh:${z.hue}">
        <b>${String(i + 1).padStart(2, '0')}</b><span>${mapOpen(i) ? foundOf(i) + '/' + zc(i).length : '?'}</span>${dot(i)}</button>`).join('') + spChip(foundOf(SP) + '/' + zc(SP).length);
    const z = codexZone === SP ? { name: '스페셜', en: 'SPECIAL · 월별 이벤트 & 보스 처치 광물', hue: 45 } : Z[codexZone];
    // 필터: 전체 / 발견 / 미발견 / NEW
    const keep = c => codexFilter === 'found' ? isFound(c) : codexFilter === 'unfound' ? !isFound(c) : codexFilter === 'new' ? isNew(c) : true;
    const L = zc(codexZone).filter(c => G.config.viewer || keep(c)), open = codexZone === SP || mapOpen(codexZone);
    const oddsTxt = c => c.special ? `SPECIAL · ${c.month}월 ${c.eventName} 한정` : c.boss ? `BOSS · ${c.bossName} 처치 보상`
      : c.weather ? `1 in ${G.fmtInt(c.odds)} · ${G.data.weathers[c.weather].name} 전용` : `1 in ${G.fmtInt(c.odds)}`;
    // mutations this mineral has been found with
    const mutChips = rec => rec && rec.mut ? `<span class="mutchips">${Object.keys(rec.mut).map(k => { const m = G.data.mutations[k]; return m ? `<i style="--mc:${m.color}">${m.name} ×${rec.mut[k]}</i>` : ''; }).join('')}</span>` : '';
    let head = '', body = '';
    if (!open) {
      body = `<div class="empty">${G.icon('lock', 20)}<span>아직 도달하지 못한 지역입니다</span></div>`;
    } else if (!L.length) {
      body = `<div class="empty">${G.icon('book', 20)}<span>${codexFilter === 'new' ? '새로 발견한 광물이 없습니다' : '해당하는 광물이 없습니다'}</span></div>`;
    } else {
      let last = -1;
      L.forEach(c => {
        if (c.tierIdx !== last) {
          last = c.tierIdx;
          const t = G.tiers[c.tierIdx], n = L.filter(x => x.tierIdx === c.tierIdx);
          body += `<div class="band" style="--tc:${t.color}"><i></i><b>${t.en}</b><span>${t.ko}</span><em>${G.config.viewer ? n.length + '종' : n.filter(x => (s.codex[x.id] || {}).n > 0).length + '/' + n.length}</em></div>`;
        }
        const rec = s.codex[c.id], seen = rec && rec.n > 0, ok = known(c), t = G.tiers[c.tierIdx];
        const eff = Math.max(1, Math.ceil(c.odds / luck)), off = rec && rec.skip;
        if (G.config.viewer) {
          body += `<div class="card bevel" style="--tc:${t.color}"><div class="stripe"></div>
            <div class="meta"><b>${c.name}</b><span class="odds">${oddsTxt(c)}</span></div>
            <div class="side"><button class="buy bevel" data-replay="${c.id}">${G.icon('play', 14)}<span>보기</span></button></div></div>`;
          return;
        }
        const fresh = isNew(c); if (fresh) pendingSeen.add(c.id);
        body += `<div class="card bevel cxcard ${ok ? '' : 'dim'} ${off ? 'skipped' : ''} ${fresh ? 'isnew' : ''}" style="--tc:${t.color}" data-name="${ok ? c.name.toLowerCase() : ''}">
          <div class="stripe"></div>
          <div class="meta"><b>${ok ? c.name : '???'}${fresh ? '<small class="newtag">NEW</small>' : ''}</b>${off ? '<small class="skip">SKIP</small>' : ''}
            <span class="odds">${oddsTxt(c)}</span>
            ${luck > 1.001 && !c.special && !c.boss ? `<span class="eff">현재 1 in ${G.fmtInt(eff)}</span>` : ''}
            <span>${seen ? `발견 ${G.fmtInt(rec.n)}회 &nbsp;/&nbsp; 최고 +${G.fmt(rec.best)}` : '미발견'}</span>${mutChips(rec)}</div>
          <div class="side">${ok ? `<button class="buy bevel" data-replay="${c.id}">${G.icon('play', 14)}<span>보기</span></button>
            ${seen ? `<button class="buy bevel small ${off ? 'offbtn' : ''}" data-skip="${c.id}"><span>${off ? '컷신 켜기' : '그만 보기'}</span></button>`
              : `<span class="firstonly">첫 감상은 건너뛸 수 없음</span>`}` : ''}</div></div>`;
      });
    }
    const total = G.cutscenes.list.length, found = G.cutscenes.list.filter(c => (s.codex[c.id] || {}).n > 0).length;
    if (G.config.viewer) {
      const vchips = Z.map((zz, i) => `<button class="chip bevel ${i === codexZone ? 'on' : ''}" data-cz="${i}" style="--zh:${zz.hue}">
        <b>${String(i + 1).padStart(2, '0')}</b><span>${zc(i).length}</span></button>`).join('') + spChip(zc(SP).length);
      return `<div class="ph"><h2>AMETHYST <small>도감</small></h2><span>컷신 전체 <b>${total}</b>종 · 눌러서 감상</span></div>
        <div class="chips">${vchips}</div>
        <div class="zhead" style="--zh:${z.hue}"><b>${z.name}</b><small>${z.en}</small></div>
        <div class="list">${body}</div>`;
    }
    const newCount = G.cutscenes.list.filter(isNew).length;
    const filters = [['all', '전체'], ['found', '발견'], ['unfound', '미발견'], ['new', `NEW${newCount ? ' ' + newCount : ''}`]]
      .map(([v, l]) => `<button class="seg bevel ${codexFilter === v ? 'on' : ''} ${v === 'new' && newCount ? 'hasnew' : ''}" data-cf="${v}">${l}</button>`).join('');
    head = `<div class="ph"><h2>CODEX <small>도감</small></h2><span>전체 발견 <b>${found}</b> / ${total} <em class="pct">(${Math.floor(found / total * 100)}%)</em></span></div>
      <div class="chips">${chips}</div>
      <div class="zhead" style="--zh:${z.hue}"><b>${z.name}</b><small>${z.en}</small></div>
      <div class="cxtools"><input type="search" class="cxsearch" placeholder="이 지도에서 광물 이름 검색" value="${codexQuery.replace(/"/g, '&quot;')}" data-cxq><div class="segset">${filters}</div></div>
      ${G.config.unlockCodex ? '<div class="review">검토 모드: 모든 컷신이 열려 있습니다 (js/config.js)</div>' : ''}`;
    return `${head}<div class="list">${body}</div><div class="reset"><button data-reset>데이터 초기화</button></div>`;
  }
  const ODDS_STEPS = [0, 1e3, 1e4, 1e5, 1e6, 1e7];
  const ODDS_LABEL = v => v === 0 ? '전체' : G.fmt(v) + '+';
  const BANNERS = [['banner', '큰 배너'], ['card', '카드'], ['toast', '작은 알림'], ['ticker', '상단 한 줄'], ['bottom', '하단 알림'],
    ['chip', '미니'], ['cinema', '시네마'], ['neon', '네온'], ['stamp', '도장'], ['glitch', '글리치'], ['receipt', '영수증'],
    ['hologram', '홀로그램'], ['comic', '만화'], ['pixel', '레트로'], ['sticky', '포스트잇'], ['scroll', '두루마리'],
    ['rain', '글자 비'], ['typer', '타자기'], ['flash', '플래시만'], ['off', '끄기']];
  const PER_CHAR = ['rain', 'typer', 'pixel'];

  /* 설정: five sections of settings (defaults + meaning in js/core/state.js G.defaultSettings).
     Every row is either an on/off toggle or a row of choices; both write through data-set/data-val. */
  let setSec = 'sound';
  function settingsView() {
    const st = G.state.settings;
    const toggle = (key, title, desc, off) => `<div class="card bevel setcard ${off ? 'na' : ''}">
        <div class="meta"><b>${title}</b><span>${off || desc}</span></div>
        <div class="side"><button class="toggle ${st[key] ? 'on' : ''}" data-set="${key}" data-val="${!st[key]}" ${off ? 'disabled' : ''}><i></i></button></div></div>`;
    const seg = (key, title, desc, opts) => `<div class="card bevel setcard">
        <div class="meta"><b>${title}</b><span>${desc}</span>
          <div class="segset">${opts.map(([v, label]) => `<button class="seg bevel ${st[key] === v ? 'on' : ''}" data-set="${key}" data-val="${v}">${label}</button>`).join('')}</div></div></div>`;
    const action = (title, desc, btns) => `<div class="card bevel setcard"><div class="meta"><b>${title}</b><span>${desc}</span></div><div class="side">${btns}</div></div>`;
    const VOL = [[0, '끔'], [25, '25%'], [50, '50%'], [75, '75%'], [100, '100%']];
    const SECS = [['sound', '소리'], ['screen', '화면'], ['theme', '테마'], ['cut', '컷신'], ['easy', '편의'], ['data', '데이터']];
    let body = '';
    if (setSec === 'sound') body =
      seg('volume', '전체 볼륨', '게임의 모든 소리 크기 (위쪽 스피커 버튼은 완전 음소거)', VOL) +
      seg('cutVolume', '컷신 소리', '광물이 등장할 때 나오는 연출 음악과 효과음 크기', VOL) +
      toggle('sndMine', '채굴 효과음', '크리스탈을 칠 때의 타격음 · 코인 소리 · 치명타 · 파쇄음') +
      toggle('sndUi', '버튼 효과음', '탭 이동, 구매, 실패할 때 나는 소리') +
      toggle('bgMute', '백그라운드에서 소리 끄기', '다른 앱이나 탭으로 가면 소리를 멈추고, 돌아오면 다시 켭니다');
    else if (setSec === 'screen') body =
      seg('quality', '그래픽 품질', '낮출수록 배터리와 발열이 줄어듭니다 (화면 선명도)', [['high', '고화질'], ['mid', '보통'], ['low', '절약']]) +
      seg('particles', '파티클 양', '채굴할 때 튀는 파편과 불꽃의 양', [[1, '많이'], [0.55, '보통'], [0.2, '적게'], [0, '끔']]) +
      seg('shake', '화면 흔들림', '치명타 · 파쇄 · 컷신 등장 때 화면이 흔들리는 정도', [[1, '보통'], [0.5, '약하게'], [0, '끔']]) +
      toggle('lessFlash', '번쩍임 줄이기', '화면 전체가 하얗게 번쩍이는 효과를 크게 줄입니다 (눈이 피로하거나 빛에 민감할 때)') +
      toggle('floatText', '떠오르는 숫자', '채굴할 때 크리스탈 위로 떠오르는 +코인 · CRIT 글자') +
      seg('numFmt', '숫자 표기', `예시: ${[['short', '1.23M'], ['kr', '123만'], ['full', '1,230,000']].map(([, e]) => e).join(' / ')}`, [['short', '1.23M'], ['kr', '123만'], ['full', '전체 숫자']]);
    else if (setSec === 'theme') body = `<div class="sub">게임 전체의 색과 배경 분위기를 바꿉니다 · 한 번 사면 언제든 바꿔 쓸 수 있어요 · 보유 크리스탈 <b class="cy">${G.fmtInt(G.state.crystals)}</b></div>` +
      G.data.themes.map(t => {
        const own = G.state.themesOwned[t.id], using = G.state.theme === t.id, trying = G.isPreviewing && G.isPreviewing(t.id);
        const [bg, acc, btn] = t.preview;
        const btns = using ? '<button class="buy bevel small max" disabled><span>사용 중</span></button>'
          : own ? `<button class="buy bevel small ready" data-themeuse="${t.id}"><span>적용</span></button>`
          : `<button class="buy bevel small ${trying ? 'on' : ''}" data-themetry="${t.id}"><span>${trying ? '미리보는 중' : '미리보기'}</span></button>${crystalBtn(t.price, `data-themebuy="${t.id}"`)}`;
        return `<div class="card bevel themecard ${using ? 'using' : ''}" style="--tbg:${bg};--tacc:${acc};--tbtn:${btn}">
          <div class="tswatch"><i></i><i></i><i></i><em class="amb-${t.ambient}"></em></div>
          <div class="meta"><b>${t.name}</b><small>${t.en}</small><span>${t.desc}</span>
            <span class="tprice">${t.price ? (own ? '보유 중' : `${G.icon('crystal', 11)} ${G.fmtInt(t.price)}`) : '기본 테마'}</span></div>
          <div class="side">${btns}</div></div>`;
      }).join('');
    else if (setSec === 'cut') body =
      toggle('autoSkipSeen', '이미 본 컷신은 항상 건너뛰기', '도감에서 개별로 켠 것과 상관없이, 다시 뜬 컷신은 재생하지 않고 바로 보상만 받습니다') +
      seg('minOdds', '최소 확률부터 컷신 표시', '이보다 흔한 컷신은 처음 보는 것이라도 재생 없이 보상만 받습니다', ODDS_STEPS.map(v => [v, ODDS_LABEL(v)])) +
      toggle('captions', '컷신 자막', '컷신 중에 나오는 문구를 표시합니다') +
      seg('bannerStyle', '보상 알림 스타일', '컷신을 건너뛸 때, 상자를 열 때 뜨는 알림의 모양 (끄기: 소리만 납니다)', BANNERS) +
      seg('bannerTime', '알림 표시 시간', '알림이 화면에 머무는 시간', [[0.6, '짧게'], [1, '보통'], [1.6, '길게'], [2.5, '아주 길게']]) +
      action('알림 미리보기', '지금 스타일로 한 번 띄워봅니다 (누를 때마다 다른 등급)', '<button class="buy bevel small" data-prevwin="1"><span>보기</span></button>');
    else if (setSec === 'easy') body =
      toggle('boxSpin', '상자 룰렛 연출', '끄면 크리스탈 상자를 열자마자 결과가 바로 나옵니다') +
      seg('boxMulti', '상자 한 번에 열기', '한 번 누를 때 여는 상자 수 (무료권이 먼저 쓰이고, 여러 개는 결과를 한 번에 보여줍니다)', [[1, '1개'], [10, '10개'], [50, '50개']]) +
      toggle('pkgConfirm', '패키지 구매 확인', '이벤트 패키지를 살 때 한 번 더 눌러야 구매되게 합니다 (실수 방지)') +
      toggle('offlineAuto', '오프라인 보상 자동으로 받기', '돌아왔을 때 창을 띄우지 않고 바로 받고 알림만 띄웁니다') +
      toggle('wakeLock', '화면 꺼짐 방지', '게임을 켜두는 동안 화면이 자동으로 꺼지지 않게 합니다 (자동 채굴을 볼 때)', G.canWakeLock() ? '' : '이 브라우저에서는 지원되지 않습니다') +
      toggle('vibrate', '진동', '치명타 · 파쇄 · 높은 등급 광물이 나올 때 폰을 진동시킵니다', G.canVibrate() ? '' : '이 기기에서는 지원되지 않습니다 (주로 안드로이드 폰에서 동작)') +
      `<div class="card bevel setcard"><div class="meta"><b>키보드 단축키 (PC)</b><span>
        <span class="kbds"><kbd>Space</kbd> 채굴 · 컷신 넘기기 <kbd>1</kbd>~<kbd>5</kbd> 탭 열기 <kbd>S</kbd> 설정 <kbd>E</kbd> 이벤트 <kbd>M</kbd> 소리 <kbd>A</kbd> 자동 채굴 <kbd>Esc</kbd> 닫기</span></span></div></div>`;
    else body =
      action('튜토리얼 다시 보기', '처음 시작할 때 나오는 안내를 다시 재생합니다', '<button class="buy bevel small" data-retutorial="1"><span>시작</span></button>') +
      action('진행 데이터 백업', '브라우저 저장소가 지워져도(캐시/쿠키 삭제, 기기 변경 등) 복구할 수 있는 코드를 만들거나 불러옵니다',
        '<button class="buy bevel small" data-savecode="export"><span>코드 만들기</span></button><button class="buy bevel small" data-savecode="import"><span>코드 불러오기</span></button>') +
      action('설정 초기화', '모든 설정을 처음 값으로 되돌립니다 (게임 진행은 그대로)', '<button class="buy bevel small" data-resetset="1"><span>초기화</span></button>');
    return `<div class="ph"><h2>SETTINGS <small>설정</small></h2><span>바꾸면 바로 적용되고 저장됩니다</span></div>
      <div class="chips setchips">${SECS.map(([id, label]) => `<button class="chip bevel ${setSec === id ? 'on' : ''}" data-setsec="${id}"><b>${label}</b></button>`).join('')}</div>
      <div class="list">${body}</div>`;
  }

  const views = { shop, up: upgrades, map, codex, crystal: crystalShop, settings: settingsView };

  function render() {
    if (!open) return;
    // don't rebuild the codex under the player's fingers while they're typing a search
    if (open === 'codex' && document.activeElement && document.activeElement.matches && document.activeElement.matches('[data-cxq]')) return;
    const top = panel.scrollTop;
    panel.innerHTML = views[open]();
    panel.scrollTop = top;
    if (open === 'codex') applySearch();
  }

  // every tab remembers where you'd scrolled to
  const scrollMem = {};
  function setOpen(name) {
    if (open) scrollMem[open] = panel.scrollTop;
    if (open === 'codex') commitSeen();
    open = open === name ? null : name;
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === open));
    panel.hidden = !open;
    if (open) { panel.scrollTop = 0; render(); panel.scrollTop = scrollMem[open] || 0; }
    paintCodexBadge();
  }
  G.ui = { closePanel() { if (open && !G.config.viewer) setOpen(open); } };
  if (G.config.viewer) setOpen('codex');

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
    } else if (el.dataset.eat) {
      const r = G.act.eatFood(el.dataset.eat);
      if (r === 'perm') { G.audio.potion(); toast('영구 효과가 적용되었습니다'); }
      else if (r === 'ok') { G.audio.buy(); toast('맛있게 먹었습니다 - 행운 상승'); }
      else if (r === 'already') { G.audio.deny(); toast('이미 영구 적용 중입니다'); }
      else { G.audio.deny(); toast('보유한 음식이 없습니다'); }
    } else if (el.dataset.upm) {
      const v = el.dataset.upm === 'max' ? 'max' : +el.dataset.upm;
      G.act.setSetting('upgMulti', v); G.audio.tab();
    } else if (el.dataset.up) {
      lastUp = el.dataset.up; lastUpT = performance.now();
      const n = G.act.buyUpgrade(el.dataset.up, Math.max(1, +el.dataset.upn || 1));
      if (n) { G.audio.buy(); if (n > 1) toast(`${G.data.upgrades.find(u => u.id === el.dataset.up).name} +${n}레벨`); }
      else { lastUp = null; G.audio.deny(); toast('코인이 부족합니다'); }
    } else if (el.dataset.zone) {
      const i = +el.dataset.zone, z = G.data.zones[i];
      if (G.act.travel(i)) { G.audio.buy(); } else { G.audio.deny(); toast(z && z.unlock ? '아직 해금 조건을 만족하지 않았습니다' : '코인이 부족합니다'); }
    } else if (el.dataset.level1open) {
      G.ui.closePanel(); if (G.level1) G.level1.open();
    } else if (el.dataset.exch) {
      const ok = el.dataset.exch === 'max' ? G.act.exchangeMax() : G.act.exchange(+el.dataset.exch);
      if (ok) { G.audio.buy(); toast('크리스탈로 교환했습니다'); } else { G.audio.deny(); toast('코인이 부족합니다 (' + G.fmt(G.data.exchange.rate) + ' = 1 크리스탈)'); }
    } else if (el.dataset.box) {
      // 설정 - 상자 한 번에 열기: several boxes in one tap, summarised in a single banner
      const n = G.opt('boxMulti'), box = G.data.boxes.find(b => b.id === el.dataset.box), got = {};
      let opened = 0;
      boxBatch = n > 1;
      for (let i = 0; i < n; i++) { const pt = G.act.openBox(box.id); if (!pt) break; opened++; got[pt.id] = (got[pt.id] || 0) + 1; }
      boxBatch = false;
      if (!opened) { G.audio.deny(); toast('크리스탈이 부족합니다'); }
      else { G.audio.buy(); if (n > 1) showBoxBatch(box, got, opened, n); }
    } else if (el.dataset.puse) {
      const pu = G.stats.potion(el.dataset.puse);
      if (G.act.armPotion(el.dataset.puse)) { G.audio.potion(); toast(pu && pu.grantCut ? '장전됨 - 다음 클릭에 한정 광물이 확정으로 나옵니다' : '장전됨 - 다음 클릭에 럭이 중첩됩니다'); } else { G.audio.deny(); toast('보유한 크리스탈이 없습니다'); }
    } else if (el.dataset.punarm) {
      if (G.act.unarmPotion(el.dataset.punarm)) { G.audio.tab(); toast('크리스탈을 되돌렸습니다'); } else { G.audio.deny(); }
    } else if (el.dataset.replay) {
      G.replay(el.dataset.replay);
    } else if (el.dataset.skip) {
      const off = G.act.toggleSkip(el.dataset.skip); G.audio.tab();
      toast(off ? '이 컷신은 더 이상 재생되지 않습니다 (보상은 그대로)' : '컷신이 다시 재생됩니다');
    } else if (el.dataset.cz) {
      if (+el.dataset.cz !== codexZone) commitSeen();
      codexZone = +el.dataset.cz; G.audio.tab(); render(); panel.scrollTop = 0; paintCodexBadge();
    } else if (el.dataset.cf) {
      codexFilter = el.dataset.cf; G.audio.tab(); render(); panel.scrollTop = 0;
    } else if (el.dataset.themeuse) {
      if (G.act.setTheme(el.dataset.themeuse)) { G.audio.potion(); toast(`${G.data.themes.find(t => t.id === el.dataset.themeuse).name} 테마를 적용했습니다`); }
    } else if (el.dataset.themetry) {
      G.previewTheme(el.dataset.themetry); G.audio.tab(); render(); toast('6초 동안 미리보기 중입니다');
    } else if (el.dataset.themebuy) {
      const t = G.data.themes.find(x => x.id === el.dataset.themebuy);
      if (G.state.crystals < t.price) { G.audio.deny(); toast(`크리스탈이 부족합니다 (${G.fmtInt(t.price)} 필요)`); }
      else if (confirm(`${t.name} 테마를 ${G.fmtInt(t.price)} 크리스탈에 구매할까요?`)) {
        if (G.act.buyTheme(t.id) === 'ok') { G.audio.buy(); G.audio.blast(5); toast(`${t.name} 테마를 구매하고 적용했습니다`); }
      }
    } else if (el.dataset.setsec) {
      setSec = el.dataset.setsec; G.audio.tab(); render(); panel.scrollTop = 0;
    } else if (el.dataset.resetset) {
      if (confirm('모든 설정을 처음 값으로 되돌릴까요? (게임 진행은 그대로입니다)')) { G.act.resetSettings(); toast('설정을 초기화했습니다'); }
    } else if (el.dataset.set) {
      const raw = el.dataset.val, val = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
      G.act.setSetting(el.dataset.set, val); G.audio.tab();
    } else if (el.dataset.prevwin) {
      // a real mineral from a random tier, so every press shows a different colour and size of number
      const pool = G.cutscenes.list.filter(c => c.tierIdx >= 3), def = pool[Math.floor(Math.random() * pool.length)];
      G.emit('win', { def, reward: G.cutscenes.reward(def), tier: G.tiers[def.tierIdx] });
      if (G.opt('bannerStyle') === 'off') toast('알림이 꺼져 있습니다');
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
  panel.addEventListener('input', ev => {
    if (!ev.target.matches('[data-cxq]')) return;
    codexQuery = ev.target.value; applySearch();
  });

  /* reward banner for cutscenes that were switched off / filtered by settings, and potion box results.
     style comes from settings ('banner' | 'toast' | 'flash') - see 설정 tab. */
  const winEl = $('#win');
  let winT = 0;
  const fireWin = (html, tc, ms) => {
    const style = G.opt('bannerStyle');
    if (style === 'off') return;                              // 설정 - 알림 끄기 (the sound still plays)
    ms = Math.round(ms * G.opt('bannerTime'));
    winEl.className = `style-${style}`;
    winEl.style.setProperty('--tc', tc);
    winEl.style.setProperty('--dur', ms + 'ms');
    winEl.innerHTML = html;
    // letter-by-letter styles: split the title into one element per character (text only, so it stays safe)
    const bEl = winEl.querySelector('b');
    if (bEl && PER_CHAR.includes(style)) {
      const chars = [...bEl.textContent];
      bEl.innerHTML = ''; chars.forEach((ch, i) => { const s = document.createElement('i'); s.style.setProperty('--i', i); s.textContent = ch === ' ' ? ' ' : ch; bEl.appendChild(s); });
      winEl.style.setProperty('--n', chars.length);
    }
    void winEl.offsetWidth; winEl.classList.add('show');
    clearTimeout(winT); winT = setTimeout(() => winEl.classList.remove('show'), ms);
  };
  G.on('win', ({ def, reward, tier, mut }) => {
    fireWin(`${mut ? `<i class="mut" style="--mc:${mut.color}">MUTATION · ${mut.en}</i>` : ''}<small>${tier.en}</small><b>${mut ? def.name + ': ' + mut.name : def.name}</b><span>${def.special ? 'SPECIAL' : '1 in ' + G.fmtInt(def.odds)}</span><em>+ ${G.fmt(reward)}</em>`, tier.color, 2600);
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
    const pool = G.data.potions.filter(p => p.id !== 'tutorial' && p.id !== 'hodumaroo' && !p.event);
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
  let boxBatch = false;
  G.on('box', ({ box, potion, idx }) => {
    if (boxBatch) return;                               // a multi-open shows one summary instead
    const done = () => {
      const col = `hsl(${potion.hue},90%,66%)`;
      fireWin(`<small>${box.en} OPENED</small><b>${potion.name}</b><span>${potion.en}</span><em style="color:${col}">LUCK +${G.fmt(potion.luck)}</em>`, col, 2800);
      G.audio.potion(); if (idx >= 4) G.audio.blast(idx);
    };
    if (G.opt('boxSpin')) playBoxSpin(potion, done); else done();   // 설정 - 상자 룰렛 연출
  });
  function showBoxBatch(box, got, opened, asked) {
    const list = Object.keys(got).map(id => G.stats.potion(id)).sort((a, b) => (b.luck || 0) - (a.luck || 0));
    const best = list[0], col = `hsl(${best.hue},90%,66%)`;
    const rows = list.map(p => `<i style="color:hsl(${p.hue},90%,70%)">${p.name.replace(' 크리스탈', '')} x${got[p.id]}</i>`).join(' · ');
    fireWin(`<small>${box.en} x${opened}${opened < asked ? ` (크리스탈 부족 · ${asked}개 중)` : ''}</small><b>${box.name} ${opened}개 개봉</b><span style="font-size:12px;line-height:1.5">${rows}</span><em style="color:${col}">최고 ${best.name}</em>`, col, 3400);
    G.audio.potion(); G.audio.blast(Math.min(8, G.data.potions.indexOf(best)));
  }
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
  requestAnimationFrame(function loop(now) { const dt = Math.min(0.1, (now - last) / 1000); hud(dt); crysRoll(dt); last = now; requestAnimationFrame(loop); });

  /* ---------------- HUD details ---------------- */
  const cpsEl = $('#cps'), buffsEl = $('#buffs'), luckPop = $('#luckPop');
  let crysShown = null, lastBuffs = '';
  const fmtB = v => (v < 100 && v % 1 ? v.toFixed(1) : G.fmt(v));      // food bonuses like +0.5 / +1.5
  // crystals roll toward their real value like the coin counter does
  function crysRoll(dt) {
    const c = G.state.crystals;
    if (crysShown === null) crysShown = c;
    const d = c - crysShown; crysShown += Math.abs(d) < 1 ? d : d * (1 - Math.exp(-dt * 8));
    const str = G.fmt(crysShown); if (crysVal.textContent !== str) crysVal.textContent = str;
  }
  function paintHud() {
    const s = G.state;
    // coins per second from the auto-miner (expected value, crits included)
    const rate = s.autoOn ? G.stats.autoRate() : 0;
    const cps = rate * G.stats.clickValue() * (1 + G.stats.critChance() * (G.stats.critMul() - 1));
    cpsEl.textContent = cps > 0 ? `+${G.fmt(cps)}/s` : '';
    // active food buffs as small chips with a countdown
    const list = G.data.foods.filter(f => !f.perm && G.stats.buffLeft(f.id) > 0);
    const key = list.map(f => f.id).join();
    if (key !== lastBuffs) {
      lastBuffs = key;
      buffsEl.innerHTML = list.map(f => `<span class="bchip" data-bf="${f.id}" title="${f.name}">${G.icon(f.icon, 13)}<b>+${fmtB(f.bonus)}</b><em></em><i></i></span>`).join('');
    }
    list.forEach(f => {
      const el = buffsEl.querySelector(`[data-bf="${f.id}"]`); if (!el) return;
      const left = G.stats.buffLeft(f.id);
      el.querySelector('em').textContent = G.fmtTime(left);
      el.querySelector('i').style.width = Math.min(100, left / f.duration * 100) + '%';
      el.classList.toggle('low', left < 15);
    });
  }
  // tap the luck chip: where your luck comes from
  function showLuckBreakdown() {
    const rows = [['기본', 1]], s = G.state;
    const core = G.stats.val('luck'); if (core > 0) rows.push([`행운의 핵 Lv.${G.stats.level('luck')}`, core]);
    for (const f of G.data.foods) {
      if (f.perm && s.perm[f.id]) rows.push([`${f.name} (영구)`, f.bonus]);
      else if (!f.perm && G.stats.buffLeft(f.id) > 0) rows.push([`${f.name} · ${G.fmtTime(G.stats.buffLeft(f.id))}`, f.bonus]);
    }
    const armed = G.stats.armedLuck();
    const total = G.stats.luck(), wxm = G.weather ? G.weather.mul('luck') : 1, wx = G.weather && G.weather.current();
    luckPop.innerHTML = `<b>LUCK 구성</b>${rows.map(([n, v]) => `<div><span>${n}</span><em>${n === '기본' ? 'x1' : '+' + fmtB(v)}</em></div>`).join('')}
      ${wxm !== 1 ? `<div><span>날씨 · ${wx.name}</span><em>x${fmtB(wxm)}</em></div>` : ''}
      <div class="tot"><span>합계</span><em>${G.fmtLuck(total)}</em></div>
      ${armed ? `<div class="arm"><span>다음 클릭 (장전 크리스탈)</span><em>+${G.fmt(armed)}</em></div>` : ''}
      <small>파쇄 직후 클릭은 행운 x5</small>`;
    luckPop.hidden = false; void luckPop.offsetWidth; luckPop.classList.add('show');
    clearTimeout(showLuckBreakdown.t);
    showLuckBreakdown.t = setTimeout(hideLuck, 4500);
  }
  function hideLuck() { luckPop.classList.remove('show'); setTimeout(() => { if (!luckPop.classList.contains('show')) luckPop.hidden = true; }, 200); }
  luckChip.addEventListener('click', () => { G.audio.init(); G.audio.tab(); if (luckPop.classList.contains('show')) hideLuck(); else showLuckBreakdown(); });
  luckChip.style.cursor = 'pointer';

  // a "no" sound also shakes the button that was pressed, so it's obvious what failed
  let pressed = null;
  document.addEventListener('pointerdown', e => { pressed = e.target.closest && e.target.closest('button'); }, true);
  const deny0 = G.audio.deny.bind(G.audio);
  G.audio.deny = () => {
    deny0();
    const b = pressed; if (!b || !b.isConnected) return;
    b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
    setTimeout(() => b.classList.remove('nope'), 400);
  };

  /* PC shortcuts: 1-5 tabs, S settings, E event, M sound, A auto, Esc closes whatever is open */
  window.addEventListener('keydown', ev => {
    if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || G.config.viewer) return;
    if (ev.target.matches && ev.target.matches('input, textarea')) { if (ev.key === 'Escape') ev.target.blur(); return; }
    if (G.cutscenes.active || (G.boss && G.boss.active) || document.getElementById('level1').classList.contains('show')) return;
    const k = ev.key.toLowerCase(), order = ['shop', 'map', 'up', 'codex', 'crystal'];
    if (k >= '1' && k <= '5') { const b = document.querySelector(`[data-tab="${order[+k - 1]}"]`); if (b) b.click(); }
    else if (k === 's') $('#btnGear').click();
    else if (k === 'e') { const b = $('#btnEvent'); if (!b.hidden) b.click(); }
    else if (k === 'm') btnSound.click();
    else if (k === 'a') btnAuto.click();
    else if (k === 'escape') {
      const em = $('#eventModal');
      if (!em.hidden) { const x = em.querySelector('.pkdone [data-pdok]') || em.querySelector('[data-eclose]'); if (x) x.click(); }
      else if (!luckPop.hidden) hideLuck();
      else G.ui.closePanel();
    }
  });

  /* slow tick: timers, affordability, luck chip, footer */
  function tick() {
    const luck = G.stats.luck();
    // crystals, auto button, armed-crystals luck chip (several can stack now)
    const s = G.state, ap = G.stats.armedTop(), armedLuck = G.stats.armedLuck();
    btnAuto.classList.toggle('off', !s.autoOn); btnAuto.classList.toggle('idle', G.stats.autoRate() <= 0);
    const guaranteeTop = G.stats.armedList().find(p => p.guarantee), grantTop = G.stats.armedList().find(p => p.grantCut);
    luckChip.classList.toggle('potion', !!ap);
    luckChip.querySelector('span').textContent = grantTop ? 'SPECIAL' : guaranteeTop ? G.tiers[guaranteeTop.guarantee].en + '+' : ap ? 'NEXT CLICK' : 'LUCK';
    luckVal.textContent = grantTop || guaranteeTop ? '확정' : ap ? G.fmtLuck(luck + armedLuck) : G.fmtLuck(luck);
    if (ap) luckChip.style.setProperty('--pc', `hsl(${ap.hue},100%,66%)`);
    luckChip.classList.toggle('hot', luck > 1.001);
    const z = G.stats.zone();
    foot.innerHTML = `<b>${z.en}</b><span>${G.fmtInt(G.state.clicks)} MINED</span>`;
    // a fresh map unlock badge on the 지도 tab, until the player actually travels there
    const nz = G.data.zones[G.state.maxZone + 1];
    mapBadge.classList.toggle('show', !!(nz && nz.unlock && G.stats.meetsUnlock(nz.unlock)));
    paintCodexBadge();
    paintHud();
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
