// /api/auth/logout: 로그인 쿠키를 지우고 도감 페이지로 돌아간다. (v2.1)

import { SESSION_COOKIE, cookieHeader, isSecureRequest } from '../../src/session.js';

export default function handler(req, res) {
  res.statusCode = 302;
  res.setHeader('Set-Cookie', cookieHeader(SESSION_COOKIE, '', { maxAgeSeconds: 0, secure: isSecureRequest(req) }));
  res.setHeader('Location', '/collection.html');
  res.end();
}
