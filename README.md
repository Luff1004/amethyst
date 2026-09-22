# AMETHYST

화면 전체가 게임인 확률형 채굴 게임. `index.html`을 열면 바로 실행됩니다 (모바일 세로 / PC 모두 지원).

## 검토 모드 (도감 전체 해금)
`js/config.js`의 `unlockCodex: true` 이면 도감에 모든 컷신이 열려 있고 `보기` 로 다시 볼 수 있습니다.
검토가 끝나면 `false` 로 바꾸면 원래대로 (못 뽑은 컷신은 `???`) 돌아갑니다.

## 컷신 규칙
- 컷신 = 광물 하나. 한 컷신은 한 지도에만 등장합니다 (`zone`). 도감은 지도별 / 등급별로 나뉩니다.
- **처음 보는 컷신은 건너뛸 수 없고**, `그만 보기` 도 이미 본 컷신에만 나옵니다.
- 이미 본 컷신은 탭하면 이름 공개 장면으로 건너뛰고, `그만 보기` 를 누르면 재생 없이 보상 배너만 뜹니다.
- 등급: 10만대 EPIC / 100만대 LEGENDARY / 1000만대 MYTHIC / 1억대 DIVINE / 10억대 TRANSCENDENT / 시크릿

## 컷신 만들기 (10만~1억대: `cine` 템플릿)
`js/cutscenes/map0-base.js` 가 예시입니다. 다음 지도는 파일을 복사해 `ZONE` 을 바꾸고 `index.html` 에 `<script>` 를 추가하세요.

```js
R(1800000, 'alexandrite', '알렉산드라이트', 350, {   // odds, id, 이름, 색상각도
  env: 'temple', envHue: 200,                         // 배경 세계
  hero: B(350, { shift: 150 }),                       // 광물 (3D 모델)
  entry: 'unveil', finale: 'sweep',                   // 등장 방식, 마무리 연출
  fx: ['dust', 'stars'], cam: 'push',                 // 분위기 이펙트, 카메라
});
```
- env: cave mountain space ocean forge ice void forest temple storm desert aurora abyss sanctum cyber clockwork arcane
- hero.k: prism spire cluster brilliant cube octa rhomb nugget shard plates twin star orb(kind: opal moon amber planet swirl pearl lapis)
  - `h` 색상, `s` 채도, `l` 밝기, `trans` 투명도, `size`, `shift` 색 변화, `faces` 면별 색, `hatch` 줄무늬
- entry: rise drop emerge geode orbit unveil forge lightning ignite tide
- finale: nova pulse beam shatter bloom quake sweep implode
- fx: sparks embers snow fireflies petals rain bubbles dust sand feathers runes orbit arcs leaves stars
- 1억대(DIVINE) 이상은 자동으로 더 길고 웅장한 연출(후광, 렌즈플레어, 궤도 파편 등)이 붙습니다.
- 직접 그리려면 `template: 'cine'` 대신 `draw(g, e)` 를 넣으세요 (`ultra.js` 참고, 옵션은 `engine.js` 상단).
- 자막은 `captions: [{ a: 0.1, b: 0.3, ko: '...', en: '...' }]`.

## 효과음
컷신마다 사운드 레시피가 따로 있고, 안 적으면 배경/등장/마무리에 맞춰 자동으로 골라집니다 (`js/core/sfx.js`).
직접 지정: `snd: 'rise:clang hit:anvil tail:echo amb:fire root:196 scale:phrygian'`
- rise(빌드업): shimmer whoosh choir rumble engine drone clang static crackle water ticks wind glass strings heart bowed bellsrise arpeggio swarm tidal gravity chant granular hum drums breath crystalline
- hit(등장 순간): boom gong bell glass zap choirstab crash whomp anvil splash ignite harp horn cathedral quake taiko organ laser celesta synthstab bowl thunder chimes roar orchestra toll
- tail(여운): bells pad sparkle arp echo musicbox piano chime choirpad pluck none / amb(환경음): drip wind fire water space forest rain machine whisper sea choirdrone none

## 테스트 (브라우저 콘솔)
`G.debug.play('id')` 보상 없이 재생 / `G.debug.trigger('id')` 보상 포함 / `G.debug.seek('id', 0.8)` 특정 진행도에서 정지

## 데이터 파일
- `js/data/zones.js` 지도 (균열 소리 `snd` 포함) / `js/data/foods.js` 상점 음식 / `js/data/upgrades.js` 강화

