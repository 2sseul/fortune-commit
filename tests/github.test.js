// GitHub 활동(오늘 기여 수, 지난 7일 기여 수, 주 언어) 확인 테스트 (실행: npm test)
// 실제 GitHub에 요청하지 않도록 가짜 fetch를 넣어서 확인한다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchActivity, startOfToday, clearActivityMemory, mostUsedLanguage } from '../src/github.js';

// GitHub를 흉내 내는 가짜 fetch
//   events   : 공개 이벤트 목록 (오늘 활동 세기), null이면 이벤트 요청 실패
//   lastWeek : 지난 7일 기여 항목, languages: 최근 저장소들의 주 언어, user가 false면 없는 아이디
// pushedAt: 저장소들의 마지막 push 시각 목록
function fakeFetch({ events = [], lastWeek = { totalCommitContributions: 0 }, languages = [], pushedAt = [], user = true, ok = true } = {}) {
  const calls = { graphql: [], events: 0 };
  const impl = async (url, options) => {
    if (url.includes('/events/public')) {
      calls.events += 1;
      return events === null ? { ok: false } : { ok: true, json: async () => events };
    }
    calls.graphql.push(JSON.parse(options.body));
    const data = user
      ? {
        lastWeek,
        repositories: {
          nodes: [
            ...languages.map((name) => ({ primaryLanguage: name ? { name } : null, pushedAt: '2026-01-01T00:00:00Z' })),
            ...pushedAt.map((time) => ({ primaryLanguage: null, pushedAt: time })),
          ],
        },
      }
      : null;
    return { ok, json: async () => ({ data: { user: data } }) };
  };
  return { impl, calls };
}

// 이벤트 하나 만들기 (created_at은 UTC 시각)
const event = (type, createdAt, payload = {}) => ({ type, created_at: createdAt, payload });

const NOW = new Date('2026-10-11T12:00:00Z'); // 한국 시간 21:00
const base = { login: '2sseul', timeZone: 'Asia/Seoul', date: '2026-10-11', token: 'test-token', now: NOW };

test('한국 시간 기준 오늘 0시를 구한다', () => {
  // 한국 시간 2026-10-11 00:00 = UTC 2026-10-10 15:00
  assert.equal(startOfToday('Asia/Seoul', NOW).toISOString(), '2026-10-10T15:00:00.000Z');
});

test('오늘 활동은 한국 0시 이후의 이벤트만 센다 (어제 저녁 커밋은 빼고)', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch({
    events: [
      event('PushEvent', '2026-10-11T03:00:00Z', { size: 2 }), // 오늘 낮 12시 push 커밋 2개
      event('PullRequestEvent', '2026-10-11T04:00:00Z', { action: 'opened' }), // 오늘 PR
      event('PullRequestEvent', '2026-10-11T05:00:00Z', { action: 'closed' }), // 닫기는 세지 않음
      event('WatchEvent', '2026-10-11T06:00:00Z'), // 별 누르기는 세지 않음
      event('PushEvent', '2026-10-10T14:59:00Z', { size: 5 }), // 어제 23:59 (한국) → 세지 않음
    ],
  });
  assert.equal((await fetchActivity({ ...base, fetchImpl: impl })).today, 3);
});

test('한국 0시가 지나면, 어제 저녁에 커밋했어도 오늘 활동은 0 (잠긴 쿠키)', async () => {
  clearActivityMemory();
  const justAfterMidnight = new Date('2026-10-11T15:00:30Z'); // 한국 시간 10/12 00:00:30
  const { impl } = fakeFetch({ events: [event('PushEvent', '2026-10-11T14:59:54Z', { size: 1 })] });
  const activity = await fetchActivity({ ...base, date: '2026-10-12', now: justAfterMidnight, fetchImpl: impl });
  assert.equal(activity.today, 0);
});

test('지난 7일은 오늘 0시 기준 7일 전부터 오늘 0시까지 물어본다', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch();
  await fetchActivity({ ...base, fetchImpl: impl });
  assert.equal(calls.graphql[0].variables.todayFrom, '2026-10-10T15:00:00.000Z');
  assert.equal(calls.graphql[0].variables.weekFrom, '2026-10-03T15:00:00.000Z');
});

