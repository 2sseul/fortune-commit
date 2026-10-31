// 픽셀(도트) 포춘쿠키 그림
// 디자인 참고: img/fortune-cookie.png (비스듬히 놓인 쿠키, 대각선 주름, 오른쪽 끝으로 삐져나온 쪽지)
//
// 아래 지도에서 글자 하나가 픽셀 하나다. 글자별 색은 src/themes.js의 cookie 색표를 따른다.
//   . = 빈칸   O = 테두리   B = 몸통   H = 빛 받는 부분   S = 그림자   P = 쪽지   L = 쪽지 글씨   q = 쪽지 테두리
// 대문자는 앞쪽(왼쪽) 조각, 소문자는 뒤쪽(오른쪽) 날개와 쪽지다.
// 나중에 "갈라지는 애니메이션"에서 두 조각을 따로 움직이기 위해 이렇게 나눠 둔다.

// 쿠키 모양 지도 두 가지 (두 지도는 크기가 같아야 애니메이션에서 자연스럽게 바뀐다)
//   closed = 안 열린 쿠키 (주름만 보임)
//   open   = 열린 쿠키 (오른쪽 끝으로 운세 쪽지가 삐져나옴)
import { DECOR_COLORS } from './skins.js';

const COOKIE_MAPS = {
  closed: [
    '...........OOOO..................',
    '........OOOHHSSo.................',
    '......OOHHHHHSSoo................',
    '.....OHHHHBBBSSoso...............',
    '....OHHHBBBBBSSobso..............',
    '...OHHHBBBBBBSSobbso.............',
    '..OHHHBBBBBBBSSobbbhoo...........',
    '..OHHBBBBBBBSSobbbbbhso..........',
    '.OHHBBBBBBBBSSobbbbbbbso.........',
    '.OHHBBBBBBBBBSSobbbbbbbso........',
    '.OHBBBBBBBBBBSSobbbbbbbbso.......',
    'OHHBBBBBBBBBBSSobbbbbbbbbso......',
    'OHHBBBBBBBBBBBSSobbbbbbbbso......',
    '.OHBBBBBBBBBBBSSobbbbbbbbso......',
    '.OHBBBBBBBBBBBSSobbbbbbbbso......',
    '.OSBBBBBBBBBBBSSobbbbbbbsso......',
    '..OHBBBBBBBBBBBSSobbbbbbsso......',
    '...OBBBBBBBBBBBSSosssbbsso.......',
    '...OSBBBBBBBBBBSSoooosssso.......',
    '....OSBBBBBBBBBBSO...oooo........',
    '.....OSBBBBBBBBBSO...............',
    '......OSBBBBBBBBBSO..............',
    '.......OSSBBBBBBBSO..............',
    '........OOSSBBBBSSO..............',
    '..........OOSSSSSSO..............',
    '............OOOOOO...............',
  ],
  open: [
    '...........OOOO..................',
    '........OOOHHSSo.................',
    '......OOHHHHHSSoo................',
    '.....OHHHHBBBSSoso...............',
    '....OHHHBBBBBSSobso..............',
    '...OHHHBBBBBBSSobbso.............',
    '..OHHHBBBBBBBSSobbbhoo...........',
    '..OHHBBBBBBBSSobbbbbhso..........',
    '.OHHBBBBBBBBSSobbbbbbbso.........',
    '.OHHBBBBBBBBBSSobbbbbbbso........',
    '.OHBBBBBBBBBBSSobbbbbbbbhoqqqq...',
    'OHHBBBBBBBBBBSSobbbbbbbbbhopppqq.',
    'OHHBBBBBBBBBBBSSobbbbbbbbbopllpq.',
    '.OHBBBBBBBBBBBSSobbbbbbbbboppppq.',
    '.OHBBBBBBBBBBBSSobbbbbbbbboppppq.',
    '.OSBBBBBBBBBBBSSobbbbbbbsboplllpq',
    '..OHBBBBBBBBBBBSSobbbbbbssopppppq',
    '...OBBBBBBBBBBBSSosssbbsso.qqpppq',
    '...OSBBBBBBBBBBSSoooosssso...qqq.',
    '....OSBBBBBBBBBBSO...oooo........',
    '.....OSBBBBBBBBBSO...............',
    '......OSBBBBBBBBBSO..............',
    '.......OSSBBBBBBBSO..............',
    '........OOSSBBBBSSO..............',
    '..........OOSSSSSSO..............',
    '............OOOOOO...............',
  ],
};

