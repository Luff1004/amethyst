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
  // the crystal tab stays padlocked until the first 1억+ find
  const crystalTab = document.querySelector('[data-tab=crystal]');
  crystalTab.insertAdjacentHTML('beforeend', `<i class="tlock">${G.icon('lock', 12)}</i>`);
  const mapTab = document.querySelector('[data-tab=map]');
  mapTab.insertAdjacentHTML('beforeend', '<i class="badge"></i>');
  const mapBadge = mapTab.querySelector('.badge');
  const upTab = document.querySelector('[data-tab=up]');
  upTab.insertAdjacentHTML('beforeend', '<i class="badge newb"></i>');
  const upBadge = upTab.querySelector('.badge'), labTold = new Set();
  // a NEW dot on 도감 while anything found hasn't been looked at in the codex yet
  const codexTab = document.querySelector('[data-tab=codex]');
  // (the NEW badge on 도감 was removed on request - the codex no longer nags about unseen finds)
  const codexBadge = { classList: { toggle() {} } };
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

  const lockCard = (title, en, why, cls = '') => `<div class="card bevel lockcard ${cls}">
      <div class="ico">${G.icon('lock', 24)}</div>
      <div class="meta"><b>${title} <small style="display:inline">${en}</small></b><span>${why}</span></div></div>`;
  /* coins -> crystals */
  function exchangeCard() {
    if (!G.stats.crystalsOpen()) return lockCard('블루 크리스탈 교환', 'EXCHANGE', '1억대 이상 광물을 1개 이상 발견하면 열립니다', 'blue');
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

  /* YELLOW SHOP: prayers (timed buffs), the 변이 확정권, and summoning a sky of the region you're in */
  function yellowSection() {
    const s = G.state;
    if (!G.stats.yellowOpen()) return `<div class="ph mini"><h2>YELLOW SHOP <small>옐로우 상점</small></h2></div>${lockCard('옐로우 상점', 'YELLOW SHOP', '3번째 맵(수정 동굴)을 해금하면 열립니다', 'yel')}`;
    const ybtn = (price, attr) => `<button class="buy bevel ybuy ${s.yellow < price ? 'poor' : ''}" ${attr}>${G.icon('crystal', 15)}<span>${price}</span></button>`;
    const items = G.data.yshop.map(it => {
      const left = it.min ? G.stats.ybuffLeft(it.id) : 0, have = it.id === 'mut' ? (s.mutTickets || 0) : 0;
      return `<div class="card bevel ycard ${left > 0 || have ? 'on' : ''}">
        <div class="ico yico">${G.icon(it.icon, 24)}</div>
        <div class="meta"><b>${it.name}</b><small>${it.en}</small><span>${it.desc}</span>
          ${left > 0 ? `<span class="ytime" data-ybuff="${it.id}">남은 시간 ${G.fmtTime(left)}</span>` : ''}${have ? `<span class="ytime">대기 중 ${have}장</span>` : ''}</div>
        <div class="side">${ybtn(it.price, `data-ybuy="${it.id}"`)}</div></div>`;
    }).join('');
    const reg = G.weather.region(), cur = G.weather.current().id;
    const ids = [...new Set([...Object.keys(reg.day || {}), ...Object.keys(reg.night || {})])].filter(id => G.data.weathers[id]);
    const price = id => G.data.ysummon.price[id] || G.data.ysummon.base;
    ids.sort((a, b) => price(a) - price(b));
    const sky = ids.map(id => { const w = G.data.weathers[id], on = id === cur; return `<button class="wxsum bevel ${on ? 'on' : ''} ${s.yellow < price(id) ? 'poor' : ''}" data-wxsum="${id}" style="--wc:${w.color}" ${on ? 'disabled' : ''}>
        ${G.icon(w.icon, 14)}<b>${w.name}</b><em>${on ? '지금 날씨' : G.icon('crystal', 11) + price(id)}</em></button>`; }).join('');
    return `<div class="ph mini"><h2>YELLOW SHOP <small>옐로우 상점</small></h2><span>옐로우 <b class="yel">${G.fmtInt(s.yellow)}</b></span></div>
      <div class="list">${items}</div>
      <div class="card bevel ycard sumcard"><div class="meta"><b>날씨 소환 <small style="display:inline">SUMMON WEATHER</small></b>
        <span>지금 있는 지역의 날씨를 바로 불러옵니다 (그 날씨의 원래 시간만큼 유지)</span><div class="wxsums">${sky}</div></div></div>`;
  }

  /* the RED workshop (30 yellow + 70,000 blue -> 10 red) and the red shop for the top three crystals */
  function redSection() {
    const s = G.state, r = G.data.redRecipe;
    if (!G.stats.redOpen()) return `<div class="ph mini"><h2>WORKSHOP <small>레드 크리스탈 제작</small></h2></div>
      ${lockCard('레드 크리스탈 제작', 'WORKSHOP', '4번째 맵(용융 핵)을 해금하면 열립니다', 'red')}
      ${lockCard('최상위 크리스탈', 'RED SHOP', '4번째 맵(용융 핵)을 해금하면 열립니다', 'red')}`;
    const canN = Math.min(Math.floor(s.yellow / r.yellow), Math.floor(s.crystals / r.blue));
    const craft = `<div class="card bevel craftcard">
      <div class="ico redico">${G.icon('crystal', 26)}</div>
      <div class="meta"><b>레드 크리스탈 제작 <small style="display:inline">WORKSHOP</small></b>
        <span class="recipe"><i class="yel">${G.icon('crystal', 12)} ${r.yellow}</i> + <i class="cy">${G.icon('crystal', 12)} ${G.fmtInt(r.blue)}</i> &rarr; <i class="red">${G.icon('crystal', 12)} ${r.out}</i></span>
        <span>옐로우 <b class="yel">${G.fmtInt(s.yellow)}</b> · 블루 <b class="cy">${G.fmt(s.crystals)}</b> · 지금 <b>${G.fmtInt(canN)}</b>번 만들 수 있음</span></div>
      <div class="side"><div class="pair"><button class="buy bevel small ${canN < 1 ? 'poor' : ''}" data-craft="1"><span>1번</span></button>
        <button class="buy bevel small ${canN < 10 ? 'poor' : ''}" data-craft="10"><span>10번</span></button></div>
        <button class="buy bevel small ${canN < 1 ? 'poor' : ''}" data-craft="max"><span>최대</span></button></div></div>`;
    const shop = G.data.potions.filter(p => p.red).map(pt => `<div class="card bevel potion redpot" style="--ph:${pt.hue}">
        <div class="ico pico">${G.icon('potion', 26)}</div>
        <div class="meta"><b>${pt.name}</b><small>${pt.en} · 5번째 맵 전용</small><span class="val">LUCK +${G.fmt(pt.luck)} <i>/ 1 CLICK</i></span></div>
        <div class="side"><em>보유 ${G.fmtInt(s.potions[pt.id] || 0)}</em><button class="buy bevel rbuy ${s.red < pt.red ? 'poor' : ''}" data-redbuy="${pt.id}">${G.icon('crystal', 15)}<span>${pt.red}</span></button></div></div>`).join('');
    return `<div class="ph mini"><h2>WORKSHOP <small>레드 크리스탈 제작</small></h2><span>레드 <b class="red">${G.fmtInt(s.red)}</b></span></div>
      <div class="list">${craft}</div>
      <div class="ph mini"><h2>RED SHOP <small>최상위 크리스탈 · 레드 크리스탈로 구매</small></h2></div>
      <div class="list">${shop}</div>`;
  }

  function crystalShop() {
    const s = G.state, multi = G.opt('boxMulti');
    if (!G.stats.crystalsOpen()) return `<div class="ph"><h2>CRYSTAL <small>크리스탈 상점</small></h2></div>${lockCard('크리스탈', 'CRYSTAL', '1억대 이상 광물을 1개 이상 발견하면 열립니다')}`;
    const boxes = G.data.boxes.map(b => {
      const tot = b.w.reduce((a, v) => a + v, 0);
      const odds = b.w.map((w, i) => (w > 0 ? `<i style="--hc:hsl(${G.data.potions[i].hue},85%,66%)">${G.data.potions[i].name} <b>${(w / tot * 100).toFixed(w / tot < 0.01 ? 2 : w / tot < 0.1 ? 1 : 0)}%</b></i>` : '')).join('');
      const tk = s.tickets[b.id] || 0;
      return `<div class="card bevel box" style="--bc:${b.color}">
        <div class="ico bico">${G.icon('shop', 26)}</div>
        <div class="meta"><b style="color:${b.color}">${b.name}</b><small style="color:${b.color}">${b.en}</small>
          <span>열면 <b>크리스탈 1개</b>가 나옵니다 (종류는 확률)</span>
          <div class="odds2">${odds}</div></div>
        <div class="side">${tk ? `<em class="tk">${G.icon('ticket', 13)} 무료권 ${tk}</em><button class="buy bevel ticketbtn" data-box="${b.id}">${G.icon('ticket', 15)}<span>무료로 열기${multi > 1 ? ' x' + multi : ''}</span></button>` : crystalBtn(G.stats.boxCost(b) * multi, `data-box="${b.id}"`)}${multi > 1 && !tk ? `<em class="tk">${multi}개 한 번에</em>` : ''}${G.stats.val('discount') > 0 && !tk ? `<em class="tk">흥정 -${Math.round(G.stats.val('discount') * 100)}%</em>` : ''}</div></div>`;
    }).join('');
    // limited event crystals only show up (and only work) during their own month's event; red ones live in the red shop until owned
    const hidden = pt => ((pt.id === 'tutorial' || pt.id === 'hodumaroo') && !(s.potions[pt.id] > 0) && !(s.armed[pt.id] > 0))
      || (pt.event && !G.event.isActive(pt.event)) || ((pt.red || pt.errorPool) && !(s.potions[pt.id] > 0) && !(s.armed[pt.id] > 0));
    const drinkN = Math.max(1, G.opt('drinkN') || 1);
    const potions = G.data.potions.filter(pt => !hidden(pt)).map(pt => {
      const have = s.potions[pt.id] || 0, armedN = s.armed[pt.id] || 0, one = pt.grantCut || pt.guarantee;
      const valTxt = pt.grantCut ? `${G.cutscenes.byId[pt.grantCut] ? G.cutscenes.byId[pt.grantCut].name : '한정 광물'} 확정 <i>/ SPECIAL</i>`
        : pt.guarantee ? `${G.tiers[pt.guarantee].en}+ 확정 <i>/ 1 CLICK, 1회 한정</i>` : `LUCK +${G.fmt(pt.luck)} <i>/ 1 CLICK, 중첩 가능${pt.minZone ? ' · 5번째 맵 전용' : ''}</i>`;
      const n = one ? 1 : Math.min(drinkN, Math.max(1, have));
      return `<div class="card bevel potion ${armedN ? 'on' : ''} ${have || armedN ? '' : 'dim'} ${pt.event ? 'evpot' : ''} ${pt.red ? 'redpot' : ''}" style="--ph:${pt.hue}">
        <div class="ico pico">${G.icon('potion', 26)}</div>
        <div class="meta"><b>${pt.name}</b><small>${pt.event ? '이벤트 한정 · ' : ''}${pt.en}</small>
          <span class="val">${valTxt}</span></div>
        <div class="side"><em>${armedN ? '장전 ' + G.fmtInt(armedN) + (have ? ' · 보유 ' + G.fmtInt(have) : '') : '보유 ' + G.fmtInt(have)}</em>
          <div class="pair">
            <button class="buy bevel small offbtn ${armedN ? '' : 'poor'}" data-punarm="${pt.id}"><span>취소</span></button>
            <button class="buy bevel small ${have ? '' : 'poor'}" data-puse="${pt.id}"><span>${n > 1 ? n + '개 ' : ''}마시기</span></button>
          </div></div></div>`;
    }).join('');
    const armedLuck = G.stats.armedLuck();
    return `<div class="ph"><h2>CRYSTAL <small>크리스탈 상점</small></h2><span>크리스탈은 <b>다음 클릭 한 번</b>에만 적용 · 여러 개 중첩 가능 (겹칠수록 효과 감소)</span></div>
      <div class="sub">블루 <b class="cy">${G.fmtInt(s.crystals)}</b>${G.stats.yellowOpen() ? ` &nbsp;/&nbsp; 옐로우 <b class="yel">${G.fmtInt(s.yellow)}</b>` : ''}${G.stats.redOpen() ? ` &nbsp;/&nbsp; 레드 <b class="red">${G.fmtInt(s.red)}</b>` : ''}${armedLuck ? ` &nbsp;/&nbsp; 장전된 럭 <b class="cy">+${G.fmt(armedLuck)}</b>` : ''}</div>
      ${exchangeCard()}
      ${yellowSection()}
      ${redSection()}
      <div class="ph mini"><h2>CRYSTAL BOX <small>크리스탈 상자</small></h2></div>
      <div class="list">${boxes}</div>
      <div class="ph mini"><h2>CRYSTALS <small>보유 크리스탈</small></h2></div>
      <div class="drinkrow"><span>한 번에 마실 개수</span><input type="number" min="1" step="1" inputmode="numeric" class="drinkin" value="${drinkN}" data-drinkn><em>보유한 만큼까지 · 확정/한정 크리스탈은 1개씩</em></div>
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
  /* 강화 tab has two pages: the upgrades, and the research lab */
  let upView = 'up', labSel = null;     // labSel: the cube shown in the hologram (null = the current one)
  const labReady = () => { const L = G.state.lab; return L && L.run && L.run.end <= Date.now() ? 1 : 0; };
  const upSwitch = () => { const n = labReady(); return `<div class="upswitch"><button class="seg bevel ${upView === 'up' ? 'on' : ''}" data-upview="up">강화</button><button class="seg bevel ${upView === 'lab' ? 'on' : ''}" data-upview="lab">연구소${n ? ` <i class="labdot">${n}</i>` : ''}</button></div>`; };
  const fmtDur = ms => { const sec = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60; return h ? `${h}시간 ${m}분` : m ? `${m}분 ${String(s2).padStart(2, '0')}초` : `${s2}초`; };
  const LAB_RING = 2 * Math.PI * 46, LAB_HRING = 2 * Math.PI * 40;
  /* 연구소: one winding path of cubes, three to a row, walked one cube at a time. The picked cube
     drops a wire into a hologram that tells what it does, takes the coins and counts the time down. */
  function labView() {
    const s = G.state, R = G.data.lab, T = G.data.labTypes;
    const head = `<div class="ph"><h2>RESEARCH <small>연구소</small></h2><span>하나씩 차례로 · 꺼둬도 진행</span></div>${upSwitch()}`;
    if (!G.stats.labOpen()) return head + lockCard('연구소', 'RESEARCH LAB', '2번째 맵(심층 광맥)을 해금하면 열립니다');
    const n = G.stats.labN(), run = s.lab && s.lab.run, now = Date.now();
    const sel = labSel == null ? Math.min(n, R.length - 1) : labSel;
    const col = i => { const r = Math.floor(i / 3), k = i % 3; return r % 2 ? 2 - k : k; };
    const cx = c => (c * 33.333 + 16.667) + '%';
    const state = i => i < n ? 'done' : i > n ? 'lock' : run ? (run.end <= now ? 'ready' : 'run') : 'next';
    const cube = i => {
      const r = R[i], st = state(i), k = st === 'run' ? Math.min(1, 1 - (run.end - now) / run.dur) : 0;
      return `<button class="labcube ${st} ${sel === i ? 'sel' : ''}" data-labsel="${i}" style="grid-column:${col(i) + 1}">
        <span class="cface">${G.icon(r.icon, 24)}<em>${st === 'lock' ? String(i + 1).padStart(2, '0') : st === 'done' ? 'OK' : String(i + 1).padStart(2, '0')}</em></span>
        ${st === 'run' ? `<svg class="cring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" style="stroke-dasharray:${LAB_RING};stroke-dashoffset:${LAB_RING * (1 - k)}" data-labring/></svg>` : ''}
        ${st === 'ready' ? '<i class="cdone">!</i>' : ''}</button>`;
    };
    let html = '';
    for (let r = 0; r * 3 < R.length; r++) {
      const ids = [r * 3, r * 3 + 1, r * 3 + 2].filter(i => i < R.length);
      // wires between neighbours in this row (lit once the path has run through them)
      const wires = ids.slice(1).map(i => { const a = col(i - 1), b = col(i); return `<i class="hw ${i <= n ? 'on' : ''}" style="left:${cx(Math.min(a, b))};right:${(2 - Math.max(a, b)) * 33.333 + 16.667}%"></i>`; }).join('');
      html += `<div class="labrow">${wires}${ids.map(cube).join('')}</div>`;
      const last = ids[ids.length - 1], turn = R[last + 1] ? `<i class="vw ${last + 1 <= n ? 'on' : ''}" style="left:${cx(col(last))}"></i>` : '';
      if (ids.includes(sel)) html += `<div class="labgap hasholo">${turn}<i class="labconn" style="left:${cx(col(sel))}"></i>${holo(sel)}</div>`;
      else if (turn) html += `<div class="labgap">${turn}</div>`;
    }
    function holo(i) {
      const r = R[i], t = T[r.type], st = state(i), had = G.stats.lab(r.type);
      // what this type totals now, and what it will once this cube is done (done cubes are already counted)
      const before = st === 'done' ? had - t.per : had, after = before + t.per;
      let act;
      if (st === 'done') act = `<div class="hmsg ok">연구 완료 · 효과 적용 중</div>`;
      else if (st === 'lock') act = `<div class="hmsg">잠김 · 앞의 연구 ${i - n}개를 먼저 끝내세요</div><div class="hpre">${G.icon('coin', 12)} ${G.fmt(r.cost)} &nbsp;·&nbsp; ${G.icon('play', 11)} ${fmtDur(G.stats.labDur(i))}</div>`;
      else if (st === 'ready') act = `<button class="hbtn hget" data-labget="1"><b>완료 받기</b><span>${r.name}</span></button>`;
      else if (st === 'run') {
        const left = run.end - now, k = Math.min(1, 1 - left / run.dur), cost = Math.max(1, Math.ceil(left / 60000)) * G.data.labRush.perMin;
        act = `<div class="htimer"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="40"/><circle class="fg" cx="50" cy="50" r="40" style="stroke-dasharray:${LAB_HRING};stroke-dashoffset:${LAB_HRING * (1 - k)}" data-labhring/></svg>
            <div><small>COOLDOWN</small><b data-labtime>${fmtDur(left)}</b><span data-labpct>연구 진행 중 · ${Math.floor(k * 100)}%</span></div></div>
          <button class="hbtn hrush ${s.crystals < cost ? 'poor' : ''}" data-labrush="1"><b>즉시 완료</b><span>${G.icon('crystal', 12)} 블루 <u data-labrushcost>${G.fmtInt(cost)}</u></span></button>`;
      } else act = `<button class="hbtn hpay ${s.coins < r.cost ? 'poor' : ''}" data-lab="1" data-cost="${r.cost}"><b>코인 지불 · 연구 시작</b><span>${G.icon('coin', 12)} ${G.fmt(r.cost)} &nbsp;·&nbsp; ${G.icon('play', 11)} ${fmtDur(G.stats.labDur(i))}</span></button>`;
      return `<div class="holo ${st}"><i class="hc tl"></i><i class="hc tr"></i><i class="hc bl"></i><i class="hc br"></i>
          <div class="hhead">${G.icon(r.icon, 22)}<div><b>${r.name}</b><small>${r.en}</small></div><em>${String(i + 1).padStart(2, '0')} / ${R.length}</em></div>
          <div class="heff"><span>${t.desc}</span><b>${t.show(before)} <i>&rarr;</i> <u>${t.show(after)}</u></b></div>
          ${act}
          <div class="hfoot">진행 ${n} / ${R.length} · 꺼둬도 진행 · 즉시 완료 = 남은 1분당 블루 ${G.data.labRush.perMin}</div></div>`;
    }
    return head + `<div class="labpath">${html}</div>`;
  }

  function upgrades() {
    if (upView === 'lab') return labView();
    const mode = G.opt('upgMulti');
    const modes = [[1, 'x1'], [10, 'x10'], ['max', '최대']].map(([v, l]) => `<button class="seg bevel ${mode === v ? 'on' : ''}" data-upm="${v}">${l}</button>`).join('');
    return `<div class="ph"><h2>UPGRADE <small>강화</small></h2><span>영구 적용</span></div>${upSwitch()}
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
            <div class="meta"><b>LEVEL 1</b><small>${G.stats.level1Gate().met ? '조건 충족' : '???'} · 검토 모드에선 질문 없이 바로 열림</small></div>
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
        else if (locked && isLevel1Zone && s.level1.restored) {
          // LEVEL 1 is done and the crystal is back: the real void rift is simply open
          btn = `<button class="buy bevel" data-zone="${i}"><span>이동</span></button>`;
          req = `<span class="unlockreq met">${G.icon('luck', 12)} LEVEL 1 완료</span>`;
        }
        else if (locked && isLevel1Zone && s.level1.crystalGone) {
          // the ending took the crystal - the way on is through the codex (the jumpscare -> restore)
          name = 'LEVEL 1'; card = ' level1card';
          req = `<span class="unlockreq">${G.icon('lock', 12)} 무언가가 사라졌다... 도감을 열어보라</span>`;
          btn = `<button class="buy bevel locked" disabled>${G.icon('lock', 15)}</button>`;
        }
        else if (locked && isLevel1Zone) {
          // production (not review mode - that case returned early above): a "???" card listing the
          // toll; once it's all there the button asks the question (js/ui.js askWho), then LEVEL 1
          const gt = G.stats.level1Gate();
          name = 'LEVEL 1'; card = ' level1card';
          req = gt.paid ? `<span class="unlockreq met">${G.icon('luck', 12)} 대가를 치렀다</span>`
            : gt.rows.map(([ok, txt, prog]) => `<span class="unlockreq ${ok ? 'met' : ''}">${G.icon(ok ? 'luck' : 'lock', 12)} ${txt}${prog && !ok ? ` <small>(${prog})</small>` : ''}</span>`).join('');
          btn = `<button class="buy bevel level1btn ${gt.met ? '' : 'poor'}" data-level1open="1"><span>???</span></button>`;
        }
        else if (locked && z.unlock.type === 'combo') {
          // several requirements at once (finds + coins + blue crystals) - every line shows its own progress
          const u = z.unlock, rows = [];
          if (u.divine) { const h = G.stats.divineFound(); rows.push([h >= u.divine, `억대 이상 광물 ${u.divine}종 발견 (${Math.min(h, u.divine)}/${u.divine})`]); }
          if (u.coins) rows.push([G.state.coins >= u.coins, `코인 ${G.fmt(u.coins)} 지불`]);
          if (u.crystals) rows.push([G.state.crystals >= u.crystals, `블루 크리스탈 ${G.fmt(u.crystals)} 지불`]);
          const met = rows.every(r => r[0]);
          req = rows.map(([ok, txt]) => `<span class="unlockreq ${ok ? 'met' : ''}">${G.icon(ok ? 'luck' : 'lock', 12)} ${txt}</span>`).join('');
          btn = `<button class="buy bevel ${met ? '' : 'poor'}" data-zone="${i}"><span>${met ? '해금' : '조건 미달'}</span></button>`;
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
            <span>COIN x${z.coinMul} &nbsp;/&nbsp; 컷신 ${n}종</span>${z.noAutoRoll && (owned || next) ? '<span class="unlockreq note">자동 채굴로는 광물이 나오지 않습니다 · 직접 캐야 합니다</span>' : ''}${req || ''}</div>
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
    if (codexZone < 0 || codexZone > Z.length + 1) codexZone = s.zone;
    // index Z.length = the SPECIAL shelf: the monthly event minerals, which belong to no map
    const SP = Z.length, specials = () => G.cutscenes.list.filter(c => c.special || c.boss).sort((a, b) => (a.boss ? 99 : a.month) - (b.boss ? 99 : b.month));
    // index Z.length + 1 = the RARE BIOME shelf: a biome mineral only appears here once you've drawn it
    // (the codex-only link and review mode show all of them)
    const BIO = Z.length + 1, showAllBio = G.config.viewer || G.config.unlockCodex;
    const biomes = () => G.cutscenes.list.filter(c => c.biome && (showAllBio || (s.codex[c.id] || {}).n > 0)).sort((a, b) => (a.aura ? -1 : 0) - (b.aura ? -1 : 0) || a.odds - b.odds);
    const zc = c => (c === SP ? specials() : c === BIO ? biomes() : G.cutscenes.inZone(c));
    const foundOf = i => zc(i).filter(c => (s.codex[c.id] || {}).n > 0).length;
    const seenMap = s.codexSeen || {}, isFound = c => (s.codex[c.id] || {}).n > 0, isNew = () => false;   // NEW tags removed on request
    const dot = i => (zc(i).some(isNew) ? '<i class="cdot"></i>' : '');
    const bioChip = n => `<button class="chip bevel spchip biochip ${codexZone === BIO ? 'on' : ''}" data-cz="${BIO}" style="--zh:185"><b>희귀</b><span>${n}</span></button>`;
    const spChip = n => `<button class="chip bevel spchip ${codexZone === SP ? 'on' : ''}" data-cz="${SP}" style="--zh:45"><b>SP</b><span>${n}</span>${dot(SP)}</button>`;
    const chips = Z.map((z, i) => `<button class="chip bevel ${i === codexZone ? 'on' : ''} ${mapOpen(i) ? '' : 'off'}" data-cz="${i}" style="--zh:${z.hue}">
        <b>${String(i + 1).padStart(2, '0')}</b><span>${mapOpen(i) ? foundOf(i) + '/' + zc(i).length : '?'}</span>${dot(i)}</button>`).join('') + spChip(foundOf(SP) + '/' + zc(SP).length) + bioChip(showAllBio ? foundOf(BIO) + '/' + zc(BIO).length : foundOf(BIO));
    const z = codexZone === SP ? { name: '스페셜', en: 'SPECIAL · 월별 이벤트 & 보스 처치 광물', hue: 45 }
      : codexZone === BIO ? { name: '희귀 바이옴', en: showAllBio ? 'RARE BIOME · CUBER STAGE · GLITCH · THE HEAVEN 한정 광물' : 'RARE BIOME · 뽑으면 여기에 기록됩니다', hue: 185 } : Z[codexZone];
    // 필터: 전체 / 발견 / 미발견 / NEW
    const keep = c => codexFilter === 'found' ? isFound(c) : codexFilter === 'unfound' ? !isFound(c) : codexFilter === 'new' ? isNew(c) : true;
    const L = zc(codexZone).filter(c => G.config.viewer || keep(c)), open = codexZone === SP || codexZone === BIO || mapOpen(codexZone);
    const oddsTxt = c => c.special ? `SPECIAL · ${c.month}월 ${c.eventName} 한정` : c.boss ? `BOSS · ${c.bossName} 처치 보상`
      : c.aura ? 'AURA · CUBER STAGE 한정 · 1 in 1,000,000 (럭 무시)' : c.biome ? `1 in ${G.fmtOdds(c.odds)} · ${(G.data.biomes[c.biome] || {}).name || c.biome} 한정`
      : c.weather ? `1 in ${G.fmtOdds(c.odds)} · ${G.data.weathers[c.weather].name} 전용` : `1 in ${G.fmtOdds(c.odds)}`;
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
            ${luck > 1.001 && !c.special && !c.boss && !c.aura ? `<span class="eff">현재 1 in ${G.fmtInt(eff)}</span>` : ''}
            <span>${seen ? `발견 ${G.fmtInt(rec.n)}회 &nbsp;/&nbsp; 최고 +${G.fmt(rec.best)}` : '미발견'}</span>${mutChips(rec)}</div>
          <div class="side">${ok ? `<button class="buy bevel" data-replay="${c.id}">${G.icon('play', 14)}<span>보기</span></button>
            ${seen ? `<button class="buy bevel small ${off ? 'offbtn' : ''}" data-skip="${c.id}"><span>${off ? '컷신 켜기' : '그만 보기'}</span></button>`
              : `<span class="firstonly">첫 감상은 건너뛸 수 없음</span>`}` : ''}</div></div>`;
      });
    }
    // rare-biome minerals count once you've drawn them (all of them on the codex-only link)
    const cl = G.cutscenes.list.filter(c => !c.biome || showAllBio || (s.codex[c.id] || {}).n > 0);
    const total = cl.length, found = cl.filter(c => (s.codex[c.id] || {}).n > 0).length;
    if (G.config.viewer) {
      const vchips = Z.map((zz, i) => `<button class="chip bevel ${i === codexZone ? 'on' : ''}" data-cz="${i}" style="--zh:${zz.hue}">
        <b>${String(i + 1).padStart(2, '0')}</b><span>${zc(i).length}</span></button>`).join('') + spChip(zc(SP).length) + bioChip(zc(BIO).length);
      return `<div class="ph"><h2>AMETHYST <small>도감</small></h2><span>컷신 전체 <b>${total}</b>종 · 눌러서 감상</span></div>
        <div class="chips">${vchips}</div>
        <div class="zhead" style="--zh:${z.hue}"><b>${z.name}</b><small>${z.en}</small></div>
        <div class="list">${body}</div>`;
    }
    const newCount = G.cutscenes.list.filter(isNew).length;
    const filters = [['all', '전체'], ['found', '발견'], ['unfound', '미발견']]
      .map(([v, l]) => `<button class="seg bevel ${codexFilter === v ? 'on' : ''} ${v === 'new' && newCount ? 'hasnew' : ''}" data-cf="${v}">${l}</button>`).join('');
    head = `<div class="ph"><h2>CODEX <small>도감</small></h2><span>전체 발견 <b>${found}</b> / ${total} <em class="pct">(${Math.floor(found / total * 100)}%)</em></span></div>
      <div class="chips">${chips}</div>
      <div class="zhead" style="--zh:${z.hue}"><b>${z.name}</b><small>${z.en}</small></div>
      <div class="cxtools"><input type="search" class="cxsearch" placeholder="이 지도에서 광물 이름 검색" value="${codexQuery.replace(/"/g, '&quot;')}" data-cxq><div class="segset">${filters}</div></div>
      ${G.config.unlockCodex ? '<div class="review">검토 모드: 모든 컷신이 열려 있습니다 (js/config.js)</div>' : ''}`;
    return `${head}<div class="list">${body}</div><div class="reset"><button data-reset>데이터 초기화</button></div>`;
  }
  const ODDS_STEPS = [0, 1e5, 1e6, 1e7, 1e8, 1e9];
  const ODDS_LABEL = v => v === 0 ? '전체' : G.fmt(v) + '+';
  const BANNERS = [['banner', '큰 배너'], ['card', '카드'], ['toast', '작은 알림'], ['ticker', '상단 한 줄'], ['bottom', '하단 알림'],
    ['chip', '미니'], ['cinema', '시네마'], ['neon', '네온'], ['stamp', '도장'], ['glitch', '글리치'], ['receipt', '영수증'],
    ['hologram', '홀로그램'], ['comic', '만화'], ['pixel', '레트로'], ['sticky', '포스트잇'], ['scroll', '두루마리'],
    ['rain', '글자 비'], ['typer', '타자기'], ['flash', '플래시만'], ['off', '끄기']];
  const PER_CHAR = ['rain', 'typer', 'pixel'];

  /* 설정 - 통계: everything worth knowing about this save, computed from what it already records
     (play time / boxes / crystals drunk are counted from the update that added them - `since`) */
  function statsView() {
    const s = G.state, st = s.stats || {}, list = G.cutscenes.list.filter(c => !c.biome || (s.codex[c.id] || {}).n > 0), found = c => (s.codex[c.id] || {}).n > 0;   // biome minerals once drawn
    const dur = ms => { const m = Math.floor(ms / 60000), h = Math.floor(m / 60); return h ? `${h}시간 ${m % 60}분` : `${m}분`; };
    let finds = 0, muts = 0; const mutKinds = new Set();
    for (const id in s.codex) { const r = s.codex[id]; if (!r) continue; finds += r.n || 0; if (r.mut) for (const k in r.mut) { muts += r.mut[k]; mutKinds.add(k); } }
    const ladder = list.filter(c => found(c) && !c.special).sort((a, b) => b.odds - a.odds)[0];
    const kills = s.bossKills || {}, killN = Object.values(kills).reduce((a, v) => a + v, 0);
    const row = (k, v) => `<div class="strow"><span>${k}</span><b>${v}</b></div>`;
    const block = (title, rows) => `<div class="card bevel stcard"><div class="meta"><b>${title}</b>${rows}</div></div>`;
    // codex by tier (only tiers the game actually has minerals in)
    const tierRows = G.tiers.map((t, i) => { const all = list.filter(c => c.tierIdx === i); if (!all.length) return ''; const f = all.filter(found).length;
      return `<div class="strow tier" style="--tc:${t.color}"><span>${t.ko} <small>${t.en}</small></span><i class="stbar"><u style="width:${f / all.length * 100}%"></u></i><b>${f} / ${all.length}</b></div>`; }).join('');
    const mapRows = G.data.zones.map((z, i) => { const all = G.cutscenes.inZone(i), f = all.filter(found).length, open = i <= s.maxZone;
      return `<div class="strow tier" style="--tc:hsl(${z.hue},80%,65%)"><span>${String(i + 1).padStart(2, '0')} ${open ? z.name : '???'}</span><i class="stbar"><u style="width:${all.length ? f / all.length * 100 : 0}%"></u></i><b>${f} / ${all.length}</b></div>`; }).join('');
    return `<div class="sub">통계 · 플레이 시간 · 상자 · 마신 크리스탈은 ${new Date(st.since || Date.now()).toLocaleDateString()}부터 기록됩니다</div>` +
      block('플레이', row('플레이 시간', dur(st.playMs || 0)) + row('총 채굴', G.fmtInt(s.clicks)) + row('크리스탈 파쇄', G.fmtInt(s.shatters || 0)) + row('현재 위치', G.stats.zone().name)) +
      block('코인', row('보유 코인', G.fmt(s.coins)) + row('지금까지 번 코인', G.fmt(s.total)) + row('클릭당 코인', G.fmt(G.stats.clickValue())) + row('현재 행운', G.fmtLuck(G.stats.luck()))) +
      block('광물', row('광물 발견 횟수', G.fmtInt(finds)) + row('도감', `${list.filter(found).length} / ${list.length}종`) +
        row('가장 희귀한 발견', ladder ? `${ladder.name} <small>(1 in ${G.fmtOdds(ladder.odds)})</small>` : '없음') +
        row('변이 광물', `${G.fmtInt(muts)}회 · ${mutKinds.size} / ${Object.keys(G.data.mutations).length}종`)) +
      block('등급별 도감', tierRows) +
      block('맵별 도감', mapRows) +
      block('보스 · 크리스탈', row('보스 처치', `${killN}회` + (killN ? ` <small>(${Object.keys(kills).map(k => (G.boss && G.boss.list[k] ? G.boss.list[k].name : k) + ' ' + kills[k]).join(' · ')})</small>` : '')) +
        row('연 상자', G.fmtInt(st.boxes || 0)) + row('마신 크리스탈', G.fmtInt(st.drunk || 0)) +
        row('보유 크리스탈', `블루 ${G.fmt(s.crystals)} · 옐로우 ${G.fmtInt(s.yellow || 0)} · 레드 ${G.fmtInt(s.red || 0)}`));
  }

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
    const SECS = [['sound', '소리'], ['screen', '화면'], ['theme', '테마'], ['cut', '컷신'], ['easy', '편의'], ['data', '데이터'], ['stats', '통계']];
    let body = '';
    if (setSec === 'sound') body =
      seg('volume', '전체 볼륨', '게임의 모든 소리 크기 (위쪽 스피커 버튼은 완전 음소거)', VOL) +
      seg('cutVolume', '컷신 소리', '광물이 등장할 때 나오는 연출 음악과 효과음 크기', VOL) +
      toggle('sndMine', '채굴 효과음', '크리스탈을 칠 때의 타격음 · 코인 소리 · 치명타 · 파쇄음') +
      toggle('sndUi', '버튼 효과음', '탭 이동, 구매, 실패할 때 나는 소리') +
      toggle('bgMute', '백그라운드에서 소리 끄기', '다른 앱이나 탭으로 가면 소리를 멈추고, 돌아오면 다시 켭니다');
    else if (setSec === 'screen') body =
      seg('fx', '이펙트 (렉 줄이기)', '화면 효과의 양 · 보통: 날씨 앞쪽 효과(비·눈 등)와 배경 격자를 끔 · 적게: 날씨 연출·배경 움직임·변이 효과를 끄고 파티클을 크게 줄임 · 렉이 걸리면 "적게"로 바꿔보세요',
        [['high', '많이'], ['mid', '보통'], ['low', '적게']]) +
      seg('quality', '그래픽 품질', '낮출수록 배터리와 발열이 줄어듭니다 (화면 선명도)', [['high', '고화질'], ['mid', '보통'], ['low', '절약']]) +
      seg('particles', '파티클 양', '채굴할 때 튀는 파편과 불꽃의 양', [[1, '많이'], [0.55, '보통'], [0.2, '적게'], [0, '끔']]) +
      seg('shake', '화면 흔들림', '치명타 · 파쇄 · 컷신 등장 때 화면이 흔들리는 정도', [[1, '보통'], [0.5, '약하게'], [0, '끔']]) +
      toggle('lessFlash', '번쩍임 줄이기', '화면 전체가 하얗게 번쩍이는 효과를 크게 줄입니다 (눈이 피로하거나 빛에 민감할 때)') +
      toggle('floatText', '떠오르는 숫자', '채굴할 때 크리스탈 위로 떠오르는 +코인 · CRIT 글자') +
      seg('numFmt', '숫자 표기', `예시: ${[['short', '1.23M'], ['kr', '123만'], ['full', '1,230,000']].map(([, e]) => e).join(' / ')}`, [['short', '1.23M'], ['kr', '123만'], ['full', '전체 숫자']]);
    else if (setSec === 'theme') body = `<div class="sub">게임 전체의 색과 배경 분위기를 바꿉니다 · 한 번 얻으면 언제든 바꿔 쓸 수 있어요 · 업적 테마는 조건을 달성하면 열려요 · 보유 크리스탈 <b class="cy">${G.fmtInt(G.state.crystals)}</b></div>` +
      G.data.themes.map(t => {
        const own = G.state.themesOwned[t.id], using = G.state.theme === t.id, trying = G.isPreviewing && G.isPreviewing(t.id);
        const [bg, acc, btn] = t.preview;
        const btns = using ? '<button class="buy bevel small max" disabled><span>사용 중</span></button>'
          : (t.noPreview && !own ? '' : `<button class="buy bevel small ${trying ? 'on' : ''}" data-themetry="${t.id}"><span>${trying ? '미리보는 중' : '미리보기'}</span></button>`)
            +(own ? `<button class="buy bevel small ready" data-themeuse="${t.id}"><span>적용</span></button>` : t.unlock ? '' : crystalBtn(t.price, `data-themebuy="${t.id}"`));
        // achievement themes say what unlocks them instead of a price
        const tag = t.unlock ? (own ? `<span class="tprice tach">${G.icon('check', 11)} 업적 달성 · ${t.unlock.label}</span>` : `<span class="tprice tach lock">${G.icon('lock', 11)} 해금 조건 · ${t.unlock.label}${t.unlock.progress ? (([a, b]) => ` (${G.fmtInt(a)} / ${G.fmtInt(b)})`)(t.unlock.progress(G.state)) : ''}</span>`)
          : `<span class="tprice">${t.price ? (own ? '보유 중' : `${G.icon('crystal', 11)} ${G.fmtInt(t.price)}`) : '기본 테마'}</span>`;
        return `<div class="card bevel themecard ${using ? 'using' : ''} ${t.unlock ? 'tachv tc-' + t.id : ''} ${t.unlock && !own ? 'locked' : ''}" style="--tbg:${bg};--tacc:${acc};--tbtn:${btn}">
          <div class="tswatch"><i></i><i></i><i></i><em class="amb-${t.ambient}"></em></div>
          <div class="meta"><b>${t.name}</b><small>${t.en}</small><span>${t.desc}</span>
            ${tag}</div>
          <div class="side">${btns}</div></div>`;
      }).join('');
    else if (setSec === 'cut') body =
      toggle('autoSkipSeen', '이미 본 컷신은 항상 건너뛰기', '도감에서 개별로 켠 것과 상관없이, 다시 뜬 컷신은 재생하지 않고 바로 보상만 받습니다') +
      `<div class="card bevel setcard"><div class="meta"><b>최소 확률부터 컷신 표시</b><span>이 확률보다 흔한 광물은 처음 보는 것이라도 재생 없이 보상만 받습니다 · 직접 입력 (예: 1억, 100000000, 1e8, 10m)</span>
        <div class="oddsin"><span>1 in</span><input type="text" inputmode="text" class="cxsearch" data-minodds value="${st.minOdds ? G.fmtKr(st.minOdds) : ''}" placeholder="0 = 전부 표시"><em>${st.minOdds ? '= ' + G.fmtInt(st.minOdds) : '전부 표시 중'}</em></div>
        <div class="segset">${ODDS_STEPS.map(v => `<button class="seg bevel ${st.minOdds === v ? 'on' : ''}" data-set="minOdds" data-val="${v}">${v ? G.fmtKr(v) + '+' : '전체'}</button>`).join('')}</div></div></div>` +
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
    else if (setSec === 'stats') body = statsView();
    else body =
      action('튜토리얼 다시 보기', '처음 시작할 때 나오는 안내를 다시 재생합니다', '<button class="buy bevel small" data-retutorial="1"><span>시작</span></button>') +
      action('진행 데이터 백업', '브라우저 저장소가 지워져도(캐시/쿠키 삭제, 기기 변경 등) 복구할 수 있는 코드를 만들거나 불러옵니다',
        '<button class="buy bevel small" data-savecode="export"><span>코드 만들기</span></button><button class="buy bevel small" data-savecode="import"><span>코드 불러오기</span></button>') +
      (() => { const b = G.backupInfo && G.backupInfo(); return action('자동 백업에서 되돌리기', b ? `이 기기에서 가장 많이 진행된 저장 · ${new Date(b.at).toLocaleString()} · 누적 코인 ${G.fmt(b.total)} · 도감 ${b.codex}종` : '아직 백업이 없습니다 (게임을 켤 때마다 자동으로 만들어집니다)',
        `<button class="buy bevel small ${b ? '' : 'poor'}" data-restorebak="1"><span>되돌리기</span></button>`); })() +
      action('설정 초기화', '모든 설정을 처음 값으로 되돌립니다 (게임 진행은 그대로)', '<button class="buy bevel small" data-resetset="1"><span>초기화</span></button>');
    return `<div class="ph"><h2>SETTINGS <small>설정</small></h2><span>바꾸면 바로 적용되고 저장됩니다</span></div>
      <div class="chips setchips">${SECS.map(([id, label]) => `<button class="chip bevel ${setSec === id ? 'on' : ''}" data-setsec="${id}"><b>${label}</b></button>`).join('')}</div>
      <div class="list">${body}</div>`;
  }

  const views = { shop, up: upgrades, map, codex, crystal: crystalShop, settings: settingsView };

  /* Rebuilding the panel while a finger is on it (or while it's still gliding from a flick) kills the
     scroll on phones - so a rebuild asked for mid-scroll waits until the panel has been still for a
     moment, and a rebuild that would produce the same markup is skipped altogether. */
  let lastHTML = '', touching = false, lastScroll = 0, pending = false, flushT = 0;
  const busy = () => touching || performance.now() - lastScroll < 450;
  function scheduleFlush() { clearTimeout(flushT); flushT = setTimeout(() => { if (!pending) return; if (busy()) { scheduleFlush(); return; } pending = false; render(); }, 460); }
  panel.addEventListener('touchstart', () => { touching = true; }, { passive: true });
  const untouch = () => { touching = false; if (pending) scheduleFlush(); };   // a plain tap isn't a scroll - buttons stay instant
  panel.addEventListener('touchend', untouch, { passive: true });
  panel.addEventListener('touchcancel', untouch, { passive: true });
  panel.addEventListener('scroll', () => { lastScroll = performance.now(); if (pending) scheduleFlush(); }, { passive: true });
  function render(force) {
    if (!open) return;
    // don't rebuild the codex under the player's fingers while they're typing a search
    const ae = document.activeElement; if (ae && ae.tagName === 'INPUT' && panel.contains(ae)) return;   // never rebuild under a field the player is typing in
    if (force !== true && busy()) { pending = true; scheduleFlush(); return; }
    const html = views[open]();
    if (html === lastHTML && force !== true) return;
    const top = panel.scrollTop;
    panel.innerHTML = html; lastHTML = html;
    panel.scrollTop = top;
    if (open === 'codex') applySearch();
  }
  /* the panel may only be as tall as what's actually visible below it - on phones `vh` counts the
     area hidden behind the browser's address bar, which used to push the last cards off-screen */
  function fitPanel() {
    if (!open || G.config.viewer) return;
    const top = panel.getBoundingClientRect().top, H = window.visualViewport ? window.visualViewport.height : innerHeight;
    const room = H - top - (innerWidth <= 600 ? 62 : 14);   // phones keep clear of the cutscene-pause button
    panel.style.maxHeight = Math.max(150, Math.min(innerWidth <= 600 ? room : Math.min(480, H * 0.58), room)) + 'px';
  }
  window.addEventListener('resize', fitPanel);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitPanel);

  // every tab remembers where you'd scrolled to
  const scrollMem = {};
  function setOpen(name) {
    if (open) scrollMem[open] = panel.scrollTop;
    if (open === 'codex') commitSeen();
    open = open === name ? null : name;
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === open));
    panel.hidden = !open;
    if (open) { panel.scrollTop = 0; lastHTML = ''; render(true); fitPanel(); panel.scrollTop = scrollMem[open] || 0; }
    paintCodexBadge();
  }
  G.ui = { closePanel() { if (open && !G.config.viewer) setOpen(open); } };
  if (G.config.viewer) setOpen('codex');

  /* ---------------- events ---------------- */
  tabs.forEach(b => b.addEventListener('click', () => {
    G.audio.init();
    if (b.dataset.tab === 'codex' && G.state.level1.crystalGone && !G.state.level1.restored && G.jumpscare) { G.jumpscare(); return; }
    if (b.dataset.tab === 'crystal' && !G.stats.crystalsOpen()) { G.audio.deny(); toast('1억대 이상 광물을 1개 이상 발견하면 크리스탈 탭이 열립니다'); return; }
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
    } else if (el.dataset.upview) {
      upView = el.dataset.upview; G.audio.tab(); render(true); panel.scrollTop = 0;
    } else if (el.dataset.labsel) {
      const i = +el.dataset.labsel; labSel = i === G.stats.labN() ? null : i; G.audio.tab(); render(true);
    } else if (el.dataset.lab) {
      const r = G.data.lab[G.stats.labN()], res = G.act.labStart();
      if (res === 'ok') { G.audio.buy(); toast(`${r.name} 연구를 시작했습니다`); }
      else { G.audio.deny(); toast(res === 'poor' ? '코인이 부족합니다' : res === 'running' ? '이미 연구 중입니다' : res === 'max' ? '모든 연구를 마쳤습니다' : '지금은 연구할 수 없습니다'); }
    } else if (el.dataset.labget) {
      const r = G.data.lab[G.stats.labN()];
      if (G.act.labCollect()) { labSel = null; G.audio.buy(); G.audio.blast(5); toast(`${r.name} 완료! 다음 연구가 열렸습니다`); }
    } else if (el.dataset.labrush) {
      const r = G.data.lab[G.stats.labN()], res = G.act.labRush();
      if (res === 'ok') { labSel = null; G.audio.buy(); G.audio.blast(5); toast(`${r.name} 즉시 완료!`); }
      else { G.audio.deny(); toast('블루 크리스탈이 부족합니다'); }
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
      const gt = G.stats.level1Gate();
      if (G.config.unlockCodex || gt.paid) { G.ui.closePanel(); if (G.level1) G.level1.open(); }
      else if (!gt.met) { G.audio.deny(); toast('아직 아니다.'); }
      else askWho();
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
      const pu = G.stats.potion(el.dataset.puse), r = G.act.armPotion(el.dataset.puse, G.opt('drinkN') || 1);
      if (r === 'zone') { G.audio.deny(); toast('이 크리스탈은 5번째 맵(공허의 균열)부터만 마실 수 있습니다'); }
      else if (r) { G.audio.potion(); toast(pu && pu.grantCut ? '장전됨 - 다음 클릭에 한정 광물이 확정으로 나옵니다' : `${r > 1 ? r + '개 ' : ''}장전됨 - 다음 클릭에 럭이 중첩됩니다`); }
      else { G.audio.deny(); toast('보유한 크리스탈이 없습니다'); }
    } else if (el.dataset.craft) {
      const want = el.dataset.craft === 'max' ? 1e12 : +el.dataset.craft, r = G.act.craftRed(want);
      if (typeof r === 'number') { G.audio.buy(); G.audio.blast(5); toast(`레드 크리스탈 +${G.fmtInt(r * G.data.redRecipe.out)}`); }
      else { G.audio.deny(); toast(`재료가 부족합니다 (옐로우 ${G.data.redRecipe.yellow} + 블루 ${G.fmtInt(G.data.redRecipe.blue)} = 레드 ${G.data.redRecipe.out})`); }
    } else if (el.dataset.ybuy) {
      const it = G.data.yshop.find(x => x.id === el.dataset.ybuy), r = G.act.buyYellow(it.id);
      if (r === 'ok') { G.audio.buy(); G.audio.potion(); toast(it.min ? `${it.name} - ${it.desc.replace('30분 동안 ', '')} (${it.min}분)` : '변이 확정권 - 다음 1천만 이상 광물에 변이가 붙습니다'); }
      else { G.audio.deny(); toast(`옐로우 크리스탈이 부족합니다 (${it.price}개 필요)`); }
    } else if (el.dataset.wxsum) {
      const w = G.data.weathers[el.dataset.wxsum], r = G.act.summonWeather(el.dataset.wxsum);
      if (r === 'ok') { G.audio.buy(); G.audio.blast(4); G.ui.closePanel(); }
      else { G.audio.deny(); toast(r === 'poor' ? `옐로우 크리스탈이 부족합니다 (${G.data.ysummon.price[w.id] || G.data.ysummon.base}개 필요)` : '이 지역에서는 부를 수 없는 날씨입니다'); }
    } else if (el.dataset.redbuy) {
      const pt = G.stats.potion(el.dataset.redbuy), r = G.act.buyRedCrystal(el.dataset.redbuy);
      if (r === 'ok') { G.audio.buy(); G.audio.blast(8); toast(`${pt.name}를 얻었습니다 (5번째 맵 전용)`); }
      else { G.audio.deny(); toast(`레드 크리스탈이 부족합니다 (${pt.red}개 필요)`); }
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
      G.audio.tab(); G.previewTheme(el.dataset.themetry);
    } else if (el.dataset.themebuy) {
      const t = G.data.themes.find(x => x.id === el.dataset.themebuy);
      if (G.state.crystals < t.price) { G.audio.deny(); toast(`크리스탈이 부족합니다 (${G.fmtInt(t.price)} 필요)`); }
      else if (confirm(`${t.name} 테마를 ${G.fmtInt(t.price)} 크리스탈에 구매할까요?`)) {
        if (G.act.buyTheme(t.id) === 'ok') { G.audio.buy(); G.audio.blast(5); toast(`${t.name} 테마를 구매하고 적용했습니다`); }
      }
    } else if (el.dataset.setsec) {
      setSec = el.dataset.setsec; G.audio.tab(); render(); panel.scrollTop = 0;
    } else if (el.dataset.restorebak) {
      const b = G.backupInfo();
      if (!b) { G.audio.deny(); toast('백업이 없습니다'); }
      else if (confirm(`자동 백업(${new Date(b.at).toLocaleString()}, 도감 ${b.codex}종)으로 되돌릴까요? 현재 진행은 덮어씁니다.`)) {
        if (G.restoreBackup()) { G.audio.buy(); toast('백업을 불러왔습니다'); shown = 0; render(); } else { G.audio.deny(); toast('백업을 불러오지 못했습니다'); }
      }
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
      // easter egg: a secret phrase instead of a save code (spaces ignored) pays 300T, once per save -
      // a head start for anyone whose save got wiped
      if (code && code.replace(/\s/g, '').replace(/^코드[:：]/, '') === '준혁이루미노시티삭제하자') {
        if (G.state.eggCode) { G.audio.deny(); toast('이미 사용한 코드입니다'); return; }
        G.state.eggCode = true;
        const amt = 3e14; G.addCoins(amt); G.save();
        G.audio.blast(8); G.buzz && G.buzz([40, 30, 40, 30, 160]);
        fireWin(`<small>SECRET CODE</small><b>숨겨진 보물</b><span>비밀 코드를 아는 자에게</span><em>+ ${G.fmt(amt)}</em>`, '#ffcf5a', 3600);
        toast('비밀 코드! +300T 코인 (한 번만)');
        G.emit('change'); return;
      }
      if (code && confirm('코드를 불러오면 현재 진행 데이터를 덮어씁니다. 계속할까요?')) {
        if (G.act.importSave(code)) { G.audio.buy(); toast('데이터를 불러왔습니다'); shown = 0; render(); }
        else { G.audio.deny(); toast('올바르지 않은 코드입니다'); }
      }
    }
  });

  /* the question at the door of LEVEL 1. Right answer: 너 / you. */
  function askWho() {
    let el = document.getElementById('whoModal');
    if (!el) { el = document.createElement('div'); el.id = 'whoModal'; document.body.appendChild(el); }
    el.innerHTML = `<div class="whobox"><b class="whoq">Who are you?</b>
      <input type="text" class="whoin" maxlength="24" autocomplete="off" spellcheck="false" aria-label="답">
      <div class="whobtns"><button class="whook">확인</button><button class="whono">돌아가기</button></div><small class="whomsg"></small></div>`;
    el.hidden = false; void el.offsetWidth; el.classList.add('show');
    G.audio.blackout && G.audio.blackout(6);
    const input = el.querySelector('.whoin'), msg = el.querySelector('.whomsg');
    setTimeout(() => input.focus(), 300);
    const close = () => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 400); };
    const submit = () => {
      const a = input.value.trim().toLowerCase().replace(/[.!?。]+$/, '');
      if (a === '너' || a === 'you') {
        if (!G.act.level1Pay()) { msg.textContent = '대가가 부족하다.'; return; }
        msg.textContent = '...그래.'; el.classList.add('right'); G.audio.blast(8);
        setTimeout(() => { close(); G.ui.closePanel(); if (G.level1) G.level1.open(); }, 1600);
      } else {
        msg.textContent = '아니다.'; el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); G.audio.deny(); input.select();
      }
    };
    el.querySelector('.whook').onclick = submit;
    el.querySelector('.whono').onclick = () => { G.audio.tab(); close(); };
    input.onkeydown = ev => { if (ev.key === 'Enter') submit(); if (ev.key === 'Escape') close(); ev.stopPropagation(); };
  }

  G.on('change', render);
  panel.addEventListener('input', ev => {
    if (!ev.target.matches('[data-cxq]')) return;
    codexQuery = ev.target.value; applySearch();
  });
  // typed values (drink count, minimum cutscene odds) are committed when the field is left / Enter
  panel.addEventListener('change', ev => {
    const t = ev.target;
    if (t.matches('[data-drinkn]')) { const n = Math.max(1, Math.min(1e6, Math.floor(+t.value) || 1)); G.act.setSetting('drinkN', n); G.audio.tab(); toast(`마시기 한 번에 ${G.fmtInt(n)}개`); }
    else if (t.matches('[data-minodds]')) {
      const v = G.parseAmount(t.value);
      if (v == null) { G.audio.deny(); toast('숫자로 입력해 주세요 (예: 100000000, 1억, 1e8, 10m)'); render(); return; }
      G.act.setSetting('minOdds', v); G.audio.tab(); toast(v ? `1 in ${G.fmtOdds(v)} 미만 광물은 컷신 없이 보상만 받습니다` : '모든 컷신을 표시합니다');
    }
  });
  panel.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches('input[type=number], [data-minodds]')) ev.target.blur(); });

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
    fireWin(`${mut ? `<i class="mut" style="--mc:${mut.color}">MUTATION · ${mut.en}</i>` : ''}<small>${tier.en}</small><b>${mut ? def.name + ': ' + mut.name : def.name}</b><span>${def.special ? 'SPECIAL' : '1 in ' + G.fmtOdds(def.odds)}</span><em>+ ${G.fmt(reward)}</em>`, tier.color, 2600);
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
    const pool = G.data.potions.filter(p => p.id !== 'tutorial' && p.id !== 'hodumaroo' && !p.event && !p.red && !p.errorPool);
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
  G.on('tutorialDone', () => toast('견습생의 크리스탈이 장전되었습니다 - 화면을 탭해보세요'));
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
    const str = G.stats.crystalsOpen() ? G.fmt(crysShown) : '';
    if (crysVal.textContent !== str) crysVal.textContent = str;
  }
  // blue / yellow / red counters under the coins - a padlock until each one opens
  const yelVal = $('#yelVal'), redVal = $('#redVal'), crysIco = $('#crysIco');
  let curKey = '';
  function paintCurrencies() {
    const s = G.state, bo = G.stats.crystalsOpen(), yo = G.stats.yellowOpen(), ro = G.stats.redOpen();
    const key = `${bo}|${yo}|${ro}|${Math.floor(s.yellow)}|${Math.floor(s.red)}`;
    if (key === curKey) return; curKey = key;
    crysIco.innerHTML = G.icon(bo ? 'crystal' : 'lock', 15); crysIco.parentElement.classList.toggle('blocked', !bo);
    crysIco.title = bo ? '블루 크리스탈' : '블루 크리스탈 · 1억대 이상 광물을 발견하면 열립니다';
    yelVal.innerHTML = `${G.icon(yo ? 'crystal' : 'lock', 13)}${yo ? `<b>${G.fmt(s.yellow)}</b>` : ''}`; yelVal.classList.toggle('lk', !yo);
    yelVal.title = yo ? '옐로우 크리스탈' : '옐로우 크리스탈 · 3번째 맵을 해금하면 열립니다';
    redVal.innerHTML = `${G.icon(ro ? 'crystal' : 'lock', 13)}${ro ? `<b>${G.fmt(s.red)}</b>` : ''}`; redVal.classList.toggle('lk', !ro);
    redVal.title = ro ? '레드 크리스탈' : '레드 크리스탈 · 4번째 맵을 해금하면 열립니다';
  }
  /* 컷신 잠깐 안 나오게 하기 - bottom right, deliberately quiet; shows the countdown while active */
  const cutPause = $('#cutPause');
  cutPause.addEventListener('click', ev => { ev.stopPropagation(); G.audio.init(); G.audio.tab(); G.pauseCuts(30); toast('30초 동안 컷신 없이 보상만 받습니다'); paintPause(); });
  cutPause.addEventListener('pointerdown', ev => ev.stopPropagation());
  function paintPause() {
    const left = Math.max(0, (G.cutPauseUntil - performance.now()) / 1000);
    cutPause.classList.toggle('on', left > 0);
    const txt = left > 0 ? `컷신 멈춤 ${Math.ceil(left)}초` : '컷신 잠깐 안 나오게 하기';
    if (cutPause.textContent !== txt) cutPause.textContent = txt;
    cutPause.hidden = !!G.config.viewer;
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
      ${G.stats.ybuffLeft('luck') > 0 ? `<div><span>황금 기도 · ${G.fmtTime(G.stats.ybuffLeft('luck'))}</span><em>x1.5</em></div>` : ''}
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
    // research that finished (even while the game was closed): a badge on 강화 and one toast each
    const ready = labReady(); upBadge.classList.toggle('show', ready > 0); upBadge.textContent = ready || '';
    const lrun = G.state.lab && G.state.lab.run;
    if (lrun && lrun.end <= Date.now() && !labTold.has(lrun.end)) { labTold.add(lrun.end); const r = G.data.lab[G.stats.labN()]; if (r) toast(`연구 완료: ${r.name} - 강화 탭 > 연구소에서 받으세요`); }
    paintCodexBadge();
    crystalTab.classList.toggle('locked', !G.stats.crystalsOpen());
    paintCurrencies(); paintPause();
    if (open === 'crystal' && !G.stats.crystalsOpen()) G.ui.closePanel();
    paintHud();
    if (!open) return;
    panel.querySelectorAll('[data-cost]').forEach(b => b.classList.toggle('poor', G.state.coins < +b.dataset.cost));
    panel.querySelectorAll('[data-ccost]').forEach(b => b.classList.toggle('poor', G.state.crystals < +b.dataset.ccost));
    const exMax = Math.floor(G.state.coins / G.data.exchange.rate);
    panel.querySelectorAll('[data-exmin]').forEach(b => b.classList.toggle('poor', exMax < +b.dataset.exmin));
    if (open === 'up' && upView === 'lab') {
      // live research countdowns; a research that just finished swaps in its 완료 받기 button
      const run = G.state.lab && G.state.lab.run, now = Date.now();
      if (run) {
        if (run.end <= now) { if (panel.querySelector('[data-labring]')) render(true); }
        else {
          const left = run.end - now, k = Math.min(1, 1 - left / run.dur), q = sel => panel.querySelector(sel);
          if (q('[data-labtime]')) q('[data-labtime]').textContent = fmtDur(left);
          if (q('[data-labpct]')) q('[data-labpct]').textContent = `연구 진행 중 · ${Math.floor(k * 100)}%`;
          if (q('[data-labring]')) q('[data-labring]').style.strokeDashoffset = LAB_RING * (1 - k);
          if (q('[data-labhring]')) q('[data-labhring]').style.strokeDashoffset = LAB_HRING * (1 - k);
          const cost = Math.max(1, Math.ceil(left / 60000)) * G.data.labRush.perMin;
          if (q('[data-labrushcost]')) { q('[data-labrushcost]').textContent = G.fmtInt(cost); q('[data-labrush]').classList.toggle('poor', G.state.crystals < cost); }
        }
      }
    }
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
