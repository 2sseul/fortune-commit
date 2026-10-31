// 스킨 해금 규칙 테스트 (실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { skinStatus, progressText, UNLOCK_RULES, hasSkin, newlyEarned, GACHA_COOKIES, withSiteStats } from '../src/unlocks.js';
import { COOKIES } from '../src/cookie-catalog.js';
import { summarizeYear, fetchYearActivity, clearYearMemory, startOfYear } from '../src/github.js';
import { SKINS } from '../src/skins.js';

// 올해 활동 예시: 기여 60, 커밋 37, PR 12, 리뷰 3, 연속 5일, 10월 15개, 12월 25일 2개
const YEAR = {
  total: 60,
  commits: 37,
  prs: 12,
  reviews: 3,
  streak: 5,
  months: { 10: 15, 12: 9 },
  days: { '2026-12-25': 2 },
};

test('쿠키 65종 모두 해금 규칙이 있거나 뽑기 쿠키다 (v3)', () => {
  const ids = COOKIES.map((cookie) => cookie.id);
  assert.equal(ids.length, 65);
  for (const id of ids) assert.ok(UNLOCK_RULES[id] || GACHA_COOKIES.includes(id), id);
  for (const id of Object.keys(SKINS)) assert.ok(UNLOCK_RULES[id], id); // 예전 스킨 11종도 그대로
});

test('뽑기 쿠키는 활동으로 열리지 않는다 (v3)', () => {
  assert.equal(skinStatus('gacha-crown', null).unlocked, false);
  assert.equal(hasSkin('gacha-crown', { year: YEAR, profile: { earned: [] } }), false);
  assert.equal(hasSkin('gacha-crown', { year: YEAR, profile: { earned: ['gacha-crown'] } }), true);
});

test('언어 쿠키는 그 언어 저장소에 올해 커밋 50개면 열리고, 여러 언어를 함께 열 수 있다 (v3)', () => {
  const year = { ...YEAR, languageCommits: { Rust: 60, Python: 50, Go: 12 } };
  assert.equal(skinStatus('crab', year).unlocked, true);
  assert.equal(skinStatus('python', year).unlocked, true);
  assert.deepEqual(skinStatus('go', year), { unlocked: false, current: 12, goal: 50, unit: 'Go commits' });
  assert.equal(skinStatus('kotlin', year).current, 0);
});

test('사이트 기록 숫자를 더한다: 빈 날, 위젯 단 날 (v3)', () => {
  const year = withSiteStats({ ...YEAR, days: { '2026-01-01': 0, '2026-01-02': 3, '2026-01-03': 0 } }, { login: 'a', date: '2026-01-03', since: '2025-01-01' });
  assert.equal(year.emptyDays, 2);
  assert.ok(year.widgetDays >= 365);
  assert.equal(skinStatus('retro', year).unlocked, true);
});

test('조건을 채운 스킨만 해금된다', () => {
  const unlocked = Object.keys(UNLOCK_RULES).filter((id) => skinStatus(id, YEAR).unlocked);
  assert.deepEqual(unlocked.sort(), ['choco', 'dog', 'plain', 'pumpkin', 'santa'].sort());
});

test('진행 상황은 지금/목표 단위로 보여준다', () => {
  assert.equal(progressText('cat', skinStatus('cat', YEAR)), 'cat 37/100 commits');
  assert.equal(progressText('gold', skinStatus('gold', YEAR)), 'gold 5/7 day streak');
  assert.equal(progressText('deer', skinStatus('deer', YEAR)), 'deer 9/30 in December');
});

test('목표보다 많이 해도 진행 상황은 목표까지만 보여준다', () => {
  assert.deepEqual(skinStatus('dog', YEAR), { unlocked: true, current: 10, goal: 10, unit: 'PRs' });
});

test('올해 활동을 확인할 수 없으면 고른 스킨을 그대로 쓴다 (위젯이 깨지지 않게)', () => {
  assert.equal(skinStatus('matcha', null).unlocked, true);
});

