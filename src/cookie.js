// 픽셀(도트) 포춘쿠키 그림
// 아래 지도에서 글자 하나가 픽셀 하나다. 글자별 색은 src/themes.js의 cookie 색표를 따른다.
//   . = 빈칸   O = 테두리   B = 몸통   H = 빛 받는 부분   S = 그림자   P = 쪽지   L = 쪽지 글씨
// 나중에 "갈라지는 애니메이션"을 넣기 쉽도록 가운데를 기준으로 왼쪽/오른쪽 조각을 나눠 그린다.

// 쿠키 모양 지도 두 가지 (두 지도는 크기가 같아야 애니메이션에서 자연스럽게 바뀐다)
//   closed = 안 열린 쿠키 (접힌 주름만 보임)
//   open   = 열린 쿠키 (가운데로 운세 쪽지가 삐져나옴)
const COOKIE_MAPS = {
  closed: [
    '......OOOOOO......',
    '....OOHHHHBBOO....',
    '...OHHBBBBBBBBO...',
    '..OHBBBBBBBBBBBO..',
    '.OHBBBBBBBBBBBBBO.',
    '.OBBBBBBSSBBBBBBO.',
    'OBBBBBBSBBSBBBBBBO',
    'OBBBBBSBBBBSBBBBBO',
    'OBBBBSSBBBBSSBBBBO',
    '.OBSSOBBBBBBOSSBO.',
    '..OOO.OSSSSO.OOO..',
    '.......OOOO.......',
    '..................',
  ],
  open: [
    '......OOOOOO......',
    '....OOHHHHBBOO....',
    '...OHHBBBBBBBBO...',
    '..OHBBBBBBBBBBBO..',
    '.OHBBBBBSSBBBBBBO.',
    '.OBBBBBSPPSBBBBBO.',
    'OBBBBBSPPPPSBBBBBO',
    'OBBBBSSPLLPSSBBBBO',
    'OBBBSSOPPPPOSSBBBO',
    '.OBSSO.PLLP.OSSBO.',
    '..OOO..PPPP..OOO..',
    '.......PLLP.......',
    '.......PPPP.......',
  ],
};

const COLUMNS = COOKIE_MAPS.open[0].length;
const ROWS = COOKIE_MAPS.open.length;
const HALF = COLUMNS / 2; // 이 열을 기준으로 왼쪽/오른쪽 조각을 나눈다.

// 픽셀 지도의 한 영역(열 범위)을 SVG 사각형들로 바꾼다.
function pixelsToRects(map, colors, pixel, fromCol, toCol) {
  const rects = [];
  map.forEach((row, y) => {
    for (let x = fromCol; x < toCol; x += 1) {
      const color = colors[row[x]];
      if (!color) continue; // '.'(빈칸)은 그리지 않는다.
      rects.push(`<rect x="${x * pixel}" y="${y * pixel}" width="${pixel}" height="${pixel}" fill="${color}"/>`);
    }
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
    <g class="cookie-left">${pixelsToRects(map, colors, pixel, 0, HALF)}</g>
    <g class="cookie-right">${pixelsToRects(map, colors, pixel, HALF, COLUMNS)}</g>
  </g>`;
}

// 쿠키 전체 크기(px)를 알려준다. 레이아웃 계산에 쓴다.
export function cookieSize(pixel) {
  return { width: COLUMNS * pixel, height: ROWS * pixel };
}
