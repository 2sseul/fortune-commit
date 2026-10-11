// /api/cookie: 사이트 첫 화면의 큰 쿠키 그림 (SVG)
//   skin: 스킨 이름, mode: closed(안 열린 쿠키, 가끔 흔들림), crack(갈라지는 쿠키), still(움직이지 않음)
// 그림만 그려 주므로 해금 여부는 보지 않는다. (어떤 스킨을 보여줄지는 /api/fortune이 정한다)

import { getTheme } from '../src/themes.js';
import { getSkin } from '../src/skins.js';
import { renderCookieArt } from '../src/render.js';

export default function handler(req, res) {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const svg = renderCookieArt({
    theme: getTheme('dark'),
    skin: getSkin(searchParams.get('skin')),
    mode: ['crack', 'still'].includes(searchParams.get('mode')) ? searchParams.get('mode') : 'closed',
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 그림은 바뀌지 않으므로 하루 캐시
  res.end(svg);
}