const COLUMNS = COOKIE_MAPS.open[0].length;
const ROWS = COOKIE_MAPS.open.length;

// 픽셀 글자가 어느 조각에 속하는지 알려준다.
//   front = 앞쪽 조각(대문자, 스킨의 귀·얼굴 포함), paper = 쪽지(p, l, q), back = 뒤쪽 날개(나머지 소문자)
function pieceOf(ch) {
  if (ch === ch.toUpperCase()) return 'front';
  return 'plq'.includes(ch) ? 'paper' : 'back';
}

// 픽셀 글자의 색을 고른다.
//   q(쪽지 테두리)는 쿠키 테두리 색, K·I 같은 꾸밈 글자는 대소문자 상관없이 DECOR_COLORS 색을 쓴다.
function colorOf(colors, ch) {
  const upper = ch.toUpperCase();
  if (DECOR_COLORS[upper]) return DECOR_COLORS[upper];
  return colors[ch === 'q' ? 'O' : upper];
}

// 열린 쿠키에서 빠져나오는 운세 쪽지 (v3 새 쿠키용). 쿠키 오른쪽 끝에 붙인다.
//   q = 쪽지 테두리(쿠키 테두리 색), p = 쪽지, l = 쪽지 글씨
const SLIP = [
  '.qqqq..',
  'qpppqq.',
  'qpllpq.',
  'qppppq.',
  'qppppq.',
  'qplllpq',
  'qpppppq',
  '.qqpppq',
  '...qqq.',
];

// 쿠키 지도를 [행, 열, 조각, 색] 목록으로 만든다.
//   예전 스킨(v2, 손으로 그린 픽셀): 기본 쿠키 지도 + 스킨의 영역 색 바꾸기 + 얹는 그림
//   새 쿠키(v3, pixelMap): 벡터에서 자동 변환한 지도 (대문자 = 앞 조각, 소문자 = 뒤 날개), 열린 쿠키는 쪽지를 붙인다
function buildPixels(state, skin, colors) {
  if (skin?.pixelMap) return buildMapPixels(state, skin.pixelMap, colors);
  const map = COOKIE_MAPS[state] ?? COOKIE_MAPS.open;
  const palette = { ...colors, ...(skin?.palette ?? {}) };
  const pixels = new Map(); // 열쇠 '행,열' → [행, 열, 글자] (같은 자리는 나중 것이 덮어쓴다)
  const put = (row, col, ch) => pixels.set(`${row},${col}`, [row, col, ch]);

  map.forEach((line, row) => [...line].forEach((ch, col) => { if (ch !== '.') put(row, col, ch); }));

  // 영역 색 바꾸기: 정한 조각·행·열 범위 안의 글자를 다른 글자로 바꾼다. (예: 산타의 아래쪽을 흰 털로)
  for (const { piece, rows, cols, to } of skin?.recolor ?? []) {
    for (const [row, col, ch] of pixels.values()) {
      const inside = row >= rows[0] && row <= rows[1] && col >= cols[0] && col <= cols[1];
      if (inside && pieceOf(ch) === piece && to[ch]) put(row, col, to[ch]);
    }
  }

  // 얹는 그림: 귀, 모자, 리본 등을 at 위치에 겹쳐 그린다.
  for (const { at: [top, left], shape } of skin?.parts ?? []) {
    shape.forEach((line, i) => [...line].forEach((ch, j) => {
      if (ch !== '.') put(top + i, left + j, ch);
    }));
  }

  // 쿠키 뒤에 까는 그림 (레트로 쿠키의 게임기 화면): 쿠키가 덮고, 갈라질 때 움직이지 않는다.
  const under = [];
  for (const { at: [top, left], shape } of skin?.under ?? []) {
    shape.forEach((line, i) => [...line].forEach((ch, j) => {
      if (ch !== '.') under.push([top + i, left + j, 'under', colors ? DECOR_COLORS[ch] : null]);
    }));
  }
  return [...under, ...[...pixels.values()].map(([row, col, ch]) => [row, col, pieceOf(ch), colors ? colorOf(palette, ch) : null])];
}

