/* AMETHYST - resources, the inventory and crafting (data: js/data/materials.js).

   Resources: every 10 s the sky overhead - or the rare biome, while one is up - may hand over one of
   its own resource (20%, rare skies 17.5%). A little "+1 ..." rises off the bag button when it does.
   Inventory (the bag button, bottom left): 자원 - every resource, what you have, where it falls;
   크리스탈 - every crystal you hold (made, bought, given), drunk right from here.
   Crafting (the 제조 tab, after Sol's RNG's Stella's cauldron): pick a crystal, put its ingredients
   in - partly, as you get them; what's in stays in - and once every slot is full, make it. The crystal
   drawn there fills with light as its slots fill.
   State: G.state.mats {id: n}, G.state.cauldron {recipe: {ingredient: n}}. */
(() => {
  if (!G.data.materials) return;
  const D = G.data, M = D.matById;
  const rar = m => D.rarities[m.r];
  const isMat = id => !!M[id];
  // an ingredient can be a resource, a crystal, a charm or a gauntlet - where each one is kept
  const bin = id => (isMat(id) ? (G.state.mats = G.state.mats || {}) : (D.charms || []).some(c => c.id === id) ? (G.state.charms = G.state.charms || {})
    : (D.gauntlets || []).some(g => g.id === id) ? ((G.state.gear = G.state.gear || { owned: {}, equipped: null, forge: null }).owned) : G.state.potions);
  // local dev (js/config.js): every ingredient is free - recipes count as full, nothing is used up, forging takes seconds
  const FREE = !!G.config.dev;
  const have = id => (FREE ? 9999 : bin(id)[id] || 0);
  const take = (id, k) => { if (FREE) return; const b = bin(id); b[id] = (b[id] || 0) - k; if (id === (G.state.gear || {}).equipped && !(b[id] > 0)) G.state.gear.equipped = null; };
  const nameOf = id => (isMat(id) ? M[id].name : ((D.charms || []).find(c => c.id === id) || (D.gauntlets || []).find(g => g.id === id) || G.stats.potion(id) || {}).name || id);
  const put = rid => (G.state.cauldron[rid] || (G.state.cauldron[rid] = {}));

  /* ---------------- icons: one drawn for every resource, in its rarity's gradient ---------------- */
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', 0); defs.setAttribute('height', 0); defs.style.position = 'absolute';
  defs.innerHTML = `<defs>${Object.entries(D.rarities).map(([k, r]) => `<linearGradient id="rg-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${r.color}"/><stop offset="1" stop-color="${r.color}" stop-opacity=".45"/></linearGradient>`).join('')}</defs>`;
  document.body.appendChild(defs);
  const ICON = {
    sunshard: '<path d="M12 1.5l2.8 6.7 6.7 2.8-6.7 2.8L12 20.5l-2.8-6.7L2.5 11l6.7-2.8z" fill="F"/><circle cx="12" cy="11" r="2.4" fill="#fff"/>',
    feather: '<path d="M19.5 2.5C10.5 3.5 6 9.5 5 19l2 1c1-3 3-5 6-6-2 0-3-.2-4-1 3-1 5-2.2 6-4-1 0-3 0-4-1 4-1 7-3 8.5-5.5z" fill="F"/><path d="M5 20L14.5 8.5" stroke="#fff" stroke-width=".9" fill="none"/>',
    mistdrop: '<path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" fill="F" opacity=".9"/><path d="M3 18.5h7M14 20.5h7M6 22h5" stroke="F" stroke-width="1.2" stroke-linecap="round"/>',
    raindrop: '<path d="M12 2c4 5 6 9 6 12a6 6 0 0 1-12 0c0-3 2-7 6-12z" fill="F"/><path d="M9 14a3 3 0 0 0 3 3" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
    cloudwisp: '<path d="M7 18.5h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.3-1A4.6 4.6 0 0 0 7 18.5z" fill="F"/><path d="M9 14h6" stroke="#fff" stroke-width="1" opacity=".7" stroke-linecap="round"/>',
    petal: '<path d="M12 2.5c4 3 6 7 4 12-1 3-3 5-4 6.5-1-1.5-3-3.5-4-6.5-2-5 0-9 4-12z" fill="F"/><path d="M12 6v14" stroke="#fff" stroke-width=".8" opacity=".7"/>',
    snowflake: '<g stroke="F" stroke-width="1.7" stroke-linecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10"/><path d="M9 3.6l3 2 3-2M9 20.4l3-2 3 2M4 10.6l2.6-.9.6-2.8M20 13.4l-2.6.9-.6 2.8M4 13.4l2.6.9.6 2.8M20 10.6l-2.6-.9-.6-2.8"/></g>',
    starbit: '<path d="M12 1.8l2.7 6.6 7.1.6-5.4 4.6 1.7 6.9L12 16.8l-6.1 3.7 1.7-6.9L2.2 9l7.1-.6z" fill="F"/><path d="M12 6l1 3 3 .3-2.3 2 .7 3L12 13l-2.4 1.3.7-3-2.3-2 3-.3z" fill="#fff" opacity=".6"/>',
    glowdust: '<g fill="F"><circle cx="8" cy="9" r="2.6"/><circle cx="16.5" cy="6.5" r="1.7"/><circle cx="14.5" cy="15" r="3.2"/><circle cx="6" cy="17.5" r="1.4"/><circle cx="19" cy="12" r="1"/></g><circle cx="14.5" cy="15" r="1.2" fill="#fff"/>',
    meteorite: '<path d="M2.5 2.5l9 7M5.5 2l7.5 6.5M2 6l7.5 5.5" stroke="F" stroke-width="1.4" opacity=".55" stroke-linecap="round"/><path d="M11 10l6-1.5 4.5 5-2 6.5-6.5 1-4-5z" fill="F"/><circle cx="15" cy="15" r="1.4" fill="#000" opacity=".35"/>',
    thunder: '<path d="M13.5 1.5L4.5 13.5h6.5l-2 9 10-12.5h-6.5z" fill="F"/><path d="M13.5 1.5L4.5 13.5h3" stroke="#fff" stroke-width=".8" fill="none"/>',
    prism: '<path d="M10 3.5l8 15.5H2z" fill="F"/><path d="M13 11.5l9-3M13.6 12.6l8.4.4M14.2 13.7l7.8 3.6" stroke-width="1.3" stroke-linecap="round"/><path d="M13 11.5l9-3" stroke="#ff6a6a" stroke-width="1.3"/><path d="M13.6 12.6l8.4.4" stroke="#7aff8a" stroke-width="1.3"/><path d="M14.2 13.7l7.8 3.6" stroke="#6aa8ff" stroke-width="1.3"/><path d="M1 13l9-1.5" stroke="#fff" stroke-width="1.2"/>',
    solarcore: '<circle cx="12" cy="12" r="5.2" fill="F"/><g stroke="F" stroke-width="1.7" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g><circle cx="12" cy="12" r="2.2" fill="#fff"/>',
    moonstone: '<path d="M15.5 2.5a9.5 9.5 0 1 0 6 14A7.5 7.5 0 0 1 15.5 2.5z" fill="F"/><path d="M8.5 9.5l2-2.3 2 2.3-2 2.3z" fill="#fff"/>',
    stonedust: '<g fill="F"><path d="M3.5 16.5l3-4.5 4.2 1 1 4.2-4.2 2.3z"/><path d="M13 18.5l2-5.2 5.2 1 1 4.4-4.2 2.3z"/><path d="M8.5 9l3-4.5 3.5 2-1 4.4-4.4.3z"/></g>',
    coal: '<path d="M4.5 15.5l3-7.5 7.5-2 5.5 5.5-2 8-8.5 1z" fill="F"/><path d="M9 13.5l3-2.3 2.3 3-3.2 2.3z" fill="#ffb060"/><path d="M14 9.5l2 1-1 2" stroke="#ffb060" stroke-width="1" fill="none"/>',
    quartz: '<g fill="F"><path d="M12 1.5l3.2 5V19L12 22.5 8.8 19V6.5z"/><path d="M5.8 7.5l2 3.2v8l-2 2.3-2-2.3v-8z" opacity=".8"/><path d="M18.2 8.5l2 3.2v7l-2 2.3-2-2.3v-7z" opacity=".8"/></g><path d="M12 1.5v21" stroke="#fff" stroke-width=".7" opacity=".7"/>',
    slime: '<path d="M3.5 17.5c0-5.5 3.3-11.5 8.5-11.5s8.5 6 8.5 11.5c0 3-3.5 4-8.5 4s-8.5-1-8.5-4z" fill="F"/><circle cx="9" cy="12" r="1.5" fill="#fff"/><circle cx="14.5" cy="10" r="1" fill="#fff"/><path d="M6 20c0 1.5 1 2 1 2M17 20c0 1.5-1 2-1 2" stroke="F" stroke-width="1.3" fill="none"/>',
    isotope: '<circle cx="12" cy="12" r="2.6" fill="F"/><g fill="none" stroke="F" stroke-width="1.3"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/></g><circle cx="12" cy="12" r="1" fill="#fff"/>',
    magma: '<path d="M3.5 16l3-8.5 7.5-3 6.5 6.5-2 9.5-9.5 1z" fill="F"/><path d="M7.5 10l3.5 4-2.2 4.5M14 7.5l1 5.2 4.5 2.2" stroke="#ffd060" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    dunglass: '<path d="M6.5 2.5h11l-4.5 9.5 4.5 9.5h-11l4.5-9.5z" fill="F"/><path d="M8.5 19.5h7l-3.5-5.5z" fill="#fff" opacity=".65"/><path d="M6 2.5h12M6 21.5h12" stroke="#fff" stroke-width="1.2"/>',
    silence: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="F" stroke-width="1.3" stroke-dasharray="2 3"/><g fill="F"><circle cx="9" cy="10" r="1.6"/><circle cx="14.5" cy="13" r="1.3"/><circle cx="11" cy="15.5" r="1"/><circle cx="15" cy="8" r=".8"/></g>',
    echo: '<g fill="none" stroke="F" stroke-width="1.7" stroke-linecap="round"><path d="M9 6.5a7.5 7.5 0 0 0 0 11"/><path d="M12.5 3.5a12 12 0 0 0 0 17" opacity=".6"/><path d="M5.5 9a4.5 4.5 0 0 0 0 6"/></g><path d="M16 7.5l5 4.5-5 4.5-2.2-4.5z" fill="F"/>',
    graviton: '<circle cx="12" cy="12" r="4.6" fill="F"/><ellipse cx="12" cy="12" rx="10.5" ry="3.6" fill="none" stroke="F" stroke-width="1.3" transform="rotate(-25 12 12)"/><circle cx="20.5" cy="8.4" r="1.2" fill="#fff"/>',
    timesand: '<path d="M6 2.5h12M6 21.5h12M7 2.5c0 5 5 6.3 5 9.5s-5 4.5-5 9.5M17 2.5c0 5-5 6.3-5 9.5s5 4.5 5 9.5" stroke="F" stroke-width="1.5" fill="none"/><path d="M8.8 20.5h6.4L12 15.5z" fill="F"/><path d="M10 6.5h4L12 9z" fill="F" opacity=".7"/>',
    stardust: '<path d="M12 12m-1 0a1 1 0 1 0 2 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7.5 7.5 0 1 0-15 0" fill="none" stroke="F" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="1.2" fill="#fff"/>',
    nebula: '<path d="M12 3.5c5.5 0 8.5 3 8.5 6.2s-4 3.3-6 2.1 0-4-2.3-4-5.3 2.1-4.2 6.3 6.4 6.4 9.5 4.2" fill="none" stroke="F" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.8" fill="#fff"/><circle cx="5" cy="6" r=".8" fill="F"/><circle cx="19" cy="18" r=".8" fill="F"/>',
    riftshard: '<path d="M12.5 1.5l4.5 8.5-3.3 2.2 3.3 10.3-6.8-9.6 3.4-2.3z" fill="F"/><path d="M8 3.5l-4.5 7.5 3.2 3.2" stroke="F" stroke-width="1.3" fill="none" opacity=".65"/>',
    voidess: '<circle cx="12" cy="12" r="8.5" fill="#08040e" stroke="F" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="F"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/>',
    neoncube: '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z" fill="none" stroke="F" stroke-width="1.7"/><path d="M12 12l8.5-4.7M12 12v9.5M12 12L3.5 7.3" stroke="F" stroke-width="1.3"/><path d="M12 2.5l8.5 4.8L12 12 3.5 7.3z" fill="F" opacity=".35"/>',
    brokencode: '<path d="M8 5.5l-5.5 6.5L8 18.5M16 5.5l5.5 6.5-5.5 6.5" stroke="F" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M13.5 3.5l-3 17" stroke="#fff" stroke-width="1.5"/><rect x="4" y="10.5" width="16" height="1.6" fill="F" opacity=".55"/>',
    halo: '<ellipse cx="12" cy="4.5" rx="5.5" ry="1.7" fill="none" stroke="F" stroke-width="1.4"/><path d="M17.5 7.5c-6.5 1-9.5 6.5-10.5 14l2 .5c1-3 2.4-5.3 5.4-6.3-2 0-3.2-.2-3.8-1.1 2.7-.5 4.3-1.7 5.3-3.7-1 0-2.2 0-3.2-.6 2.2-.6 3.8-1.6 4.8-2.8z" fill="F"/>',
    nullshard: '<path d="M12 1.5l5.5 10.5L12 22.5 6.5 12z" fill="#000" stroke="#fff" stroke-width="1.3"/><path d="M12 1.5l5.5 10.5L12 22.5z" fill="#fff"/><path d="M6.5 12h11" stroke="#888" stroke-width=".6"/>',
    dreamshard: '<path d="M12 2l3 7.5L12 22 9 9.5z" fill="F"/><path d="M18.5 3.5a4.5 4.5 0 1 0 2.8 6.8 3.6 3.6 0 0 1-2.8-6.8z" fill="#fff" opacity=".85"/><circle cx="5" cy="6" r="1" fill="#fff"/><circle cx="20" cy="18" r=".9" fill="#fff"/>',
    twistedshard: '<path d="M12 2c4 3 1 6 4 9s-1 6 1 11c-4-2-7-6-5-10s-3-6 0-10z" fill="F"/><path d="M7 6c2 1 2 3 0 4s-2 3 0 4" stroke="#fff" stroke-width="1" fill="none" opacity=".8"/>',
    nightmareshard: '<path d="M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7z" fill="F"/><circle cx="12" cy="12" r="4" fill="#200"/><circle cx="12" cy="12" r="1.6" fill="#fff"/><path d="M4 5l2 2M20 5l-2 2M12 1v3" stroke="F" stroke-width="1.3"/>',
  };
  const icon = (m, size = 22) => `<svg class="micon" width="${size}" height="${size}" viewBox="0 0 24 24" style="--rc:${rar(m).color}">${(ICON[m.id] || '<circle cx="12" cy="12" r="7" fill="F"/>').split('"F"').join(`"url(#rg-${m.r})"`)}</svg>`;

  // a crystal, drawn: an elongated six-sided gem in its own hue; `fill` 0..1 lights it from the
  // bottom up (the unlit part is a dim ghost of itself), a sheen runs across, a spark at the tip
  function crystalArt(hue, fill = 1, size = 96) {
    const id = `cr${hue}_${Math.round(fill * 1000)}_${size}`, y = 118 - fill * 116;   // same drawing, same ids: repaints compare equal
    const faces = [['50,3 24,28 24,88 50,117 38,100 38,19', 46], ['50,3 38,19 38,100 50,117', 74], ['50,3 62,19 62,100 50,117', 60], ['50,3 76,28 76,88 50,117 62,100 62,19', 32]];
    const facesSvg = (lightMul, sat) => faces.map(([p, l]) => `<polygon points="${p}" fill="hsl(${hue},${sat}%,${Math.round(l * lightMul)}%)"/>`).join('');
    return `<svg class="cryart" width="${size * 0.84}" height="${size}" viewBox="0 0 100 120" style="--ch:${hue}">
      <defs><clipPath id="${id}f"><rect x="0" y="${y}" width="100" height="120"/></clipPath>
        <clipPath id="${id}g"><polygon points="50,3 76,28 76,88 50,117 24,88 24,28"/></clipPath>
        <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <g opacity=".32">${facesSvg(0.45, 25)}</g>
      <g clip-path="url(#${id}f)">${facesSvg(1, 85)}</g>
      <g clip-path="url(#${id}g)"><rect class="sheen" x="-60" y="-10" width="40" height="140" fill="url(#${id}s)" transform="skewX(-18)"/></g>
      <g fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.1" stroke-linejoin="round"><polygon points="50,3 76,28 76,88 50,117 24,88 24,28"/><path d="M50 3L38 19V100L50 117L62 100V19Z M24 28L38 19 M76 28L62 19 M24 88L38 100 M76 88L62 100"/></g>
      ${fill > 0 && fill < 1 ? `<line x1="20" x2="80" y1="${y}" y2="${y}" stroke="hsl(${hue},100%,85%)" stroke-width="1.4" opacity=".9"/>` : ''}
      ${fill >= 1 ? '<path class="spark" d="M50 -6l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/>' : ''}
    </svg>`;
  }

  /* ---------------- drops ---------------- */
  function source() {
    const b = G.biome && G.biome.current();
    if (b) return { key: b.id, biome: true };
    const w = G.weather && G.weather.current();
    return w ? { key: w.id } : null;
  }
  const matFor = key => D.materials.find(m => m.from.includes(key));
  function add(id, n = 1, quiet) {
    const s = G.state; s.mats = s.mats || {};
    s.mats[id] = (s.mats[id] || 0) + n;
    G.save(); paintBadge(); if (!quiet) pickup(id, n);
    autoRun();                                     // 자동 추가: a new resource may finish something
    G.emit('change');
  }
  setInterval(() => {
    if (!G.state || G.config.viewer || !G.state.tutorialDone) return;
    const src = source(); if (!src) return;
    const m = matFor(src.key); if (!m) return;
    if (Math.random() < (m.rareSky ? D.dropRate.rare : D.dropRate.normal)) add(m.id, 1);
  }, D.dropRate.every * 1000);

  /* ---------------- the bag button + the little "+1" that rises off it ---------------- */
  const btn = document.createElement('button');
  btn.id = 'btnBag'; btn.className = 'bevel'; btn.type = 'button';
  btn.innerHTML = `${G.icon('bag', 20)}<span>인벤토리</span><i class="bagdot"></i>`;
  document.body.appendChild(btn);
  if (G.config.viewer) btn.hidden = true;
  let seenTotal = -1;
  const total = () => Object.values(G.state.mats || {}).reduce((a, b) => a + b, 0);
  function paintBadge() { if (!G.state) return; const t = total(); if (seenTotal < 0) seenTotal = t; btn.classList.toggle('new', t > seenTotal); }
  function pickup(id, n) {
    const m = M[id], el = document.createElement('div');
    el.className = 'bagpick'; el.style.setProperty('--rc', rar(m).color);
    el.innerHTML = `${icon(m, 18)}<b>+${n}</b><span>${m.name}</span>`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
  }

  /* ---------------- the inventory window: 자원 / 크리스탈 ---------------- */
  const modal = document.createElement('div'); modal.id = 'bagModal'; modal.hidden = true;
  document.body.appendChild(modal);
  let tab = 'mats';
  const where = m => m.from.map(k => (m.biome ? (D.biomes[k] || {}).name : (D.weathers[k] || {}).name) || k).join(' · ');
  const REGIONS = [['1~2', '지상 · 1~2번째 맵'], ['3~4', '지하 · 3~4번째 맵'], ['5~6', '공허 · 5~6번째 맵'], ['bio', '희귀 바이옴']];
  const regionOf = m => (m.biome ? 'bio' : m.map.startsWith('5') ? '5~6' : m.map.startsWith('3') ? '3~4' : '1~2');

  function matsView() {
    const s = G.state, src = source(), now = src && matFor(src.key);
    const head = now ? `<div class="bnow" style="--rc:${rar(now).color}">${icon(now, 20)}<span>지금 <b>${src.biome ? D.biomes[src.key].name : D.weathers[src.key].name}</b> · 10초마다 ${Math.round((now.rareSky ? D.dropRate.rare : D.dropRate.normal) * 1000) / 10}% 확률로 <b>${now.name}</b></span></div>`
      : '<div class="bnow"><span>지금 날씨에서는 자원이 나오지 않습니다</span></div>';
    return head + REGIONS.map(([key, label]) => {
      const list = D.materials.filter(m => regionOf(m) === key);
      return `<div class="bsec"><h4>${label}</h4><div class="bgrid">${list.map(m => {
        const n = (s.mats || {})[m.id] || 0, r = rar(m);
        return `<div class="bmat ${n ? '' : 'none'}" style="--rc:${r.color}"><i class="mi">${icon(m, 26)}</i><b>${m.name}</b><small>${r.en}</small><em>${G.fmtInt(n)}</em><span>${where(m)}</span></div>`;
      }).join('')}</div></div>`;
    }).join('');
  }
  /* ---------------- luck charms: drawn as a medallion with a glyph, lit from the bottom like the crystals ---------------- */
  const GLYPH = {
    clover: '<g fill="#fff"><circle cx="9" cy="9" r="3.6"/><circle cx="15" cy="9" r="3.6"/><circle cx="9" cy="15" r="3.6"/><circle cx="15" cy="15" r="3.6"/></g><path d="M12 12l3 7" stroke="#fff" stroke-width="1.4"/>',
    star: '<path d="M12 3l2.5 5.6 6.1.6-4.6 4 1.3 6L12 16.1 6.7 19.2l1.3-6-4.6-4 6.1-.6z" fill="#fff"/>',
    frost: '<g stroke="#fff" stroke-width="1.6" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.6L12 6.4l2.5-1.8M9.5 19.4L12 17.6l2.5 1.8"/></g>',
    bolt: '<path d="M13.5 2.5L5.5 13h6l-2 8.5 9-11.5h-6z" fill="#fff"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#fff"/>',
    glass: '<path d="M7 3h10M7 21h10M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M9.5 20h5L12 16z" fill="#fff"/>',
    grail: '<path d="M6.5 4h11c0 5-2.3 8-5.5 8.6V18h3.5v2h-9v-2H10v-5.4C6.8 12 6.5 9 6.5 4z" fill="#fff"/>',
  };
  function charmArt(c, fill = 1, size = 96) {
    const id = `ch${c.id}_${Math.round(fill * 1000)}_${size}`, y = 118 - fill * 112, h = c.hue;
    const body = (l, sat) => `<circle cx="50" cy="68" r="40" fill="hsl(${h},${sat}%,${Math.round(l * 0.55)}%)"/><circle cx="50" cy="68" r="31" fill="hsl(${h},${sat}%,${l}%)"/>`;
    return `<svg class="cryart" width="${size * 0.84}" height="${size}" viewBox="0 0 100 120" style="--ch:${h}">
      <defs><clipPath id="${id}f"><rect x="0" y="${y}" width="100" height="120"/></clipPath>
        <radialGradient id="${id}r" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <path d="M30 32 Q50 2 70 32" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.5" stroke-dasharray="4 3"/>
      <g opacity=".35">${body(30, 20)}</g>
      <g clip-path="url(#${id}f)">${body(56, 80)}<circle cx="50" cy="68" r="31" fill="url(#${id}r)"/></g>
      <circle cx="50" cy="68" r="40" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/><circle cx="50" cy="68" r="31" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = (i / 8) * Math.PI * 2; return `<circle cx="${50 + Math.cos(a) * 35.5}" cy="${68 + Math.sin(a) * 35.5}" r="1.6" fill="rgba(255,255,255,.8)"/>`; }).join('')}
      <g transform="translate(29 47) scale(1.75)" opacity="${fill >= 1 ? 1 : 0.35 + fill * 0.5}">${GLYPH[c.glyph] || ''}</g>
      ${fill >= 1 ? '<path class="spark" d="M50 22l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/>' : ''}
    </svg>`;
  }
  const charm = id => (D.charms || []).find(c => c.id === id);
  const charmLeft = id => Math.max(0, ((G.state.charmUntil || {})[id] || 0) - Date.now());
  function useCharm(id) {
    const s = G.state, c = charm(id); if (!c || !((s.charms || {})[id] > 0)) return false;
    s.charms[id]--; s.charmUntil = s.charmUntil || {};
    s.charmUntil[id] = Math.max(Date.now(), s.charmUntil[id] || 0) + c.min * 60000;
    G.save(); G.emit('change'); return true;
  }
  /* ---------------- gauntlets: neon sigils on dark armour ----------------
     LUCK a four-point star, RAGE fangs, NANO hex circuitry, VIRTUAL brackets and a visor, STRIKER a blade
     of light, CYBERSPACE a screen and traces, ILLUSIONARY a spire and a prismatic diamond. */
  /* the block every gauntlet is: a tall chamfered slab of dark armour (after Sol's RNG's gauntlets) with
     faint panel seams; what makes each one is the neon sigil burning on its face */
  const SLAB = 'M20 6 H80 L86 18 V114 L78 126 H22 L14 114 V18 Z';
  const PANEL = '<path d="M24 12 H76 L80 20 V110 L74 120 H26 L20 110 V20 Z M14 40 H20 M80 40 H86 M14 92 H20 M80 92 H86"/>';
  const SIGIL = {
    luck: '<path d="M50 30 L56.5 57.5 L80 64 L56.5 70.5 L50 98 L43.5 70.5 L20 64 L43.5 57.5 Z"/><circle cx="50" cy="64" r="24" stroke-dasharray="3 5"/><path d="M28 16 H72 M34 112 H66"/><circle cx="50" cy="22" r="2.5"/><circle cx="50" cy="106" r="2.5"/>',
    rage: '<path d="M26 16 L50 44 L74 16"/><path d="M22 50 L50 108 L78 50"/><path d="M36 66 L44 82 M64 66 L56 82"/><path d="M50 52 L54 64 L50 74 L46 64 Z"/><path d="M18 30 L26 36 M82 30 L74 36"/>',
    nano: '<path d="M50 42 L64 50 V66 L50 74 L36 66 V50 Z"/><path d="M50 50 L57 54 V62 L50 66 L43 62 V54 Z"/><path d="M24 16 H76 M24 23 H76"/><path d="M28 98 H72 M32 105 H68 M36 112 H64"/><path d="M26 44 L32 47.5 V54.5 L26 58 M74 44 L68 47.5 V54.5 L74 58"/><path d="M50 74 V92 M36 66 L26 76 V90 M64 66 L74 76 V90"/>',
    virtual: '<path d="M22 10 V20 H44 M78 10 V20 H56"/><path d="M24 28 H76 M24 34 H76"/><path d="M33 44 L37 74 L46 88 M67 44 L63 74 L54 88"/><path d="M28 100 L41 91 H59 L72 100 L65 113 H35 Z"/>',
    striker: '<path d="M26 112 L50 62 L76 14 L58 66 Z"/><path d="M42 72 L52 52 L62 72 L52 92 Z"/><path d="M30 36 L36 30 M68 98 L74 92 M22 60 L28 62 M74 112 L80 108"/>',
    cyber: '<path d="M28 20 H72 V48 H28 Z"/><path d="M30 60 V80 H44 V100 M70 60 V74 H56 V104 M50 54 V70"/><circle cx="44" cy="100" r="2.2"/><circle cx="56" cy="104" r="2.2"/><circle cx="50" cy="70" r="2.2"/><path d="M24 114 H76"/>',
    illusion: '<path d="M50 10 L59 60 L50 54 L41 60 Z"/><path d="M50 60 L63 82 L50 104 L37 82 Z"/><path d="M50 68 L58 82 L50 96 L42 82 Z"/><path d="M50 14 L62 64 L80 76 M50 14 L38 64 L20 76"/><path d="M20 104 V118 H34 M80 104 V118 H66"/>',
    dream: '<path d="M37 50 H63 V106 H37 Z"/><path d="M43 57 H57 V100 H43"/><path d="M61 20 a12 12 0 1 0 9 20 a9.5 9.5 0 0 1 -9 -20 z"/><path d="M27 28 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M75 68 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z"/><path d="M22 116 Q50 104 78 116"/><circle cx="53" cy="80" r="1.6"/>',
  };
  function gauntletArt(gt, fill = 1, size = 96) {
    const id = `gt${gt.id}_${Math.round(fill * 1000)}_${size}`, h = gt.hue, st = gt.style, y = 129 - fill * 128;
    const neon = st === 'illusion' ? `url(#${id}p)` : st === 'dream' ? `url(#${id}d)` : `hsl(${h},100%,${st === 'nano' ? 72 : 62}%)`;
    const body = st === 'virtual' ? [`hsla(${h},60%,20%,.55)`, `hsla(${h},70%,8%,.35)`] : st === 'nano' ? [`hsl(${h},18%,30%)`, `hsl(${h},25%,9%)`] : [`hsl(${h},28%,15%)`, `hsl(${h},30%,4%)`];
    const extra = st === 'cyber' ? `<text x="50" y="39" text-anchor="middle" font-family="monospace" font-weight="700" font-size="12" fill="hsl(190,100%,72%)">RNG</text>` : '';
    const lines = (w, col, op) => `<g fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}">${SIGIL[st]}</g>`;
    return `<svg class="cryart gaunt g-${st}" width="${size * 0.78}" height="${size}" viewBox="0 0 100 130" style="--ch:${h}">
      <defs>
        <linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="130"><stop offset="0" stop-color="${body[0]}"/><stop offset="1" stop-color="${body[1]}"/></linearGradient>
        <linearGradient id="${id}d" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="80" y2="120"><stop offset="0" stop-color="#ffb0ec"/><stop offset=".5" stop-color="#d8c4ff"/><stop offset="1" stop-color="#9fe8ff"/></linearGradient>
        <linearGradient id="${id}p" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="80" y2="120">${[0, 50, 120, 190, 260, 320].map((d, i) => `<stop offset="${i / 5}" stop-color="hsl(${d},95%,70%)"/>`).join('')}</linearGradient>
        <radialGradient id="${id}g" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="hsl(${h},100%,60%)" stop-opacity=".35"/><stop offset="1" stop-color="hsl(${h},100%,60%)" stop-opacity="0"/></radialGradient>
        <clipPath id="${id}f"><rect x="0" y="${y}" width="100" height="130"/></clipPath>
      </defs>
      <path d="${SLAB}" fill="url(#${id}b)" stroke="rgba(255,255,255,.18)" stroke-width="1.2"/>
      <g fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1">${PANEL}</g>
      <path d="M22 8 H78 L83 18 H17 Z" fill="rgba(255,255,255,.06)"/>
      ${lines(2.2, neon, 0.13)}
      <g clip-path="url(#${id}f)">
        <path d="${SLAB}" fill="url(#${id}g)"/>
        ${lines(7, neon, 0.22)}${lines(3.4, neon, 1)}${lines(1.1, '#fff', 0.9)}${extra}
      </g>
      ${fill > 0 && fill < 1 ? `<line x1="14" x2="86" y1="${y}" y2="${y}" stroke="hsl(${h},100%,80%)" stroke-width="1.3"/>` : ''}
      ${fill >= 1 ? '<path class="spark" d="M82 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/>' : ''}
    </svg>`;
  }
  const gauntlet = id => (D.gauntlets || []).find(g => g.id === id);
  const gear = () => (G.state.gear || (G.state.gear = { owned: {}, equipped: null, forge: null }));
  function equip(id) { const g = gear(); if (id && !(g.owned[id] > 0)) return false; g.equipped = g.equipped === id ? null : id; G.save(); G.emit('change'); return true; }

  // the running charms (and the gauntlet being worn), as small chips beside the food buffs under the top bar
  const chipBox = document.createElement('div'); chipBox.id = 'charmChips';
  const buffs = document.getElementById('buffs'); if (buffs) buffs.after(chipBox);
  function paintChips() {
    if (!G.state) return;
    const on = (D.charms || []).filter(c => charmLeft(c.id) > 0), top = G.stats.charmMul(), eq = gauntlet(gear().equipped);
    chipBox.innerHTML = (eq ? `<span class="bchip gchip" style="--ch:${eq.hue}" title="${eq.name}"><b>${eq.en}</b><em>x${eq.mul}</em></span>` : '')
      + on.map(c => { const l = charmLeft(c.id); return `<span class="bchip cchip ${c.mul === top ? 'top' : ''}" style="--ch:${c.hue}" title="${c.name}"><b>x${c.mul}</b><em>${G.fmtTime(l / 1000)}</em><i style="width:${Math.min(100, (l / (c.min * 60000)) * 100)}%"></i></span>`; }).join('');
  }
  setInterval(paintChips, 1000);

  /* ---------------- the inventory's items tab: crystals, charms, gauntlets ---------------- */
  function crystalsView() {
    const s = G.state, list = D.potions.filter(p => (s.potions[p.id] > 0 || s.armed[p.id] > 0) && !(p.event && !G.event.isActive(p.event)));
    const charms = (D.charms || []).filter(c => (s.charms || {})[c.id] > 0 || charmLeft(c.id) > 0);
    const gl = (D.gauntlets || []).filter(x => gear().owned[x.id] > 0), eq = gear().equipped;
    const armedLuck = G.stats.armedLuck(), cm = G.stats.charmMul();
    if (!list.length && !charms.length && !gl.length) return '<div class="bnow"><span>가진 아이템이 없습니다 · 제조 탭에서 만들 수 있어요</span></div>';
    const gt = gl.length ? `<h4 class="bh">건틀렛 <small>장착하면 상시 행운 배율 · 하나만 장착</small></h4>
      <div class="bcrys">${gl.map(x => `<div class="bcry ${eq === x.id ? 'on' : ''}" style="--ph:${x.hue}">${gauntletArt(x, 1, 50)}
          <div class="bci"><b>${x.name}</b><small>${x.en} · 행운 x${x.mul} (상시)</small><em>보유 ${G.fmtInt(gear().owned[x.id])}${eq === x.id ? ' · 장착 중' : ''}</em></div>
          <div class="bcb"><button class="buy bevel small ${eq === x.id ? 'offbtn' : 'ready'}" data-gequip="${x.id}"><span>${eq === x.id ? '해제' : '장착'}</span></button></div></div>`).join('')}</div>` : '';
    const cry = list.length ? `<h4 class="bh">크리스탈 <small>다음 손 클릭 한 번</small></h4>${armedLuck ? `<div class="bnow" style="--rc:#7fd4ff"><span>장전된 럭 <b>+${G.fmt(armedLuck)}</b> · 다음 손 클릭에 적용</span></div>` : ''}
      <div class="bcrys">${list.map(p => {
        const h = s.potions[p.id] || 0, a = s.armed[p.id] || 0;
        const val = p.grantCut ? '한정 광물 확정' : p.guarantee ? `${G.tiers[p.guarantee].en}+ 확정` : `LUCK +${G.fmt(p.luck)}`;
        return `<div class="bcry ${a ? 'on' : ''}" style="--ph:${p.hue}">${crystalArt(p.hue, 1, 46)}
          <div class="bci"><b>${p.name}</b><small>${val}${p.minZone ? ' · 5번째 맵 전용' : ''}${p.crafted ? ' · 제조' : ''}</small><em>보유 ${G.fmtInt(h)}${a ? ` · 장전 ${G.fmtInt(a)}` : ''}</em></div>
          <div class="bcb"><button class="buy bevel small offbtn ${a ? '' : 'poor'}" data-bunarm="${p.id}"><span>취소</span></button><button class="buy bevel small ${h ? '' : 'poor'}" data-buse="${p.id}"><span>마시기</span></button></div></div>`;
      }).join('')}</div>` : '';
    const ch = charms.length ? `<h4 class="bh">행운 아이템 <small>사용하면 일정 시간 행운 배율 · 가장 센 것 하나만 적용</small></h4>${cm > 1 ? `<div class="bnow" style="--rc:#ffd27a"><span>지금 행운 <b>x${cm}</b> 적용 중</span></div>` : ''}
      <div class="bcrys">${charms.map(c => {
        const h = s.charms[c.id] || 0, l = charmLeft(c.id);
        return `<div class="bcry ${l ? 'on' : ''}" style="--ph:${c.hue}">${charmArt(c, 1, 46)}
          <div class="bci"><b>${c.name}</b><small>행운 x${c.mul} · ${c.min}분${l ? ' · 남은 시간 ' + G.fmtTime(l / 1000) : ''}</small><em>보유 ${G.fmtInt(h)}</em></div>
          <div class="bcb"><button class="buy bevel small ${h ? '' : 'poor'}" data-cuse="${c.id}"><span>${l ? '시간 연장' : '사용'}</span></button></div></div>`;
      }).join('')}</div>` : '';
    return gt + cry + ch;
  }
  function paint() {
    if (modal.hidden) return;
    const body = modal.querySelector('.bbody'), keep = body ? body.scrollTop : 0;
    const nItems = D.potions.reduce((a, p) => a + (G.state.potions[p.id] || 0), 0) + Object.values(G.state.charms || {}).reduce((a, b) => a + b, 0) + Object.values(gear().owned).reduce((a, b) => a + b, 0);
    modal.innerHTML = `<div class="scrim" data-bclose></div>
      <div class="tcard bevel bagwin">
        <button class="xclose" data-bclose aria-label="닫기">&times;</button>
        <div class="bhead"><b>INVENTORY</b><small>인벤토리</small></div>
        <div class="btabs"><button class="${tab === 'mats' ? 'on' : ''}" data-btab="mats">${G.icon('bag', 15)}<span>자원</span><i>${G.fmtInt(total())}</i></button><button class="${tab === 'cry' ? 'on' : ''}" data-btab="cry">${G.icon('crystal', 15)}<span>아이템</span><i>${G.fmtInt(nItems)}</i></button></div>
        <div class="bbody">${tab === 'mats' ? matsView() : crystalsView()}</div>
      </div>`;
    const nb = modal.querySelector('.bbody'); if (nb) nb.scrollTop = keep;
  }
  function open(t) { if (t) tab = t; modal.hidden = false; seenTotal = total(); paintBadge(); paint(); requestAnimationFrame(() => modal.classList.add('show')); }
  function close() { modal.classList.remove('show'); setTimeout(() => { modal.hidden = true; }, 280); }
  btn.addEventListener('click', () => { G.audio.init(); G.audio.tab(); open(); });
  G.on('change', () => { paintBadge(); paintChips(); if (!modal.hidden) paint(); });
  modal.addEventListener('click', e => {
    const b = e.target.closest('[data-bclose],[data-btab],[data-buse],[data-bunarm],[data-cuse],[data-gequip]'); if (!b) return;
    const d = b.dataset;
    if (d.bclose != null) { close(); return; }
    if (d.btab) { G.audio.tab(); tab = d.btab; paint(); return; }
    if (d.buse) {
      const p = G.stats.potion(d.buse), r = G.act.armPotion(d.buse, 1);
      if (r === 'zone') { G.audio.deny(); G.emit('toast', '이 크리스탈은 5번째 맵(공허의 균열)부터만 마실 수 있습니다'); }
      else if (r) { G.audio.potion(); G.emit('toast', p && p.grantCut ? '장전됨 - 다음 클릭에 한정 광물이 확정으로 나옵니다' : `${p.name} 장전 - 다음 손 클릭에 럭이 더해집니다`); }
      else G.audio.deny();
      return;
    }
    if (d.bunarm) { if (G.act.unarmPotion(d.bunarm)) { G.audio.tab(); G.emit('toast', '크리스탈을 되돌렸습니다'); } else G.audio.deny(); return; }
    if (d.cuse) { const c = charm(d.cuse); if (useCharm(d.cuse)) { G.audio.potion(); G.audio.blast(3); G.emit('toast', `${c.name} - ${c.min}분 동안 행운 x${c.mul}`); } else G.audio.deny(); return; }
    if (d.gequip) { const x = gauntlet(d.gequip), was = gear().equipped === d.gequip; if (equip(d.gequip)) { G.audio.buy(); if (!was) G.audio.blast(5); G.emit('toast', was ? `${x.name} 해제` : `${x.name} 장착 - 행운 x${x.mul}`); } else G.audio.deny(); }
  });

  /* ---------------- crafting (drawn into the 제조 tab by js/ui.js) ----------------
     Three kinds: crystals (D.recipes), luck charms (D.charms) and gauntlets (D.gauntlets). Ingredients
     can be resources, crystals, charms or other gauntlets. 자동 추가 (per recipe, stays on until turned
     off): whatever it needs goes in as soon as you have it, and the moment it's full it's made and
     goes straight to the inventory - then it starts filling the next one. A gauntlet, once full, goes
     on the forge for its hours (one at a time) and comes off into the inventory by itself. */
  const KINDS = [['crystal', '크리스탈', () => D.recipes], ['charm', '행운 아이템', () => D.charms || []], ['gauntlet', '건틀렛', () => D.gauntlets || []]];
  let cat = 'crystal', made = 0;
  const sel = { crystal: 'dawn', charm: 'clovercharm', gauntlet: 'luckglove' };
  const allRecipes = () => [...D.recipes, ...(D.charms || []), ...(D.gauntlets || [])];
  const recipe = id => allRecipes().find(r => r.id === id);
  const isCharm = id => !!charm(id), isGaunt = id => !!gauntlet(id);
  const art = (R, fill, size) => (isGaunt(R.id) ? gauntletArt(R, fill, size) : isCharm(R.id) ? charmArt(R, fill, size) : crystalArt(R.hue, fill, size));
  const ownedOf = id => (isGaunt(id) ? gear().owned[id] : isCharm(id) ? (G.state.charms || {})[id] : G.state.potions[id]) || 0;
  const progress = R => { if (FREE) { const t = Object.values(R.need).reduce((a, b) => a + b, 0); return [t, t]; } const p = put(R.id); let f = 0, t = 0; for (const [id, n] of Object.entries(R.need)) { f += Math.min(n, p[id] || 0); t += n; } return [f, t]; };
  const fmtDur = min => (min >= 1440 ? `${+(min / 1440).toFixed(1)}일` : min >= 60 ? `${+(min / 60).toFixed(1)}시간` : `${min}분`);
  function cauldronHTML() {
    const s = G.state, list = KINDS.find(k => k[0] === cat)[2](), R = recipe(sel[cat]), inPot = put(R.id), slots = Object.entries(R.need), [filled, need] = progress(R), ready = filled >= need;
    const auto = !!(s.autoCraft || {})[R.id], owned = ownedOf(R.id), fg = gear().forge, forging = fg && fg.id === R.id, busy = fg && !forging;
    const chips = list.map(r => { const [f, t] = progress(r), on = (s.autoCraft || {})[r.id], fo = fg && fg.id === r.id;
      return `<button class="rchip ${r.id === R.id ? 'on' : ''} ${f >= t ? 'full' : f ? 'part' : ''}" data-rsel="${r.id}" style="--rh:${r.hue}">${on ? '<u class="auto">AUTO</u>' : ''}${fo ? '<u class="auto forgeu">FORGE</u>' : ''}${art(r, fo ? 1 : t ? f / t : 0, 34)}<b>${r.name.replace(' 크리스탈', '')}</b><i>${r.star ? '★'.repeat(r.star) : 'x' + r.mul}</i><em>보유 ${G.fmtInt(ownedOf(r.id))}</em></button>`; }).join('');
    const rows = slots.map(([id, n]) => {
      const inN = Math.min(n, inPot[id] || 0), h = have(id), mat = M[id], done = inN >= n;
      const col = mat ? rar(mat).color : `hsl(${(recipe(id) || G.stats.potion(id) || {}).hue || 0},80%,65%)`;
      const ic = mat ? icon(mat, 26) : recipe(id) ? art(recipe(id), 1, 28) : crystalArt((G.stats.potion(id) || {}).hue || 0, 1, 26);
      return `<div class="ing ${done ? 'done' : ''}" style="--rc:${col}">
        <i class="mi">${ic}</i>
        <div class="inm"><b>${nameOf(id)}</b><small>보유 ${G.fmtInt(h)}${mat ? ' · ' + where(mat) : ' · 제조'}</small><u><s style="width:${(inN / n) * 100}%"></s></u></div>
        <em>${inN}<small>/${n}</small></em>
        <div class="ibtn"><button class="buy bevel small ${done || !h ? 'poor' : ''}" data-iadd="${id}" data-n="1"><span>+1</span></button><button class="buy bevel small ${done || !h ? 'poor' : ''}" data-iadd="${id}" data-n="all"><span>최대</span></button></div>
      </div>`;
    }).join('');
    const eff = isGaunt(R.id) ? `장착하면 상시 행운 x${R.mul} · 단조 ${fmtDur(R.forge)}` : isCharm(R.id) ? `행운 x${R.mul} · ${R.min}분 · 인벤토리에서 사용` : `LUCK +${G.fmt(R.luck)} · 다음 손 클릭 1번${R.minZone ? ' · 5번째 맵 전용' : ''}`;
    const fk = forging ? clamp01(1 - (fg.end - Date.now()) / fg.dur) : 0;
    const brewBtn = isGaunt(R.id)
      ? (forging ? `<button class="buy bevel poor" disabled><span>단조 중 · ${G.fmtTime(Math.max(0, fg.end - Date.now()) / 1000)}</span></button>`
        : busy ? `<button class="buy bevel poor" disabled><span>다른 건틀렛 단조 중</span></button>`
          : `<button class="buy bevel ${ready ? 'ready' : 'poor'}" data-brew><span>${ready ? `단조 시작 (${fmtDur(R.forge)})` : '재료가 부족합니다'}</span></button>`)
      : `<button class="buy bevel ${ready ? 'ready' : 'poor'}" data-brew><span>${ready ? '제조하기' : '재료가 부족합니다'}</span></button>`;
    return `<div class="craft">
      <div class="ccats">${KINDS.map(([k, label]) => `<button class="${cat === k ? 'on' : ''}" data-ccat="${k}">${label}</button>`).join('')}</div>
      <div class="rchips ${cat === 'gauntlet' ? 'g7' : ''}">${chips}</div>
      <div class="forge ${made ? 'made' : ''} ${forging ? 'forging' : ''}" style="--rh:${R.hue}">
        <div class="fart">${art(R, forging ? 1 : filled / need, isGaunt(R.id) ? 150 : 128)}</div>
        <div class="finfo"><i>${R.star ? '★'.repeat(R.star) : isGaunt(R.id) ? 'GAUNTLET' : 'LUCK CHARM'}</i><b>${R.name}</b><small>${R.en}</small><span>${eff}</span>
          ${forging ? `<u class="fu"><s style="width:${fk * 100}%"></s></u><em>단조 ${Math.floor(fk * 100)}% · 남은 시간 ${G.fmtTime(Math.max(0, fg.end - Date.now()) / 1000)} · 끝나면 인벤토리로</em>`
            : `<u><s style="width:${(filled / need) * 100}%"></s></u><em>${Math.round((filled / need) * 100)}% · 보유 ${G.fmtInt(owned)}</em>`}</div>
      </div>
      <div class="ings">${rows}</div>
      <div class="potact">
        <button class="buy bevel" data-iall><span>가진 만큼 전부 넣기</span></button>
        ${brewBtn}
      </div>
      <button class="autobtn ${auto ? 'on' : ''}" data-auto="${R.id}"><i></i><span><b>자동 추가 ${auto ? 'ON' : 'OFF'}</b><small>${auto ? (isGaunt(R.id) ? '재료가 들어오는 대로 넣고, 다 차면 바로 단조를 시작합니다 · 끌 때까지 계속' : '재료가 들어오는 대로 넣고, 다 차면 바로 만들어 인벤토리로 보냅니다 · 끌 때까지 계속') : '켜 두면 재료를 알아서 넣고 다 차면 자동으로 제조합니다'}</small></span></button>
      <p class="bnote">넣은 재료는 그대로 남아 있습니다 · 다른 것을 골라도 사라지지 않아요 · 자원은 왼쪽 아래 인벤토리에서 확인</p></div>`;
  }
  const clamp01 = v => Math.max(0, Math.min(1, v));
  function addIng(rid, id, n) {
    const R = recipe(rid), p = put(rid), room = R.need[id] - (p[id] || 0), h = have(id), k = Math.min(room, h, n === 'all' ? Infinity : n);
    if (k <= 0) return 0;
    take(id, k);
    p[id] = (p[id] || 0) + k;
    return k;
  }
  // make it: crystals and charms straight to the inventory; a gauntlet onto the forge (if it's free)
  function brew(rid) {
    const R = recipe(rid), p = put(rid);
    if (!FREE && !Object.entries(R.need).every(([id, n]) => (p[id] || 0) >= n)) return false;
    if (isGaunt(rid)) {
      const g = gear(); if (g.forge) return false;
      G.state.cauldron[rid] = {};
      const dur = FREE ? 8000 : R.forge * 60000; g.forge = { id: rid, end: Date.now() + dur, dur };
      G.save(); return 'forge';
    }
    G.state.cauldron[rid] = {};
    if (isCharm(rid)) { G.state.charms = G.state.charms || {}; G.state.charms[rid] = (G.state.charms[rid] || 0) + 1; }
    else G.state.potions[rid] = (G.state.potions[rid] || 0) + 1;
    G.save(); return true;
  }
  // the forge: a finished gauntlet comes off by itself (also after a reload or a long time away)
  function forgeTick() {
    const g = G.state && G.state.gear; if (!g || !g.forge || Date.now() < g.forge.end) return false;
    const R = gauntlet(g.forge.id); g.forge = null;
    if (R) { g.owned[R.id] = (g.owned[R.id] || 0) + 1; madeFx(R, false); G.emit('toast', `${R.name} 단조 완료 - 인벤토리에서 장착하세요`); G.audio.blast(8); }
    G.save(); return true;
  }
  // 자동 추가: fill every recipe it's on for, make whatever is full (again and again while it can)
  function autoRun() {
    const s = G.state; if (!s || !s.autoCraft) return;
    let changed = forgeTick();
    for (const R of allRecipes()) {
      if (!s.autoCraft[R.id]) continue;
      for (let guard = 0; guard < (FREE ? 1 : 50); guard++) {   // (free local mode: one per tick, not a flood)
        let added = 0; for (const id in R.need) added += addIng(R.id, id, 'all');
        if (added) changed = true;
        const r = brew(R.id); if (!r) break;
        changed = true; if (r === 'forge') { G.emit('toast', `${R.name} 단조 시작 (${fmtDur(R.forge)})`); break; }
        madeFx(R, true);
      }
    }
    if (changed) { G.save(); G.emit('change'); }
  }
  function madeFx(R, auto) {
    const el = document.createElement('div');
    el.className = 'bagpick made'; el.style.setProperty('--rc', `hsl(${R.hue},85%,65%)`);
    el.innerHTML = `${art(R, 1, 22)}<b>+1</b><span>${auto ? '자동 제조 · ' : ''}${R.name}</span>`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
  }
  setInterval(() => { if (!G.state || G.config.viewer) return; if (forgeTick()) G.emit('change'); autoRun(); if (cat === 'gauntlet' && gear().forge) G.emit('change'); }, 2000);
  document.getElementById('panel').addEventListener('click', e => {
    const b = e.target.closest('[data-rsel],[data-iadd],[data-iall],[data-brew],[data-ccat],[data-auto]'); if (!b) return;
    const d = b.dataset;
    G.audio.tab();
    if (d.ccat) { cat = d.ccat; G.emit('change'); return; }
    if (d.rsel) { sel[cat] = d.rsel; G.emit('change'); return; }
    if (d.auto) { const s = G.state; s.autoCraft = s.autoCraft || {}; s.autoCraft[d.auto] = !s.autoCraft[d.auto]; if (!s.autoCraft[d.auto]) delete s.autoCraft[d.auto]; G.save(); autoRun(); G.emit('change'); return; }
    const R = recipe(sel[cat]);
    if (d.iadd) { if (addIng(R.id, d.iadd, d.n === 'all' ? 'all' : 1)) { G.save(); G.emit('change'); } else G.audio.deny(); return; }
    if (d.iall != null) { let any = 0; for (const id in R.need) any += addIng(R.id, id, 'all'); if (any) { G.save(); G.emit('change'); } else G.audio.deny(); return; }
    if (d.brew != null) {
      const r = brew(R.id);
      if (!r) { G.audio.deny(); return; }
      made = 1; G.emit('change');
      G.audio.potion(); G.audio.blast(Math.min(8, R.star || 5));
      G.emit('toast', r === 'forge' ? `${R.name} 단조 시작 - ${fmtDur(R.forge)} 뒤 인벤토리로 들어옵니다` : `${R.name}을(를) 만들었습니다 · 인벤토리에서 ${isCharm(R.id) ? '사용' : '마실'} 수 있어요`);
      setTimeout(() => { made = 0; G.emit('change'); }, 1200);
    }
  });

  G.inv = { add, open, source, cauldronHTML, icon, crystalArt, charmArt, gauntletArt, useCharm, equip };
  // local dev: hand over a pile of every resource to try the cauldron
  if (G.config.dev) G.debug = Object.assign(G.debug || {}, { mats: (n = 50) => { D.materials.forEach(m => add(m.id, n, true)); return 'ok'; } });
})();
