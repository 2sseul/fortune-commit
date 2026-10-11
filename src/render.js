// 포춘쿠키 위젯 SVG를 그리는 모듈
// 모양: 터미널 창 안에서 `$ fortune` 명령을 실행하면 픽셀 쿠키와 운세가 출력되는 장면
// README에서는 JavaScript가 실행되지 않으므로, 모든 그림은 SVG 도형과 글자로만 그리고
// 움직임은 SVG 안의 CSS 애니메이션으로만 만든다.

import { renderPixelCookie, cookieBox } from './cookie.js';
import { wrapText, textWidth } from './wrap.js';

// SVG(XML) 안에 글자를 넣을 때 깨지지 않도록 특수문자를 바꿔 준다.
// 예: "rm -rf <폴더>" 같은 문구의 < > 가 태그로 오해받지 않게 한다.
function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 레이아웃 숫자 모음 (px)
const TITLEBAR = 30; // 타이틀바 높이
const PAD = 20; // 창 안쪽 여백
const LINE = 22; // 글자 줄 간격
const PIXEL = 3; // 픽셀 쿠키 한 칸 크기

// 애니메이션 시간표 (초)
//   0.4 ~ 1.0  안 열린 쿠키가 흔들린다
//   1.1        쿠키가 갈라진다 (안 열린 쿠키 → 열린 쿠키)
//   1.4        쪽지가 쿠키 밖으로 빠져나온다
//   1.8 ~      운세 → 행운 아이템 → 다음 프롬프트가 차례로 출력된다
const CRACK_AT = 1.1;
const TEXT_AT = 1.8;
const TEXT_STEP = 0.25; // 한 줄씩 출력되는 간격

// 위젯에 들어가는 CSS (글꼴 + 애니메이션)
const STYLE = `
    .mono { font-family: 'JetBrains Mono', 'D2Coding', 'SF Mono', Menlo, Consolas, 'Apple SD Gothic Neo', 'Noto Sans KR', monospace; font-size: 14px; }
    .small { font-size: 12px; }
    .bold { font-weight: 700; }

    /* 쿠키 조각은 자기 가운데를 기준으로 돌고 움직인다 */
    .cookie, .cookie-front, .cookie-back, .cookie-paper { transform-box: fill-box; transform-origin: center; }

    /* 1) 안 열린 쿠키: 흔들리다가 갈라지는 순간 사라진다 */
    .cookie-closed { animation: shake 0.6s ease-in-out 0.4s, vanish 0.01s linear ${CRACK_AT}s forwards; }
    @keyframes shake {
      0%, 100% { transform: rotate(0); }
      20% { transform: rotate(-8deg); }
      40% { transform: rotate(8deg); }
      60% { transform: rotate(-5deg); }
      80% { transform: rotate(5deg); }
    }
    @keyframes vanish { to { opacity: 0; } }

    /* 2) 열린 쿠키: 갈라지는 순간 나타나고, 두 조각이 튕기듯 자리를 잡는다 */
    .cookie-open { opacity: 0; animation: appear 0.01s linear ${CRACK_AT}s forwards; }
    @keyframes appear { to { opacity: 1; } }
    .cookie-open .cookie-front { animation: crack-front 0.45s cubic-bezier(0.2, 0.8, 0.3, 1.3) ${CRACK_AT}s backwards; }
    .cookie-open .cookie-back { animation: crack-back 0.45s cubic-bezier(0.2, 0.8, 0.3, 1.3) ${CRACK_AT}s backwards; }
    @keyframes crack-front { from { transform: translate(4px, 2px) rotate(6deg); } }
    @keyframes crack-back { from { transform: translate(-6px, 3px) rotate(-10deg); } }

    /* 3) 쪽지가 쿠키 안에서 오른쪽으로 빠져나온다 */
    .cookie-open .cookie-paper { animation: slide-paper 0.5s ease-out ${CRACK_AT + 0.3}s backwards; }
    @keyframes slide-paper { from { transform: translate(-14px, 2px); opacity: 0; } }

    /* 4) 글자는 한 줄씩 나타난다 (줄마다 animation-delay가 다르다) */
    .reveal { animation: reveal 0.35s ease-out backwards; }
    @keyframes reveal { from { opacity: 0; transform: translateY(4px); } }

    /* 5) 마지막 커서는 나타난 뒤 계속 깜빡인다 */
    .cursor { animation: reveal 0.35s ease-out backwards, blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }

    /* 움직임 줄이기 설정을 켠 사람에게는 애니메이션 없이 결과만 보여준다 */
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
      .cookie-closed { display: none; }
      .cookie-open { opacity: 1; }
    }`;

