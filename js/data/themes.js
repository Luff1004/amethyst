/*
  GAME THEMES (설정 - 테마). Bought once with crystals, then switchable any time.
  css      : html[data-theme] palette in css/style.css (none for the default)
  bg       : the mining screen behind the crystal (js/game.js drawBackground)
             hue = fixed hue for the backdrop (null keeps each map's own hue), s/l = its saturation / lightness
  ambient  : the drifting effect over the backdrop: dust (default) / bubbles / petals / embers / fireflies / gold
  preview  : colours for the swatch on the theme card
  The crystal itself always keeps its map colour.
*/
G.data.themes = [
  { id: 'amethyst', name: '기본 자수정', en: 'AMETHYST', price: 0, css: '', bg: { hue: null, s: 45, l: 7 }, ambient: 'dust',
    desc: '처음부터 함께한 보랏빛 광산', preview: ['#07060c', '#a970ff', '#241640'] },
  { id: 'sea', name: '심해', en: 'DEEP SEA', price: 200000, css: 'sea', bg: { hue: 205, s: 60, l: 7 }, ambient: 'bubbles',
    desc: '햇빛이 닿지 않는 바다 밑 · 떠오르는 물방울', preview: ['#03090f', '#3fc8ff', '#0c2c44'] },
  { id: 'sakura', name: '벚꽃', en: 'SAKURA', price: 400000, css: 'sakura', bg: { hue: 335, s: 45, l: 7 }, ambient: 'petals',
    desc: '밤 벚꽃 아래 · 흩날리는 꽃잎', preview: ['#0e060a', '#ff7ab4', '#3e1428'] },
  { id: 'sunset', name: '황혼', en: 'SUNSET', price: 600000, css: 'sunset', bg: { hue: 18, s: 60, l: 7 }, ambient: 'embers',
    desc: '저물어 가는 붉은 하늘 · 피어오르는 불씨', preview: ['#0e0604', '#ff8a3a', '#42180c'] },
  { id: 'emerald', name: '에메랄드 숲', en: 'EMERALD FOREST', price: 800000, css: 'emerald', bg: { hue: 150, s: 55, l: 6 }, ambient: 'fireflies',
    desc: '깊은 숲속의 밤 · 떠다니는 반딧불이', preview: ['#030b07', '#3ee39a', '#0e3222'] },
  { id: 'royal', name: '황제', en: 'ROYAL GOLD', price: 1000000, css: 'royal', bg: { hue: 42, s: 30, l: 5 }, ambient: 'gold',
    desc: '검은 비단과 황금 · 반짝이는 금가루', preview: ['#050403', '#e8c05a', '#2c220e'] },
];
G.theme = () => G.data.themes.find(t => t.id === (G.state && G.state.theme)) || G.data.themes[0];
