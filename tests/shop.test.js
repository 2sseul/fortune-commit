// 쿠키 상점 테스트: 포인트 계산, 상품 목록, 디저트 테마 (실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { wallet, findItem, catalog, SKIN_PRICES, THEME_PRICES } from '../src/shop.js';
import { SKINS } from '../src/skins.js';
import { getTheme, themes, shopThemes } from '../src/themes.js';
import { buyItem, addAttendance } from '../src/store.js';

test('포인트 = 기여 × 10 + 출석 × 30 − 쓴 포인트', () => {
  assert.deepEqual(wallet({ contributions: 120, attendance: 5, spent: 500 }), {
    fromContributions: 1200,
    fromAttendance: 150,
    earned: 1350,
    spent: 500,
    balance: 850,
  });
});

test('포인트는 음수가 되지 않는다', () => {
  assert.equal(wallet({ contributions: 1, spent: 400 }).balance, 0);
  assert.equal(wallet({}).balance, 0);
});

test('파는 스킨과 업적 전용 스킨', () => {
  assert.deepEqual(Object.keys(SKIN_PRICES).sort(), ['cat', 'choco', 'dog', 'matcha', 'rabbit']);
  for (const id of Object.keys(SKIN_PRICES)) assert.ok(SKINS[id], `${id} 스킨이 있어야 한다`);
  for (const id of ['gold', 'pumpkin', 'snowman', 'deer', 'santa', 'plain']) {
    assert.equal(findItem(`skin:${id}`), null, `${id}는 팔지 않는다`);
  }
});

test('상품 아이디로 가격을 찾는다', () => {
  assert.deepEqual(findItem('skin:cat'), { id: 'skin:cat', kind: 'skin', name: 'cat', price: 1200 });
  assert.deepEqual(findItem('theme:strawberry'), { id: 'theme:strawberry', kind: 'theme', name: 'strawberry', price: 400 });
  for (const bad of ['', 'skin:', 'theme:dark', 'skin:toString', 'hat:cat', null, undefined]) {
    assert.equal(findItem(bad), null, String(bad));
  }
});

test('상품 목록: 스킨 5 + 테마 5, 종류별로 싼 것부터', () => {
  const items = catalog();
  assert.equal(items.length, 10);
  for (const kind of ['skin', 'theme']) {
    const prices = items.filter((item) => item.kind === kind).map((item) => item.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  }
});

test('파는 테마마다 색이 다 있다', () => {
  assert.deepEqual(Object.keys(THEME_PRICES).sort(), Object.keys(shopThemes).sort());
  const colorKeys = Object.keys(themes.dark).sort();
  for (const [name, theme] of Object.entries(shopThemes)) {
    assert.deepEqual(Object.keys(theme).sort(), colorKeys, name);
  }
});

test('디저트 테마는 산 사람(또는 미리보기)만 쓸 수 있다', () => {
  assert.equal(getTheme('strawberry'), themes.dark);
  assert.equal(getTheme('strawberry', { allowShop: true }), shopThemes.strawberry);
  assert.equal(getTheme('light', { allowShop: true }), themes.light);
  assert.equal(getTheme('constructor'), themes.dark);
});

// ---------- 구매·출석 (가짜 DB) ----------
// Redis에서 쓰는 명령만 흉내 낸 가짜 DB
function fakeDb() {
  const data = new Map();
  const set = (key) => data.get(key) ?? data.set(key, new Set()).get(key);
  return {
    data,
    async sIsMember(key, value) { return set(key).has(value); },
    async sAdd(key, value) { const s = set(key); const had = s.has(value); s.add(value); return had ? 0 : 1; },
    async incrBy(key, n) { const v = (data.get(key) ?? 0) + n; data.set(key, v); return v; },
    async decrBy(key, n) { const v = (data.get(key) ?? 0) - n; data.set(key, v); return v; },
  };
}
const buy = (db, itemId, price, earned) => buyItem('2sseul', { year: '2026', itemId, price, earned }, db);

test('포인트가 있으면 사고, 쓴 포인트가 늘어난다', async () => {
  const db = fakeDb();
  assert.equal(await buy(db, 'skin:choco', 500, 1000), 'ok');
  assert.equal(db.data.get('spent:2sseul:2026'), 500);
  assert.ok(db.data.get('owned:2sseul').has('skin:choco'));
});

test('포인트가 모자라면 사지 못하고 포인트도 그대로다', async () => {
  const db = fakeDb();
  assert.equal(await buy(db, 'skin:choco', 500, 1000), 'ok');
  assert.equal(await buy(db, 'skin:matcha', 1500, 1000), 'poor');
  assert.equal(db.data.get('spent:2sseul:2026'), 500);
  assert.ok(!db.data.get('owned:2sseul').has('skin:matcha'));
});

test('이미 산 물건은 다시 사지 않는다 (동시에 두 번 눌러도 한 번만 계산)', async () => {
  const db = fakeDb();
  const results = await Promise.all([buy(db, 'theme:vanilla', 300, 1000), buy(db, 'theme:vanilla', 300, 1000)]);
  assert.deepEqual(results.sort(), ['ok', 'owned']);
  assert.equal(db.data.get('spent:2sseul:2026'), 300);
});

test('출석은 하루 한 번만 기록된다', async () => {
  const db = fakeDb();
  const day = { year: '2026', date: '2026-10-12' };
  assert.equal(await addAttendance('2sseul', day, db), 'added');
  assert.equal(await addAttendance('2sseul', day, db), 'already');
  assert.equal(await addAttendance('2sseul', { year: '2026', date: '2026-10-13' }, db), 'added');
});
