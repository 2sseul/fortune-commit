# 🥠 fortune-commit

GitHub README에 붙이는 **오늘의 개발자 운세 포춘쿠키** 위젯입니다.
터미널 창 안의 픽셀 포춘쿠키를 누르면 쿠키가 갈라지면서 오늘의 운세가 나와요.

<details>
  <summary><img src="https://fortune-commit.vercel.app/api?user=2sseul&state=closed" alt="눌러서 오늘의 포춘쿠키 열기"></summary>
  <img src="https://fortune-commit.vercel.app/api?user=2sseul" alt="오늘의 운세">
</details>

- 같은 사람은 하루 종일 같은 운세, 사람마다 다른 운세 (GitHub 아이디 + 날짜로 결정)
- 매일 한국 시간 자정에 새 운세
- 한국어 / English, 다크 / 라이트 테마
- 설치는 코드 붙여넣기 한 번

## 사용 방법

아래 코드를 README에 붙여 넣고, `YOUR_GITHUB_ID`를 본인 GitHub 아이디로 바꾸세요. (두 군데)

```html
<details>
  <summary><img src="https://fortune-commit.vercel.app/api?user=YOUR_GITHUB_ID&state=closed" alt="눌러서 오늘의 포춘쿠키 열기"></summary>
  <img src="https://fortune-commit.vercel.app/api?user=YOUR_GITHUB_ID" alt="오늘의 운세">
</details>
```

처음에는 안 열린 쿠키만 보이고, 방문자가 누르면 쿠키가 열리며 운세가 나옵니다.

다른 테마와 언어 예시는 **[예시 갤러리](https://fortune-commit.vercel.app)** 에서 보고 바로 복사할 수 있어요.

### 누르지 않고 바로 보여주기

접기 없이 운세를 바로 보여주고 싶다면 이미지 한 줄만 쓰면 됩니다.

```md
![오늘의 운세](https://fortune-commit.vercel.app/api?user=YOUR_GITHUB_ID)
```

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
| `state` | `closed`면 안 열린 쿠키 카드 (접기의 제목용) | `closed` | 없음 (열린 위젯) |

잘못된 값을 넣어도 위젯이 깨지지 않아요. 숫자가 아니면 기본값, 범위를 벗어나면 가장 가까운 값을 씁니다.

## 이렇게 동작해요

- README에서는 JavaScript가 실행되지 않아서, 위젯은 서버(Vercel)가 그때그때 만들어 주는 **SVG 이미지**입니다.
- 쿠키가 갈라지는 움직임은 SVG 안의 **CSS 애니메이션**이고, "눌러서 열기"는 GitHub의 **접기 기능(`<details>`)** 이에요.
- 운세는 난수가 아니라 `아이디 + 날짜`의 해시로 고르기 때문에, 언제 열어도 그날은 같은 운세가 나옵니다.
- 그림 파일 없이 쿠키도 코드(픽셀 지도)로 그립니다. → [`src/cookie.js`](src/cookie.js)

## 직접 실행해 보기

Node.js 18 이상이 필요합니다.

```bash
npm run dev   # http://localhost:3000 (갤러리), http://localhost:3000/api?user=octocat (위젯)
npm test      # 자동 테스트
```

| 파일 | 하는 일 |
|---|---|
| `api/index.js` | `/api` 주소에서 위젯 SVG를 돌려줌 (Vercel 서버리스 함수) |
| `src/render.js` | 터미널 창, 쿠키, 운세, 애니메이션을 SVG로 그림 |
| `src/cookie.js` | 픽셀 쿠키 그림 (안 열린 / 열린 쿠키) |
| `src/fortunes.js` | 운세 문구 (한국어·영어 105개씩) |
| `src/lucky.js` | 행운 아이템 후보 (상태코드, 단축키, 언어, 명령어) |
| `src/pick.js` | 오늘 날짜 계산, 운세 고르기 |
| `src/options.js` | 주소 옵션 검사 |
| `public/index.html` | 예시 갤러리 페이지 |

기획 문서는 [`PRD.md`](PRD.md), 작업 계획과 변경 기록은 [`TODO.md`](TODO.md)에 있어요.
