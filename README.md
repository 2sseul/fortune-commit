# 🥠 fortune-commit

GitHub README에 붙이는 **오늘의 개발자 운세 포춘쿠키** 위젯입니다.
터미널 창 안의 픽셀 포춘쿠키를 누르면 쿠키가 갈라지면서 오늘의 운세가 나와요.

[![오늘의 운세](https://fortune-commit.vercel.app/api?user=2sseul)](https://fortune-commit.vercel.app)

- **커밋하고 열기**: 오늘 GitHub에 기여(커밋, PR, 이슈, 리뷰 등)를 하기 전에는 쿠키가 잠겨 있고, 기여하면 쿠키가 갈라지며 오늘의 운세가 나와요
- 같은 사람은 하루 종일 같은 운세, 사람마다 다른 운세 (GitHub 아이디 + 날짜로 결정)
- 매일 한국 시간 자정에 새 운세
- 한국어 / English, 다크 / 라이트 테마
- 설치는 이미지 한 줄 붙여넣기

## 사용 방법

아래 한 줄을 README에 붙여 넣고, `YOUR_GITHUB_ID`를 본인 GitHub 아이디로 바꾸세요. (아래 자동 전환 버전은 두 군데)
위젯을 누르면 fortune-commit 소개 페이지가 열려요.

```md
[![오늘의 운세](https://fortune-commit.vercel.app/api?user=YOUR_GITHUB_ID)](https://fortune-commit.vercel.app)
```

### 다크/라이트 모드 자동 전환 (추천)

GitHub를 다크 모드로 보는 사람에게는 다크 터미널, 라이트 모드로 보는 사람에게는 라이트 터미널을 보여줍니다.

```html
<a href="https://fortune-commit.vercel.app">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://fortune-commit.vercel.app/api?user=YOUR_GITHUB_ID&theme=dark">
    <img src="https://fortune-commit.vercel.app/api?user=YOUR_GITHUB_ID&theme=light" alt="오늘의 운세">
  </picture>
</a>
```

### 이렇게 보여요

| 오늘 기여 전 | 오늘 기여 후 |
|---|---|
| 안 열린 쿠키 + `오늘 커밋하면 열려요` | 쿠키가 갈라지며 오늘의 운세와 행운 아이템 |

- 위젯을 다는 커밋도 오늘의 기여로 세져서, **첫날은 바로 열려 있어요.** 다음 날부터는 커밋해야 열립니다.
- 커밋 후 열리기까지 몇 분 걸릴 수 있어요. (GitHub가 기여를 반영하는 시간 + 이미지 캐시 5분)
- 쿠키를 여는 '오늘 활동'은 **한국 시간 0시부터의 공개 활동**(push, PR·이슈 열기, 코드 리뷰, 새 저장소)으로 세요. 비공개 저장소 활동으로는 열리지 않아요. (GitHub 잔디는 UTC 날짜로 기록돼서, 한국 0시를 정확히 맞추려고 활동 시각이 남는 공개 이벤트를 써요)
- `user`를 빼면 잠금 없이 모두에게 같은 '그날의 공통 운세'가 나옵니다.

다른 테마와 언어 예시는 **[예시 갤러리](https://fortune-commit.vercel.app)** 에서 보고 바로 복사할 수 있어요.

## 🍪 쿠키 스킨 모으기

GitHub 활동으로 업적을 달성하면 새로운 쿠키 스킨이 해금돼요.

- **추천: [도감](https://fortune-commit.vercel.app/collection.html)에서 GitHub로 로그인**하고 해금한 스킨을 장착하세요. README를 고치지 않아도 위젯에 바로 적용되고, 장착 설정은 README의 `skin=`보다 항상 우선해요. 저장하는 건 GitHub 아이디와 장착한 스킨뿐이에요.
- 로그인 없이 쓰려면 [스킨 고르기 페이지](https://fortune-commit.vercel.app/skins.html)에서 고른 스킨이 들어간 코드를 복사해 README에 붙여도 돼요.

| 스킨 | `skin=` | 해금 조건 (올해, 기준 시간대) |
|---|---|---|
| 기본 쿠키 | `plain` | 처음부터 |
| 초코 쿠키 | `choco` | 기여 50개 |
| 말차 쿠키 | `matcha` | 기여 150개 |
| 황금 쿠키 | `gold` | 7일 연속 기여 |
| 고양이 쿠키 | `cat` | 커밋 100개 |
| 강아지 쿠키 | `dog` | PR 10개 |
| 토끼 쿠키 | `rabbit` | 코드 리뷰 10개 |
| 호박 쿠키 | `pumpkin` | 10월에 기여 10개 |
| 눈사람 쿠키 | `snowman` | 12월에 기여 10개 |
| 사슴 쿠키 | `deer` | 12월에 기여 30개 |
| 산타 쿠키 | `santa` | 12월 25일(크리스마스)에 기여 |

- 해금 전에는 기본 쿠키와 진행 상황(예: `skin = "cat 37/100 commits"`)이 보이고, 조건을 채우면 자동으로 그 스킨으로 바뀌어요.
- 해금은 매년 1월 1일에 새로 시작합니다.
- 스킨 그림은 모두 오리지널이에요. 디자인 원본은 [`img/`](img/)에 있어요.

## 옵션

주소 뒤에 `&이름=값` 으로 붙입니다. 예: `...api?user=octocat&lang=en&theme=light`

| 옵션 | 설명 | 값 | 기본값 |
|---|---|---|---|
| `user` | GitHub 아이디. 아이디 + 날짜로 그날의 운세가 정해져요 | 아이디 | 없음 (모두에게 같은 공통 운세) |
| `lang` | 운세 언어 | `ko`, `en` | `ko` |
| `theme` | 터미널 색 | `dark`, `light` | `dark` |
| `tz` | 하루가 바뀌는 기준 시간대 | `Asia/Seoul`, `UTC`, `America/New_York` 등 | `Asia/Seoul` |
| `width` | 위젯 너비(px) | `400` ~ `800` | `495` |
| `radius` | 모서리 둥글기(px) | `0` ~ `30` | `10` |
| `hide_border` | 테두리 숨기기 | `true`, `false` | `false` |
| `skin` | 쿠키 스킨 (위 표 참고, 해금해야 적용) | `plain`, `choco`, `cat` 등 11종 | `plain` |
| `preview` | (테스트용) 기여 수와 상관없이 잠긴/열린 화면 보기 | `locked`, `open` | 없음 (실제 기여 수로 결정) |

잘못된 값을 넣어도 위젯이 깨지지 않아요. 숫자가 아니면 기본값, 범위를 벗어나면 가장 가까운 값을 씁니다.

## 이렇게 동작해요

- README에서는 JavaScript가 실행되지 않아서, 위젯은 서버(Vercel)가 그때그때 만들어 주는 **SVG 이미지**입니다.
- 쿠키가 갈라지는 움직임은 SVG 안의 **CSS 애니메이션**이에요.
- 위젯을 불러올 때마다 서버가 **GitHub GraphQL API**로 오늘 기여 수를 확인해서, 0개면 잠긴 쿠키를 보여줍니다. 확인에 실패하면 위젯이 깨지지 않도록 운세를 그대로 보여줘요.
- 운세는 난수가 아니라 `아이디 + 날짜`의 해시로 고르기 때문에, 언제 열어도 그날은 같은 운세가 나옵니다.
- 그림 파일 없이 쿠키도 코드(픽셀 지도)로 그립니다. → [`src/cookie.js`](src/cookie.js)

## 직접 실행해 보기

Node.js 22 이상이 필요합니다. '커밋하고 열기'를 로컬에서 확인하려면 `.env.local`에 `GITHUB_TOKEN=...`을 넣으세요. (토큰이 없으면 잠금 없이 운세가 바로 나와요)

```bash
npm run dev   # http://localhost:3000 (갤러리), http://localhost:3000/api?user=octocat (위젯)
npm test      # 자동 테스트
```

| 파일 | 하는 일 |
|---|---|
| `api/index.js` | `/api` 주소에서 위젯 SVG를 돌려줌 (Vercel 서버리스 함수) |
| `src/render.js` | 터미널 창, 쿠키, 운세, 애니메이션을 SVG로 그림 |
| `src/cookie.js` | 픽셀 쿠키 그림 (안 열린 / 열린 쿠키) |
| `src/skins.js` | 쿠키 스킨 11종 (색, 귀·모자 같은 장식) |
| `src/unlocks.js` | 스킨 해금 규칙 |
| `src/fortunes.js` | 운세 문구 (한국어·영어 105개씩) |
| `src/lucky.js` | 행운 아이템 후보 (상태코드, 단축키, 언어, 명령어) |
| `src/pick.js` | 오늘 날짜 계산, 운세 고르기 |
| `src/options.js` | 주소 옵션 검사 |
| `src/github.js` | GitHub API로 오늘 기여 수 확인 |
| `public/index.html` | 예시 갤러리 페이지 |
| `public/skins.html` | 스킨 고르기 페이지 |
| `public/collection.html` | 도감 (로그인, 해금 현황, 장착) |
| `api/me.js`, `api/auth/*.js` | 도감 정보·장착, GitHub 로그인 |
| `src/session.js`, `src/store.js` | 로그인 쿠키, DB(Redis) 읽기/쓰기 |

기획 문서는 [`PRD.md`](PRD.md), 작업 계획과 변경 기록은 [`TODO.md`](TODO.md)에 있어요.