test('잔디 날짜로 연속 기여 일수와 월별 기여 수를 센다', () => {
  const day = (date, contributionCount) => ({ date, contributionCount });
  const year = summarizeYear({
    totalCommitContributions: 4,
    totalPullRequestContributions: 1,
    totalPullRequestReviewContributions: 0,
    contributionCalendar: {
      totalContributions: 9,
      weeks: [
        { contributionDays: [day('2026-10-01', 1), day('2026-10-02', 2), day('2026-10-03', 0)] },
        { contributionDays: [day('2026-10-04', 1), day('2026-10-05', 1), day('2026-10-06', 1), day('2026-12-25', 3)] },
      ],
    },
  });
  assert.equal(year.streak, 3);
  assert.equal(year.months[10], 6);
  assert.equal(year.months[12], 3);
  assert.equal(year.days['2026-12-25'], 3);
  assert.equal(skinStatus('santa', year).unlocked, true);
});

test('올해는 기준 시간대의 1월 1일 0시부터 센다', () => {
  const now = new Date('2026-10-11T12:00:00Z');
  assert.equal(startOfYear('Asia/Seoul', now).toISOString(), '2025-12-31T15:00:00.000Z');
  assert.equal(startOfYear('UTC', now).toISOString(), '2026-01-01T00:00:00.000Z');
});

test('올해 활동을 GitHub에서 가져오고, 실패하면 null', async () => {
  clearYearMemory();
  const ok = async () => ({
    ok: true,
    json: async () => ({ data: { user: { contributionsCollection: {
      totalCommitContributions: 2,
      totalPullRequestContributions: 0,
      totalPullRequestReviewContributions: 0,
      contributionCalendar: { totalContributions: 2, weeks: [{ contributionDays: [{ date: '2026-10-11', contributionCount: 2 }] }] },
    } } } }),
  });
  const base = { login: '2sseul', timeZone: 'Asia/Seoul', date: '2026-10-11', token: 't', now: new Date('2026-10-11T12:00:00Z') };
  assert.equal((await fetchYearActivity({ ...base, fetchImpl: ok })).total, 2);
  clearYearMemory();
  assert.equal(await fetchYearActivity({ ...base, fetchImpl: async () => ({ ok: false }) }), null);
  assert.equal(await fetchYearActivity({ ...base, token: '' }), null);
});

// ---------- 한 번 해금한 스킨은 계속 (v2.2) ----------

test('예전에 해금했거나 산 스킨은 올해 조건과 상관없이 쓸 수 있다', () => {
  const profile = { earned: ['cat'], owned: ['skin:matcha'] };
  assert.equal(hasSkin('cat', { year: YEAR, profile }), true); // 올해 커밋 37/100이지만 예전에 해금
  assert.equal(hasSkin('matcha', { year: YEAR, profile }), true); // 상점에서 삼
  assert.equal(hasSkin('rabbit', { year: YEAR, profile }), false);
  assert.equal(hasSkin('choco', { year: YEAR, profile }), true); // 올해 업적
});

test('활동을 확인하지 못하면 기록된 스킨만 쓸 수 있다', () => {
  assert.equal(hasSkin('rabbit', { year: null, profile: { earned: [] } }), false);
  assert.equal(hasSkin('cat', { year: null, profile: { earned: ['cat'] } }), true);
  assert.equal(hasSkin('plain', { year: null, profile: null }), true);
});

test('올해 새로 해금한 스킨만 기록 대상이다', () => {
  assert.deepEqual(newlyEarned({ year: YEAR, profile: { earned: ['dog'] } }).sort(), ['choco', 'pumpkin', 'santa']);
  assert.deepEqual(newlyEarned({ year: null, profile: { earned: [] } }), []);
});

test('v3 질의가 실패하면 기본 질의로 다시 물어 예전 쿠키 해금은 계산된다', async () => {
  clearYearMemory();
  const calls = [];
  const calendar = { totalContributions: 2, weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 2 }] }] };
  const fetchImpl = async (url, options) => {
    const { query, variables } = JSON.parse(options.body);
    calls.push(query.includes('history') ? 'v3' : 'basic');
    if (query.includes('history')) {
      assert.equal(typeof variables.since, 'string'); // 커밋 기록의 since는 GitTimestamp 변수로 따로 보낸다
      return { ok: true, json: async () => ({ errors: [{ message: 'boom' }] }) };
    }
    return { ok: true, json: async () => ({ data: { user: { contributionsCollection: { totalCommitContributions: 1, totalPullRequestContributions: 0, totalPullRequestReviewContributions: 0, contributionCalendar: calendar } } } }) };
  };
  const quiet = console.error; console.error = () => {};
  const year = await fetchYearActivity({ login: 'a', date: '2026-01-02', token: 't', fetchImpl, now: new Date('2026-01-02T03:00:00Z') });
  console.error = quiet;
  assert.deepEqual(calls, ['v3', 'basic']);
  assert.equal(year.total, 2);
  assert.equal(year.stars, undefined); // v3 숫자는 없음 → 새 쿠키는 0으로 계산(잠김)
});

