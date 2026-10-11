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
//   front = 앞쪽 조각(대문자), paper = 쪽지(p, l, q), back = 뒤쪽 날개(나머지 소문자)
function pieceOf(ch) {
  if (ch === ch.toUpperCase()) return 'front';
  return 'plq'.includes(ch) ? 'paper' : 'back';
}

// 픽셀 글자의 색을 고른다. q(쪽지 테두리)는 쿠키 테두리와 같은 색을 쓴다.
function colorOf(colors, ch) {
  return colors[ch === 'q' ? 'O' : ch.toUpperCase()];
}

// 픽셀 지도에서 한 조각만 골라 SVG 사각형들로 바꾼다.
function pixelsToRects(map, colors, pixel, piece) {
  const rects = [];
  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || pieceOf(ch) !== piece) return; // 빈칸과 다른 조각은 건너뛴다.
      const color = colorOf(colors, ch);
      rects.push(`<rect x="${x * pixel}" y="${y * pixel}" width="${pixel}" height="${pixel}" fill="${color}"/>`);
    });
  });
  return rects.join('');
}

// 픽셀 쿠키 SVG 조각을 만든다.
// colors: 테마의 cookie 색표, pixel: 픽셀 한 칸 크기(px), x·y: 쿠키를 놓을 위치
// state: 'open'(열린 쿠키, 기본) 또는 'closed'(안 열린 쿠키)
// 바깥 <g>는 위치만 잡고, 안쪽 <g>에 애니메이션을 건다.
// (CSS 애니메이션의 transform이 위치용 transform을 덮어쓰지 않게 하려고 둘로 나눈다)
export function renderPixelCookie({ colors, pixel, x, y, state = 'open' }) {
  const map = COOKIE_MAPS[state] ?? COOKIE_MAPS.open;
  const piece = (name) => `<g class="cookie-${name}">${pixelsToRects(map, colors, pixel, name)}</g>`;
  return `
  <g transform="translate(${x} ${y})" shape-rendering="crispEdges">
    <g class="cookie cookie-${state}">
      ${piece('paper')}
      ${piece('back')}
      ${piece('front')}
    </g>
  </g>`;
}

// 쿠키 전체 크기(px)를 알려준다. 레이아웃 계산에 쓴다.
export function cookieSize(pixel) {
  return { width: COLUMNS * pixel, height: ROWS * pixel };
}
