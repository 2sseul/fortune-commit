// 픽셀(도트) 포춘쿠키 그림
// 디자인 참고: img/fortune-cookie.png (비스듬히 놓인 쿠키, 대각선 주름, 오른쪽 끝으로 삐져나온 쪽지)
//
// 아래 지도에서 글자 하나가 픽셀 하나다. 글자별 색은 src/themes.js의 cookie 색표를 따른다.
//   . = 빈칸   O = 테두리   B = 몸통   H = 빛 받는 부분   S = 그림자   P = 쪽지   L = 쪽지 글씨
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
    '.OHBBBBBBBBBBSSobbbbbbbbhooooo...',
    'OHHBBBBBBBBBBSSobbbbbbbbbhopppoo.',
    'OHHBBBBBBBBBBBSSobbbbbbbbbopllpo.',
    '.OHBBBBBBBBBBBSSobbbbbbbbboppppo.',
    '.OHBBBBBBBBBBBSSobbbbbbbbboppppo.',
    '.OSBBBBBBBBBBBSSobbbbbbbsboplllpo',
    '..OHBBBBBBBBBBBSSobbbbbbssopppppo',
    '...OBBBBBBBBBBBSSosssbbsso.oopppo',
    '...OSBBBBBBBBBBSSoooosssso...ooo.',
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

// 픽셀 지도에서 한쪽 조각만 골라 SVG 사각형들로 바꾼다.
// side: 'front'(대문자, 앞쪽 조각) 또는 'back'(소문자, 뒤쪽 날개와 쪽지)
function pixelsToRects(map, colors, pixel, side) {
  const rects = [];
  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return; // 빈칸은 그리지 않는다.
      const isBack = ch !== ch.toUpperCase();
      if ((side === 'back') !== isBack) return;
      const color = colors[ch.toUpperCase()];
      rects.push(`<rect x="${x * pixel}" y="${y * pixel}" width="${pixel}" height="${pixel}" fill="${color}"/>`);
    });
  });
  return rects.join('');
}

// 픽셀 쿠키 SVG 조각을 만든다.
// colors: 테마의 cookie 색표, pixel: 픽셀 한 칸 크기(px), x·y: 쿠키를 놓을 위치
// state: 'open'(열린 쿠키, 기본) 또는 'closed'(안 열린 쿠키)
export function renderPixelCookie({ colors, pixel, x, y, state = 'open' }) {
  const map = COOKIE_MAPS[state] ?? COOKIE_MAPS.open;
  return `
  <g class="cookie cookie-${state}" transform="translate(${x} ${y})" shape-rendering="crispEdges">
    <g class="cookie-back">${pixelsToRects(map, colors, pixel, 'back')}</g>
    <g class="cookie-front">${pixelsToRects(map, colors, pixel, 'front')}</g>
  </g>`;
}

// 쿠키 전체 크기(px)를 알려준다. 레이아웃 계산에 쓴다.
export function cookieSize(pixel) {
  return { width: COLUMNS * pixel, height: ROWS * pixel };
}
