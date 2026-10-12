// 스킨 해금 규칙 테스트 (실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { skinStatus, progressText, UNLOCK_RULES, hasSkin, newlyEarned } from '../src/unlocks.js';
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

test('모든 스킨에 해금 규칙이 있다', () => {
  assert.deepEqual(Object.keys(UNLOCK_RULES).sort(), Object.keys(SKINS).sort());
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
