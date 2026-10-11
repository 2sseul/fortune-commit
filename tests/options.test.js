// 모양 옵션 검사 테스트 (실행: npm test)
// 이상한 값이 들어와도 위젯이 깨지지 않는지 확인한다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStyleOptions } from '../src/options.js';

const parse = (query) => parseStyleOptions(new URLSearchParams(query));

test('옵션이 없으면 기본값을 쓴다', () => {
  assert.deepEqual(parse(''), { width: 495, radius: 10, hideBorder: false });
});

test('올바른 값은 그대로 쓴다', () => {
  assert.deepEqual(parse('width=600&radius=20&hide_border=true'), { width: 600, radius: 20, hideBorder: true });
});

test('숫자가 아닌 값은 기본값으로 바꾼다', () => {
  assert.deepEqual(parse('width=abc&radius=&hide_border=maybe'), { width: 495, radius: 10, hideBorder: false });
});

test('범위를 벗어난 값은 가장 가까운 허용값으로 맞춘다', () => {
  assert.deepEqual(parse('width=9999&radius=-5'), { width: 800, radius: 0, hideBorder: false });
  assert.equal(parse('width=10').width, 400);
});

test('소수는 반올림한다', () => {
  assert.equal(parse('width=500.6').width, 501);
});
