/*
  GAME THEMES (설정 - 테마). The default, plus achievement themes unlocked by doing something
  (unlock.test - checked in js/settings.js). Once owned, switchable any time.
  css      : html[data-theme] palette in css/style.css (none for the default)
  bg       : the mining screen behind the crystal (js/game.js drawBackground)
             hue = fixed hue for the backdrop (null keeps each map's own hue), s/l = its saturation / lightness
  ambient  : the effect drawn over the backdrop (js/game.js ambient): dust (default) / one of each achievement theme's own
  preview  : colours for the swatch on the theme card
  noPreview: no 미리보기 button at all (spoiler guard - every theme unlocked by drawing a mineral))
  The crystal itself always keeps its map colour.
*/
G.data.themes = [
  { id: 'amethyst', name: '기본 자수정', en: 'AMETHYST', price: 0, css: '', bg: { hue: null, s: 45, l: 7 }, ambient: 'dust',
    desc: '처음부터 함께한 보랏빛 광산', preview: ['#07060c', '#a970ff', '#241640'] },
  /* ---- achievement themes: never sold - unlocked by doing something. js/settings.js checks
     unlock.test(state) and, the moment it passes, hands the theme over with an unlock banner ---- */
  { id: 'divine', name: 'THE DIVINE', en: 'THE DIVINE', price: 0, noPreview: true, css: 'divine', bg: { hue: 24, s: 75, l: 5 }, ambient: 'divine',
    unlock: { label: '1억 이상 광물 발견', test: s => foundOver(s, 1e8) },
    desc: '신의 빛이 내려앉은 광산 · 타오르는 성환과 쏟아지는 빛줄기', preview: ['#0a0401', '#ff8a1e', '#3a1806'] },
  { id: 'sovereign', name: 'THE SOVEREIGN', en: 'THE SOVEREIGN', price: 0, noPreview: true, css: 'sovereign', bg: { hue: 42, s: 35, l: 4 }, ambient: 'sovereign',
    unlock: { label: '10억 이상 광물 발견', test: s => foundOver(s, 1e9) },
    desc: '황제의 옥좌 · 루비 박힌 황금 모서리와 아르데코 광채, 월계관 아래 내리는 금가루', preview: ['#060402', '#f3c64e', '#2a1c06'] },
  { id: 'empyrean', name: 'THE EMPYREAN', en: 'THE EMPYREAN', price: 0, noPreview: true, css: 'empyrean', bg: { hue: 222, s: 60, l: 4 }, ambient: 'empyrean',
    unlock: { label: '100억 이상 광물 발견', test: s => foundOver(s, 1e10) },
    desc: '하늘 위의 옥좌 · 사파이어와 백금의 모서리, 오로라와 별똥별, 룬이 새겨진 성환', preview: ['#02040c', '#7fb8ff', '#0c1c44'] },
  { id: 'verdant', name: 'THE VERDANT', en: 'THE VERDANT', price: 0, noPreview: true, css: 'verdant', bg: { hue: 145, s: 55, l: 4 }, ambient: 'verdant',
    unlock: { label: '1000억 이상 광물 발견', test: s => foundOver(s, 1e11) },
    desc: '태고의 숲의 왕좌 · 에메랄드 모서리와 덩굴, 크리스탈을 감은 비취 우로보로스, 퍼져나가는 생명의 파동', preview: ['#020a05', '#3ee38a', '#0a2a14'] },
  { id: 'crimson', name: 'THE CRIMSON', en: 'THE CRIMSON', price: 0, noPreview: true, css: 'crimson', bg: { hue: 356, s: 70, l: 4 }, ambient: 'crimson',
    unlock: { label: '1조 이상 광물 발견', test: s => foundOver(s, 1e12) },
    desc: '피의 달 아래 폭군의 옥좌 · 뿔 달린 루비 모서리, 가시 성환과 붉은 번개, 심장처럼 뛰는 화면', preview: ['#0c0102', '#ff2a3a', '#3a0408'] },
  { id: 'infinite', name: 'THE INFINITE', en: 'THE INFINITE', price: 0, noPreview: true, css: 'infinite', bg: { hue: 255, s: 35, l: 3 }, ambient: 'infinite',
    unlock: { label: '1000조 이상 광물 발견', test: s => foundOver(s, 1e15) },
    desc: '시간의 끝, 무한의 옥좌 · 크리스탈을 삼킨 블랙홀과 천체 시계, 프리즘으로 타오르는 ∞', preview: ['#030306', '#e6e6ff', '#16162a'] },
  { id: 'origin', name: 'THE ORIGIN', en: 'THE ORIGIN', price: 0, noPreview: true, css: 'origin', bg: { hue: 250, s: 40, l: 3 }, ambient: 'origin',
    unlock: { label: '1경 이상 광물 발견', test: s => foundOver(s, 1e16) },
    desc: '모든 것이 시작된 곳 · 3D로 도는 신성기하학, 황금 나선으로 빨려드는 빛, 주기적인 빅뱅', preview: ['#04030a', '#fff1c4', '#1c1830'] },
  /* ---- discovery themes: not a rarity floor but a particular kind of find ---- */
  { id: 'unseen', name: 'THE UNSEEN', en: 'THE UNSEEN', price: 0, noPreview: true, css: 'unseen', bg: { hue: 0, s: 0, l: 1 }, ambient: 'unseen',
    unlock: { label: '시크릿 광물 발견', test: s => foundTier(s, 'secret') },
    desc: '보이지 않는 것들이 보고 있다 · 어둠 속에서 뜨는 눈, 동공이 된 크리스탈, 깜빡이는 화면', preview: ['#000000', '#d8d8d8', '#141414'] },
  /* unlock.progress (optional): [have, need], shown on the locked card */
  { id: 'archive', name: 'THE ARCHIVE', en: 'THE ARCHIVE', price: 0, noPreview: true, css: 'archive', bg: { hue: 28, s: 45, l: 4 }, ambient: 'archive',
    unlock: { label: '1억 이상 광물 1000번 뽑기', test: s => findsOver(s, 1e8) >= 1000, progress: s => [findsOver(s, 1e8), 1000] },
    desc: '천 번의 행운을 기록한 서고 · 책장 사이의 펼쳐진 고서, 페이지에서 떠오르는 고대 문자, 일렁이는 촛불', preview: ['#0c0703', '#d6aa50', '#3a2210'] },
  { id: 'symphony', name: 'THE SYMPHONY', en: 'THE SYMPHONY', price: 0, noPreview: true, css: 'symphony', bg: { hue: 0, s: 0, l: 3 }, ambient: 'symphony',
    unlock: { label: '1억 이상 광물 3번 연속 뽑기', test: s => ((s.ach && s.ach.best8) || 0) >= 3, progress: s => [Math.min(3, (s.ach && s.ach.best8) || 0), 3] },
    desc: '세 번 연속, 완벽한 화음 · 흑백 악보와 떠다니는 음표, 크리스탈을 감은 오선, 스스로 연주하는 피아노', preview: ['#050505', '#ffffff', '#1c1c1c'] },
];
G.data.themes.push(
  { id: 'error', name: 'ERR0R', en: 'ERR0R', price: 0, css: 'error', bg: { hue: 300, s: 30, l: 3 }, ambient: 'error',
    unlock: { label: '글리치 바이옴 발견', test: s => biomeSeen(s, 'glitch') },
    desc: '세계가 깨진 순간 · 부서지는 화면과 데이터 비, 줄줄이 뜨는 오류창, 어긋나는 RGB', preview: ['#050208', '#ff2a6a', '#1a0a20'] },
  { id: 'cuber', name: 'CUBER STAGE', en: 'CUBER STAGE', price: 0, css: 'cuber', bg: { hue: 265, s: 60, l: 5 }, ambient: 'cuber',
    unlock: { label: '큐버 스테이지 바이옴 발견', test: s => biomeSeen(s, 'cuber') },
    desc: '네온의 무대 · 줄무늬 태양과 달려오는 격자, 조명과 레이저, 4차원 큐브, 128BPM', preview: ['#0a0418', '#3af0ff', '#2a0a40'] },
  { id: 'gods', name: 'G.O.D.S', en: 'G.O.D.S', price: 0, noPreview: true, css: 'gods', bg: { hue: 210, s: 70, l: 55 }, ambient: 'gods', music: 'audio/gods.mp3',
    unlock: { label: 'THE GODS 발견 (THE HEAVEN 한정 광물)', test: s => { const c = s.codex.thegods; return !!(c && (typeof c === 'number' ? c : c.n)); } },
    desc: '하늘의 눈들 · 날개 달린 눈이 떠다니는 맑은 하늘, 눈의 고리 - 그리고 가끔, 하늘이 당신을 내려다본다', preview: ['#7fb8ff', '#ffffff', '#1a3a6a'] },
  { id: 'null', name: 'NULL', en: 'NULL', price: 0, noPreview: true, css: 'null', bg: { hue: 240, s: 15, l: 2 }, ambient: 'null', music: 'audio/flow.mp3',
    unlock: { label: 'NULLSCAPES 발견 (NULL 한정 광물)', test: s => { const c = s.codex.nullscapes; return !!(c && (typeof c === 'number' ? c : c.n)); } },
    desc: '아무것도 없는 곳을 뚫고 나온 것 · 크리스탈을 둘러싼 부서진 흑백 모놀리스, 틈에서 새는 빛, Flow', preview: ['#000000', '#ffffff', '#16161c'] },
  { id: 'dreamcore', name: 'DREAMCORE', en: 'DREAMCORE', price: 0, css: 'dreamcore', bg: { hue: 290, s: 40, l: 10 }, ambient: 'dreamcore',
    unlock: { label: '꿈 바이옴 발견 (DREAM · LUCID DREAM · NIGHTMARE)', test: s => biomeSeen(s, 'dream') || biomeSeen(s, 'lucid') || biomeSeen(s, 'nightmare') },
    desc: '어디선가 본 것 같은 곳 · 파스텔 하늘 아래 들판의 검은 문, 떠다니는 구름과 비눗방울, 가끔 떠오르는 문장', preview: ['#2a1e48', '#ffc4ee', '#bfeeff'] },
);
// has this rare biome ever come up (recorded since the themes came in), or has one of its minerals been found
function biomeSeen(s, id) {
  if ((s.ach && s.ach.biomes && s.ach.biomes[id]) || (s.biome && s.biome.id === id)) return true;
  for (const k in s.codex) { const d = G.cutscenes.byId[k], c = s.codex[k], n = typeof c === 'number' ? c : c && c.n; if (n > 0 && d && d.biome === id) return true; }
  return false;
}
// how many times minerals at least this rare have been found, all told
function findsOver(s, odds) {
  let n = 0;
  for (const id in s.codex) { const c = s.codex[id], k = typeof c === 'number' ? c : c && c.n, d = G.cutscenes.byId[id]; if (k > 0 && d && d.odds >= odds && !d.special) n += k; }
  return n;
}
// has a mineral of this tier key (G.tiers[].key) ever been found
function foundTier(s, key) {
  for (const id in s.codex) { const c = s.codex[id], n = typeof c === 'number' ? c : c && c.n, d = G.cutscenes.byId[id]; if (n > 0 && d && G.tiers[d.tierIdx] && G.tiers[d.tierIdx].key === key) return true; }
  return false;
}
// has any mineral at least this rare ever been found (codex entries are { n, ... })
function foundOver(s, odds) {
  for (const id in s.codex) { const c = s.codex[id], n = typeof c === 'number' ? c : c && c.n, d = G.cutscenes.byId[id]; if (n > 0 && d && !d.special && d.odds >= odds) return true; }   // event minerals come guaranteed from a bought crystal - not luck, so they don't count
  return false;
}
G.theme = () => G.data.themes.find(t => t.id === (G.state && G.state.theme)) || G.data.themes[0];