// ---------- v3: 가입한 날부터 전체 활동 + '올해' 쿠키는 올해만 ----------
import { summarizeLifetime, pastYearRanges } from '../src/github.js';

const collection = (days, extra = {}) => ({
  totalCommitContributions: extra.commits ?? 0,
  totalPullRequestContributions: extra.prs ?? 0,
  totalPullRequestReviewContributions: 0,
  contributionCalendar: { totalContributions: days.reduce((t, [, n]) => t + n, 0), weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })) }] },
  commitContributionsByRepository: extra.repos ?? [],
});

test('여러 해를 합친다: 전체 합계, 해를 넘는 연속 기록, 시즌은 가장 많았던 한 해', () => {
  const thisYear = collection([['2026-01-01', 2], ['2026-01-02', 1], ['2026-10-05', 3]], { commits: 5, repos: [{ repository: { primaryLanguage: { name: 'Python' } }, contributions: { totalCount: 30 } }] });
  const lastYear = collection([['2025-10-01', 6], ['2025-10-02', 6], ['2025-12-30', 1], ['2025-12-31', 1]], { commits: 40, repos: [{ repository: { primaryLanguage: { name: 'Python' } }, contributions: { totalCount: 25 } }] });
  const life = summarizeLifetime([thisYear, lastYear]);
  assert.equal(life.total, 20);
  assert.equal(life.yearTotal, 6);
  assert.equal(life.commits, 45);
  assert.equal(life.thisYear.commits, 5);
  assert.equal(life.streak, 4); // 2025-12-30 ~ 2026-01-02
  assert.equal(life.months[10], 12); // 2025년 10월(12)이 2026년 10월(3)보다 많다
  assert.equal(life.languageCommits.Python, 55);
});

test("조건에 '올해'가 붙은 쿠키는 올해 숫자로, 나머지는 전체로 센다", () => {
  const year = { ...YEAR, total: 2000, commits: 500, thisYear: { total: 40, commits: 10, prs: 1, reviews: 0, streak: 2 }, languageCommits: { Go: 80 } };
  assert.equal(skinStatus('choco', year).unlocked, false); // 올해 기여 50개: 올해 40
  assert.equal(skinStatus('cat', year).current, 10); // 올해 커밋
  assert.equal(skinStatus('go', year).unlocked, true); // 언어 쿠키: 전체 커밋
});

test('가입한 해부터 작년까지 해마다 범위를 만든다', () => {
  const ranges = pastYearRanges('2024-06-15T00:00:00Z', '2025-12-31T15:00:00.000Z');
  assert.equal(ranges.length, 2);
  assert.equal(ranges[0][0], '2024-12-31T15:00:00.000Z'); // 2025년
  assert.equal(ranges[1][0], '2024-06-15T00:00:00.000Z'); // 2024년은 가입한 날부터
  assert.deepEqual(pastYearRanges(null, '2025-12-31T15:00:00.000Z'), []);
});

test('지난해들도 물어서 더한다 (실패한 해는 빼고)', async () => {
  clearYearMemory();
  const day = (date, n) => ({ date, contributionCount: n });
  const body = (days, createdAt) => ({ data: { user: { ...(createdAt ? { createdAt } : {}), contributionsCollection: {
    totalCommitContributions: 1, totalPullRequestContributions: 0, totalPullRequestReviewContributions: 0,
    contributionCalendar: { totalContributions: days.reduce((t, d) => t + d.contributionCount, 0), weeks: [{ contributionDays: days }] },
  } } } });
  const fetchImpl = async (url, options) => {
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('createdAt')) return { ok: true, json: async () => body([day('2026-03-01', 2)], '2024-05-01T00:00:00Z') };
    if (variables.from.startsWith('2024-12')) return { ok: true, json: async () => body([day('2025-03-01', 5)]) }; // 2025년
    return { ok: false }; // 2024년은 실패
  };
  const quiet = console.error; console.error = () => {};
  const year = await fetchYearActivity({ login: 'old-timer', date: '2026-03-02', token: 't', fetchImpl, now: new Date('2026-03-02T03:00:00Z') });
  console.error = quiet;
  assert.equal(year.total, 7);
  assert.equal(year.yearTotal, 2);
  assert.equal(year.years, 2);
});
