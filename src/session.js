// 로그인 상태를 담는 쿠키 (v2.1)
// 세션 DB 없이, "누가 언제까지 로그인했는지"를 쿠키에 적고 서버만 아는 비밀값(SESSION_SECRET)으로 서명한다.
// 서명이 맞지 않거나 기간이 지난 쿠키는 무시하므로, 다른 사람이 쿠키를 만들어 남의 설정을 바꿀 수 없다.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'fc_session';
export const STATE_COOKIE = 'fc_oauth_state';
export const NEXT_COOKIE = 'fc_next'; // 로그인 후 돌아갈 페이지
const SESSION_DAYS = 30;

// base64url 인코딩 (쿠키에 넣어도 안전한 글자만 쓴다)
const encode = (text) => Buffer.from(text).toString('base64url');
const decode = (text) => Buffer.from(text, 'base64url').toString();

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

// 로그인한 사람의 쿠키 값을 만든다. (내용.서명)
export function createSession(login, { secret = process.env.SESSION_SECRET, now = Date.now() } = {}) {
  const payload = encode(JSON.stringify({ login, exp: now + SESSION_DAYS * 24 * 60 * 60 * 1000 }));
  return `${payload}.${sign(payload, secret)}`;
}

// 쿠키 값을 확인해서 로그인한 아이디를 돌려준다. 잘못됐거나 기간이 지났으면 null.
export function readSession(value, { secret = process.env.SESSION_SECRET, now = Date.now() } = {}) {
  if (!value || !secret) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  // 서명 비교는 걸리는 시간으로 정답을 추측할 수 없게 timingSafeEqual을 쓴다.
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { login, exp } = JSON.parse(decode(payload));
    return typeof login === 'string' && exp > now ? login : null;
  } catch {
    return null;
  }
}

// 요청 헤더의 쿠키 문자열을 { 이름: 값 } 으로 바꾼다.
export function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > 0) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

// Set-Cookie 헤더 값을 만든다. (자바스크립트에서 읽을 수 없고, https에서만, 다른 사이트 요청에는 안 붙게)
export function cookieHeader(name, value, { maxAgeSeconds, secure = true } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join('; ');
}

// 로그인 후 돌아갈 주소는 우리 사이트 안의 경로(/로 시작, //는 안 됨)만 허용한다. (다른 사이트로 보내기 방지)
export function safeNextPath(path) {
  return typeof path === 'string' && /^\/(?!\/)[\w\-./?=&%#]*$/.test(path) ? path : '/';
}

// GitHub 로그인 중간에 쓰는 일회용 무작위 값 (다른 사이트가 로그인 과정을 끼워 넣지 못하게)
export function randomState() {
  return randomBytes(16).toString('hex');
}

// 요청에서 로그인한 아이디를 꺼낸다.
export function sessionLogin(req) {
  return readSession(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
}

// 이 요청이 https 사이트에서 온 것인지 (로컬 개발 서버는 http라 Secure 쿠키를 쓰면 안 된다)
export function isSecureRequest(req) {
  return (req.headers['x-forwarded-proto'] ?? '').includes('https') || !(req.headers.host ?? '').startsWith('localhost');
}
