// "커밋하고 열기"에 쓰는 오늘 기여 수 확인 테스트 (실행: npm test)
// 실제 GitHub에 요청하지 않도록 가짜 fetch를 넣어서 확인한다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { countTodayContributions, startOfToday, clearContributionMemory } from '../src/github.js';

// GitHub GraphQL 응답을 흉내 내는 가짜 fetch
function fakeFetch(collection, { ok = true } = {}) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push(JSON.parse(options.body));
    return {
      ok,
      json: async () => ({ data: { user: collection ? { contributionsCollection: collection } : null } }),
    };
  };
  return { impl, calls };
}

const NOW = new Date('2026-10-11T12:00:00Z'); // 한국 시간 21:00
const base = { login: '2sseul', timeZone: 'Asia/Seoul', date: '2026-10-11', token: 'test-token', now: NOW };

test('한국 시간 기준 오늘 0시부터 지금까지를 물어본다', () => {
  // 한국 시간 2026-10-11 00:00 = UTC 2026-10-10 15:00
  assert.equal(startOfToday('Asia/Seoul', NOW).toISOString(), '2026-10-10T15:00:00.000Z');
});

test('기여 종류를 모두 더해서 센다', async () => {
  clearContributionMemory();
  const { impl, calls } = fakeFetch({
    totalCommitContributions: 2,
    totalIssueContributions: 1,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 1,
    totalRepositoryContributions: 0,
    restrictedContributionsCount: 3,
  });
  assert.equal(await countTodayContributions({ ...base, fetchImpl: impl }), 7);
  assert.equal(calls[0].variables.from, '2026-10-10T15:00:00.000Z');
  assert.equal(calls[0].variables.to, NOW.toISOString());
});

test('오늘 기여가 없으면 0을 돌려준다 (잠긴 쿠키)', async () => {
  clearContributionMemory();
  const { impl } = fakeFetch({ totalCommitContributions: 0, restrictedContributionsCount: 0 });
  assert.equal(await countTodayContributions({ ...base, fetchImpl: impl }), 0);
});

test('토큰이나 아이디가 없으면 확인하지 않는다 (null → 운세를 그대로 보여줌)', async () => {
  clearContributionMemory();
  const { impl, calls } = fakeFetch({ totalCommitContributions: 5 });
  assert.equal(await countTodayContributions({ ...base, token: '', fetchImpl: impl }), null);
  assert.equal(await countTodayContributions({ ...base, login: '', fetchImpl: impl }), null);
  assert.equal(calls.length, 0);
});

test('없는 아이디이거나 API가 실패하면 null을 돌려준다', async () => {
  clearContributionMemory();
  assert.equal(await countTodayContributions({ ...base, fetchImpl: fakeFetch(null).impl }), null);
  clearContributionMemory();
  assert.equal(await countTodayContributions({ ...base, fetchImpl: fakeFetch({}, { ok: false }).impl }), null);
  clearContributionMemory();
  const broken = async () => { throw new Error('network down'); };
  assert.equal(await countTodayContributions({ ...base, fetchImpl: broken }), null);
});

test('같은 사람을 다시 물어보면 기억해 둔 결과를 쓴다', async () => {
  clearContributionMemory();
  const { impl, calls } = fakeFetch({ totalCommitContributions: 1 });
  await countTodayContributions({ ...base, fetchImpl: impl });
  await countTodayContributions({ ...base, fetchImpl: impl });
  assert.equal(calls.length, 1);
});

test('기여 0개라는 결과는 1분 뒤에 다시 확인한다 (커밋하면 곧 열리도록)', async () => {
  clearContributionMemory();
  const { impl, calls } = fakeFetch({ totalCommitContributions: 0 });
  await countTodayContributions({ ...base, fetchImpl: impl });
  const later = new Date(NOW.getTime() + 61 * 1000);
  await countTodayContributions({ ...base, now: later, fetchImpl: impl });
  assert.equal(calls.length, 2);
});