// 터미널 창 껍데기 (배경 + 타이틀바 + 빨강·노랑·초록 버튼)
// radius: 모서리 둥글기, hideBorder: true면 테두리 선을 그리지 않는다.
function renderWindow(t, { width, height, radius, hideBorder, title }) {
  const stroke = hideBorder ? 'none' : t.border;
  const r = Math.min(radius, TITLEBAR); // 타이틀바보다 크게 둥글면 모양이 깨지므로 제한한다.
  return `
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${r}" fill="${t.window}" stroke="${stroke}"/>
  <path d="M${r + 0.5} 0.5 H${width - r - 0.5} A${r} ${r} 0 0 1 ${width - 0.5} ${r + 0.5} V${TITLEBAR} H0.5 V${r + 0.5} A${r} ${r} 0 0 1 ${r + 0.5} 0.5 Z"
        fill="${t.titlebar}" stroke="${stroke}"/>
  <circle cx="20" cy="15" r="6" fill="#FF5F57"/>
  <circle cx="40" cy="15" r="6" fill="#FEBC2E"/>
  <circle cx="60" cy="15" r="6" fill="#28C840"/>
  <text x="${width / 2}" y="19.5" text-anchor="middle" class="mono small" fill="${t.titleText}">${escapeXml(title)}</text>`;
}

// key = "value" 모양의 코드 한 줄 (애니메이션 없음)
function renderCodeLine(t, { x, y, key, value }) {
  return `<text x="${x}" y="${y}" class="mono">`
    + `<tspan fill="${t.key}">${escapeXml(key)}</tspan>`
    + `<tspan fill="${t.operator}"> = </tspan>`
    + `<tspan fill="${t.value}">${escapeXml(value)}</tspan>`
    + '</text>';
}

// 몇 번째 줄인지에 따라 나타나는 시각을 정한다.
function revealDelay(order) {
  return `animation-delay: ${(TEXT_AT + order * TEXT_STEP).toFixed(2)}s`;
}

// 행운 아이템 한 줄: lucky_status = "200 OK" 처럼 코드 문법 색을 입힌다.
function renderLuckyLine(t, { x, y, key, value, order }) {
  return `<text x="${x}" y="${y}" class="mono reveal" style="${revealDelay(order)}">`
    + `<tspan fill="${t.key}">${escapeXml(key)}</tspan>`
    + `<tspan fill="${t.operator}"> = </tspan>`
    + `<tspan fill="${t.value}">"${escapeXml(value)}"</tspan>`
    + '</text>';
}

// 위젯 전체 SVG 문자열을 만든다.
// theme: getTheme()으로 얻은 테마 객체
// command: 프롬프트에 보일 명령어, fortune: 운세 문구, label: 화면 읽기 프로그램용 이름
// lucky: { key, value } 배열 (예: [{ key: 'lucky_status', value: '200 OK' }])
// style: { width, radius, hideBorder } 모양 옵션 (src/options.js에서 검사한 값)
// skin: 쿠키 스킨 (src/skins.js, 없으면 기본 쿠키)
export function renderWidget({
  theme: t,
  command,
  fortune,
  lucky,
  label = '오늘의 운세',
  style = { width: 495, radius: 10, hideBorder: false },
  skin = null,
}) {
  const { width } = style;
  const cookie = cookieBox(PIXEL, skin); // 스킨의 귀·모자까지 포함한 크기
  const cookieX = PAD + 4;
  const textX = cookieX + cookie.width + 18; // 쿠키 오른쪽에 글자를 둔다.

  // 운세 문구를 쿠키 오른쪽 공간에 맞게 줄바꿈한다. ('> ' 표시만큼 폭을 빼 둔다)
  const fortuneLines = wrapText(fortune, width - textX - PAD - textWidth('> '));

  // 세로 위치 계산: 타이틀바 → 명령어 줄 → [쿠키 | 운세 + 행운 아이템] → 마지막 프롬프트
  // 쿠키와 글자 묶음 중 더 높은 쪽에 맞춰 가운데 정렬한다.
  const commandY = TITLEBAR + PAD + 12;
  const contentTop = commandY + 14;
  const textBlockHeight = (fortuneLines.length + lucky.length) * LINE + 8;
  const contentHeight = Math.max(cookie.height, textBlockHeight);
  // 쿠키 지도의 0행이 놓일 위치 (위로 튀어나온 귀·모자만큼 아래로 내린다)
  const cookieY = contentTop + (contentHeight - cookie.height) / 2 + cookie.top;
  const firstLineY = contentTop + (contentHeight - textBlockHeight) / 2 + 15; // 15 = 글자 윗부분 높이
  const luckyStartY = firstLineY + fortuneLines.length * LINE + 8;
  const lastPromptY = contentTop + contentHeight + LINE + 4;
  const height = lastPromptY + PAD;

  // 첫 줄에만 '> '를 붙이고, 다음 줄은 글자 위치를 맞추려고 공백 두 칸으로 들여쓴다.
  const fortuneText = fortuneLines
    .map((line, i) => `<tspan x="${textX}" y="${firstLineY + i * LINE}">${i === 0 ? '&gt; ' : '  '}${escapeXml(line)}</tspan>`)
    .join('');
  const luckyText = lucky
    .map((item, i) => renderLuckyLine(t, { x: textX, y: luckyStartY + i * LINE, ...item, order: i + 1 }))
    .join('\n  ');
  const lastOrder = lucky.length + 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(`${label}: ${fortune}`)}">
  <style>${STYLE}
  </style>
  ${renderWindow(t, { ...style, height, title: 'fortune-commit — zsh' })}

  <!-- 명령어 줄: $ fortune ... -->
  <text x="${PAD}" y="${commandY}" class="mono">
    <tspan fill="${t.prompt}" class="bold">$</tspan><tspan fill="${t.text}"> ${escapeXml(command)}</tspan>
  </text>

  <!-- 같은 자리에 안 열린 쿠키와 열린 쿠키를 겹쳐 두고, 애니메이션으로 바꿔 보여준다 -->
  ${renderPixelCookie({ colors: t.cookie, pixel: PIXEL, x: cookieX, y: cookieY, state: 'closed', skin })}
  ${renderPixelCookie({ colors: t.cookie, pixel: PIXEL, x: cookieX, y: cookieY, state: 'open', skin })}

  <!-- 운세 출력 -->
  <text class="mono bold reveal" fill="${t.fortune}" style="${revealDelay(0)}">${fortuneText}</text>
  ${luckyText}

  <!-- 다음 입력을 기다리는 프롬프트와 커서 -->
  <text x="${PAD}" y="${lastPromptY}" class="mono bold reveal" fill="${t.prompt}" style="${revealDelay(lastOrder)}">$</text>
  <rect class="cursor" x="${PAD + 16}" y="${lastPromptY - 13}" width="8" height="16" fill="${t.cursor}" style="animation-delay: ${(TEXT_AT + lastOrder * TEXT_STEP).toFixed(2)}s, ${(TEXT_AT + lastOrder * TEXT_STEP + 0.4).toFixed(2)}s"/>
