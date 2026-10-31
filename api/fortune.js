// /api/fortune: 사이트 첫 화면의 큰 쿠키가 쓰는 오늘의 운세 (JSON)
// 로그인했으면 내 운세(내 아이디·장착 스킨·잠금), 아니면 그날의 공통 운세. README 위젯과 같은 규칙이다.
//   돌려주는 값: { user, locked, fortune, lucky: [{ key, value }], skin, grade: { id, label }, ai, date }

import { sessionLogin } from '../src/session.js';
import { resolveWidget } from '../src/widget-data.js';
import { saveDiary } from '../src/store.js';
import { GRADES } from '../src/pick.js';

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, 'http://localhost');
  const login = sessionLogin(req);
  const widget = await resolveWidget({ user: login, lang: searchParams.get('lang') });

  // 운세 일기: 로그인한 사람이 열린 쿠키를 보면 그날의 운세를 남긴다. (v3.2)
  if (login && !widget.locked) await saveDiary(widget.user, { date: widget.date, entry: { fortune: widget.fortune, grade: widget.grade, ai: widget.ai } });
  const grade = GRADES.find(([id]) => id === widget.grade);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store'); // 사람마다 다르므로 캐시하지 않는다.
  res.end(JSON.stringify({
    user: widget.user || null,
    locked: widget.locked,
    fortune: widget.locked ? null : widget.fortune, // 잠겨 있으면 운세는 보내지 않는다.
    lucky: widget.locked ? [] : [...widget.lucky, ...widget.progressLine],
    skin: widget.skin.id,
    grade: widget.locked ? null : { id: grade[0], label: grade[1] },
    ai: widget.locked ? false : widget.ai,
    date: widget.date,
  }));
}
