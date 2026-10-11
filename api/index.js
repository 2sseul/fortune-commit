// /api 주소로 요청이 오면 포춘쿠키 위젯 SVG를 돌려주는 서버리스 함수
// Vercel은 api/index.js 파일을 자동으로 /api 주소에 연결한다.

import { getTheme } from '../src/themes.js';
import { renderWidget } from '../src/render.js';

export default function handler(req, res) {
  // 주소 뒤의 옵션(?theme=dark 등)을 읽는다.
  const { searchParams } = new URL(req.url, 'http://localhost');
  const theme = getTheme(searchParams.get('theme'));

  // 1단계에서는 고정된 예시 문구를 쓴다. (2단계에서 날짜·아이디 기반으로 바뀜)
  const svg = renderWidget({
    theme,
    command: 'fortune --today',
    fortune: '오늘 푸시한 코드는 한 번에 빌드됩니다.',
    lucky: { key: 'lucky_status', value: '200 OK' },
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  // 개발 중에는 캐시하지 않는다. (하루 단위 캐시는 4-1에서 설정)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(svg);
}
