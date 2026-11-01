---
name: figma-to-site
description: Figma에서 확정한 fortune-commit 사이트 화면(메인·상점·도감·진열대·운세 일기·순위표·오븐 등)을 Figma MCP로 읽어서 public/ 폴더의 HTML·CSS로 옮기는 절차. Figma 링크나 프레임 이름을 주며 "이 화면 구현해 줘", "피그마대로 바꿔 줘", "디자인 반영해 줘"라고 할 때, 사이트 페이지를 새로 만들거나 디자인을 바꾸는데 Figma 파일이 있을 때 반드시 사용한다. README 위젯(SVG)은 대상이 아니다.
---

# figma-to-site

v3에서는 사이트 디자인을 Figma에서 먼저 확정하고 코드로 옮긴다. v2 때 코드에서 디자인을 여러 번 갈아엎었던 것을 줄이려는 결정이다. 그러니 이 스킬의 목표는 **Figma와 똑같이 보이는 것**, 그리고 **기존 사이트 구조를 망가뜨리지 않는 것** 두 가지다. 페이지가 여러 개라 매번 같은 방식으로 옮겨야 사이트 전체가 한 디자인처럼 보인다.

## 이 사이트의 구조 (먼저 알아 둘 것)

- 빌드 도구와 프레임워크가 없다. `public/*.html`에 HTML과 페이지 전용 `<style>`이 있고, 공통 스타일은 `public/site.css`, 공통 동작은 `public/site.js`다.
- **위쪽 막대·아래 탭 막대·푸터는 `site.js`가 만든다.** 페이지에는 `<header id="topnav"></header>`, `<footer id="footer"></footer>`만 두고 `setupHeader()`를 부른다. 메뉴를 바꾸려면 `site.js`의 `MENU` 하나만 고친다.
- 디자인 토큰은 `site.css`의 `:root` 변수이고, **이름과 값이 Figma 변수와 같다**: `--bg`, `--paper`, `--dough`, `--line`, `--text`, `--text-2`, `--muted`, `--caramel`, `--caramel-dark`, `--berry`, `--blush`, `--butter`, `--mint`, `--sky`, `--sky-tint`, `--purple`, `--night`, 3D 아래쪽 색 `--lip-*`, 둥글기 `--r-sm/md/lg/pill`, 글꼴 `--title`(Jua) `--body`(Noto Sans KR) `--note`(Gaegu) `--number`(Nunito) `--mono`.
- 공통 컴포넌트 클래스 (Figma 컴포넌트 ↔ 코드):
  | Figma | 코드 |
  |---|---|
  | Button (Primary/Secondary/Accent) | `.btn`, `.btn.secondary`, `.btn.mint/.sky/.purple` |
  | 카드 | `.card` (테두리 2px + 아래 4px), `.card.sky/.purple/.butter` |
  | Tag | `.tag`, `.tag.sky/.caramel/.purple` |
  | StatChip | `statChip()` (site.js), `.stat` |
  | ProgressBar | `progressBar()` (site.js), `.progress` |
  | CookieCard / ShopItemCard / CollectionCard | `.cookie-card` (무대 → 이름 → 설명 → `.slot` 44px) + `.cookie-grid` |
  | 분류 탭 | `.pills` |
  | TopNav / MobileTopBar, MobileTabBar | `site.js`가 만드는 `.topnav`, `.tabbar` |
  | RightPanel | `renderSidePanel()` (site.js) + `.app` 레이아웃 |
- **쿠키 그림은 벡터 파일** `/cookies/<이름>.svg`, 목록은 `/cookies/catalog.json` (`loadCatalog()`, `cookieSrc()`). 이 파일들은 `node scripts/sync-cookies.mjs`가 `design/`에서 옮겨 온다. README 위젯 미리보기만 픽셀(`/cookies/pixel/<이름>.svg`, 진짜 위젯은 `/api?preview=open`).
- 일러스트(첫 화면 캐릭터, 이야기 3단계)는 Figma에서 PNG 2배로 내보내 `public/img/illust/*.webp`로 줄여 쓴다. (Figma SVG 내보내기는 바탕 프레임까지 따라와서 쓰지 않았다)
- 휴대폰 기준은 `@media (max-width: 760px)`, 태블릿(오른쪽 패널이 아래로)은 1024px. PC와 휴대폰 문구가 다르면 `.pc-only` / `.m-only`로 둘 다 넣는다 (Figma 모바일 프레임에서 좁은 화면용으로 줄을 다시 나눈 문구).

## 여백 규칙 (v3 디자인에서 정함, 코드도 똑같이)

| 규칙 | 값 |
|---|---|
| 카드 안쪽 여백 | 사방 16px |
| 카드 안 요소 사이 | 12px |
| 그리드 간격 | 16px |
| 쿠키 무대 | 높이 120px, 쿠키 높이 88px |
| 카드 맨 아래 요소 (버튼·배지·진행 막대 칸) | 높이 44px |
| 버튼·카드 테두리 | 2px + 아래쪽만 4px (듀오링고식 3D) |

