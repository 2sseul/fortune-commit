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
  assert.deepEqual(parse('width=9999&radius=-5'), { width: 1000, radius: 0, hideBorder: false });
  assert.equal(parse('width=10').width, 495); // v3: 기본 크기가 최소
  assert.equal(parse('width=full').width, 840); // v3: README 칸 끝까지
});

test('소수는 반올림한다', () => {
  assert.equal(parse('width=500.6').width, 501);
});

test('넓은 위젯은 쿠키·글자도 같이 커진다 (최대 1.4배, 남는 폭은 글줄에)', async () => {
  const { renderWidget } = await import('../src/render.js');
  const { themes } = await import('../src/themes.js');
  const svg = (width) => renderWidget({ theme: themes.dark, command: 'fortune --today', fortune: '오늘 쓴 코드는 레거시가 되어도 사랑받을 거예요.', lucky: [], style: { width, radius: 10, hideBorder: false } });
  assert.match(svg(495), /width="495" height="\d+" viewBox="0 0 495 /);
  assert.match(svg(700), /width="700" height="\d+" viewBox="0 0 500 /); // 1.4배
  assert.match(svg(840), /width="840" height="\d+" viewBox="0 0 600 /); // 1.4배, 글줄은 넓게
});