</svg>`;
}

// "커밋하고 열기"의 잠긴 화면: 안 열린 쿠키와 안내 문구를 보여준다.
// 오늘 기여를 하기 전까지는 이 화면이 보이고, 기여를 하면 열린 위젯으로 바뀐다.
// command: 프롬프트에 보일 명령어, hint: 안내 문구, label: 화면 읽기 프로그램용 이름
// detail: 안내 아래에 코드처럼 보여줄 한 줄 (예: { key: 'today_contributions', value: '0' })
export function renderClosedCard({
  theme: t,
  command,
  hint,
  label,
  detail,
  style = { width: 495, radius: 10, hideBorder: false },
  skin = null,
}) {
  const { width } = style;
  const cookie = cookieBox(PIXEL, skin); // 스킨의 귀·모자까지 포함한 크기
  const cookieX = PAD + 4;
  const textX = cookieX + cookie.width + 18;

  const commandY = TITLEBAR + PAD + 12;
  const boxTop = commandY + 14; // 쿠키(귀·모자 포함)의 맨 윗줄
  const cookieY = boxTop + cookie.top; // 쿠키 지도의 0행이 놓일 위치
  // 쿠키 가운데 높이에 안내 문구(+ 아래 한 줄)를 둔다.
  const hintY = boxTop + cookie.height / 2 + (detail ? -6 : 5);
  const height = boxTop + cookie.height + PAD;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">
  <style>
    .mono { font-family: 'JetBrains Mono', 'D2Coding', 'SF Mono', Menlo, Consolas, 'Apple SD Gothic Neo', 'Noto Sans KR', monospace; font-size: 14px; }
    .small { font-size: 12px; }
    .bold { font-weight: 700; }
    .cookie { transform-box: fill-box; transform-origin: center; }

    /* 안 열린 쿠키가 "눌러 보세요" 하듯 3초마다 살짝 흔들린다 */
    .cookie-closed { animation: nudge 3s ease-in-out 0.5s infinite; }
    @keyframes nudge {
      0%, 20%, 100% { transform: rotate(0); }
      4% { transform: rotate(-8deg); }
      8% { transform: rotate(8deg); }
      12% { transform: rotate(-5deg); }
      16% { transform: rotate(5deg); }
    }

    /* 안내 문구 뒤의 커서가 깜빡인다 (글자 안에 있는 커서라 fill-opacity로 깜빡인다) */
    .cursor { animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { fill-opacity: 0; } }

    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
    }
  </style>
  ${renderWindow(t, { ...style, height, title: 'fortune-commit — zsh' })}

  <!-- 명령어 줄: $ fortune ... -->
  <text x="${PAD}" y="${commandY}" class="mono">
    <tspan fill="${t.prompt}" class="bold">$</tspan><tspan fill="${t.text}"> ${escapeXml(command)}</tspan>
  </text>

  ${renderPixelCookie({ colors: t.cookie, pixel: PIXEL, x: cookieX, y: cookieY, state: 'closed', skin })}

  <!-- 안내 문구와 깜빡이는 커서 -->
  <!-- 커서를 문구와 같은 <text> 안에 넣어서, 글자 폭과 상관없이 항상 문구 바로 뒤에 붙게 한다 -->
  <text x="${textX}" y="${hintY}" class="mono bold" fill="${t.fortune}">&gt; ${escapeXml(hint)} <tspan class="cursor" fill="${t.cursor}">█</tspan></text>
  ${detail ? renderCodeLine(t, { x: textX, y: hintY + LINE + 4, ...detail }) : ''}
</svg>`;
}
