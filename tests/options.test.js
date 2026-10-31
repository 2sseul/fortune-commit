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

test('넓은 위젯: 글자 크기는 그대로, 창만 넓어지고 쿠키·글자 묶음이 가운데로 옮겨간다', async () => {
  const { renderWidget } = await import('../src/render.js');
  const { themes } = await import('../src/themes.js');
  const svg = (width) => renderWidget({ theme: themes.dark, command: 'fortune --today', fortune: '오늘 쓴 코드는 레거시가 되어도 사랑받을 거예요.', lucky: [], style: { width, radius: 10, hideBorder: false } });
  const height = (w) => Number(svg(w).match(/height="(\d+)"/)[1]);
  assert.match(svg(840), /width="840" height="\d+" viewBox="0 0 840 /); // 늘리지 않는다
  assert.equal(height(840), height(495)); // 줄바꿈도 같아서 높이가 같다
  const cookieX = (w) => Number(svg(w).match(/<g transform="translate\(([\d.]+) /)[1]);
  assert.equal(cookieX(840) - cookieX(495), Math.round((840 - 495) / 2)); // 가운데로 옮겨감
});
