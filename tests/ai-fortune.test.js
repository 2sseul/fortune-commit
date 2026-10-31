// AI 점쟁이(OpenAI) 테스트 — 진짜 API 대신 가짜 응답을 넣는다 (실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeAiFortune } from '../src/ai-fortune.js';

const info = { login: '2sseul', language: 'JavaScript', lastWeek: 12, streak: 5 };
const reply = (status, body) => async () => ({ ok: status === 200, status, json: async () => body });

test('키가 없으면 운세를 쓰지 않는다', async () => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.FC_DEV;
  assert.equal(await writeAiFortune(info), null);
});

test('OpenAI가 준 문장을 따옴표를 떼고 돌려준다, 요청에는 공개 정보만', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  let sent = null;
  const fetchImpl = async (url, options) => { sent = { url, options }; return reply(200, { choices: [{ message: { content: '"오늘 PR이 한 번에 통과돼요."' } }] })(); };
  assert.equal(await writeAiFortune(info, { fetchImpl }), '오늘 PR이 한 번에 통과돼요.');
  assert.match(sent.url, /chat\/completions$/);
  assert.equal(sent.options.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(sent.options.body);
  assert.match(body.messages[1].content, /JavaScript/);
});

test('오류·거절이면 null (포인트는 buyAiFortune이 돌려준다)', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const quiet = console.error; console.error = () => {};
  assert.equal(await writeAiFortune(info, { fetchImpl: reply(401, { error: { message: 'bad key' } }) }), null);
  assert.equal(await writeAiFortune(info, { fetchImpl: reply(200, { choices: [{ message: { content: null, refusal: 'no' } }] }) }), null);
  assert.equal(await writeAiFortune(info, { fetchImpl: async () => { throw new Error('timeout'); } }), null);
  console.error = quiet;
  delete process.env.OPENAI_API_KEY;
});
