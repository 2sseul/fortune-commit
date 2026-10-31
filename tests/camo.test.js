// README 위젯 캐시 비우기 테스트 (v3.1, 실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { findWidgetCamoUrls, purgeReadmeWidgets } from '../src/camo.js';

const camo = (original) => `https://camo.githubusercontent.com/abc123/${Buffer.from(original).toString('hex')}`;
const html = `<img src="${camo('https://fortune-commit.vercel.app/api?user=2sseul')}">
<img src="${camo('https://img.shields.io/badge/Email-red')}">
<img src="${camo('https://fortune-commit.vercel.app/api?user=2sseul&theme=dark')}">
<img src="${camo('https://fortune-commit.vercel.app/api?user=2sseul')}">`;

test('프로필 HTML에서 우리 위젯 이미지의 camo 주소만 고른다 (중복 없이)', () => {
  const urls = findWidgetCamoUrls(html);
  assert.equal(urls.length, 2);
  assert.ok(urls.every((u) => Buffer.from(u.split('/').pop(), 'hex').toString().startsWith('https://fortune-commit.vercel.app/api')));
});

test('장착을 바꾸면 찾은 이미지마다 PURGE를 보낸다', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push(options.method ?? 'GET');
    return url.startsWith('https://github.com/') ? { ok: true, text: async () => html } : { ok: true };
  };
  assert.equal(await purgeReadmeWidgets('2sseul', { fetchImpl }), 2);
  assert.deepEqual(calls, ['GET', 'PURGE', 'PURGE']);
  assert.equal(await purgeReadmeWidgets('2sseul', { fetchImpl: async () => { throw new Error('offline'); } }), 0);
});
