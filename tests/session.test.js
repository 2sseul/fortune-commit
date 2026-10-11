// 로그인 쿠키와 /api/me 권한 테스트 (실행: npm test)
// "다른 사람은 내 설정을 바꿀 수 없다"는 약속을 확인한다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createSession, readSession, parseCookies, SESSION_COOKIE } from '../src/session.js';

const SECRET = 'test-secret';
process.env.SESSION_SECRET = SECRET;
delete process.env.REDIS_URL; // 테스트에서는 실제 DB에 연결하지 않는다.
delete process.env.GITHUB_TOKEN;
const { default: me } = await import('../api/me.js');

test('서명한 쿠키는 그 아이디로 읽힌다', () => {
  assert.equal(readSession(createSession('2sseul', { secret: SECRET }), { secret: SECRET }), '2sseul');
});

test('내용을 바꾼 쿠키(다른 아이디로 위조)는 무시한다', () => {
  const [, signature] = createSession('2sseul', { secret: SECRET }).split('.');
  const forged = `${Buffer.from(JSON.stringify({ login: 'octocat', exp: Date.now() + 1e9 })).toString('base64url')}.${signature}`;
  assert.equal(readSession(forged, { secret: SECRET }), null);
});

test('다른 비밀값으로 서명한 쿠키는 무시한다', () => {
  assert.equal(readSession(createSession('2sseul', { secret: 'other' }), { secret: SECRET }), null);
});

test('기간이 지난 쿠키는 무시한다', () => {
  const old = createSession('2sseul', { secret: SECRET, now: Date.now() - 31 * 24 * 60 * 60 * 1000 });
  assert.equal(readSession(old, { secret: SECRET }), null);
});

test('쿠키 문자열을 이름별로 나눈다', () => {
  assert.deepEqual(parseCookies('a=1; fc_session=x.y; b=%20'), { a: '1', fc_session: 'x.y', b: ' ' });
});

// /api/me를 흉내 내어 부르는 도우미
async function callMe({ method = 'GET', cookie = '', origin, body } = {}) {
  const req = Readable.from(body ? [JSON.stringify(body)] : []);
  req.method = method;
  req.url = '/api/me';
  req.headers = { host: 'fortune-commit.vercel.app', cookie, ...(origin ? { origin } : {}) };
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(text) { this.body = JSON.parse(text); },
  };
  await me(req, res);
  return res;
}

const myCookie = `${SESSION_COOKIE}=${createSession('2sseul', { secret: SECRET })}`;

test('로그인하지 않으면 도감 정보 대신 loggedIn: false', async () => {
  const res = await callMe();
  assert.deepEqual(res.body, { loggedIn: false });
});

test('로그인하지 않은 장착 요청은 거절한다', async () => {
  const res = await callMe({ method: 'POST', origin: 'https://fortune-commit.vercel.app', body: { skin: 'plain' } });
  assert.equal(res.statusCode, 401);
});

test('다른 사이트에서 보낸 장착 요청은 로그인 쿠키가 있어도 거절한다', async () => {
  const res = await callMe({ method: 'POST', cookie: myCookie, origin: 'https://evil.example', body: { skin: 'plain' } });
  assert.equal(res.statusCode, 403);
});

test('없는 스킨은 장착할 수 없다', async () => {
  const res = await callMe({ method: 'POST', cookie: myCookie, origin: 'https://fortune-commit.vercel.app', body: { skin: 'unicorn' } });
  assert.equal(res.statusCode, 400);
});

test('활동을 확인할 수 없으면 해금 스킨 장착을 미룬다', async () => {
  const res = await callMe({ method: 'POST', cookie: myCookie, origin: 'https://fortune-commit.vercel.app', body: { skin: 'cat' } });
  assert.equal(res.statusCode, 503);
});

test('로그인하면 내 아이디와 스킨 목록을 돌려준다', async () => {
  const res = await callMe({ cookie: myCookie });
  assert.equal(res.body.loggedIn, true);
  assert.equal(res.body.login, '2sseul');
  assert.equal(res.body.skins.length, 11);
});