카드는 상태가 달라도(구매/보유, 해금/잠김) 같은 구조(무대 → 이름 → 설명 → 44px 칸)를 쓴다. 설명은 말줄임(…)으로 자르지 않고 다 보여 준다(`word-break: keep-all`로 단어 중간에서 안 끊기게). 설명 길이가 달라도 같은 줄 카드는 높이가 같아지고, 44px 칸은 `margin-top: auto`로 맨 아래에 붙여 나란하게 한다.

## 1. Figma 읽기

Figma MCP 도구로 읽는다. (도구 이름은 연결된 서버에서 확인한다. 보통 디자인 내용·코드 힌트를 주는 도구, 변수(색·글꼴) 정의를 주는 도구, 스크린샷 도구가 있다.)

1. 옮길 프레임의 **스크린샷**을 먼저 받는다. 이게 정답 그림이다.
2. **변수(토큰)** 정의를 받아 `site.css`의 `:root`와 비교한다.
3. 프레임의 **디자인 내용**(배치, 간격, 글자 크기, 컴포넌트)을 받는다. PC 프레임과 모바일 프레임을 둘 다 읽는다.

Figma MCP가 React·Tailwind 코드를 주더라도 그대로 붙이지 않는다. 이 사이트는 순수 HTML·CSS라서, 구조와 숫자만 참고해 아래 규칙으로 다시 쓴다.

## 2. 옮기기 규칙

- **토큰 먼저**: Figma 색·글꼴이 기존 변수와 같으면 변수를 쓴다. (`#d9822b` → `var(--caramel)`) 새 색은 `:root`에 이름을 붙여 추가하고 한국어 주석으로 어디에 쓰는지 적는다. 색 값을 페이지 안에 직접 적지 않는다.
- **공통이면 site.css, 한 페이지만이면 그 페이지 `<style>`**: Figma에서 컴포넌트로 만든 것(카드, 버튼, 탭 막대, 쪽지)은 공통이다. 기존 클래스를 고쳐야 하면 다른 페이지가 깨지지 않는지 같이 확인한다.
- **그림**: Figma 일러스트는 SVG로 내보내 `public/img/`에 넣는다. (벡터라 어느 크기에서나 선명하고 가볍다) 너무 복잡해서 SVG가 무거우면(수백 KB 이상) webp로 내보낸다. 움직일 부분(조명, 김, 반죽이 눈)은 따로 레이어로 내보내 CSS로 움직인다.
- **쿠키는 그림으로 박지 않는다**: Figma에 그려진 쿠키는 실제 `/api/cookie?skin=...` 이미지로 바꾼다. 그래야 스킨이 바뀌거나 새로 생겨도 화면이 따라간다.
- **동작은 기존 것을 살린다**: 로그인 메뉴, 출석, 구매, 장착 같은 JS 동작과 API 호출은 그대로 두고 겉모습만 바꾼다. 화면 구조가 바뀌어 JS가 찾는 요소가 없어지지 않게 id·data 속성을 유지한다.
- **접근성**: 버튼은 `<button>`, 그림에는 `alt`, 장식용 그림은 `alt=""`. 움직임은 `prefers-reduced-motion`에서 멈춘다.
- 한국어 주석으로 섹션마다 무엇인지 적는다. (기존 코드처럼)

## 3. Figma와 비교하기

`npm run dev`를 켜고 브라우저(claude-in-chrome)로 연다. 개발 서버는 Redis·GitHub 토큰 없이도 돌아간다 (메모리 DB, 가짜 활동, `/api/auth/login`이 바로 `dev-cookie`로 로그인). 로그인 전/후 화면을 둘 다 본다.

1. PC 크기(1280px 이상)에서 섹션마다 스크린샷을 찍어 Figma 스크린샷과 나란히 비교한다: 간격, 글자 크기, 색, 정렬, 줄바꿈, 그림 위치.
2. **휴대폰은 여러 폭을 한 번에 본다.** 브라우저 창은 데스크톱 폭보다 줄어들지 않으므로, 페이지 안에 `<iframe>` 네 개(320·360·390·430px)를 띄우고 같은 위치로 스크롤해 한 장에 찍는다. 작은 휴대폰(320)부터 큰 휴대폰(430)까지 한 번에 깨진 곳을 찾을 수 있다.
3. 각 iframe에서 `document.documentElement.scrollWidth`가 폭과 같은지, 오른쪽으로 삐져나간 요소가 없는지 JS로 확인한다. (실제로 로그인 후 위쪽 막대가 360·390px에서 1px 넘쳤다)
4. 단어 중간이나 문장 중간에서 어색하게 줄이 바뀌는 곳은 휴대폰용 문구(`.m-only`)로 줄을 다시 나눈다.
5. 다른 점을 고치고 다시 찍는다. 큰 차이가 없어질 때까지 반복한다.

일부러 Figma와 다르게 만든 곳(Figma에 없는 상태 화면, 기술적으로 어려운 효과 등)은 이유와 함께 사용자에게 알린다.

## 4. 마무리

비교 스크린샷(Figma / 구현, PC / 모바일)을 사용자에게 보여주고 확인받는다. 그다음 `todo-log` 스킬로 체크·기록·커밋한다. Figma와 다르게 바꾼 것은 `[테스트 후 변경]`이나 `[수정]`으로 기록한다. 좋은 비교 스크린샷은 README에도 쓸 수 있으니 `img/`에 남길지 물어본다.
