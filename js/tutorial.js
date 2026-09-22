/* AMETHYST - first-launch tutorial. A short walkthrough ending in a one-off practice potion (LUCK +50). */
G.data.tutorialSteps = [
  { title: '환영합니다', body: '아메시스트에 오신 것을 환영합니다. 이 설명을 닫으면, 화면 아무 곳이나 탭해서 크리스탈을 채굴할 수 있습니다.' },
  { title: '상점', body: '위쪽 상점 탭에서 음식을 사 먹으면 일정 시간 동안 행운(LUCK)이 올라갑니다. 행운이 높을수록 컷신이 잘 터집니다.' },
  { title: '지도', body: '지도 탭에서 다른 지역으로 이동할 수 있습니다. 지역마다 코인 배율과 등장하는 컷신이 완전히 다릅니다.' },
  { title: '강화', body: '강화 탭에서는 코인으로 곡괭이, 치명타, 자동 채굴 같은 능력을 영구히 올릴 수 있습니다.' },
  { title: '도감', body: '컷신을 한 번 보면 도감에 기록됩니다. 이미 본 컷신은 "그만 보기"로 재생을 끄고 보상만 받을 수 있습니다.' },
  { title: '크리스탈', body: '코인을 크리스탈로 교환해 물약 상자를 살 수 있습니다. 물약은 마시면 다음 클릭 한 번에 큰 행운을 몰아줍니다.' },
  { title: '설정', body: '오른쪽 위 톱니바퀴에서 컷신 표시 방식, 알림 스타일 등을 취향대로 바꿀 수 있습니다.' },
  { title: '준비 완료', body: '연습용으로 견습생의 물약(LUCK +50)을 하나 드립니다. 크리스탈 탭에서 마셔보세요. 이 물약은 상자에서는 절대 나오지 않는 튜토리얼 전용입니다.' },
];
/* shown instead of the last step's body/button once the potion has already been handed out once */
const REPLAY_LAST = { title: '준비 완료', body: '여기까지가 튜토리얼입니다. 견습생의 물약은 처음 한 번만 지급되기 때문에, 다시 드리지는 않습니다.' };

(() => {
  const el = document.getElementById('tutorial');
  if (!el) return;
  let step = 0;

  function paint() {
    const steps = G.data.tutorialSteps, last = step === steps.length - 1;
    const s = (last && G.state.tutorialPotionGiven) ? REPLAY_LAST : steps[step];
    el.innerHTML = `<div class="scrim"></div>
      <div class="tcard bevel">
        <div class="step">STEP ${step + 1} / ${steps.length}</div>
        <h3>${s.title}</h3>
        <p>${s.body}</p>
        <div class="row">
          <div class="dots">${steps.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
          <div class="btns">
            ${step === 0 ? `<button class="buy bevel small skipbtn" data-tskip>건너뛰기</button>` : ''}
            <button class="buy bevel" data-tnext><span>${last ? (G.state.tutorialPotionGiven ? '닫기' : '물약 받기') : '다음'}</span></button>
          </div>
        </div>
      </div>`;
  }

  function open() {
    step = 0; el.hidden = false; paint();
    requestAnimationFrame(() => el.classList.add('show'));
  }
  function close() {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 320);
  }

  el.addEventListener('click', ev => {
    G.audio.init();
    if (ev.target.closest('[data-tnext]')) {
      G.audio.tab();
      G.act.tutorialNext();
      if (G.state.tutorialDone) { close(); return; }
      step++; paint();
    } else if (ev.target.closest('[data-tskip]')) {
      G.audio.tab(); G.act.tutorialSkip(); close();
    }
  });

  G.on('tutorial:start', open);
  // tutorial.js loads after game.js, so by now G.state is already loaded - no need to wait for a 'ready' event
  if (!G.state.tutorialDone) open();
})();
