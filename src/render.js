// 포춘쿠키 위젯 SVG를 그리는 모듈
// 모양: 터미널 창 안에서 `$ fortune` 명령을 실행하면 픽셀 쿠키와 운세가 출력되는 장면
// README에서는 JavaScript가 실행되지 않으므로, 모든 그림은 SVG 도형과 글자로만 그린다.

import { renderPixelCookie, cookieSize } from './cookie.js';

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
const WIDTH = 495;
const TITLEBAR = 30; // 타이틀바 높이
const PAD = 20; // 창 안쪽 여백
const LINE = 22; // 글자 줄 간격
const PIXEL = 5; // 픽셀 쿠키 한 칸 크기

// 터미널 창 껍데기 (배경 + 타이틀바 + 빨강·노랑·초록 버튼)
function renderWindow(t, height, title) {
  return `
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="10" fill="${t.window}" stroke="${t.border}"/>
  <path d="M10.5 0.5 H${WIDTH - 10.5} A10 10 0 0 1 ${WIDTH - 0.5} 10.5 V${TITLEBAR} H0.5 V10.5 A10 10 0 0 1 10.5 0.5 Z"
        fill="${t.titlebar}" stroke="${t.border}"/>
  <circle cx="20" cy="15" r="6" fill="#FF5F57"/>
  <circle cx="40" cy="15" r="6" fill="#FEBC2E"/>
  <circle cx="60" cy="15" r="6" fill="#28C840"/>
  <text x="${WIDTH / 2}" y="19.5" text-anchor="middle" class="mono small" fill="${t.titleText}">${escapeXml(title)}</text>`;
}

// 행운 아이템 한 줄: lucky_status = "200 OK" 처럼 코드 문법 색을 입힌다.
function renderLuckyLine(t, x, y, key, value) {
  return `<text x="${x}" y="${y}" class="mono">`
    + `<tspan fill="${t.key}">${escapeXml(key)}</tspan>`
    + `<tspan fill="${t.operator}"> = </tspan>`
    + `<tspan fill="${t.value}">"${escapeXml(value)}"</tspan>`
    + '</text>';
}

// 위젯 전체 SVG 문자열을 만든다.
// theme: getTheme()으로 얻은 테마 객체
// command: 프롬프트에 보일 명령어, fortune: 운세 문구
// lucky: { key, value } 형태의 행운 아이템 (예: { key: 'lucky_status', value: '200 OK' })
export function renderWidget({ theme: t, command, fortune, lucky }) {
  const cookie = cookieSize(PIXEL);

  // 세로 위치 계산: 타이틀바 → 명령어 줄 → 쿠키와 운세 → 마지막 프롬프트
  const commandY = TITLEBAR + PAD + 12;
  const cookieY = commandY + 14;
  const cookieX = PAD + 4;
  const textX = cookieX + cookie.width + 24; // 쿠키 오른쪽에 글자를 둔다.
  const fortuneY = cookieY + 24;
  const luckyY = fortuneY + LINE + 14;
  const lastPromptY = cookieY + cookie.height + LINE + 4;
  const height = lastPromptY + PAD;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${escapeXml(`오늘의 운세: ${fortune}`)}">
  <style>
    .mono { font-family: 'JetBrains Mono', 'D2Coding', 'SF Mono', Menlo, Consolas, 'Apple SD Gothic Neo', 'Noto Sans KR', monospace; font-size: 14px; }
    .small { font-size: 12px; }
    .bold { font-weight: 700; }
  </style>
  ${renderWindow(t, height, 'fortune-commit — zsh')}

  <!-- 명령어 줄: $ fortune ... -->
  <text x="${PAD}" y="${commandY}" class="mono">
    <tspan fill="${t.prompt}" class="bold">$</tspan><tspan fill="${t.text}"> ${escapeXml(command)}</tspan>
  </text>

  ${renderPixelCookie({ colors: t.cookie, pixel: PIXEL, x: cookieX, y: cookieY })}

  <!-- 운세 출력 -->
  <text x="${textX}" y="${fortuneY}" class="mono bold" fill="${t.fortune}">&gt; ${escapeXml(fortune)}</text>
  ${renderLuckyLine(t, textX, luckyY, lucky.key, lucky.value)}

  <!-- 다음 입력을 기다리는 프롬프트와 커서 -->
  <text x="${PAD}" y="${lastPromptY}" class="mono bold" fill="${t.prompt}">$</text>
  <rect class="cursor" x="${PAD + 16}" y="${lastPromptY - 13}" width="8" height="16" fill="${t.cursor}"/>
</svg>`;
}
