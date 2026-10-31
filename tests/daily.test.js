// 매일 기록(연속 기록·냉동 쿠키·퀘스트)과 뽑기 테스트 (v3, 실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, weekStamps, dueBonuses, addDays } from '../src/daily.js';
import { rollCookie } from '../api/gacha.js';
import { drawCookies, exchangeCrumbs, buyFreeze, grantOnce } from '../src/store.js';
import { createMemoryDb } from '../src/memory-db.js';
import { COOKIES } from '../src/cookie-catalog.js';

// 오늘(11-10) 기준: 11-01 ~ 11-09 매일 기여, 11-05만 빠짐
const days = {};
for (let i = 1; i <= 10; i++) days[`2026-11-${String(i).padStart(2, '0')}`] = i === 5 || i === 10 ? 0 : 2;
const today = '2026-11-10';

test('오늘 커밋 전이어도 어제까지 이어진 기록은 살아 있다', () => {
  const s = computeStreak({ days, today });
  assert.equal(s.todayDone, false);
  assert.equal(s.current, 4); // 11-06 ~ 11-09
});

test('빼먹은 날보다 먼저 산 냉동 쿠키가 있으면 이어 준다', () => {
  const s = computeStreak({ days, today, todayCount: 1, freezes: ['2026-11-02'] });
  assert.equal(s.current, 10); // 오늘 + 11-01 ~ 11-09 (11-05는 냉동)
  assert.deepEqual(s.use, [['2026-11-05', '2026-11-02']]);
});

test('빼먹은 날 뒤에 산 냉동 쿠키는 쓰지 않는다', () => {
  const s = computeStreak({ days, today, freezes: ['2026-11-07'] });
  assert.equal(s.current, 4);
  assert.deepEqual(s.use, []);
});

test('이미 냉동 쿠키로 이은 날은 다시 쓰지 않고 이어진다', () => {
  const s = computeStreak({ days, today, frozen: new Set(['2026-11-05']) });
  assert.equal(s.current, 9); // 11-06~09 + 11-05(냉동) + 11-01~04
  assert.deepEqual(s.use, []);
});

test('이번 주 도장: 월~일, 오늘 표시', () => {
  const week = weekStamps({ days, today, todayDone: false });
  assert.equal(week.length, 7);
  assert.equal(week.find((d) => d.date === today).state, 'today');
  assert.equal(week[0].label, '월');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('연속 보너스는 그해에 한 번씩', () => {
  assert.deepEqual(dueBonuses(31, ['7']).map((b) => b.days), ['30']);
});

test('뽑기 확률: 등급 비율이 대략 60/28/10/2', () => {
  const count = {};
  let seed = 1;
  const rand = (n) => { seed = (seed * 16807) % 2147483647; return seed % n; };
  for (let i = 0; i < 20000; i++) { const { rarity } = rollCookie(rand); count[rarity] = (count[rarity] ?? 0) + 1; }
  assert.ok(Math.abs(count['일반'] / 20000 - 0.6) < 0.02);
  assert.ok(Math.abs(count['전설'] / 20000 - 0.02) < 0.01);
  const ids = new Set(COOKIES.filter((c) => c.category === '뽑기').map((c) => c.id));
  assert.ok(ids.has(rollCookie(rand).id));
});

test('뽑기: 중복은 부스러기, 포인트가 모자라면 실패', async () => {
  const db = createMemoryDb();
  const table = { 일반: 1, 레어: 3 };
  const pick = { id: 'gacha-lemon', rarity: '일반' };
  const first = await drawCookies('a', { year: '2026', price: 150, earned: 300, picks: [pick], crumbTable: table }, db);
  assert.equal(first.results[0].duplicate, false);
  const second = await drawCookies('a', { year: '2026', price: 150, earned: 300, picks: [pick], crumbTable: table }, db);
  assert.equal(second.results[0].crumbs, 1);
  assert.equal((await drawCookies('a', { year: '2026', price: 150, earned: 300, picks: [pick], crumbTable: table }, db)).status, 'poor');
});

test('부스러기 교환: 모자라면 그대로, 충분하면 쿠키를 받는다', async () => {
  const db = createMemoryDb();
  await db.incrBy('crumbs:a', 12);
  assert.equal(await exchangeCrumbs('a', { cookieId: 'gacha-crown', cost: 200 }, db), 'poor');
  assert.equal(await db.get('crumbs:a'), '12');
  assert.equal(await exchangeCrumbs('a', { cookieId: 'gacha-lemon', cost: 10 }, db), 'ok');
  assert.equal(await exchangeCrumbs('a', { cookieId: 'gacha-lemon', cost: 10 }, db), 'owned');
});

test('냉동 쿠키는 최대 2개, 보상은 한 번만', async () => {
  const db = createMemoryDb();
  const buy = () => buyFreeze('a', { year: '2026', date: today, price: 200, earned: 1000, max: 2 }, db);
  assert.deepEqual([await buy(), await buy(), await buy()], ['ok', 'ok', 'full']);
  assert.equal(await grantOnce('a', { year: '2026', rewardKey: 'streak:7', points: 100 }, db), true);
  assert.equal(await grantOnce('a', { year: '2026', rewardKey: 'streak:7', points: 100 }, db), false);
  assert.equal(await db.get('bonus:a:2026'), '100');
});
