// /api/auth/login: GitHub 로그인 화면으로 보낸다. (v2.1)
// 돌아왔을 때 우리 사이트에서 시작한 로그인이 맞는지 확인하려고, 일회용 state 값을 쿠키에도 적어 둔다.

import { STATE_COOKIE, cookieHeader, randomState, isSecureRequest } from '../../src/session.js';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 503;
    res.end('로그인이 아직 설정되지 않았어요. (GITHUB_CLIENT_ID 없음)');
    return;
  }
  const state = randomState();
  const origin = `${isSecureRequest(req) ? 'https' : 'http'}://${req.headers.host}`;
  // scope를 비워 두면 공개 정보(아이디)만 받는다. 저장소나 비공개 정보에는 접근하지 않는다.
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/callback`,
    state,
    allow_signup: 'true',
  });
  res.statusCode = 302;
  res.setHeader('Set-Cookie', cookieHeader(STATE_COOKIE, state, { maxAgeSeconds: 600, secure: isSecureRequest(req) }));
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params}`);
  res.end();
}