test('토큰이나 아이디가 없으면 확인하지 않는다 (null → 운세를 그대로 보여줌)', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch();
  assert.equal(await fetchActivity({ ...base, token: '', fetchImpl: impl }), null);
  assert.equal(await fetchActivity({ ...base, login: '', fetchImpl: impl }), null);
  assert.equal(calls.graphql.length + calls.events, 0);
});

test('없는 아이디이거나 API가 실패하면 null을 돌려준다', async () => {
  clearActivityMemory();
  assert.equal(await fetchActivity({ ...base, fetchImpl: fakeFetch({ user: false }).impl }), null);
  clearActivityMemory();
  assert.equal(await fetchActivity({ ...base, fetchImpl: fakeFetch({ ok: false }).impl }), null);
  clearActivityMemory();
  const broken = async () => { throw new Error('network down'); };
  assert.equal(await fetchActivity({ ...base, fetchImpl: broken }), null);
});

test('이벤트만 실패하면 오늘 활동은 null (잠그지 않음), 나머지는 그대로', async () => {
  clearActivityMemory();
  const activity = await fetchActivity({ ...base, fetchImpl: fakeFetch({ events: null, lastWeek: { totalCommitContributions: 4 } }).impl });
  assert.equal(activity.today, null);
  assert.equal(activity.lastWeek, 4);
});

test('같은 사람을 다시 물어보면 기억해 둔 결과를 쓴다', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch({ events: [event('PushEvent', '2026-10-11T03:00:00Z', { size: 1 })] });
  await fetchActivity({ ...base, fetchImpl: impl });
  await fetchActivity({ ...base, fetchImpl: impl });
  assert.equal(calls.graphql.length, 1);
});

test('오늘 활동 0이라는 결과는 1분 뒤에 다시 확인한다 (커밋하면 곧 열리도록)', async () => {
  clearActivityMemory();
  const { impl, calls } = fakeFetch();
  await fetchActivity({ ...base, fetchImpl: impl });
  const later = new Date(NOW.getTime() + 61 * 1000);
  await fetchActivity({ ...base, now: later, fetchImpl: impl });
  assert.equal(calls.graphql.length, 2);
});

test('지난 7일 기여 수와 주 언어도 함께 가져온다', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch({
    events: [event('PushEvent', '2026-10-11T03:00:00Z', { size: 1 })],
    lastWeek: { totalCommitContributions: 10, totalPullRequestContributions: 2 },
    languages: ['Python', 'Go', 'Python', null],
  });
  assert.deepEqual(await fetchActivity({ ...base, fetchImpl: impl }), { today: 1, lastWeek: 12, language: 'Python' });
});

test('주 언어: 가장 많이 나온 언어, 같으면 최근 저장소의 언어, 없으면 null', () => {
  const repos = (names) => names.map((name) => ({ primaryLanguage: name ? { name } : null }));
  assert.equal(mostUsedLanguage(repos(['Go', 'Rust', 'Rust'])), 'Rust');
  assert.equal(mostUsedLanguage(repos(['Go', 'Rust'])), 'Go');
  assert.equal(mostUsedLanguage(repos([null])), null);
  assert.equal(mostUsedLanguage(undefined), null);
});

test('이벤트가 아직 안 올라와도, 내 저장소에 오늘 push했으면 열린다', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch({ events: [], pushedAt: ['2026-10-11T05:00:00Z'] }); // 한국 오늘 14시 push
  assert.equal((await fetchActivity({ ...base, fetchImpl: impl })).today, 1);
});

test('마지막 push가 어제(한국 시간)면 오늘 활동으로 치지 않는다', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch({ events: [], pushedAt: ['2026-10-10T14:59:00Z'] }); // 한국 어제 23:59
  assert.equal((await fetchActivity({ ...base, fetchImpl: impl })).today, 0);
});

test('이벤트 확인이 실패해도 오늘 push가 있으면 열린다', async () => {
  clearActivityMemory();
  const { impl } = fakeFetch({ events: null, pushedAt: ['2026-10-11T05:00:00Z'] });
  assert.equal((await fetchActivity({ ...base, fetchImpl: impl })).today, 1);
});
