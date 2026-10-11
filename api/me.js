// /api/me: 로그인한 사람의 도감 정보와 스킨 장착 (v2.1)
//   GET  → { loggedIn, login, equipped, skins: [{ id, unlocked, current, goal, unit }] }
//   GET ?brief=1 → { loggedIn, login, equipped } (헤더용, GitHub 활동은 확인하지 않아 빠르다)
//   POST → { skin: '이름' } 을 보내면 장착한다. 해금한 스킨만 장착할 수 있다.
// 다른 사람의 설정은 바꿀 수 없다: 장착은 항상 서명된 로그인 쿠키의 아이디에만 저장한다.

import { sessionLogin } from '../src/session.js';
import { getEquippedSkin, setEquippedSkin } from '../src/store.js';
import { fetchYearActivity } from '../src/github.js';
import { todayIn } from '../src/pick.js';
import { SKINS } from '../src/skins.js';
import { skinStatus } from '../src/unlocks.js';

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store'); // 사람마다 다른 정보라 캐시하지 않는다.
  res.end(JSON.stringify(body));
}

// 요청 본문(JSON)을 읽는다. (Vercel은 미리 읽어 req.body에 넣어 주고, 로컬 서버는 직접 읽는다)
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

// 다른 사이트에서 몰래 보낸 장착 요청을 막는다: 요청을 보낸 페이지(Origin)가 우리 사이트여야 한다.
function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const login = sessionLogin(req);
  if (!login) {
    sendJson(res, req.method === 'GET' ? 200 : 401, { loggedIn: false });
    return;
  }

  // 헤더처럼 로그인 여부만 필요할 때는 GitHub 활동을 확인하지 않고 바로 돌려준다.
  if (req.method === 'GET' && new URL(req.url, 'http://localhost').searchParams.get('brief')) {
    sendJson(res, 200, { loggedIn: true, login, equipped: (await getEquippedSkin(login)) ?? null });
    return;
  }

  const year = await fetchYearActivity({ login, date: todayIn() });

  if (req.method === 'POST') {
    if (!isSameOrigin(req)) {
      sendJson(res, 403, { error: '다른 사이트에서 온 요청은 받을 수 없어요.' });
      return;
    }
    const { skin } = await readJson(req);
    if (!SKINS[skin]) {
      sendJson(res, 400, { error: '없는 스킨이에요.' });
      return;
    }
    // 해금 확인: 기본 쿠키는 언제나 가능, 나머지는 올해 활동을 확인할 수 있어야 한다.
    if (skin !== 'plain') {
      if (!year) {
        sendJson(res, 503, { error: 'GitHub 활동을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
        return;
      }
      if (!skinStatus(skin, year).unlocked) {
        sendJson(res, 403, { error: '아직 해금하지 않은 스킨이에요.' });
        return;
      }
    }
    if (!(await setEquippedSkin(login, skin))) {
      sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    sendJson(res, 200, { ok: true, equipped: skin });
    return;
  }

  // GET: 도감 정보
  const equipped = (await getEquippedSkin(login)) ?? null;
  const skins = Object.keys(SKINS).map((id) => ({ id, ...(year ? skinStatus(id, year) : { unlocked: id === 'plain' }) }));
  sendJson(res, 200, { loggedIn: true, login, equipped, activityChecked: Boolean(year), skins });
}
