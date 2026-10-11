// 쿠키 스킨 테스트 (실행: npm test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { SKINS, getSkin } from '../src/skins.js';
import { renderPixelCookie } from '../src/cookie.js';
import { themes } from '../src/themes.js';

test('스킨은 기본 포함 9종이다', () => {
  assert.deepEqual(Object.keys(SKINS), ['plain', 'choco', 'matcha', 'gold', 'cat', 'dog', 'rabbit', 'pumpkin', 'snow']);
});

test('모르는 스킨 이름이면 기본 쿠키를 쓴다', () => {
  assert.equal(getSkin('unicorn').id, 'plain');
  assert.equal(getSkin(null).id, 'plain');
  assert.equal(getSkin('cat').id, 'cat');
});

test('모든 스킨이 두 테마, 열린/안 열린 쿠키에서 색이 빠진 픽셀 없이 그려진다', () => {
  for (const id of Object.keys(SKINS)) {
    for (const theme of Object.values(themes)) {
      for (const state of ['closed', 'open']) {
        const svg = renderPixelCookie({ colors: theme.cookie, pixel: 3, x: 0, y: 0, state, skin: getSkin(id) });
        assert.ok(!svg.includes('undefined'), `${id} ${state}: 색이 없는 픽셀`);
        assert.ok(svg.includes('<rect'), `${id} ${state}: 그려진 픽셀 없음`);
      }
    }
  }
});
