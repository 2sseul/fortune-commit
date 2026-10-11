// 운세 선택 자동 테스트 (실행: npm test)
// 이 위젯의 핵심 약속 "같은 입력이면 같은 운세"가 깨지지 않았는지 확인한다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { pickFortune, todayIn, normalizeUser } from '../src/pick.js';
import { fortunes } from '../src/fortunes.js';
import { wrapText, textWidth } from '../src/wrap.js';

test('같은 아이디·날짜·언어면 항상 같은 운세가 나온다', () => {
  const input = { user: '2sseul', date: '2026-10-11', lang: 'ko' };
  const first = pickFortune(input);
  for (let i = 0; i < 20; i += 1) {
    assert.deepEqual(pickFortune(input), first);
  }
});

test('아이디는 대소문자와 앞뒤 공백을 구분하지 않는다', () => {
  assert.equal(normalizeUser('  2SSEUL '), '2sseul');
  assert.deepEqual(
    pickFortune({ user: '2SSEUL', date: '2026-10-11', lang: 'ko' }),
    pickFortune({ user: '2sseul', date: '2026-10-11', lang: 'ko' }),
  );
});

test('아이디가 다르면 운세도 대체로 달라진다', () => {
  const date = '2026-10-11';
  const results = new Set();
  for (let i = 0; i < 50; i += 1) {
    results.add(pickFortune({ user: `user${i}`, date, lang: 'ko' }).fortune);
  }
  // 50명 중 서로 다른 운세가 충분히 많아야 한다.
  assert.ok(results.size >= 30, `서로 다른 운세 수: ${results.size}`);
});

test('날짜가 바뀌면 같은 아이디라도 운세가 대체로 달라진다', () => {
  const results = new Set();
  for (let day = 1; day <= 30; day += 1) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    results.add(pickFortune({ user: '2sseul', date, lang: 'ko' }).fortune);
  }
  assert.ok(results.size >= 20, `서로 다른 운세 수: ${results.size}`);
});

test('한국어와 영어 운세 개수가 같고, 언어마다 100개 이상이다', () => {
  assert.equal(fortunes.ko.length, fortunes.en.length);
  assert.ok(fortunes.ko.length >= 100);
});

test('언어만 바꾸면 같은 뜻의 운세가 나온다', () => {
  const ko = pickFortune({ user: '2sseul', date: '2026-10-11', lang: 'ko' });
  const en = pickFortune({ user: '2sseul', date: '2026-10-11', lang: 'en' });
  assert.equal(fortunes.ko.indexOf(ko.fortune), fortunes.en.indexOf(en.fortune));
  assert.deepEqual(ko.lucky, en.lucky);
});

test('아이디가 없으면 그날의 공통 운세가 나온다', () => {
  const a = pickFortune({ user: '', date: '2026-10-11', lang: 'ko' });
  const b = pickFortune({ user: undefined, date: '2026-10-11', lang: 'ko' });
  assert.deepEqual(a, b);
});

test('행운 아이템은 서로 다른 종류로 2개가 나온다', () => {
  const { lucky } = pickFortune({ user: '2sseul', date: '2026-10-11', lang: 'ko' });
  assert.equal(lucky.length, 2);
  assert.notEqual(lucky[0].key, lucky[1].key);
});

test('하루는 한국 시간 자정에 바뀐다 (기본 시간대)', () => {
  // 한국 시간 2026-10-11 23:59 = UTC 14:59
  assert.equal(todayIn(undefined, new Date('2026-10-11T14:59:00Z')), '2026-10-11');
  // 한국 시간 2026-10-12 00:00 = UTC 15:00
  assert.equal(todayIn(undefined, new Date('2026-10-11T15:00:00Z')), '2026-10-12');
});

test('tz 옵션으로 기준 시간대를 바꿀 수 있고, 잘못된 값이면 한국 시간을 쓴다', () => {
  const now = new Date('2026-10-11T15:00:00Z');
  assert.equal(todayIn('UTC', now), '2026-10-11');
  assert.equal(todayIn('America/New_York', now), '2026-10-11');
  assert.equal(todayIn('Not/AZone', now), '2026-10-12');
});

test('모든 운세 문구가 3줄 안에 들어간다', () => {
  const maxWidth = 300; // 위젯에서 운세가 쓰는 폭과 비슷한 값
  for (const text of [...fortunes.ko, ...fortunes.en]) {
    const lines = wrapText(text, maxWidth);
    assert.ok(lines.length <= 3, `너무 긴 문구: ${text}`);
    for (const line of lines) assert.ok(textWidth(line) <= maxWidth);
  }
});
