/* AMETHYST - core utilities. Everything lives under the global G namespace. */
window.G = { data: {}, _ev: {} };

G.on = (e, f) => { (G._ev[e] = G._ev[e] || []).push(f); };
G.emit = (e, a) => { (G._ev[e] || []).forEach(f => f(a)); };

G.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
G.lerp = (a, b, t) => a + (b - a) * t;
G.seg = (p, a, b) => G.clamp((p - a) / (b - a));

G.E = {
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

/* seeded rng (mulberry32) - use it inside scenes so visuals are stable frame to frame */
G.rng = seed => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const _rgb = {};
G.rgba = (hex, a = 1) => {
  let c = _rgb[hex];
  if (!c) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    c = _rgb[hex] = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
};

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
/* 설정 - 번쩍임 줄이기: every full-screen white flash is scaled by this */
G.flashMul = () => (G.opt && G.opt('lessFlash') ? 0.2 : 1);

/* number style follows 설정 - 숫자 표기: 'short' 1.23M / 'kr' 1.23억 / 'full' 1,230,000 */
const KR = [['간', 1e36], ['구', 1e32], ['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
G.fmt = n => {
  n = Math.floor(n);
  if (!isFinite(n)) return 'MAX';
  const mode = G.opt ? G.opt('numFmt') : 'short';
  if (mode === 'full' && n < 1e21) return n.toLocaleString('en-US');
  if (mode === 'kr') {
    if (n < 1e4) return n.toLocaleString('en-US');
    const [u, d] = KR.find(([, v]) => n >= v), v = n / d;
    return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v).toLocaleString('en-US')) + u;
  }
  if (n < 1e6) return n.toLocaleString('en-US');
  const i = Math.min(Math.floor(Math.log10(n) / 3), SUF.length - 1);
  const v = n / Math.pow(1000, i);
  return (v >= 100 ? v.toFixed(1) : v.toFixed(2)) + SUF[i];
};
G.fmtInt = n => Math.floor(n).toLocaleString('en-US');
G.fmtTime = s => {
  s = Math.max(0, Math.ceil(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
G.fmtLuck = v => 'x' + (v >= 1e4 ? G.fmt(v) : v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

/* rarity tiers - derived from the odds of a cutscene ("1 in N") */
G.tiers = [
  { key: 'common',    ko: '일반',   en: 'COMMON',       below: 1e3,      color: '#9aa6c4' },
  { key: 'uncommon',  ko: '고급',   en: 'UNCOMMON',     below: 1e4,      color: '#4fe0c4' },
  { key: 'rare',      ko: '희귀',   en: 'RARE',         below: 1e5,      color: '#5aa8ff' },
  { key: 'epic',      ko: '영웅',   en: 'EPIC',         below: 1e6,      color: '#b878ff' }, // 10만대
  { key: 'legendary', ko: '전설',   en: 'LEGENDARY',    below: 1e7,      color: '#ffb63d' }, // 100만대
  { key: 'mythic',    ko: '신화',   en: 'MYTHIC',       below: 1e8,      color: '#ff4f7b' }, // 1000만대
  { key: 'divine',    ko: '신성',   en: 'DIVINE',       below: 1e9,      color: '#7ff3ff' }, // 1억대
  { key: 'celestial', ko: '초월',   en: 'TRANSCENDENT', below: 1e10,     color: '#ffe08a' }, // 10억대
  /* the one hidden mineral per map (and the weather / boss exclusives) - only ever given explicitly
     with tier:'secret', never derived from odds */
  { key: 'secret',    ko: '시크릿', en: 'SECRET',       below: Infinity, color: '#ff2b4a', manual: true },
  /* never rolled by odds: the monthly event minerals (js/data/events.js), only obtainable from that
     month's limited mineral crystal. Registered with tier:'special' + special:true */
  { key: 'special',   ko: '스페셜', en: 'SPECIAL',      below: Infinity, color: '#ffd45a', manual: true },
  /* the 5th map's ladder beyond 10억 - 100억 all the way to 999해 */
  { key: 'astral',     ko: '천체', en: 'ASTRAL',     below: 1e12, color: '#9ab8ff' },  // 100억 ~ 9999억
  { key: 'eternal',    ko: '영원', en: 'ETERNAL',    below: 1e14, color: '#7affc8' },  // 1조 ~ 99조
  { key: 'cosmic',     ko: '우주', en: 'COSMIC',     below: 1e16, color: '#c08aff' },  // 100조 ~ 9999조
  { key: 'primordial', ko: '태초', en: 'PRIMORDIAL', below: 1e18, color: '#ff8a5a' },  // 1경 ~ 99경
  { key: 'infinite',   ko: '무한', en: 'INFINITE',   below: 1e20, color: '#5affff' },  // 100경 ~ 9999경
  { key: 'absolute',   ko: '절대', en: 'ABSOLUTE',   below: Infinity, color: '#ffffff' }, // 1해 ~ 999해
];
G.tierIndex = odds => { for (let i = 0; i < G.tiers.length; i++) { const t = G.tiers[i]; if (!t.manual && odds < t.below) return i; } return G.tiers.length - 1; };
G.isSecret = d => !!d && G.tiers[d.tierIdx] && G.tiers[d.tierIdx].key === 'secret';
/* Korean big-number units for the odds of the deep ladder: 1억, 100억, 1조, 1경, 1해 */
G.fmtKr = n => {
  const U = [[1e20, '해'], [1e16, '경'], [1e12, '조'], [1e8, '억'], [1e4, '만']];
  for (const [v, u] of U) if (n >= v) { const x = n / v; return (x >= 100 ? Math.round(x) : x >= 10 ? +x.toFixed(1) : +x.toFixed(2)) + u; }
  return G.fmtInt(n);
};
/* a number the player typed: "100000000", "100,000,000", "1e8", "10m", "1.5b", "1억", "3천만", "2조".
   Empty = 0. Returns null if it can't be read. */
G.parseAmount = str => {
  let s = String(str || '').trim().toLowerCase().replace(/[,\s]/g, '');
  if (!s) return 0;
  if (/^[0-9.]+(e[0-9]+)?$/.test(s)) { const v = +s; return isFinite(v) && v >= 0 ? v : null; }
  const EN = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  let m = s.match(/^([0-9.]+)([kmbt])$/); if (m) return +m[1] * EN[m[2]];
  // Korean: sum of "<n><unit>" chunks, units 해 경 조 억 만 with 천/백/십 inside them
  const BIG = { 해: 1e20, 경: 1e16, 조: 1e12, 억: 1e8, 만: 1e4 }, SMALL = { 천: 1e3, 백: 1e2, 십: 10 };
  let total = 0, part = 0, num = '';
  for (const ch of s) {
    if (/[0-9.]/.test(ch)) { num += ch; continue; }
    if (SMALL[ch]) { part += (num ? +num : 1) * SMALL[ch]; num = ''; continue; }
    if (BIG[ch]) { part += num ? +num : 0; total += (part || 1) * BIG[ch]; part = 0; num = ''; continue; }
    return null;
  }
  total += part + (num ? +num : 0);
  return isFinite(total) ? total : null;
};
/* "1 in N" - full digits up to 1조, Korean units beyond so the deep ladder stays readable */
G.fmtOdds = n => (n >= 1e13 ? G.fmtKr(n) : G.fmtInt(n));
G.GRAND = 6; // tiers at or above this index get the cinematic treatment

/* colour helpers */
G.hsl = (h, s, l) => {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = v => Math.round(255 * v).toString(16).padStart(2, '0');
  return '#' + x(f(0)) + x(f(8)) + x(f(4));
};
/* palette [bright, mid, dark] from a hue (h2 = optional second hue for the mid colour) */
G.pal = (h, h2) => [G.hsl(h, 90, 74), G.hsl(h2 == null ? h + 18 : h2, 85, 52), G.hsl(h, 60, 4)];

/* line icons (no emoji anywhere) */
const P = {
  coin: '<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 8l3.2 1.8v4.4L12 16l-3.2-1.8V9.8z"/>',
  shop: '<path d="M4 8h16l-1.5 12h-13z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  map: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/>',
  up: '<path d="M6 11l6-6 6 6"/><path d="M6 18l6-6 6 6"/>',
  book: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
  luck: '<path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6"/>',
  lock: '<rect x="6" y="11" width="12" height="9"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  /* foods */
  bread: '<path d="M4 15c0-4 3.5-7 8-7s8 3 8 7z"/><path d="M4 15h16v3H4z"/>',
  cake: '<path d="M5 12h14v7H5z"/><path d="M5 12l2-4h10l2 4"/><path d="M12 4v4"/>',
  meat: '<path d="M15 4l5 5-7 7-4-1-4 4-1-1 4-4-1-4z"/>',
  stew: '<path d="M4 11h16a8 7 0 0 1-16 0z"/><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/>',
  dragon: '<path d="M12 4l6 3v6c0 3-3 6-6 7-3-1-6-4-6-7V7z"/><path d="M9 11l2 2 2-2 2 2"/>',
  feast: '<path d="M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z"/><path d="M4 20h16"/>',
  meteor: '<path d="M14 3L4 13l4 4L18 7z"/><circle cx="17.5" cy="6.5" r="1.6"/><path d="M6 18l-2 2M10 19l-1.5 1.5M14 20l-1 1"/>',
  crown: '<path d="M4 19h16l-1.4-9-4.1 4-2.5-6-2.5 6-4.1-4z"/><path d="M4 19v2h16v-2"/>',
  goblet: '<path d="M6 4h12l-1 5a5 5 0 0 1-10 0z"/><path d="M12 13v5"/><path d="M8 20h8"/>',
  crystal: '<path d="M12 2.5l6.5 5.5L12 21.5 5.5 8z"/><path d="M5.5 8h13M9 8l3-5.5L15 8M9 8l3 13.5L15 8"/>',
  potion: '<path d="M9.5 3h5M10.5 3v5.2L5.6 17a3 3 0 0 0 2.6 4.5h7.6a3 3 0 0 0 2.6-4.5L13.5 8.2V3"/><path d="M7.6 14.5h8.8"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  exchange: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  gift: '<rect x="4" y="10" width="16" height="4"/><rect x="5" y="14" width="14" height="7"/><path d="M12 10v11"/><path d="M12 10c-1-4-6-4-6-1s5 1 6 1zm0 0c1-4 6-4 6-1s-5 1-6 1z"/>',
  ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="2 2"/>',
  can: '<rect x="5" y="7" width="14" height="12" rx="1"/><path d="M5 11h14M8 4h8l1 3H7z"/>',
  bottle: '<path d="M10 2h4v4l2 3v12H8V9l2-3z"/><path d="M8 13h8"/>',
  bowl: '<path d="M3 11h18a9 7 0 0 1-18 0z"/><path d="M8 19h8"/><path d="M10 7c0-2 2-2 2-4"/>',
  candy: '<circle cx="12" cy="12" r="4"/><path d="M8.5 10L4 7v10l4.5-3M15.5 10L20 7v10l-4.5-3"/>',
  leaf: '<path d="M12 21V11M12 3l2 4 4-1-1 4 4 2-4 2 1 4-4-1-2 4-2-4-4 1 1-4-4-2 4-2-1-4 4 1z"/>',
  moon: '<path d="M16 3a9 9 0 1 0 5 12A7 7 0 0 1 16 3z"/>',
  /* weather */
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 9.3 4.4 4.4 0 0 0 7 18z"/>',
  rain: '<path d="M7 14h10a3.5 3.5 0 0 0 .5-7A5.5 5.5 0 0 0 6.6 6.6 3.8 3.8 0 0 0 7 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  bolt: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
  rainbow: '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M10 18a2 2 0 0 1 4 0"/>',
  sand: '<path d="M3 8h13a3 3 0 1 0-3-3"/><path d="M3 13h17a3 3 0 1 1-3 3"/><path d="M3 18h8"/>',
  volcano: '<path d="M2 21h20l-6-11h-4z"/><path d="M12 10V4M9 6l3-2 3 2"/><path d="M11 14l-2 4M14 14l1 3"/>',
  void: '<circle cx="12" cy="12" r="3"/><path d="M12 3a9 9 0 0 1 9 9M21 12a9 9 0 0 1-9 9M12 21a9 9 0 0 1-9-9M3 12a9 9 0 0 1 9-9" stroke-dasharray="3 3"/>',
  heart: '<path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.2-1.6l2-1.4-2-3.4-2.3.9a7 7 0 0 0-2.7-1.6L13.4 2h-2.8l-.4 2.9a7 7 0 0 0-2.7 1.6l-2.3-.9-2 3.4 2 1.4a7 7 0 0 0 0 3.2l-2 1.4 2 3.4 2.3-.9a7 7 0 0 0 2.7 1.6l.4 2.9h2.8l.4-2.9a7 7 0 0 0 2.7-1.6l2.3.9 2-3.4-2-1.4c.13-.5.2-1.05.2-1.6z"/>',
};
G.icon = (name, size = 22) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="miter" stroke-linecap="square" aria-hidden="true">${P[name] || ''}</svg>`;
