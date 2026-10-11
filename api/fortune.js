// /api/fortune: 사이트 첫 화면의 큰 쿠키가 쓰는 오늘의 운세 (JSON)
// 로그인했으면 내 운세(내 아이디·장착 스킨·잠금), 아니면 그날의 공통 운세. README 위젯과 같은 규칙이다.
//   돌려주는 값: { user, locked, fortune, lucky: [{ key, value }], skin }

import { sessionLogin } from '../src/session.js';
import { resolveWidget } from '../src/widget-data.js';

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const login = sessionLogin(req);
  const widget = await resolveWidget({ user: login, lang: searchParams.get('lang') });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store'); // 사람마다 다르므로 캐시하지 않는다.
  res.end(JSON.stringify({
    user: widget.user || null,
    locked: widget.locked,
    fortune: widget.locked ? null : widget.fortune, // 잠겨 있으면 운세는 보내지 않는다.
    lucky: widget.locked ? [] : [...widget.lucky, ...widget.progressLine],
    skin: widget.skin.id,
  }));
}
