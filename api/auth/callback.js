// /api/auth/callback: GitHub 로그인에서 돌아오는 곳. (v2.1)
// 1) state가 우리가 준 값과 같은지 확인 → 2) code를 GitHub 토큰으로 바꿈 → 3) 토큰으로 아이디 확인
// → 4) 아이디만 서명한 쿠키에 담고 도감 페이지로 보낸다. GitHub 토큰은 저장하지 않고 버린다.

import {
  SESSION_COOKIE, STATE_COOKIE, createSession, cookieHeader, parseCookies, isSecureRequest,
} from '../../src/session.js';

const SESSION_SECONDS = 30 * 24 * 60 * 60;

// 실패하면 도감 페이지로 돌려보내며 이유를 주소에 붙인다.
function backToCollection(res, extraHeaders = [], error = null) {
  res.statusCode = 302;
  res.setHeader('Set-Cookie', extraHeaders);
  res.setHeader('Location', error ? `/collection.html?error=${error}` : '/collection.html');
  res.end();
}

export default async function handler(req, res) {
  const secure = isSecureRequest(req);
  const clearState = cookieHeader(STATE_COOKIE, '', { maxAgeSeconds: 0, secure });
  const { searchParams } = new URL(req.url, 'http://localhost');
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const savedState = parseCookies(req.headers.cookie)[STATE_COOKIE];

  if (!code || !state || state !== savedState) {
    backToCollection(res, [clearState], 'state');
    return;
  }

  try {
    // code → GitHub 토큰
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) throw new Error('no token');

    // 토큰 → 아이디
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'fortune-commit' },
      signal: AbortSignal.timeout(5000),
    });
    const { login } = await userResponse.json();
    if (!login) throw new Error('no login');

    const session = cookieHeader(SESSION_COOKIE, createSession(login.toLowerCase()), { maxAgeSeconds: SESSION_SECONDS, secure });
    backToCollection(res, [clearState, session]);
  } catch {
    backToCollection(res, [clearState], 'login');
  }
}