function buildMapPixels(state, { palette, map }, colors) {
  const pixels = [];
  map.forEach((line, row) => [...line].forEach((ch, col) => {
    if (ch === '.') return;
    pixels.push([row, col, ch === ch.toUpperCase() ? 'front' : 'back', palette[ch.toUpperCase()]]);
  }));
  if (state === 'open') {
    // 쪽지는 쿠키 높이의 40% 지점, 그 줄의 오른쪽 끝에서 두 칸 안쪽에 둔다. (쿠키가 쪽지를 덮어 '빠져나온' 것처럼 보인다)
    const top = Math.round(map.length * 0.4);
    const right = Math.max(...map.slice(top, top + SLIP.length).map((line) => line.replace(/\.+$/, '').length));
    SLIP.forEach((line, i) => [...line].forEach((ch, j) => {
      if (ch === '.') return;
      const color = colors ? (ch === 'q' ? colors.O : ch === 'p' ? colors.P : colors.L) : null;
      pixels.push([top + i, right - 2 + j, 'paper', color]);
    }));
  }
  return pixels;
}

// 스킨까지 얹은 쿠키가 차지하는 범위(px)를 알려준다. 레이아웃 계산에 쓴다.
//   top: 쿠키 지도 0행보다 위로 튀어나온 높이 (귀, 모자 등), height: 전체 높이
export function cookieBox(pixel, skin = null) {
  let minRow = 0;
  let maxRow = skin?.pixelMap ? 0 : COOKIE_MAPS.open.length - 1;
  let maxCol = skin?.pixelMap ? 0 : COLUMNS - 1;
  for (const state of ['open', 'closed']) {
    for (const [row, col] of buildPixels(state, skin, null)) {
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      if (skin?.pixelMap) maxCol = Math.max(maxCol, col);
    }
  }
  return { top: -minRow * pixel, width: (maxCol + 1) * pixel, height: (maxRow - minRow + 1) * pixel };
}

// 한 조각에 속한 픽셀만 SVG 사각형들로 바꾼다.
function pixelsToRects(pixels, pixel, piece) {
  return pixels
    .filter(([, , part]) => part === piece)
    .map(([row, col, , color]) => `<rect x="${col * pixel}" y="${row * pixel}" width="${pixel}" height="${pixel}" fill="${color}"/>`)
    .join('');
}

// 픽셀 쿠키 SVG 조각을 만든다.
// colors: 테마의 cookie 색표, pixel: 픽셀 한 칸 크기(px), x·y: 쿠키를 놓을 위치
// state: 'open'(열린 쿠키, 기본) 또는 'closed'(안 열린 쿠키)
// skin: src/skins.js의 스킨 (없으면 기본 쿠키). 스킨 색이 테마 색을 덮어쓴다. (쪽지 색은 테마를 따른다)
// 바깥 <g>는 위치만 잡고, 안쪽 <g>에 애니메이션을 건다.
// (CSS 애니메이션의 transform이 위치용 transform을 덮어쓰지 않게 하려고 둘로 나눈다)
export function renderPixelCookie({ colors, pixel, x, y, state = 'open', skin = null }) {
  const pixels = buildPixels(state, skin, colors);
  const piece = (name) => `<g class="cookie-${name}">${pixelsToRects(pixels, pixel, name)}</g>`;
  return `
  <g transform="translate(${x} ${y})" shape-rendering="crispEdges">
    ${skin?.under ? `<g class="cookie-under">${pixelsToRects(pixels, pixel, 'under')}</g>` : ''}
    <g class="cookie cookie-${state}">
      ${piece('paper')}
      ${piece('back')}
      ${piece('front')}
    </g>
  </g>`;
}
