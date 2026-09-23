/*
  PROMO EVENT - the small banner button in the top bar + its popup (js/event.js renders it).

  Set G.data.event = null to hide the banner entirely between events (no other code needs to
  change). To swap in a new event later, just replace the object below:
    id         : unique key, used to remember "already redeemed" per player (js/core/state.js)
    theme      : 'exam' renders the body as a math-exam paper (question number, points, answer
                 blank styled like a Korean 모의고사). Omit for the plain banner/body/link layout.
    teaser     : short text on the top-bar button
    title/body : shown when the popup opens (body may contain \n for line breaks)
    problem    : (exam theme only) the question itself, as HTML - sup/sub tags are fine
    points     : (exam theme only) small "[N점]" style label
    linkLabel/linkUrl : optional "go play it" button that opens in a new tab
    codeLabel  : placeholder text on the answer/code input
    codes      : an allow-list of correct answers/codes, matched trimmed + case-insensitively.
                 Since this is a static site with no backend, nothing can be verified against a
                 server - for a fixed-answer problem like this one, just list the accepted answer
                 (and any equivalent ways of writing it). For a real per-player code system, set
                 `validate: (code) => boolean` instead - it's checked first if present.
    reward     : the crystal item granted on a correct answer (pushed into G.data.potions below).
                 `guarantee: N` makes it force a mineral of tier index N or higher (see G.tiers in
                 js/core/util.js - 6 = DIVINE / "1억대") on the player's next click, instead of the
                 usual `luck` number. It can only ever be redeemed once per player (js/core/state.js).
*/
G.data.event = {
  id: 'eulerexam',
  theme: 'exam',
  teaser: '수학 시험',
  title: '오일러의 시험',
  body: '아래 문제를 풀어 정답을 입력하면, 1억대 이상 컷신이 100% 확정으로 뜨는 특별한 크리스탈을 드립니다.\n\n1인당 1개까지만 받을 수 있습니다.',
  points: '[4점]',
  problem: '오일러의 공식 <i>e<sup>iθ</sup> = cos&thinsp;θ + i·sin&thinsp;θ</i> 를 이용하여, 두 복소수<br>' +
    '<b>z₁ = e<sup>iπ/3</sup>,&nbsp;&nbsp; z₂ = e<sup>iπ/4</sup></b><br>' +
    '에 대하여 <b>z₁¹² · z₂⁸</b> 의 값을 구하시오.',
  meta: '예상 정답률 1 / 999,999,999',
  codeLabel: '정답 입력',
  codes: ['1'],
  reward: { id: 'euler', name: '오일러의 크리스탈', en: "EULER'S CRYSTAL", hue: 258, guarantee: 6 },
};

if (G.data.event && G.data.event.reward) G.data.potions.push(G.data.event.reward);
