/*
  PROMO EVENT - the small banner button in the top bar + its code-redemption popup.

  Set G.data.event = null to hide the banner entirely between events (no other code needs to
  change). To swap in a new event later, just replace the object below:
    id         : unique key, used to remember "already redeemed" per player (js/core/state.js)
    teaser     : short text on the top-bar button
    title/body : shown when the popup opens (body may contain \n for line breaks)
    linkLabel/linkUrl : the "go play it" button - opens in a new tab
    codeLabel  : placeholder text on the code input
    codes      : an allow-list of valid codes, matched trimmed + case-insensitively. Since this is
                 a static site with no backend, codes can't be verified against another server -
                 add whatever codes you hand out (or generate) to this array as you go.
                 For anything fancier (per-player codes, a real API check, etc.) set
                 `validate: (code) => boolean` instead - it's checked first if present.
    reward     : the crystal item granted on a correct code (pushed into G.data.potions below).
                 `guarantee: N` makes it force a mineral of tier index N or higher (see G.tiers in
                 js/core/util.js - 6 = DIVINE / "1억대") on the player's next click, instead of the
                 usual `luck` number. It can only ever be redeemed once per player (js/core/state.js).
*/
G.data.event = {
  id: 'hodumaroo',
  teaser: '호두마루 이벤트',
  title: '호두마루 이벤트',
  body: '호두마루 게임에서 일일 퀘스트를 모두 완료하면 코드를 받을 수 있습니다.\n\n아래 버튼으로 호두마루에 입장해 코드를 받아온 뒤, 이 창에 입력하면 1억대 이상 컷신이 100% 확정으로 뜨는 특별한 크리스탈을 드립니다.\n\n1인당 1개까지만 받을 수 있습니다.',
  linkLabel: '호두마루 입장하기',
  linkUrl: 'https://github.io/hodumaroo',
  codeLabel: '호두마루에서 받은 코드 입력',
  codes: [],   // add valid codes here as you hand them out, e.g. ['HODU-7F3K']
  reward: { id: 'hodumaroo', name: '호두마루의 크리스탈', en: 'HODUMAROO CRYSTAL', hue: 132, guarantee: 6 },
};

if (G.data.event && G.data.event.reward) G.data.potions.push(G.data.event.reward);
