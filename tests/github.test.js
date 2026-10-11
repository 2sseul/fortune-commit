// GitHub 활동(오늘 기여 수, 지난 7일 기여 수, 주 언어) 확인 테스트 (실행: npm test)
// 실제 GitHub에 요청하지 않도록 가짜 fetch를 넣어서 확인한다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchActivity, startOfToday, clearActivityMemory, mostUsedLanguage } from '../src/github.js';

// GitHub GraphQL 응답을 흉내 내는 가짜 fetch
// today: 오늘 기여 항목, lastWeek: 지난 7일 기여 항목, languages: 최근 저장소들의 주 언어
function fakeFetch(today, { ok = true, lastWeek = { totalCommitContributions: 0 }, languages = [] } = {}) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push(JSON.parse(options.body));
    const user = today
      ? {
        today,
        lastWeek,
        repositories: { nodes: languages.map((name) => ({ primaryLanguage: name ? { name } : null })) },
      }
      : null;
    return { ok, json: async () => ({ data: { user } }) };
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
  clearActivityMemory();
  const { impl, calls } = fakeFetch({
    totalCommitContributions: 2,
    totalIssueContributions: 1,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 1,
    totalRepositoryContributions: 0,
    restrictedContributionsCount: 3,
  });
  assert.equal((await fetchActivity({ ...base, fetchImpl: impl })).today, 7);
  assert.equal(calls[0].variables.todayFrom, '2026-10-10T15:00:00.000Z');
  assert.equal(calls[0].variables.now, NOW.toISOString());
  // 지난 7일은 오늘 0시 기준 7일 전부터 오늘 0시까지 (오늘은 빼서 하루 동안 바뀌지 않게)
  assert.equal(calls[0].variables.weekFrom, '2026-10-03T15:00:00.000Z');
});

test('오늘 기여가 없으면 0을 돌려준다 (잠긴 쿠키)', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch({ totalCommitContributions: 0, restrictedContributionsCount: 0 });
  assert.equal((await fetchActivity({ ...base, fetchImpl: impl })).today, 0);
});

test('토큰이나 아이디가 없으면 확인하지 않는다 (null → 운세를 그대로 보여줌)', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch({ totalCommitContributions: 5 });
  assert.equal(await fetchActivity({ ...base, token: '', fetchImpl: impl }), null);
  assert.equal(await fetchActivity({ ...base, login: '', fetchImpl: impl }), null);
  assert.equal(calls.length, 0);
});

test('없는 아이디이거나 API가 실패하면 null을 돌려준다', async () => {
  clearActivityMemory();
  assert.equal(await fetchActivity({ ...base, fetchImpl: fakeFetch(null).impl }), null);
  clearActivityMemory();
  assert.equal(await fetchActivity({ ...base, fetchImpl: fakeFetch({}, { ok: false }).impl }), null);
  clearActivityMemory();
  const broken = async () => { throw new Error('network down'); };
  assert.equal(await fetchActivity({ ...base, fetchImpl: broken }), null);
});

test('같은 사람을 다시 물어보면 기억해 둔 결과를 쓴다', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch({ totalCommitContributions: 1 });
  await fetchActivity({ ...base, fetchImpl: impl });
  await fetchActivity({ ...base, fetchImpl: impl });
  assert.equal(calls.length, 1);
});

test('기여 0개라는 결과는 1분 뒤에 다시 확인한다 (커밋하면 곧 열리도록)', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch({ totalCommitContributions: 0 });
  await fetchActivity({ ...base, fetchImpl: impl });
  const later = new Date(NOW.getTime() + 61 * 1000);
  await fetchActivity({ ...base, now: later, fetchImpl: impl });
  assert.equal(calls.length, 2);
});

test('지난 7일 기여 수와 주 언어도 함께 가져온다', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch(
    { totalCommitContributions: 1 },
    { lastWeek: { totalCommitContributions: 10, totalPullRequestContributions: 2 }, languages: ['Python', 'Go', 'Python', null] },
  );
  assert.deepEqual(await fetchActivity({ ...base, fetchImpl: impl }), { today: 1, lastWeek: 12, language: 'Python' });
});

test('주 언어: 가장 많이 나온 언어, 같으면 최근 저장소의 언어, 없으면 null', () => {
  const repos = (names) => names.map((name) => ({ primaryLanguage: name ? { name } : null }));
  assert.equal(mostUsedLanguage(repos(['Go', 'Rust', 'Rust'])), 'Rust');
  assert.equal(mostUsedLanguage(repos(['Go', 'Rust'])), 'Go');
  assert.equal(mostUsedLanguage(repos([null])), null);
  assert.equal(mostUsedLanguage(undefined), null);
});
