/*
  GAME THEMES (설정 - 테마). The default, plus achievement themes unlocked by doing something
  (unlock.test - checked in js/settings.js). Once owned, switchable any time.
  css      : html[data-theme] palette in css/style.css (none for the default)
  bg       : the mining screen behind the crystal (js/game.js drawBackground)
             hue = fixed hue for the backdrop (null keeps each map's own hue), s/l = its saturation / lightness
  ambient  : the effect drawn over the backdrop (js/game.js ambient): dust (default) / one of each achievement theme's own
  preview  : colours for the swatch on the theme card
  The crystal itself always keeps its map colour.
*/
G.data.themes = [
  { id: 'amethyst', name: '기본 자수정', en: 'AMETHYST', price: 0, css: '', bg: { hue: null, s: 45, l: 7 }, ambient: 'dust',
    desc: '처음부터 함께한 보랏빛 광산', preview: ['#07060c', '#a970ff', '#241640'] },
  /* ---- achievement themes: never sold - unlocked by doing something. js/settings.js checks
     unlock.test(state) and, the moment it passes, hands the theme over with an unlock banner ---- */
  { id: 'divine', name: 'THE DIVINE', en: 'THE DIVINE', price: 0, css: 'divine', bg: { hue: 24, s: 75, l: 5 }, ambient: 'divine',
    unlock: { label: '1억 이상 광물 발견', test: s => foundOver(s, 1e8) },
    desc: '신의 빛이 내려앉은 광산 · 타오르는 성환과 쏟아지는 빛줄기', preview: ['#0a0401', '#ff8a1e', '#3a1806'] },
  { id: 'sovereign', name: 'THE SOVEREIGN', en: 'THE SOVEREIGN', price: 0, css: 'sovereign', bg: { hue: 42, s: 35, l: 4 }, ambient: 'sovereign',
    unlock: { label: '10억 이상 광물 발견', test: s => foundOver(s, 1e9) },
    desc: '황제의 옥좌 · 루비 박힌 황금 모서리와 아르데코 광채, 월계관 아래 내리는 금가루', preview: ['#060402', '#f3c64e', '#2a1c06'] },
  { id: 'empyrean', name: 'THE EMPYREAN', en: 'THE EMPYREAN', price: 0, css: 'empyrean', bg: { hue: 222, s: 60, l: 4 }, ambient: 'empyrean',
    unlock: { label: '100억 이상 광물 발견', test: s => foundOver(s, 1e10) },
    desc: '하늘 위의 옥좌 · 사파이어와 백금의 모서리, 오로라와 별똥별, 룬이 새겨진 성환', preview: ['#02040c', '#7fb8ff', '#0c1c44'] },
  { id: 'verdant', name: 'THE VERDANT', en: 'THE VERDANT', price: 0, css: 'verdant', bg: { hue: 145, s: 55, l: 4 }, ambient: 'verdant',
    unlock: { label: '1000억 이상 광물 발견', test: s => foundOver(s, 1e11) },
    desc: '태고의 숲의 왕좌 · 에메랄드 모서리와 덩굴, 크리스탈을 감은 비취 우로보로스, 퍼져나가는 생명의 파동', preview: ['#020a05', '#3ee38a', '#0a2a14'] },
  { id: 'crimson', name: 'THE CRIMSON', en: 'THE CRIMSON', price: 0, css: 'crimson', bg: { hue: 356, s: 70, l: 4 }, ambient: 'crimson',
    unlock: { label: '1조 이상 광물 발견', test: s => foundOver(s, 1e12) },
    desc: '피의 달 아래 폭군의 옥좌 · 뿔 달린 루비 모서리, 가시 성환과 붉은 번개, 심장처럼 뛰는 화면', preview: ['#0c0102', '#ff2a3a', '#3a0408'] },
  { id: 'infinite', name: 'THE INFINITE', en: 'THE INFINITE', price: 0, css: 'infinite', bg: { hue: 255, s: 35, l: 3 }, ambient: 'infinite',
    unlock: { label: '1000조 이상 광물 발견', test: s => foundOver(s, 1e15) },
    desc: '시간의 끝, 무한의 옥좌 · 크리스탈을 삼킨 블랙홀과 천체 시계, 프리즘으로 타오르는 ∞', preview: ['#030306', '#e6e6ff', '#16162a'] },
  { id: 'origin', name: 'THE ORIGIN', en: 'THE ORIGIN', price: 0, css: 'origin', bg: { hue: 250, s: 40, l: 3 }, ambient: 'origin',
    unlock: { label: '1경 이상 광물 발견', test: s => foundOver(s, 1e16) },
    desc: '모든 것이 시작된 곳 · 3D로 도는 신성기하학, 황금 나선으로 빨려드는 빛, 주기적인 빅뱅', preview: ['#04030a', '#fff1c4', '#1c1830'] },
  /* ---- discovery themes: not a rarity floor but a particular kind of find ---- */
  { id: 'unseen', name: 'THE UNSEEN', en: 'THE UNSEEN', price: 0, css: 'unseen', bg: { hue: 0, s: 0, l: 1 }, ambient: 'unseen',
    unlock: { label: '시크릿 광물 발견', test: s => foundTier(s, 'secret') },
    desc: '보이지 않는 것들이 보고 있다 · 어둠 속에서 뜨는 눈, 동공이 된 크리스탈, 깜빡이는 화면', preview: ['#000000', '#d8d8d8', '#141414'] },
];
// has a mineral of this tier key (G.tiers[].key) ever been found
function foundTier(s, key) {
  for (const id in s.codex) { const c = s.codex[id], n = typeof c === 'number' ? c : c && c.n, d = G.cutscenes.byId[id]; if (n > 0 && d && G.tiers[d.tierIdx] && G.tiers[d.tierIdx].key === key) return true; }
  return false;
}
// has any mineral at least this rare ever been found (codex entries are { n, ... })
function foundOver(s, odds) {
  for (const id in s.codex) { const c = s.codex[id], n = typeof c === 'number' ? c : c && c.n, d = G.cutscenes.byId[id]; if (n > 0 && d && d.odds >= odds) return true; }
  return false;
}
G.theme = () => G.data.themes.find(t => t.id === (G.state && G.state.theme)) || G.data.themes[0];