## 크리스탈 / 물약 상자 / 자동 클릭
- 상점의 **교환** 버튼: 1,000,000 코인 = 1 크리스탈 (`js/data/potions.js` 의 `exchange.rate`)
- **물약은 상점에서 살 수 없습니다.** 크리스탈 탭의 **물약 상자**를 사면 1개 = 물약 1개가 나오고, 어떤 물약이 나올지는 확률입니다.
  | 상자 | 가격 | 주로 나오는 물약 |
  |---|---|---|
  | 일반 | 3,000 | 불씨 60% / 이슬 28% ... 용의 정수 0.5% |
  | 레어 | 12,000 | 이슬 34% / 불씨 30% ... 별의 눈물 0.5% |
  | 에픽 | 45,000 | 월광 30% / 황금 24% ... 심연의 성수 1% |
  | 델타 | 200,000 | 용의 정수 28% / 황금 24% ... 창세의 물약 0.5% |
  | 울트라 | 1,000,000 | 별의 눈물 30% / 용의 정수 22% / 심연 22% ... 창세의 물약 3% |
  (정확한 확률은 게임 안 상자 카드에 표시됩니다. `js/data/potions.js` 의 `boxes` 에서 가격/확률 수정)
- 물약 9종: 마시면 *다음 수동 클릭 한 번*에만 럭이 더해집니다 (불씨 +2,500 ... 창세 +50B, 자동 채굴은 물약을 쓰지 않음, 확률 상한 90%).
  각 물약 카드에 현재 지역 기준 `10만대+ / 1억대+ / 10억대+` 등장 확률이 표시됩니다.
- 상단 **AUTO** 버튼으로 자동 클릭을 멈추거나 다시 켭니다.
- 코인 보상 이펙트는 작은 코인 수십 개 대신 **K/M/B 라벨이 붙은 굵은 코인 몇 개**로 묶여 날아갑니다 (렉 방지).

## 10억대 이상
- 컷신 시작 전 약 1.8초 **암전** (블랙아웃 + 낮은 울림) 후 시작합니다.
- 주인공은 **각진 입체 도형만** 씁니다 (20각형 첨탑 / 쌍둥이 결정 / 정팔면체 등) - 둥근 오브·보석은 절대 안 씀 (눈동자처럼 보이는 걸 피하려고).
  거기에 **와이어프레임 다면체 2겹 + 육망성 만다라**가 항상 겹쳐서 돕니다 (`Cine.wireframe` / `Cine.mandala`, `js/cutscenes/cine-lib.js`).
- 자막은 마지막에 **세로쓰기 한자 타이틀 카드**(`v:true`)가 한 번 크게 뜹니다 - 배경이 아무리 밝아도 보이도록 검은 배경판이 자동으로 깔려요.
- 지도 0 10억대 3종은 `js/cutscenes/transcend.js` (직접 그림 + 자막), 시크릿은 `ultra.js`.
- 지도 1 10억대 4종 / 지도 2 10억대 5종은 각 맵 파일 맨 아래 (cine 템플릿 + 세로 한자 자막), 시크릿은 `ultra2.js` / `ultra3.js`.

## 자막 (모든 컷신 공통)
`js/cutscenes/engine.js`의 `glitchCaption`(가로, 기본) / `glitchCaptionVertical`(세로, `v:true`)이 그립니다. 색도 없고 한글 번역도 안 뜨고, `en` 한 줄만 지지직거리며 나옵니다.
```js
captions: [
  { a: .04, b: .24, en: 'HORIZONTAL LINE' },                                   // 기본: 큰 세리프체, 화면 아래
  { a: .66, b: 1.4, en: '永光', v: true, size: 44, x: .84, y: .4, font: '...' }, // 세로: 글자 하나씩 아래로, 한자 추천
]
```

## 지도

| # | 이름 | 재질 테마 | 컷신 수 | 파일 |
|---|---|---|---|---|
| 0 | 지표 채석장 | 보석 / 크리스탈 | 80 | `map0-base.js` + `ultra.js` + `transcend.js` |
| 1 | 심층 광맥 | 광석 / 금속 / 심층암 | 95 | `map1-vein.js` + `ultra2.js` |
| 2 | 수정 동굴 | 발광 / 빙정 / 프리즘 | 113 | `map2-cavern.js` + `ultra3.js` |

한 지도는 이전 지도보다 컷신이 약 1.2배 많고, 재질 테마가 서로 겹치지 않게 완전히 새 이름으로 짓습니다.
다음 지도(3: 용융 핵)는 `map2-cavern.js`를 복사해서 `ZONE`과 이름 목록만 바꾸면 됩니다 (`combo()` 함수가 배경/등장/마무리/이펙트 조합을 자동으로 섞어줍니다).
