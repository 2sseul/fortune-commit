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

test('넓은 위젯: 왼쪽 정렬 그대로, 운세는 한 줄로 길게, 620px부터 미니 쿠키가 돌아다닌다', async () => {
  const { renderWidget, renderClosedCard } = await import('../src/render.js');
  const { themes } = await import('../src/themes.js');
  const fortune = '오늘 쓴 코드는 레거시가 되어도 사랑받을 거예요.';
  const svg = (width) => renderWidget({ theme: themes.dark, command: 'fortune --today', fortune, lucky: [], style: { width, radius: 10, hideBorder: false } });
  const lines = (w) => (svg(w).match(/<tspan x="\d+" y="\d+">/g) ?? []).length;
  assert.equal(lines(495), 2); // 기본: 두 줄
  assert.equal(lines(840), 1); // 넓으면 한 줄
  const cookieX = Number(svg(495).match(/<g transform="translate\(([\d.]+) /)[1]); // 기본 너비의 큰 쿠키 위치
  assert.ok(svg(840).includes(`<g transform="translate(${cookieX} `)); // 넓어도 큰 쿠키는 왼쪽 그대로
  assert.ok(!svg(495).includes('mini-roam'));
  assert.ok(svg(700).includes('mini-roam'));
  const closed = renderClosedCard({ theme: themes.light, command: 'fortune --today', hint: '오늘 커밋하면 열려요', label: 'x', style: { width: 840, radius: 10, hideBorder: false } });
  assert.ok(closed.includes('mini-roam') && closed.includes('@keyframes mini-hop'));
});
